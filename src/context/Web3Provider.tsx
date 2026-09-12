'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { createAppKit } from '@reown/appkit/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, type Config } from 'wagmi';
import { botchainTestnet } from '@/config/chains';
import { projectId, wagmiAdapter } from '@/config/wagmi';

// Setup queryClient
const queryClient = new QueryClient();

const metadata = {
  name: 'Botchain Domain Service (.bot)',
  description: 'Decentralized Domain Name Service on Botchain Testnet',
  url: 'https://botchain.domains',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
};

export default function Web3Provider({
  children,
}: {
  children: ReactNode;
  cookies?: string | null;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && projectId) {
      createAppKit({
        adapters: [wagmiAdapter],
        projectId,
        networks: [botchainTestnet],
        defaultNetwork: botchainTestnet,
        metadata,
        features: {
          analytics: false,
        },
        themeMode: 'dark',
        themeVariables: {
          '--w3m-accent': '#3b82f6',
          '--w3m-border-radius-master': '12px',
        },
      });
      setReady(true);
    }
  }, []);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
