#!/usr/bin/env node
/**
 * Auto-escalate unresolved complaints after a grace period.
 *
 * Environment variables required:
 *  - RPC_URL (default http://localhost:8545)
 *  - PRIVATE_KEY (official / keeper account)
 *  - CONTRACT_ADDRESS
 *  - GRACE_PERIOD_SEC (e.g. 3 days = 259200)
 */
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const abi = require(path.join(__dirname, "../frontend/src/contracts/ComplaintRegistry.json")).abi;

async function main() {
  const RPC_URL = process.env.RPC_URL || "http://localhost:8545";
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || process.env.REGISTRY_ADDRESS;
  const GRACE_PERIOD_SEC = Number(process.env.GRACE_PERIOD_SEC || 3 * 24 * 60 * 60);

  if (!PRIVATE_KEY || !CONTRACT_ADDRESS) {
    console.error("PRIVATE_KEY and CONTRACT_ADDRESS env vars are required");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

  const complaintCount = Number(await contract.complaintCount());
  console.log("Total complaints:", complaintCount);

  const now = Math.floor(Date.now() / 1000);
  let escalated = 0;
  for (let id = 1; id <= complaintCount; id++) {
    const c = await contract.getComplaint(id);
    if (c.status === 0 && now - Number(c.timestamp) > GRACE_PERIOD_SEC) {
      try {
        console.log(`Escalating complaint #${id}`);
        const tx = await contract.escalateComplaint(id);
        await tx.wait();
        escalated++;
      } catch (err) {
        console.error(`Failed to escalate #${id}:`, err.reason || err.message);
      }
    }
  }
  console.log(`Auto-escalate completed – escalated ${escalated} complaints.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
