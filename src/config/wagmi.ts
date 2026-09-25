import { http } from 'wagmi';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { botchainMainnet } from './chains';

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'c4f79cc821944d9680842e34466bfbd';

export const networks = [botchainMainnet];

export const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  projectId,
  networks,
  transports: {
    [botchainMainnet.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.botchain.ai'),
  },
});

export const config = wagmiAdapter.wagmiConfig;
