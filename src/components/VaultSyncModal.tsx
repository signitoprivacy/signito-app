import React, { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { fetchUserState } from "@workspace/program";
import { useWallet } from "../lib/wallet";
import { validateVaultCode, syncOtsGeneration } from "../lib/ots";

interface VaultSyncModalProps {
  onClose: () => void;
}

type SyncStatus =
  | { kind: "idle" }
  | { kind: "loading"; gen: number }
  | { kind: "success"; generation: number; chainDepth: number; maxDepth: number }
  | { kind: "not_found" }
  | { kind: "no_vault" }
  | { kind: "error"; msg: string };

export function VaultSyncModal({ onClose }: VaultSyncModalProps) {
  const { publicKey, connection } = useWallet();
  const [vaultCode, setVaultCode] = useState("");
  const [status, setStatus] = useState<SyncStatus>({ kind: "idle" });

  const isValidCode = validateVaultCode(vaultCode);

  const handleVerify = async () => {
    if (!publicKey || !connection || !isValidCode) return;
    setStatus({ kind: "loading", gen: 0 });

    try {
      // Fetch vault from API to get stokenAccount, then read user_state on-chain
      const apiRes = await fetch(`/api/vault/${publicKey}`);
      const apiData = await apiRes.json() as { vault?: { stokenAccount?: string } | null };
      const stokenAccountStr = apiData?.vault?.stokenAccount;
      if (!stokenAccountStr) {
        setStatus({ kind: "no_vault" });
        return;
      }

      const stokenAtaPk = new PublicKey(stokenAccountStr);
      const vaultState = await fetchUserState(connection, stokenAtaPk);
      if (!vaultState) {
        setStatus({ kind: "no_vault" });
        return;
      }

      const { chainDepth, currentOtsHash } = vaultState;

      const result = await syncOtsGeneration(
        vaultCode,
        publicKey,
        currentOtsHash,
        chainDepth,
        9,
        (gen) => setStatus({ kind: "loading", gen })
      );

      if (result) {
        setStatus({ kind: "success", generation: result.generation, chainDepth, maxDepth: 32 });
      } else {
        setStatus({ kind: "not_found" });
      }
    } catch (err) {
      setStatus({ kind: "error", msg: err instanceof Error ? err.message : "Unknown error" });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-[#0A0A0A] border border-[#2A2A2A] w-full max-w-sm mx-4 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="tag tag-orange">SAFEVAULT</span>
              <span className="tag">OTS</span>
            </div>
            <h2 className="font-['Space_Grotesk'] font-bold text-white text-lg">Sync Vault</h2>
            <p className="text-[#888888] text-xs font-['Inter'] mt-1">
              Verify your vault code on this device and check current OTS position.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#888888] hover:text-white transition-colors text-lg leading-none mt-0.5"
          >
            x
          </button>
        </div>

        {publicKey && (
          <div className="bg-[#141414] border border-[#2A2A2A] rounded px-3 py-2">
            <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
              {publicKey.slice(0, 12)}...{publicKey.slice(-8)}
            </p>
          </div>
        )}

        {!publicKey && (
          <div className="bg-[#141414] border border-[#2A2A2A] rounded px-3 py-2">
            <p className="text-[#888888] text-xs font-['JetBrains_Mono']">Connect wallet to sync.</p>
          </div>
        )}

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
            onChange={(e) => setVaultCode(e.target.value)}
            disabled={!publicKey || status.kind === "loading"}
          />
          {vaultCode.length > 0 && !isValidCode && (
            <p className="text-[#FF6B00] text-xs font-['JetBrains_Mono'] mt-1">
              8 chars required: letters and numbers only
            </p>
          )}
        </div>

        {status.kind === "loading" && (
          <div className="bg-[#141414] border border-[#2A2A2A] rounded px-3 py-3">
            <p className="text-[#888888] text-xs font-['JetBrains_Mono'] animate-pulse">
              Checking generation {status.gen}...
            </p>
            <p className="text-[#555] text-xs font-['JetBrains_Mono'] mt-1">
              PBKDF2 derivation, this takes a moment
            </p>
          </div>
        )}

        {status.kind === "success" && (
          <div className="border border-green-500/40 bg-green-500/5 rounded px-3 py-3 space-y-2">
            <p className="text-green-400 text-xs font-['JetBrains_Mono'] font-bold">
              Vault code verified
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                <span className="text-[#888888]">OTS chain depth remaining</span>
                <span className={`font-bold ${status.chainDepth < 5 ? "text-red-400" : "text-[#FF6B00]"}`}>
                  {status.chainDepth} / {status.maxDepth}
                </span>
              </div>
              <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                <span className="text-[#888888]">OTS generation</span>
                <span className="text-white">{status.generation}</span>
              </div>
            </div>
            {status.chainDepth < 5 && status.chainDepth > 0 && (
              <p className="text-[#FF6B00] text-xs font-['JetBrains_Mono']">
                {status.chainDepth} operations remaining. Refresh chain soon.
              </p>
            )}
            {status.chainDepth === 0 && (
              <p className="text-red-400 text-xs font-['JetBrains_Mono']">
                Chain exhausted. Go to Shielded Vault, OTS tab to refresh.
              </p>
            )}
          </div>
        )}

        {status.kind === "not_found" && (
          <div className="border border-red-500/30 bg-[#0A0A0A] rounded px-3 py-3">
            <p className="text-red-400 text-xs font-['JetBrains_Mono'] font-bold">
              Vault code does not match
            </p>
            <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mt-1">
              Checked generations 0 to 9. Check your vault code and try again.
            </p>
          </div>
        )}

        {status.kind === "no_vault" && (
          <div className="border border-[#2A2A2A] rounded px-3 py-3">
            <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
              No vault found for this wallet. Shield funds to create one.
            </p>
          </div>
        )}

        {status.kind === "error" && (
          <div className="border border-red-500/30 rounded px-3 py-3">
            <p className="text-red-400 text-xs font-['JetBrains_Mono']">{status.msg}</p>
          </div>
        )}

        <button
          className="btn-primary w-full justify-center"
          disabled={!publicKey || !isValidCode || status.kind === "loading"}
          onClick={handleVerify}
        >
          {status.kind === "loading" ? "Verifying..." : "Verify Vault Code"}
        </button>

        <p className="text-[#555] text-xs font-['JetBrains_Mono'] leading-relaxed">
          Vault code never leaves your browser. Verification is purely local: we
          derive the OTS chain and compare against on-chain state.
        </p>
      </div>
    </div>
  );
}
