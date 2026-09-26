'use client';

import React, { useState, useMemo } from 'react';
import { Search, Sparkles, CheckCircle, XCircle, ArrowRight, ShieldCheck, Zap, Coins, ExternalLink } from 'lucide-react';
import { useAccount, useReadContract } from 'wagmi';
import { BNS_CONTRACT_ADDRESS, BNS_ABI } from '@/contracts/bnsContract';
import { formatEther } from 'viem';

interface HeroSearchProps {
  onSelectDomain: (domainName: string, priceBot: string) => void;
}

export default function HeroSearch({ onSelectDomain }: HeroSearchProps) {
  const [query, setQuery] = useState('');
  const { isConnected } = useAccount();

  // Normalize query: remove spaces, trailing .bot, and convert to lower
  const cleanName = useMemo(() => {
    let raw = query.trim().toLowerCase();
    if (raw.endsWith('.bot')) {
      raw = raw.slice(0, -4);
    }
    return raw.replace(/[^a-z0-9-]/g, '');
  }, [query]);

  // Check on-chain availability if contract is deployed
  const isContractValid = BNS_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000';

  const { data: onChainAvailable, isLoading: isCheckingContract } = useReadContract({
    address: BNS_CONTRACT_ADDRESS,
    abi: BNS_ABI,
    functionName: 'isAvailable',
    args: [cleanName],
    query: {
      enabled: isContractValid && cleanName.length > 0,
    },
  });

  // Dynamically read on-chain price for 1 year
  const { data: onChainPriceWei } = useReadContract({
    address: BNS_CONTRACT_ADDRESS,
    abi: BNS_ABI,
    functionName: 'getPrice',
    args: [cleanName, BigInt(1)],
    query: {
      enabled: isContractValid && cleanName.length > 0,
    },
  });

  // Calculate pricing (on-chain price takes priority, defaults to 0 BOT for promo)
  const estimatedPrice = useMemo(() => {
    if (onChainPriceWei !== undefined) {
      return (Number(onChainPriceWei) / 1e18).toString();
    }
    return '0';
  }, [onChainPriceWei]);

  // State: is domain available?
  const isAvailable = isContractValid ? onChainAvailable ?? true : true;

  const handleRegisterClick = () => {
    if (!cleanName) return;
    onSelectDomain(cleanName, estimatedPrice);
  };

  return (
    <div className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center z-10">
      
      {/* Network & Explorer Badges */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-semibold uppercase tracking-wider animate-pulse-glow">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>BOT Chain Mainnet (677)</span>
        </div>

        <a
          href="https://scan.botchain.ai"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide transition-all shadow-sm group"
        >
          <span>Mainnet Explorer</span>
          <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </a>

        {isContractValid && (
          <a
            href={`https://scan.botchain.ai/address/${BNS_CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold tracking-wide transition-all shadow-sm group"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Contract: {BNS_CONTRACT_ADDRESS.slice(0, 6)}...{BNS_CONTRACT_ADDRESS.slice(-4)}</span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        )}
      </div>

      {/* Hero Headline */}
      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6">
        Your Web3 Identity on <br />
        <span className="text-gradient">Botchain Network</span>
      </h1>

      <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
        Claim your <span className="text-cyan-400 font-semibold">.bot</span> domain name. Replace complex hexadecimal addresses with simple, memorable decentralized names.
      </p>

      {/* Main Search Box */}
      <div className="max-w-2xl mx-auto">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-60 transition duration-500"></div>
          
          <div className="relative flex flex-col sm:flex-row items-center gap-2 bg-[#0c101b] border border-slate-700/60 rounded-2xl p-2.5 shadow-2xl">
            <div className="flex items-center flex-1 w-full pl-3 gap-2">
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search your favorite name (e.g. satoshi, alex, ai)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-white placeholder-slate-500 text-lg sm:text-xl focus:outline-none font-medium"
              />
              <span className="font-mono text-cyan-400 font-bold text-lg pr-3">.bot</span>
            </div>

            <button
              onClick={handleRegisterClick}
              disabled={!cleanName}
              className="w-full sm:w-auto btn-primary whitespace-nowrap text-base py-3 px-7"
            >
              <span>Search & Claim</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Search Status Card */}
        {cleanName && (
          <div className="mt-6 glass-panel p-5 text-left animate-float">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-white font-mono">{cleanName}<span className="text-cyan-400">.bot</span></h3>
                  {isAvailable ? (
                    <span className="badge-available">
                      <CheckCircle className="w-3.5 h-3.5" /> Available
                    </span>
                  ) : (
                    <span className="badge-taken">
                      <XCircle className="w-3.5 h-3.5" /> Taken
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  Cost: 
                  {parseFloat(estimatedPrice) === 0 ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                      0 BOT (Free Promo 🎉)
                    </span>
                  ) : (
                    <strong className="text-slate-200">{estimatedPrice} BOT / yr</strong>
                  )}
                  <span className="text-slate-500">({cleanName.length} character tier)</span>
                </p>
              </div>

              <button
                onClick={handleRegisterClick}
                disabled={!isAvailable}
                className="btn-primary py-2.5 px-6 text-sm"
              >
                {isAvailable ? 'Register (Free)' : 'View Domain Details'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feature Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 max-w-4xl mx-auto text-left">
        <div className="glass-panel p-5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          <h4 className="text-white font-bold text-base mb-1">Instant Resolution</h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            Send and receive tokens, NFTs, and messages on Botchain with human-readable names.
          </p>
        </div>

        <div className="glass-panel p-5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <h4 className="text-white font-bold text-base mb-1">100% On-Chain Ownership</h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            Full decentralization on BOT Chain Mainnet EVM. Transfer, update records, and retain total control.
          </p>
        </div>

        <div className="glass-panel p-5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <h4 className="text-white font-bold text-base mb-1">Subdomains & Profiles</h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            Create unlimited subdomains (e.g., pay.alex.bot) and link avatars, socials, and IPFS sites.
          </p>
        </div>
      </div>

      {/* Pricing Tiers Table */}
      <div className="mt-14 glass-panel p-6 max-w-3xl mx-auto text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            Registration Pricing Tiers
          </h3>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold w-fit">
            <Sparkles className="w-3.5 h-3.5" /> 2-Week Launch Promo: 100% FREE (0 BOT)
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3.5 rounded-xl bg-white/5 border border-emerald-500/30">
            <div className="text-xs text-slate-400 font-medium">1-2 Characters</div>
            <div className="text-lg font-bold text-emerald-400 mt-1">0 BOT</div>
            <div className="text-[10px] text-slate-500 line-through">Regular: 50 BOT</div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/5 border border-emerald-500/30">
            <div className="text-xs text-slate-400 font-medium">3 Characters</div>
            <div className="text-lg font-bold text-emerald-400 mt-1">0 BOT</div>
            <div className="text-[10px] text-slate-500 line-through">Regular: 20 BOT</div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/5 border border-emerald-500/30">
            <div className="text-xs text-slate-400 font-medium">4 Characters</div>
            <div className="text-lg font-bold text-emerald-400 mt-1">0 BOT</div>
            <div className="text-[10px] text-slate-500 line-through">Regular: 10 BOT</div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/5 border border-emerald-500/30">
            <div className="text-xs text-slate-400 font-medium">5+ Characters</div>
            <div className="text-lg font-bold text-emerald-400 mt-1">0 BOT</div>
            <div className="text-[10px] text-slate-500 line-through">Regular: 2 BOT</div>
          </div>
        </div>
      </div>

    </div>
  );
}
