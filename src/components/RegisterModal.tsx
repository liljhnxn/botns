'use client';

import React, { useState } from 'react';
import { X, Check, AlertCircle, Loader2, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi';
import { parseEther } from 'viem';
import { BNS_CONTRACT_ADDRESS, BNS_ABI } from '@/contracts/bnsContract';
import { botchainTestnet } from '@/config/chains';

interface RegisterModalProps {
  domainName: string;
  basePricePerYear: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (name: string) => void;
}

export default function RegisterModal({
  domainName,
  basePricePerYear,
  isOpen,
  onClose,
  onSuccess,
}: RegisterModalProps) {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [duration, setDuration] = useState<number>(1);
  const [resolvedAddr, setResolvedAddr] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulatedSuccess, setSimulatedSuccess] = useState<boolean>(false);

  const isContractReady = BNS_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000';
  const isCorrectChain = chainId === botchainTestnet.id;

  const totalBotCost = (parseFloat(basePricePerYear) * duration).toString();

  const {
    writeContract,
    data: txHash,
    isPending: isTxPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: isWaitingForTx, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  if (!isOpen) return null;

  const targetAddress = resolvedAddr.trim() || address || '0x0000000000000000000000000000000000000000';

  const handleRegister = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!isCorrectChain) {
      if (switchChain) {
        switchChain({ chainId: botchainTestnet.id });
      } else {
        alert('Please switch your wallet network to Botchain Testnet (Chain ID 968)');
      }
      return;
    }

    if (!isContractReady) {
      // Contract address not set yet - run simulation mode for preview
      setIsSimulating(true);
      setTimeout(() => {
        setIsSimulating(false);
        setSimulatedSuccess(true);
        onSuccess(domainName);
      }, 1500);
      return;
    }

    try {
      writeContract({
        address: BNS_CONTRACT_ADDRESS,
        abi: BNS_ABI,
        functionName: 'register',
        args: [domainName, targetAddress as `0x${string}`, BigInt(duration)],
        value: parseEther(totalBotCost),
      });
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  const isCompleted = isTxSuccess || simulatedSuccess;
  const isBusy = isTxPending || isWaitingForTx || isSimulating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg glass-panel glass-glow p-6 sm:p-8 bg-[#0d121e] border-slate-700/70 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Botchain Domain Registration</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-mono flex items-center gap-2">
            <span>{domainName}</span>
            <span className="text-cyan-400">.bot</span>
          </h2>
        </div>

        {isCompleted ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Registration Successful!</h3>
            <p className="text-sm text-slate-400 mb-6">
              Congratulations! <strong className="text-cyan-400">{domainName}.bot</strong> is now registered to your wallet on Botchain Testnet.
            </p>

            {txHash && (
              <a
                href={`https://scan.bohr.life/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 hover:underline mb-6"
              >
                <span>View on BohrScan Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              onClick={() => {
                onClose();
                onSuccess(domainName);
              }}
              className="btn-primary w-full py-3"
            >
              Go to My Domains
            </button>
          </div>
        ) : (
          <div>
            {/* Duration Selector */}
            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Registration Period
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 5].map((yrs) => (
                  <button
                    key={yrs}
                    type="button"
                    onClick={() => setDuration(yrs)}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      duration === yrs
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/30'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {yrs} {yrs === 1 ? 'Year' : 'Years'}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolved Address */}
            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Resolved Wallet Address (Recipient)
              </label>
              <input
                type="text"
                placeholder={address || '0x...'}
                value={resolvedAddr}
                onChange={(e) => setResolvedAddr(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Leave empty to automatically resolve to your connected wallet.
              </p>
            </div>

            {/* Price Summary Breakdown */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 mb-6 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Annual Rate:</span>
                <span className="font-mono text-slate-200">{basePricePerYear} BOT / yr</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Duration:</span>
                <span className="font-mono text-slate-200">{duration} {duration === 1 ? 'year' : 'years'}</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm font-bold text-white">
                <span>Total Due:</span>
                <span className="text-cyan-400 text-lg font-mono">{totalBotCost} BOT</span>
              </div>
            </div>

            {/* Warning if Contract Address Not Set in .env */}
            {!isContractReady && (
              <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Contract address is not yet configured. Clicking Register will run in simulated preview mode. Deploy `BotNameService.sol` to enable real on-chain transactions.
                </span>
              </div>
            )}

            {/* Write Error Feedback */}
            {writeError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="break-all">{writeError.message.slice(0, 120)}...</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1 py-3 text-sm"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRegister}
                disabled={isBusy}
                className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm & Register</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
