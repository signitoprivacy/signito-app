import React, { useState, useCallback } from "react";
import { NavBar } from "../components/NavBar";
import { Sidebar } from "../components/Sidebar";
import { useWallet } from "../lib/wallet";
import {
  useGetRelayInfo,
  getGetRelayInfoQueryKey,
  useGetVault,
  getGetVaultQueryKey,
  useGetVaultBalances,
  getGetVaultBalancesQueryKey,
  useStealthZkTransfer,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { validateVaultCode, deriveOtsPreimage } from "../lib/ots";

function TxLink({ sig }: { sig: string }) {
  return (
    <a
      href={`https://solscan.io/tx/${sig}?cluster=devnet`}
      target="_blank"
      rel="noopener noreferrer"
      className="font-['JetBrains_Mono'] text-[#FF6B00] hover:text-white text-xs break-all"
    >
      {sig.slice(0, 12)}...{sig.slice(-8)}
    </a>
  );
}

export default function StealthPage() {
  const { connected, publicKey } = useWallet();
  const queryClient = useQueryClient();

  const { data: relayInfo } = useGetRelayInfo({
    query: { queryKey: getGetRelayInfoQueryKey() },
  });

  const { data: vaultData, isLoading: vaultLoading } = useGetVault(publicKey ?? "", {
    query: { queryKey: getGetVaultQueryKey(publicKey ?? ""), enabled: !!publicKey, staleTime: 3_000, refetchInterval: 5_000 },
  });

  const { data: balancesData } = useGetVaultBalances(publicKey ?? "", {
    query: { queryKey: getGetVaultBalancesQueryKey(publicKey ?? ""), enabled: !!publicKey, staleTime: 3_000, refetchInterval: 5_000 },
  });

  const zkTransferMutation = useStealthZkTransfer();

  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [vaultCode, setVaultCode] = useState("");
  const [txSig, setTxSig] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const relayReady = relayInfo?.ready ?? false;
  const vault = vaultData?.vault ?? null;
  const chainDepth = vault?.chainDepth ?? 0;
  const vaultExists = !vaultLoading && !!vault;

  const ssolBalance = balancesData?.balances?.find((b) => b.token === "sSOL")?.shieldedAmount ?? 0;
  const isValidCode = validateVaultCode(vaultCode);
  const parsedAmount = parseFloat(amount);
  const canSubmit =
    relayReady &&
    connected &&
    vaultExists &&
    chainDepth > 0 &&
    isValidCode &&
    !!amount &&
    parsedAmount > 0 &&
    parsedAmount <= ssolBalance &&
    recipient.length >= 32 &&
    !pending;

  const invalidateAll = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetVaultQueryKey(publicKey ?? "") }),
      queryClient.invalidateQueries({ queryKey: getGetVaultBalancesQueryKey(publicKey ?? "") }),
    ]);
  }, [queryClient, publicKey]);

  const handleSend = useCallback(async () => {
    if (!publicKey || !vaultExists || !isValidCode) return;
    setError("");
    setPending(true);
    try {
      const sendAmt = parseFloat(amount);
      const preimage = await deriveOtsPreimage(vaultCode, publicKey, chainDepth, 1);
      const result = await zkTransferMutation.mutateAsync({
        data: {
          wallet: publicKey,
          amount: sendAmt,
          recipient,
          token: "SOL",
          preimage,
        },
      });
      // Optimistically reflect the balance deduction before refetch completes
      queryClient.setQueryData(
        getGetVaultBalancesQueryKey(publicKey ?? ""),
        (old: unknown) => {
          if (!old || typeof old !== "object" || !("balances" in old)) return old;
          const d = old as { balances: { token: string; shieldedAmount: number }[]; [k: string]: unknown };
          return {
            ...d,
            balances: d.balances.map((b) =>
              b.token === "sSOL"
                ? { ...b, shieldedAmount: Math.max(0, (b.shieldedAmount ?? 0) - sendAmt) }
                : b
            ),
          };
        }
      );
      await invalidateAll();
      setTxSig(result.txSig);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }, [publicKey, vaultExists, isValidCode, vaultCode, chainDepth, amount, recipient, zkTransferMutation, invalidateAll, queryClient]);

  const reset = () => {
    setTxSig(null);
    setError("");
    setAmount("");
    setRecipient("");
    setVaultCode("");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <NavBar />
      <Sidebar />

      <main className="pt-[56px] md:pl-[220px]">
        <div className="px-3 sm:px-5 py-5 max-w-2xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="tag tag-orange">STEALTHSEND</span>
            <span className="tag">ZK RELAY</span>
          </div>

          <h1 className="font-['Space_Grotesk'] text-3xl font-bold mb-2">ZK Privacy Transfer</h1>
          <p className="text-[#888888] text-sm mb-8 leading-relaxed">
            Prove vault ownership via OTS. SignitoRelay pays the fee and broadcasts.
            On-chain: relay wallet to recipient only. Your wallet has no on-chain trace.
          </p>

          {!connected && (
            <div className="mb-6 flex items-center gap-2 bg-[#141414] border border-[#2A2A2A] px-4 py-2.5">
              <div className="w-2 h-2 rounded-full bg-[#888888]" />
              <span className="text-[#888888] text-xs font-['JetBrains_Mono']">Connect wallet to enable ZK transfer</span>
            </div>
          )}

          <div className="card">
            {txSig ? (
              <div className="space-y-4">
                <div className="border border-green-500/40 bg-green-500/5 rounded p-4 space-y-2">
                  <p className="text-green-400 text-xs font-['JetBrains_Mono'] font-bold">Transfer complete</p>
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
                    SignitoRelay sent {amount} SOL to recipient. Your wallet has no on-chain trace.
                  </p>
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
                    {amount} sSOL deducted from your shielded balance.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[#888888] text-xs font-['JetBrains_Mono']">Tx:</span>
                    <TxLink sig={txSig} />
                  </div>
                </div>
                <button className="btn-secondary w-full justify-center" onClick={reset}>
                  New Transfer
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {connected && (
                  <div className={`border rounded p-3 space-y-1 ${vaultExists ? "border-[#FF6B00]/30 bg-[#FF6B00]/5" : "border-red-500/30 bg-[#0A0A0A]"}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-['JetBrains_Mono'] text-[#888888] uppercase tracking-wider">Vault Status</span>
                      {vaultLoading ? (
                        <span className="text-xs font-['JetBrains_Mono'] text-[#555]">checking...</span>
                      ) : vaultExists ? (
                        <span className="text-xs font-['JetBrains_Mono'] text-[#FF6B00]">Active</span>
                      ) : (
                        <span className="text-xs font-['JetBrains_Mono'] text-red-400">No vault. Shield first in Portfolio.</span>
                      )}
                    </div>
                    {vaultExists && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#888888] text-xs font-['JetBrains_Mono']">OTS depth remaining:</span>
                        <span className={`text-xs font-['JetBrains_Mono'] font-bold ${chainDepth < 5 ? "text-red-400" : "text-[#FF6B00]"}`}>
                          {chainDepth}
                        </span>
                      </div>
                    )}
                    {vaultExists && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#888888] text-xs font-['JetBrains_Mono']">Shielded sSOL:</span>
                        <span className="text-white text-xs font-['JetBrains_Mono'] font-bold tabular-nums">
                          {Number(ssolBalance).toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-2 uppercase tracking-wider">
                    Amount (SOL)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={!connected || !relayReady}
                    step="0.001"
                    min="0.001"
                  />
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mt-1.5">
                    Shielded balance: {Number(ssolBalance).toFixed(4)} sSOL
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-2 uppercase tracking-wider">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Fresh Solana address"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value.trim())}
                    disabled={!connected}
                  />
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mt-1.5">
                    Use a fresh wallet to break on-chain link.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-2 uppercase tracking-wider">
                    Vault Code
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    maxLength={8}
                    placeholder="e.g. AB12cd34"
                    value={vaultCode}
                    onChange={(e) => setVaultCode(e.target.value)}
                    disabled={!connected}
                  />
                  {vaultCode.length > 0 && !isValidCode && (
                    <p className="text-[#FF6B00] text-xs font-['JetBrains_Mono'] mt-1">
                      Must be 8 chars: letters and numbers only (a-z, A-Z, 0-9)
                    </p>
                  )}
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mt-1.5">
                    Proves vault ownership via OTS pre-image. Consumes one depth level.
                  </p>
                </div>

                <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded p-3">
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] leading-relaxed">
                    No transaction from your wallet. SignitoRelay signs and pays the fee.
                    On-chain trace: relay wallet to recipient only. Your wallet is absent.
                  </p>
                </div>

                {!relayReady && (
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
                    SignitoRelay not configured. Contact team to enable.
                  </p>
                )}

                {error && (
                  <p className="text-red-400 text-xs font-['JetBrains_Mono']">{error}</p>
                )}

                <button
                  className="btn-primary w-full justify-center"
                  disabled={!canSubmit}
                  onClick={handleSend}
                >
                  {!connected
                    ? "Connect Wallet First"
                    : !relayReady
                      ? "Relay Unavailable"
                      : !vaultExists
                        ? "No vault, shield first"
                        : chainDepth <= 0
                          ? "OTS chain exhausted"
                          : parsedAmount > 0 && parsedAmount > ssolBalance
                            ? "Insufficient sSOL balance"
                            : pending
                              ? "Sending..."
                              : `Send ${amount || "0"} SOL via ZK Relay`}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
