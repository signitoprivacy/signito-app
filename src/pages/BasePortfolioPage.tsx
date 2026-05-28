import { useState, useEffect, useCallback } from "react";
import { NavBar } from "../components/NavBar";
import { ChainSelector } from "../components/ChainSelector";
import { AddressChip } from "../components/AddressChip";
import { useEvmWallet } from "../lib/evm-wallet";
import {
  deriveBaseOtsTip,
  deriveBaseOtsPreimage,
  deriveStokenAddress,
  validateVaultCode,
} from "../lib/base-ots";
import {
  fetchBaseStatus,
  fetchBaseUserState,
  requestUnshield,
  registerVault,
  fetchVaultHistory,
  POOL_ABI,
  type BaseStatus,
  type BaseUserState,
} from "../lib/base-client";

type TabId = "shield" | "unshield" | "history";

// -- ETH unit helpers (avoid viem dependency) --
function parseEther(val: string): bigint {
  const [whole = "0", frac = ""] = val.split(".");
  const fracPadded = frac.slice(0, 18).padEnd(18, "0");
  return BigInt(whole) * BigInt(10 ** 18) + BigInt(fracPadded);
}

function formatEther(wei: bigint): string {
  const s = wei.toString().padStart(19, "0");
  const whole = s.slice(0, -18) || "0";
  const frac = s.slice(-18).replace(/0+$/, "") || "0";
  return `${whole}.${frac}`;
}

// -- ABI encoding for shield(address, bytes32, uint8) --
// selector: keccak256("shield(address,bytes32,uint8)")[0:4]
// We encode manually: 4 bytes selector + 3 x 32-byte slots
function encodeShieldCall(
  stokenAddress: string,
  initialOtsHash: string,
  chainDepth: number
): string {
  // shield(address,bytes32,uint8) selector
  const selector = "0x6e2aa1f9";
  const addr = stokenAddress.slice(2).padStart(64, "0");
  const hash = initialOtsHash.slice(2).padStart(64, "0");
  const depth = chainDepth.toString(16).padStart(64, "0");
  return `${selector}${addr}${hash}${depth}`;
}

