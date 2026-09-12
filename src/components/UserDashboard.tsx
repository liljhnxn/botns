'use client';

import React, { useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { BNS_CONTRACT_ADDRESS, BNS_ABI } from '@/contracts/bnsContract';
import {
  Globe,
  User,
  Clock,
  Plus,
  ArrowUpRight,
  Sparkles,
  Edit3,
  CheckCircle2,
  ExternalLink,
  Shield,
  Layers,
  Save,
  Twitter,
  Github,
  Mail,
  Share2,
} from 'lucide-react';

interface UserDashboardProps {
  onRegisterClick: () => void;
}

export default function UserDashboard({ onRegisterClick }: UserDashboardProps) {
  const { address, isConnected } = useAccount();

  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'records' | 'subdomains' | 'transfer'>('records');

  // Form states for record updates
  const [resolvedAddressInput, setResolvedAddressInput] = useState('');
  const [twitterInput, setTwitterInput] = useState('');
  const [githubInput, setGithubInput] = useState('');
  const [avatarInput, setAvatarInput] = useState('');
  const [contentHashInput, setContentHashInput] = useState('');

  // Subdomain form
  const [subLabelInput, setSubLabelInput] = useState('');
  const [subResolvedAddr, setSubResolvedAddr] = useState('');
  const [subdomainList, setSubdomainList] = useState<{ [domain: string]: string[] }>({});

  // Transfer form
  const [transferRecipient, setTransferRecipient] = useState('');

  // Read User Registered Domains
  const isContractReady = BNS_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000';

  const { data: onChainDomains } = useReadContract({
    address: BNS_CONTRACT_ADDRESS,
    abi: BNS_ABI,
    functionName: 'getUserDomains',
    args: address ? [address] : undefined,
    query: {
      enabled: isContractReady && !!address,
    },
  });

  const { data: primaryDomain } = useReadContract({
    address: BNS_CONTRACT_ADDRESS,
    abi: BNS_ABI,
    functionName: 'reverseRecords',
    args: address ? [address] : undefined,
    query: {
      enabled: isContractReady && !!address,
    },
  });

  // Local demo fallback if contract not deployed yet
  const [demoDomains, setDemoDomains] = useState<string[]>(['sample', 'botchain-hero']);

  const domainsList = isContractReady && onChainDomains ? (onChainDomains as string[]) : demoDomains;
  const currentDomain = selectedDomain || domainsList[0] || '';

  const { writeContract } = useWriteContract();

  const handleSetPrimary = (domain: string) => {
    if (isContractReady) {
      writeContract({
        address: BNS_CONTRACT_ADDRESS,
        abi: BNS_ABI,
        functionName: 'setPrimaryName',
        args: [domain],
      });
    } else {
      alert(`Primary domain set to ${domain}.bot (Preview Mode)`);
    }
  };

  const handleSaveRecords = () => {
    if (!currentDomain) return;
    if (isContractReady) {
      if (resolvedAddressInput) {
        writeContract({
          address: BNS_CONTRACT_ADDRESS,
          abi: BNS_ABI,
          functionName: 'setResolvedAddress',
          args: [currentDomain, resolvedAddressInput as `0x${string}`],
        });
      }
      if (twitterInput) {
        writeContract({
          address: BNS_CONTRACT_ADDRESS,
          abi: BNS_ABI,
          functionName: 'setTextRecord',
          args: [currentDomain, 'com.twitter', twitterInput],
        });
      }
      if (avatarInput) {
        writeContract({
          address: BNS_CONTRACT_ADDRESS,
          abi: BNS_ABI,
          functionName: 'setTextRecord',
          args: [currentDomain, 'avatar', avatarInput],
        });
      }
    } else {
      alert('Records saved successfully (Preview Mode)!');
    }
  };

  const handleCreateSubdomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subLabelInput || !currentDomain) return;

    const fullSub = `${subLabelInput.toLowerCase()}.${currentDomain}.bot`;
    if (isContractReady) {
      writeContract({
        address: BNS_CONTRACT_ADDRESS,
        abi: BNS_ABI,
        functionName: 'createSubdomain',
        args: [currentDomain, subLabelInput.toLowerCase(), (subResolvedAddr || address) as `0x${string}`],
      });
    }

    setSubdomainList((prev) => ({
      ...prev,
      [currentDomain]: [...(prev[currentDomain] || []), fullSub],
    }));
    setSubLabelInput('');
    setSubResolvedAddr('');
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-5">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">Connect Your Wallet</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">
          Connect your Web3 wallet to manage your registered <span className="text-cyan-400">.bot</span> domains, configure subdomains, and edit text records.
        </p>
        {/* @ts-ignore */}
        <appkit-button />
      </div>
    );
  }

  if (domainsList.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-5">
          <Globe className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">No Domains Registered Yet</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">
          You haven't registered any <span className="text-cyan-400">.bot</span> domain names yet. Claim your first Botchain identity now!
        </p>
        <button onClick={onRegisterClick} className="btn-primary py-3 px-8 text-base">
          <Plus className="w-4 h-4" />
          <span>Register a Domain</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Domain Management</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Connected: <span className="font-mono text-cyan-400">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            {primaryDomain && (
              <span className="ml-2 px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-xs">
                Primary: {primaryDomain}.bot
              </span>
            )}
          </p>
        </div>

        <button onClick={onRegisterClick} className="btn-primary py-2.5 px-5 text-sm self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Register New .bot</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Domain List */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Your .BOT Names ({domainsList.length})</h3>
          
          {domainsList.map((name) => {
            const isSelected = name === currentDomain;
            const isPrimary = primaryDomain === name;

            return (
              <div
                key={name}
                onClick={() => setSelectedDomain(name)}
                className={`p-4 rounded-xl cursor-pointer border transition-all ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500/50 shadow-lg shadow-blue-500/10'
                    : 'bg-[#0d121f] border-slate-800 hover:border-slate-700 hover:bg-[#121827]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-mono font-bold text-white text-base flex items-center gap-1.5">
                    <span>{name}</span>
                    <span className="text-cyan-400">.bot</span>
                  </div>
                  {isPrimary && (
                    <span className="text-[10px] uppercase font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded">
                      Primary
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-slate-500" /> Active 1 Year
                  </span>
                  <span className="text-cyan-400 font-medium hover:underline text-[11px]">Manage →</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Active Domain Manager */}
        {currentDomain && (
          <div className="lg:col-span-8 glass-panel p-6 sm:p-8">
            
            {/* Top Bar for Selected Domain */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                    {currentDomain}<span className="text-cyan-400">.bot</span>
                  </h2>
                  <span className="badge-available">Active</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Controlled by <span className="font-mono text-slate-300">{address?.slice(0, 8)}...{address?.slice(-6)}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSetPrimary(currentDomain)}
                  className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Set as Primary</span>
                </button>
              </div>
            </div>

            {/* Sub Tabs */}
            <div className="flex items-center gap-2 mt-6 mb-6 border-b border-slate-800 pb-2">
              <button
                onClick={() => setActiveSubTab('records')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeSubTab === 'records'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Records & Resolution
              </button>
              <button
                onClick={() => setActiveSubTab('subdomains')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeSubTab === 'subdomains'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Subdomains ({subdomainList[currentDomain]?.length || 0})
              </button>
              <button
                onClick={() => setActiveSubTab('transfer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeSubTab === 'transfer'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Transfer Ownership
              </button>
            </div>

            {/* TAB 1: Records */}
            {activeSubTab === 'records' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Target EVM / BOT Address
                  </label>
                  <input
                    type="text"
                    placeholder={address || '0x...'}
                    value={resolvedAddressInput}
                    onChange={(e) => setResolvedAddressInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Twitter className="w-3.5 h-3.5 text-cyan-400" />
                      Twitter / X Handle
                    </label>
                    <input
                      type="text"
                      placeholder="@username"
                      value={twitterInput}
                      onChange={(e) => setTwitterInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5 text-purple-400" />
                      GitHub Username
                    </label>
                    <input
                      type="text"
                      placeholder="github-profile"
                      value={githubInput}
                      onChange={(e) => setGithubInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Avatar URL or NFT Image URI
                  </label>
                  <input
                    type="text"
                    placeholder="https://... or ipfs://..."
                    value={avatarInput}
                    onChange={(e) => setAvatarInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="pt-2">
                  <button onClick={handleSaveRecords} className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    <span>Save & Update Records</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Subdomains */}
            {activeSubTab === 'subdomains' && (
              <div>
                <form onSubmit={handleCreateSubdomain} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 mb-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                    Create New Subdomain
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <input
                        type="text"
                        placeholder="e.g. pay, vault, blog"
                        value={subLabelInput}
                        onChange={(e) => setSubLabelInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Target Address (Optional)"
                        value={subResolvedAddr}
                        onChange={(e) => setSubResolvedAddr(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary text-xs py-2 px-4">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Subdomain ({subLabelInput || 'sub'}.{currentDomain}.bot)</span>
                  </button>
                </form>

                <h4 className="text-xs font-semibold text-slate-400 mb-2">Existing Subdomains</h4>
                {(!subdomainList[currentDomain] || subdomainList[currentDomain].length === 0) ? (
                  <p className="text-xs text-slate-500 italic">No subdomains created yet.</p>
                ) : (
                  <div className="space-y-2">
                    {subdomainList[currentDomain].map((sub) => (
                      <div key={sub} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                        <span className="font-mono text-cyan-400 font-bold text-xs">{sub}</span>
                        <span className="text-[11px] text-slate-500 font-mono">Resolves to: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Transfer */}
            {activeSubTab === 'transfer' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Transfer full control and ownership of <strong className="text-white">{currentDomain}.bot</strong> to a new wallet address. This action is irreversible.
                </p>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={transferRecipient}
                    onChange={(e) => setTransferRecipient(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-rose-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => alert(`Domain transfer initiated to ${transferRecipient}`)}
                  disabled={!transferRecipient}
                  className="btn-secondary text-xs py-2.5 px-6 border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                >
                  Confirm Transfer Ownership
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
