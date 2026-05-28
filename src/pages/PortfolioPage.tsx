import React, { useState } from "react";
import { useCluster } from "../main";
import { NavBar } from "../components/NavBar";
import { Sidebar } from "../components/Sidebar";
import { BottomBar, type AppSection, type MobileTab } from "../components/BottomBar";
import { AddressChip } from "../components/AddressChip";
import { ActionPanel, type ActionType, type PanelConfig } from "../components/ActionPanel";
import { VaultSection } from "../components/sections/VaultSection";
import { StealthSection } from "../components/sections/StealthSection";
import { AirSignSection } from "../components/sections/AirSignSection";
import { HistorySection } from "../components/sections/HistorySection";
import { useWallet } from "../lib/wallet";
import { WalletModal } from "../components/WalletModal";
import zecLogoUrl from "@assets/image_1778411971152.png";
import signitoLogoUrl from "@assets/signito-logo-nobg.png";
import {
  useGetPortfolio,
  getGetPortfolioQueryKey,
  useGetVaultBalances,
  getGetVaultBalancesQueryKey,
  useGetTransactions,
  getGetTransactionsQueryKey,
  useGetAirsignVouchers,
  getGetAirsignVouchersQueryKey,
  useGetAirsignMints,
  type Transaction,
} from "@workspace/api-client-react";

const TOKEN_BG: Record<string, string> = {
  SOL: "#9945FF",
  USDC: "#2775CA",
  USDT: "#26A17B",
  BONK: "#F79F1F",
  WIF: "#EC4899",
  JTO: "#22C55E",
  JUP: "#19FB9B",
  ZEC: "#F4B728",
  mSOL: "#84CC16",
  bSOL: "#F97316",
  stSOL: "#06B6D4",
};

const TOKEN_LOGOS: Record<string, string> = {
  SOL: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  USDC: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  JUP: "https://static.jup.ag/jup/icon.png",
  ZEC: zecLogoUrl,
};

const TOKEN_ICON_SCALE: Record<string, number> = {
  SOL: 1.2,
};

