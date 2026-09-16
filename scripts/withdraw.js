const { createPublicClient, createWalletClient, http, defineChain } = require('viem');
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
const contractAddress = addrMatch ? addrMatch[1].trim() : '';

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
    name: 'withdraw',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
];

async function main() {
  if (!contractAddress) {
    console.error('Contract address not found in .env.local');
    return;
  }
  console.log(`Connecting to Chain ID ${chainId}...`);
  console.log(`Inspecting contract ${contractAddress}...`);
  const balance = await publicClient.getBalance({ address: contractAddress });
  console.log(`Contract balance: ${balance.toString()} wei (${(Number(balance)/1e18).toFixed(6)} BOT)`);

  if (balance > 0n) {
    console.log(`Withdrawing from ${contractAddress} to owner ${account.address}...`);
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: BNS_ABI,
      functionName: 'withdraw',
      account,
    });
    console.log('Withdraw TX Hash:', hash);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('Withdraw completed successfully!');
  } else {
    console.log('Contract balance is 0 BOT. Nothing to withdraw.');
  }

  const deployerBalance = await publicClient.getBalance({ address: account.address });
  console.log(`Owner balance: ${(Number(deployerBalance)/1e18).toFixed(6)} BOT`);
}

main().catch((err) => {
  console.error('Withdraw error:', err);
  process.exit(1);
});
