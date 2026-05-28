import React, { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "../../lib/wallet";
import { QRCodeSVG } from "qrcode.react";
import { validateVaultCode, deriveOtsPreimage } from "../../lib/ots";
import {
  useAirsignMint,
  useGetVault,
  getGetVaultQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const AIRSIGN_TOKENS = ["SOL", "USDC", "USDT", "JUP", "BONK"];

type Step = 1 | 2 | 3;

function StepDot({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-7 h-7 border-2 flex items-center justify-center font-['JetBrains_Mono'] text-xs font-bold transition-colors ${
        done ? "bg-[#FF6B00] border-[#FF6B00] text-black" :
        active ? "border-[#FF6B00] text-[#FF6B00]" :
        "border-[#333] text-[#555]"
      }`}>
        {done ? "+" : n}
      </div>
      <span className={`text-[9px] font-['JetBrains_Mono'] uppercase tracking-wider ${active || done ? "text-white" : "text-[#555]"}`}>
        {label}
      </span>
    </div>
  );
}

function StepLine({ done }: { done: boolean }) {
  return <div className={`flex-1 h-px mt-3.5 mx-1 transition-colors ${done ? "bg-[#FF6B00]" : "bg-[#222]"}`} />;
}

export function AirSignSection() {
  const { publicKey, signMessage } = useWallet();
  const queryClient = useQueryClient();
  const mintMutation = useAirsignMint();

  const [step, setStep] = useState<Step>(1);
  const [token, setToken] = useState("SOL");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [vaultCode, setVaultCode] = useState("");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState("");
  const [claimUrl, setClaimUrl] = useState("");
  const [escrowPda, setEscrowPda] = useState("");
  const [txSig, setTxSig] = useState("");

  const { data: vaultResult } = useGetVault(publicKey ?? "", {
    query: { queryKey: getGetVaultQueryKey(publicKey ?? ""), enabled: !!publicKey, staleTime: 5_000 },
  });

  const vault = vaultResult?.vault ?? null;
  const chainDepth = vault?.chainDepth ?? 0;
  const vaultExists = !!vault;
  const codeValid = validateVaultCode(vaultCode);
  const amtNum = parseFloat(amount);
  const amountValid = !isNaN(amtNum) && amtNum > 0;
  let recipientValid = false;
  try {
    new PublicKey(recipient);
    recipientValid = recipient.length >= 32;
  } catch { recipientValid = false; }

  const canProceed = !!publicKey && vaultExists && chainDepth > 0 && codeValid && amountValid && recipientValid;

  const handleCreate = async () => {
    if (!canProceed || !signMessage) {
      if (!signMessage) setError("Wallet does not support message signing. Please use Phantom.");
      return;
    }
    setError("");
    setProcessing(true);
    setProcessingLabel("Deriving OTS pre-image...");
    try {
      const preimage = await deriveOtsPreimage(vaultCode, publicKey!, chainDepth, 1);
      const amountLamports = BigInt(Math.round(amtNum * LAMPORTS_PER_SOL));

      const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
      const nonceHex = Array.from(nonceBytes).map((b) => b.toString(16).padStart(2, "0")).join("");

      const msgBytes = new Uint8Array(56);
      const view = new DataView(msgBytes.buffer);
      view.setBigUint64(0, amountLamports, true);
      const recipientBytes = new PublicKey(recipient).toBytes();
      msgBytes.set(recipientBytes, 8);
      msgBytes.set(nonceBytes, 40);

      const voucherMsgHex = Array.from(msgBytes).map((b) => b.toString(16).padStart(2, "0")).join("");

      const nonceHashBuf = await crypto.subtle.digest("SHA-256", nonceBytes);
      const nonceHash = Array.from(new Uint8Array(nonceHashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");

      setStep(2);
      setProcessingLabel("Waiting for Phantom signature...");
      const sigBytes = await signMessage(msgBytes);
      const sigHex = Array.from(sigBytes).map((b) => b.toString(16).padStart(2, "0")).join("");

      setStep(3);
      setProcessingLabel("Broadcasting on-chain...");
      const result = await mintMutation.mutateAsync({
        data: {
          wallet: publicKey!,
          otsPreimage: preimage,
          amount: amtNum,
          token,
        },
      });

      await queryClient.invalidateQueries({ queryKey: getGetVaultQueryKey(publicKey!) });

      const basePath = (import.meta.env.BASE_URL as string).replace(/\/$/, "");
      const url = `${window.location.origin}${basePath}/claim/${nonceHex}`;
      setClaimUrl(url);
      setEscrowPda(result.escrowPda ?? "");
      setTxSig(result.txSig ?? "");
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voucher creation failed.");
      setStep(1);
    } finally {
      setProcessing(false);
      setProcessingLabel("");
    }
  };

  const reset = () => {
    setStep(1);
    setAmount("");
    setRecipient("");
    setVaultCode("");
    setError("");
    setClaimUrl("");
    setEscrowPda("");
    setTxSig("");
  };

  if (!publicKey) {
    return (
      <div className="p-6 text-center">
        <p className="text-[#888888] text-sm font-['JetBrains_Mono']">Connect wallet to use AirSign.</p>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-lg">
      <div className="mb-5">
        <h2 className="font-['Space_Grotesk'] font-bold text-lg mb-1">AirSign</h2>
        <p className="text-[#888888] text-xs font-['JetBrains_Mono'] leading-relaxed">
          Burns sSOL via vault code, locks SOL in escrow. Recipient claims to fixed address: no wallet needed.
        </p>
      </div>

      <div className="flex items-start mb-6">
        <StepDot n={1} label="Setup" active={step === 1} done={step > 1} />
        <StepLine done={step > 1} />
        <StepDot n={2} label="Sign" active={step === 2} done={step > 2} />
        <StepLine done={step > 2} />
        <StepDot n={3} label="Done" active={step === 3} done={!!claimUrl} />
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-1.5 uppercase tracking-wider">Token</label>
            <div className="flex gap-2 flex-wrap">
              {AIRSIGN_TOKENS.map((t) => (
                <button
                  key={t}
                  onClick={() => setToken(t)}
                  className={`px-3 py-1.5 border text-xs font-['JetBrains_Mono'] transition-colors ${
                    token === t
                      ? "border-[#FF6B00] text-[#FF6B00] bg-[#FF6B00]/5"
                      : "border-[#2A2A2A] text-[#888888] hover:border-[#3A3A3A]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-1.5 uppercase tracking-wider">Amount</label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-1.5 uppercase tracking-wider">Recipient Address</label>
            <input
              type="text"
              placeholder="Solana pubkey"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="input-field w-full font-['JetBrains_Mono'] text-xs"
            />
            <p className="text-[#555] text-[10px] font-['JetBrains_Mono'] mt-1">
              Fixed on-chain: recipient cannot be changed after signing.
            </p>
          </div>

          <div>
            <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-1.5 uppercase tracking-wider">Vault Code</label>
            <input
              type="password"
              placeholder="8 chars, burns sSOL on-chain"
              value={vaultCode}
              onChange={(e) => setVaultCode(e.target.value)}
              className="input-field w-full"
              maxLength={8}
              autoComplete="current-password"
            />
          </div>

          {!vaultExists && (
            <div className="bg-[#0A0A0A] border border-[#2A2A2A] p-3">
              <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
                No vault found. Shield SOL in Shielded Vault first.
              </p>
            </div>
          )}
          {vaultExists && chainDepth <= 0 && (
            <div className="bg-[#0A0A0A] border border-red-900/40 p-3">
              <p className="text-red-400 text-xs font-['JetBrains_Mono']">
                OTS chain exhausted. Create a new vault to continue.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-[#0A0A0A] border border-red-900/40 p-3">
              <p className="text-red-400 text-xs font-['JetBrains_Mono']">{error}</p>
            </div>
          )}

          {processing && (
            <div className="bg-[#0A0A0A] border border-[#2A2A2A] p-3 flex items-center gap-3">
              <svg className="animate-spin shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="#2A2A2A" strokeWidth="2"/>
                <path d="M8 2 A6 6 0 0 1 14 8" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p className="text-[#FF6B00] text-xs font-['JetBrains_Mono']">{processingLabel}</p>
            </div>
          )}

          <button
            className="btn-primary w-full justify-center"
            disabled={!canProceed || processing}
            onClick={handleCreate}
          >
            {!vaultExists
              ? "No vault: shield first"
              : chainDepth <= 0
                ? "OTS chain exhausted"
                : "Burn sSOL and Create Voucher"}
          </button>
        </div>
      )}

      {step === 2 && !claimUrl && (
        <div className="space-y-4">
          <div className="bg-[#0A0A0A] border border-[#2A2A2A] p-5 text-center">
            <svg className="animate-spin mx-auto mb-3" width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="10" stroke="#2A2A2A" strokeWidth="2.5"/>
              <path d="M14 4 A10 10 0 0 1 24 14" stroke="#FF6B00" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <p className="text-[#FF6B00] text-xs font-['JetBrains_Mono'] tracking-wider">{processingLabel || "Waiting for signature..."}</p>
            <p className="text-[#888888] text-[10px] font-['JetBrains_Mono'] mt-2">
              Approve the message signature in Phantom.
            </p>
          </div>
          {error && (
            <div className="bg-[#0A0A0A] border border-red-900/40 p-3">
              <p className="text-red-400 text-xs font-['JetBrains_Mono']">{error}</p>
            </div>
          )}
        </div>
      )}

      {step === 3 && claimUrl && (
        <div className="space-y-4">
          <div className="bg-[#0A0A0A] border border-[#FF6B00]/30 p-4">
            <p className="text-[#FF6B00] text-xs font-['JetBrains_Mono'] uppercase tracking-wider mb-3">Voucher Created</p>

            <div className="flex justify-center mb-4 p-3 bg-white">
              <QRCodeSVG value={claimUrl} size={140} bgColor="#ffffff" fgColor="#000000" />
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-[#555] text-[9px] font-['JetBrains_Mono'] uppercase tracking-wider mb-1">Claim URL</p>
                <p className="text-white text-[10px] font-['JetBrains_Mono'] break-all leading-relaxed">{claimUrl}</p>
              </div>
              {escrowPda && (
                <div>
                  <p className="text-[#555] text-[9px] font-['JetBrains_Mono'] uppercase tracking-wider mb-1">Escrow PDA</p>
                  <p className="text-[#888888] text-[10px] font-['JetBrains_Mono'] break-all">{escrowPda}</p>
                </div>
              )}
              {txSig && (
                <div>
                  <p className="text-[#555] text-[9px] font-['JetBrains_Mono'] uppercase tracking-wider mb-1">Transaction</p>
                  <a
                    href={`https://orbmarkets.io/tx/${txSig}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FF6B00] hover:text-white text-[10px] font-['JetBrains_Mono']"
                  >
                    {txSig.slice(0, 12)}...{txSig.slice(-8)}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#0A0A0A] border border-[#2A2A2A] p-3">
            <p className="text-[#888888] text-xs font-['JetBrains_Mono'] leading-relaxed">
              Send QR or URL to recipient. They claim without a wallet. SOL held in escrow until claimed.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              className="btn-secondary flex-1 justify-center text-xs"
              onClick={() => { void navigator.clipboard.writeText(claimUrl); }}
            >
              Copy URL
            </button>
            <button
              className="btn-secondary flex-1 justify-center text-xs"
              onClick={reset}
            >
              New Voucher
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