const DEFAULT_TOKENS = [
  { symbol: "SOL",  name: "Solana",   mint: "native" },
  { symbol: "USDC", name: "USD Coin", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
  { symbol: "JUP",  name: "Jupiter",  mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" },
  { symbol: "ZEC",  name: "Zcash",    mint: "A7bdiYdS5GjqGFtxf17ppRHtDKPkkRqbKtR27dxvQXaS" },
];

const COMING_SOON_BASE = new Set(["USDC", "JUP", "ZEC"]);
const AIRSIGN_COMING_SOON = new Set(["SOL", "USDC", "JUP", "ZEC"]);

function TokenIcon({ symbol, variant = "normal", large = false }: { symbol: string; variant?: "normal" | "airsign"; large?: boolean }) {
  const base = symbol.replace(/^s/, "").replace(/^a/, "");
  const bg = TOKEN_BG[base] ?? "#2A2A2A";
  const logo = TOKEN_LOGOS[base];
  const iconScale = TOKEN_ICON_SCALE[base];
  const isShielded = symbol.startsWith("s") && symbol.length > 1;
  const isAir = variant === "airsign";
  const sz = large ? "w-14 h-14" : "w-12 h-12";
  const textSz = large ? "text-base" : "text-sm";

  return (
    <div className={`relative ${sz} shrink-0`}>
      <div
        className={`${sz} rounded-full overflow-hidden flex items-center justify-center font-bold text-white ${textSz}`}
        style={{ background: bg }}
      >
        {logo ? (
          <img
            src={logo}
            alt={base}
            className="w-full h-full object-cover"
            style={iconScale ? { transform: `scale(${iconScale})` } : undefined}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          base.slice(0, 3).toUpperCase()
        )}
      </div>
      {isShielded && !isAir && (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#FF6B00] border border-[#141414] flex items-center justify-center">
          <svg width="9" height="10" viewBox="0 0 9 10" fill="none">
            <path d="M4.5 0.5L8.5 2V5.5C8.5 7.5 6.5 9 4.5 9.5C2.5 9 0.5 7.5 0.5 5.5V2L4.5 0.5Z" fill="#0A0A0A"/>
          </svg>
        </div>
      )}
      {isAir && (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#2A2A2A] border border-[#141414] flex items-center justify-center">
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M1.5 1.5L7.5 7.5" stroke="#888888" strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M2 4.5C2.8 3.7 3.85 3.25 5 3.25" stroke="#888888" strokeWidth="1.1" strokeLinecap="round"/>
            <path d="M3.2 6C3.7 5.5 4.3 5.25 5 5.25C5.4 5.25 5.78 5.35 6.1 5.53" stroke="#888888" strokeWidth="1.1" strokeLinecap="round"/>
            <circle cx="5" cy="7.3" r="0.7" fill="#888888"/>
          </svg>
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  label,
  variant,
  onClick,
  disabled = false,
  full = false,
  compact = false,
}: {
  label: string;
  variant: "orange" | "white" | "ghost";
  onClick: () => void;
  disabled?: boolean;
  full?: boolean;
  compact?: boolean;
}) {
  const active = {
    orange: "bg-[#FF6B00] text-black border-[#FF6B00] hover:opacity-90",
    white:  "bg-transparent text-white border-white hover:bg-white/5",
    ghost:  "bg-transparent text-[#888888] border-[#3A3A3A] hover:border-white hover:text-white",
  }[variant];
  const disabledCls = "bg-transparent text-[#3A3A3A] border-[#222222] cursor-not-allowed";
  const sizing = compact ? "text-[10px] px-2 py-1" : "text-[11px] px-3 py-1.5";

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`border font-['Space_Grotesk'] font-semibold transition-all whitespace-nowrap ${sizing} ${full ? "w-full" : ""} ${disabled ? disabledCls : active}`}
    >
      {label}
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="border border-[#1A1A1A] p-4 bg-[#0F0F0F] animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-[#2A2A2A] shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-16 bg-[#2A2A2A] rounded" />
          <div className="h-3 w-12 bg-[#1A1A1A] rounded" />
        </div>
      </div>
      <div className="h-6 w-24 bg-[#2A2A2A] rounded mb-3" />
      <div className="h-7 w-full bg-[#1A1A1A] rounded" />
    </div>
  );
}

type ColFilter = "wallet" | "shielded" | "air";

function timeAgo(ts: number | null | undefined): string {
  if (!ts) return "--";
  const diff = Date.now() - ts * 1000;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function filterTxs(txs: Transaction[], col: ColFilter): Transaction[] {
  if (col === "wallet") {
    return txs.filter((tx) => {
      const t = tx.type.toLowerCase();
      const tok = (tx.token ?? "").toLowerCase();
      return !t.includes("air") && !t.includes("voucher") && !tok.startsWith("a");
    });
  }
  if (col === "shielded") {
    return txs.filter((tx) => {
      const t = tx.type.toLowerCase();
      const tok = (tx.token ?? "").toLowerCase();
      return t.includes("shield") || t.includes("zk") || tok.startsWith("s");
    });
  }
  return txs.filter((tx) => {
    const t = tx.type.toLowerCase();
    const tok = (tx.token ?? "").toLowerCase();
    return t.includes("air") || t.includes("voucher") || tok.startsWith("a");
  });
}

function ColumnHistory({
  transactions,
  loading,
  col,
}: {
  transactions: Transaction[];
  loading: boolean;
  col: ColFilter;
}) {
  const { cluster } = useCluster();
  const [visible, setVisible] = useState(5);
  const filtered = filterTxs(transactions, col);
  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  return (
    <div className="flex-1 flex flex-col min-h-0 border-t-2 border-[#111111]">
      <div className="shrink-0 flex items-center gap-2 px-4 h-8 border-b border-[#111111]">
        <span className="font-['JetBrains_Mono'] text-[9px] tracking-widest uppercase text-[#333333]">History</span>
        {!loading && filtered.length > 0 && (
          <span className="font-['JetBrains_Mono'] text-[9px] text-[#282828]">{filtered.length}</span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-2 space-y-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-7 bg-[#0F0F0F] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-4 text-center">
            <p className="text-[#282828] text-[10px] font-['JetBrains_Mono']">no transactions yet</p>
          </div>
        ) : (
          <>
            <div>
              {shown.map((tx, i) => (
                <div
                  key={tx.signature}
                  className={`flex items-center gap-2 px-4 py-2 hover:bg-[#0D0D0D] transition-colors ${i < shown.length - 1 ? "border-b border-[#0F0F0F]" : ""}`}
                >
                  <span className="tag text-[9px] px-1.5 py-0.5 shrink-0 uppercase">{tx.type}</span>
                  {tx.token && (
                    <span className="text-[#555555] font-['JetBrains_Mono'] text-[10px] shrink-0">{tx.token}</span>
                  )}
                  {tx.amount != null && (
                    <span className="font-['JetBrains_Mono'] text-[11px] text-white font-bold tabular-nums shrink-0">
                      {tx.amount.toFixed(4)}
                    </span>
                  )}
                  <span
                    className={`ml-auto font-['JetBrains_Mono'] text-[9px] shrink-0 ${tx.status === "confirmed" ? "text-[#333333]" : "text-[#FF6B00]/50"}`}
                  >
                    {timeAgo(tx.timestamp)}
                  </span>
                  {tx.signature && !tx.signature.startsWith("offchain:") && (
                    <a
                      href={`https://orbmarkets.io/tx/${tx.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 font-['JetBrains_Mono'] text-[9px] text-[#333333] hover:text-[#FF6B00] transition-colors"
                    >
                      [tx]
                    </a>
                  )}
                </div>
              ))}
            </div>
            {hasMore && (
              <button
                onClick={() => setVisible((v) => v + 10)}
                className="w-full py-2 text-[#333333] hover:text-[#666666] font-['JetBrains_Mono'] text-[9px] tracking-widest uppercase transition-colors border-0 bg-transparent cursor-pointer border-t border-[#0F0F0F]"
              >
                load more ({filtered.length - visible} remaining)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const SECTION_LABELS: Record<AppSection, string> = {
  portfolio: "Portfolio",
  vault: "Shielded Vault",
  stealth: "StealthSend",
  airsign: "AirSign",
  history: "History",
};

export default function PortfolioPage() {
  const { cluster } = useCluster();
  const { connected, publicKey } = useWallet();
  const [panel, setPanel] = useState<PanelConfig | null>(null);
  const [activeSection, setActiveSection] = useState<AppSection>("portfolio");
  const [mobileTab, setMobileTab] = useState<MobileTab>("wallet");
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const { data: portfolio, isLoading: portfolioLoading } = useGetPortfolio(publicKey ?? "", {
    query: { queryKey: getGetPortfolioQueryKey(publicKey ?? ""), enabled: !!publicKey, staleTime: 0, refetchInterval: 3_000 },
  });

  const { data: vaultData, isLoading: vaultLoading } = useGetVaultBalances(publicKey ?? "", {
    query: { queryKey: getGetVaultBalancesQueryKey(publicKey ?? ""), enabled: !!publicKey, staleTime: 0, refetchInterval: 3_000 },
  });

  const { data: txData, isLoading: txLoading } = useGetTransactions(publicKey ?? "", {
    query: { queryKey: getGetTransactionsQueryKey(publicKey ?? ""), enabled: !!publicKey, staleTime: 0, refetchInterval: 3_000 },
  });
  const allTransactions = txData?.transactions ?? [];

  const { data: vouchersData, isLoading: vouchersLoading } = useGetAirsignVouchers(publicKey ?? "", {
    query: { queryKey: getGetAirsignVouchersQueryKey(publicKey ?? ""), enabled: !!publicKey, staleTime: 0, refetchInterval: 3_000 },
  });
  const issuedVouchers = vouchersData?.vouchers ?? [];

  const { data: mintsData, isLoading: mintsLoading } = useGetAirsignMints(publicKey ?? "", {
    query: { queryKey: ["airsign-mints-portfolio", publicKey ?? ""], enabled: !!publicKey, staleTime: 0, refetchInterval: 3_000 },
  });
  const pendingMints = mintsData?.mints ?? [];

  // Compute per-token aToken balance: pending mints + unclaimed/processing vouchers
  const airsignDisplay = DEFAULT_TOKENS.map((dt) => {
    const aSymbol = "a" + dt.symbol;
    const fromMints = pendingMints
      .filter((m) => m.token === dt.symbol)
      .reduce((sum, m) => sum + m.amount, 0);
    const fromVouchers = issuedVouchers
      .filter((v) => v.token === dt.symbol && v.claimStatus !== "claimed")
      .reduce((sum, v) => sum + v.amount, 0);
    return { aSymbol, name: dt.name, amount: fromMints + fromVouchers };
  });

  const solBalance = portfolio?.solBalance ?? 0;
  const splTokens = portfolio?.tokens ?? [];
  const shieldedTokens = vaultData?.balances ?? [];
  const walletTokens = DEFAULT_TOKENS.map((dt) => {
    if (dt.mint === "native") return { symbol: dt.symbol, name: dt.name, uiAmount: solBalance };
    const found = splTokens.find((t) => t.mint === dt.mint);
    return { symbol: dt.symbol, name: dt.name, uiAmount: found?.uiAmount ?? 0 };
  });

  const shieldedDisplay = DEFAULT_TOKENS.map((dt) => {
    const sSymbol = `s${dt.symbol}`;
    const found = shieldedTokens.find((t) => t.token === sSymbol);
    return {
      sSymbol,
      name: dt.name,
      shieldedAmount: Number(found?.shieldedAmount ?? 0),
    };
  });

  const activeShieldedCount = shieldedDisplay.filter((t) => t.shieldedAmount > 0).length;

  const openPanel = (action: ActionType, symbol: string, balance: number) => {
    setPanel({ action, tokenSymbol: symbol, tokenBalance: balance });
  };

  const isPortfolio = activeSection === "portfolio";

  return (
    <div className="bg-[#0A0A0A] text-white">
      <NavBar />
      <Sidebar />

      <>
          {/* ── DESKTOP layout ── */}
          <main
            className="hidden md:flex flex-col pt-[56px] pl-[220px]"
            style={{ height: "100vh" }}
          >
            {isPortfolio ? (
              <>
                {/* 3 columns */}
                <div className="flex flex-1 min-h-0">

                  {/* COL 1: Unshielded Token */}
                  <div className="flex-1 flex flex-col border-r-[3px] border-[#2A2A2A] min-w-0">
                    <div className="flex items-center gap-2 px-5 border-b-2 border-[#1A1A1A] h-11 shrink-0">
                      <span className="font-['Space_Grotesk'] font-bold text-sm tracking-wide uppercase text-white">
                        Unshielded Token
                      </span>
                      <span className="font-['JetBrains_Mono'] text-[10px] text-[#555555]">{walletTokens.length}</span>
                    </div>

                    <div className="shrink-0 p-4">
                      {portfolioLoading ? (
                        <div className="grid grid-cols-2 gap-3">
                          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {walletTokens.map((token) => {
                            const isCS = COMING_SOON_BASE.has(token.symbol);
                            return (
                              <div
                                key={token.symbol}
                                className={`border-[3px] border-[#2A2A2A] p-4 bg-[#0D0D0D] flex flex-col gap-3 transition-colors hover:border-[#3A3A3A]${isCS ? " opacity-40 pointer-events-none select-none" : ""}`}
                                style={{ boxShadow: "4px 4px 0 0 #000000" }}
                              >
                                <div className="flex items-start gap-3">
                                  <TokenIcon symbol={token.symbol} large={token.symbol === "SOL"} />
                                  <div className="min-w-0">
                                    <p className="font-['Space_Grotesk'] font-bold text-base leading-none">{token.symbol}</p>
                                    <p className="text-[#555555] text-xs font-['Inter'] mt-1">{token.name}</p>
                                  </div>
                                </div>
                                <p className="font-['JetBrains_Mono'] text-xl font-bold tabular-nums">
                                  {token.uiAmount.toFixed(4)}
                                </p>
                                {isCS ? (
                                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#444444] tracking-widest uppercase border border-[#222222] px-2 py-1 text-center">Coming Soon</span>
                                ) : !connected ? (
                                  <ActionBtn
                                    label="Connect Wallet"
                                    variant="white"
                                    full
                                    onClick={() => setWalletModalOpen(true)}
                                  />
                                ) : (
                                  <ActionBtn
                                    label="Shield to Shielded Vault"
                                    variant="orange"
                                    full
                                    onClick={() => openPanel("shield", token.symbol, token.uiAmount)}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <ColumnHistory transactions={allTransactions} loading={txLoading} col="wallet" />
                  </div>

                  {/* COL 2: Shielded */}
                  <div className="flex-1 flex flex-col border-r-[3px] border-[#2A2A2A] min-w-0">
                    <div className="flex items-center gap-2 px-5 border-b-2 border-[#1A1A1A] h-11 shrink-0">
                      <span className="font-['Space_Grotesk'] font-bold text-sm tracking-wide uppercase text-white">
                        Shielded
                      </span>
                      <span className="tag tag-orange text-[9px] px-1.5 py-0.5">Shielded Vault</span>
                      <span className="font-['JetBrains_Mono'] text-[10px] text-[#555555] ml-auto">{activeShieldedCount} active</span>
                    </div>

                    <div className="shrink-0 p-4">
                      {vaultLoading ? (
                        <div className="grid grid-cols-2 gap-3">
                          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {shieldedDisplay.map((token) => {
                            const bal = token.shieldedAmount;
                            const hasBalance = bal > 0;
                            const isCS = COMING_SOON_BASE.has(token.sSymbol.slice(1));
                            return (
                              <div
                                key={token.sSymbol}
                                className={`border-[3px] p-4 flex flex-col gap-3 transition-colors ${
                                  isCS
                                    ? "border-[#141414] bg-[#080808] opacity-45 select-none"
                                    : hasBalance
                                      ? "border-[#FF6B00]/50 bg-[#0D0D0D] hover:border-[#FF6B00]/70"
                                      : "border-[#1A1A1A] bg-[#0A0A0A] hover:border-[#2A2A2A]"
                                }`}
                                style={{ boxShadow: isCS ? "none" : hasBalance ? "4px 4px 0 0 rgba(255,107,0,0.18)" : "4px 4px 0 0 #000000" }}
                              >
                                <div className="flex items-start gap-3">
                                  <TokenIcon symbol={token.sSymbol} large={token.sSymbol === "sSOL"} />
                                  <div className="min-w-0">
                                    <p className={`font-['Space_Grotesk'] font-bold text-base leading-none ${isCS ? "text-[#2A2A2A]" : hasBalance ? "text-[#FF6B00]" : "text-[#333333]"}`}>
                                      {token.sSymbol}
                                    </p>
                                    <p className="text-[#555555] text-xs font-['Inter'] mt-1">{token.name}</p>
                                  </div>
                                </div>
                                <p className={`font-['JetBrains_Mono'] text-xl font-bold tabular-nums ${isCS ? "text-[#2A2A2A]" : hasBalance ? "text-[#FF6B00]" : "text-[#333333]"}`}>
                                  {isCS ? "--" : bal.toFixed(4)}
                                </p>
                                {isCS ? (
                                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#333333] tracking-widest uppercase border border-[#1A1A1A] px-2 py-1 text-center">Coming Soon</span>
                                ) : (
                                  <div className="flex gap-1">
                                    <ActionBtn compact label="Unshield" variant="white" disabled={!hasBalance} onClick={() => openPanel("unshield", token.sSymbol, bal)} />
                                    <ActionBtn compact label="ZK" variant="white" disabled={!hasBalance} onClick={() => openPanel("zk-send", token.sSymbol, bal)} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <ColumnHistory transactions={allTransactions} loading={txLoading} col="shielded" />
                  </div>

                  {/* COL 3: AirSign */}
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex items-center gap-2 px-5 border-b-2 border-[#1A1A1A] h-11 shrink-0">
                      <span className="font-['Space_Grotesk'] font-bold text-sm tracking-wide uppercase text-white">
                        AirSign
                      </span>
                      <span className="tag text-[9px] px-1.5 py-0.5">Offline</span>
                      <span className="font-['JetBrains_Mono'] text-[10px] text-[#555555] ml-auto">{issuedVouchers.length} issued</span>
                    </div>

                    {/* aToken balance cards */}
                    <div className="shrink-0 p-4">
                      {mintsLoading || vouchersLoading ? (
                        <div className="grid grid-cols-2 gap-3">
                          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {airsignDisplay.map((token) => {
                            const hasBalance = token.amount > 0;
                            const isCS = AIRSIGN_COMING_SOON.has(token.aSymbol.slice(1));
                            return (
                              <div
                                key={token.aSymbol}
                                className={`border-[3px] p-4 flex flex-col gap-3 transition-colors ${
                                  isCS
                                    ? "border-[#141414] bg-[#080808] opacity-45 select-none"
                                    : hasBalance
                                      ? "border-[#FF6B00]/50 bg-[#0D0D0D] hover:border-[#FF6B00]/70"
                                      : "border-[#1A1A1A] bg-[#0A0A0A] hover:border-[#2A2A2A]"
                                }`}
                                style={{ boxShadow: isCS ? "none" : hasBalance ? "4px 4px 0 0 rgba(255,107,0,0.18)" : "4px 4px 0 0 #000000" }}
                              >
                                <div className="flex items-start gap-3">
                                  <TokenIcon symbol={"s" + token.aSymbol.slice(1)} variant="airsign" large={token.aSymbol === "aSOL"} />
                                  <div className="min-w-0">
                                    <p className={`font-['Space_Grotesk'] font-bold text-base leading-none ${isCS ? "text-[#2A2A2A]" : hasBalance ? "text-[#FF6B00]" : "text-[#333333]"}`}>
                                      {token.aSymbol}
                                    </p>
                                    <p className="text-[#555555] text-xs font-['Inter'] mt-1">{token.name}</p>
                                  </div>
                                </div>
                                <p className={`font-['JetBrains_Mono'] text-xl font-bold tabular-nums ${isCS ? "text-[#2A2A2A]" : hasBalance ? "text-[#FF6B00]" : "text-[#333333]"}`}>
                                  {isCS ? "--" : token.amount.toFixed(4)}
                                </p>
                                {isCS ? (
                                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#333333] tracking-widest uppercase border border-[#1A1A1A] px-2 py-1 text-center">Coming Soon</span>
                                ) : (
                                  <button
                                    className="btn-secondary text-[10px] px-2 py-1 justify-center"
                                    disabled={!hasBalance}
                                    onClick={() => openPanel("voucher", "s" + token.aSymbol.slice(1), token.amount)}
                                  >
                                    Create Voucher
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Issued vouchers list */}
                    {issuedVouchers.length > 0 && (
                      <div className="shrink-0 px-4 pb-4">
                        <p className="font-['JetBrains_Mono'] text-[10px] text-[#444444] uppercase tracking-widest mb-2">Vouchers</p>
                        <div className="flex flex-col gap-2">
                          {issuedVouchers.map((v) => {
                            const aSymbol = "a" + v.token;
                            const claimed = v.claimStatus === "claimed";
                            return (
                              <div
                                key={v.nonce}
                                className={`border-[2px] p-3 flex flex-col gap-1.5 ${claimed ? "border-[#1A1A1A] bg-[#080808] opacity-60" : "border-[#2A2A2A] bg-[#0D0D0D]"}`}
                                style={{ boxShadow: claimed ? "none" : "3px 3px 0 0 #000000" }}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <TokenIcon symbol={"s" + v.token} variant="airsign" />
                                    <span className="font-['Space_Grotesk'] font-bold text-sm text-white truncate">{aSymbol}</span>
                                  </div>
                                  <span className={`font-['JetBrains_Mono'] text-[9px] uppercase tracking-widest px-1.5 py-0.5 border ${claimed ? "border-[#2A2A2A] text-[#444444]" : "border-[#FF6B00]/40 text-[#FF6B00]"}`}>
                                    {v.claimStatus}
                                  </span>
                                </div>
                                <p className="font-['JetBrains_Mono'] text-base font-bold text-white tabular-nums">{v.amount.toFixed(4)}</p>
                                <p className="font-['JetBrains_Mono'] text-[9px] text-[#444444] truncate">{v.nonce.slice(0, 16)}...</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <ColumnHistory transactions={allTransactions} loading={txLoading} col="air" />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Section strip with back button */}
                <div className="flex items-center gap-4 px-6 border-b-[3px] border-[#2A2A2A] shrink-0 h-11">
                  <button
                    onClick={() => setActiveSection("portfolio")}
                    className="flex items-center gap-1.5 text-[#888888] hover:text-white transition-colors font-['JetBrains_Mono'] text-xs bg-transparent border-0 cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
                    </svg>
                    Portfolio
                  </button>
                  <div className="w-px h-4 bg-[#2A2A2A]" />
                  <span className="font-['JetBrains_Mono'] text-[11px] tracking-widest uppercase text-white">
                    {SECTION_LABELS[activeSection]}
                  </span>

                </div>

                {/* Section content */}
                <div className="flex-1 overflow-y-auto">
                  {activeSection === "vault" && <VaultSection />}
                  {activeSection === "stealth" && <StealthSection />}
                  {activeSection === "airsign" && <AirSignSection />}
                  {activeSection === "history" && <HistorySection />}
                </div>
              </>
            )}
          </main>

          {/* ── MOBILE layout ── */}
          <main className="md:hidden fixed top-[56px] bottom-[56px] left-0 right-0 flex flex-col overflow-hidden">
            {isPortfolio ? (
              <>
                {/* Mobile tab column header */}
                <div className="flex items-center gap-2 px-4 border-b-[3px] border-[#2A2A2A] h-10 shrink-0">
                  {mobileTab === "wallet" && (
                    <>
                      <span className="font-['JetBrains_Mono'] text-[11px] tracking-widest uppercase text-[#888888]">Wallet</span>
                      {connected && publicKey ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          <AddressChip address={publicKey} chars={4} />
                          <span className="ml-auto font-['JetBrains_Mono'] text-[11px] font-bold">
                            {portfolioLoading ? "..." : solBalance.toFixed(4)}
                            <span className="text-[#555555] font-normal ml-1">SOL</span>
                          </span>
                        </>
                      ) : (
                        <span className="ml-auto font-['JetBrains_Mono'] text-[10px] text-[#444444] tracking-widest uppercase">Not connected</span>
                      )}
                    </>
                  )}
                  {mobileTab === "shielded" && (
                    <>
                      <span className="font-['JetBrains_Mono'] text-[11px] tracking-widest uppercase text-[#FF6B00]">Shielded</span>
                      <span className="tag tag-orange text-[9px] px-1.5 py-0.5">Shielded Vault</span>
                      <span className="ml-auto font-['JetBrains_Mono'] text-[10px] text-[#444444]">{activeShieldedCount} active</span>
                    </>
                  )}
                  {mobileTab === "air" && (
                    <>
                      <span className="font-['JetBrains_Mono'] text-[11px] tracking-widest uppercase text-[#888888]">AirSign</span>
                      <span className="tag text-[9px] px-1.5 py-0.5">Escrow</span>
                    </>
                  )}
                </div>

                {/* Token cards for active tab */}
                <div className="shrink-0 p-4">
                  {mobileTab === "wallet" && (
                    <div className="grid grid-cols-2 gap-3">
                      {portfolioLoading ? (
                        <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
                      ) : (
                        walletTokens.map((token) => {
                          const isCS = COMING_SOON_BASE.has(token.symbol);
                          return (
                            <div
                              key={token.symbol}
                              className="border-[3px] border-[#2A2A2A] p-3 bg-[#0D0D0D] flex flex-col gap-2 hover:border-[#3A3A3A] transition-colors"
                              style={{ boxShadow: "4px 4px 0 0 #000000" }}
                            >
                              <div className="flex items-center gap-2">
                                <TokenIcon symbol={token.symbol} large={token.symbol === "SOL"} />
                                <div className="min-w-0">
                                  <p className="font-['Space_Grotesk'] font-bold text-sm leading-none">{token.symbol}</p>
                                  <p className="text-[#555555] text-[10px] font-['Inter'] mt-0.5">{token.name}</p>
                                </div>
                              </div>
                              <p className="font-['JetBrains_Mono'] text-lg font-bold tabular-nums">{token.uiAmount.toFixed(4)}</p>
                              {isCS ? (
                                <span className="font-['JetBrains_Mono'] text-[10px] text-[#444444] tracking-widest uppercase border border-[#222222] px-2 py-1 text-center">Coming Soon</span>
                              ) : !connected ? (
                                <ActionBtn label="Connect Wallet" variant="white" full onClick={() => setWalletModalOpen(true)} />
                              ) : (
                                <ActionBtn label="Shield" variant="orange" full onClick={() => openPanel("shield", token.symbol, token.uiAmount)} />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                  {mobileTab === "shielded" && (
                    <div className="grid grid-cols-2 gap-3">
                      {vaultLoading ? (
                        <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
                      ) : (
                        shieldedDisplay.map((token) => {
                          const bal = token.shieldedAmount;
                          const hasBalance = bal > 0;
                          const isCS = COMING_SOON_BASE.has(token.sSymbol.slice(1));
                          return (
                            <div
                              key={token.sSymbol}
                              className={`border-[3px] p-3 flex flex-col gap-2 transition-colors ${
                                isCS
                                  ? "border-[#141414] bg-[#080808] opacity-45 select-none"
                                  : hasBalance
                                    ? "border-[#FF6B00]/50 bg-[#0D0D0D] hover:border-[#FF6B00]/70"
                                    : "border-[#1A1A1A] bg-[#0A0A0A] hover:border-[#2A2A2A]"
                              }`}
                              style={{ boxShadow: isCS ? "none" : hasBalance ? "4px 4px 0 0 rgba(255,107,0,0.18)" : "4px 4px 0 0 #000000" }}
                            >
                              <div className="flex items-center gap-2">
                                <TokenIcon symbol={token.sSymbol} large={token.sSymbol === "sSOL"} />
                                <div className="min-w-0">
                                  <p className={`font-['Space_Grotesk'] font-bold text-sm leading-none ${isCS ? "text-[#2A2A2A]" : hasBalance ? "text-[#FF6B00]" : "text-[#333333]"}`}>{token.sSymbol}</p>
                                  <p className="text-[#555555] text-[10px] mt-0.5">{token.name}</p>
                                </div>
                              </div>
                              <p className={`font-['JetBrains_Mono'] text-lg font-bold ${isCS ? "text-[#2A2A2A]" : hasBalance ? "text-[#FF6B00]" : "text-[#333333]"}`}>{isCS ? "--" : bal.toFixed(4)}</p>
                              {isCS ? (
                                <span className="font-['JetBrains_Mono'] text-[10px] text-[#333333] tracking-widest uppercase border border-[#1A1A1A] px-2 py-1 text-center">Coming Soon</span>
                              ) : (
                                <div className="flex gap-1">
                                  <ActionBtn compact label="Unshield" variant="white" disabled={!hasBalance} onClick={() => openPanel("unshield", token.sSymbol, bal)} />
                                  <ActionBtn compact label="ZK" variant="white" disabled={!hasBalance} onClick={() => openPanel("zk-send", token.sSymbol, bal)} />
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                  {mobileTab === "air" && (
                    <div className="flex flex-col gap-3">
                      {/* aToken balance cards */}
                      {mintsLoading || vouchersLoading ? (
                        <div className="grid grid-cols-2 gap-3">
                          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {airsignDisplay.map((token) => {
                            const hasBalance = token.amount > 0;
                            const isCS = AIRSIGN_COMING_SOON.has(token.aSymbol.slice(1));
                            return (
                              <div
                                key={token.aSymbol}
                                className={`border-[3px] p-3 flex flex-col gap-2 transition-colors ${
                                  isCS
                                    ? "border-[#141414] bg-[#080808] opacity-45 select-none"
                                    : hasBalance
                                      ? "border-[#FF6B00]/50 bg-[#0D0D0D] hover:border-[#FF6B00]/70"
                                      : "border-[#1A1A1A] bg-[#0A0A0A] hover:border-[#2A2A2A]"
                                }`}
                                style={{ boxShadow: isCS ? "none" : hasBalance ? "4px 4px 0 0 rgba(255,107,0,0.18)" : "4px 4px 0 0 #000000" }}
                              >
                                <div className="flex items-center gap-2">
                                  <TokenIcon symbol={"s" + token.aSymbol.slice(1)} variant="airsign" large={token.aSymbol === "aSOL"} />
                                  <div className="min-w-0">
                                    <p className={`font-['Space_Grotesk'] font-bold text-sm leading-none ${isCS ? "text-[#2A2A2A]" : hasBalance ? "text-[#FF6B00]" : "text-[#333333]"}`}>{token.aSymbol}</p>
                                    <p className="text-[#555555] text-[10px] mt-0.5">{token.name}</p>
                                  </div>
                                </div>
                                <p className={`font-['JetBrains_Mono'] text-lg font-bold tabular-nums ${isCS ? "text-[#2A2A2A]" : hasBalance ? "text-[#FF6B00]" : "text-[#333333]"}`}>{isCS ? "--" : token.amount.toFixed(4)}</p>
                                {isCS ? (
                                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#333333] tracking-widest uppercase border border-[#1A1A1A] px-2 py-1 text-center">Coming Soon</span>
                                ) : (
                                  <button
                                    className="btn-secondary text-[10px] px-2 py-1 justify-center"
                                    disabled={!hasBalance}
                                    onClick={() => openPanel("voucher", "s" + token.aSymbol.slice(1), token.amount)}
                                  >
                                    Create Voucher
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Issued vouchers list */}
                      {issuedVouchers.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <p className="font-['JetBrains_Mono'] text-[10px] text-[#444444] uppercase tracking-widest">Vouchers</p>
                          {issuedVouchers.map((v) => {
                            const aSymbol = "a" + v.token;
                            const claimed = v.claimStatus === "claimed";
                            return (
                              <div
                                key={v.nonce}
                                className={`border-[2px] p-3 flex flex-col gap-1.5 ${claimed ? "border-[#1A1A1A] bg-[#080808] opacity-60" : "border-[#2A2A2A] bg-[#0D0D0D]"}`}
                                style={{ boxShadow: claimed ? "none" : "3px 3px 0 0 #000000" }}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <TokenIcon symbol={"s" + v.token} variant="airsign" />
                                    <span className="font-['Space_Grotesk'] font-bold text-sm text-white truncate">{aSymbol}</span>
                                  </div>
                                  <span className={`font-['JetBrains_Mono'] text-[9px] uppercase tracking-widest px-1.5 py-0.5 border ${claimed ? "border-[#2A2A2A] text-[#444444]" : "border-[#FF6B00]/40 text-[#FF6B00]"}`}>
                                    {v.claimStatus}
                                  </span>
                                </div>
                                <p className="font-['JetBrains_Mono'] text-base font-bold text-white tabular-nums">{v.amount.toFixed(4)}</p>
                                <p className="font-['JetBrains_Mono'] text-[9px] text-[#444444] truncate">{v.nonce.slice(0, 16)}...</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Per-tab scrollable history */}
                <ColumnHistory transactions={allTransactions} loading={txLoading} col={mobileTab} />

              </>
            ) : null}
          </main>
        </>

      <BottomBar activeTab={mobileTab} onTab={setMobileTab} />

      {panel && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setPanel(null)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-[#141414] border-l border-[#2A2A2A] shadow-2xl flex flex-col">
            <ActionPanel config={panel} onClose={() => setPanel(null)} />
          </div>
        </>
      )}

      {walletModalOpen && <WalletModal onClose={() => setWalletModalOpen(false)} />}
    </div>
  );
}
