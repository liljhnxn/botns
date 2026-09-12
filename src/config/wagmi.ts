import { http } from 'wagmi';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { botchainTestnet } from './chains';

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'c4f79cc821944d9680842e34466bfbd';

export const networks = [botchainTestnet];

export const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  projectId,
  networks,
  transports: {
    [botchainTestnet.id]: http('https://rpc.bohr.life'),
  },
});

export const config = wagmiAdapter.wagmiConfig;
