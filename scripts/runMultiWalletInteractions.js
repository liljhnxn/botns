const { createPublicClient, createWalletClient, http, defineChain, formatEther, parseEther } = require('viem');
const { privateKeyToAccount, generatePrivateKey } = require('viem/accounts');
const fs = require('fs');
const path = require('path');

// 1. Load configuration from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

const rpcMatch = envContent.match(/NEXT_PUBLIC_RPC_URL=([^\r\n]+)/);
const rpcUrl = rpcMatch ? rpcMatch[1].trim() : 'https://rpc.botchain.ai';

const chainIdMatch = envContent.match(/NEXT_PUBLIC_CHAIN_ID=([^\r\n]+)/);
const chainId = chainIdMatch ? parseInt(chainIdMatch[1].trim(), 10) : 677;

const addrMatch = envContent.match(/NEXT_PUBLIC_BNS_CONTRACT_ADDRESS=([^\r\n]+)/);
const contractAddress = addrMatch ? addrMatch[1].trim() : '0x2ce45ff1847273f0fd11714744c4f238d004e026';

const botchain = defineChain({
  id: chainId,
  name: 'BOT Chain',
  nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
  blockExplorers: { default: { name: 'Botchain Scan', url: 'https://scan.botchain.ai' } },
});

const publicClient = createPublicClient({ chain: botchain, transport: http(rpcUrl) });

