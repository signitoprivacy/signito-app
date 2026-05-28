import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Keypair, PublicKey, LAMPORTS_PER_SOL, VersionedTransaction } from "@solana/web3.js";
import {
  useGetVault,
  getGetVaultQueryKey,
  useCreateVault,
  useUnshieldVault,
  useVaultDeposit,
  useAirsignMint,
  useAirsignAttachVoucher,
  useGetAirsignMints,
  useGetVaultBalances,
  getGetVaultBalancesQueryKey,
  getGetTransactionsQueryKey,
  getGetPortfolioQueryKey,
  useGetRelayInfo,
  getGetRelayInfoQueryKey,
  useStealthZkTransfer,
  useRelay,
} from "@workspace/api-client-react";
import { fetchUserState } from "@workspace/program";
import { useQueryClient } from "@tanstack/react-query";
import {
  validateVaultCode,
  deriveOtsHash,
  deriveOtsPreimage,
} from "../lib/ots";
import { useWallet } from "../lib/wallet";
import zecLogoUrl from "@assets/image_1778411971152.png";

const SSOL_CA = "B6CmtJ8VUeWYwqK8jnEBQGZVweBqBtNxdKBG8n2p4yLw";

export type ActionType = "shield" | "unshield" | "zk-send" | "voucher" | "mint";

export interface PanelConfig {
  action: ActionType;
  tokenSymbol: string;
  tokenBalance: number;
}

interface ActionPanelProps {
  config: PanelConfig;
  onClose: () => void;
}

const TOKEN_BG: Record<string, string> = {
  SOL: "#9945FF",
  USDC: "#2775CA",
  USDT: "#26A17B",
  BONK: "#F79F1F",
  WIF: "#EC4899",
  JTO: "#22C55E",
  JUP: "#19FB9B",
  ZEC: "#F4B728",
  mSOL: "#84CC16",
  bSOL: "#F97316",
  stSOL: "#06B6D4",
};

const TOKEN_LOGOS: Record<string, string> = {
  SOL: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  USDC: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  JUP: "https://static.jup.ag/jup/icon.png",
  ZEC: zecLogoUrl,
};

const TOKEN_ICON_SCALE: Record<string, number> = {
  SOL: 1.2,
};

