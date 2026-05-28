import React, { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
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
    pending:   { label: "PENDING", color: "text-yellow-400 border-yellow-400" },
    claimed:   { label: "CLAIMED", color: "text-green-400 border-green-400" },
    expired:   { label: "EXPIRED", color: "text-[#888888] border-[#888888]" },
  };
  const c = cfg[status] ?? cfg.expired;
  return (
    <span className={`inline-block font-['JetBrains_Mono'] text-xs border px-2 py-0.5 ${c.color}`}>
      {c.label}
    </span>
  );
}

export default function ClaimPage() {
  const [, params] = useRoute("/claim/:nonce");
  const [, navigate] = useLocation();
  const nonce = params?.nonce ?? "";

  const queryClient = useQueryClient();

  const [claimed, setClaimed] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [processing, setProcessing] = useState(false);

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
    setClaimError("");
    setProcessing(true);
    try {
      await claimMutation.mutateAsync({ nonce });
      await queryClient.invalidateQueries({ queryKey: getGetAirsignVoucherQueryKey(nonce) });
      setClaimed(true);
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("expired")) setClaimError("This voucher has expired.");
      else if (msg.includes("claimed")) setClaimError("This voucher was already claimed.");
      else setClaimError(msg || "Failed to submit claim. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const canClaim = voucher?.claimStatus === "unclaimed" && !claimMutation.isPending && !processing;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <NavBar />

      <main className="max-w-lg mx-auto px-4 py-12">
        <div className="mb-6">
          <span className="tag mb-3 inline-block">AIRSIGN</span>
          <h1 className="font-['Space_Grotesk'] text-3xl font-bold mb-1">Claim Voucher</h1>
          <p className="text-[#888888] text-sm font-['JetBrains_Mono']">
            Nonce: <span className="text-white font-bold">{nonce.slice(0, 8)}...{nonce.slice(-6)}</span>
          </p>
        </div>

        {isLoading && (
          <div className="card">
            <div className="flex items-center gap-3">
              <svg className="animate-spin shrink-0" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="7" stroke="#2A2A2A" strokeWidth="2"/>
                <path d="M9 2 A7 7 0 0 1 16 9" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p className="text-[#888888] font-['JetBrains_Mono'] text-sm">Loading voucher...</p>
            </div>
          </div>
        )}

        {!isLoading && !voucher && (
          <div className="card border border-red-500/30">
            <p className="text-red-400 font-['JetBrains_Mono'] text-sm mb-1">Voucher not found.</p>
            <p className="text-[#888888] font-['JetBrains_Mono'] text-xs">
              Check the link is correct or ask the sender for a new voucher.
            </p>
          </div>
        )}

        {voucher && (
          <div className="space-y-4">
            {/* Voucher details */}
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
                ["Recipient", `${(voucher.recipient ?? "").slice(0, 10)}...${(voucher.recipient ?? "").slice(-8)}`],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[#888888] font-['JetBrains_Mono'] text-xs">{label}</span>
                  <span className="text-white font-['JetBrains_Mono'] text-xs">{val}</span>
                </div>
              ))}

              <div className="border-t border-[#2A2A2A] pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#888888] text-xs font-['JetBrains_Mono']">You receive</span>
                  <span className="text-[#FF6B00] font-['Space_Grotesk'] font-bold text-2xl">
                    {voucher.amount} {voucher.token}
                  </span>
                </div>
              </div>
            </div>

            {/* Claim action */}
            {voucher.claimStatus === "unclaimed" && (
              <div className="card space-y-4">
                <div className="bg-[#0A0A0A] border border-[#2A2A2A] p-3">
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] leading-relaxed">
                    No wallet required. The relayer will release {voucher.amount} {voucher.token} directly to the recipient address recorded in the voucher. This cannot be redirected.
                  </p>
                </div>

                {claimError && (
                  <div className="bg-[#0A0A0A] border border-red-900/40 p-3">
                    <p className="text-red-400 text-xs font-['JetBrains_Mono']">{claimError}</p>
                  </div>
                )}

                {processing && (
                  <div className="bg-[#0A0A0A] border border-[#2A2A2A] p-3 flex items-center gap-3">
                    <svg className="animate-spin shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="#2A2A2A" strokeWidth="2"/>
                      <path d="M8 2 A6 6 0 0 1 14 8" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <p className="text-[#FF6B00] text-xs font-['JetBrains_Mono']">Submitting claim to relayer...</p>
                  </div>
                )}

                <button
                  className="btn-primary w-full justify-center"
                  onClick={handleClaim}
                  disabled={!canClaim}
                >
                  Claim {voucher.amount} {voucher.token}
                </button>
              </div>
            )}

            {/* Pending state */}
            {(voucher.claimStatus === "pending" || claimed) && (
              <div className="card space-y-3">
                <div className="flex items-center gap-3">
                  <svg className="animate-spin shrink-0 text-[#FF6B00]" width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="7" stroke="#2A2A2A" strokeWidth="2"/>
                    <path d="M9 2 A7 7 0 0 1 16 9" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <p className="text-[#FF6B00] text-sm font-['JetBrains_Mono']">Relayer is processing your claim...</p>
                </div>
                <p className="text-[#888888] text-xs font-['JetBrains_Mono'] leading-relaxed">
                  The relayer has received the claim and is submitting the on-chain transaction. This page will update automatically.
                </p>
              </div>
            )}

            {/* Claimed state */}
            {voucher.claimStatus === "claimed" && (
              <div className="card border border-green-500/30 space-y-2">
                <p className="text-green-400 font-['JetBrains_Mono'] text-sm font-bold">Claim complete.</p>
                <p className="text-[#888888] font-['JetBrains_Mono'] text-xs leading-relaxed">
                  {voucher.amount} {voucher.token} has been released to the recipient address. The escrow PDA is now empty.
                </p>
              </div>
            )}

            {/* Expired state */}
            {voucher.claimStatus === "expired" && (
              <div className="card border border-[#333] space-y-2">
                <p className="text-[#888888] font-['JetBrains_Mono'] text-sm">This voucher has expired.</p>
                <p className="text-[#555] font-['JetBrains_Mono'] text-xs">
                  Contact the sender to create a new voucher.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
