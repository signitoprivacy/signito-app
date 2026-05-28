// Base chain contract interaction helpers.
// Shield TX is built here and submitted by the user via MetaMask (wagmi writeContract).
// Unshield is handled server-side (POST /api/base/vault/unshield).

const BASE_PATH = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const POOL_ABI = [
  {
    name: "shield",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "stokenAddress", type: "address" },
      { name: "initialOtsHash", type: "bytes32" },
      { name: "chainDepth", type: "uint8" },
    ],
    outputs: [],
  },
  {
    name: "getUserState",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "stokenAddress", type: "address" }],
    outputs: [
      { name: "currentOtsHash", type: "bytes32" },
      { name: "chainDepth", type: "uint8" },
      { name: "deposited", type: "uint256" },
      { name: "initialized", type: "bool" },
    ],
  },
] as const;

export { POOL_ABI };

export interface BaseStatus {
  enabled: boolean;
  poolAddress?: string;
  shethAddress?: string;
  relayerAddress?: string;
  poolBalance?: string;
  shethTotalSupply?: string;
  network?: string;
}

export async function fetchBaseStatus(): Promise<BaseStatus> {
  const r = await fetch(`${BASE_PATH}/api/base/status`);
  return r.json() as Promise<BaseStatus>;
}

export interface BaseUserState {
  currentOtsHash: `0x${string}`;
  chainDepth: number;
  deposited: string;
  initialized: boolean;
}

export async function fetchBaseUserState(stokenAddress: string): Promise<BaseUserState> {
  const r = await fetch(`${BASE_PATH}/api/base/vault/state/${stokenAddress}`);
  if (!r.ok) throw new Error(`getUserState failed: ${r.status}`);
  return r.json() as Promise<BaseUserState>;
}

export async function registerVault(params: {
  wallet: string;
  stokenAddress: string;
  chainDepth?: number;
  generation?: number;
  lastOtsHash?: string;
}): Promise<void> {
  await fetch(`${BASE_PATH}/api/base/vault/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export interface UnshieldParams {
  stokenAddress: string;
  wallet: string;
  otsPreimage: `0x${string}`;
  amount: string;
  recipient: string;
}

export interface UnshieldResult {
  burnTxHash: string;
  processTxHash: string;
}

export async function requestUnshield(params: UnshieldParams): Promise<UnshieldResult> {
  const r = await fetch(`${BASE_PATH}/api/base/vault/unshield`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error((err as { error: string }).error ?? "unshield failed");
  }
  return r.json() as Promise<UnshieldResult>;
}

export async function fetchVaultHistory(wallet: string) {
  const r = await fetch(`${BASE_PATH}/api/base/vault/history/${wallet}`);
  if (!r.ok) return [];
  return r.json();
}
