const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Paths
const contractPath = path.join(__dirname, '../contracts/ComplaintRegistry.sol');
const outputPath = path.join(__dirname, '../frontend/src/contracts/ComplaintRegistryABI.json');

// Compile the contract
console.log('Compiling contract...');
const compile = spawnSync('npx', [
  'hardhat',
  'compile'
], { stdio: 'inherit' });

if (compile.status !== 0) {
  console.error('Failed to compile contract');
  process.exit(1);
}

// Get the ABI
console.log('Extracting ABI...');
const { abi } = require('../artifacts/contracts/ComplaintRegistry.sol/ComplaintRegistry.json');

// Save the ABI to the frontend
fs.writeFileSync(outputPath, JSON.stringify(abi, null, 2));
console.log(`ABI saved to ${outputPath}`);
