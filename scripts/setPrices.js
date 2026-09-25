const { createPublicClient, createWalletClient, http, defineChain, parseEther, formatEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

const pkMatch = envContent.match(/PRIVATE_KEY=([^\r\n]+)/);
const privateKeyRaw = pkMatch ? pkMatch[1].trim() : '';
if (!privateKeyRaw) {
  console.error('ERROR: PRIVATE_KEY not found in .env.local');
  process.exit(1);
}
const privateKey = privateKeyRaw.startsWith('0x') ? privateKeyRaw : '0x' + privateKeyRaw;
const account = privateKeyToAccount(privateKey);

const addrMatch = envContent.match(/NEXT_PUBLIC_BNS_CONTRACT_ADDRESS=([^\r\n]+)/);
const contractAddress = addrMatch ? addrMatch[1].trim() : '';
if (!contractAddress) {
  console.error('ERROR: NEXT_PUBLIC_BNS_CONTRACT_ADDRESS not found in .env.local');
  process.exit(1);
}

const rpcMatch = envContent.match(/NEXT_PUBLIC_RPC_URL=([^\r\n]+)/);
const rpcUrl = rpcMatch ? rpcMatch[1].trim() : 'https://rpc.botchain.ai';

const chainIdMatch = envContent.match(/NEXT_PUBLIC_CHAIN_ID=([^\r\n]+)/);
const chainId = chainIdMatch ? parseInt(chainIdMatch[1].trim(), 10) : 677;

const botchain = defineChain({
  id: chainId,
  name: 'BOT Chain',
  nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
  rpcUrls: {
    default: { http: [rpcUrl] },
  },
  testnet: chainId !== 677,
});

const publicClient = createPublicClient({
  chain: botchain,
  transport: http(rpcUrl),
});

const walletClient = createWalletClient({
  account,
  chain: botchain,
  transport: http(rpcUrl),
});

const BNS_ABI = [
  {
    type: 'function',
    name: 'price1to2Chars',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'price3Chars',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'price4Chars',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'price5Plus',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'setPrices',
    inputs: [
      { name: '_price1to2', type: 'uint256' },
      { name: '_price3', type: 'uint256' },
      { name: '_price4', type: 'uint256' },
      { name: '_price5Plus', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
];

async function main() {
  const mode = process.argv[2] || 'free'; // 'free', 'restore', or 'status'

  console.log('==================================================');
  console.log(`🤖 BotNameService - Price Management Script`);
  console.log(`Contract Address : ${contractAddress}`);
  console.log(`Owner Account    : ${account.address}`);
  console.log(`Network RPC      : ${rpcUrl} (Chain ID: ${chainId})`);
  console.log('==================================================\n');

  // Read current prices
  const [p1, p2, p3, p4] = await Promise.all([
    publicClient.readContract({ address: contractAddress, abi: BNS_ABI, functionName: 'price1to2Chars' }),
    publicClient.readContract({ address: contractAddress, abi: BNS_ABI, functionName: 'price3Chars' }),
    publicClient.readContract({ address: contractAddress, abi: BNS_ABI, functionName: 'price4Chars' }),
    publicClient.readContract({ address: contractAddress, abi: BNS_ABI, functionName: 'price5Plus' }),
  ]);

  console.log('Current On-Chain Prices:');
  console.log(` • 1-2 characters : ${formatEther(p1)} BOT`);
  console.log(` • 3 characters   : ${formatEther(p2)} BOT`);
  console.log(` • 4 characters   : ${formatEther(p3)} BOT`);
  console.log(` • 5+ characters  : ${formatEther(p4)} BOT\n`);

  if (mode === 'status') {
    return;
  }

  let newPrices;
  if (mode === 'free' || mode === '0') {
    console.log('🎁 Setting all domain prices to 0 BOT (Free Promo)...');
    newPrices = [0n, 0n, 0n, 0n];
  } else if (mode === 'restore' || mode === 'default') {
    console.log('🔄 Restoring default standard prices (50, 20, 10, 2 BOT)...');
    newPrices = [parseEther('50'), parseEther('20'), parseEther('10'), parseEther('2')];
  } else {
    console.log(`Usage:`);
    console.log(`  node scripts/setPrices.js free     -> Sets all domain prices to 0 BOT`);
    console.log(`  node scripts/setPrices.js restore  -> Restores standard prices (50/20/10/2 BOT)`);
    console.log(`  node scripts/setPrices.js status   -> View current on-chain prices`);
    return;
  }

  const txHash = await walletClient.writeContract({
    address: contractAddress,
    abi: BNS_ABI,
    functionName: 'setPrices',
    args: newPrices,
  });

  console.log(`⏳ Transaction sent! Hash: ${txHash}`);
  console.log('Waiting for confirmation on BOT Chain...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  if (receipt.status === 'success') {
    console.log(`✅ Success! Prices have been updated on-chain.`);
  } else {
    console.error(`❌ Transaction failed! Status: ${receipt.status}`);
  }
}

main().catch((err) => {
  console.error('Error executing script:', err);
  process.exit(1);
});
