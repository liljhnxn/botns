const fs = require('fs');
const path = require('path');
const solc = require('solc');
const { getContractAddress } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
let privateKey = '';
let rpcUrl = 'https://rpc.botchain.ai';
let explorerUrl = 'https://scan.botchain.ai';
let chainId = 677;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const pkMatch = envContent.match(/PRIVATE_KEY=([^\r\n]+)/);
  if (pkMatch) privateKey = pkMatch[1].trim();

  const rpcMatch = envContent.match(/NEXT_PUBLIC_RPC_URL=([^\r\n]+)/);
  if (rpcMatch) rpcUrl = rpcMatch[1].trim();

  const explorerMatch = envContent.match(/NEXT_PUBLIC_EXPLORER_URL=([^\r\n]+)/);
  if (explorerMatch) explorerUrl = explorerMatch[1].trim();

  const chainIdMatch = envContent.match(/NEXT_PUBLIC_CHAIN_ID=([^\r\n]+)/);
  if (chainIdMatch) chainId = parseInt(chainIdMatch[1].trim(), 10) || 677;
}

if (!privateKey) {
  console.error('Error: PRIVATE_KEY not found in .env.local');
  process.exit(1);
}

if (!privateKey.startsWith('0x')) {
  privateKey = '0x' + privateKey;
}

async function rpcCall(method, params = []) {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message || JSON.stringify(data.error));
  }
  return data.result;
}

