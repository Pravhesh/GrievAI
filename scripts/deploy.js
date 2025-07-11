// Deploy ComplaintRegistry to a specified network
const { ethers } = require("hardhat");

async function main() {
  const Registry = await ethers.getContractFactory("ComplaintRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  console.log("ComplaintRegistry deployed to:", registry.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
