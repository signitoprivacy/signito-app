import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Keypair, PublicKey, LAMPORTS_PER_SOL, VersionedTransaction } from "@solana/web3.js";
import {
  useGetVault,
  getGetVaultQueryKey,
  useCreateVault,
  useUnshieldVault,
  useVaultDeposit,
  useAirsignPrepare,
  useGetVaultBalances,
  getGetAirsignBalancesQueryKey,
  getGetVaultBalancesQueryKey,
  getGetTransactionsQueryKey,
  getGetPortfolioQueryKey,
  useGetRelayInfo,
  getGetRelayInfoQueryKey,
  useStealthZkTransfer,
  useAirsignCreateVoucher,
  useRelay,
} from "@workspace/api-client-react";
import { buildInitializeVaultIx, buildVersionedTx, buildConvertToAirtokenIx, deriveVaultPda, fetchVaultState } from "@workspace/program";
import { useQueryClient } from "@tanstack/react-query";
import {
  validateVaultCode,
  deriveOtsHash,
  deriveOtsPreimage,
} from "../lib/ots";
import { useWallet } from "../lib/wallet";
import zecLogoUrl from "@assets/image_1778411971152.png";

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
    sub: (t) => `${t} to s${t}: stored in your SafeVault PDA`,
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
    title: (t) => `Voucher from ${t}`,
    sub: () => "Ed25519 offline voucher, recipient claims on-chain",
  },
  mint: {
    tag: "AIRSIGN",
    title: (t) => `Mint ${"a" + t.replace(/^s/, "")}`,
    sub: (t) => `Convert ${t} to ${"a" + t.replace(/^s/, "")} airToken for offline voucher delivery`,
  },
};

