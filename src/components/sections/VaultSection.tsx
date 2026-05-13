import React, { useState } from "react";
import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import { useWallet } from "../../lib/wallet";
import {
  useGetVault,
  getGetVaultQueryKey,
  useGetPortfolio,
  getGetPortfolioQueryKey,
  useCreateVault,
  useUnshieldVault,
} from "@workspace/api-client-react";
import { validateVaultCode, deriveOtsHash, deriveOtsPreimage, deriveOtsTip, syncOtsGeneration } from "../../lib/ots";
import { fetchVaultState, buildRefreshOtsIx, buildVersionedTx } from "@workspace/program";
import { TokenSelect } from "../TokenSelect";
import { useQueryClient } from "@tanstack/react-query";

type OtsSyncState =
  | { kind: "idle" }
  | { kind: "detecting" }
  | { kind: "found"; generation: number; nextGenTip: string }
  | { kind: "failed" };

function OtsTab({
  connected,
  publicKey,
  chainDepth,
  vaultExists,
  onRefreshComplete,
}: {
  connected: boolean;
  publicKey: string | null;
  chainDepth: number;
  vaultExists: boolean;
  onRefreshComplete?: () => void;
}) {
  const { connection, signTransaction } = useWallet();
  const [vaultCode, setVaultCode] = useState("");
  const [syncState, setSyncState] = useState<OtsSyncState>({ kind: "idle" });
  const [newDepth, setNewDepth] = useState(32);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTxSig, setRefreshTxSig] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const isValidCode = validateVaultCode(vaultCode);

  const handleDetect = async () => {
    if (!publicKey || !connection || !isValidCode) return;
    setSyncState({ kind: "detecting" });
    try {
      const onChain = await fetchVaultState(connection, new PublicKey(publicKey));
      if (!onChain) { setSyncState({ kind: "failed" }); return; }

      const result = await syncOtsGeneration(
        vaultCode,
        publicKey,
        onChain.currentOtsHash,
        onChain.chainDepth,
        9
      );
      if (!result) { setSyncState({ kind: "failed" }); return; }

      const nextGen = result.generation + 1;
      const nextTip = await deriveOtsTip(vaultCode, publicKey, newDepth, nextGen);
      setSyncState({ kind: "found", generation: result.generation, nextGenTip: nextTip });
    } catch {
      setSyncState({ kind: "failed" });
    }
  };

  const handleRefresh = async () => {
    if (syncState.kind !== "found" || !publicKey || !signTransaction || !connection) return;
    setRefreshing(true);
    setRefreshError(null);
    setRefreshTxSig(null);
    try {
      const prepRes = await fetch("/api/vault/prepare-refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: publicKey,
          newOtsTip: syncState.nextGenTip,
          chainDepth: newDepth,
        }),
      });
      if (!prepRes.ok) {
        const e = await prepRes.json().catch(() => ({ error: "Failed to prepare refresh" })) as { error?: string };
        throw new Error(e.error ?? "Failed to prepare refresh");
      }
      const { txBase64 } = await prepRes.json() as { txBase64: string };

      const txBytes = Buffer.from(txBase64, "base64");
      const tx = VersionedTransaction.deserialize(txBytes);
      const signed = await signTransaction(tx);

      const relayRes = await fetch("/api/relay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction: Buffer.from(signed.serialize()).toString("base64"),
          wallet: publicKey,
        }),
      });
      if (!relayRes.ok) {
        const e = await relayRes.json().catch(() => ({ error: "Relay failed" })) as { error?: string };
        throw new Error(e.error ?? "Relay failed");
      }
      const { signature } = await relayRes.json() as { signature: string };

      for (let i = 0; i < 20; i++) {
        const statusRes = await connection.getSignatureStatus(signature, { searchTransactionHistory: true });
        const status = statusRes.value;
        if (status && !status.err) {
          const conf = status.confirmationStatus;
          if (conf === "confirmed" || conf === "finalized") break;
        } else if (status?.err) {
          throw new Error("Transaction failed on-chain: " + JSON.stringify(status.err));
        }
        await new Promise((r) => setTimeout(r, 2000));
      }

      await fetch("/api/vault/update-chain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: publicKey,
          chainDepth: newDepth,
          lastOts: syncState.nextGenTip,
          txSig: signature,
        }),
      });

      setRefreshTxSig(signature);
      setSyncState({ kind: "idle" });
      setVaultCode("");
      onRefreshComplete?.();
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : String(err));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-[#888888] text-sm">
        Your SafeVault uses a PBKDF2 hash chain. Each unshield consumes one OTS depth level.
        When exhausted, refresh to generate a new 32-step chain from the same vault code.
      </p>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0A0A0A] border border-[#2A2A2A] p-4 rounded">
          <p className="text-[#888888] font-['JetBrains_Mono'] text-xs mb-2">Chain Depth</p>
          <p className={`font-['Space_Grotesk'] text-3xl font-bold ${connected && vaultExists && chainDepth < 5 ? "text-red-400" : "text-white"}`}>
            {connected ? (vaultExists ? chainDepth : 0) : "-"}
          </p>
        </div>
        <div className="bg-[#0A0A0A] border border-[#2A2A2A] p-4 rounded">
          <p className="text-[#888888] font-['JetBrains_Mono'] text-xs mb-2">Status</p>
          <p className={`font-['Space_Grotesk'] text-2xl font-bold ${connected && vaultExists ? (chainDepth === 0 ? "text-red-400" : chainDepth < 5 ? "text-[#FF6B00]" : "text-green-500") : "text-[#888888]"}`}>
            {connected && vaultExists ? (chainDepth === 0 ? "DEAD" : chainDepth < 5 ? "LOW" : "OK") : "-"}
          </p>
        </div>
        <div className="bg-[#0A0A0A] border border-[#2A2A2A] p-4 rounded">
          <p className="text-[#888888] font-['JetBrains_Mono'] text-xs mb-2">Algorithm</p>
          <p className="font-['Space_Grotesk'] text-base font-bold font-['JetBrains_Mono']">PBKDF2</p>
        </div>
      </div>

      <div className="border border-[#2A2A2A] rounded p-4 space-y-4">
        <p className="text-white text-xs font-['JetBrains_Mono'] font-bold">Refresh OTS Chain</p>
        <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
          Enter your vault code to generate a new chain. Same vault code, next generation.
          Funds stay in the vault, no on-chain transfer needed.
        </p>

        <div>
          <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-2">
            Vault Code
          </label>
          <input
            type="password"
            className="input-field"
            maxLength={8}
            placeholder="8 chars (e.g. abcd1234)"
            value={vaultCode}
            onChange={(e) => { setVaultCode(e.target.value); setSyncState({ kind: "idle" }); }}
            disabled={!connected || syncState.kind === "detecting"}
          />
          {vaultCode.length > 0 && !isValidCode && (
            <p className="text-[#FF6B00] text-xs font-['JetBrains_Mono'] mt-1">
              8 chars required: letters and numbers only
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-2">
            New chain depth
          </label>
          <input
            type="number"
            className="input-field"
            value={newDepth}
            min={8}
            max={128}
            onChange={(e) => setNewDepth(parseInt(e.target.value) || 32)}
            disabled={!connected}
          />
        </div>

        {syncState.kind === "detecting" && (
          <div className="bg-[#141414] border border-[#2A2A2A] rounded px-3 py-2">
            <p className="text-[#888888] text-xs font-['JetBrains_Mono'] animate-pulse">
              Detecting generation via PBKDF2...
            </p>
          </div>
        )}

        {syncState.kind === "found" && (
          <div className="border border-[#FF6B00]/30 bg-[#FF6B00]/5 rounded px-3 py-3 space-y-2">
            <p className="text-[#FF6B00] text-xs font-['JetBrains_Mono'] font-bold">
              Ready to refresh
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                <span className="text-[#888888]">Current generation</span>
                <span className="text-white">{syncState.generation}</span>
              </div>
              <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                <span className="text-[#888888]">Next generation</span>
                <span className="text-[#FF6B00]">{syncState.generation + 1}</span>
              </div>
              <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                <span className="text-[#888888]">New chain tip (H{newDepth})</span>
                <span className="text-[#555] text-[10px] truncate max-w-[120px]">{syncState.nextGenTip.slice(0, 16)}...</span>
              </div>
              <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                <span className="text-[#888888]">New depth</span>
                <span className="text-white">{newDepth}</span>
              </div>
            </div>
          </div>
        )}

        {syncState.kind === "failed" && (
          <p className="text-red-400 text-xs font-['JetBrains_Mono']">
            Vault code incorrect or no vault found. Check your code and try again.
          </p>
        )}

        {refreshError && (
          <p className="text-red-400 text-xs font-['JetBrains_Mono']">{refreshError}</p>
        )}

        {refreshTxSig && (
          <div className="border border-green-500/30 bg-green-500/5 rounded px-3 py-2">
            <p className="text-green-400 text-xs font-['JetBrains_Mono'] font-bold mb-1">Chain refreshed on-chain</p>
            <a
              href={`https://explorer.solana.com/tx/${refreshTxSig}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              className="text-[#888888] font-['JetBrains_Mono'] text-[10px] hover:text-white transition-colors break-all"
            >
              {refreshTxSig.slice(0, 24)}...
            </a>
          </div>
        )}

        {syncState.kind !== "found" ? (
          <button
            className="btn-secondary w-full justify-center"
            disabled={!connected || !isValidCode || !vaultExists || syncState.kind === "detecting"}
            onClick={handleDetect}
          >
            {!connected
              ? "Connect Wallet First"
              : syncState.kind === "detecting"
                ? "Deriving chain..."
                : "Preview Refresh"}
          </button>
        ) : (
          <button
            className="btn-primary w-full justify-center"
            disabled={refreshing || !signTransaction}
            onClick={handleRefresh}
          >
            {refreshing ? "Signing and submitting..." : "Refresh Chain (on-chain)"}
          </button>
        )}
      </div>

      <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded p-4">
        <p className="text-[#888888] text-xs font-['JetBrains_Mono'] leading-relaxed">
          Gen 0: H0 = PBKDF2(vaultCode, wallet) to H32 (stored on-chain).{" "}
          Gen N: H0 = PBKDF2(vaultCode, wallet + ":gen:" + N) to H{newDepth}.{" "}
          Each unshield reveals H_i and verifies SHA256(H_i) == tip, then tip advances.
        </p>
      </div>
    </div>
  );
}

const MOCK_TOKENS = [
  { symbol: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", uiAmount: 0 },
];

export function VaultSection() {
  const { connected, publicKey } = useWallet();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("deposit");

  const { data: vaultData, isLoading: vaultLoading } = useGetVault(publicKey ?? "", {
    query: { queryKey: getGetVaultQueryKey(publicKey ?? ""), enabled: !!publicKey },
  });

  const { data: portfolio } = useGetPortfolio(publicKey ?? "", {
    query: { queryKey: getGetPortfolioQueryKey(publicKey ?? ""), enabled: !!publicKey },
  });

  const createVaultMutation = useCreateVault();
  const unshieldMutation = useUnshieldVault();

  const [vaultCode, setVaultCode] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("SOL");
  const [recipient, setRecipient] = useState("");

  const [shieldSuccess, setShieldSuccess] = useState(false);
  const [unshieldSuccess, setUnshieldSuccess] = useState<{ newDepth: number } | null>(null);
  const [opError, setOpError] = useState("");

  const isValidCode = validateVaultCode(vaultCode);
  const solBalance = portfolio?.solBalance ?? 0;
  const splTokens = portfolio?.tokens ?? MOCK_TOKENS;

  const vault = vaultData?.vault ?? null;
  const vaultExists = !vaultLoading && !!vault;
  const chainDepth = vault?.chainDepth ?? 0;
  const needsVaultCode = !vaultLoading && !vault;

  const tabs = ["deposit", "withdraw", "ots"];

  const invalidateAll = async () => {
    if (!publicKey) return;
    await queryClient.invalidateQueries({ queryKey: getGetVaultQueryKey(publicKey) });
    await queryClient.invalidateQueries({ queryKey: getGetPortfolioQueryKey(publicKey) });
  };

  const resetForm = () => {
    setVaultCode("");
    setAmount("");
    setRecipient("");
    setOpError("");
    setShieldSuccess(false);
    setUnshieldSuccess(null);
  };

  const handleShield = async () => {
    if (!publicKey || !amount) return;
    setOpError("");
    if (needsVaultCode) {
      if (!isValidCode) return;
      try {
        const codeHash = await deriveOtsHash(vaultCode, publicKey);
        await createVaultMutation.mutateAsync({
          data: { wallet: publicKey, codeHash, chainDepth: 32 },
        });
        await queryClient.invalidateQueries({ queryKey: getGetVaultQueryKey(publicKey) });
        setShieldSuccess(true);
      } catch {
        setOpError("Vault registration failed. Try again.");
      }
    } else {
      setShieldSuccess(true);
    }
  };

  const handleUnshield = async () => {
    if (!publicKey || !amount || !recipient || !isValidCode || !vault) return;
    setOpError("");
    try {
      const preimage = await deriveOtsPreimage(vaultCode, publicKey, vault.chainDepth, 1);
      const result = await unshieldMutation.mutateAsync({
        data: {
          wallet: publicKey,
          amount: parseFloat(amount),
          destination: recipient,
          preimage,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getGetVaultQueryKey(publicKey) });
      setUnshieldSuccess({ newDepth: result.newChainDepth });
    } catch {
      setOpError("Vault code incorrect or OTS verification failed. Check your vault code and try again.");
    }
  };

  return (
    <div className="px-3 sm:px-5 py-5 max-w-2xl">
      <div className="bg-[#141414] border-b border-[#2A2A2A] px-3 sm:px-5 py-2.5 -mx-3 sm:-mx-5 -mt-5 mb-5">
        <p className="font-['JetBrains_Mono'] text-[#888888] text-xs">
          signito_vault program pending deployment. Vault registration and OTS verification are live.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <span className="tag tag-orange">SAFEVAULT</span>
        <span className="tag">OTS</span>
      </div>

      <h1 className="font-['Space_Grotesk'] text-3xl font-bold mb-2">OTS Protocol Vault</h1>
      <p className="text-[#888888] text-sm mb-8 leading-relaxed">
        Shield SPL tokens behind a PBKDF2 hash chain. Deposits become sTokens (NonTransferable SPL Token-2022).
        Each withdrawal consumes one OTS depth level.
      </p>

      <div className="flex border-b border-[#2A2A2A] mb-8">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); resetForm(); }}
            className={`px-6 py-3 font-['Space_Grotesk'] font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab
                ? "border-[#FF6B00] text-white"
                : "border-transparent text-[#888888] hover:text-white"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {!connected && (
        <div className="mb-4 flex items-center gap-2 bg-[#141414] border border-[#2A2A2A] rounded px-4 py-2.5">
          <div className="w-2 h-2 rounded-full bg-[#888888]" />
          <span className="text-[#888888] text-xs font-['JetBrains_Mono']">
            Connect wallet to enable actions
          </span>
        </div>
      )}

      <div className="card">
        {activeTab === "deposit" && (
          <div className="space-y-6">
            {shieldSuccess ? (
              <div className="border border-green-500/40 bg-green-500/5 rounded p-4 space-y-3">
                <p className="text-green-400 text-xs font-['JetBrains_Mono'] font-bold">
                  {needsVaultCode ? "Vault created" : "Vault registered"}, OTS Protocol active
                </p>
                <p className="text-[#888888] text-xs font-['JetBrains_Mono'] leading-relaxed">
                  {amount} {token} queued for shielding. On-chain execution will be enabled once
                  signito_vault deploys to Mainnet. Your vault code is set.
                </p>
                <div className="pt-2 border-t border-green-500/20 space-y-1">
                  <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                    <span className="text-[#888888]">Amount</span>
                    <span className="text-white">{amount} {token}</span>
                  </div>
                  <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                    <span className="text-[#888888]">OTS depth</span>
                    <span className="text-[#FF6B00]">32</span>
                  </div>
                </div>
                <button className="btn-secondary w-full justify-center mt-2" onClick={resetForm}>
                  New Deposit
                </button>
              </div>
            ) : (
              <>
                <p className="text-[#888888] text-sm">Shield your funds in the smart contract. SOL becomes sSOL, USDC becomes sUSDC.</p>

                {publicKey && (
                  <div className={`border rounded p-3 space-y-1 ${vaultExists ? "border-[#FF6B00]/40 bg-[#FF6B00]/5" : "border-[#2A2A2A] bg-[#0A0A0A]"}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-['JetBrains_Mono'] text-[#888888] uppercase tracking-wider">Vault</span>
                      {vaultLoading ? (
                        <span className="text-xs font-['JetBrains_Mono'] text-[#555]">checking...</span>
                      ) : vaultExists ? (
                        <span className="text-xs font-['JetBrains_Mono'] text-[#FF6B00]">Active</span>
                      ) : (
                        <span className="text-xs font-['JetBrains_Mono'] text-[#888888]">Not created</span>
                      )}
                    </div>
                    {vaultExists && (
                      <div className="flex items-center gap-3 pt-1 border-t border-[#FF6B00]/20">
                        <span className="text-[#888888] text-xs font-['JetBrains_Mono']">OTS depth remaining:</span>
                        <span className={`text-xs font-['JetBrains_Mono'] font-bold ${chainDepth < 5 ? "text-red-400" : "text-[#FF6B00]"}`}>
                          {chainDepth}
                        </span>
                      </div>
                    )}
                    {!vaultLoading && !vaultExists && (
                      <p className="text-[#888888] text-xs font-['JetBrains_Mono'] pt-1 border-t border-[#2A2A2A]">
                        First shield creates your vault. Set a vault code below. You will need it to unshield.
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-2">Token</label>
                    <TokenSelect
                      solBalance={solBalance}
                      tokens={splTokens}
                      value={token}
                      onChange={setToken}
                      disabled={!connected}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-2">Amount</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={!connected}
                    />
                  </div>
                </div>

                {needsVaultCode && (
                  <div>
                    <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-2">
                      Set Vault Code <span className="text-[#888888]">(PBKDF2 seed, never leaves browser)</span>
                    </label>
                    <input
                      type="password"
                      className="input-field"
                      maxLength={8}
                      placeholder="8 chars (e.g. abcd1234)"
                      value={vaultCode}
                      onChange={(e) => setVaultCode(e.target.value)}
                      disabled={!connected}
                    />
                    {vaultCode.length > 0 && !isValidCode && (
                      <p className="text-[#FF6B00] text-xs font-['JetBrains_Mono'] mt-1">
                        8 chars required: letters and numbers only
                      </p>
                    )}
                  </div>
                )}

                <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded p-3">
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
                    {token} to s{token} (NonTransferable SPL Token-2022, shielded by program PDA)
                  </p>
                </div>

                {opError && (
                  <p className="text-red-400 text-xs font-['JetBrains_Mono']">{opError}</p>
                )}

                <button
                  className="btn-primary w-full justify-center mt-2"
                  disabled={!connected || !amount || (needsVaultCode && !isValidCode) || createVaultMutation.isPending}
                  onClick={handleShield}
                >
                  {!connected
                    ? "Connect Wallet First"
                    : createVaultMutation.isPending
                      ? "Creating vault..."
                      : needsVaultCode
                        ? `Create Vault + Shield ${amount || "0"} ${token}`
                        : `Shield ${amount || "0"} ${token}`}
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === "withdraw" && (
          <div className="space-y-6">
            {unshieldSuccess ? (
              <div className="border border-green-500/40 bg-green-500/5 rounded p-4 space-y-3">
                <p className="text-green-400 text-xs font-['JetBrains_Mono'] font-bold">
                  OTS verified, unshield queued
                </p>
                <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
                  {amount} {token} queued for release to destination. On-chain execution pending
                  signito_vault deployment. OTS depth decremented.
                </p>
                <div className="pt-2 border-t border-green-500/20 space-y-1">
                  <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                    <span className="text-[#888888]">Amount</span>
                    <span className="text-white">{amount} {token}</span>
                  </div>
                  <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                    <span className="text-[#888888]">To</span>
                    <span className="text-white font-['JetBrains_Mono'] text-xs">
                      {recipient.slice(0, 8)}...{recipient.slice(-6)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                    <span className="text-[#888888]">OTS depth remaining</span>
                    <span className={`font-bold ${unshieldSuccess.newDepth < 5 ? "text-red-400" : "text-[#FF6B00]"}`}>
                      {unshieldSuccess.newDepth}
                    </span>
                  </div>
                </div>
                {unshieldSuccess.newDepth === 0 && (
                  <div className="border border-red-500/30 rounded p-2">
                    <p className="text-red-400 text-xs font-['JetBrains_Mono']">
                      OTS chain exhausted. Create a new vault to continue.
                    </p>
                  </div>
                )}
                <button className="btn-secondary w-full justify-center mt-2" onClick={resetForm}>
                  New Withdrawal
                </button>
              </div>
            ) : (
              <>
                <p className="text-[#888888] text-sm">Unshield tokens. Provide vault code to authorize the release.</p>

                {publicKey && (
                  <div className={`border rounded p-3 space-y-1 ${vaultExists ? "border-[#FF6B00]/30 bg-[#FF6B00]/5" : "border-red-500/30 bg-[#0A0A0A]"}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-['JetBrains_Mono'] text-[#888888] uppercase tracking-wider">Vault Status</span>
                      {vaultLoading ? (
                        <span className="text-xs font-['JetBrains_Mono'] text-[#555]">checking...</span>
                      ) : vaultExists ? (
                        <span className="text-xs font-['JetBrains_Mono'] text-[#FF6B00]">Active</span>
                      ) : (
                        <span className="text-xs font-['JetBrains_Mono'] text-red-400">No vault found</span>
                      )}
                    </div>
                    {vaultExists && (
                      <div className="flex items-center gap-3">
                        <span className="text-[#888888] text-xs font-['JetBrains_Mono']">OTS depth remaining:</span>
                        <span className={`text-xs font-['JetBrains_Mono'] font-bold ${chainDepth < 5 ? "text-red-400" : "text-[#FF6B00]"}`}>
                          {chainDepth}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-2">Token</label>
                    <TokenSelect
                      solBalance={solBalance}
                      tokens={splTokens}
                      value={token}
                      onChange={setToken}
                      disabled={!connected}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-2">Amount</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={!connected}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-2">Destination Address</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Solana address (can be a fresh address)"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    disabled={!connected}
                  />
                </div>

                <div>
                  <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-2">Vault Code</label>
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
                      8 chars required: letters and numbers only
                    </p>
                  )}
                </div>

                {vaultExists && chainDepth < 5 && (
                  <div className="border border-red-500/30 rounded p-3">
                    <p className="text-red-400 text-xs font-['JetBrains_Mono']">
                      Warning: {chainDepth} OTS signatures remaining. Extend your chain before withdrawing.
                    </p>
                  </div>
                )}

                {opError && (
                  <p className="text-red-400 text-xs font-['JetBrains_Mono']">{opError}</p>
                )}

                <button
                  className="btn-primary w-full justify-center mt-2"
                  disabled={!connected || !isValidCode || !amount || !recipient || !vaultExists || chainDepth <= 0 || unshieldMutation.isPending}
                  onClick={handleUnshield}
                >
                  {!connected
                    ? "Connect Wallet First"
                    : unshieldMutation.isPending
                      ? "Verifying OTS..."
                      : `Unshield ${amount || "0"} ${token}`}
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === "ots" && (
          <OtsTab
            connected={connected}
            publicKey={publicKey}
            chainDepth={chainDepth}
            vaultExists={vaultExists}
            onRefreshComplete={invalidateAll}
          />
        )}
      </div>
    </div>
  );
}
