# signito-app

Signito Shield — non-custodial transaction privacy dApp on Solana.

**Live:** [app.signito.org](https://app.signito.org)  
**Docs:** [docs.signito.org](https://docs.signito.org)  
**Program ID:** `9PibgJMUa3zXVd7YWJEJ8UQ14A7z2J3qZ7QDvRW38XeD`

Built with **React 18 + Vite**. All signing done via Phantom wallet. RPC calls proxied server-side — the Helius API key is never exposed to the browser.

---

## Features

| Feature | Description |
|---|---|
| **SafeVault** | Shield SOL into a non-custodial vault using a passphrase. Withdraw anytime with your vault code — nothing stored server-side. |
| **StealthSend** | Send SOL to a fresh address with no on-chain link between sender and recipient. |
| **AirSign** | Issue offline Ed25519 vouchers shareable via QR or link. Recipient claims without internet at issuance time. |

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
      ots.ts        PBKDF2 + SHA-256 OTS chain derivation (client-side only)
      wallet.tsx    Phantom wallet connection
    index.css       Global styles (Tailwind CSS v4)
  public/           Static assets (logo, token images, OG image)
  lib/
    api-client-react/   Generated React Query hooks
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
pnpm install

# Set environment variables
echo "VITE_API_URL=https://api.signito.org" > .env

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
| `VITE_API_URL` | URL of the signito-api server (e.g. `https://api.signito.org`) |

---

## Related Repositories

| Repo | Description |
|---|---|
| [signito-programs](https://github.com/signitoprivacy/signito-programs) | On-chain Anchor/Rust program |
| [signito-api](https://github.com/signitoprivacy/signito-api) | Backend API server |
| [signito-docs](https://github.com/signitoprivacy/signito-docs) | Protocol documentation |

---

## License

MIT
