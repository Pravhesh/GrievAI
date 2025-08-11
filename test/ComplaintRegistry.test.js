const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ComplaintRegistry – edge-case coverage", function () {
  let Registry, registry, owner, official1, official2, user1, user2;

  beforeEach(async function () {
    [owner, official1, official2, user1, user2] = await ethers.getSigners();
    Registry = await ethers.getContractFactory("ComplaintRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();

    // add an extra official for multi-vote tests
    await registry.connect(owner).addOfficial(official1.address);
  });

  describe("Access Control", function () {
    it("owner can add and remove officials", async function () {
      await registry.connect(owner).addOfficial(official2.address);
      expect(await registry.officials(official2.address)).to.be.true;
      await registry.connect(owner).removeOfficial(official2.address);
      expect(await registry.officials(official2.address)).to.be.false;
    });

    it("non-owner cannot add or remove officials", async function () {
      await expect(
        registry.connect(user1).addOfficial(user2.address)
      ).to.be.revertedWith("Not owner");
      await expect(
        registry.connect(user1).removeOfficial(official1.address)
      ).to.be.revertedWith("Not owner");
    });

    it("removed official cannot perform actions", async function () {
      await registry.connect(owner).addOfficial(official2.address);
      await registry.connect(owner).removeOfficial(official2.address);

      await registry.connect(user1).submitComplaint("Test", 0);
      await expect(
        registry.connect(official2).resolveComplaint(1)
      ).to.be.revertedWith("Not authorized");
    });

    it("does not error when re-adding or re-removing officials", async function () {
      await registry.connect(owner).addOfficial(official2.address);
      await expect(
        registry.connect(owner).addOfficial(official2.address)
      ).to.not.be.reverted;

      await registry.connect(owner).removeOfficial(official2.address);
      await expect(
        registry.connect(owner).removeOfficial(official2.address)
      ).to.not.be.reverted;
    });
  });

  describe("submitComplaint", () => {
    it("emits event, increments count, and stores data", async () => {
      await expect(registry.connect(user1).submitComplaint("Road pothole", 1)) // 1 = Road
        .to.emit(registry, "ComplaintSubmitted")
        .withArgs(1, user1.address, "Road pothole", 1);

      const count = await registry.complaintCount();
      expect(count).to.equal(1);
      const c = await registry.getComplaint(1);
      expect(c.description).to.equal("Road pothole");
      expect(c.category).to.equal(1);
      expect(c.status).to.equal(0); // Submitted
    });

    it("allows submitting a complaint with an empty description", async () => {
      await expect(registry.connect(user1).submitComplaint("", 1))
        .to.emit(registry, "ComplaintSubmitted")
        .withArgs(1, user1.address, "", 1);
      const c = await registry.getComplaint(1);
      expect(c.description).to.equal("");
    });

    it("allows submitting a complaint with a very long description", async () => {
      const longDescription = "a".repeat(1000);
      await expect(registry.connect(user1).submitComplaint(longDescription, 2))
        .to.emit(registry, "ComplaintSubmitted")
        .withArgs(1, user1.address, longDescription, 2);
      const c = await registry.getComplaint(1);
      expect(c.description).to.equal(longDescription);
    });

    it("reverts on out-of-bounds category enum", async () => {
      const invalidCategory = 99;
      // Ethers.js or Hardhat will likely revert this client-side before it even hits the contract.
      await expect(
        registry
          .connect(user1)
          .submitComplaint("Test invalid category", invalidCategory)
      ).to.be.reverted;
    });
  });

  describe("direct resolve / escalate", () => {
    beforeEach(async () => {
      await registry.connect(user1).submitComplaint("Trash issue", 3); // Sanitation
    });

    it("reverts if non-official tries to resolve", async () => {
      await expect(
        registry.connect(user1).resolveComplaint(1)
      ).to.be.revertedWith("Not authorized");
    });

    it("official can resolve once", async () => {
      await registry.connect(official1).resolveComplaint(1);
      const c = await registry.getComplaint(1);
      expect(c.status).to.equal(1); // Resolved
      // second resolve should fail
      await expect(
        registry.connect(official1).resolveComplaint(1)
      ).to.be.revertedWith("Already processed");
    });

    it("official can escalate once", async () => {
      // fresh complaint
      await registry.connect(user2).submitComplaint("Water leak", 0);
      await registry.connect(official1).escalateComplaint(2);
      const c = await registry.getComplaint(2);
      expect(c.status).to.equal(2); // Escalated
      await expect(
        registry.connect(official1).escalateComplaint(2)
      ).to.be.revertedWith("Cannot escalate");
    });
  });

  describe("DAO flow", () => {
    beforeEach(async () => {
      await registry.connect(user1).submitComplaint("Power outage", 2);
    });

    it("only officials can propose", async () => {
      await expect(
        registry.connect(user1).proposeAction(1, false)
      ).to.be.revertedWith("Not authorized");
    });

    it("proposal lifecycle (vote + execute)", async () => {
      // propose to resolve complaint 1
      await registry.connect(official1).proposeAction(1, false);
      const proposalId = 1;

      // official1 votes for, owner votes for, user cannot vote
      await registry.connect(official1).castVote(proposalId, true);

      // mine one block so owner sees same voting period (optional)
      await ethers.provider.send("evm_mine", []);

      await registry.connect(owner).castVote(proposalId, true);
      await expect(
        registry.connect(user1).castVote(proposalId, true)
      ).to.be.revertedWith("Not authorized");

      // double voting should fail
      await expect(
        registry.connect(official1).castVote(proposalId, true)
      ).to.be.revertedWith("Already voted");

      // fast-forward past votingPeriod
      const blocksToMine = (await registry.votingPeriod()) + 1n;
      for (let i = 0; i < Number(blocksToMine); i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // execute
      await registry.connect(official1).executeProposal(proposalId);
      const c = await registry.getComplaint(1);
      expect(c.status).to.equal(1); // Resolved
    });

    it("executeProposal fails if votes against > for", async () => {
      await registry.connect(official1).proposeAction(1, true); // escalate
      const proposalId = 1;
      await ethers.provider.send("evm_mine", []); // voting start
      await registry.connect(official1).castVote(proposalId, false); // against
      await registry.connect(owner).castVote(proposalId, false);
      // move blocks
      const blocksToMine = (await registry.votingPeriod()) + 1n;
      for (let i = 0; i < Number(blocksToMine); i++) {
        await ethers.provider.send("evm_mine", []);
      }
      await expect(
        registry.connect(owner).executeProposal(proposalId)
      ).to.be.revertedWith("Proposal failed");
    });

    it("reverts when creating a proposal for an already processed complaint", async () => {
      // Resolve complaint 1 directly
      await registry.connect(official1).resolveComplaint(1);
      await expect(
        registry.connect(official1).proposeAction(1, false)
      ).to.be.revertedWith("Invalid status");

      // Create and escalate another complaint
      await registry.connect(user1).submitComplaint("Another one", 0); // id 2
      await registry.connect(official1).escalateComplaint(2);
      await expect(
        registry.connect(official1).proposeAction(2, false)
      ).to.be.revertedWith("Invalid status");
    });

    it("allows creating a proposal for a non-existent complaint (potential vulnerability)", async () => {
      const nonExistentComplaintId = 999;
      // The check `complaints[complaintId].status == Status.Submitted` passes for non-existent
      // complaints because the default value for the status enum is 0 (Submitted).
      await expect(
        registry.connect(official1).proposeAction(nonExistentComplaintId, false)
      ).to.not.be.reverted;

      const proposalId = await registry.proposalCount();
      const proposal = await registry.proposals(proposalId);
      expect(proposal.complaintId).to.equal(nonExistentComplaintId);
    });

    it("reverts when voting after the voting period has ended", async () => {
      await registry.connect(official1).proposeAction(1, false);
      const proposalId = 1;

      // Move past the voting delay to start the voting period
      await ethers.provider.send("evm_mine", []);

      // Cast a valid vote within the period
      await registry.connect(official1).castVote(proposalId, true);

      // Move time to after voting period
      const blocksToMine = (await registry.votingPeriod()) + 1n;
      for (let i = 0; i < Number(blocksToMine); i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Try to vote after voting has ended
      await expect(
        registry.connect(owner).castVote(proposalId, true)
      ).to.be.revertedWith("Voting ended");
    });

    it("reverts when executing a proposal that is still in its voting period", async () => {
      await registry.connect(official1).proposeAction(1, false);
      const proposalId = 1;
      await ethers.provider.send("evm_mine", []); // start voting
      await registry.connect(official1).castVote(proposalId, true);
      await registry.connect(owner).castVote(proposalId, true);

      await expect(
        registry.connect(owner).executeProposal(proposalId)
      ).to.be.revertedWith("Voting in progress");
    });

    it("fails to execute a proposal with a tie vote", async () => {
      await registry.connect(owner).addOfficial(official2.address);
      await registry.connect(official1).proposeAction(1, false); // official1 proposes
      const proposalId = 1;

      await ethers.provider.send("evm_mine", []); // start voting

      await registry.connect(official1).castVote(proposalId, true); // official1 votes For
      await registry.connect(official2).castVote(proposalId, false); // official2 votes Against

      // The votes are 1 For, 1 Against. Tie.

      // Fast-forward past votingPeriod
      const blocksToMine = (await registry.votingPeriod()) + 1n;
      for (let i = 0; i < Number(blocksToMine); i++) {
        await ethers.provider.send("evm_mine", []);
      }

      await expect(
        registry.connect(owner).executeProposal(proposalId)
      ).to.be.revertedWith("Proposal failed");
    });

    it("allows proposal execution even if complaint was resolved directly (race condition)", async () => {
      await registry.connect(official1).proposeAction(1, false); // Propose to resolve
      const proposalId = 1;

      // While proposal is active, another official resolves it directly
      await registry.connect(owner).resolveComplaint(1);
      let c = await registry.getComplaint(1);
      expect(c.status).to.equal(1); // Resolved

      // Now, the proposal gets enough votes
      await ethers.provider.send("evm_mine", []); // start voting
      await registry.connect(official1).castVote(proposalId, true);
      // owner already resolved, but can still vote.
      await registry.connect(owner).castVote(proposalId, true);

      // Fast-forward past votingPeriod
      const blocksToMine = (await registry.votingPeriod()) + 1n;
      for (let i = 0; i < Number(blocksToMine); i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // The execution should still succeed, even though it's redundant
      await expect(registry.connect(owner).executeProposal(proposalId)).to.not
        .be.reverted;

      c = await registry.getComplaint(1);
      expect(c.status).to.equal(1); // Still resolved
    });
  });

  describe("edge getters", () => {
    it("getComplaint for non-existent id returns default struct", async () => {
      const c = await registry.getComplaint(9999);
      expect(c.timestamp).to.equal(0);
      expect(c.complainant).to.equal(ethers.ZeroAddress);
    });
  });
});
