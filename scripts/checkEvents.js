const { createPublicClient, http, defineChain } = require('viem');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

const addrMatch = envContent.match(/NEXT_PUBLIC_BNS_CONTRACT_ADDRESS=([^\r\n]+)/);
const contractAddress = addrMatch ? addrMatch[1].trim() : '0x8bfaa8c9d366651f898b3a3c93f5f7cd32aa2eeb';

const rpcMatch = envContent.match(/NEXT_PUBLIC_RPC_URL=([^\r\n]+)/);
const rpcUrl = rpcMatch ? rpcMatch[1].trim() : 'https://rpc.botchain.ai';

const chainIdMatch = envContent.match(/NEXT_PUBLIC_CHAIN_ID=([^\r\n]+)/);
const chainId = chainIdMatch ? parseInt(chainIdMatch[1].trim(), 10) : 677;

const treasuryAddress = '0x83acc57bb9CDe889b248E9c740F5248637cd89f4';

const botchain = defineChain({
  id: chainId,
  name: 'BOT Chain',
  nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
  testnet: chainId !== 677,
});

const client = createPublicClient({
  chain: botchain,
  transport: http(rpcUrl),
});

async function main() {
  console.log(`Querying BOT Chain (Chain ID ${chainId}) at ${rpcUrl}...`);
  const contractBal = await client.getBalance({ address: contractAddress });
  const treasuryBal = await client.getBalance({ address: treasuryAddress });
  const totalRegistered = await client.readContract({
    address: contractAddress,
    abi: [{ type: 'function', name: 'totalDomainsRegistered', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' }],
    functionName: 'totalDomainsRegistered',
  });

  console.log('Contract Address:', contractAddress);
  console.log('Contract Balance:', contractBal.toString(), `(${(Number(contractBal)/1e18).toFixed(4)} BOT)`);
  console.log('Treasury Address:', treasuryAddress);
  console.log('Treasury Balance:', treasuryBal.toString(), `(${(Number(treasuryBal)/1e18).toFixed(4)} BOT)`);
  console.log('Total Domains Registered on Contract:', totalRegistered.toString());
}

main().catch(console.error);