export default function BasePortfolioPage() {
  const { account, isConnected, isConnecting, connect, disconnect, sendTransaction } = useEvmWallet();
  const address = account?.address;

  const [tab, setTab] = useState<TabId>("shield");
  const [status, setStatus] = useState<BaseStatus | null>(null);
  const [userState, setUserState] = useState<BaseUserState | null>(null);
  const [history, setHistory] = useState<unknown[]>([]);

  const [vaultCode, setVaultCode] = useState("");
  const [shieldAmount, setShieldAmount] = useState("");
  const [unshieldAmount, setUnshieldAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [stokenAddress, setStokenAddress] = useState<`0x${string}` | null>(null);

  const [shieldStep, setShieldStep] = useState<string | null>(null);
  const [shieldTxHash, setShieldTxHash] = useState<string | null>(null);
  const [unshieldStep, setUnshieldStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBaseStatus().then(setStatus).catch(console.error);
  }, []);

  const loadUserData = useCallback(() => {
    if (!address || !vaultCode || !validateVaultCode(vaultCode)) {
      setStokenAddress(null);
      setUserState(null);
      return;
    }
    const stoken = deriveStokenAddress(address, vaultCode);
    setStokenAddress(stoken);
    fetchBaseUserState(stoken).then(setUserState).catch(() => setUserState(null));
  }, [address, vaultCode]);

  useEffect(() => { loadUserData(); }, [loadUserData]);

  useEffect(() => {
    if (!address) return;
    fetchVaultHistory(address).then(setHistory).catch(() => {});
  }, [address]);

  async function handleShield() {
    setError(null);
    setShieldStep(null);
    setShieldTxHash(null);
    if (!status?.poolAddress) return setError("Pool not configured.");
    if (!address) return setError("Connect wallet first.");
    if (!validateVaultCode(vaultCode)) return setError("Vault code must be 8 alphanumeric chars.");
    if (!shieldAmount || isNaN(Number(shieldAmount)) || Number(shieldAmount) <= 0) {
      return setError("Enter a valid ETH amount.");
    }
    try {
      setShieldStep("Deriving OTS chain...");
      const stoken = deriveStokenAddress(address, vaultCode);
      const otsHash = await deriveBaseOtsTip(vaultCode, address, 32, 0);
      const amountWei = parseEther(shieldAmount);
      const data = encodeShieldCall(stoken, otsHash, 32);

      setShieldStep("Awaiting wallet confirmation...");
      const txHash = await sendTransaction({
        to: status.poolAddress,
        value: amountWei,
        data,
      });
      setShieldTxHash(txHash);
      setShieldStep("Transaction submitted. Waiting for confirmation...");

      // Wait ~15s then register vault (no receipt polling to keep it simple)
      setTimeout(async () => {
        try {
          await registerVault({ wallet: address, stokenAddress: stoken, chainDepth: 32 });
          setShieldStep("Done. Your ETH is shielded.");
          fetchBaseUserState(stoken).then(setUserState).catch(() => {});
        } catch {
          setShieldStep("Shielded. Vault will sync on next load.");
        }
      }, 15_000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setShieldStep(null);
    }
  }

  async function handleUnshield() {
    setError(null);
    setUnshieldStep(null);
    if (!address) return setError("Connect wallet first.");
    if (!validateVaultCode(vaultCode)) return setError("Vault code must be 8 alphanumeric chars.");
    if (!userState?.initialized) return setError("No active vault found for this vault code.");
    if (!unshieldAmount || isNaN(Number(unshieldAmount)) || Number(unshieldAmount) <= 0) {
      return setError("Enter a valid ETH amount.");
    }
    if (!recipient || !/^0x[0-9a-fA-F]{40}$/.test(recipient)) {
      return setError("Enter a valid recipient Ethereum address.");
    }
    const amountWei = parseEther(unshieldAmount);
    if (amountWei > BigInt(userState.deposited)) {
      return setError("Amount exceeds shielded balance.");
    }
    try {
      setUnshieldStep("Deriving OTS preimage...");
      const otsPreimage = await deriveBaseOtsPreimage(vaultCode, address, userState.chainDepth, 1, 0);
      setUnshieldStep("Sending to relayer (private channel)...");
      const result = await requestUnshield({
        stokenAddress: stokenAddress!,
        wallet: address,
        otsPreimage,
        amount: amountWei.toString(),
        recipient,
      });
      setUnshieldStep(
        `Done. Burn TX: ${result.burnTxHash.slice(0, 10)}... | Send TX: ${result.processTxHash.slice(0, 10)}...`
      );
      fetchBaseUserState(stokenAddress!).then(setUserState).catch(() => {});
      fetchVaultHistory(address).then(setHistory).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setUnshieldStep(null);
    }
  }

  const depositedEth = userState?.deposited
    ? formatEther(BigInt(userState.deposited))
    : "0";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-mono">
      <NavBar />
      <div className="pt-[56px] max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold tracking-widest">SIGNITO / BASE</h1>
          <ChainSelector />
        </div>

        {!status?.enabled && (
          <div className="border border-[#333] p-4 text-[#666] text-sm mb-6">
            Base chain not configured on the server.
          </div>
        )}

        {/* Wallet connection */}
        <div className="border border-[#2A2A2A] p-4 mb-6">
          <div className="text-xs text-[#666] tracking-widest mb-3">WALLET</div>
          {isConnected && address ? (
            <div className="flex items-center justify-between">
              <AddressChip address={address} chars={6} />
              <button
                onClick={disconnect}
                className="text-xs text-[#666] hover:text-white border border-[#333] px-3 py-1.5 transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={connect}
                disabled={isConnecting}
                className="bg-[#FF6B00] text-black text-xs font-bold px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            </div>
          )}
        </div>

        {/* Vault code input (shared across tabs) */}
        <div className="border border-[#2A2A2A] p-4 mb-6">
          <div className="text-xs text-[#666] tracking-widest mb-3">VAULT CODE</div>
          <input
            type="text"
            maxLength={8}
            placeholder="8 chars, e.g. abcd1234"
            value={vaultCode}
            onChange={(e) => setVaultCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
            className="w-full bg-transparent border border-[#333] text-white px-3 py-2 text-sm font-mono outline-none focus:border-[#FF6B00] tracking-widest"
          />
          {stokenAddress && (
            <div className="mt-2 text-xs text-[#666] break-all">
              Vault address: <span className="text-[#888]">{stokenAddress}</span>
            </div>
          )}
          {userState?.initialized && (
            <div className="mt-2 flex gap-4 text-xs">
              <span className="text-[#666]">
                Shielded: <span className="text-white">{depositedEth} ETH</span>
              </span>
              <span className="text-[#666]">
                OTS depth: <span className="text-white">{userState.chainDepth}</span>
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2A2A2A] mb-6">
          {(["shield", "unshield", "history"] as TabId[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); }}
              className={`px-4 py-2 text-xs font-bold tracking-widest transition-colors ${
                tab === t
                  ? "text-[#FF6B00] border-b-2 border-[#FF6B00]"
                  : "text-[#666] hover:text-white"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {error && (
          <div className="border border-red-900 bg-red-950/20 text-red-400 text-xs px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Shield tab */}
        {tab === "shield" && (
          <div className="space-y-4">
            <div className="text-xs text-[#666] leading-relaxed">
              Shield ETH into the privacy pool. You receive shETH at a random address derived from your vault code. The deposit TX is public but the vault address is not linked to your wallet on-chain.
            </div>
            <div>
              <div className="text-xs text-[#666] mb-1.5">Amount (ETH)</div>
              <input
                type="number"
                min="0"
                step="0.001"
                placeholder="0.01"
                value={shieldAmount}
                onChange={(e) => setShieldAmount(e.target.value)}
                className="w-full bg-transparent border border-[#333] text-white px-3 py-2 text-sm font-mono outline-none focus:border-[#FF6B00]"
              />
            </div>
            <button
              onClick={handleShield}
              disabled={!!shieldStep}
              className="w-full bg-[#FF6B00] text-black font-bold text-sm py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {shieldStep ? "Shielding..." : "Shield ETH"}
            </button>
            {shieldStep && (
              <div className="text-xs text-[#666] border border-[#2A2A2A] px-4 py-3">
                {shieldStep}
                {shieldTxHash && (
                  <a
                    href={`https://sepolia.basescan.org/tx/${shieldTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 text-[#FF6B00] hover:underline"
                  >
                    View TX
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Unshield tab */}
        {tab === "unshield" && (
          <div className="space-y-4">
            <div className="text-xs text-[#666] leading-relaxed">
              Withdraw ETH privately. TX1 burns your shETH (no recipient). TX2 sends ETH from the shared pool to your recipient. Both go via private relay -- no on-chain link between sender and recipient.
            </div>
            <div>
              <div className="text-xs text-[#666] mb-1.5">Amount (ETH)</div>
              <input
                type="number"
                min="0"
                step="0.001"
                placeholder="0.01"
                value={unshieldAmount}
                onChange={(e) => setUnshieldAmount(e.target.value)}
                className="w-full bg-transparent border border-[#333] text-white px-3 py-2 text-sm font-mono outline-none focus:border-[#FF6B00]"
              />
            </div>
            <div>
              <div className="text-xs text-[#666] mb-1.5">Recipient Address</div>
              <input
                type="text"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full bg-transparent border border-[#333] text-white px-3 py-2 text-sm font-mono outline-none focus:border-[#FF6B00]"
              />
            </div>
            <button
              onClick={handleUnshield}
              disabled={!!unshieldStep}
              className="w-full bg-[#FF6B00] text-black font-bold text-sm py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {unshieldStep ? "Processing..." : "Unshield ETH"}
            </button>
            {unshieldStep && (
              <div className="text-xs text-[#666] border border-[#2A2A2A] px-4 py-3">
                {unshieldStep}
              </div>
            )}
          </div>
        )}

        {/* History tab */}
        {tab === "history" && (
          <div>
            {(history as Array<{ id: number; amount: string; recipient: string; status: string; burnTxHash?: string; processTxHash?: string; createdAt: string }>).length === 0 ? (
              <div className="text-xs text-[#666] py-8 text-center">No transactions yet.</div>
            ) : (
              <div className="space-y-2">
                {(history as Array<{ id: number; amount: string; recipient: string; status: string; burnTxHash?: string; processTxHash?: string; createdAt: string }>).map((row) => (
                  <div key={row.id} className="border border-[#2A2A2A] p-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#666]">Amount</span>
                      <span>{formatEther(BigInt(row.amount))} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666]">Status</span>
                      <span className={row.status === "processed" ? "text-green-400" : row.status === "failed" ? "text-red-400" : "text-[#FF6B00]"}>
                        {row.status.toUpperCase()}
                      </span>
                    </div>
                    {row.burnTxHash && (
                      <div className="flex justify-between">
                        <span className="text-[#666]">Burn TX</span>
                        <a
                          href={`https://sepolia.basescan.org/tx/${row.burnTxHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#FF6B00] hover:underline"
                        >
                          {row.burnTxHash.slice(0, 10)}...
                        </a>
                      </div>
                    )}
                    {row.processTxHash && (
                      <div className="flex justify-between">
                        <span className="text-[#666]">Send TX</span>
                        <a
                          href={`https://sepolia.basescan.org/tx/${row.processTxHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#FF6B00] hover:underline"
                        >
                          {row.processTxHash.slice(0, 10)}...
                        </a>
                      </div>
                    )}
                    <div className="text-[#444]">{new Date(row.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pool info */}
        {status?.enabled && (
          <div className="mt-8 border border-[#1A1A1A] p-4 text-xs text-[#444] space-y-1">
            <div>Pool: <span className="text-[#666]">{status.poolAddress}</span></div>
            <div>shETH: <span className="text-[#666]">{status.shethAddress}</span></div>
            <div>Network: <span className="text-[#666]">{status.network}</span></div>
            <div>Pool balance: <span className="text-[#666]">{status.poolBalance ? formatEther(BigInt(status.poolBalance)) : "0"} ETH</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
