import React from "react";

export type AppSection = "portfolio" | "vault" | "stealth" | "airsign" | "history";
export type MobileTab = "wallet" | "shielded" | "air";

interface BottomBarProps {
  activeTab: MobileTab;
  onTab: (t: MobileTab) => void;
}

const ITEMS: Array<{ tab: MobileTab; label: string; icon: React.ReactNode }> = [
  {
    tab: "wallet",
    label: "Wallet",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="2" width="7" height="7" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="11" y="2" width="7" height="7" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="2" y="11" width="7" height="7" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="11" y="11" width="7" height="7" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    tab: "shielded",
    label: "Shielded",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L17 5.5V10.5C17 14 13.5 17 10 18C6.5 17 3 14 3 10.5V5.5L10 2Z" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    tab: "air",
    label: "airToken",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 16L10 4L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
        <path d="M6.5 12H13.5" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="3" y1="3" x2="17" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
      </svg>
    ),
  },
];

export function BottomBar({ activeTab, onTab }: BottomBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[56px] bg-[#0A0A0A] border-t-[3px] border-[#2A2A2A] z-50 flex md:hidden">
      {ITEMS.map((item) => {
        const active = activeTab === item.tab;
        return (
          <button
            key={item.tab}
            onClick={() => onTab(item.tab)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors border-0 bg-transparent cursor-pointer relative ${
              active ? "text-[#FF6B00]" : "text-[#555555] hover:text-[#888888]"
            }`}
          >
            {item.icon}
            <span className="font-['JetBrains_Mono'] text-[9px] tracking-wider uppercase">
              {item.label}
            </span>
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF6B00]" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
