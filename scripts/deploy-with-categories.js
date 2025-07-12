const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy the contract
  const ComplaintRegistry = await hre.ethers.getContractFactory("ComplaintRegistry");
  const complaintRegistry = await ComplaintRegistry.deploy();

  await complaintRegistry.waitForDeployment();
  
  const contractAddress = await complaintRegistry.getAddress();
  console.log("ComplaintRegistry deployed to:", contractAddress);
  
  // Add the deployer as an official
  console.log("Adding deployer as an official...");
  const tx = await complaintRegistry.addOfficial(deployer.address);
  await tx.wait();
  
  console.log("Deployer has been added as an official");
  
  // Save the contract address to a file
  const fs = require('fs');
  fs.writeFileSync('deployed_address.txt', contractAddress);
  
  console.log("Contract address saved to deployed_address.txt");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
