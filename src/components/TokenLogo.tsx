import React from "react";
import zecLogoUrl from "@assets/image_1778411971152.png";
import ssolLogoUrl from "@assets/image_1779943018419.png";

const LOGOS: Record<string, string> = {
  SOL:  ssolLogoUrl,
  USDC: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  JUP:  "https://static.jup.ag/jup/icon.png",
  ZEC:  zecLogoUrl,
};

const BG: Record<string, string> = {
  SOL:  "#0A0A0A",
  USDC: "#2775CA",
  JUP:  "#19FB9B",
  ZEC:  "#F4B728",
};

const SCALE: Record<string, number> = {};

interface TokenLogoProps {
  symbol: string;
  size?: number;
  className?: string;
}

export function TokenLogo({ symbol, size = 20, className = "" }: TokenLogoProps) {
  const base = symbol.replace(/^s/, "").replace(/^a/, "");
  const logo = LOGOS[base];
  const bg = BG[base] ?? "#2A2A2A";
  const scale = SCALE[base];

  const sz = `${size}px`;

  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 flex items-center justify-center ${className}`}
      style={{ width: sz, height: sz, background: bg }}
    >
      {logo ? (
        <img
          src={logo}
          alt={base}
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: scale ? `scale(${scale})` : undefined }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <span style={{ fontSize: size * 0.35, fontWeight: 700, color: "#fff" }}>
          {base.slice(0, 3).toUpperCase()}
        </span>
      )}
    </div>
  );
}
