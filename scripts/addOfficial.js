// scripts/addOfficial.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);
  
  const contractAddress = "0x082303D0067314D6E85375E25C6a57aa13EE06e6"; // Update with your contract address
  const ComplaintRegistry = await hre.ethers.getContractFactory("ComplaintRegistry");
  const contract = await ComplaintRegistry.attach(contractAddress);
  
  // Replace with the address you want to make an official
  const newOfficial = "0xYOUR_ADDRESS_HERE";
  
  console.log(`Adding ${newOfficial} as an official...`);
  const tx = await contract.addOfficial(newOfficial);
  await tx.wait();
  console.log("Transaction hash:", tx.hash);
  
  // Verify the address is now an official
  const isOfficial = await contract.officials(newOfficial);
  console.log(`Is ${newOfficial} now an official?`, isOfficial);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
