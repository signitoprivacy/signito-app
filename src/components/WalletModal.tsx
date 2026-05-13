import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import type { WalletName } from "@solana/wallet-adapter-base";

interface WalletModalProps {
  onClose: () => void;
}

export function WalletModal({ onClose }: WalletModalProps) {
  const { wallets, select, connect } = useWallet();

  const handleConnect = (walletName: WalletName) => {
    select(walletName);
    onClose();
    setTimeout(() => {
      connect().catch(() => {});
    }, 50);
  };

  const displayed = wallets.length > 0
    ? wallets.map((w) => ({
        name: w.adapter.name,
        readyState: w.readyState,
        icon: w.adapter.icon,
      }))
    : [
        { name: "Phantom", readyState: WalletReadyState.NotDetected, icon: null },
        { name: "Solflare", readyState: WalletReadyState.NotDetected, icon: null },
        { name: "Coinbase Wallet", readyState: WalletReadyState.NotDetected, icon: null },
      ];

  const getStatusLabel = (state: WalletReadyState) => {
    if (state === WalletReadyState.Installed) return "Detected";
    if (state === WalletReadyState.Loadable) return "Detected";
    return "Not installed";
  };

  const getStatusColor = (state: WalletReadyState) => {
    if (state === WalletReadyState.Installed || state === WalletReadyState.Loadable) {
      return "text-[#FF6B00]";
    }
    return "text-[#888888]";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="card w-full max-w-sm relative" data-testid="wallet-modal">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#888888] hover:text-white"
        >
          X
        </button>

        <h2 className="text-white font-['Space_Grotesk'] text-xl font-bold mb-2">Connect Wallet</h2>
        <p className="text-[#888888] text-xs font-['Inter'] mb-6">Select a wallet installed in your browser.</p>

        <div className="space-y-3">
          {displayed.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => handleConnect(wallet.name as WalletName)}
              disabled={wallet.readyState === WalletReadyState.NotDetected}
              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] hover:border-[#FF6B00] disabled:opacity-40 disabled:cursor-not-allowed rounded p-4 flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-3">
                {wallet.icon && (
                  <img src={wallet.icon} alt={wallet.name} className="w-6 h-6 rounded" />
                )}
                <span className="text-white font-['Inter'] font-medium">{wallet.name}</span>
              </div>
              <span className={`text-xs font-['JetBrains_Mono'] ${getStatusColor(wallet.readyState)}`}>
                {getStatusLabel(wallet.readyState)}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-[#2A2A2A]">
          <p className="text-[#888888] text-xs font-['Inter'] text-center">
            No wallet? Install{" "}
            <a
              href="https://phantom.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF6B00] hover:text-white transition-colors"
            >
              Phantom
            </a>
            {", "}
            <a
              href="https://solflare.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF6B00] hover:text-white transition-colors"
            >
              Solflare
            </a>
            {", or "}
            <a
              href="https://www.coinbase.com/wallet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF6B00] hover:text-white transition-colors"
            >
              Coinbase Wallet
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
