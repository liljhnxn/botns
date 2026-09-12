'use client';

import React, { useState } from 'react';
import { Terminal, Copy, Check, FileCode, Layers, ShieldCheck, Sparkles } from 'lucide-react';
import { BNS_CONTRACT_ADDRESS } from '@/contracts/bnsContract';

export default function ContractDeployGuide() {
  const [copied, setCopied] = useState<string | null>(null);
  const [contractAddressInput, setContractAddressInput] = useState('');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const remixGuide = `1. Open https://remix.ethereum.org
2. Create a new file 'BotNameService.sol' and paste the contract code from contracts/BotNameService.sol
3. Compile with Solidity Compiler 0.8.20+
4. Go to 'Deploy & Run Transactions', select Environment: 'Injected Provider - MetaMask'
5. Ensure your wallet is connected to Botchain Testnet (Chain ID 968, RPC: https://rpc.bohr.life)
6. Click 'Deploy' and confirm transaction in your wallet.
7. Copy the Deployed Contract Address and paste it into .env.local as NEXT_PUBLIC_BNS_CONTRACT_ADDRESS`;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-3">
          <FileCode className="w-3.5 h-3.5" />
          <span>Smart Contract Setup & Deployment</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Botchain Smart Contract Guide</h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Deploy <span className="text-cyan-400 font-mono">BotNameService.sol</span> to Botchain Testnet (Chain ID: 968) to enable live registration on-chain.
        </p>
      </div>

      {/* Network Specs */}
      <div className="glass-panel p-6 mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Botchain Testnet Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Network Name:</span>
            <span className="font-mono text-white font-bold">Botchain Testnet / Bohr</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Chain ID:</span>
            <span className="font-mono text-cyan-400 font-bold">968</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">RPC URL:</span>
            <span className="font-mono text-slate-200">https://rpc.bohr.life</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Native Token:</span>
            <span className="font-mono text-emerald-400 font-bold">BOT (18 decimals)</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex justify-between items-center sm:col-span-2">
            <span className="text-slate-400">Explorer URL:</span>
            <a href="https://scan.bohr.life" target="_blank" rel="noreferrer" className="font-mono text-cyan-400 hover:underline">
              https://scan.bohr.life
            </a>
          </div>
        </div>
      </div>

      {/* Contract Deployment Steps */}
      <div className="glass-panel p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            Quick Remix Deployment Steps
          </h3>
          <button
            onClick={() => copyToClipboard(remixGuide, 'guide')}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            {copied === 'guide' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied === 'guide' ? 'Copied' : 'Copy Instructions'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
          {remixGuide}
        </pre>
      </div>

      {/* Contract Address Status */}
      <div className="glass-panel p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Active Contract Address
        </h3>
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs text-cyan-300 break-all mb-4">
          {BNS_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000'
            ? '0x0000000000000000000000000000000000000000 (Simulated / Preview Mode Active)'
            : BNS_CONTRACT_ADDRESS}
        </div>
        <p className="text-xs text-slate-400">
          Set <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">NEXT_PUBLIC_BNS_CONTRACT_ADDRESS</code> in your <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">.env.local</code> file to link the deployed contract permanently.
        </p>
      </div>
    </div>
  );
}
