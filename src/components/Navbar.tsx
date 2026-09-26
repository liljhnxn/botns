'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAccount, useChainId } from 'wagmi';
import { botchainMainnet } from '@/config/chains';
import { ExternalLink } from 'lucide-react';

interface NavbarProps {
  activeTab: 'search' | 'dashboard' | 'inspector' | 'contract';
  setActiveTab: (tab: 'search' | 'dashboard' | 'inspector' | 'contract') => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isMainnet = chainId === botchainMainnet.id;
  const isCorrectNetwork = isMainnet || (!isConnected && true);
  const networkName = isMainnet
    ? 'BOT Chain (677)'
    : isConnected
    ? 'Switch to BOT Chain'
    : 'BOT Chain (677)';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-color)] bg-[#07090e]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('search')}
            className="flex items-center gap-3 group text-left transition-all"
          >
            <div className="w-11 h-11 relative rounded-xl overflow-hidden shadow-lg shadow-cyan-500/20 group-hover:shadow-blue-500/30 transition-all">
              <img
                src="/logo.svg"
                alt="BotNS Logo"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">BotNS</span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded bg-gradient-to-r from-cyan-400 to-blue-500 text-black">
                  .BOT
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-dim)] font-medium">Botchain Name Service</p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 ml-8">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'search'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Search & Register
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              My Domains
            </button>
            <button
              onClick={() => setActiveTab('inspector')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'inspector'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Domain Inspector
            </button>
            <button
              onClick={() => setActiveTab('contract')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'contract'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Contract
            </button>
          </nav>
        </div>

        {/* Network Badge & Mainnet Explorer & Wallet Connect */}
        <div className="flex items-center gap-3">
          <a
            href="https://scan.botchain.ai"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs font-semibold transition-all shadow-sm group"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Mainnet Explorer</span>
            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>

          {mounted && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-white/5 text-xs font-medium">
              <span className={`w-2 h-2 rounded-full ${isCorrectNetwork ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'}`}></span>
              <span className="text-slate-300">{networkName}</span>
            </div>
          )}

          {/* Reown AppKit Button */}
          {mounted ? (
            // @ts-ignore custom element from @reown/appkit
            <appkit-button balance="show" />
          ) : (
            <button className="btn-primary text-sm py-2 px-4 opacity-75">Connect Wallet</button>
          )}
        </div>

      </div>

      {/* Mobile Nav Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-[var(--border-color)] px-2 py-2 bg-[#0a0e17]">
        <button
          onClick={() => setActiveTab('search')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
            activeTab === 'search' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400'
          }`}
        >
          Search
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
            activeTab === 'dashboard' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400'
          }`}
        >
          My Domains
        </button>
        <button
          onClick={() => setActiveTab('inspector')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
            activeTab === 'inspector' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400'
          }`}
        >
          Inspector
        </button>
        <button
          onClick={() => setActiveTab('contract')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
            activeTab === 'contract' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400'
          }`}
        >
          Contract
        </button>
      </div>
    </header>
  );
}
