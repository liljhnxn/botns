const { createPublicClient, createWalletClient, http, defineChain, parseEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

const pkMatch = envContent.match(/PRIVATE_KEY=([^\r\n]+)/);
const privateKeyRaw = pkMatch ? pkMatch[1].trim() : '';
const privateKey = privateKeyRaw.startsWith('0x') ? privateKeyRaw : '0x' + privateKeyRaw;
const account = privateKeyToAccount(privateKey);

const addrMatch = envContent.match(/NEXT_PUBLIC_BNS_CONTRACT_ADDRESS=([^\r\n]+)/);
const contractAddress = addrMatch ? addrMatch[1].trim() : '0x2ce45ff1847273f0fd11714744c4f238d004e026';

const rpcMatch = envContent.match(/NEXT_PUBLIC_RPC_URL=([^\r\n]+)/);
const rpcUrl = rpcMatch ? rpcMatch[1].trim() : 'https://rpc.botchain.ai';

const chainIdMatch = envContent.match(/NEXT_PUBLIC_CHAIN_ID=([^\r\n]+)/);
const chainId = chainIdMatch ? parseInt(chainIdMatch[1].trim(), 10) : 677;

const treasuryAddress = account.address;

const botchain = defineChain({
  id: chainId,
  name: 'BOT Chain',
  nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
  testnet: chainId !== 677,
});

const publicClient = createPublicClient({
  chain: botchain,
  transport: http(rpcUrl),
});

const ABI = [
  {
    type: 'function',
    name: 'register',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'targetAddress', type: 'address' },
      { name: 'durationYears', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'getPrice',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'durationYears', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
];

async function main() {
  const domain = 'testbot' + Math.floor(Math.random() * 1000);
  console.log(`Querying price for ${domain}.bot on BOT Chain Mainnet...`);
  const price = await publicClient.readContract({
    address: contractAddress,
    abi: ABI,
    functionName: 'getPrice',
    args: [domain, 1n],
  });
  console.log(`Price: ${(Number(price)/1e18).toFixed(2)} BOT`);
  console.log('Contract Address:', contractAddress);
}

main().catch(console.error);
