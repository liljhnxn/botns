'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import HeroSearch from '@/components/HeroSearch';
import RegisterModal from '@/components/RegisterModal';
import UserDashboard from '@/components/UserDashboard';
import DomainInspector from '@/components/DomainInspector';
import ContractDeployGuide from '@/components/ContractDeployGuide';
import { Cpu, ExternalLink, ShieldCheck, Heart } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'search' | 'dashboard' | 'inspector' | 'contract'>('search');
  
  // Registration Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('0');

  const handleSelectDomain = (domain: string, price: string) => {
    setSelectedDomain(domain);
    setSelectedPrice(price);
    setIsRegisterOpen(true);
  };

  const handleRegistrationSuccess = (domain: string) => {
    // Navigate to dashboard after success
    setActiveTab('dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Dynamic View */}
      <main className="flex-1">
        {activeTab === 'search' && (
          <HeroSearch onSelectDomain={handleSelectDomain} />
        )}

        {activeTab === 'dashboard' && (
          <UserDashboard onRegisterClick={() => setActiveTab('search')} />
        )}

        {activeTab === 'inspector' && (
          <DomainInspector />
        )}

        {activeTab === 'contract' && (
          <ContractDeployGuide />
        )}
      </main>

      {/* Registration Modal */}
      <RegisterModal
        domainName={selectedDomain}
        basePricePerYear={selectedPrice}
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={handleRegistrationSuccess}
      />

      {/* Footer */}
      <footer className="border-t border-[var(--border-color)] bg-[#07090e]/90 py-8 px-4 sm:px-6 lg:px-8 mt-12 z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 font-semibold">BOT Chain Name Service (.bot)</span>
            <span className="text-slate-600">|</span>
            <span>Mainnet Chain ID: 677</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://rpc.botchain.ai"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              <span>RPC</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://scan.botchain.ai"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              <span>BotScan Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="text-slate-500 text-[11px]">
            Decentralized Web3 Identity • Built on Botchain EVM
          </div>
        </div>
      </footer>
    </div>
  );
}
