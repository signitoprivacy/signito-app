import React, { useState } from "react";
import { Link, useLocation } from "wouter";

const NAV_ITEMS = [
  { path: "/app",           label: "Transfer",               cs: false },
  { path: "/app/batch-zk",       label: "Batch ZK Transfer",      cs: true  },
  { path: "/app/private-swap",   label: "Private Swap",           cs: true  },
  { path: "/app/private-dex",    label: "Private DEX / Limit Order", cs: true  },
];

export function MobileAppMenu() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();

  const isAppPage = location === "/app" || location.startsWith("/app/");
  if (!isAppPage) return null;

  return (
    <>
      <button
        className="md:hidden flex items-center justify-center w-10 h-10 shrink-0 border-0 bg-transparent cursor-pointer text-[#888888] hover:text-white transition-colors"
        onClick={() => setOpen(true)}
        aria-label="Menu"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <line x1="2" y1="4"  x2="16" y2="4"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
          <line x1="2" y1="9"  x2="16" y2="9"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
          <line x1="2" y1="14" x2="16" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/75 z-[70] md:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 w-[270px] bg-[#0A0A0A] border-r-[3px] border-[#1A1A1A] z-[80] flex flex-col md:hidden">
            <div className="flex items-center justify-between px-5 h-[56px] border-b border-[#1A1A1A] shrink-0">
              <span className="font-['Space_Grotesk'] font-bold text-white tracking-widest text-sm">SIGNITO</span>
              <button
                className="text-[#888888] hover:text-white border-0 bg-transparent cursor-pointer p-1"
                onClick={() => setOpen(false)}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <line x1="3" y1="3" x2="15" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
                  <line x1="15" y1="3" x2="3"  y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
                </svg>
              </button>
            </div>

            <div className="px-5 pt-5 pb-2">
              <span className="text-[#444444] font-['JetBrains_Mono'] text-[10px] font-bold tracking-widest uppercase">Transfer</span>
            </div>

            <nav className="px-3 space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const isActive = item.path === "/app"
                  ? location === "/app"
                  : location === item.path;

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`sidebar-item ${isActive ? "sidebar-item-active" : ""}`}
                    onClick={() => setOpen(false)}
                  >
                    <span className="flex-1">{item.label}</span>
                    {item.cs && (
                      <span className="font-['JetBrains_Mono'] text-[8px] tracking-widest uppercase border border-[#2A2A2A] text-[#555555] px-1.5 py-0.5 shrink-0">CS</span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto px-5 pb-6">
              <span className="text-[#444444] font-['JetBrains_Mono'] text-[10px] font-bold tracking-widest uppercase mb-2 block">Network</span>
              <div className="bg-[#141414] border border-[#1A1A1A] p-2.5 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                <span className="text-[#888888] text-xs font-['JetBrains_Mono']">Solana Mainnet</span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
