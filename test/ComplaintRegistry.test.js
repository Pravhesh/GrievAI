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

  describe("submitComplaint", () => {
    it("increments complaintCount and stores data", async () => {
      await registry
        .connect(user1)
        .submitComplaint("Road pothole", 1); // 1 = Road
      const count = await registry.complaintCount();
      expect(count).to.equal(1);
      const c = await registry.getComplaint(1);
      expect(c.description).to.equal("Road pothole");
      expect(c.category).to.equal(1);
      expect(c.status).to.equal(0); // Submitted
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
  });

  describe("edge getters", () => {
    it("getComplaint for non-existent id returns default struct", async () => {
      const c = await registry.getComplaint(9999);
      expect(c.timestamp).to.equal(0);
      expect(c.complainant).to.equal(ethers.ZeroAddress);
    });
  });
});
