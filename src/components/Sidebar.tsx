import React from "react";
import { Link, useLocation } from "wouter";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { path: "/app/vault", label: "SafeVault", tag: "OTS" },
    { path: "/app/stealth", label: "StealthSend", tag: "ZK" },
    { path: "/app/airsign", label: "AirSign", tag: "Offline" },
    { path: "/app/history", label: "History", tag: "" }
  ];

  return (
    <aside className="hidden md:flex fixed top-[56px] left-0 bottom-0 w-[220px] bg-[#0A0A0A] border-r border-[#2A2A2A] flex-col pt-6 pb-4">
      <div className="px-4 mb-2">
        <span className="text-[#888888] font-['JetBrains_Mono'] text-xs font-bold tracking-wider uppercase">APP</span>
      </div>
      
      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.path || location.startsWith(`${item.path}/`);
          return (
            <Link key={item.path} href={item.path} className={`sidebar-item ${isActive ? "sidebar-item-active" : ""}`}>
              <span className="flex-1">{item.label}</span>
              {item.tag && <span className={item.tag === "OTS" ? "tag tag-orange" : "tag"}>{item.tag}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 mt-auto space-y-4">
        <div>
          <span className="text-[#888888] font-['JetBrains_Mono'] text-xs font-bold tracking-wider uppercase mb-2 block">NETWORK</span>
          <div className="bg-[#141414] border border-[#2A2A2A] rounded p-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-white text-xs font-['Inter']">Solana Mainnet</span>
          </div>
        </div>
        
        <Link href="/status" className="text-[#888888] hover:text-white text-xs font-['Inter'] flex items-center gap-2 py-2">
          System Status
        </Link>
      </div>
    </aside>
  );
}
