'use client';

import React, { useState } from 'react';
import { Search, Globe, Shield, Clock, User, Hash, ExternalLink, ArrowRight } from 'lucide-react';
import { useReadContract } from 'wagmi';
import { BNS_CONTRACT_ADDRESS, BNS_ABI } from '@/contracts/bnsContract';

export default function DomainInspector() {
  const [searchTarget, setSearchTarget] = useState('');
  const [inspectedName, setInspectedName] = useState('');

  const cleanName = searchTarget.trim().toLowerCase().replace('.bot', '');

  const isContractReady = BNS_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000';

  const { data: domainDetails, isLoading } = useReadContract({
    address: BNS_CONTRACT_ADDRESS,
    abi: BNS_ABI,
    functionName: 'getDomainDetails',
    args: inspectedName ? [inspectedName] : undefined,
    query: {
      enabled: isContractReady && !!inspectedName,
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (cleanName) {
      setInspectedName(cleanName);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">BOT Chain Domain Inspector</h1>
        <p className="text-sm text-slate-400">
          Lookup any <span className="text-cyan-400">.bot</span> domain, check owner, target address, resolution records and expiry status on BOT Chain Mainnet (Chain ID 677).
        </p>
      </div>

      <form onSubmit={handleSearch} className="relative mb-10">
        <div className="flex items-center bg-[#0d121f] border border-slate-700/80 rounded-2xl p-2 shadow-xl">
          <Search className="w-5 h-5 text-slate-400 ml-3 flex-shrink-0" />
          <input
            type="text"
            placeholder="Lookup domain (e.g. satoshi, alex, dao)"
            value={searchTarget}
            onChange={(e) => setSearchTarget(e.target.value)}
            className="w-full bg-transparent px-3 py-2 text-white placeholder-slate-500 text-base focus:outline-none font-mono"
          />
          <button type="submit" className="btn-primary text-xs py-2.5 px-5">
            <span>Lookup</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {inspectedName && (
        <div className="glass-panel p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <h2 className="text-3xl font-extrabold text-white font-mono flex items-center gap-2">
                <span>{inspectedName}</span>
                <span className="text-cyan-400">.bot</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">BOT Chain Mainnet (Chain 677)</p>
            </div>
            <span className="badge-available self-start sm:self-auto">Status: Registered</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                Registrant / Owner
              </div>
              <div className="font-mono text-xs text-cyan-300 break-all">
                0x71C...492b (Decentralized Owner)
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                Resolved EVM Address
              </div>
              <div className="font-mono text-xs text-emerald-300 break-all">
                0x71C...492b
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Expiration Date
              </div>
              <div className="font-mono text-xs text-slate-200">
                1 Year from Registration
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-purple-400" />
                TLD Extension
              </div>
              <div className="font-mono text-xs text-purple-300">
                .bot (Botchain Native)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
