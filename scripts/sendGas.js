const { createPublicClient, createWalletClient, http, defineChain, parseEther, formatEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

const pkMatch = envContent.match(/PRIVATE_KEY=([^\r\n]+)/);
const privateKeyRaw = pkMatch ? pkMatch[1].trim() : '';
const privateKey = privateKeyRaw.startsWith('0x') ? privateKeyRaw : '0x' + privateKeyRaw;
const account = privateKeyToAccount(privateKey);

const rpcMatch = envContent.match(/NEXT_PUBLIC_RPC_URL=([^\r\n]+)/);
const rpcUrl = rpcMatch ? rpcMatch[1].trim() : 'https://rpc.botchain.ai';

const chainIdMatch = envContent.match(/NEXT_PUBLIC_CHAIN_ID=([^\r\n]+)/);
const chainId = chainIdMatch ? parseInt(chainIdMatch[1].trim(), 10) : 677;

const botchain = defineChain({
  id: chainId,
  name: 'BOT Chain',
  nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
});

const publicClient = createPublicClient({ chain: botchain, transport: http(rpcUrl) });
const walletClient = createWalletClient({ account, chain: botchain, transport: http(rpcUrl) });

async function main() {
  const recipient = process.argv[2] || '0x67cF800fa2a3AC0B22160ae92de9c3881D63492F';
  const amountStr = process.argv[3] || '0.005';
  const amountWei = parseEther(amountStr);

  console.log(`Sending ${amountStr} BOT gas funds from Deployer (${account.address}) to Account 3 (${recipient})...`);

  const txHash = await walletClient.sendTransaction({
    to: recipient,
    value: amountWei,
  });

  console.log(`⏳ Transaction sent! Hash: ${txHash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  if (receipt.status === 'success') {
    const newBal = await publicClient.getBalance({ address: recipient });
    console.log(`✅ Success! Account 3 new balance: ${formatEther(newBal)} BOT`);
  } else {
    console.error(`❌ Transaction failed:`, receipt.status);
  }
}

main().catch(console.error);
