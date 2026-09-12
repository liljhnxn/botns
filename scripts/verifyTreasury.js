const { createPublicClient, http, defineChain } = require('viem');

const botchainTestnet = defineChain({
  id: 968,
  name: 'Botchain Testnet',
  nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.bohr.life'] } },
  testnet: true,
});

const client = createPublicClient({
  chain: botchainTestnet,
  transport: http('https://rpc.bohr.life'),
});

async function main() {
  const contractAddress = '0x8bfaa8c9d366651f898b3a3c93f5f7cd32aa2eeb';
  const treasury = await client.readContract({
    address: contractAddress,
    abi: [{ type: 'function', name: 'treasury', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' }],
    functionName: 'treasury',
  });
  const owner = await client.readContract({
    address: contractAddress,
    abi: [{ type: 'function', name: 'owner', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' }],
    functionName: 'owner',
  });

  console.log('Contract Address:', contractAddress);
  console.log('Contract Owner:   ', owner);
  console.log('Contract Treasury:', treasury);
}

main();
