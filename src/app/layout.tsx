import type { Metadata } from 'next';
import './globals.css';
import dynamic from 'next/dynamic';

const Web3Provider = dynamic(() => import('@/context/Web3Provider'), {
  ssr: false,
});

export const metadata: Metadata = {
  title: 'BotNS (.bot) | Decentralized Web3 Identity on BOT Chain',
  description: 'Register, manage, and resolve human-readable .bot domain names on BOT Chain Mainnet (Chain ID 677). Replace hexadecimal addresses with decentralized Web3 names.',
  keywords: ['BOT Chain', 'BotNS', 'Domain Name Service', '.bot', 'Web3 domains', 'Bohr', 'BOT token', 'EVM domains'],
  openGraph: {
    title: 'BotNS — BOT Chain Domain Service (.bot)',
    description: 'Decentralized Domain Name Service on BOT Chain Mainnet',
    url: 'https://botchain.domains',
    siteName: 'BotNS',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen relative flex flex-col justify-between">
        <div className="bg-ambient" />
        <div className="grid-overlay" />
        
        <Web3Provider>
          <div className="relative z-10 flex flex-col min-h-screen">
            {children}
          </div>
        </Web3Provider>
      </body>
    </html>
  );
}
