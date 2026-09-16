const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
let contractAddress = '0x2ce45ff1847273f0fd11714744c4f238d004e026';
let explorerUrl = 'https://scan.botchain.ai';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const addrMatch = envContent.match(/NEXT_PUBLIC_BNS_CONTRACT_ADDRESS=([^\r\n]+)/);
  if (addrMatch) contractAddress = addrMatch[1].trim();
  const expMatch = envContent.match(/NEXT_PUBLIC_EXPLORER_URL=([^\r\n]+)/);
  if (expMatch) explorerUrl = expMatch[1].trim();
}

const sourceCode = fs.readFileSync(path.resolve(__dirname, '../contracts/BotNameService.sol'), 'utf8');

async function main() {
  console.log('==============================================');
  console.log('⚡ BOT Chain Contract Verification Tool');
  console.log('==============================================');
  console.log('Contract Address :', contractAddress);
  console.log('Explorer URL     :', explorerUrl);
  console.log('Compiler Version : v0.8.20+commit.a1b79de6');
  console.log('Optimization     : Enabled (runs: 1)');

  const params = new URLSearchParams({
    module: 'contract',
    action: 'verifysourcecode',
    contractaddress: contractAddress,
    sourceCode: sourceCode,
    codeformat: 'solidity-single-file',
    contractname: 'BotNameService',
    compilerversion: 'v0.8.20+commit.a1b79de6',
    optimizationUsed: '1',
    runs: '1',
    constructorArguements: '',
  });

  const res = await fetch(`${explorerUrl}/api`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await res.json();
  console.log('\nVerification submission:', data.message);

  if (data.status === '1') {
    const guid = data.result;
    console.log('Checking verification status (GUID:', guid, ')...');
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const statusRes = await fetch(`${explorerUrl}/api?module=contract&action=checkverifystatus&guid=${guid}`);
      const statusData = await statusRes.json();
      console.log(`Status check ${i + 1}:`, statusData.result);
      if (statusData.result.includes('Pass') || statusData.result.includes('Verified')) {
        console.log('\n🎉 CONTRACT FULLY VERIFIED ON EXPLORER!');
        console.log('View code at:', `${explorerUrl}/address/${contractAddress}#code`);
        return;
      }
    }
  } else {
    // If already verified
    const checkRes = await fetch(`${explorerUrl}/api?module=contract&action=getabi&address=${contractAddress}`);
    const checkData = await checkRes.json();
    if (checkData.status === '1') {
      console.log('\n🎉 CONTRACT IS ALREADY VERIFIED ON EXPLORER!');
      console.log('View code at:', `${explorerUrl}/address/${contractAddress}#code`);
    } else {
      console.log('Response:', data);
    }
  }
}

main().catch(console.error);
