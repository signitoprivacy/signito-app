// OTS Protocol for Base (EVM) chain.
//
// Uses keccak256 instead of SHA-256 for the hash chain -- native EVM opcode,
// cheaper gas than the SHA-256 precompile.
// PBKDF2 base derivation is identical to the Solana chain.
//
// H0  = PBKDF2(vaultCode, salt, 100_000 iters, SHA-256)  [browser WebCrypto]
// H_n = keccak256(H_{n-1})                                [n >= 1]
// chain tip = H_chainDepth, stored on-chain as bytes32
//
// To authorize an unshield step:
//   reveal H_{chainDepth - step}
//   contract verifies: keccak256(preimage) == currentOtsHash
//   contract advances: currentOtsHash = preimage, chainDepth -= 1

import { keccak_256 } from "@noble/hashes/sha3";

export function validateVaultCode(code: string): boolean {
  if (!code || code.length !== 8) return false;
  return /^[a-zA-Z0-9]{8}$/.test(code);
}

function buildSalt(wallet: string, generation: number): string {
  return generation === 0 ? wallet : `${wallet}:gen:${generation}`;
}

function keccak256Bytes(input: Uint8Array): Uint8Array {
  return keccak_256(input);
}

async function deriveH0(vaultCode: string, wallet: string, generation: number): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(vaultCode),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(buildSalt(wallet, generation)),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return new Uint8Array(derivedBits);
}

function bytesToHex(bytes: Uint8Array): `0x${string}` {
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}` as `0x${string}`;
}

// Derive chain tip H_chainDepth -- this is what gets stored on-chain.
export async function deriveBaseOtsTip(
  vaultCode: string,
  wallet: string,
  chainDepth = 32,
  generation = 0
): Promise<`0x${string}`> {
  let current = await deriveH0(vaultCode, wallet, generation);
  for (let i = 0; i < chainDepth; i++) {
    current = keccak256Bytes(current);
  }
  return bytesToHex(current);
}

// Derive the preimage to submit for the nth unshield (step is 1-indexed).
// step=1: reveal H_{chainDepth-1}, step=2: reveal H_{chainDepth-2}, etc.
export async function deriveBaseOtsPreimage(
  vaultCode: string,
  wallet: string,
  chainDepth: number,
  step: number,
  generation = 0
): Promise<`0x${string}`> {
  let current = await deriveH0(vaultCode, wallet, generation);
  const targetDepth = chainDepth - step;
  for (let i = 0; i < targetDepth; i++) {
    current = keccak256Bytes(current);
  }
  return bytesToHex(current);
}

// Derive stokenAddress deterministically from wallet + vaultCode.
// This is a random-looking Ethereum address that is not the user's wallet.
// The same wallet + vaultCode always produces the same stokenAddress (recoverable).
export function deriveStokenAddress(wallet: string, vaultCode: string): `0x${string}` {
  const encoder = new TextEncoder();
  const input = encoder.encode(`${wallet}:${vaultCode}:stoken`);
  const hash = keccak_256(input);
  const hex = bytesToHex(hash);
  return `0x${hex.slice(26)}` as `0x${string}`;
}

// Scan generations to find which matches the on-chain OTS hash.
export async function syncBaseOtsGeneration(
  vaultCode: string,
  wallet: string,
  onChainHash: `0x${string}`,
  chainDepth: number,
  maxGen = 9,
  onProgress?: (gen: number) => void
): Promise<{ generation: number; chainDepth: number } | null> {
  for (let gen = 0; gen <= maxGen; gen++) {
    if (onProgress) onProgress(gen);
    const tip = await deriveBaseOtsTip(vaultCode, wallet, chainDepth, gen);
    if (tip.toLowerCase() === onChainHash.toLowerCase()) {
      return { generation: gen, chainDepth };
    }
  }
  return null;
}