// ABI for the 5 interactions
const BNS_ABI = [
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
    name: 'setTextRecord',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'key', type: 'string' },
      { name: 'value', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setPrimaryName',
    inputs: [{ name: 'name', type: 'string' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
];

// Helper to load or generate 3 persistent wallet keys for testing
const walletsConfigPath = path.resolve(__dirname, 'test-wallets.json');

function getWallets() {
  if (fs.existsSync(walletsConfigPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(walletsConfigPath, 'utf8'));
      if (Array.isArray(data) && data.length >= 3) {
        return data;
      }
    } catch (_) {}
  }

  // Generate 3 fresh test wallets
  const wallets = [
    { name: 'Wallet 1 (Alpha)', privateKey: generatePrivateKey() },
    { name: 'Wallet 2 (Beta)', privateKey: generatePrivateKey() },
    { name: 'Wallet 3 (Gamma)', privateKey: generatePrivateKey() },
  ];

  fs.writeFileSync(walletsConfigPath, JSON.stringify(wallets, null, 2));
  return wallets;
}

async function main() {
  console.log('================================================================');
  console.log('⚡ Bot Name Service (BNS) - 5 Contract Interactions with 3 Wallets');
  console.log('================================================================');
  console.log('Network RPC      :', rpcUrl, `(Chain ID: ${chainId})`);
  console.log('Contract Address :', contractAddress);
  console.log('Explorer URL     : https://scan.botchain.ai');
  console.log('================================================================\n');

  const walletsConfig = getWallets();
  const accounts = walletsConfig.map((w) => {
    const pk = w.privateKey.startsWith('0x') ? w.privateKey : `0x${w.privateKey}`;
    return {
      ...w,
      account: privateKeyToAccount(pk),
      client: createWalletClient({
        account: privateKeyToAccount(pk),
        chain: botchain,
        transport: http(rpcUrl),
      }),
    };
  });

  console.log('📋 Target Wallets:');
  let hasGasShortage = false;
  const gasPrice = await publicClient.getGasPrice();
  console.log(`Current Gas Price: ${(Number(gasPrice) / 1e9).toFixed(2)} Gwei\n`);

  // Deployer account for potential auto-distribution
  const pkMatch = envContent.match(/PRIVATE_KEY=([^\r\n]+)/);
  const deployerPk = pkMatch ? (pkMatch[1].trim().startsWith('0x') ? pkMatch[1].trim() : '0x' + pkMatch[1].trim()) : '';
  const deployerAccount = deployerPk ? privateKeyToAccount(deployerPk) : null;
  const deployerWalletClient = deployerAccount
    ? createWalletClient({ account: deployerAccount, chain: botchain, transport: http(rpcUrl) })
    : null;

  if (deployerAccount) {
    const deployerBal = await publicClient.getBalance({ address: deployerAccount.address });
    console.log(`Main Funding Wallet (${deployerAccount.address}): ${formatEther(deployerBal)} BOT\n`);

    // If deployer has >= 0.02 BOT, auto-fund any wallet with < 0.006 BOT
    if (deployerBal >= parseEther('0.02')) {
      console.log('💡 Main wallet has sufficient funds. Auto-funding test wallets with gas...');
      for (let i = 0; i < accounts.length; i++) {
        const acc = accounts[i];
        const bal = await publicClient.getBalance({ address: acc.account.address });
        if (bal < parseEther('0.006')) {
          const fundAmount = parseEther('0.007');
          console.log(`   Sending 0.007 BOT to ${acc.name} (${acc.account.address})...`);
          const tx = await deployerWalletClient.sendTransaction({
            to: acc.account.address,
            value: fundAmount,
          });
          await publicClient.waitForTransactionReceipt({ hash: tx });
          console.log(`   ✅ Funded! Tx: https://scan.botchain.ai/tx/${tx}`);
        }
      }
      console.log('');
    }
  }

  for (let i = 0; i < accounts.length; i++) {
    const acc = accounts[i];
    const bal = await publicClient.getBalance({ address: acc.account.address });
    const balBot = formatEther(bal);
    console.log(` • [Wallet ${i + 1}] ${acc.name}`);
    console.log(`   Address : ${acc.account.address}`);
    console.log(`   Balance : ${balBot} BOT`);
    if (bal < parseEther('0.006')) {
      hasGasShortage = true;
      console.log(`   ⚠️ Needs Gas: Needs at least 0.006 BOT for contract tx fees.`);
    }
  }
  console.log('');

  if (hasGasShortage) {
    console.log('================================================================');
    console.log('⚠️  GAS NOTICE: One or more test wallets need gas funds.');
    console.log('   Send ~0.025 - 0.03 BOT to your Main Wallet:');
    console.log(`   👉 ${deployerAccount ? deployerAccount.address : 'See .env.local'}`);
    console.log('   The script will automatically split it and run all 5 interactions!');
    console.log('================================================================\n');
    return;
  }

  const nonce = Date.now().toString().slice(-4);
  const domain1 = `alpha${nonce}`;
  const domain2 = `beta${nonce}`;
  const domain3 = `gamma${nonce}`;

  console.log('🚀 Executing 5 On-Chain Contract Interactions:\n');

  // --- Interaction 1: Wallet 1 registers domain1 ---
  console.log(`[Interaction 1/5] Wallet 1 (${accounts[0].account.address}) registering "${domain1}.bot"...`);
  const price1 = await publicClient.readContract({
    address: contractAddress,
    abi: BNS_ABI,
    functionName: 'getPrice',
    args: [domain1, 1n],
  });
  console.log(`   Registration Fee: ${formatEther(price1)} BOT`);

  const tx1 = await accounts[0].client.writeContract({
    address: contractAddress,
    abi: BNS_ABI,
    functionName: 'register',
    args: [domain1, accounts[0].account.address, 1n],
    value: price1,
  });
  console.log(`   ⏳ Tx Submitted: https://scan.botchain.ai/tx/${tx1}`);
  await publicClient.waitForTransactionReceipt({ hash: tx1 });
  console.log(`   ✅ Confirmed!\n`);

  // --- Interaction 2: Wallet 1 sets a Text Record ---
  console.log(`[Interaction 2/5] Wallet 1 setting text record (twitter = @${domain1}) for "${domain1}.bot"...`);
  const tx2 = await accounts[0].client.writeContract({
    address: contractAddress,
    abi: BNS_ABI,
    functionName: 'setTextRecord',
    args: [domain1, 'twitter', `@${domain1}`],
  });
  console.log(`   ⏳ Tx Submitted: https://scan.botchain.ai/tx/${tx2}`);
  await publicClient.waitForTransactionReceipt({ hash: tx2 });
  console.log(`   ✅ Confirmed!\n`);

  // --- Interaction 3: Wallet 2 registers domain2 ---
  console.log(`[Interaction 3/5] Wallet 2 (${accounts[1].account.address}) registering "${domain2}.bot"...`);
  const price2 = await publicClient.readContract({
    address: contractAddress,
    abi: BNS_ABI,
    functionName: 'getPrice',
    args: [domain2, 1n],
  });

  const tx3 = await accounts[1].client.writeContract({
    address: contractAddress,
    abi: BNS_ABI,
    functionName: 'register',
    args: [domain2, accounts[1].account.address, 1n],
    value: price2,
  });
  console.log(`   ⏳ Tx Submitted: https://scan.botchain.ai/tx/${tx3}`);
  await publicClient.waitForTransactionReceipt({ hash: tx3 });
  console.log(`   ✅ Confirmed!\n`);

  // --- Interaction 4: Wallet 2 sets Primary Reverse Record ---
  console.log(`[Interaction 4/5] Wallet 2 setting "${domain2}.bot" as Primary Domain Name...`);
  const tx4 = await accounts[1].client.writeContract({
    address: contractAddress,
    abi: BNS_ABI,
    functionName: 'setPrimaryName',
    args: [domain2],
  });
  console.log(`   ⏳ Tx Submitted: https://scan.botchain.ai/tx/${tx4}`);
  await publicClient.waitForTransactionReceipt({ hash: tx4 });
  console.log(`   ✅ Confirmed!\n`);

  // --- Interaction 5: Wallet 3 registers domain3 ---
  console.log(`[Interaction 5/5] Wallet 3 (${accounts[2].account.address}) registering "${domain3}.bot"...`);
  const price3 = await publicClient.readContract({
    address: contractAddress,
    abi: BNS_ABI,
    functionName: 'getPrice',
    args: [domain3, 1n],
  });

  const tx5 = await accounts[2].client.writeContract({
    address: contractAddress,
    abi: BNS_ABI,
    functionName: 'register',
    args: [domain3, accounts[2].account.address, 1n],
    value: price3,
  });
  console.log(`   ⏳ Tx Submitted: https://scan.botchain.ai/tx/${tx5}`);
  await publicClient.waitForTransactionReceipt({ hash: tx5 });
  console.log(`   ✅ Confirmed!\n`);

  console.log('================================================================');
  console.log('🎉 ALL 5 CONTRACT INTERACTIONS COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
  console.log(`1. Wallet 1 Registered "${domain1}.bot": https://scan.botchain.ai/tx/${tx1}`);
  console.log(`2. Wallet 1 Set Text Record          : https://scan.botchain.ai/tx/${tx2}`);
  console.log(`3. Wallet 2 Registered "${domain2}.bot": https://scan.botchain.ai/tx/${tx3}`);
  console.log(`4. Wallet 2 Set Primary Name         : https://scan.botchain.ai/tx/${tx4}`);
  console.log(`5. Wallet 3 Registered "${domain3}.bot": https://scan.botchain.ai/tx/${tx5}`);
  console.log('================================================================');
}

main().catch((err) => {
  console.error('\n❌ Execution error:', err.shortMessage || err.message || err);
  process.exit(1);
});