export function ActionPanel({ config, onClose }: ActionPanelProps) {
  const { action, tokenSymbol, tokenBalance } = config;
  const { publicKey, signMessage, signTransaction, sendTransaction, connection } = useWallet();
  const createVaultMutation = useCreateVault();
  const unshieldMutation = useUnshieldVault();
  const depositMutation = useVaultDeposit();
  const mintMutation = useAirsignPrepare();
  const createVoucherMutation = useAirsignCreateVoucher();
  const queryClient = useQueryClient();
  const meta = PANEL_META[action];
  const baseToken = tokenSymbol.replace(/^s/, "").replace(/^a/, "");

  const [amount, setAmount] = useState("");
  const [vaultCode, setVaultCode] = useState("");
  const [destination, setDestination] = useState(publicKey ?? "");
  const [expiry, setExpiry] = useState("24");
  const [zkStep, setZkStep] = useState<"form" | "ready">("form");
  const [voucherStep, setVoucherStep] = useState<"form" | "done">("form");
  const [voucherJson, setVoucherJson] = useState("");
  const [opError, setOpError] = useState("");
  const [shieldSuccess, setShieldSuccess] = useState(false);
  const [shieldOnchainSig, setShieldOnchainSig] = useState<string | null>(null);
  const [shieldOnchainErr, setShieldOnchainErr] = useState<string | null>(null);
  const [shieldMintToken, setShieldMintToken] = useState<string | null>(null);
  const [unshieldSuccess, setUnshieldSuccess] = useState<{
    newDepth: number;
    txSig: string | null;
  } | null>(null);
  const [mintSuccess, setMintSuccess] = useState<{
    aToken: string;
    amount: number;
    nonce: string;
    expiresAt: string;
    newDepth: number;
  } | null>(null);

  // ZK / Relay state
  const [zkRecipient, setZkRecipient] = useState("");
  const [zkTxSig, setZkTxSig] = useState<string | null>(null);
  const [zkPending, setZkPending] = useState(false);
  const [zkError, setZkError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState("");

  const { data: relayInfo } = useGetRelayInfo({
    query: { queryKey: getGetRelayInfoQueryKey() },
  });
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
      staleTime: 3_000,
      refetchInterval: 5_000,
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
    setDestination(publicKey ?? "");
    setExpiry("24");
    setZkStep("form");
    setVoucherStep("form");
    setVoucherJson("");
    setOpError("");
    setShieldSuccess(false);
    setShieldOnchainSig(null);
    setShieldOnchainErr(null);
    setShieldMintToken(null);
    setUnshieldSuccess(null);
    setMintSuccess(null);
    setZkRecipient("");
    setZkTxSig(null);
    setZkPending(false);
    setZkError("");
    setIsProcessing(false);
    setProcessingLabel("");
  }, [action, tokenSymbol]);

  const isValidCode = validateVaultCode(vaultCode);
  const canSubmitAmount = !!amount && parseFloat(amount) > 0;

  const shieldReady =
    canSubmitAmount &&
    (!shieldNeedsCode || isValidCode) &&
    !vaultLoading;

  const unshieldReady =
    canSubmitAmount &&
    isValidCode &&
    destination.length >= 32 &&
    vaultExists &&
    chainDepth > 0;

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
      queryClient.invalidateQueries({ queryKey: getGetAirsignBalancesQueryKey(publicKey) }),
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

    setProcessingLabel("Confirming on-chain...");
    try {
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction({ signature: txSig, blockhash, lastValidBlockHeight }, "confirmed");
    } catch (confirmErr) {
      const msg = confirmErr instanceof Error ? confirmErr.message : String(confirmErr);
      if (isBlockhashExpired(msg)) {
        // Confirmation tracking expired — check directly if the tx landed
        setProcessingLabel("Verifying on-chain status...");
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
          // Still unknown — could be in-flight; return txSig and let caller decide
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
    setProcessingLabel("Submitting via SignitoRelay...");
    const result = await relayMutation.mutateAsync({
      data: { transaction: Buffer.from(signed.serialize()).toString("base64"), wallet: publicKey ?? undefined },
    });
    const sig = result.signature;
    setProcessingLabel("Confirming on-chain...");
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

  const handleShield = async () => {
    if (!publicKey || !shieldReady) return;
    setOpError("");
    setIsProcessing(true);

    if (shieldNeedsCode) {
      if (!signTransaction || !connection) {
        setOpError("Wallet not ready. Connect Phantom and try again.");
        setIsProcessing(false);
        return;
      }

      try {
        const ownerPk = new PublicKey(publicKey);
        const codeHash = await deriveOtsHash(vaultCode, publicKey);

        // Check on-chain: vault PDA may already exist from a previous tx that
        // succeeded on-chain but failed to save to DB (e.g. blockhash expiry on confirm).
        setProcessingLabel("Checking vault on-chain...");
        const existingOnchain = await fetchVaultState(connection, ownerPk);

        if (existingOnchain) {
          // Vault already exists on-chain — register it in DB then do a gasless deposit.
          // Try to find the sSOL token account owned by this wallet for this mint,
          // so we can recover a correct stokenAccount reference even after a partial failure.
          setProcessingLabel("Recovering vault record...");
          const mintStr = existingOnchain.mintStoken.toBase58();
          let recoveredStokenAccount: string | undefined;
          try {
            const TOKEN_2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
            const ataRes = await connection.getTokenAccountsByOwner(ownerPk, { programId: new PublicKey(TOKEN_2022) });
            for (const { pubkey, account } of ataRes.value) {
              // Token-2022 account: bytes 0-31 = mint
              const mintInAccount = new PublicKey(account.data.slice(0, 32)).toBase58();
              if (mintInAccount === mintStr) {
                recoveredStokenAccount = pubkey.toBase58();
                break;
              }
            }
          } catch {
            // non-fatal: stokenAccount will remain undefined
          }
          await createVaultMutation.mutateAsync({
            data: {
              wallet: publicKey,
              codeHash,
              chainDepth: existingOnchain.chainDepth,
              token: baseToken,
              amount: parseFloat(amount),
              mint: mintStr,
              stokenAccount: recoveredStokenAccount,
              txSig: undefined,
            },
          });

          setProcessingLabel("Preparing gasless deposit...");
          const prepRes = await fetch("/api/vault/prepare-deposit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wallet: publicKey, amount: parseFloat(amount) }),
          });
          if (!prepRes.ok) {
            const e = await prepRes.json().catch(() => ({ error: "Failed to prepare deposit" })) as { error?: string };
            throw new Error(e.error ?? "Failed to prepare deposit");
          }
          const { txBase64 } = await prepRes.json() as { txBase64: string };

          setProcessingLabel("Waiting for Phantom approval...");
          const txSig = await relaySignAndConfirm(txBase64);
          await depositMutation.mutateAsync({ data: { wallet: publicKey, token: baseToken, amount: parseFloat(amount), txSig } });
          await invalidateAll();
          setShieldMintToken(mintStr);
          setShieldOnchainSig(txSig);
          setShieldSuccess(true);
        } else {
          // Fresh vault: build tx server-side (owner is fee payer so Phantom signs correctly)
          setProcessingLabel("Preparing vault creation...");
          const prepRes = await fetch("/api/vault/prepare-init", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wallet: publicKey, codeHash, amount: parseFloat(amount), chainDepth: 32 }),
          });
          if (!prepRes.ok) {
            const e = await prepRes.json().catch(() => ({ error: "Failed to prepare transaction" })) as { error?: string };
            throw new Error(e.error ?? "Failed to prepare transaction");
          }
          const { txBase64, mintStoken, stokenAccount } = await prepRes.json() as {
            txBase64: string;
            mintStoken: string;
            stokenAccount: string;
          };

          // Broadcast directly: owner is fee payer so relay is not needed for signing.
          // skipPreflight=true bypasses simulation which gives false negatives for
          // account-creation transactions that have not yet been created on-chain.
          setProcessingLabel("Waiting for Phantom approval...");
          const txBytes = Buffer.from(txBase64, "base64");
          const vaultInitTx = VersionedTransaction.deserialize(txBytes);
          const signedVaultInitTx = await signTransaction(vaultInitTx);
          setProcessingLabel("Submitting vault creation...");
          const txSig = await sendAndConfirm(signedVaultInitTx.serialize(), true);
          setProcessingLabel("Saving vault record...");
          await createVaultMutation.mutateAsync({
            data: {
              wallet: publicKey,
              codeHash,
              chainDepth: 32,
              token: baseToken,
              amount: parseFloat(amount),
              mint: mintStoken,
              stokenAccount,
              txSig,
            },
          });
          await invalidateAll();
          setShieldMintToken(mintStoken);
          setShieldOnchainSig(txSig);
          setShieldSuccess(true);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setOpError(msg);
      } finally {
        setIsProcessing(false);
        setProcessingLabel("");
      }
    } else {
      if (!signTransaction || !connection) {
        setOpError("Wallet not ready. Connect Phantom and try again.");
        setIsProcessing(false);
        return;
      }
      if (baseToken !== "SOL") {
        setOpError("Only SOL deposits are supported on-chain currently.");
        setIsProcessing(false);
        return;
      }

      try {
        setProcessingLabel("Preparing gasless deposit...");
        const prepRes = await fetch("/api/vault/prepare-deposit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: publicKey, amount: parseFloat(amount) }),
        });
        if (!prepRes.ok) {
          const e = await prepRes.json().catch(() => ({ error: "Failed to prepare deposit" })) as { error?: string };
          throw new Error(e.error ?? "Failed to prepare deposit");
        }
        const { txBase64 } = await prepRes.json() as { txBase64: string };

        setProcessingLabel("Waiting for Phantom approval...");
        const txSig = await relaySignAndConfirm(txBase64);
        await depositMutation.mutateAsync({ data: { wallet: publicKey, token: baseToken, amount: parseFloat(amount), txSig } });
        await invalidateAll();
        setShieldOnchainSig(txSig);
        setShieldSuccess(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setOpError(msg);
      } finally {
        setIsProcessing(false);
        setProcessingLabel("");
      }
    }
  };

  // UNSHIELD handler
  const handleUnshield = async () => {
    if (!publicKey || !unshieldReady) return;
    setOpError("");
    setIsProcessing(true);
    setProcessingLabel("Verifying OTS proof...");
    try {
      const preimage = await deriveOtsPreimage(vaultCode, publicKey, chainDepth, 1);
      const result = await unshieldMutation.mutateAsync({
        data: { wallet: publicKey, amount: parseFloat(amount), destination, preimage, token: baseToken },
      });

      // DB already updated by API at this point: flush UI immediately
      await invalidateAll();

      let txSig: string | null = null;
      const txBase64 = result.txBase64 ?? null;
      if (txBase64 && signTransaction && connection) {
        try {
          setProcessingLabel("Waiting for Phantom approval...");
          txSig = await relaySignAndConfirm(txBase64);
          // Second invalidate after on-chain confirmation for final accuracy
          await invalidateAll();
        } catch {
          // Non-fatal: OTS already verified and recorded, balance already updated
        }
      }

      setUnshieldSuccess({ newDepth: result.newChainDepth, txSig });
    } catch {
      setOpError("Vault code incorrect or OTS verification failed. Check your vault code and try again.");
    } finally {
      setIsProcessing(false);
      setProcessingLabel("");
    }
  };

  // MINT handler: convert sToken to aToken via OTS-verified airsign/prepare (off-chain)
  // On-chain convert_to_airtoken is available once program deploys - builder ready in @workspace/program
  const handleMint = async () => {
    if (!publicKey || !mintReady) return;
    setOpError("");
    setIsProcessing(true);
    setProcessingLabel("Verifying OTS proof...");
    try {
      const preimage = await deriveOtsPreimage(vaultCode, publicKey, chainDepth, 1);

      let txSig: string | null = null;
      if (onchainVault?.mintStoken && signTransaction && connection) {
        try {
          setProcessingLabel("Waiting for Phantom approval...");
          const ownerPk = new PublicKey(publicKey);
          const mintStokenPk = new PublicKey(onchainVault.mintStoken);
          const ownerStokenAtaStr = vault?.stokenAccount;
          if (!ownerStokenAtaStr) throw new Error("sToken account not on record");
          const ownerStokenAtaPk = new PublicKey(ownerStokenAtaStr);
          const mintAtokenKp = Keypair.generate();
          const escrowAtokenKp = Keypair.generate();
          const amountLamports = BigInt(Math.round(parseFloat(amount) * LAMPORTS_PER_SOL));
          const ix = buildConvertToAirtokenIx(
            ownerPk, mintStokenPk, ownerStokenAtaPk,
            mintAtokenKp.publicKey, escrowAtokenKp.publicKey,
            { otsPreimage: hexToUint8Array(preimage), amount: amountLamports }
          );
          const tx = await buildVersionedTx(connection, ownerPk, [ix]);
          tx.sign([mintAtokenKp, escrowAtokenKp]);
          const signed = await signTransaction(tx);
          setProcessingLabel("Broadcasting transaction...");
          txSig = await sendAndConfirm(signed.serialize());
        } catch {
          // Fall through to off-chain path
        }
      }

      setProcessingLabel("Minting aToken...");
      const result = await mintMutation.mutateAsync({
        data: { wallet: publicKey, token: baseToken, amount: parseFloat(amount), preimage, expiryHours: parseInt(expiry) || 24 },
      });
      await invalidateAll();
      setMintSuccess({ aToken: result.aToken, amount: result.amount, nonce: result.nonce, expiresAt: result.expiresAt, newDepth: result.newChainDepth });
      void txSig;
    } catch {
      setOpError("Vault code incorrect or mint failed. Check your vault code and try again.");
    } finally {
      setIsProcessing(false);
      setProcessingLabel("");
    }
  };

  const handleZkTransfer = async () => {
    if (!publicKey || !vaultExists || chainDepth <= 0) return;
    setZkError("");
    setZkPending(true);
    setIsProcessing(true);
    setProcessingLabel("Verifying OTS proof...");
    try {
      const preimage = await deriveOtsPreimage(vaultCode, publicKey, chainDepth, 1);
      setProcessingLabel("Contacting SignitoRelay...");
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
      setProcessingLabel("");
    }
  };

  const handleCreateVoucher = async () => {
    if (!publicKey || !isValidCode || !destination || !canSubmitAmount || !vaultExists || chainDepth <= 0) return;
    setIsProcessing(true);
    setProcessingLabel("Verifying OTS proof...");
    try {
      const preimage = await deriveOtsPreimage(vaultCode, publicKey, chainDepth, 1);

      setProcessingLabel("Minting aToken...");
      const expiryHours = parseInt(expiry) || 24;
      const mintResult = await mintMutation.mutateAsync({
        data: { wallet: publicKey, token: baseToken, amount: parseFloat(amount), preimage, expiryHours },
      });

      const { nonce, depthAtIssue, expiresAt } = mintResult;
      const expiryMs = new Date(expiresAt).getTime();

      // Build 64-byte binary voucher message (128 hex chars)
      // Layout: [0..8] magic "AIRSIGN\0", [8..12] version=1 uint32LE,
      //         [12..20] amount_lamports uint64LE, [20..32] reserved,
      //         [32..40] expiry_ms uint64LE, [40..56] nonce (16 bytes),
      //         [56..64] depthAtIssue uint64LE
      const msgBytes = new Uint8Array(64);
      const view = new DataView(msgBytes.buffer);
      "AIRSIGN".split("").forEach((c, i) => { msgBytes[i] = c.charCodeAt(0); });
      view.setUint32(8, 1, true);
      view.setBigUint64(12, BigInt(Math.round(parseFloat(amount) * LAMPORTS_PER_SOL)), true);
      view.setBigUint64(32, BigInt(expiryMs), true);
      for (let i = 0; i < 16; i++) msgBytes[40 + i] = parseInt(nonce.slice(i * 2, i * 2 + 2), 16);
      view.setBigUint64(56, BigInt(depthAtIssue), true);

      const msgHex = Array.from(msgBytes).map((b) => b.toString(16).padStart(2, "0")).join("");

      setProcessingLabel("Waiting for signature...");
      let sigHex = "00".repeat(64);
      if (signMessage) {
        const sigBytes = await signMessage(msgBytes);
        sigHex = Array.from(sigBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
      }

      setProcessingLabel("Registering voucher...");
      await createVoucherMutation.mutateAsync({
        data: {
          wallet: publicKey,
          nonce,
          recipient: destination,
          voucherMsgHex: msgHex,
          sigHex,
          token: baseToken,
          amount: parseFloat(amount),
          depthAtIssue,
          expiresAt,
        },
      });

      await invalidateAll();

      const basePath = (import.meta.env.BASE_URL as string).replace(/\/$/, "");
      const claimUrl = `${window.location.origin}${basePath}/claim/${nonce}`;
      setVoucherJson(claimUrl);
      setVoucherStep("done");
    } catch (err) {
      setOpError(err instanceof Error ? err.message : "Voucher creation failed. Check vault code.");
    } finally {
      setIsProcessing(false);
      setProcessingLabel("");
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
      href={`https://solscan.io/tx/${sig}`}
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
    unshieldMutation.isPending ||
    mintMutation.isPending;

  return (
    <div className="flex flex-col h-full relative">
      {/* Processing overlay */}
      {isProcessing && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0A]/85 backdrop-blur-[2px] rounded-none">
          <svg
            className="animate-spin mb-4"
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
          >
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="#2A2A2A"
              strokeWidth="3"
            />
            <path
              d="M20 4 A16 16 0 0 1 36 20"
              stroke="#FF6B00"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          {processingLabel && (
            <p className="text-[#FF6B00] text-xs font-['JetBrains_Mono'] tracking-wider">
              {processingLabel}
            </p>
          )}
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
                    Max: {tokenBalance.toFixed(4)} {tokenSymbol}
                  </p>
                </div>

                {shieldNeedsCode && (
                  <div>
                    <Label>Set Vault Code</Label>
                    <input
                      type="password"
                      className="input-field"
                      maxLength={8}
                      placeholder="8 chars (e.g. abcd1234)"
                      value={vaultCode}
                      onChange={(e) => setVaultCode(e.target.value)}
                    />
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
                  {amount} {tokenSymbol} released to destination. OTS depth decremented.
                </p>
                <div className="pt-2 border-t border-green-500/20 space-y-1">
                  <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                    <span className="text-[#888888]">Amount</span>
                    <span className="text-white">{amount} {tokenSymbol}</span>
                  </div>
                  <div className="flex justify-between text-xs font-['JetBrains_Mono']">
                    <span className="text-[#888888]">To</span>
                    <span className="text-white font-['JetBrains_Mono'] text-xs">
                      {destination.slice(0, 8)}...{destination.slice(-6)}
                    </span>
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
                    vaultExists ? "border-[#FF6B00]/30 bg-[#FF6B00]/5" : "border-red-500/30 bg-[#0A0A0A]"
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
                    Max: {tokenBalance.toFixed(4)} {tokenSymbol}
                  </p>
                </div>

                <div>
                  <Label>Destination Address</Label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Solana address"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mt-1.5">
                    Defaults to your wallet. Change to a fresh address to break the on-chain link.
                  </p>
                </div>

                <div>
                  <Label>Vault Code</Label>
                  <input
                    type="password"
                    className="input-field"
                    maxLength={8}
                    placeholder="e.g. AB12cd34"
                    value={vaultCode}
                    onChange={(e) => setVaultCode(e.target.value)}
                  />
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
                  s{baseToken} is NonTransferable (SPL Token-2022), it cannot be sent to
                  another wallet. Unshield burns s{baseToken} and releases {baseToken} to
                  destination. One OTS depth level consumed per unshield.
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
                  SignitoRelay sent {amount} {baseToken} to recipient. Your wallet has no on-chain trace.
                </p>
                <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
                  {amount} {tokenSymbol} deducted from your shielded balance.
                </p>
                <TxLink sig={zkTxSig} label={`${zkTxSig.slice(0, 8)}...${zkTxSig.slice(-6)}`} />
              </div>
            ) : (
              <>
                {publicKey && (
                  <div className={`border rounded p-3 space-y-1 ${vaultExists ? "border-[#FF6B00]/30 bg-[#FF6B00]/5" : "border-red-500/30 bg-[#0A0A0A]"}`}>
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
                    Available: {tokenBalance.toFixed(4)} {tokenSymbol}
                  </p>
                </div>

                <div>
                  <Label>Recipient Address</Label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Fresh Solana address"
                    value={zkRecipient}
                    onChange={(e) => setZkRecipient(e.target.value.trim())}
                  />
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mt-1.5">
                    Use a fresh wallet. On-chain: relay to recipient only.
                  </p>
                </div>

                <div>
                  <Label>Vault Code</Label>
                  <input
                    type="password"
                    className="input-field"
                    maxLength={8}
                    placeholder="e.g. AB12cd34"
                    value={vaultCode}
                    onChange={(e) => setVaultCode(e.target.value)}
                  />
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
                  No transaction from your wallet. SignitoRelay pays the fee and broadcasts.
                  On-chain trace: relay wallet to recipient only.
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
                    <span className="text-[#888888]">Expires</span>
                    <span className="text-white">{new Date(mintSuccess.expiresAt).toLocaleString()}</span>
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
                    vaultExists ? "border-[#FF6B00]/30 bg-[#FF6B00]/5" : "border-red-500/30 bg-[#0A0A0A]"
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
                    Max: {tokenBalance.toFixed(4)} {tokenSymbol}
                  </p>
                </div>

                <div>
                  <Label>Vault Code</Label>
                  <input
                    type="password"
                    className="input-field"
                    maxLength={8}
                    placeholder="e.g. AB12cd34"
                    value={vaultCode}
                    onChange={(e) => setVaultCode(e.target.value)}
                  />
                  {vaultCode.length > 0 && !isValidCode && (
                    <p className="text-[#FF6B00] text-xs font-['JetBrains_Mono'] mt-1">
                      Must be 8 chars: letters and numbers only (a-z, A-Z, 0-9)
                    </p>
                  )}
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mt-1.5">
                    OTS pre-image verified server-side. Consumes one depth level.
                  </p>
                </div>

                <div>
                  <Label>Voucher Expiry (hours)</Label>
                  <input
                    type="number"
                    className="input-field"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    min="1"
                    max="8760"
                  />
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] mt-1.5">
                    aToken expires after this period. Default: 24h.
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
                <div>
                  <Label>Amount</Label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Recipient Address</Label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Recipient Solana address"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Expiry (hours)</Label>
                    <input
                      type="number"
                      className="input-field"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label>Vault Code</Label>
                    <input
                      type="password"
                      className="input-field"
                      maxLength={8}
                      placeholder="8 chars (e.g. abcd1234)"
                      value={vaultCode}
                      onChange={(e) => setVaultCode(e.target.value)}
                    />
                  </div>
                </div>
                <InfoBox>
                  Ed25519 signing is local, no internet required to create a voucher.
                  Share QR code or JSON with the recipient to claim on-chain.
                </InfoBox>
              </>
            ) : (
              <>
                <div className="border border-green-500/40 bg-green-500/5 rounded p-3">
                  <p className="text-green-400 text-xs font-['JetBrains_Mono'] font-bold mb-1">Voucher created</p>
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono']">
                    Share the QR code or link with the recipient. Single-use, expires as set.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-white p-3 rounded">
                    <QRCodeSVG value={voucherJson} size={164} />
                  </div>
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] text-center">
                    Scan QR or share the link below
                  </p>
                </div>
                <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded p-3">
                  <p className="text-[#888888] text-xs font-['JetBrains_Mono'] break-all leading-relaxed">
                    {voucherJson}
                  </p>
                </div>
                <button
                  className="btn-secondary w-full justify-center"
                  onClick={() => navigator.clipboard.writeText(voucherJson)}
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
          <button className="btn-secondary w-full justify-center" onClick={onClose}>
            Close
          </button>
        )}

        {action === "unshield" && !unshieldSuccess && (
          <button
            className="btn-primary w-full justify-center"
            disabled={!unshieldReady || isPending}
            onClick={handleUnshield}
          >
            {isPending
              ? "Verifying OTS..."
              : `Unshield ${amount || "0"} ${tokenSymbol}`}
          </button>
        )}
        {action === "unshield" && unshieldSuccess && (
          <button className="btn-secondary w-full justify-center" onClick={onClose}>
            Close
          </button>
        )}

        {action === "zk-send" && !zkTxSig && (
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
            disabled={!mintReady || isPending}
            onClick={handleMint}
          >
            {isPending
              ? "Minting..."
              : `Mint ${"a" + baseToken} from ${amount || "0"} ${tokenSymbol}`}
          </button>
        )}
        {action === "mint" && mintSuccess && (
          <button className="btn-secondary w-full justify-center" onClick={onClose}>
            Close
          </button>
        )}

        {action === "voucher" && voucherStep === "form" && (
          <button
            className="btn-primary w-full justify-center"
            disabled={
              !canSubmitAmount ||
              !destination ||
              !isValidCode ||
              !vaultExists ||
              chainDepth <= 0 ||
              createVoucherMutation.isPending ||
              mintMutation.isPending
            }
            onClick={handleCreateVoucher}
          >
            {!vaultExists
              ? "No vault, shield first"
              : chainDepth <= 0
                ? "OTS chain exhausted"
                : mintMutation.isPending || createVoucherMutation.isPending
                  ? "Creating..."
                  : `Create ${amount || "0"} ${baseToken} Voucher`}
          </button>
        )}
        {action === "voucher" && voucherStep === "done" && (
          <button
            className="btn-secondary w-full justify-center"
            onClick={() => {
              setVoucherStep("form");
              setVoucherJson("");
              setAmount("");
              setDestination(publicKey ?? "");
              setVaultCode("");
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
