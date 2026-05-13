import React, { useState } from "react";
import { Link } from "wouter";
import { useWallet } from "../lib/wallet";
import { WalletModal } from "./WalletModal";
import { VaultSyncModal } from "./VaultSyncModal";
import { AddressChip } from "./AddressChip";
import signitoLogo from "@assets/signito-logo-nobg.png";

export function NavBar() {
  const { connected, publicKey, disconnect } = useWallet();
  const [modalOpen, setModalOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-[56px] bg-[#0A0A0A] border-b border-[#2A2A2A] z-50 flex items-center justify-between px-3 sm:px-6 md:px-8">
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <Link href="/" className="flex items-center gap-1.5 no-underline shrink-0">
            <img src={signitoLogo} alt="Signito" className="w-8 h-8 sm:w-9 sm:h-9 object-contain" />
            <span className="font-['Space_Grotesk'] font-bold text-white tracking-widest text-sm hidden md:block">
              SIGNITO
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/app"
              className="font-['Space_Grotesk'] text-sm font-medium transition-colors no-underline px-1 py-0.5 whitespace-nowrap text-[#888888] hover:text-white"
            >
              Portfolio
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!connected ? (
            <button
              className="bg-[#FF6B00] text-black font-['Space_Grotesk'] font-bold text-xs px-3 py-2 sm:px-4 sm:py-2 sm:text-sm border-0 hover:opacity-90 transition-opacity whitespace-nowrap"
              onClick={() => setModalOpen(true)}
              data-testid="button-connect-wallet"
            >
              Connect
            </button>
          ) : (
            <>
              <AddressChip address={publicKey!} chars={4} />
              <button
                className="border border-[#2A2A2A] text-[#888888] font-['Space_Grotesk'] text-xs px-2.5 py-1.5 hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors bg-transparent"
                onClick={() => setSyncOpen(true)}
                title="Sync vault on this device"
                data-testid="button-sync-vault"
              >
                Sync
              </button>
              <button
                className="border border-[#2A2A2A] text-[#888888] font-['Space_Grotesk'] text-xs px-2.5 py-1.5 hover:border-white hover:text-white transition-colors bg-transparent"
                onClick={disconnect}
                data-testid="button-disconnect-wallet"
              >
                <span className="hidden sm:inline">Disconnect</span>
                <span className="sm:hidden">Out</span>
              </button>
            </>
          )}
        </div>
      </nav>

      {modalOpen && <WalletModal onClose={() => setModalOpen(false)} />}
      {syncOpen && <VaultSyncModal onClose={() => setSyncOpen(false)} />}
    </>
  );
}
