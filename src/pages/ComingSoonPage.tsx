import React, { useState, useEffect } from "react";
import { NavBar } from "../components/NavBar";
import { Sidebar } from "../components/Sidebar";
import { TokenLogo } from "../components/TokenLogo";

/* ─────────────────────────── real-time price hook ─────────────────────── */

function useSolPrice(): number | null {
  const [price, setPrice] = useState<number | null>(null);
  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd")
      .then((r) => r.json())
      .then((d) => setPrice(d?.solana?.usd ?? null))
      .catch(() => null);
  }, []);
  return price;
}

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtUsd(n: number) {
  if (n >= 1_000_000) return `$${fmt(n / 1_000_000, 2)}M`;
  if (n >= 1_000) return `$${fmt(n / 1_000, 0)}K`;
  return `$${fmt(n, 2)}`;
}

/* ─────────────────────────── shared primitives ─────────────────────────── */

const B = "border-[3px] border-[#2A2A2A]";      // standard border
const BB = "border-b-[3px] border-[#2A2A2A]";   // bottom divider

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className={`${B} bg-[#0D0D0D] px-5 py-4 flex flex-col gap-1 min-w-0`}>
      <span className="font-['JetBrains_Mono'] text-[10px] tracking-widest uppercase text-[#444444]">{label}</span>
      <span className="font-['Space_Grotesk'] font-bold text-xl text-white tabular-nums">{value}</span>
      {sub && <span className="font-['JetBrains_Mono'] text-[10px] text-[#333333]">{sub}</span>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-['JetBrains_Mono'] text-[10px] tracking-widest uppercase text-[#444444] block mb-2">
      {children}
    </span>
  );
}

function DisabledInput({ value, right }: { value: string; right?: string }) {
  return (
    <div className={`${B} bg-[#080808] px-3 py-2.5 flex items-center justify-between cursor-not-allowed select-none`}>
      <span className="font-['JetBrains_Mono'] text-sm text-[#333333]">{value}</span>
      {right && <span className="font-['JetBrains_Mono'] text-[11px] text-[#2A2A2A]">{right}</span>}
    </div>
  );
}

function TokenSelector({ symbol }: { symbol: string }) {
  return (
    <div className={`${B} bg-[#080808] px-3 py-2.5 flex items-center justify-between cursor-not-allowed select-none w-full`}>
      <div className="flex items-center gap-2">
        <TokenLogo symbol={symbol} size={20} />
        <span className="font-['Space_Grotesk'] font-bold text-sm text-[#444444]">{symbol}</span>
      </div>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#2A2A2A]">
        <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      </svg>
    </div>
  );
}

function ComingSoonBtn({ label }: { label: string }) {
  return (
    <div className={`${B} bg-[#0D0D0D] px-6 py-3 flex items-center justify-between cursor-not-allowed select-none w-full`}>
      <span className="font-['Space_Grotesk'] font-bold text-sm text-[#333333]">{label}</span>
      <span className="font-['JetBrains_Mono'] text-[9px] tracking-[0.25em] uppercase border-[2px] border-[#FF6B00]/40 text-[#FF6B00]/60 px-2 py-1">
        Coming Soon
      </span>
    </div>
  );
}

function TH({ children }: { children: React.ReactNode }) {
  return <span className="font-['JetBrains_Mono'] text-[9px] tracking-widest uppercase text-[#333333]">{children}</span>;
}

/* ─────────────────────────── overlay ───────────────────────────────────── */

