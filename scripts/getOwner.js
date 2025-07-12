// scripts/getOwner.js
const hre = require("hardhat");

async function main() {
  const contractAddress = "0x082303D0067314D6E85375E25C6a57aa13EE06e6";
  const ComplaintRegistry = await hre.ethers.getContractFactory("ComplaintRegistry");
  const contract = await ComplaintRegistry.attach(contractAddress);
  
  // Get the owner
  const owner = await contract.owner();
  console.log("Contract owner:", owner);
  
  // Check if the user's address is an official
  const yourAddress = "0x2e8AeAa97e854ddaD2d9610EBEEbdaF3A98F4Ab9";
  const isOfficial = await contract.officials(yourAddress);
  console.log(`Is ${yourAddress} an official?`, isOfficial);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
