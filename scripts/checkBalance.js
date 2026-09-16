const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

const pkMatch = envContent.match(/PRIVATE_KEY=([^\r\n]+)/);
let privateKey = pkMatch ? pkMatch[1].trim() : '';
if (!privateKey.startsWith('0x')) {
  privateKey = '0x' + privateKey;
}

const rpcMatch = envContent.match(/NEXT_PUBLIC_RPC_URL=([^\r\n]+)/);
const rpcUrl = rpcMatch ? rpcMatch[1].trim() : 'https://rpc.botchain.ai';

const chainIdMatch = envContent.match(/NEXT_PUBLIC_CHAIN_ID=([^\r\n]+)/);
const chainId = chainIdMatch ? parseInt(chainIdMatch[1].trim(), 10) : 677;

const { privateKeyToAccount } = require('viem/accounts');
const account = privateKeyToAccount(privateKey);

console.log('==============================================');
console.log('⚡ BOT Chain Account & Network Inspector');
console.log('==============================================');
console.log('Deployer Address :', account.address);
console.log('Target Chain ID  :', chainId);
console.log('RPC Endpoint     :', rpcUrl);

async function run() {
  try {
    const payload = [
      { jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [account.address, 'latest'] },
      { jsonrpc: '2.0', id: 2, method: 'eth_gasPrice', params: [] },
      { jsonrpc: '2.0', id: 3, method: 'eth_blockNumber', params: [] }
    ];

    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    const balanceHex = data.find(d => d.id === 1)?.result || '0x0';
    const gasPriceHex = data.find(d => d.id === 2)?.result || '0x0';
    const blockNumberHex = data.find(d => d.id === 3)?.result || '0x0';

    const balanceWei = BigInt(balanceHex);
    const balanceBot = (Number(balanceWei) / 1e18).toFixed(6);
    const gasPriceGwei = (Number(BigInt(gasPriceHex)) / 1e9).toFixed(2);
    const blockNumber = parseInt(blockNumberHex, 16);

    console.log('Current Block    :', blockNumber);
    console.log('Gas Price        :', `${gasPriceGwei} Gwei`);
    console.log('Account Balance  :', `${balanceBot} BOT (${balanceWei.toString()} Wei)`);
    console.log('==============================================');

    if (balanceWei === 0n) {
      console.log('⚠️  Notice: Deployer balance is 0 BOT.');
      console.log(`   To deploy to Mainnet, please transfer BOT to:`);
      console.log(`   ${account.address}`);
    } else {
      console.log('✅ Deployer wallet has funds for deployment.');
    }
    console.log('==============================================');
  } catch (err) {
    console.error('Error querying RPC:', err.message || err);
  }
}

run();
