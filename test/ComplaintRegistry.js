const { expect } = require("chai");

describe("ComplaintRegistry", function () {
  let registry;
  let deployer, user;

  beforeEach(async function () {
    [deployer, user] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("ComplaintRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();
  });

  it("submits a complaint and increments count", async function () {
    await expect(registry.connect(user).submitComplaint("Water leakage"))
      .to.emit(registry, "ComplaintSubmitted")
      .withArgs(1, user.address, "Water leakage");

    expect(await registry.complaintCount()).to.equal(1);
  });

  it("resolves a complaint", async function () {
    await registry.connect(user).submitComplaint("Road issue");
    await registry.resolveComplaint(1);
    const complaint = await registry.complaints(1);
    expect(complaint.status).to.equal(1); // Resolved enum value
  });

  it("escalates a complaint", async function () {
    await registry.connect(user).submitComplaint("Electricity outage");
    await registry.escalateComplaint(1);
    const complaint = await registry.complaints(1);
    expect(complaint.status).to.equal(2); // Escalated enum value
  });
});
