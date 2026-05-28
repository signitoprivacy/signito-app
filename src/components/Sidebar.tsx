import React from "react";
import { Link, useLocation } from "wouter";
import { ChainSelector } from "./ChainSelector";
import { useActiveChain } from "@/lib/evm-wallet";

const SOLANA_NAV_ITEMS = [
  { path: "/app",               label: "Transfer",                  cs: false },
  { path: "/app/batch-zk",     label: "Batch ZK Transfer",         cs: true  },
  { path: "/app/private-swap", label: "Private Swap",              cs: true  },
  { path: "/app/private-dex",  label: "Private DEX / Limit Order", cs: true  },
];

const BASE_NAV_ITEMS = [
  { path: "/app/base", label: "Transfer", cs: false },
];

export function Sidebar() {
  const [location] = useLocation();
  const { activeChain } = useActiveChain();

  const navItems = activeChain === "base" ? BASE_NAV_ITEMS : SOLANA_NAV_ITEMS;

  return (
    <aside className="hidden md:flex fixed top-[56px] left-0 bottom-0 w-[220px] bg-[#0A0A0A] border-r-[2px] border-[#1A1A1A] flex-col pt-5 pb-5 z-50">
      <div className="px-4 mb-4">
        <ChainSelector />
      </div>

      <div className="px-5 mb-2">
        <span className="text-[#444444] font-['JetBrains_Mono'] text-[10px] font-bold tracking-widest uppercase">Transfer</span>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.path === "/app"
            ? location === "/app"
            : location.startsWith(item.path);

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`sidebar-item ${isActive ? "sidebar-item-active" : ""}`}
            >
              <span className="flex-1">{item.label}</span>
              {item.cs && (
                <span className="font-['JetBrains_Mono'] text-[8px] tracking-widest uppercase border border-[#2A2A2A] text-[#555555] px-1.5 py-0.5 shrink-0">CS</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 mt-auto">
        <span className="text-[#444444] font-['JetBrains_Mono'] text-[10px] font-bold tracking-widest uppercase mb-2 block">Network</span>
        <div className="bg-[#141414] border border-[#1A1A1A] p-2.5 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          <span className="text-[#888888] text-xs font-['JetBrains_Mono']">
            {activeChain === "base" ? "Base Sepolia" : "Solana Mainnet"}
          </span>
        </div>
      </div>
    </aside>
  );
}