function TokenIcon({ symbol }: { symbol: string }) {
  const base = symbol.replace(/^s/, "").replace(/^a/, "");
  const bg = TOKEN_BG[base] ?? "#2A2A2A";
  const logo = TOKEN_LOGOS[base];
  const iconScale = TOKEN_ICON_SCALE[base];
  const isShielded = symbol.startsWith("s") && symbol.length > 1;
  return (
    <div className="relative w-9 h-9 shrink-0">
      <div
        className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center font-bold text-white text-xs"
        style={{ background: bg }}
      >
        {logo ? (
          <img
            src={logo}
            alt={base}
            className="w-full h-full object-cover"
            style={iconScale ? { transform: `scale(${iconScale})` } : undefined}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          base.slice(0, 3).toUpperCase()
        )}
      </div>
      {isShielded && (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#FF6B00] border border-[#141414] flex items-center justify-center">
          <svg width="9" height="10" viewBox="0 0 9 10" fill="none">
            <path
              d="M4.5 0.5L8.5 2V5.5C8.5 7.5 6.5 9 4.5 9.5C2.5 9 0.5 7.5 0.5 5.5V2L4.5 0.5Z"
              fill="#0A0A0A"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

function hexToUint8Array(hex: string): Uint8Array {
  const b = new Uint8Array(hex.length / 2);
  for (let i = 0; i < b.length; i++) b[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return b;
}


const PANEL_META: Record<
  ActionType,
  { tag: string; title: (t: string) => string; sub: (t: string) => string }
> = {
  shield: {
    tag: "SAFEVAULT",
    title: (t) => `Shield ${t}`,
    sub: (t) => `${t} to s${t}: stored in your Shielded Vault PDA`,
  },
  unshield: {
    tag: "SAFEVAULT",
    title: (t) => `Unshield ${t}`,
    sub: (t) =>
      `s${t.replace(/^s/, "")} burned, ${t.replace(/^s/, "")} released to destination. Requires vault code.`,
  },
  "zk-send": {
    tag: "ZK POOL",
    title: () => "ZK Privacy Send",
    sub: () => "Groth16 proof: breaks on-chain link via SignitoRelay",
  },
  voucher: {
    tag: "AIRSIGN",
    title: () => "Create Voucher",
    sub: () => "Assign recipient to minted aSOL. Sign offline, deliver QR to anyone.",
  },
  mint: {
    tag: "AIRSIGN",
    title: (t) => `Mint ${"a" + t.replace(/^s/, "")}`,
    sub: (t) => `Burn ${t} on-chain. SOL locked in escrow. No recipient needed yet.`,
  },
};

export function ActionPanel({ config, onClose }: ActionPanelProps) {
  const { action, tokenSymbol, tokenBalance } = config;
  const { publicKey, signMessage, signTransaction, sendTransaction, connection } = useWallet();
  const createVaultMutation = useCreateVault();
  const unshieldMutation = useUnshieldVault();
  const depositMutation = useVaultDeposit();
  const mintMutation = useAirsignMint();
  const attachVoucherMutation = useAirsignAttachVoucher();
  const queryClient = useQueryClient();
  const meta = PANEL_META[action];
  const baseToken = tokenSymbol.replace(/^s/, "").replace(/^a/, "");

  const [amount, setAmount] = useState("");
  const [vaultCode, setVaultCode] = useState("");
  const [destination, setDestination] = useState("");
  const [zkStep, setZkStep] = useState<"form" | "ready">("form");
  const [voucherStep, setVoucherStep] = useState<"form" | "done">("form");
  const [voucherJson, setVoucherJson] = useState("");
  const [opError, setOpError] = useState("");
  const [shieldSuccess, setShieldSuccess] = useState(false);
  const [shieldOnchainSig, setShieldOnchainSig] = useState<string | null>(null);
  const [shieldOnchainErr, setShieldOnchainErr] = useState<string | null>(null);
  const [shieldMintToken, setShieldMintToken] = useState<string | null>(null);
  const [shieldCloseConfirmed, setShieldCloseConfirmed] = useState(false);
  const [caCopied, setCaCopied] = useState(false);
  const [unshieldSuccess, setUnshieldSuccess] = useState<{
    newDepth: number;
    txSig: string | null;
  } | null>(null);
  const [mintSuccess, setMintSuccess] = useState<{
    aToken: string;
    amount: number;
    nonce: string;
    newDepth: number;
  } | null>(null);
  const [selectedNonce, setSelectedNonce] = useState("");
  const [voucherClaimUrl, setVoucherClaimUrl] = useState("");

  // ZK / Relay state
  const [zkRecipient, setZkRecipient] = useState("");
  const [zkTxSig, setZkTxSig] = useState<string | null>(null);
  const [zkPending, setZkPending] = useState(false);
  const [zkError, setZkError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<string[]>([]);
  const addStep = (label: string) => setProcessingSteps((prev) => [...prev, label]);
  const [zkCexConfirmed, setZkCexConfirmed] = useState(false);
  const [zkCexChecks, setZkCexChecks] = useState([false, false]);
  const [showVaultCode, setShowVaultCode] = useState(false);

  const { data: relayInfo } = useGetRelayInfo({
    query: { queryKey: getGetRelayInfoQueryKey() },
  });

  // Fetch pending mints (minted aSOL with no voucher attached yet) for the voucher flow
  const { data: mintsData, refetch: refetchMints } = useGetAirsignMints(
    publicKey ?? "",
    {
      query: {
        queryKey: ["airsign-mints", publicKey ?? ""],
        enabled: !!publicKey && action === "voucher",
        staleTime: 0,
      },
    }
  );
  const zkTransferMutation = useStealthZkTransfer();
  const relayMutation = useRelay();

  const relayReady = relayInfo?.ready ?? false;

  // Fetch vault for shield, unshield, and mint flows
  const { data: vaultData, isLoading: vaultLoading } = useGetVault(
    publicKey ?? "",
    {
      query: {
        queryKey: getGetVaultQueryKey(publicKey ?? ""),
        enabled: !!publicKey && (action === "shield" || action === "unshield" || action === "mint" || action === "zk-send" || action === "voucher"),
      },
    }
  );

  // Fetch vault balances to get programDeployed status
  const { data: balancesData } = useGetVaultBalances(publicKey ?? "", {
    query: {
      queryKey: getGetVaultBalancesQueryKey(publicKey ?? ""),
      enabled: !!publicKey,
      staleTime: 0,
      refetchInterval: 3_000,
    },
  });

  const vault = vaultData?.vault ?? null;
  const chainDepth = vault?.chainDepth ?? 0;
  const vaultExists = !vaultLoading && !!vault;
  const shieldNeedsCode = !vaultLoading && !vault;

  // On-chain vault data (populated once program is deployed and vault exists)
  const onchainVault = (vaultData as Record<string, unknown> | null)?.["onchain"] as
    | { mintStoken?: string; vaultPda?: string }
    | null
    | undefined;
  const isProgramDeployed =
    !!balancesData?.programDeployed ||
    !!onchainVault?.vaultPda;

  useEffect(() => {
    setAmount("");
    setVaultCode("");
    setDestination("");

    setZkStep("form");
    setVoucherStep("form");
    setVoucherJson("");
    setSelectedNonce("");
    setVoucherClaimUrl("");
    setOpError("");
    setShieldSuccess(false);
    setShieldOnchainSig(null);
    setShieldOnchainErr(null);
    setShieldMintToken(null);
    setShieldCloseConfirmed(false);
    setUnshieldSuccess(null);
    setMintSuccess(null);
    setZkRecipient("");
    setZkTxSig(null);
    setZkPending(false);
    setZkError("");
    setIsProcessing(false);
    setProcessingSteps([]);
    setZkCexConfirmed(false);
    setZkCexChecks([false, false]);
    setShowVaultCode(false);
  }, [action, tokenSymbol]);

  const isValidCode = validateVaultCode(vaultCode);
  const canSubmitAmount = !!amount && parseFloat(amount) > 0;

  const solReserveViolated =
    action === "shield" &&
    tokenSymbol === "SOL" &&
    parseFloat(amount || "0") > tokenBalance - 0.001;

  const shieldReady =
    canSubmitAmount &&
    (!shieldNeedsCode || isValidCode) &&
    !vaultLoading &&
    !solReserveViolated;

  const unshieldReady =
    canSubmitAmount &&
    isValidCode &&
    !!publicKey &&
    vaultExists &&
    chainDepth > 0 &&
    parseFloat(amount || "0") <= tokenBalance &&
    parseFloat(amount || "0") > 0;

  const mintReady =
    canSubmitAmount &&
    isValidCode &&
    vaultExists &&
    chainDepth > 0;

  // Invalidate all data for this wallet after any state-changing action
  const invalidateAll = async () => {
    if (!publicKey) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetVaultQueryKey(publicKey) }),
      queryClient.invalidateQueries({ queryKey: getGetVaultBalancesQueryKey(publicKey) }),
      queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey(publicKey) }),
      queryClient.invalidateQueries({ queryKey: getGetPortfolioQueryKey(publicKey) }),
    ]);
  };

  // SHIELD handler
  const isBlockhashExpired = (msg: string) =>
    msg.includes("block height exceeded") || msg.includes("blockhash") || msg.includes("BlockhashNotFound");

  // Send a signed serialized tx and confirm it.
  // If confirmTransaction throws "block height exceeded", we fall back to
  // getSignatureStatus to check whether the tx actually landed on-chain.
  // This prevents false "failed" errors when the tx IS confirmed but our
  // confirmation blockhash tracking window expired.
  const sendAndConfirm = async (rawTx: Uint8Array, skipPreflight = false): Promise<string> => {
    if (!connection) throw new Error("No connection");

    let txSig: string;
    try {
      txSig = await connection.sendRawTransaction(rawTx, {
        skipPreflight,
        preflightCommitment: "confirmed",
      });
    } catch (sendErr) {
      const msg = sendErr instanceof Error ? sendErr.message : String(sendErr);
      if (isBlockhashExpired(msg)) throw new Error("Transaction expired. Please click again to retry.");
      throw sendErr;
    }

    addStep("Confirming on-chain...");
    try {
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction({ signature: txSig, blockhash, lastValidBlockHeight }, "confirmed");
    } catch (confirmErr) {
      const msg = confirmErr instanceof Error ? confirmErr.message : String(confirmErr);
      if (isBlockhashExpired(msg)) {
        // Confirmation tracking expired, check directly if the tx landed
        addStep("Verifying on-chain status...");
        let confirmed = false;
        for (let i = 0; i < 10; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          const statusRes = await connection.getSignatureStatus(txSig, { searchTransactionHistory: true });
          const status = statusRes.value;
          if (status && !status.err) {
            const conf = status.confirmationStatus;
            if (conf === "confirmed" || conf === "finalized") { confirmed = true; break; }
          } else if (status?.err) {
            throw new Error("Transaction failed on-chain: " + JSON.stringify(status.err));
          }
        }
        if (!confirmed) {
          // Still unknown, could be in-flight; return txSig and let caller decide
          // rather than reporting failure for a tx that may have landed
          return txSig;
        }
      } else {
        throw confirmErr;
      }
    }

    return txSig;
  };

  // Sign a partially-signed base64 tx (relayer already signed as fee payer)
  // with Phantom, post to /api/relay, then poll for on-chain confirmation.
  const relaySignAndConfirm = async (base64Tx: string): Promise<string> => {
    if (!signTransaction || !connection) throw new Error("Wallet not ready");
    const txBytes = Buffer.from(base64Tx, "base64");
    const tx = VersionedTransaction.deserialize(txBytes);
    const signed = await signTransaction(tx);
    addStep("Submitting via SignitoRelay...");
    const result = await relayMutation.mutateAsync({
      data: { transaction: Buffer.from(signed.serialize()).toString("base64"), wallet: publicKey ?? undefined },
    });
    const sig = result.signature;
    addStep("Confirming on-chain...");
    for (let i = 0; i < 20; i++) {
      const statusRes = await connection.getSignatureStatus(sig, { searchTransactionHistory: true });
      const status = statusRes.value;
      if (status && !status.err) {
        const conf = status.confirmationStatus;
        if (conf === "confirmed" || conf === "finalized") return sig;
      } else if (status?.err) {
        throw new Error("Transaction failed on-chain: " + JSON.stringify(status.err));
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    return sig;
  };

  // POST helper with JSON body and error extraction
  const apiPost = async <T,>(path: string, body: unknown): Promise<T> => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
      throw new Error(e.error ?? `Request failed (${res.status})`);
    }
    return res.json() as Promise<T>;
  };

  const handleShield = async () => {
    if (!publicKey || !shieldReady) return;
    setOpError("");

    setIsProcessing(true);

    if (shieldNeedsCode) {
      try {
        const codeHash = await deriveOtsHash(vaultCode, publicKey);

        addStep("Preparing transaction...");
        const prepData = await apiPost<{
          sim?: boolean;
          pendingId: string;
          txBase64?: string;
          mintStoken: string;
          stokenAccount: string;
          poolPda?: string;
          chainDepth: number;
          rentExtraLamports?: string;
        }>("/api/vault/prepare-shield", { wallet: publicKey, codeHash, amount: parseFloat(amount), chainDepth: 32 });

        if (!prepData.sim) {
          if (!signTransaction || !connection) throw new Error("Wallet not ready. Connect Phantom and try again.");
          addStep("Waiting for Phantom approval...");
          const txBytes = Buffer.from(prepData.txBase64!, "base64");
          const transferTx = VersionedTransaction.deserialize(txBytes);
          const signedTx = await signTransaction(transferTx);

          addStep("Sending SOL...");
          let transferSig: string;
          try {
            transferSig = await connection.sendRawTransaction(signedTx.serialize(), {
              skipPreflight: true,
              preflightCommitment: "confirmed",
            });
          } catch (sendErr) {
            const msg = sendErr instanceof Error ? sendErr.message : String(sendErr);
            if (msg.includes("block height exceeded") || msg.includes("blockhash")) throw new Error("Transaction expired. Please try again.");
            throw sendErr;
          }

          addStep("Waiting for confirmation...");
          const transferDeadline = Date.now() + 60_000;
          while (Date.now() < transferDeadline) {
            await new Promise((r) => setTimeout(r, 1500));
            const s = (await connection.getSignatureStatus(transferSig, { searchTransactionHistory: true })).value;
            if (s && !s.err && (s.confirmationStatus === "confirmed" || s.confirmationStatus === "finalized")) break;
            if (s?.err) throw new Error("SOL transfer failed on-chain.");
          }
          addStep("Transfer confirmed.");
        }

        addStep("Shielding on-chain...");
        const confirmData = await apiPost<{
          txSig: string;
          status: string;
          mintStoken: string;
          stokenAccount: string;
          codeHash: string;
          chainDepth: number;
          sim?: boolean;
        }>("/api/vault/confirm-shield", { pendingId: prepData.pendingId, wallet: publicKey });

        if (!confirmData.sim) {
          addStep("Waiting for shield confirmation...");
          const pollDeadline = Date.now() + 90_000;
          let done = false;
          while (Date.now() < pollDeadline && !done) {
            await new Promise((r) => setTimeout(r, 1500));
            try {
              const resp = await fetch(
                `/api/vault/shield-status?sig=${encodeURIComponent(confirmData.txSig)}&wallet=${encodeURIComponent(publicKey)}`,
              );
              const st = await resp.json() as { confirmationStatus: string; err?: unknown; vaultSaved?: boolean };
              if (st.err) throw new Error("Shield failed on-chain.");
              if ((st.confirmationStatus === "confirmed" || st.confirmationStatus === "finalized") && st.vaultSaved) done = true;
            } catch (pe) {
              if (pe instanceof Error && pe.message.startsWith("Shield failed")) throw pe;
            }
          }
          addStep("Vault sealed.");
        }

        addStep("Saving vault record...");
        await createVaultMutation.mutateAsync({
          data: {
            wallet: publicKey,
            codeHash,
            chainDepth: confirmData.chainDepth,
            token: baseToken,
            amount: parseFloat(amount),
            mint: confirmData.mintStoken,
            stokenAccount: confirmData.stokenAccount,
            txSig: confirmData.txSig,
          },
        });
        await invalidateAll();
        setShieldMintToken(confirmData.mintStoken);
        setShieldOnchainSig(confirmData.txSig);
        setShieldSuccess(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setOpError(msg);
      } finally {
        setIsProcessing(false);
        setProcessingSteps([]);
      }
    } else {
      // EXISTING VAULT DEPOSIT: two-step flow.
      // Step 1: prepare-deposit returns a plain SystemProgram.transfer for user to sign.
      // Step 2: confirm-deposit: server verifies SOL arrived, calls deposit ix server-side.
      if (baseToken !== "SOL") {
        setOpError("Only SOL deposits are supported currently.");
        setIsProcessing(false);
        return;
      }

      try {
        addStep("Preparing deposit...");
        const prepData = await apiPost<{
          sim?: boolean;
          pendingId: string;
          txBase64?: string;
        }>("/api/vault/prepare-deposit", { wallet: publicKey, amount: parseFloat(amount) });

        if (!prepData.sim) {
          if (!signTransaction || !connection) throw new Error("Wallet not ready. Connect Phantom and try again.");
          addStep("Waiting for Phantom approval...");
          const txBytes = Buffer.from(prepData.txBase64!, "base64");
          const transferTx = VersionedTransaction.deserialize(txBytes);
          const signedTx = await signTransaction(transferTx);
          addStep("Submitting SOL transfer...");
          await sendAndConfirm(signedTx.serialize(), true);
        }

        addStep("Processing deposit on-chain...");
        const confirmData = await apiPost<{ txSig: string; sim?: boolean }>(
          "/api/vault/confirm-deposit",
          { pendingId: prepData.pendingId, wallet: publicKey },
        );

        await depositMutation.mutateAsync({
          data: { wallet: publicKey, token: baseToken, amount: parseFloat(amount), txSig: confirmData.txSig },
        });
        await invalidateAll();
        setShieldOnchainSig(confirmData.txSig);
        setShieldSuccess(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setOpError(msg);
      } finally {
        setIsProcessing(false);
        setProcessingSteps([]);
      }
    }
  };

  // UNSHIELD handler
  const handleUnshield = async () => {
    if (!publicKey || !unshieldReady) return;
    setOpError("");

    setIsProcessing(true);
    addStep("Verifying OTS proof...");
    try {
      const preimage = await deriveOtsPreimage(vaultCode, publicKey, chainDepth, 1);
      const result = await unshieldMutation.mutateAsync({
        data: { wallet: publicKey, amount: parseFloat(amount), destination: publicKey, preimage, token: baseToken },
      });

      // DB already updated by API at this point: flush UI immediately
      await invalidateAll();

      // private_send is fully server-side -- relayer signs and broadcasts.
      // No Phantom approval needed. Poll for on-chain confirmation using returned txSig.
      const txSig: string | null = (result as unknown as Record<string, unknown>).txSig as string | null ?? null;
      const isSim = txSig?.startsWith("sim:") ?? false;
      if (txSig && connection && !isSim) {
        try {
          addStep("Waiting for confirmation...");
          for (let i = 0; i < 20; i++) {
            const statusRes = await connection.getSignatureStatus(txSig, { searchTransactionHistory: true });
            const status = statusRes.value;
            if (status && !status.err && (status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized")) {
              addStep("Unshield confirmed.");
              break;
            }
            if (status?.err) break;
            await new Promise((r) => setTimeout(r, 2000));
          }
          await invalidateAll();
        } catch { /* non-fatal poll failure */ }
      }

      setUnshieldSuccess({ newDepth: result.newChainDepth, txSig });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const apiMsg = (() => { try { return JSON.parse(msg).error as string; } catch { return null; } })();
      setOpError(apiMsg ?? msg ?? "Unshield failed. Check vault code and try again.");
    } finally {
      setIsProcessing(false);
      setProcessingSteps([]);
    }
  };

  // MINT handler: Step 1 -- burn sSOL on-chain, lock SOL in escrow. No recipient yet.
  const handleMint = async () => {
    if (!publicKey || !canSubmitAmount || !isValidCode || !vaultExists || chainDepth <= 0) return;
    setIsProcessing(true);
    setOpError("");
    addStep("Deriving OTS pre-image...");
    try {
      const preimage = await deriveOtsPreimage(vaultCode, publicKey, chainDepth, 1);
      addStep("Broadcasting on-chain...");
      const result = await mintMutation.mutateAsync({
        data: {
          wallet: publicKey,
          otsPreimage: preimage,
          amount: parseFloat(amount),
          token: baseToken,
        },
      });
      await invalidateAll();
      setMintSuccess({
        aToken: "a" + baseToken,
        amount: parseFloat(amount),
        nonce: result.nonce,
        newDepth: result.newDepth,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const apiMsg = (() => { try { return JSON.parse(msg).error as string; } catch { return null; } })();
      setOpError(apiMsg ?? msg ?? "Mint failed. Check vault code and try again.");
    } finally {
      setIsProcessing(false);
      setProcessingSteps([]);
    }
  };

  const handleZkTransfer = async () => {
    if (!publicKey || !vaultExists || chainDepth <= 0) return;
    setZkError("");
    setZkPending(true);
    setIsProcessing(true);
    addStep("Verifying OTS proof...");
    try {
      const preimage = await deriveOtsPreimage(vaultCode, publicKey, chainDepth, 1);
      addStep("Contacting SignitoRelay...");
      const sendAmt = parseFloat(amount);
      const result = await zkTransferMutation.mutateAsync({
        data: {
          wallet: publicKey,
          amount: sendAmt,
          recipient: zkRecipient,
          token: baseToken,
          preimage,
        },
      });
      // Optimistically reflect the balance deduction before refetch completes
      queryClient.setQueryData(
        getGetVaultBalancesQueryKey(publicKey),
        (old: unknown) => {
          if (!old || typeof old !== "object" || !("balances" in old)) return old;
          const d = old as { balances: { token: string; shieldedAmount: number }[]; [k: string]: unknown };
          return {
            ...d,
            balances: d.balances.map((b) =>
              b.token === tokenSymbol
                ? { ...b, shieldedAmount: Math.max(0, (b.shieldedAmount ?? 0) - sendAmt) }
                : b
            ),
          };
        }
      );
      await invalidateAll();
      setZkTxSig(result.txSig);
    } catch (err) {
      setZkError(err instanceof Error ? err.message : String(err));
    } finally {
      setZkPending(false);
      setIsProcessing(false);
      setProcessingSteps([]);
    }
  };

  // VOUCHER handler: Step 2 -- sign offline and attach voucher to an existing minted aSOL escrow.
  const handleCreateVoucher = async () => {
    if (!publicKey || !destination || !selectedNonce) return;
    if (!signMessage) {
      setOpError("Wallet does not support message signing. Use Phantom.");
      return;
    }

    const mint = mintsData?.mints?.find((m) => m.nonce === selectedNonce);
    if (!mint) {
      setOpError("Selected aSOL mint not found.");
      return;
    }

    setIsProcessing(true);
    setOpError("");
    addStep("Validating recipient...");
    try {
      const { PublicKey: PK } = await import("@solana/web3.js");

      let recipientBytes: Uint8Array;
      try {
        recipientBytes = new PK(destination).toBytes();
      } catch {
        setOpError("Invalid recipient address.");
        setIsProcessing(false);
        return;
      }

      // Build 57-byte voucher message:
      // byte  0:     domain separator 0x53 ('S') -- ensures first byte is never 0x80
      //              so Phantom's signMessage never mistakes the binary as a versioned tx
      // bytes 1-8:   amount u64 LE
      // bytes 9-40:  recipient pubkey (32 bytes)
      // bytes 41-56: nonce (16 bytes)
      const amountLamports = BigInt(Math.round(mint.amount * LAMPORTS_PER_SOL));
      const nonceBytes = new Uint8Array(16);
      for (let i = 0; i < 16; i++) {
        nonceBytes[i] = parseInt(selectedNonce.slice(i * 2, i * 2 + 2), 16);
      }

      const msgBytes = new Uint8Array(57);
      msgBytes[0] = 0x53; // 'S' domain separator
      const view = new DataView(msgBytes.buffer);
      view.setBigUint64(1, amountLamports, true);
      msgBytes.set(recipientBytes, 9);
      msgBytes.set(nonceBytes, 41);

      const voucherMsgHex = Array.from(msgBytes).map((b) => b.toString(16).padStart(2, "0")).join("");

      addStep("Waiting for Phantom signature...");
      const sigBytes = await signMessage(msgBytes);
      const sigHex = Array.from(sigBytes).map((b) => b.toString(16).padStart(2, "0")).join("");

      addStep("Storing voucher...");
      await attachVoucherMutation.mutateAsync({
        data: { wallet: publicKey, nonce: selectedNonce, voucherMsgHex, sigHex },
      });

      await refetchMints();

      const basePath = (import.meta.env.BASE_URL as string).replace(/\/$/, "");
      const claimUrl = `${window.location.origin}${basePath}/claim/${selectedNonce}`;
      setVoucherClaimUrl(claimUrl);
      setVoucherStep("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const apiMsg = (() => { try { return JSON.parse(msg).error as string; } catch { return null; } })();
      setOpError(apiMsg ?? msg ?? "Voucher creation failed.");
    } finally {
      setIsProcessing(false);
      setProcessingSteps([]);
    }
  };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-2 uppercase tracking-wider">
      {children}
    </label>
  );

  const InfoBox = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded p-3">
      <p className="text-[#888888] text-xs font-['JetBrains_Mono'] leading-relaxed">
        {children}
      </p>
    </div>
  );

  const TxLink = ({ sig, label }: { sig: string; label?: string }) => (
    <a
      href={`https://orbmarkets.io/tx/${sig}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#FF6B00] hover:text-white font-['JetBrains_Mono'] text-xs truncate max-w-[150px]"
    >
      {label ?? `${sig.slice(0, 8)}...${sig.slice(-6)}`}
    </a>
  );

  const isPending =
    createVaultMutation.isPending ||
    depositMutation.isPending ||
    unshieldMutation.isPending;

  return (
    <div className="flex flex-col h-full relative">
      {/* Processing overlay */}
      {isProcessing && (
        <div className="absolute inset-0 z-50 flex flex-col justify-center bg-[#0A0A0A]/95 rounded-none px-6 py-8">
          <div className="flex flex-col items-center gap-3 w-full max-w-xs mx-auto">
            <svg className="animate-spin shrink-0" width="36" height="36" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="16" stroke="#2A2A2A" strokeWidth="3" />
              <path d="M20 4 A16 16 0 0 1 36 20" stroke="#FF6B00" strokeWidth="3" strokeLinecap="round" />
            </svg>
            {processingSteps.length > 0 && (
              <p className="text-[#FF6B00] text-xs font-['JetBrains_Mono'] tracking-wider leading-snug text-center mt-1">
                {processingSteps[processingSteps.length - 1]}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-5 border-b border-[#2A2A2A] shrink-0">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="tag tag-orange mb-2 inline-block">{meta.tag}</span>
            <h2 className="font-['Space_Grotesk'] font-bold text-xl leading-tight">
              {meta.title(tokenSymbol)}
            </h2>
            <p className="text-[#888888] text-xs mt-1 font-['JetBrains_Mono'] leading-relaxed">
              {meta.sub(tokenSymbol)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#888888] hover:text-white transition-colors p-1 ml-4 shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded p-3">
          <TokenIcon symbol={tokenSymbol} />
          <div>
            <p className="font-['Space_Grotesk'] font-semibold text-sm">{tokenSymbol}</p>
            <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
              Available: {tokenBalance.toFixed(4)}
              {action === "unshield" && (
                <span className="ml-2 text-[#FF6B00]">
                  NonTransferable SPL, unshield only
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable form body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* SHIELD */}
        {action === "shield" && (
          <>
            {publicKey && !shieldSuccess && (
              <div
                className={`border rounded p-3 space-y-2 ${
                  vaultExists
                    ? "border-[#FF6B00]/40 bg-[#FF6B00]/5"
                    : "border-[#2A2A2A] bg-[#0A0A0A]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-['JetBrains_Mono'] text-[#888888] uppercase tracking-wider">
                    Destination Vault
                  </span>
                  {vaultLoading ? (
                    <span className="text-xs font-['JetBrains_Mono'] text-[#555]">checking...</span>
                  ) : vaultExists ? (
                    <span className="text-xs font-['JetBrains_Mono'] text-[#FF6B00]">Active</span>
                  ) : (
                    <span className="text-xs font-['JetBrains_Mono'] text-[#888888]">Not created</span>
                  )}
                </div>
                <p className="font-['JetBrains_Mono'] text-xs text-white">
                  {publicKey.slice(0, 8)}...{publicKey.slice(-6)}
                </p>
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

            {shieldSuccess ? (
              <div className="border border-green-500/40 bg-green-500/5 rounded p-4 space-y-2">
                <p className="text-green-400 text-xs font-['JetBrains_Mono'] font-bold">
                  {shieldNeedsCode ? "Vault created" : "Deposit recorded"}, OTS Protocol active
                </p>
                <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
                  {amount} {tokenSymbol} shielded.
                  {shieldNeedsCode && " Your vault code is set. You will need it to unshield."}
                </p>
                <div className="pt-2 border-t border-green-500/20 space-y-1">
                  <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                    <span className="text-[#888888]">Amount</span>
                    <span className="text-white">{amount} {tokenSymbol}</span>
                  </div>
                  <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                    <span className="text-[#888888]">Receives</span>
                    <span className="text-white">s{baseToken} (NonTransferable)</span>
                  </div>
                  {shieldNeedsCode && (
                    <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                      <span className="text-[#888888]">OTS depth</span>
                      <span className="text-[#FF6B00]">32</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                    <span className="text-[#888888]">On-chain</span>
                    {shieldOnchainSig ? (
                      <TxLink sig={shieldOnchainSig} />
                    ) : shieldOnchainErr ? (
                      <span className="text-[#FF6B00] max-w-[60%] text-right break-all">{shieldOnchainErr}</span>
                    ) : (
                      <span className="text-[#555]">recorded off-chain</span>
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t border-green-500/20 space-y-3">
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] leading-relaxed">
                    s{baseToken} uses SPL Token-2022 NonTransferable. It cannot be sent or stolen. Only the vault program can move it. Your wallet may hide it as spam. Add it manually using the address below.
                  </p>
                  <div>
                    <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mb-1.5">s{baseToken} contract address</p>
                    <button
                      className="w-full border border-[#333333] text-white text-xs font-['JetBrains_Mono'] py-2 px-3 flex items-center justify-between gap-2 hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors group"
                      onClick={() => {
                        const ca = shieldMintToken || SSOL_CA;
                        void navigator.clipboard.writeText(ca).then(() => {
                          setCaCopied(true);
                          setTimeout(() => setCaCopied(false), 2000);
                        });
                      }}
                      title="Copy contract address"
                    >
                      <span className="truncate">{shieldMintToken || SSOL_CA}</span>
                      <span className={`shrink-0 transition-colors ${caCopied ? "text-green-400" : "text-[#555555] group-hover:text-[#FF6B00]"}`}>
                        {caCopied ? "copied" : "copy"}
                      </span>
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[#666666] text-xs font-['JetBrains_Mono'] uppercase tracking-wider">How to add to Phantom</p>
                    {[
                      "Copy the contract address above.",
                      "Open Phantom and go to the tokens tab.",
                      "Tap the search icon and paste the address.",
                      "s" + baseToken + " will appear. Tap it.",
                      'Phantom may show a spam warning. Tap "Mark as not spam".',
                    ].map((step, i) => (
                      <div key={i} className="flex gap-2 text-xs font-['JetBrains_Mono'] text-[#666666]">
                        <span className="text-[#FF6B00] shrink-0">{String(i + 1).padStart(2, "0")}.</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <Label>Amount</Label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mt-1.5">
                    Max:{" "}
                    <button
                      type="button"
                      onClick={() => {
                        const max = tokenSymbol === "SOL"
                          ? Math.max(0, tokenBalance - 0.001)
                          : tokenBalance;
                        setAmount(max.toFixed(4));
                      }}
                      className="text-[#FF6B00] hover:text-white transition-colors"
                    >
                      {tokenSymbol === "SOL"
                        ? Math.max(0, tokenBalance - 0.001).toFixed(4)
                        : tokenBalance.toFixed(4)} {tokenSymbol}
                    </button>
                  </p>
                  {solReserveViolated && (
                    <p className="text-red-400 text-xs font-['JetBrains_Mono'] mt-1.5">
                      Minimum 0.001 SOL must remain in your wallet.
                    </p>
                  )}
                </div>

                {shieldNeedsCode && (
                  <div>
                    <Label>Set Vault Code</Label>
                    <div className="relative">
                      <input
                        type={showVaultCode ? "text" : "password"}
                        className="input-field"
                        style={{ paddingRight: "2.5rem" }}
                        maxLength={8}
                        autoComplete="off"
                        placeholder="8 chars (e.g. abcd1234)"
                        value={vaultCode}
                        onChange={(e) => setVaultCode(e.target.value)}
                      />
                      <button type="button" onClick={() => setShowVaultCode((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888888] transition-colors">
                        {showVaultCode ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/></svg>
                        ) : (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                    {vaultCode.length > 0 && !isValidCode && (
                      <p className="text-[#FF6B00] text-xs font-['JetBrains_Mono'] mt-1">
                        {vaultCode.length < 8
                          ? `${8 - vaultCode.length} more char${8 - vaultCode.length > 1 ? "s" : ""} needed`
                          : "Letters and numbers only (a-z, A-Z, 0-9)"}
                      </p>
                    )}
                    {isValidCode && (
                      <p className="text-green-500 text-xs font-['JetBrains_Mono'] mt-1">Vault code valid.</p>
                    )}
                    <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mt-1.5">
                      PBKDF2 seed for your OTS Protocol chain. Same code + same wallet regenerates
                      the same chain on any device. Never leaves your browser.
                    </p>
                  </div>
                )}

                {vaultExists && chainDepth < 5 && (
                  <div className="border border-red-500/30 rounded p-3">
                    <p className="text-red-400 text-xs font-['JetBrains_Mono']">
                      Warning: {chainDepth} OTS signatures remaining. Extend your chain before withdrawing.
                    </p>
                  </div>
                )}

                {vaultExists && (
                  <InfoBox>
                    Your vault is active. This deposit adds to your shielded balance.
                    No vault code needed for additional deposits.
                  </InfoBox>
                )}

                <InfoBox>
                  {tokenSymbol} to s{tokenSymbol} (NonTransferable SPL Token-2022). Stored in your
                  wallet-bound vault PDA on Solana. Est. one-time vault creation: ~0.002 SOL.
                </InfoBox>

                {opError && (
                  <p className="text-red-400 text-xs font-['JetBrains_Mono']">{opError}</p>
                )}
              </>
            )}
          </>
        )}

        {/* UNSHIELD */}
        {action === "unshield" && (
          <>
            {unshieldSuccess ? (
              <div className="border border-green-500/40 bg-green-500/5 rounded p-4 space-y-2">
                <p className="text-green-400 text-xs font-['JetBrains_Mono'] font-bold">
                  OTS verified, unshield {unshieldSuccess.txSig ? "submitted" : "queued"}
                </p>
                <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
                  {(parseFloat(amount) * 0.9985).toFixed(6)} {baseToken} released to your wallet (0.15% relay fee deducted). OTS depth decremented.
                </p>
                <div className="pt-2 border-t border-green-500/20 space-y-1">
                  <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                    <span className="text-[#888888]">Amount</span>
                    <span className="text-white">{amount} {tokenSymbol}</span>
                  </div>
                  <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                    <span className="text-[#888888]">To</span>
                    <span className="text-white font-['JetBrains_Mono'] text-xs">your wallet</span>
                  </div>
                  <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                    <span className="text-[#888888]">OTS depth remaining</span>
                    <span className={`font-bold ${unshieldSuccess.newDepth < 5 ? "text-red-400" : "text-[#FF6B00]"}`}>
                      {unshieldSuccess.newDepth}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                    <span className="text-[#888888]">On-chain tx</span>
                    {unshieldSuccess.txSig ? (
                      <TxLink sig={unshieldSuccess.txSig} />
                    ) : (
                      <span className="text-[#555]">recorded off-chain</span>
                    )}
                  </div>
                </div>
                {unshieldSuccess.newDepth === 0 && (
                  <div className="border border-red-500/30 rounded p-2 mt-2">
                    <p className="text-red-400 text-xs font-['JetBrains_Mono']">
                      OTS chain exhausted. Create a new vault to continue.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {publicKey && (
                  <div className={`border rounded p-3 space-y-1 ${
                    vaultExists ? "border-[#2A2A2A] bg-[#0D0D0D]" : "border-red-500/30 bg-[#0A0A0A]"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-['JetBrains_Mono'] text-[#888888] uppercase tracking-wider">
                        Vault Status
                      </span>
                      {vaultLoading ? (
                        <span className="text-xs font-['JetBrains_Mono'] text-[#555]">checking...</span>
                      ) : vaultExists ? (
                        <span className="text-xs font-['JetBrains_Mono'] text-[#FF6B00]">Active</span>
                      ) : (
                        <span className="text-xs font-['JetBrains_Mono'] text-red-400">No vault found</span>
                      )}
                    </div>
                    {vaultExists && (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="text-[#888888] text-xs font-['JetBrains_Mono']">OTS depth remaining:</span>
                          <span className={`text-xs font-['JetBrains_Mono'] font-bold ${chainDepth < 5 ? "text-red-400" : "text-[#FF6B00]"}`}>
                            {chainDepth}
                          </span>
                        </div>
                        {isProgramDeployed && (
                          <div className="flex items-center gap-2 pt-1 border-t border-[#FF6B00]/20">
                            <span className="text-[#FF6B00] text-xs font-['JetBrains_Mono']">on-chain active</span>
                          </div>
                        )}
                      </>
                    )}
                    {!vaultExists && (
                      <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
                        Shield tokens first to create your vault.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <Label>Amount</Label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mt-1.5">
                    Max:{" "}
                    <button type="button" onClick={() => setAmount(tokenBalance.toString())} className="text-[#FF6B00] hover:text-white transition-colors">
                      {tokenBalance.toFixed(4)} {tokenSymbol}
                    </button>
                  </p>
                </div>

                {canSubmitAmount && (
                  <div className="border border-[#2A2A2A] rounded p-3 space-y-1">
                    <div className="flex items-center justify-between text-xs font-['JetBrains_Mono']">
                      <span className="text-[#888888]">You burn</span>
                      <span className="text-white">{parseFloat(amount).toFixed(4)} s{baseToken}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-['JetBrains_Mono']">
                      <span className="text-[#888888]">Relay fee (0.15%)</span>
                      <span className="text-[#888888]">-{(parseFloat(amount) * 0.0015).toFixed(6)} {baseToken}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-['JetBrains_Mono'] border-t border-[#2A2A2A] pt-1">
                      <span className="text-white font-bold">You receive</span>
                      <span className="text-[#FF6B00] font-bold">{(parseFloat(amount) * 0.9985).toFixed(6)} {baseToken}</span>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Vault Code</Label>
                  <div className="relative">
                    <input
                      type={showVaultCode ? "text" : "password"}
                      className="input-field"
                      style={{ paddingRight: "2.5rem" }}
                      maxLength={8}
                      autoComplete="off"
                      placeholder="e.g. AB12cd34"
                      value={vaultCode}
                      onChange={(e) => setVaultCode(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowVaultCode((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888888] transition-colors">
                      {showVaultCode ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/></svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                  {vaultCode.length > 0 && !isValidCode && (
                    <p className="text-[#FF6B00] text-xs font-['JetBrains_Mono'] mt-1">
                      Must be 8 chars: letters and numbers only (a-z, A-Z, 0-9)
                    </p>
                  )}
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mt-1.5">
                    Derives OTS pre-image H{chainDepth > 0 ? chainDepth - 1 : "?"} from your vault code.
                    Consumes one depth level.
                  </p>
                </div>

                <InfoBox>
                  s{baseToken} is NonTransferable (SPL Token-2022). Unshield burns s{baseToken} and releases {baseToken} back to your wallet. One OTS depth level consumed per unshield.
                </InfoBox>

                {opError && (
                  <p className="text-red-400 text-xs font-['JetBrains_Mono']">{opError}</p>
                )}
              </>
            )}
          </>
        )}

        {/* ZK / RELAY SEND */}
        {action === "zk-send" && (
          <>
            {zkTxSig ? (
              <div className="border border-green-500/40 bg-green-500/5 rounded p-4 space-y-2">
                <p className="text-green-400 text-xs font-['JetBrains_Mono'] font-bold">Transfer complete</p>
                <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
                  Recipient received {(parseFloat(amount) * 0.9985).toFixed(6)} {baseToken} (0.15% relay fee deducted). Your wallet has no on-chain trace.
                </p>
                <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
                  {amount} {tokenSymbol} deducted from your shielded balance.
                </p>
                <TxLink sig={zkTxSig} label={`${zkTxSig.slice(0, 8)}...${zkTxSig.slice(-6)}`} />
              </div>
            ) : !zkCexConfirmed ? (
              <>
                <div className="border border-[#FF6B00]/40 bg-[#FF6B00]/5 rounded p-4 space-y-1">
                  <p className="text-[#FF6B00] text-xs font-['JetBrains_Mono'] font-bold uppercase tracking-wider">Before you send</p>
                  <p className="text-[#AAAAAA] text-xs font-['JetBrains_Mono'] leading-relaxed">
                    Do not send to a CEX deposit address. SignitoRelay is the on-chain sender, so exchanges will not credit the funds and may freeze them permanently.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {[
                    "The recipient is not a CEX deposit address (Binance, Coinbase, OKX, Kraken, etc.)",
                    "I understand funds sent to a CEX deposit address may be lost permanently",
                  ].map((label, i) => (
                    <label key={i} className="flex items-start gap-3 cursor-pointer group">
                      <div
                        className={`mt-0.5 w-4 h-4 flex-shrink-0 border rounded-sm flex items-center justify-center transition-colors ${
                          zkCexChecks[i]
                            ? "border-[#FF6B00] bg-[#FF6B00]"
                            : "border-[#444] bg-[#111] group-hover:border-[#FF6B00]/60"
                        }`}
                        onClick={() => {
                          const next = [...zkCexChecks];
                          next[i] = !next[i];
                          setZkCexChecks(next);
                        }}
                      >
                        {zkCexChecks[i] && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs font-['JetBrains_Mono'] text-[#AAAAAA] leading-relaxed">{label}</span>
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <>
                {publicKey && (
                  <div className={`border rounded p-3 space-y-1 ${vaultExists ? "border-[#2A2A2A] bg-[#0D0D0D]" : "border-red-500/30 bg-[#0A0A0A]"}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-['JetBrains_Mono'] text-[#888888] uppercase tracking-wider">Vault Status</span>
                      {vaultLoading ? (
                        <span className="text-xs font-['JetBrains_Mono'] text-[#555]">checking...</span>
                      ) : vaultExists ? (
                        <span className="text-xs font-['JetBrains_Mono'] text-[#FF6B00]">Active</span>
                      ) : (
                        <span className="text-xs font-['JetBrains_Mono'] text-red-400">No vault. Shield first.</span>
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

                <div>
                  <Label>Amount ({baseToken})</Label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.001"
                    min="0.001"
                  />
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mt-1.5">
                    Available:{" "}
                    <button type="button" onClick={() => setAmount(tokenBalance.toString())} className="text-[#FF6B00] hover:text-white transition-colors">
                      {tokenBalance.toFixed(4)} {tokenSymbol}
                    </button>
                  </p>
                </div>

                {canSubmitAmount && (
                  <div className="border border-[#2A2A2A] rounded p-3 space-y-1">
                    <div className="flex items-center justify-between text-xs font-['JetBrains_Mono']">
                      <span className="text-[#888888]">You send</span>
                      <span className="text-white">{parseFloat(amount).toFixed(4)} s{baseToken}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-['JetBrains_Mono']">
                      <span className="text-[#888888]">Relay fee (0.15%)</span>
                      <span className="text-[#888888]">-{(parseFloat(amount) * 0.0015).toFixed(6)} {baseToken}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-['JetBrains_Mono'] border-t border-[#2A2A2A] pt-1">
                      <span className="text-white font-bold">Recipient gets</span>
                      <span className="text-[#FF6B00] font-bold">{(parseFloat(amount) * 0.9985).toFixed(6)} {baseToken}</span>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Recipient Address</Label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Destination Solana address"
                    value={zkRecipient}
                    onChange={(e) => setZkRecipient(e.target.value.trim())}
                  />
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mt-1.5">
                    Self-custodied wallet only. On-chain: relay to recipient, no trace to your wallet.
                  </p>
                </div>

                <div>
                  <Label>Vault Code</Label>
                  <div className="relative">
                    <input
                      type={showVaultCode ? "text" : "password"}
                      className="input-field"
                      style={{ paddingRight: "2.5rem" }}
                      maxLength={8}
                      autoComplete="off"
                      placeholder="e.g. AB12cd34"
                      value={vaultCode}
                      onChange={(e) => setVaultCode(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowVaultCode((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888888] transition-colors">
                      {showVaultCode ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/></svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                  {vaultCode.length > 0 && !isValidCode && (
                    <p className="text-[#FF6B00] text-xs font-['JetBrains_Mono'] mt-1">
                      Must be 8 chars: letters and numbers only (a-z, A-Z, 0-9)
                    </p>
                  )}
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mt-1.5">
                    Proves vault ownership via OTS. Consumes one depth level.
                  </p>
                </div>

                <InfoBox>
                  No transaction from your wallet. SignitoRelay pays the fee and broadcasts. The on-chain record shows relay to recipient only.
                </InfoBox>

                {!relayReady && (
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono']">SignitoRelay not configured.</p>
                )}
                {zkError && <p className="text-red-400 text-xs font-['JetBrains_Mono']">{zkError}</p>}
              </>
            )}
          </>
        )}

        {/* MINT airToken */}
        {action === "mint" && (
          <>
            {mintSuccess ? (
              <div className="border border-green-500/40 bg-green-500/5 rounded p-4 space-y-2">
                <p className="text-green-400 text-xs font-['JetBrains_Mono'] font-bold">
                  {mintSuccess.aToken} minted, ready for AirSign
                </p>
                <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
                  Your {mintSuccess.aToken} airToken is ready. Use the Voucher action to
                  create an offline Ed25519 voucher for a recipient.
                </p>
                <div className="pt-2 border-t border-green-500/20 space-y-1">
                  <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                    <span className="text-[#888888]">airToken</span>
                    <span className="text-white">{mintSuccess.aToken}</span>
                  </div>
                  <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                    <span className="text-[#888888]">Amount</span>
                    <span className="text-white">{mintSuccess.amount}</span>
                  </div>
                  <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                    <span className="text-[#888888]">Nonce</span>
                    <span className="text-[#FF6B00] font-['JetBrains_Mono'] truncate">{mintSuccess.nonce.slice(0, 16)}...</span>
                  </div>
                  <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                    <span className="text-[#888888]">OTS depth remaining</span>
                    <span className={`font-bold ${mintSuccess.newDepth < 5 ? "text-red-400" : "text-[#FF6B00]"}`}>
                      {mintSuccess.newDepth}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {publicKey && (
                  <div className={`border rounded p-3 space-y-1 ${
                    vaultExists ? "border-[#2A2A2A] bg-[#0D0D0D]" : "border-red-500/30 bg-[#0A0A0A]"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-['JetBrains_Mono'] text-[#888888] uppercase tracking-wider">
                        Vault Status
                      </span>
                      {vaultLoading ? (
                        <span className="text-xs font-['JetBrains_Mono'] text-[#555]">checking...</span>
                      ) : vaultExists ? (
                        <span className="text-xs font-['JetBrains_Mono'] text-[#FF6B00]">Active</span>
                      ) : (
                        <span className="text-xs font-['JetBrains_Mono'] text-red-400">No vault. Shield first.</span>
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

                <div>
                  <Label>Amount</Label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mt-1.5">
                    Max:{" "}
                    <button type="button" onClick={() => setAmount(tokenBalance.toString())} className="text-[#FF6B00] hover:text-white transition-colors">
                      {tokenBalance.toFixed(4)} {tokenSymbol}
                    </button>
                  </p>
                </div>

                <div>
                  <Label>Vault Code</Label>
                  <div className="relative">
                    <input
                      type={showVaultCode ? "text" : "password"}
                      className="input-field"
                      style={{ paddingRight: "2.5rem" }}
                      maxLength={8}
                      autoComplete="off"
                      placeholder="e.g. AB12cd34"
                      value={vaultCode}
                      onChange={(e) => setVaultCode(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowVaultCode((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888888] transition-colors">
                      {showVaultCode ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/></svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                  {vaultCode.length > 0 && !isValidCode && (
                    <p className="text-[#FF6B00] text-xs font-['JetBrains_Mono'] mt-1">
                      Must be 8 chars: letters and numbers only (a-z, A-Z, 0-9)
                    </p>
                  )}
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mt-1.5">
                    OTS pre-image verified server-side. Consumes one depth level.
                  </p>
                </div>

                <InfoBox>
                  {"a" + baseToken} is an offline-transferable airToken.
                  Minting converts {tokenSymbol} to {"a" + baseToken} at 1:1.
                  Recipients claim on-chain by redeeming a signed voucher.
                </InfoBox>

                <div className="border border-[#2A2A2A] rounded p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#888888] text-xs font-['JetBrains_Mono'] uppercase tracking-wider">You convert</span>
                    <span className="text-white text-xs font-['JetBrains_Mono'] font-bold">{amount || "0.0000"} {tokenSymbol}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#888888] text-xs font-['JetBrains_Mono'] uppercase tracking-wider">You receive</span>
                    <span className="text-white text-xs font-['JetBrains_Mono'] font-bold">{amount || "0.0000"} {"a" + baseToken}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#888888] text-xs font-['JetBrains_Mono'] uppercase tracking-wider">Rate</span>
                    <span className="text-[#FF6B00] text-xs font-['JetBrains_Mono']">1:1</span>
                  </div>
                </div>

                {opError && (
                  <p className="text-red-400 text-xs font-['JetBrains_Mono']">{opError}</p>
                )}
              </>
            )}
          </>
        )}

        {/* VOUCHER */}
        {action === "voucher" && (
          <>
            {voucherStep === "form" ? (
              <>
                {/* Pending mints selector */}
                {!mintsData ? (
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono']">Loading aSOL balance...</p>
                ) : mintsData.mints.length === 0 ? (
                  <div className="border border-[#2A2A2A] bg-[#0D0D0D] rounded p-3">
                    <p className="text-[#FF6B00] text-xs font-['JetBrains_Mono'] font-bold mb-1">No aSOL minted</p>
                    <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
                      Mint aSOL first using the Mint button on the Shielded tab.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label>Select aSOL to assign</Label>
                      <div className="space-y-1">
                        {mintsData.mints.map((m) => (
                          <button
                            key={m.nonce}
                            onClick={() => setSelectedNonce(m.nonce)}
                            className={`w-full text-left border rounded p-2.5 transition-all font-['JetBrains_Mono'] text-xs ${
                              selectedNonce === m.nonce
                                ? "border-[#FF6B00] bg-[#FF6B00]/10 text-white"
                                : "border-[#2A2A2A] text-[#888888] hover:border-[#444]"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold">{m.amount.toFixed(4)} {"a" + m.token}</span>
                              <span className="text-[10px] text-[#555]">{m.nonce.slice(0, 8)}...</span>
                            </div>
                            <div className="text-[10px] text-[#555] mt-0.5">
                              {new Date(m.createdAt).toLocaleString()}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedNonce && (
                      <div>
                        <Label>Recipient Address</Label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Destination Solana address"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                        />
                      </div>
                    )}

                    <InfoBox>
                      Signing is offline: only your wallet key and recipient address needed. SOL was already locked on-chain at mint. Recipient or anyone with the link can claim.
                    </InfoBox>

                    {opError && (
                      <p className="text-red-400 text-xs font-['JetBrains_Mono']">{opError}</p>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <div className="border border-green-500/40 bg-green-500/5 rounded p-3">
                  <p className="text-green-400 text-xs font-['JetBrains_Mono'] font-bold mb-1">Voucher ready</p>
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
                    Share QR or link. Single-use, no expiry. Recipient does not need a wallet connection.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-white p-3 rounded">
                    <QRCodeSVG value={voucherClaimUrl} size={164} />
                  </div>
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] text-center">
                    Scan QR or share the link below
                  </p>
                </div>
                <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded p-3">
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] break-all leading-relaxed">
                    {voucherClaimUrl}
                  </p>
                </div>
                <button
                  className="btn-secondary w-full justify-center"
                  onClick={() => void navigator.clipboard.writeText(voucherClaimUrl)}
                >
                  Copy Claim Link
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Footer CTA */}
      <div className="p-5 border-t border-[#2A2A2A] shrink-0 space-y-3">
        {action === "shield" && !shieldSuccess && (
          <button
            className="btn-primary w-full justify-center"
            disabled={!shieldReady || isPending}
            onClick={handleShield}
          >
            {isPending
              ? (shieldNeedsCode ? "Creating vault..." : "Recording deposit...")
              : shieldNeedsCode
                ? `Create Vault + Shield ${amount || "0"} ${tokenSymbol}`
                : `Shield ${amount || "0"} ${tokenSymbol}`}
          </button>
        )}
        {action === "shield" && shieldSuccess && (
          <>
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={shieldCloseConfirmed}
                onChange={(e) => setShieldCloseConfirmed(e.target.checked)}
                className="mt-0.5 shrink-0 accent-[#FF6B00] w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-['JetBrains_Mono'] text-[#888888] leading-relaxed">
                I have noted the sSOL contract address and understand it may not appear in my wallet automatically.
              </span>
            </label>
            <button
              className="btn-secondary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!shieldCloseConfirmed}
              onClick={onClose}
            >
              Close
            </button>
          </>
        )}

        {action === "unshield" && !unshieldSuccess && (
          <button
            className="btn-primary w-full justify-center"
            disabled={!unshieldReady || isPending}
            onClick={handleUnshield}
          >
            {isPending
              ? "Verifying OTS..."
              : parseFloat(amount || "0") > tokenBalance
                ? `Insufficient ${tokenSymbol} balance`
                : `Unshield ${amount || "0"} ${tokenSymbol}`}
          </button>
        )}
        {action === "unshield" && unshieldSuccess && (
          <button className="btn-secondary w-full justify-center" onClick={onClose}>
            Close
          </button>
        )}

        {action === "zk-send" && !zkTxSig && !zkCexConfirmed && (
          <button
            className="btn-primary w-full justify-center"
            disabled={zkCexChecks.some((c) => !c)}
            onClick={() => setZkCexConfirmed(true)}
          >
            {zkCexChecks.some((c) => !c)
              ? `Confirm ${zkCexChecks.filter(Boolean).length}/2 items above`
              : "I understand, continue"}
          </button>
        )}
        {action === "zk-send" && !zkTxSig && zkCexConfirmed && (
          <button
            className="btn-primary w-full justify-center"
            disabled={
              !relayReady ||
              !canSubmitAmount ||
              parseFloat(amount) > tokenBalance ||
              !zkRecipient ||
              zkRecipient.length < 32 ||
              !isValidCode ||
              !vaultExists ||
              chainDepth <= 0 ||
              zkPending
            }
            onClick={handleZkTransfer}
          >
            {!publicKey
              ? "Connect Wallet First"
              : !relayReady
                ? "Relay Unavailable"
                : !vaultExists
                  ? "No vault, shield first"
                  : chainDepth <= 0
                    ? "OTS chain exhausted"
                    : canSubmitAmount && parseFloat(amount) > tokenBalance
                      ? `Insufficient ${tokenSymbol} balance`
                      : zkPending
                        ? "Sending..."
                        : `Send ${amount || "0"} ${baseToken} via ZK Relay`}
          </button>
        )}
        {action === "zk-send" && !!zkTxSig && (
          <button className="btn-secondary w-full justify-center" onClick={onClose}>
            Close
          </button>
        )}

        {action === "mint" && !mintSuccess && (
          <button
            className="btn-primary w-full justify-center"
            disabled={!mintReady || isProcessing}
            onClick={() => void handleMint()}
          >
            {isProcessing
              ? processingSteps.at(-1) || "Minting..."
              : `Mint ${"a" + baseToken} from ${amount || "0"} ${tokenSymbol}`}
          </button>
        )}
        {action === "mint" && mintSuccess && (
          <button className="btn-secondary w-full justify-center" onClick={onClose}>
            Close
          </button>
        )}

        {action === "voucher" && voucherStep === "form" && (mintsData?.mints?.length ?? 0) > 0 && (
          <button
            className="btn-primary w-full justify-center"
            disabled={!selectedNonce || !destination || isProcessing || attachVoucherMutation.isPending}
            onClick={() => void handleCreateVoucher()}
          >
            {isProcessing
              ? processingSteps.at(-1) || "Signing..."
              : attachVoucherMutation.isPending
                ? "Storing..."
                : !selectedNonce
                  ? "Select aSOL first"
                  : !destination
                    ? "Enter recipient"
                    : "Sign and Create Voucher"}
          </button>
        )}
        {action === "voucher" && voucherStep === "done" && (
          <button
            className="btn-secondary w-full justify-center"
            onClick={() => {
              setVoucherStep("form");
              setVoucherClaimUrl("");
              setSelectedNonce("");
              setDestination("");
              void refetchMints();
            }}
          >
            New Voucher
          </button>
        )}

        <p className="text-center text-xs text-[#888888] font-['JetBrains_Mono']">
          {isProgramDeployed
            ? "signito_vault active on-chain, non-custodial"
            : "on-chain execution pending signito_vault program deployment"}
        </p>
      </div>
    </div>
  );
}