function CSOverlay({ name }: { name: string }) {
  return (
    /* fixed, scoped to content area navbar (z-50) and sidebar (z-50) stay above */
    <div className="fixed top-[56px] left-0 md:left-[220px] right-0 bottom-0 z-40 bg-[#0A0A0A]/82 flex items-center justify-center px-4">
      <div
        className={`${B} bg-[#0D0D0D] px-14 py-12 flex flex-col items-center gap-5 text-center`}
        style={{ minWidth: 300, maxWidth: 480 }}
      >
        <span className="font-['JetBrains_Mono'] text-[10px] tracking-[0.4em] uppercase border-[2px] border-[#FF6B00]/40 text-[#FF6B00] px-4 py-1.5">
          Coming Soon
        </span>
        <h2 className="font-['Space_Grotesk'] font-bold text-2xl text-white">{name}</h2>
        <p className="font-['JetBrains_Mono'] text-[10px] text-[#444444] leading-relaxed max-w-[320px]">
          This feature is in development. The interface behind this overlay is a preview of what it will look like when it ships.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────── page shell ────────────────────────────────── */

function PageShell({ children, overlay }: { children: React.ReactNode; overlay?: React.ReactNode }) {
  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen">
      <NavBar />
      <Sidebar />
      {overlay}
      <main className="md:pl-[220px] pt-[56px] min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  );
}

/* ─────────────────────────── Batch ZK Transfer ─────────────────────────── */

const MOCK_RECIPIENTS = [
  { addr: "8xKjP...3mPq", amount: "0.2500", token: "sSOL" },
  { addr: "3nRtW...7kWs", amount: "0.1500", token: "sSOL" },
  { addr: "5yLpM...2vBn", amount: "0.1000", token: "sSOL" },
];

function BatchZkTransfer() {
  const sol = useSolPrice();
  const [side, setSide] = useState<"max" | "equal">("max");
  const poolSol = 847;

  return (
    <PageShell overlay={<CSOverlay name="Batch ZK Transfer" />}>
      {/* Stats */}
      <div className={`${BB} px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0`}>
        <StatCard label="Pool Depth"     value={`${poolSol} sSOL`} sub={sol ? `${fmtUsd(poolSol * sol)} shielded` : "loading..."} />
        <StatCard label="Max Recipients" value="8"                 sub="per proof" />
        <StatCard label="Proof Time"     value="~1.2s"             sub="Groth16 WASM" />
        <StatCard label="Privacy"        value="ZK-Groth16"        sub="no link on-chain" />
      </div>

      <div className="flex flex-col md:flex-row flex-1 min-h-0">

        {/* Left */}
        <div className={`w-full md:w-[300px] border-r-[2px] border-[#1A1A1A] p-5 flex flex-col gap-5 shrink-0`}>
          <div>
            <SectionLabel>Source Token</SectionLabel>
            <div className="flex flex-col gap-2">
              <TokenSelector symbol="sSOL" />
              <DisabledInput value="0.5000" right="MAX" />
              <div className="flex items-center justify-between px-1">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#333333]">Balance</span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#444444]">0.5214 sSOL</span>
              </div>
            </div>
          </div>

          <div>
            <SectionLabel>Split Mode</SectionLabel>
            <div className={`flex ${B}`}>
              {(["max", "equal"] as const).map((s) => (
                <button key={s} className={`flex-1 py-2 font-['JetBrains_Mono'] text-[11px] tracking-widest uppercase cursor-not-allowed select-none ${side === s ? "bg-[#1A1A1A] text-[#555555]" : "bg-transparent text-[#2A2A2A]"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className={`${B} bg-[#080808] p-4 flex flex-col gap-2.5`}>
            <SectionLabel>ZK Proof Summary</SectionLabel>
            {[["Inputs","1"],["Outputs","3"],["Proof time","~1.2s"],["Relayer fee","0.003 SOL"]].map(([k,v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#333333]">{k}</span>
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#555555]">{v}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto"><ComingSoonBtn label="Generate Proof and Send" /></div>
        </div>

        {/* Right */}
        <div className="flex-1 p-5 flex flex-col gap-4 min-w-0 overflow-auto">
          <div className="flex items-center justify-between">
            <SectionLabel>Recipients</SectionLabel>
            <span className={`font-['JetBrains_Mono'] text-[10px] text-[#2A2A2A] ${B} px-2 py-1 cursor-not-allowed`}>+ Add Recipient</span>
          </div>

          <div className={B}>
            <div className={`grid grid-cols-[24px_1fr_120px_80px] gap-3 px-4 py-2 ${BB} bg-[#080808]`}>
              {["#","Address","Amount","Token"].map((h) => <TH key={h}>{h}</TH>)}
            </div>
            {MOCK_RECIPIENTS.map((r, i) => (
              <div key={i} className={`grid grid-cols-[24px_1fr_120px_80px] gap-3 px-4 py-3 ${BB} last:border-0 bg-[#0A0A0A] cursor-not-allowed select-none`}>
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#333333]">{i+1}</span>
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#444444] truncate">{r.addr}</span>
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#444444]">{r.amount}</span>
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#333333]">{r.token}</span>
              </div>
            ))}
          </div>

          <div className={`${B} bg-[#080808] p-4`}>
            <SectionLabel>Summary</SectionLabel>
            <div className="grid grid-cols-2 gap-y-2">
              {[
                ["Total sending", `0.5000 sSOL${sol ? ` (${fmtUsd(0.5 * sol)})` : ""}`],
                ["Relayer fee",   "0.003 SOL"],
                ["Recipients",   "3 addresses"],
                ["Net each",     "variable"],
              ].map(([k,v]) => (
                <React.Fragment key={k}>
                  <span className="font-['JetBrains_Mono'] text-[11px] text-[#333333]">{k}</span>
                  <span className="font-['JetBrains_Mono'] text-[11px] text-[#555555] text-right">{v}</span>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="border-l-[2px] border-[#1A1A1A] pl-4 py-1">
            <p className="font-['JetBrains_Mono'] text-[10px] text-[#2A2A2A] leading-relaxed">
              A single Groth16 proof covers all outputs. On-chain, only one transaction is visible with no recipient addresses exposed. The relayer broadcasts after proof verification.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

/* ─────────────────────────── Private Swap ──────────────────────────────── */

function PrivateSwap() {
  const sol = useSolPrice();
  const minReceived = sol ? fmt(sol * 0.995, 2) : "---";

  const recentSwaps = sol ? [
    ["2m ago",  "0.50 sSOL", `${fmt(0.5 * sol,   2)} sUSDC`, fmt(sol,           2)],
    ["7m ago",  "1.20 sSOL", `${fmt(1.2 * sol,   2)} sUSDC`, fmt(sol * 0.999,   2)],
    ["12m ago", "0.25 sSOL", `${fmt(0.25 * sol,  2)} sUSDC`, fmt(sol * 1.001,   2)],
    ["18m ago", "2.00 sSOL", `${fmt(2   * sol * 0.998, 2)} sUSDC`, fmt(sol * 0.998, 2)],
  ] : [];

  return (
    <PageShell overlay={<CSOverlay name="Private Swap" />}>
      <div className={`${BB} px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0`}>
        <StatCard label="24h Volume"     value={sol ? fmtUsd(sol * 2065) : "---"} sub="shielded pool" />
        <StatCard label="Pool Liquidity" value={sol ? fmtUsd(sol * 9000) : "---"} sub="sSOL + sUSDC" />
        <StatCard label="Best Route"     value="Jupiter"  sub="via SignitoRelay" />
        <StatCard label="Avg Slippage"   value="0.12%"   sub="last 100 swaps" />
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0">

        {/* Left */}
        <div className={`w-full lg:w-[400px] border-r-[2px] border-[#1A1A1A] p-5 flex flex-col gap-4 shrink-0`}>

          <div className={`${B} bg-[#0D0D0D] p-4 flex flex-col gap-3`}>
            <SectionLabel>From</SectionLabel>
            <div className="flex gap-2">
              <div className="w-[120px] shrink-0"><TokenSelector symbol="sSOL" /></div>
              <DisabledInput value="1.0000" right="MAX" />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#333333]">Balance: 0.5214 sSOL</span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#333333]">{sol ? fmtUsd(sol) : "---"}</span>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className={`${B} bg-[#0D0D0D] p-2 cursor-not-allowed`}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#2A2A2A]">
                <path d="M8 2V14M4 10L8 14L12 10M4 6L8 2L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
              </svg>
            </div>
          </div>

          <div className={`${B} bg-[#0D0D0D] p-4 flex flex-col gap-3`}>
            <SectionLabel>To (estimated)</SectionLabel>
            <div className="flex gap-2">
              <div className="w-[120px] shrink-0"><TokenSelector symbol="sUSDC" /></div>
              <DisabledInput value={sol ? `~${fmt(sol, 2)}` : "---"} />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#333333]">Balance: 245.30 sUSDC</span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#333333]">{sol ? fmtUsd(sol) : "---"}</span>
            </div>
          </div>

          <div className={`${B} bg-[#080808] px-4 py-3`}>
            <SectionLabel>Route</SectionLabel>
            <div className="flex items-center gap-2 mt-1">
              {["sSOL","Relay","Jupiter","sUSDC"].map((step, i, arr) => (
                <React.Fragment key={step}>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#444444]">{step}</span>
                  {i < arr.length - 1 && <span className="text-[#222222] font-['JetBrains_Mono'] text-[10px]">--</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className={`${B} bg-[#080808] px-4 py-3 flex flex-col gap-2`}>
            {[
              ["Price",             sol ? `${fmt(sol,2)} sUSDC per sSOL` : "---"],
              ["Price Impact",     "<0.1%"],
              ["Slippage",         "0.5%"],
              ["Min Received",     sol ? `${minReceived} sUSDC` : "---"],
              ["Relayer Fee",      "0.003 SOL"],
            ].map(([k,v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#333333]">{k}</span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#555555]">{v}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto"><ComingSoonBtn label="Swap via Relay" /></div>
        </div>

        {/* Right */}
        <div className="flex-1 p-5 flex flex-col gap-4 min-w-0">
          <div>
            <SectionLabel>sSOL / sUSDC</SectionLabel>
            <div className="flex items-baseline gap-3">
              <span className="font-['Space_Grotesk'] font-bold text-3xl text-white">{sol ? fmt(sol, 2) : "---"}</span>
              <span className="font-['JetBrains_Mono'] text-sm text-green-500">+1.24%</span>
            </div>
          </div>

          <div className={`${B} bg-[#0D0D0D] flex-1 min-h-[180px] relative overflow-hidden`}>
            <div className="absolute inset-0 flex items-end px-4 pb-4 gap-1">
              {[62,55,68,72,60,78,65,80,70,75,68,82,76,85,79,88,83,90,85,92].map((h,i) => (
                <div key={i} className="flex-1 bg-[#1A1A1A]" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#1A1A1A] tracking-widest uppercase">Price chart: coming soon</span>
            </div>
          </div>

          {recentSwaps.length > 0 ? (
            <div className={B}>
              <div className={`grid grid-cols-4 gap-3 px-4 py-2 ${BB} bg-[#080808]`}>
                {["Time","From","To","Rate"].map((h) => <TH key={h}>{h}</TH>)}
              </div>
              {recentSwaps.map(([t,f,to,r], i) => (
                <div key={i} className={`grid grid-cols-4 gap-3 px-4 py-2.5 ${BB} last:border-0 bg-[#0A0A0A] cursor-not-allowed select-none`}>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#333333]">{t}</span>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#444444]">{f}</span>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#444444]">{to}</span>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#444444]">{r}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={`${B} bg-[#080808] px-4 py-6 flex items-center justify-center`}>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#2A2A2A]">Loading price data...</span>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

/* ─────────────────────────── Private DEX / Limit Order ─────────────────── */

function PrivateDex() {
  const sol = useSolPrice();
  const [side, setSide] = useState<"buy" | "sell">("buy");

  const ask1 = sol ? fmt(sol * 1.006, 2) : "---";
  const ask2 = sol ? fmt(sol * 1.004, 2) : "---";
  const ask3 = sol ? fmt(sol * 1.002, 2) : "---";
  const bid1 = sol ? fmt(sol * 0.999, 2) : "---";
  const bid2 = sol ? fmt(sol * 0.997, 2) : "---";
  const bid3 = sol ? fmt(sol * 0.995, 2) : "---";

  const asks = [
    [ask1, "1.20", sol ? fmt(sol * 1.006 * 1.2, 2)  : "---"],
    [ask2, "0.85", sol ? fmt(sol * 1.004 * 0.85, 2) : "---"],
    [ask3, "2.10", sol ? fmt(sol * 1.002 * 2.1, 2)  : "---"],
  ];
  const bids = [
    [bid1, "3.40", sol ? fmt(sol * 0.999 * 3.4, 2) : "---"],
    [bid2, "1.80", sol ? fmt(sol * 0.997 * 1.8, 2) : "---"],
    [bid3, "5.20", sol ? fmt(sol * 0.995 * 5.2, 2) : "---"],
  ];

  return (
    <PageShell overlay={<CSOverlay name="Private DEX / Limit Order" />}>
      <div className={`${BB} px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0`}>
        <StatCard label="sSOL / sUSDC" value={sol ? `$${fmt(sol,2)}` : "---"} sub="+1.24% (24h)" />
        <StatCard label="24h Volume"   value={sol ? fmtUsd(sol * 648) : "---"} sub="shielded orders" />
        <StatCard label="Open Orders"  value="142"   sub="across all wallets" />
        <StatCard label="Spread"       value="0.02%" sub="$0.03 per sSOL" />
      </div>

      <div className="flex flex-col md:flex-row flex-1 min-h-0">

        {/* Left */}
        <div className={`w-full md:w-[300px] border-r-[2px] border-[#1A1A1A] p-5 flex flex-col gap-4 shrink-0`}>
          <div><SectionLabel>Pair</SectionLabel><DisabledInput value="sSOL / sUSDC" /></div>
          <div><SectionLabel>Order Type</SectionLabel><DisabledInput value="Limit Order" /></div>

          <div>
            <SectionLabel>Side</SectionLabel>
            <div className={`flex ${B}`}>
              {(["buy","sell"] as const).map((s) => (
                <button key={s} onClick={() => setSide(s)}
                  className={`flex-1 py-2 font-['JetBrains_Mono'] text-[11px] tracking-widest uppercase cursor-not-allowed select-none transition-colors ${
                    side === s
                      ? s === "buy" ? "bg-green-900/30 text-green-600" : "bg-red-900/30 text-red-600"
                      : "bg-transparent text-[#2A2A2A]"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div><SectionLabel>Limit Price (sUSDC per sSOL)</SectionLabel><DisabledInput value={sol ? fmt(sol * 1.003, 2) : "---"} right="sUSDC" /></div>

          <div>
            <SectionLabel>Amount (sSOL)</SectionLabel>
            <DisabledInput value="1.0000" right="MAX" />
            <div className="flex items-center justify-between px-1 mt-1">
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#333333]">Balance</span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#444444]">0.5214 sSOL</span>
            </div>
          </div>

          <div className={`${B} bg-[#080808] px-3 py-3 flex flex-col gap-2`}>
            {[
              ["Order Total", sol ? `${fmt(sol * 1.003, 2)} sUSDC` : "---"],
              ["Relayer Fee", "0.002 SOL"],
              ["Expiry",      "24 hours"],
            ].map(([k,v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#333333]">{k}</span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#555555]">{v}</span>
              </div>
            ))}
          </div>

          <div>
            <SectionLabel>Expiry</SectionLabel>
            <div className="flex gap-1">
              {["1h","6h","24h","7d"].map((e) => (
                <div key={e} className={`flex-1 border-[2px] py-1.5 text-center font-['JetBrains_Mono'] text-[10px] cursor-not-allowed select-none ${e === "24h" ? "border-[#2A2A2A] text-[#444444]" : "border-[#1A1A1A] text-[#222222]"}`}>
                  {e}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            <ComingSoonBtn label={side === "buy" ? "Place Buy Order" : "Place Sell Order"} />
          </div>
        </div>

        {/* Right */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className={`border-b-[2px] border-[#1A1A1A] p-5 flex-1 min-h-0 overflow-auto`}>
            <SectionLabel>Order Book : sSOL/sUSDC</SectionLabel>
            <div className={B}>
              <div className={`grid grid-cols-3 px-4 py-2 ${BB} bg-[#080808]`}>
                {["Price (sUSDC)","Size (sSOL)","Total (sUSDC)"].map((h) => <TH key={h}>{h}</TH>)}
              </div>
              {asks.map(([p,s,t], i) => (
                <div key={i} className={`grid grid-cols-3 px-4 py-2 ${BB} bg-[#0A0A0A] cursor-not-allowed select-none relative overflow-hidden`}>
                  <div className="absolute inset-y-0 right-0 bg-red-900/8" style={{ width: `${[40,25,60][i]}%` }} />
                  <span className="font-['JetBrains_Mono'] text-[11px] text-red-800">{p}</span>
                  <span className="font-['JetBrains_Mono'] text-[11px] text-[#444444]">{s}</span>
                  <span className="font-['JetBrains_Mono'] text-[11px] text-[#333333]">{t}</span>
                </div>
              ))}
              <div className={`px-4 py-2 ${BB} bg-[#060606] flex items-center gap-3`}>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#2A2A2A]">Spread</span>
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#333333]">0.02%</span>
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#555555] font-bold">{sol ? `$${fmt(sol,2)}` : "---"}</span>
              </div>
              {bids.map(([p,s,t], i) => (
                <div key={i} className={`grid grid-cols-3 px-4 py-2 ${BB} last:border-0 bg-[#0A0A0A] cursor-not-allowed select-none relative overflow-hidden`}>
                  <div className="absolute inset-y-0 right-0 bg-green-900/8" style={{ width: `${[80,50,30][i]}%` }} />
                  <span className="font-['JetBrains_Mono'] text-[11px] text-green-800">{p}</span>
                  <span className="font-['JetBrains_Mono'] text-[11px] text-[#444444]">{s}</span>
                  <span className="font-['JetBrains_Mono'] text-[11px] text-[#333333]">{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5">
            <SectionLabel>My Open Orders</SectionLabel>
            <div className={B}>
              <div className={`grid grid-cols-5 px-4 py-2 ${BB} bg-[#080808]`}>
                {["Pair","Side","Price","Amount","Status"].map((h) => <TH key={h}>{h}</TH>)}
              </div>
              <div className="px-4 py-8 flex items-center justify-center bg-[#0A0A0A]">
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#222222] tracking-widest uppercase">No open orders. Connect wallet to place orders.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

/* ─────────────────────────── exports ───────────────────────────────────── */

export function BatchZkPage()     { return <BatchZkTransfer />; }
export function PrivateSwapPage() { return <PrivateSwap />;     }
export function PrivateDexPage()  { return <PrivateDex />;      }
