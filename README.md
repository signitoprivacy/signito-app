# signito-app

**Website:** [signito.org](https://signito.org)

Signito Shield -- non-custodial transaction privacy dApp on Solana and Base chain.

**Solana Program:** `HyciDEYB9hXdmmLMexTHv2QYDaJmuZr1AF7sipBbVLLH` (mainnet, OtterSec verified)
**Base Sepolia Pool:** `0x8C7Eeb11C7c8D58b0d12A772B146313aaAAEaBdb`

Built with React 18 + Vite + Tailwind CSS v4. Solana signing via Phantom. Base chain via MetaMask (window.ethereum). All RPC calls proxied server-side.

---

## Features

| Feature | Description |
|---|---|
| **SafeVault** | Shield SOL/ETH using a vault code. OTS hash-chain withdrawal. |
| **StealthSend** | Deposit into shared privacy pool, withdraw to fresh address |
| **AirSign** | Offline ECDSA voucher signing and QR delivery |
| **Chain Selector** | Switch between Solana and Base chain |
| **Decoy Mix** | 20 phantom accounts burn alongside every real unshield |

## Stack

- React 18, Vite, TypeScript 5.9
- Tailwind CSS v4 (@tailwindcss/vite)
- wouter routing
- @tanstack/react-query
- viem (Base chain)
- @reown/appkit (WalletConnect)

## Key Files

| Path | Description |
|---|---|
| `src/lib/base-ots.ts` | Base chain OTS derivation (keccak256 chain) |
| `src/lib/base-client.ts` | Base chain API client |
| `src/lib/evm-wallet.tsx` | MetaMask wallet context (no wagmi) |
| `src/lib/ots.ts` | Solana OTS derivation (PBKDF2 + keccak256) |
| `src/lib/wallet.tsx` | Solana wallet context |
| `src/pages/BasePortfolioPage.tsx` | Base chain vault UI |
| `src/components/ChainSelector.tsx` | Solana/Base toggle |
