// OTS Protocol: PBKDF2 hash chain
//
// Vault code format: exactly 8 chars, letters and numbers only (a-z, A-Z, 0-9)
// Any combination allowed: all letters, all digits, mixed, doubles, etc.
// Examples: "aaaaaaaa", "12345678", "abcd1234", "ABCD1234"
//
// Chain derivation (deterministic, device-independent):
//   H0  = PBKDF2(vaultCode, salt, 100_000 iters, SHA-256)
//   H1  = SHA-256(H0)
//   H2  = SHA-256(H1)
//   ...
//   H32 = SHA-256(H31)   <-- chain tip, stored in vault PDA on-chain
//
// Salt for generation 0: walletAddress
// Salt for generation N: walletAddress + ":gen:" + N
// This allows refreshing the OTS chain from the same vault code.
//
// First withdrawal:  reveal H31 (pre-image of H32)
//                    program checks SHA-256(H31) == H32, tip becomes H31
// Second withdrawal: reveal H30, program checks SHA-256(H30) == H31
// ...continues until depth reaches 0 (chain exhausted, refresh to continue)
//
// Regeneration: any device, any browser restart --
//   same vault code + same wallet address + same generation = same H0 = same full chain.

export function validateVaultCode(code: string): boolean {
  if (!code || code.length !== 8) return false;
  return /^[a-zA-Z0-9]{8}$/.test(code);
}

function hexToBytes(hex: string): Uint8Array {
  const pairs = hex.match(/.{2}/g) ?? [];
  return new Uint8Array(pairs.map((b) => parseInt(b, 16)));
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function uint8ToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// One SHA-256 round: hex in, hex out
async function sha256Hex(hexInput: string): Promise<string> {
  const bytes = hexToBytes(hexInput);
  const buf = await crypto.subtle.digest("SHA-256", bytes.buffer as ArrayBuffer);
  return bytesToHex(buf);
}

// Build PBKDF2 salt from wallet and generation.
// Generation 0 uses bare wallet address for backward compatibility.
function buildSalt(wallet: string, generation: number): string {
  return generation === 0 ? wallet : `${wallet}:gen:${generation}`;
}

// Derives the chain tip H_chainDepth for the given generation.
// This is what gets stored in the vault PDA on-chain.
// H0 = PBKDF2(vaultCode, salt, 100_000), then H_n = SHA-256(H_{n-1}).
export async function deriveOtsTip(
  vaultCode: string,
  wallet: string,
  chainDepth = 32,
  generation = 0
): Promise<string> {
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

  let current = bytesToHex(derivedBits);

  for (let i = 0; i < chainDepth; i++) {
    current = await sha256Hex(current);
  }

  return current;
}

// Returns the pre-image to reveal for the nth withdrawal (step is 1-indexed).
// step=1: reveals H_{chainDepth - 1} (e.g. H31 when depth=32)
// step=2: reveals H_{chainDepth - 2} (e.g. H30)
// The Solana program verifies SHA-256(revealed) == current tip, then updates tip.
export async function deriveOtsPreimage(
  vaultCode: string,
  wallet: string,
  chainDepth: number,
  step: number,
  generation = 0
): Promise<string> {
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

  let current = bytesToHex(derivedBits);
  const targetDepth = chainDepth - step;
  for (let i = 0; i < targetDepth; i++) {
    current = await sha256Hex(current);
  }

  return current;
}

// Scan generations 0..maxGen to find which one matches the on-chain OTS hash.
// Returns { generation, chainDepth } if found, null otherwise.
// onProgress is called with the current generation being checked (0-indexed).
export async function syncOtsGeneration(
  vaultCode: string,
  wallet: string,
  onChainHash: Uint8Array,
  chainDepth: number,
  maxGen = 9,
  onProgress?: (gen: number) => void
): Promise<{ generation: number; chainDepth: number } | null> {
  const targetHex = uint8ToHex(onChainHash);
  for (let gen = 0; gen <= maxGen; gen++) {
    if (onProgress) onProgress(gen);
    const tip = await deriveOtsTip(vaultCode, wallet, chainDepth, gen);
    if (tip === targetHex) {
      return { generation: gen, chainDepth };
    }
  }
  return null;
}

// Alias kept for compatibility with existing imports
export const deriveOtsHash = deriveOtsTip;