async function main() {
  console.log('=============================================');
  console.log('⚡ BOT Chain Mainnet Deployment Tool');
  console.log('=============================================');

  console.log('\n--- Step 1: Compiling BotNameService.sol ---');
  const contractPath = path.resolve(__dirname, '../contracts/BotNameService.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'BotNameService.sol': {
        content: source,
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 1, // Minimize deployment bytecode size and gas cost
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object'],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const hasError = output.errors.some((err) => err.severity === 'error');
    output.errors.forEach((err) => console.log(err.formattedMessage));
    if (hasError) {
      process.exit(1);
    }
  }

  const contract = output.contracts['BotNameService.sol']['BotNameService'];
  const abi = contract.abi;
  const bytecode = '0x' + contract.evm.bytecode.object;

  console.log('Contract compiled successfully.');

  console.log('\n--- Step 2: Account & Gas Inspection ---');
  const account = privateKeyToAccount(privateKey);
  console.log('Deployer Address :', account.address);
  console.log('Target Chain ID  :', chainId);
  console.log('Target RPC URL   :', rpcUrl);

  const balanceHex = await rpcCall('eth_getBalance', [account.address, 'latest']);
  const balanceWei = BigInt(balanceHex);
  const balanceBot = (Number(balanceWei) / 1e18).toFixed(6);
  console.log(`Deployer Balance : ${balanceBot} BOT (${balanceWei.toString()} Wei)`);

  const gasPriceHex = await rpcCall('eth_gasPrice');
  const gasPrice = BigInt(gasPriceHex);
  console.log(`Network Gas Price: ${(Number(gasPrice) / 1e9).toFixed(2)} Gwei`);

  console.log('\nEstimating deployment gas...');
  const estimatedGasHex = await rpcCall('eth_estimateGas', [{
    from: account.address,
    data: bytecode,
  }]);
  const estimatedGas = BigInt(estimatedGasHex);
  // Add 10% safety margin for deployment execution
  const gasLimit = (estimatedGas * 110n) / 100n;
  const requiredWei = gasLimit * gasPrice;
  const requiredBot = (Number(requiredWei) / 1e18).toFixed(6);

  console.log(`Estimated Gas    : ${estimatedGas.toString()} units`);
  console.log(`Gas Limit (110%) : ${gasLimit.toString()} units`);
  console.log(`Estimated Cost   : ~${requiredBot} BOT`);

  if (balanceWei < requiredWei) {
    const deficitWei = requiredWei - balanceWei;
    const deficitBot = (Number(deficitWei) / 1e18).toFixed(6);
    console.error('\n❌ Insufficient balance for Mainnet deployment!');
    console.error(`Current balance  : ${balanceBot} BOT`);
    console.error(`Required minimum : ${requiredBot} BOT`);
    console.error(`Deficit (needed) : ~${deficitBot} BOT`);
    console.error(`\nPlease send at least ${deficitBot} BOT to deployer:`);
    console.error(`👉 ${account.address}`);
    console.error('\nAfter funding, run: npm run deploy\n');
    process.exit(1);
  }

  console.log('\n--- Step 3: Signing & Broadcasting Deployment Transaction ---');
  const nonceHex = await rpcCall('eth_getTransactionCount', [account.address, 'latest']);
  const nonce = parseInt(nonceHex, 16);
  console.log('Deployer Nonce   :', nonce);

  // Sign legacy transaction locally to ensure compatibility with BOT Chain EVM
  const serializedTx = await account.signTransaction({
    to: null,
    data: bytecode,
    gas: gasLimit,
    gasPrice: gasPrice,
    nonce: nonce,
    chainId: chainId,
    type: 'legacy',
  });

  const txHash = await rpcCall('eth_sendRawTransaction', [serializedTx]);
  console.log('Deployment TX Hash:', txHash);
  console.log('Waiting for block confirmation on BOT Chain Mainnet...');

  // Poll for receipt
  let receipt = null;
  const maxAttempts = 40;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    process.stdout.write(`Confirming... (${attempt * 3}s)\r`);
    receipt = await rpcCall('eth_getTransactionReceipt', [txHash]);
    if (receipt && receipt.blockNumber) {
      break;
    }
  }

  if (!receipt || !receipt.contractAddress) {
    // If receipt not indexed yet, compute standard deterministic contract address
    const computedAddr = getContractAddress({ from: account.address, nonce });
    console.log(`\nTransaction submitted. Contract address expected at: ${computedAddr}`);
    receipt = { contractAddress: computedAddr, transactionHash: txHash };
  }

  const contractAddress = receipt.contractAddress;

  console.log('\n=============================================');
  console.log('🎉 CONTRACT DEPLOYED SUCCESSFULLY TO BOT CHAIN MAINNET!');
  console.log('Contract Address :', contractAddress);
  console.log('Transaction Hash :', txHash);
  console.log('Explorer URL     :', `${explorerUrl}/address/${contractAddress}`);
  console.log('=============================================\n');

  // Update .env.local
  let currentEnv = fs.readFileSync(envPath, 'utf8');
  if (currentEnv.includes('NEXT_PUBLIC_BNS_CONTRACT_ADDRESS=')) {
    currentEnv = currentEnv.replace(
      /NEXT_PUBLIC_BNS_CONTRACT_ADDRESS=[^\r\n]*/,
      `NEXT_PUBLIC_BNS_CONTRACT_ADDRESS=${contractAddress}`
    );
  } else {
    currentEnv += `\nNEXT_PUBLIC_BNS_CONTRACT_ADDRESS=${contractAddress}`;
  }
  fs.writeFileSync(envPath, currentEnv, 'utf8');
  console.log('✅ Updated .env.local with deployed contract address.');

  // Update src/contracts/bnsContract.ts
  const contractTsPath = path.resolve(__dirname, '../src/contracts/bnsContract.ts');
  const abiJsonStr = JSON.stringify(abi, null, 2);
  const contractTsContent = `export const BNS_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_BNS_CONTRACT_ADDRESS ||
  '${contractAddress}') as \`0x\${string}\`;

export const BNS_ABI = ${abiJsonStr} as const;
`;
  fs.writeFileSync(contractTsPath, contractTsContent, 'utf8');
  console.log('✅ Updated src/contracts/bnsContract.ts with deployed address & ABI.');
}

main().catch((err) => {
  console.error('\n❌ Deployment failed:', err.message || err);
  process.exit(1);
});
