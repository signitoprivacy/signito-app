import React from "react";
import { NavBar } from "../components/NavBar";
import { useWallet } from "../lib/wallet";
import { useGetTransactions, getGetTransactionsQueryKey } from "@workspace/api-client-react";

export default function HistoryPage() {
  const { connected, publicKey } = useWallet();

  const { data, isLoading } = useGetTransactions(publicKey || "", {
    query: { queryKey: getGetTransactionsQueryKey(publicKey || ""), enabled: !!publicKey },
  });

  const txList = data?.transactions ?? [];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <NavBar />

      <main className="pt-[56px]">
        <div className="mx-auto w-full max-w-2xl px-3 sm:px-5 py-5 sm:py-8">

          <div className="flex items-center gap-3 mb-2">
            <span className="tag">HISTORY</span>
          </div>
          <h1 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-bold mb-6">Transactions</h1>

          {!connected ? (
            <div className="bg-[#141414] border border-[#2A2A2A] p-10 text-center">
              <p className="text-[#888888] font-['Inter'] text-sm">Connect wallet to view transaction history</p>
            </div>

          ) : isLoading ? (
            <div className="bg-[#141414] border border-[#2A2A2A] p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-[#2A2A2A]/40 animate-pulse" />
              ))}
            </div>

          ) : txList.length === 0 ? (
            <div className="bg-[#141414] border border-[#2A2A2A] p-10 text-center">
              <p className="font-['Space_Grotesk'] font-semibold text-sm mb-2">No transactions yet</p>
              <p className="text-[#888888] font-['Inter'] text-xs">
                Shield a token in your Portfolio to create your first transaction.
              </p>
            </div>

          ) : (
            <div className="bg-[#141414] border border-[#2A2A2A] overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[480px]">
                <thead>
                  <tr className="border-b border-[#2A2A2A]">
                    {["Type", "Token", "Amount", "Status", "Signature"].map((h) => (
                      <th
                        key={h}
                        className="px-3 sm:px-5 py-3 text-[10px] font-['JetBrains_Mono'] text-[#888888] font-normal tracking-wider uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txList.map((tx, i) => (
                    <tr
                      key={tx.signature}
                      className={`${i < txList.length - 1 ? "border-b border-[#1A1A1A]" : ""} hover:bg-[#1A1A1A] transition-colors`}
                    >
                      <td className="px-3 sm:px-5 py-3">
                        <span className="tag text-[10px]">{tx.type}</span>
                      </td>
                      <td className="px-3 sm:px-5 py-3 font-['JetBrains_Mono'] text-sm">{tx.token ?? "-"}</td>
                      <td className="px-3 sm:px-5 py-3 font-['JetBrains_Mono'] text-sm tabular-nums">{tx.amount ?? "-"}</td>
                      <td className="px-3 sm:px-5 py-3">
                        <span
                          className={`font-['JetBrains_Mono'] text-xs font-semibold ${
                            tx.status === "success" ? "text-green-400" : "text-[#FF6B00]"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-5 py-3 font-['JetBrains_Mono'] text-xs text-[#888888]">
                        {tx.signature.slice(0, 6)}...{tx.signature.slice(-4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
