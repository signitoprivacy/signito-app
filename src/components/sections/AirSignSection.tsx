import React, { useState } from "react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useWallet } from "../../lib/wallet";
import { QRCodeSVG } from "qrcode.react";
import { validateVaultCode, deriveOtsPreimage } from "../../lib/ots";
import { buildUnshieldIx, buildVersionedTx } from "@workspace/program";
import {
  useAirsignPrepare,
  useAirsignCreateVoucher,
  useGetAirsignBalances,
  getGetAirsignBalancesQueryKey,
  useGetVault,
  getGetVaultQueryKey,
  useGetAirsignPendingClaims,
  getGetAirsignPendingClaimsQueryKey,
  useAirsignReleaseVoucher,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const AIRSIGN_TOKENS = ["SOL", "USDC", "USDT", "JUP", "BONK"];

function buildVoucherMsg(
  amountLamports: bigint,
  recipientBytes: Uint8Array,
  nonceHex: string,
  expiresAtSec: bigint,
): Uint8Array {
  const buf = new ArrayBuffer(64);
  const view = new DataView(buf);
  const arr = new Uint8Array(buf);
  view.setBigUint64(0, amountLamports, true);
  arr.set(recipientBytes, 8);
  arr.set(Buffer.from(nonceHex, "hex"), 40);
  view.setBigInt64(56, expiresAtSec, true);
  return arr;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type StepKey = 1 | 2 | 3;

function StepDot({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-['JetBrains_Mono'] text-xs font-bold transition-colors ${
        done ? "bg-[#FF6B00] border-[#FF6B00] text-black" :
        active ? "border-[#FF6B00] text-[#FF6B00]" :
        "border-[#333] text-[#555]"
      }`}>
        {done ? "+" : n}
      </div>
      <span className={`text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider ${active || done ? "text-white" : "text-[#555]"}`}>
        {label}
      </span>
    </div>
  );
}

function StepLine({ done }: { done: boolean }) {
  return <div className={`flex-1 h-px mt-4 mx-1 transition-colors ${done ? "bg-[#FF6B00]" : "bg-[#222]"}`} />;
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-2 uppercase tracking-wider">
    {children}
  </label>
);

export function AirSignSection() {
  const { connected, publicKey, signMessage, signTransaction, connection } = useWallet();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"create" | "release">("create");

  const [step, setStep] = useState<StepKey>(1);
  const [token, setToken] = useState("SOL");
  const [amount, setAmount] = useState("");
  const [vaultCode, setVaultCode] = useState("");
  const [expiryHours, setExpiryHours] = useState("24");
  const [recipient, setRecipient] = useState("");

  const [prepareResult, setPrepareResult] = useState<{
    aToken: string;
    amount: number;
    nonce: string;
    expiresAt: string;
    newChainDepth: number;
    depthAtIssue: number;
  } | null>(null);

  const [claimUrl, setClaimUrl] = useState("");
  const [prepareError, setPrepareError] = useState("");
  const [signError, setSignError] = useState("");

  const [releaseVaultCode, setReleaseVaultCode] = useState("");
  const [releaseError, setReleaseError] = useState("");
  const [releasingNonce, setReleasingNonce] = useState<string | null>(null);
  const [releaseSuccess, setReleaseSuccess] = useState<Record<string, string>>({});

  const prepareMutation = useAirsignPrepare();
  const createVoucherMutation = useAirsignCreateVoucher();
  const releaseMutation = useAirsignReleaseVoucher();

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

  const { data: pendingClaimsData, refetch: refetchPending } = useGetAirsignPendingClaims(publicKey ?? "", {
    query: {
      queryKey: getGetAirsignPendingClaimsQueryKey(publicKey ?? ""),
      enabled: !!publicKey && activeTab === "release",
      refetchInterval: 10_000,
    },
  });

  const vault = vaultData?.vault ?? null;
  const chainDepth = vault?.chainDepth ?? 0;
  const readyBalances = airsignData?.balances ?? [];
  const pendingClaims = pendingClaimsData?.claims ?? [];

  const isValidCode = validateVaultCode(vaultCode);
  const canPrepare = !!amount && parseFloat(amount) > 0 && isValidCode && !!publicKey && chainDepth > 0;

  const isValidReleaseCode = validateVaultCode(releaseVaultCode);

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
        depthAtIssue: (result as { depthAtIssue?: number }).depthAtIssue ?? chainDepth,
      });
      setStep(2);
    } catch {
      setPrepareError("Vault code incorrect or OTS verification failed.");
    }
  };

  const handleSignVoucher = async () => {
    if (!prepareResult || !recipient || !publicKey || !signMessage) return;
    setSignError("");
    try {
      const expiresAtDate = new Date(prepareResult.expiresAt);
      const expiresAtSec = BigInt(Math.floor(expiresAtDate.getTime() / 1000));
      const amountLamports = BigInt(Math.round(prepareResult.amount * LAMPORTS_PER_SOL));
      const recipientBytes = new PublicKey(recipient).toBytes();
      const voucherMsg = buildVoucherMsg(amountLamports, recipientBytes, prepareResult.nonce, expiresAtSec);
      const sigBytes = await signMessage(voucherMsg);
      const voucherMsgHex = toHex(voucherMsg);
      const sigHex = toHex(sigBytes);

      await createVoucherMutation.mutateAsync({
        data: {
          wallet: publicKey,
          nonce: prepareResult.nonce,
          recipient,
          voucherMsgHex,
          sigHex,
          token,
          amount: prepareResult.amount,
          depthAtIssue: prepareResult.depthAtIssue,
          expiresAt: prepareResult.expiresAt,
        },
      });

      const basePath = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
      setClaimUrl(`${window.location.origin}${basePath}/claim/${prepareResult.nonce}`);
      setStep(3);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSignError(msg.includes("length") ? "Recipient address is invalid." : "Signing failed. Try again.");
    }
  };

  const handleRelease = async (nonce: string, claimerWallet: string, claimAmount: number, claimToken: string) => {
    if (!publicKey || !vault || !isValidReleaseCode || !signTransaction || !connection) return;
    setReleasingNonce(nonce);
    setReleaseError("");
    try {
      const ownerPk = new PublicKey(publicKey);
      const destPk = new PublicKey(claimerWallet);

      if (!vault.mint || !vault.stokenAccount) {
        setReleaseError("Vault mint info not found. Ensure vault is initialized on-chain.");
        setReleasingNonce(null);
        return;
      }

      const mintStokenPk = new PublicKey(vault.mint);
      const stokenAtaPk = new PublicKey(vault.stokenAccount);

      const preimage = await deriveOtsPreimage(releaseVaultCode, publicKey, chainDepth, 1);
      const amountLamports = BigInt(Math.round(claimAmount * LAMPORTS_PER_SOL));

      const ix = buildUnshieldIx(ownerPk, mintStokenPk, stokenAtaPk, destPk, {
        otsPreimage: Buffer.from(preimage, "hex"),
        amount: amountLamports,
      });

      const tx = await buildVersionedTx(connection, ownerPk, [ix]);
      const signedTx = await signTransaction(tx);
      const rawTx = signedTx.serialize();
      const txSig = await connection.sendRawTransaction(rawTx, { skipPreflight: false, preflightCommitment: "confirmed" });

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction({ signature: txSig, blockhash, lastValidBlockHeight }, "confirmed");

      await releaseMutation.mutateAsync({
        nonce,
        data: {
          issuerWallet: publicKey,
          txSig,
        },
      });

      await queryClient.invalidateQueries({ queryKey: getGetVaultQueryKey(publicKey) });
      await queryClient.invalidateQueries({ queryKey: getGetAirsignPendingClaimsQueryKey(publicKey) });
      setReleaseSuccess((prev) => ({ ...prev, [nonce]: txSig }));
      refetchPending();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Release failed";
      setReleaseError(msg.slice(0, 120));
    } finally {
      setReleasingNonce(null);
    }
  };

  const resetCreate = () => {
    setStep(1);
    setAmount("");
    setVaultCode("");
    setRecipient("");
    setClaimUrl("");
    setPrepareResult(null);
    setPrepareError("");
    setSignError("");
  };

  return (
    <div className="px-3 sm:px-5 py-5 max-w-2xl">
      <div className="flex items-center gap-3 mb-3">
        <span className="tag">AIRSIGN</span>
        <span className="tag !text-[#888888] !border-[#888888]">OFFLINE</span>
      </div>
      <h1 className="font-['Space_Grotesk'] text-3xl font-bold mb-2">Offline Voucher</h1>

      <div className="border border-[#2A2A2A] rounded p-4 mb-8 space-y-2">
        <p className="text-[#888888] text-sm leading-relaxed">
          sSOL is NonTransferable. Convert to aSOL, sign an offline Ed25519 voucher, share the claim link.
          Recipient visits the link, and you sign one final unshield transaction. Recipient gets plain SOL.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#2A2A2A]">
          {[
            { label: "sSOL", color: "text-[#FF6B00]" },
            { label: ">", color: "text-[#555]" },
            { label: "prepare aSOL", color: "text-white" },
            { label: ">", color: "text-[#555]" },
            { label: "sign voucher", color: "text-white" },
            { label: ">", color: "text-[#555]" },
            { label: "share link", color: "text-white" },
            { label: ">", color: "text-[#555]" },
            { label: "recipient claims", color: "text-white" },
            { label: ">", color: "text-[#555]" },
            { label: "you release (SOL)", color: "text-[#FF6B00]" },
          ].map((item, i) => (
            <span key={i} className={`text-xs font-['JetBrains_Mono'] ${item.color}`}>
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex border-b border-[#2A2A2A] mb-8">
        {([
          { key: "create", label: "Create Voucher" },
          { key: "release", label: `Release Funds${pendingClaims.length > 0 ? ` (${pendingClaims.length})` : ""}` },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-6 py-3 font-['Space_Grotesk'] font-medium text-sm border-b-2 transition-colors ${
              activeTab === key
                ? "border-[#FF6B00] text-white"
                : "border-transparent text-[#888888] hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "create" && (
        <>
          <div className="flex items-start mb-8">
            <StepDot n={1} label="Prepare" active={step === 1} done={step > 1} />
            <StepLine done={step > 1} />
            <StepDot n={2} label="Sign" active={step === 2} done={step > 2} />
            <StepLine done={step > 2} />
            <StepDot n={3} label="Share" active={step === 3} done={false} />
          </div>

          <div className="card">
            {step === 1 && (
              <div className="space-y-5">
                <p className="text-[#888888] text-xs font-['JetBrains_Mono'] leading-relaxed">
                  Convert your shielded token to aSOL. Requires vault code and consumes one OTS depth level.
                  Your vault code is never sent to the server.
                </p>

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

                {readyBalances.length > 0 && (
                  <div className="border border-[#2A2A2A] rounded p-3 space-y-2">
                    <p className="text-xs font-['JetBrains_Mono'] text-[#888888] uppercase tracking-wider mb-2">
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
                              depthAtIssue: chainDepth,
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
                        <option key={t} value={t}>{`s${t} > a${t}`}</option>
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
                      placeholder="8 chars"
                      value={vaultCode}
                      onChange={(e) => setVaultCode(e.target.value)}
                      disabled={!connected}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    {vaultCode.length > 0 && !isValidCode && (
                      <p className="text-[#FF6B00] text-xs font-['JetBrains_Mono'] mt-1">
                        8 chars required
                      </p>
                    )}
                  </div>
                </div>

                {prepareError && (
                  <p className="text-red-400 text-xs font-['JetBrains_Mono']">{prepareError}</p>
                )}

                {!connected && (
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono']">Connect wallet to continue</p>
                )}

                <button
                  className="btn-primary w-full justify-center"
                  disabled={!canPrepare || prepareMutation.isPending}
                  onClick={handlePrepare}
                >
                  {prepareMutation.isPending ? "Verifying OTS..." : `Convert s${token} to a${token}`}
                </button>
              </div>
            )}

            {step === 2 && prepareResult && (
              <div className="space-y-5">
                <div className="border border-green-500/30 bg-green-500/5 rounded p-3 space-y-1">
                  <p className="text-green-400 text-xs font-['JetBrains_Mono'] font-bold">
                    {prepareResult.aToken} prepared, OTS verified
                  </p>
                  {[
                    ["Amount", `${prepareResult.amount} ${prepareResult.aToken}`],
                    ["Nonce", prepareResult.nonce.slice(0, 12) + "..."],
                    ["OTS depth remaining", String(prepareResult.newChainDepth)],
                    ["Expires", new Date(prepareResult.expiresAt).toLocaleString()],
                  ].map(([label, val]) => (
                    <div key={label} className="flex items-center justify-between text-xs font-['JetBrains_Mono']">
                      <span className="text-[#888888]">{label}</span>
                      <span className={`${label === "OTS depth remaining" && parseInt(val) < 5 ? "text-red-400 font-bold" : "text-white"}`}>{val}</span>
                    </div>
                  ))}
                </div>

                <p className="text-[#888888] text-xs font-['JetBrains_Mono'] leading-relaxed">
                  Step 2: set the recipient and sign the 64-byte binary voucher offline.
                  Phantom will prompt for a message signature (no transaction, no fee).
                </p>

                <div>
                  <Label>Recipient Wallet Address</Label>
                  <input
                    type="text"
                    className="input-field font-['JetBrains_Mono']"
                    placeholder="Recipient Solana address (base58)"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mt-1.5">
                    Can be a fresh address, no on-chain link to sender
                  </p>
                </div>

                {signError && (
                  <p className="text-red-400 text-xs font-['JetBrains_Mono']">{signError}</p>
                )}

                <button
                  className="btn-primary w-full justify-center"
                  disabled={!recipient || recipient.length < 32 || createVoucherMutation.isPending}
                  onClick={handleSignVoucher}
                >
                  {createVoucherMutation.isPending ? "Signing..." : "Sign Voucher + Generate Claim Link"}
                </button>
              </div>
            )}

            {step === 3 && claimUrl && (
              <div className="space-y-5">
                <div className="border border-green-500/30 bg-green-500/5 rounded p-3">
                  <p className="text-green-400 text-xs font-['JetBrains_Mono'] font-bold">
                    Voucher signed. Share the claim link with the recipient.
                  </p>
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mt-1 leading-relaxed">
                    When they claim, you will see it in the Release Funds tab. Sign one unshield transaction to send plain SOL.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded">
                    <QRCodeSVG value={claimUrl} size={200} />
                  </div>
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] text-center">
                    Scan QR or share the URL below
                  </p>
                </div>

                <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded p-3">
                  <p className="text-white text-xs font-['JetBrains_Mono'] break-all">{claimUrl}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    className="btn-secondary w-full justify-center"
                    onClick={() => navigator.clipboard.writeText(claimUrl)}
                  >
                    Copy Link
                  </button>
                  <button
                    className="btn-secondary w-full justify-center"
                    onClick={resetCreate}
                  >
                    New Voucher
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "release" && (
        <div className="space-y-6">
          <div className="border border-[#2A2A2A] rounded p-4">
            <p className="text-[#888888] text-xs font-['JetBrains_Mono'] leading-relaxed">
              When a recipient claims a voucher you issued, it appears here.
              Enter your vault code and sign the unshield transaction to release plain SOL to them.
            </p>
          </div>

          {pendingClaims.length === 0 && (
            <div className="card text-center py-10">
              <p className="text-[#888888] font-['JetBrains_Mono'] text-sm">No pending claims</p>
              <p className="text-[#555] font-['JetBrains_Mono'] text-xs mt-1">
                Claims appear here when recipients submit their voucher
              </p>
            </div>
          )}

          {pendingClaims.length > 0 && (
            <>
              <div>
                <Label>Vault Code (to sign unshield transactions)</Label>
                <input
                  type="text"
                  className="input-field font-['JetBrains_Mono'] tracking-widest"
                  maxLength={8}
                  placeholder="8 chars"
                  value={releaseVaultCode}
                  onChange={(e) => setReleaseVaultCode(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              {releaseError && (
                <p className="text-red-400 text-xs font-['JetBrains_Mono']">{releaseError}</p>
              )}

              <div className="space-y-3">
                {pendingClaims.map((claim) => {
                  const txSig = releaseSuccess[claim.nonce];
                  const isReleasing = releasingNonce === claim.nonce;
                  return (
                    <div
                      key={claim.nonce}
                      className="card border border-[#2A2A2A] space-y-3"
                    >
                      {[
                        ["Token", claim.token],
                        ["Amount", `${claim.amount} ${claim.token}`],
                        ["Recipient", claim.claimerWallet
                          ? `${claim.claimerWallet.slice(0, 8)}...${claim.claimerWallet.slice(-6)}`
                          : `${claim.recipient.slice(0, 8)}...${claim.recipient.slice(-6)}`],
                        ["Expires", new Date(claim.expiresAt).toLocaleString()],
                      ].map(([label, val]) => (
                        <div key={label} className="flex items-center justify-between text-xs font-['JetBrains_Mono']">
                          <span className="text-[#888888]">{label}</span>
                          <span className="text-white">{val}</span>
                        </div>
                      ))}

                      {txSig ? (
                        <div className="border border-green-500/30 bg-green-500/5 rounded p-2">
                          <p className="text-green-400 text-xs font-['JetBrains_Mono'] font-bold">Released</p>
                          <a
                            href={`https://solscan.io/tx/${txSig}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#FF6B00] text-xs font-['JetBrains_Mono'] hover:text-white"
                          >
                            {txSig.slice(0, 12)}...{txSig.slice(-8)}
                          </a>
                        </div>
                      ) : (
                        <button
                          className="btn-primary w-full justify-center"
                          disabled={!isValidReleaseCode || isReleasing || !connected}
                          onClick={() => handleRelease(
                            claim.nonce,
                            claim.claimerWallet ?? claim.recipient,
                            claim.amount,
                            claim.token,
                          )}
                        >
                          {isReleasing ? "Signing + Broadcasting..." : "Sign to Release SOL"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
