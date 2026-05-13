# signito-app

Signito Shield — non-custodial transaction privacy dApp on Solana.

Built with **React 18 + Vite**, connected to the Signito Vault on-chain program.  
All signing is done via Phantom wallet. RPC calls are proxied server-side — the Helius API key is never exposed to the browser.

---

## Features

| Feature | Description |
|---|---|
| **SafeVault** | Shield SOL into a non-custodial vault. Withdraw anytime using your vault code — no private keys stored anywhere. |
| **StealthSend** | Send SOL to a fresh address with no on-chain link between sender and recipient. |
| **AirSign** | Issue offline Ed25519 vouchers, shareable via QR or link. Recipient claims without internet. |

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing — product overview, stats |
| `/app` | Dashboard — wallet overview, shielded balances |
| `/app/vault` | SafeVault — shield and unshield SOL |
| `/app/stealth` | StealthSend — anonymous deposit and withdrawal |
| `/app/airsign` | AirSign — create offline vouchers |
| `/app/airsign/:nonce` | Voucher status and claim tracking |
| `/app/claim/:nonce` | Recipient claim page |
| `/app/history` | Full transaction history |
| `/app/portfolio` | On-chain token balances |
| `/app/status` | API and RPC health checks |
| `/app/learn/*` | Protocol education articles |

---

## Project Structure

```
signito-app/
  src/
    pages/          Route-level page components
    components/     Shared UI components (NavBar, Sidebar, etc.)
    lib/
      ots.ts        PBKDF2 + SHA-256 OTS chain derivation (client-side)
      wallet.tsx    Phantom wallet connection
    index.css       Global styles (Tailwind CSS v4)
  public/           Static assets (logo, token images, OG image)
  lib/
    api-client-react/   Generated React Query hooks (@workspace/api-client-react)
```

---

## Tech Stack

| Package | Role |
|---|---|
| React 18 + Vite | UI framework and build tool |
| Tailwind CSS v4 | Styling |
| TanStack React Query | Data fetching and caching |
| Wouter | Client-side routing |
| @solana/web3.js | Solana RPC and transaction building |
| @solana/wallet-adapter | Phantom wallet connection |

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env
# VITE_API_URL=http://localhost:8080

# Run dev server
pnpm dev
```

## Build for Production

```bash
pnpm build
# Output: dist/
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | URL of the signito-api server |

---

## License

MIT
