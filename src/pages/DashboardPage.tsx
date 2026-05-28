import React from "react";
import { Link } from "wouter";
import { NavBar } from "../components/NavBar";
import { Sidebar } from "../components/Sidebar";
import { useWallet } from "../lib/wallet";
import { AddressChip } from "../components/AddressChip";
import {
  useGetPortfolio,
  getGetPortfolioQueryKey,
  useGetVaultBalances,
  getGetVaultBalancesQueryKey,
  useGetTransactions,
  getGetTransactionsQueryKey,
} from "@workspace/api-client-react";

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded p-4">
      <p className="text-[#888888] font-['JetBrains_Mono'] text-xs tracking-wider uppercase mb-2">{label}</p>
      <p className="font-['Space_Grotesk'] text-2xl font-bold">{value}</p>
      {sub && <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();

  const { data: portfolio, isLoading: portfolioLoading } = useGetPortfolio(publicKey ?? "", {
    query: { queryKey: getGetPortfolioQueryKey(publicKey ?? ""), enabled: !!publicKey, staleTime: 0, refetchInterval: 3_000 },
  });

  const { data: vaultData, isLoading: vaultLoading } = useGetVaultBalances(publicKey ?? "", {
    query: { queryKey: getGetVaultBalancesQueryKey(publicKey ?? ""), enabled: !!publicKey, staleTime: 0, refetchInterval: 3_000 },
  });

  const { data: txData } = useGetTransactions(publicKey ?? "", {
    query: { queryKey: getGetTransactionsQueryKey(publicKey ?? ""), enabled: !!publicKey, staleTime: 0, refetchInterval: 3_000 },
  });

  const solBalance = portfolio?.solBalance ?? 0;
  const splTokens = portfolio?.tokens ?? [];
  const shieldedBalances = vaultData?.balances ?? [];
  const recentTx = txData?.transactions?.slice(0, 5) ?? [];
  const totalShielded = shieldedBalances.reduce((acc, b) => acc + (b.shieldedAmount ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <NavBar />
      <Sidebar />

      <main className="pt-[60px] pl-[220px]">
        <div className="p-8 max-w-5xl">

          <div className="flex items-center gap-3 mb-6">
            <h1 className="font-['Space_Grotesk'] text-3xl font-bold">Dashboard</h1>
            <span className="tag">Signito</span>
          </div>

          {!connected ? (
            <div className="card text-center py-20">
              <div className="w-16 h-16 border-2 border-[#2A2A2A] mx-auto mb-6 flex items-center justify-center">
                <div className="w-8 h-8 bg-[#FF6B00]" />
              </div>
              <h2 className="font-['Space_Grotesk'] text-2xl font-bold mb-3">Connect your wallet</h2>
              <p className="text-[#888888] mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                Signito requires a Solana wallet. Connect Phantom or Solflare to view your portfolio and access the protocol.
              </p>
              <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
                Click <span className="text-[#FF6B00]">Connect Wallet</span> in the top-right corner.
              </p>
            </div>
          ) : (
            <>
              {/* ── Wallet Overview Card ── */}
              <div className="card bg-[#141414] border-[#FF6B00] mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-[#888888] font-['JetBrains_Mono'] text-xs tracking-wider uppercase mb-2">Connected Wallet</p>
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                      <AddressChip address={publicKey!} chars={8} />
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[#888888] font-['JetBrains_Mono'] text-xs uppercase mb-1">SOL Balance</p>
                      <p className="font-['Space_Grotesk'] text-3xl font-bold">
                        {portfolioLoading ? "..." : solBalance.toFixed(4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#888888] font-['JetBrains_Mono'] text-xs uppercase mb-1">Network</p>
                      <span className="tag">Solana Mainnet</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Portfolio Grid: 3 sections ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

                {/* 1. Wallet Tokens */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-['Space_Grotesk'] font-bold text-sm tracking-wider uppercase">Wallet</h2>
                    {portfolioLoading && <span className="text-[#888888] font-['JetBrains_Mono'] text-xs">Loading...</span>}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between py-2.5 border-b border-[#1A1A1A]">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#9945FF] flex items-center justify-center">
                          <span className="text-white font-bold" style={{ fontSize: "7px" }}>SOL</span>
                        </div>
                        <span className="font-['Space_Grotesk'] font-semibold text-sm">SOL</span>
                      </div>
                      <span className="font-['JetBrains_Mono'] text-sm">
                        {portfolioLoading ? "..." : solBalance.toFixed(4)}
                      </span>
                    </div>

                    {splTokens.map((token) => (
                      <div key={token.mint} className="flex items-center justify-between py-2.5 border-b border-[#1A1A1A]">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                            <span className="text-[#888888] font-bold" style={{ fontSize: "7px" }}>
                              {(token.symbol ?? "?").slice(0, 3)}
                            </span>
                          </div>
                          <span className="font-['Space_Grotesk'] font-semibold text-sm">{token.symbol ?? "Unknown"}</span>
                        </div>
                        <span className="font-['JetBrains_Mono'] text-sm">
                          {token.uiAmount.toFixed(4)}
                        </span>
                      </div>
                    ))}

                    {!portfolioLoading && splTokens.length === 0 && (
                      <div className="py-4 text-center">
                        <p className="text-[#888888] text-xs font-['Inter']">No SPL tokens</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Shielded (sTokens) */}
                <div className="card border-[#FF6B00]/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h2 className="font-['Space_Grotesk'] font-bold text-sm tracking-wider uppercase">Shielded</h2>
                      <span className="tag tag-orange">sToken</span>
                    </div>
                    {vaultLoading && <span className="text-[#888888] font-['JetBrains_Mono'] text-xs">Loading...</span>}
                  </div>

                  <div className="space-y-1">
                    {shieldedBalances.map((b) => (
                      <div key={b.mint} className="flex items-center justify-between py-2.5 border-b border-[#1A1A1A]">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#FF6B00]/20 border border-[#FF6B00]/40 flex items-center justify-center">
                            <span className="text-[#FF6B00] font-bold" style={{ fontSize: "7px" }}>s</span>
                          </div>
                          <span className="font-['Space_Grotesk'] font-semibold text-sm text-[#FF6B00]">
                            s{b.token}
                          </span>
                        </div>
                        <span className="font-['JetBrains_Mono'] text-sm text-[#FF6B00]">
                          {(b.shieldedAmount ?? 0).toFixed(4)}
                        </span>
                      </div>
                    ))}

                    {!vaultLoading && shieldedBalances.length === 0 && (
                      <div className="py-4 text-center">
                        <p className="text-[#888888] text-xs font-['Inter'] mb-2">No shielded assets</p>
                        <Link href="/app" className="text-[#FF6B00] text-xs font-['JetBrains_Mono'] hover:text-white transition-colors">
                          Shield in Shielded Vault
                        </Link>
                      </div>
                    )}
                  </div>

                  {shieldedBalances.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#2A2A2A] flex justify-between">
                      <span className="text-[#888888] text-xs font-['JetBrains_Mono']">Total shielded</span>
                      <span className="text-[#FF6B00] text-xs font-['JetBrains_Mono'] font-bold">
                        {totalShielded.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>

                {/* 3. AirSign Escrow */}
                <div className="card border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h2 className="font-['Space_Grotesk'] font-bold text-sm tracking-wider uppercase">AirSign</h2>
                      <span className="tag">Escrow</span>
                    </div>
                  </div>
                  <div className="py-4 text-center">
                    <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mb-2">
                      On-chain escrow PDAs
                    </p>
                    <Link href="/app" className="text-[#FF6B00] text-xs font-['JetBrains_Mono'] hover:text-white transition-colors">
                      Create AirSign voucher
                    </Link>
                  </div>
                </div>

              </div>

              {/* ── Quick Actions ── */}
              <div className="card mb-6">
                <h2 className="font-['Space_Grotesk'] font-bold text-sm tracking-wider uppercase mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Link
                    href="/app"
                    className="bg-[#0A0A0A] border-2 border-[#FF6B00] rounded p-4 flex flex-col gap-1 hover:bg-[#FF6B00]/5 transition-colors no-underline"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="tag tag-orange">OTS</span>
                    </div>
                    <span className="font-['Space_Grotesk'] font-bold text-white text-sm">Shield to Vault</span>
                    <span className="text-[#888888] text-xs font-['Inter']">Deposit tokens into Shielded Vault</span>
                  </Link>
                  <Link
                    href="/app"
                    className="bg-[#0A0A0A] border-2 border-[#2A2A2A] rounded p-4 flex flex-col gap-1 hover:border-white transition-colors no-underline"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="tag !text-white !border-white">ZK</span>
                    </div>
                    <span className="font-['Space_Grotesk'] font-bold text-white text-sm">StealthSend</span>
                    <span className="text-[#888888] text-xs font-['Inter']">Private transfer via ZK pool</span>
                  </Link>
                  <Link
                    href="/app"
                    className="bg-[#0A0A0A] border-2 border-[#2A2A2A] rounded p-4 flex flex-col gap-1 hover:border-[#888888] transition-colors no-underline"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="tag">OFFLINE</span>
                    </div>
                    <span className="font-['Space_Grotesk'] font-bold text-white text-sm">AirSign</span>
                    <span className="text-[#888888] text-xs font-['Inter']">sToken to aToken, sign voucher offline</span>
                  </Link>
                </div>
              </div>

              {/* ── Stats Row ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatBox
                  label="SOL Balance"
                  value={portfolioLoading ? "..." : `${solBalance.toFixed(4)}`}
                  sub="SOL"
                />
                <StatBox
                  label="Shielded"
                  value={vaultLoading ? "..." : `${shieldedBalances.length}`}
                  sub="sToken types"
                />
                <StatBox
                  label="AirSign"
                  value="--"
                  sub="check escrow PDAs"
                />
                <StatBox
                  label="Transactions"
                  value={`${recentTx.length}`}
                  sub="on-chain"
                />
              </div>

              {/* ── Recent Activity ── */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-['Space_Grotesk'] font-bold text-sm tracking-wider uppercase">Recent Activity</h2>
                  <Link href="/app" className="text-[#888888] hover:text-white text-xs font-['JetBrains_Mono'] transition-colors">
                    View all
                  </Link>
                </div>

                {recentTx.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-[#2A2A2A] rounded">
                    <p className="text-[#888888] text-sm font-['Inter'] mb-2">No transactions yet</p>
                    <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
                      Start by shielding tokens in Shielded Vault
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {recentTx.map((tx, i) => (
                      <div
                        key={tx.signature}
                        className={`flex items-center justify-between py-3 ${i < recentTx.length - 1 ? "border-b border-[#1A1A1A]" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="tag">{tx.type}</span>
                          <span className="text-[#888888] font-['JetBrains_Mono'] text-xs">
                            {tx.token ?? "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          {tx.amount != null && (
                            <span className="font-['JetBrains_Mono'] text-sm">{tx.amount}</span>
                          )}
                          <span
                            className={`font-['JetBrains_Mono'] text-xs ${tx.status === "success" ? "text-green-500" : "text-[#FF6B00]"}`}
                          >
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Program status footer ── */}
              <div className="flex items-center gap-6 pt-6 mt-2 border-t border-[#2A2A2A]">
                <span className="font-['JetBrains_Mono'] text-xs text-[#888888]">signito_vault: deploying</span>
                <span className="font-['JetBrains_Mono'] text-xs text-[#888888]">signito_zk: deploying</span>
                <span className="font-['JetBrains_Mono'] text-xs text-[#888888]">signito_token: deploying</span>
                <span className="font-['JetBrains_Mono'] text-xs text-[#888888]">Mainnet: coming soon</span>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
