const { createPublicClient, http, defineChain } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/PRIVATE_KEY=([^\r\n]+)/);
const privateKey = match[1].trim().startsWith('0x') ? match[1].trim() : '0x' + match[1].trim();

const account = privateKeyToAccount(privateKey);
console.log('Account Address:', account.address);

const botchainTestnet = defineChain({
  id: 968,
  name: 'Botchain Testnet',
  nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.bohr.life'] },
  },
  testnet: true,
});

const client = createPublicClient({
  chain: botchainTestnet,
  transport: http('https://rpc.bohr.life'),
});

async function run() {
  const balance = await client.getBalance({ address: account.address });
  const gasPrice = await client.getGasPrice();
  console.log('Gas Price:', gasPrice.toString(), 'wei =', (Number(gasPrice) / 1e9).toFixed(2), 'Gwei');
  console.log('Account Balance:', balance.toString(), 'wei =', (Number(balance) / 1e18).toFixed(6), 'BOT');
}

run();
