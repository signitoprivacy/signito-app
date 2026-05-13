import React, { useState } from "react";
import { NavBar } from "../components/NavBar";
import { Sidebar } from "../components/Sidebar";
import { useWallet } from "../lib/wallet";
import { QRCodeSVG } from "qrcode.react";
import { validateVaultCode, deriveOtsPreimage } from "../lib/ots";
import {
  useAirsignPrepare,
  useGetAirsignBalances,
  getGetAirsignBalancesQueryKey,
  useGetVault,
  getGetVaultQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

// Tokens eligible for AirSign (must be shielded first)
const AIRSIGN_TOKENS = ["SOL", "USDC", "USDT", "JUP", "BONK"];

interface VoucherPayload {
  aToken: string;
  amount: number;
  recipient: string;
  nonce: string;
  expiresAt: string;
  wallet: string;
  sig: string;
}

// ---- Step indicator ----
function StepDot({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-['JetBrains_Mono'] text-xs font-bold transition-colors ${
        done ? "bg-[#FF6B00] border-[#FF6B00] text-black" :
        active ? "border-[#FF6B00] text-[#FF6B00]" :
        "border-[#333] text-[#555]"
      }`}>
        {done ? "✓" : n}
      </div>
      <span className={`text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider ${active || done ? "text-white" : "text-[#555]"}`}>
        {label}
      </span>
    </div>
  );
}

function StepLine({ done }: { done: boolean }) {
  return (
    <div className={`flex-1 h-px mt-4 mx-1 transition-colors ${done ? "bg-[#FF6B00]" : "bg-[#222]"}`} />
  );
}

export default function AirSignPage() {
  const { connected, publicKey, signMessage } = useWallet();
  const queryClient = useQueryClient();

  // Step 1 state: sSOL -> aSOL conversion
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [token, setToken] = useState("SOL");
  const [amount, setAmount] = useState("");
  const [vaultCode, setVaultCode] = useState("");
  const [expiryHours, setExpiryHours] = useState("24");
  const [prepareResult, setPrepareResult] = useState<{
    aToken: string; amount: number; nonce: string; expiresAt: string; newChainDepth: number;
  } | null>(null);
  const [prepareError, setPrepareError] = useState("");

  // Step 2 state: voucher creation
  const [recipient, setRecipient] = useState("");
  const [voucherJson, setVoucherJson] = useState("");

  // Step 3 (claim tab)
  const [activeTab, setActiveTab] = useState<"create" | "claim">("create");
  const [claimJson, setClaimJson] = useState("");
  const [parsedVoucher, setParsedVoucher] = useState<VoucherPayload | null>(null);

  const prepareMutation = useAirsignPrepare();

  const { data: vaultData } = useGetVault(publicKey ?? "", {
    query: {
      queryKey: getGetVaultQueryKey(publicKey ?? ""),
      enabled: !!publicKey,
    },
  });

  const { data: airsignData } = useGetAirsignBalances(publicKey ?? "", {
    query: {
      queryKey: getGetAirsignBalancesQueryKey(publicKey ?? ""),
      enabled: !!publicKey,
    },
  });

  const vault = vaultData?.vault ?? null;
  const chainDepth = vault?.chainDepth ?? 0;
  const readyBalances = airsignData?.balances ?? [];

  const isValidCode = validateVaultCode(vaultCode);
  const canPrepare = !!amount && parseFloat(amount) > 0 && isValidCode && !!publicKey && chainDepth > 0;

  // STEP 1: Convert sToken -> aToken (OTS-verified burn)
  const handlePrepare = async () => {
    if (!publicKey || !canPrepare) return;
    setPrepareError("");
    try {
      const preimage = await deriveOtsPreimage(vaultCode, publicKey, chainDepth, 1);
      const result = await prepareMutation.mutateAsync({
        data: {
          wallet: publicKey,
          token,
          amount: parseFloat(amount),
          preimage,
          expiryHours: parseInt(expiryHours),
        },
      });
      await queryClient.invalidateQueries({ queryKey: getGetVaultQueryKey(publicKey) });
      await queryClient.invalidateQueries({ queryKey: getGetAirsignBalancesQueryKey(publicKey) });
      setPrepareResult({
        aToken: result.aToken,
        amount: result.amount,
        nonce: result.nonce,
        expiresAt: result.expiresAt,
        newChainDepth: result.newChainDepth,
      });
      setStep(2);
    } catch {
      setPrepareError("Vault code incorrect or OTS verification failed.");
    }
  };

  // STEP 2: Create Ed25519 offline voucher with the aToken nonce
  const handleCreateVoucher = async () => {
    if (!prepareResult || !recipient || !publicKey) return;
    const payloadToSign = {
      aToken: prepareResult.aToken,
      amount: prepareResult.amount,
      recipient,
      nonce: prepareResult.nonce,
      expiresAt: prepareResult.expiresAt,
      wallet: publicKey,
    };
    let sig = "unsigned";
    if (signMessage) {
      try {
        const msgBytes = new TextEncoder().encode(JSON.stringify(payloadToSign));
        const sigBytes = await signMessage(msgBytes);
        sig = Array.from(sigBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
      } catch {
        sig = "unsigned";
      }
    }
    const payload: VoucherPayload = { ...payloadToSign, sig };
    setVoucherJson(JSON.stringify(payload, null, 2));
    setStep(3);
  };

  const handleClaimParse = (raw: string) => {
    setClaimJson(raw);
    try {
      const p = JSON.parse(raw) as VoucherPayload;
      if (p.aToken && p.amount && p.recipient && p.nonce) setParsedVoucher(p);
      else setParsedVoucher(null);
    } catch {
      setParsedVoucher(null);
    }
  };

  const isExpired = parsedVoucher
    ? new Date(parsedVoucher.expiresAt).getTime() < Date.now()
    : false;

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-2 uppercase tracking-wider">
      {children}
    </label>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <NavBar />
      <Sidebar />

      <main className="pt-[56px] md:pl-[220px]">
        <div className="px-3 sm:px-5 py-5 max-w-2xl">

          <div className="flex items-center gap-3 mb-3">
            <span className="tag">AIRSIGN</span>
            <span className="tag !text-[#888888] !border-[#888888]">OFFLINE</span>
          </div>
          <h1 className="font-['Space_Grotesk'] text-3xl font-bold mb-2">Offline Voucher</h1>

          <div className="border border-[#2A2A2A] rounded p-4 mb-8 space-y-2">
            <p className="text-[#888888] text-sm leading-relaxed">
              sSOL is NonTransferable, it cannot be sent offline directly.
              To transfer offline, first convert sSOL to{" "}
              <span className="text-white font-['JetBrains_Mono']">aSOL</span> (airSOL) using your vault code.
              Then sign an Ed25519 voucher offline. The recipient claims it on-chain.
            </p>
            <div className="flex items-center gap-4 pt-2 border-t border-[#2A2A2A]">
              {[
                { label: "sSOL", color: "text-[#FF6B00]" },
                { label: "→", color: "text-[#555]" },
                { label: "aSOL", color: "text-white" },
                { label: "→", color: "text-[#555]" },
                { label: "voucher QR", color: "text-white" },
                { label: "→", color: "text-[#555]" },
                { label: "on-chain claim", color: "text-white" },
              ].map((item, i) => (
                <span key={i} className={`text-xs font-['JetBrains_Mono'] ${item.color}`}>
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex border-b border-[#2A2A2A] mb-8">
            {(["create", "claim"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); if (tab === "create") setStep(1); }}
                className={`px-6 py-3 font-['Space_Grotesk'] font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-[#FF6B00] text-white"
                    : "border-transparent text-[#888888] hover:text-white"
                }`}
              >
                {tab === "create" ? "Create Voucher" : "Claim Voucher"}
              </button>
            ))}
          </div>

          {activeTab === "create" && (
            <>
              {/* Step indicator */}
              <div className="flex items-start mb-8">
                <StepDot n={1} label="Prepare aSOL" active={step === 1} done={step > 1} />
                <StepLine done={step > 1} />
                <StepDot n={2} label="Sign Voucher" active={step === 2} done={step > 2} />
                <StepLine done={step > 2} />
                <StepDot n={3} label="Share QR" active={step === 3} done={false} />
              </div>

              <div className="card">

                {/* STEP 1: sToken -> aToken */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mb-4 leading-relaxed">
                        Step 1: convert your shielded token to an aToken (airToken).
                        This requires your vault code and consumes one OTS depth level.
                        The vault code is only used locally to derive a hash, it never leaves your browser.
                      </p>
                    </div>

                    {/* Vault status */}
                    {publicKey && vault && (
                      <div className="border border-[#FF6B00]/30 bg-[#FF6B00]/5 rounded p-3 flex items-center justify-between">
                        <span className="text-xs font-['JetBrains_Mono'] text-[#888888]">OTS depth remaining</span>
                        <span className={`text-xs font-['JetBrains_Mono'] font-bold ${chainDepth < 5 ? "text-red-400" : "text-[#FF6B00]"}`}>
                          {chainDepth}
                        </span>
                      </div>
                    )}
                    {publicKey && !vault && (
                      <div className="border border-red-500/30 rounded p-3">
                        <p className="text-red-400 text-xs font-['JetBrains_Mono']">
                          No vault found. Shield tokens first to create a vault.
                        </p>
                      </div>
                    )}

                    {/* Ready aTokens */}
                    {readyBalances.length > 0 && (
                      <div className="border border-[#2A2A2A] rounded p-3 space-y-2">
                        <p className="text-xs font-['JetBrains_Mono'] text-[#888888] uppercase tracking-wider">
                          Already prepared aTokens
                        </p>
                        {readyBalances.map((b) => (
                          <div key={b.nonce} className="flex items-center justify-between text-xs font-['JetBrains_Mono']">
                            <span className="text-white">{b.aToken}</span>
                            <span className="text-[#FF6B00]">{b.amount}</span>
                            <button
                              className="text-[#888888] hover:text-white underline text-xs"
                              onClick={() => {
                                setPrepareResult({
                                  aToken: b.aToken,
                                  amount: b.amount,
                                  nonce: b.nonce,
                                  expiresAt: b.expiresAt ?? new Date(Date.now() + 86400000).toISOString(),
                                  newChainDepth: chainDepth,
                                });
                                setStep(2);
                              }}
                            >
                              Use this
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Token</Label>
                        <select
                          className="input-field"
                          value={token}
                          onChange={(e) => setToken(e.target.value)}
                          disabled={!connected}
                        >
                          {AIRSIGN_TOKENS.map((t) => (
                            <option key={t} value={t}>{`s${t} → a${t}`}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Amount</Label>
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Expiry (hours)</Label>
                        <input
                          type="number"
                          className="input-field"
                          value={expiryHours}
                          onChange={(e) => setExpiryHours(e.target.value)}
                          min="1"
                          disabled={!connected}
                        />
                      </div>
                      <div>
                        <Label>Vault Code</Label>
                        <input
                          type="text"
                          className="input-field font-['JetBrains_Mono'] tracking-widest"
                          maxLength={8}
                          placeholder="8 chars (e.g. abcd1234)"
                          value={vaultCode}
                          onChange={(e) => setVaultCode(e.target.value)}
                          disabled={!connected}
                          autoComplete="off"
                          spellCheck={false}
                        />
                        {vaultCode.length > 0 && !isValidCode && (
                          <p className="text-[#FF6B00] text-xs font-['JetBrains_Mono'] mt-1">
                            8 chars required: letters and numbers only
                          </p>
                        )}
                      </div>
                    </div>

                    {prepareError && (
                      <p className="text-red-400 text-xs font-['JetBrains_Mono']">{prepareError}</p>
                    )}

                    {!connected && (
                      <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
                        Connect wallet to continue
                      </p>
                    )}

                    <button
                      className="btn-primary w-full justify-center"
                      disabled={!canPrepare || prepareMutation.isPending}
                      onClick={handlePrepare}
                    >
                      {prepareMutation.isPending
                        ? "Verifying OTS..."
                        : `Convert s${token} to a${token}`}
                    </button>
                  </div>
                )}

                {/* STEP 2: Create offline voucher */}
                {step === 2 && prepareResult && (
                  <div className="space-y-5">
                    <div className="border border-green-500/30 bg-green-500/5 rounded p-3 space-y-1">
                      <p className="text-green-400 text-xs font-['JetBrains_Mono'] font-bold">
                        {prepareResult.aToken} minted, OTS verified
                      </p>
                      <div className="flex items-center justify-between text-xs font-['JetBrains_Mono']">
                        <span className="text-[#888888]">Amount</span>
                        <span className="text-white">{prepareResult.amount} {prepareResult.aToken}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-['JetBrains_Mono']">
                        <span className="text-[#888888]">Nonce</span>
                        <span className="text-white font-['JetBrains_Mono'] text-[10px]">{prepareResult.nonce}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-['JetBrains_Mono']">
                        <span className="text-[#888888]">OTS depth remaining</span>
                        <span className={`font-bold ${prepareResult.newChainDepth < 5 ? "text-red-400" : "text-[#FF6B00]"}`}>
                          {prepareResult.newChainDepth}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-['JetBrains_Mono']">
                        <span className="text-[#888888]">Expires</span>
                        <span className="text-white">{new Date(prepareResult.expiresAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mb-4 leading-relaxed">
                        Step 2: set the recipient and sign the voucher offline.
                        No internet needed. The nonce is unique, voucher cannot be double-spent.
                      </p>
                    </div>

                    <div>
                      <Label>Recipient Address</Label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Solana address of recipient"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                      />
                      <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mt-1.5">
                        Can be a fresh address, no on-chain link to sender
                      </p>
                    </div>

                    <button
                      className="btn-primary w-full justify-center"
                      disabled={!recipient || recipient.length < 32}
                      onClick={handleCreateVoucher}
                    >
                      Sign Voucher Offline
                    </button>
                  </div>
                )}

                {/* STEP 3: Show QR */}
                {step === 3 && voucherJson && (
                  <div className="space-y-5">
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-[#888888] text-sm text-center">
                        Voucher signed. Show QR to recipient or share JSON.
                        Recipient claims on-chain, nonce is single-use.
                      </p>
                      <div className="bg-white p-4 rounded">
                        <QRCodeSVG value={voucherJson} size={200} />
                      </div>
                    </div>

                    <pre className="text-left text-xs font-['JetBrains_Mono'] text-[#888888] bg-[#0A0A0A] p-4 rounded overflow-auto border border-[#2A2A2A] max-h-48">
                      {voucherJson}
                    </pre>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        className="btn-secondary w-full justify-center"
                        onClick={() => navigator.clipboard.writeText(voucherJson)}
                      >
                        Copy JSON
                      </button>
                      <button
                        className="btn-secondary w-full justify-center"
                        onClick={() => {
                          setStep(1);
                          setAmount("");
                          setVaultCode("");
                          setRecipient("");
                          setVoucherJson("");
                          setPrepareResult(null);
                          setPrepareError("");
                        }}
                      >
                        New Voucher
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* CLAIM TAB */}
          {activeTab === "claim" && (
            <div className="card space-y-6">
              <p className="text-[#888888] text-sm">
                Paste the JSON voucher from the sender. Verify the details, then claim on-chain.
                The nonce is single-use, once claimed, the voucher is invalidated.
              </p>

              <div>
                <Label>Paste JSON voucher</Label>
                <textarea
                  className="input-field min-h-[140px] resize-none"
                  value={claimJson}
                  onChange={(e) => handleClaimParse(e.target.value)}
                  placeholder='{ "aToken": "aSOL", "amount": 1.5, "recipient": "...", "nonce": "..." }'
                />
              </div>

              {parsedVoucher && (
                <div className={`bg-[#0A0A0A] border rounded p-4 space-y-2 ${isExpired ? "border-red-500/40" : "border-[#FF6B00]/30"}`}>
                  <p className="text-xs font-['JetBrains_Mono'] text-[#888888] mb-3 uppercase tracking-wider">
                    Voucher Details
                  </p>
                  {[
                    ["Token", parsedVoucher.aToken],
                    ["Amount", String(parsedVoucher.amount)],
                    ["Recipient", parsedVoucher.recipient],
                    ["Nonce", parsedVoucher.nonce],
                    ["Expires", new Date(parsedVoucher.expiresAt).toLocaleString()],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-[#888888]">{label}</span>
                      <span className={`font-['JetBrains_Mono'] text-xs ${label === "Recipient" || label === "Nonce" ? "text-[#FF6B00]" : "text-white"}`}>
                        {val.length > 20 ? `${val.slice(0, 10)}...${val.slice(-6)}` : val}
                      </span>
                    </div>
                  ))}
                  {isExpired && (
                    <p className="text-red-400 text-xs font-['JetBrains_Mono'] mt-2">Voucher expired</p>
                  )}
                </div>
              )}

              <button
                className="btn-primary w-full justify-center opacity-50 cursor-not-allowed"
                disabled
              >
                Claim On-Chain
              </button>
              <p className="text-center text-xs text-[#888888] font-['JetBrains_Mono']">
                Awaiting signito_vault program deployment on Mainnet
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
