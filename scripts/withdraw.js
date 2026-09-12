const { createPublicClient, createWalletClient, http, defineChain } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/PRIVATE_KEY=([^\r\n]+)/);
const privateKey = match[1].trim().startsWith('0x') ? match[1].trim() : '0x' + match[1].trim();
const account = privateKeyToAccount(privateKey);

const contractAddress = '0x0b1a2cdc35bf786c1cb17536667dfbf7d03d5a77';

const botchainTestnet = defineChain({
  id: 968,
  name: 'Botchain Testnet',
  nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.bohr.life'] },
  },
  testnet: true,
});

const publicClient = createPublicClient({
  chain: botchainTestnet,
  transport: http('https://rpc.bohr.life'),
});

const walletClient = createWalletClient({
  account,
  chain: botchainTestnet,
  transport: http('https://rpc.bohr.life'),
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
  console.log(`Owner balance after check: ${(Number(deployerBalance)/1e18).toFixed(6)} BOT`);
}

main().catch((err) => {
  console.error('Withdraw error:', err);
  process.exit(1);
});
