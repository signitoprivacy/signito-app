import React, { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useWallet } from "../lib/wallet";
import {
  useGetAirsignVoucher,
  getGetAirsignVoucherQueryKey,
  useAirsignClaimVoucher,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { NavBar } from "../components/NavBar";

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string }> = {
    unclaimed: { label: "UNCLAIMED", color: "text-[#FF6B00] border-[#FF6B00]" },
    pending:   { label: "PENDING RELEASE", color: "text-yellow-400 border-yellow-400" },
    claimed:   { label: "CLAIMED", color: "text-green-400 border-green-400" },
    expired:   { label: "EXPIRED", color: "text-[#888888] border-[#888888]" },
  };
  const c = cfg[status] ?? cfg.expired;
  return (
    <span className={`inline-block font-['JetBrains_Mono'] text-xs border px-2 py-0.5 rounded ${c.color}`}>
      {c.label}
    </span>
  );
}

export default function ClaimPage() {
  const [, params] = useRoute("/claim/:nonce");
  const [, navigate] = useLocation();
  const nonce = params?.nonce ?? "";

  const { publicKey, connected } = useWallet();
  const queryClient = useQueryClient();

  const [claimed, setClaimed] = useState(false);
  const [claimError, setClaimError] = useState("");

  const { data: voucher, isLoading, refetch } = useGetAirsignVoucher(nonce, {
    query: {
      queryKey: getGetAirsignVoucherQueryKey(nonce),
      enabled: !!nonce,
    },
  });

  const claimMutation = useAirsignClaimVoucher();

  useEffect(() => {
    if (!nonce) navigate("/app");
  }, [nonce, navigate]);

  useEffect(() => {
    if (voucher?.claimStatus !== "pending" && !claimed) return;
    const id = setInterval(() => { refetch(); }, 8_000);
    return () => clearInterval(id);
  }, [voucher?.claimStatus, claimed, refetch]);

  const handleClaim = async () => {
    if (!publicKey) return;
    setClaimError("");
    try {
      await claimMutation.mutateAsync({
        nonce,
        data: { claimerWallet: publicKey },
      });
      await queryClient.invalidateQueries({ queryKey: getGetAirsignVoucherQueryKey(nonce) });
      setClaimed(true);
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("match")) setClaimError("Your wallet does not match the intended recipient.");
      else if (msg.includes("expired")) setClaimError("This voucher has expired.");
      else if (msg.includes("claimed")) setClaimError("This voucher was already claimed.");
      else setClaimError("Failed to submit claim. Please try again.");
    }
  };

  const canClaim =
    !!publicKey &&
    voucher?.claimStatus === "unclaimed" &&
    !claimMutation.isPending;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <NavBar />

      <main className="max-w-lg mx-auto px-4 py-12">
        <div className="mb-6">
          <span className="tag mb-3 inline-block">AIRSIGN</span>
          <h1 className="font-['Space_Grotesk'] text-3xl font-bold mb-1">Claim Voucher</h1>
          <p className="text-[#888888] text-sm font-['JetBrains_Mono']">
            Nonce: <span className="text-white">{nonce.slice(0, 8)}...{nonce.slice(-6)}</span>
          </p>
        </div>

        {isLoading && (
          <div className="card">
            <p className="text-[#888888] font-['JetBrains_Mono'] text-sm">Loading voucher...</p>
          </div>
        )}

        {!isLoading && !voucher && (
          <div className="card border border-red-500/30">
            <p className="text-red-400 font-['JetBrains_Mono'] text-sm">Voucher not found.</p>
            <p className="text-[#888888] font-['JetBrains_Mono'] text-xs mt-1">
              Check the link is correct or ask the sender for a new voucher.
            </p>
          </div>
        )}

        {voucher && (
          <div className="space-y-4">
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[#888888] text-xs font-['JetBrains_Mono'] uppercase tracking-wider">
                  Voucher Details
                </p>
                <StatusBadge status={voucher.claimStatus} />
              </div>

              {[
                ["Token", voucher.token],
                ["Amount", `${voucher.amount} ${voucher.token}`],
                ["Intended Recipient", `${voucher.recipient.slice(0, 10)}...${voucher.recipient.slice(-8)}`],
                ["Issuer", voucher.issuerWallet],
                ["Expires", new Date(voucher.expiresAt).toLocaleString()],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-[#888888] font-['JetBrains_Mono'] text-xs">{label}</span>
                  <span className="text-white font-['JetBrains_Mono'] text-xs">{val}</span>
                </div>
              ))}

              <div className="border-t border-[#2A2A2A] pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#888888] text-xs font-['JetBrains_Mono']">You receive</span>
                  <span className="text-[#FF6B00] font-['Space_Grotesk'] font-bold text-xl">
                    {voucher.amount} {voucher.token}
                  </span>
                </div>
              </div>
            </div>

            {voucher.claimStatus === "unclaimed" && (
              <div className="card space-y-4">
                <p className="text-[#888888] text-xs font-['JetBrains_Mono'] leading-relaxed">
                  Connect the wallet that matches the recipient address above.
                  After claiming, the issuer will sign an unshield transaction and you will receive plain {voucher.token} directly.
                </p>

                {!connected && (
                  <div className="border border-[#2A2A2A] rounded p-3">
                    <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
                      Connect your Phantom wallet to claim this voucher.
                    </p>
                  </div>
                )}

                {connected && publicKey && publicKey !== voucher.recipient && (
                  <div className="border border-yellow-500/30 bg-yellow-500/5 rounded p-3">
                    <p className="text-yellow-400 text-xs font-['JetBrains_Mono'] font-bold mb-1">
                      Wallet mismatch
                    </p>
                    <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
                      Connected: {publicKey.slice(0, 10)}...{publicKey.slice(-6)}
                    </p>
                    <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
                      Expected: {voucher.recipient.slice(0, 10)}...{voucher.recipient.slice(-6)}
                    </p>
                    <p className="text-yellow-300 text-xs font-['JetBrains_Mono'] mt-1">
                      Switch to the recipient wallet to claim.
                    </p>
                  </div>
                )}

                {claimError && (
                  <p className="text-red-400 text-xs font-['JetBrains_Mono']">{claimError}</p>
                )}

                <button
                  className="btn-primary w-full justify-center"
                  disabled={!canClaim || (connected && publicKey !== voucher.recipient)}
                  onClick={handleClaim}
                >
                  {claimMutation.isPending ? "Submitting claim..." : `Claim ${voucher.amount} ${voucher.token}`}
                </button>
              </div>
            )}

            {(voucher.claimStatus === "pending" || claimed) && (
              <div className="card border border-yellow-500/30 bg-yellow-500/5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  <p className="text-yellow-400 text-sm font-['JetBrains_Mono'] font-bold">
                    Claim request submitted
                  </p>
                </div>
                <p className="text-[#888888] text-xs font-['JetBrains_Mono'] leading-relaxed">
                  The voucher issuer has been notified. They will sign an unshield transaction to send your {voucher.token}.
                  Once signed and confirmed, the status below will update automatically.
                </p>
                <p className="text-[#555] text-xs font-['JetBrains_Mono']">
                  Checking for updates every 8 seconds...
                </p>
              </div>
            )}

            {voucher.claimStatus === "claimed" && (
              <div className="card border border-green-500/30 bg-green-500/5 space-y-3">
                <p className="text-green-400 text-sm font-['JetBrains_Mono'] font-bold">
                  Funds released
                </p>
                <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
                  {voucher.amount} {voucher.token} has been sent to your wallet.
                </p>
                {voucher.txSig && (
                  <a
                    href={`https://solscan.io/tx/${voucher.txSig}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-[#FF6B00] text-xs font-['JetBrains_Mono'] hover:text-white"
                  >
                    View transaction: {voucher.txSig.slice(0, 12)}...{voucher.txSig.slice(-8)}
                  </a>
                )}
              </div>
            )}

            {voucher.claimStatus === "expired" && (
              <div className="card border border-red-500/30">
                <p className="text-red-400 text-sm font-['JetBrains_Mono'] font-bold">Voucher expired</p>
                <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mt-1">
                  Ask the sender to create a new voucher.
                </p>
              </div>
            )}

            <div className="border border-[#2A2A2A] rounded p-3">
              <p className="text-[#555] text-xs font-['JetBrains_Mono'] leading-relaxed">
                AirSign uses Ed25519 offline signing. The issuer signs a binary voucher and the server verifies it.
                No custody: the issuer signs the final unshield transaction directly from their wallet.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
