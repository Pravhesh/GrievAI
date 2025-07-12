const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '../artifacts/contracts/ComplaintRegistry.sol/ComplaintRegistry.json');
const targetPath = path.join(__dirname, '../frontend/src/contracts/ComplaintRegistryABI.json');

// Read the artifact file
const artifact = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

// Write just the ABI array to the target file
fs.writeFileSync(targetPath, JSON.stringify(artifact.abi, null, 2));

console.log('ABI file updated successfully!');
