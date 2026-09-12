const fs = require('fs');
const path = require('path');
const solc = require('solc');
const { createWalletClient, createPublicClient, http, defineChain } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
let privateKey = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/PRIVATE_KEY=([^\r\n]+)/);
  if (match) {
    privateKey = match[1].trim();
  }
}

if (!privateKey) {
  console.error('Error: PRIVATE_KEY not found in .env.local');
  process.exit(1);
}

// Ensure 0x prefix
if (!privateKey.startsWith('0x')) {
  privateKey = '0x' + privateKey;
}

const botchainTestnet = defineChain({
  id: 968,
  name: 'Botchain Testnet',
  nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.bohr.life'] },
    public: { http: ['https://rpc.bohr.life'] },
  },
  testnet: true,
});

async function main() {
  console.log('--- Step 1: Compiling BotNameService.sol ---');
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
        runs: 200,
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

  console.log('\n--- Step 2: Preparing Botchain Testnet Deployment ---');
  const account = privateKeyToAccount(privateKey);
  console.log('Deployer Address:', account.address);

  const publicClient = createPublicClient({
    chain: botchainTestnet,
    transport: http('https://rpc.bohr.life'),
  });

  const walletClient = createWalletClient({
    account,
    chain: botchainTestnet,
    transport: http('https://rpc.bohr.life'),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Deployer Balance: ${(Number(balance) / 1e18).toFixed(4)} BOT`);

  console.log('\n--- Step 3: Broadcasting Deployment Transaction ---');
  const hash = await walletClient.deployContract({
    abi,
    bytecode,
    account,
  });

  console.log('Deployment TX Hash:', hash);
  console.log('Waiting for confirmation on Botchain...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const contractAddress = receipt.contractAddress;

  console.log('\n=============================================');
  console.log('🎉 CONTRACT DEPLOYED SUCCESSFULLY!');
  console.log('Contract Address:', contractAddress);
  console.log('Explorer:', `https://scan.bohr.life/address/${contractAddress}`);
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
  console.log('Updated .env.local with deployed contract address.');

  // Update src/contracts/bnsContract.ts
  const contractTsPath = path.resolve(__dirname, '../src/contracts/bnsContract.ts');
  const abiJsonStr = JSON.stringify(abi, null, 2);
  const contractTsContent = `import { parseAbi } from 'viem';

export const BNS_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_BNS_CONTRACT_ADDRESS ||
  '${contractAddress}') as \`0x\${string}\`;

export const BNS_ABI = ${abiJsonStr} as const;
`;
  fs.writeFileSync(contractTsPath, contractTsContent, 'utf8');
  console.log('Updated src/contracts/bnsContract.ts with deployed address & ABI.');
}

main().catch((err) => {
  console.error('Deployment failed:', err);
  process.exit(1);
});
