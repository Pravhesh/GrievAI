const { ethers } = require("hardhat");

async function main() {
  // This will compile the contract if it's not already compiled
  const RegistryFactory = await ethers.getContractFactory("ComplaintRegistry");
  const abi = RegistryFactory.interface.formatJson();
  console.log(abi);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
