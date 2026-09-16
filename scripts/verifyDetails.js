const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
let contractAddress = '0x8bfaa8c9d366651f898b3a3c93f5f7cd32aa2eeb';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/NEXT_PUBLIC_BNS_CONTRACT_ADDRESS=([^\r\n]+)/);
  if (match) {
    contractAddress = match[1].trim();
  }
}

console.log('Contract verification parameters ready.');
console.log('Contract Address:', contractAddress);
console.log('Compiler Version: v0.8.20+commit.a1b79de6');
console.log('Optimization:     Enabled (200 runs)');
console.log('Constructor args: None');
