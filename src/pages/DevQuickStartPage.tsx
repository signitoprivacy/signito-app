import React from "react";
import { LandingNavBar } from "../components/LandingNavBar";
import { Footer } from "../components/Footer";
import { MountainDivider } from "../components/MountainDivider";
import sketchWallet from "../assets/sketch-step01-wallet.jpg";


export default function DevQuickStartPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <LandingNavBar />
      <div>

        {/* Hero - dark */}
        <div className="border-b border-[#2A2A2A] relative overflow-hidden min-h-screen flex flex-col">
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #2A2A2A 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
          <div className="max-w-[3200px] mx-auto px-8 md:px-16 pt-[20vh] pb-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10 w-full">
            <div>
              <div className="inline-block font-['JetBrains_Mono'] text-[#FF6B00] text-xs tracking-[0.2em] uppercase border border-[#FF6B00]/30 px-3 py-1 mb-8">Developers</div>
              <h1 className="font-['Space_Grotesk'] text-5xl md:text-7xl font-bold mb-6 leading-tight">Quick Start</h1>
              <p className="text-[#888888] font-['Inter'] text-lg max-w-xl leading-relaxed mb-6">
                Get up and running with Signito in under ten minutes. Connect a wallet, deposit into a Shielded Vault, run a StealthSend, and integrate the relay into your own backend.
              </p>
              <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed">
                No SDK required. Signito exposes a plain REST API defined by an OpenAPI spec. Any HTTP client works.
              </p>
            </div>
            <div className="hidden md:block border border-[#1A1A1A] overflow-hidden">
              <img src={sketchWallet} alt="Wallet integration flow" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Post-hero white content */}
        <div className="relative z-10 bg-white text-[#0A0A0A]">
          <MountainDivider />

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-4">Prerequisites</h2>
              <p className="text-[#888888] font-['Inter'] text-sm mb-12 max-w-2xl">You need three things before your first API call.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#E0E0E0]">
                {[
                  { num: "01", title: "A Solana wallet", body: "Any wallet that can sign transactions works. Signito never takes custody of your keys. The wallet is only used to authorize deposits and withdrawals from your own vault." },
                  { num: "02", title: "SOL for fees", body: "Solana transactions require a small amount of SOL to pay network gas. For relay-submitted operations (StealthSend, AirSign), the relay covers gas. A 0.15% protocol fee is deducted from each withdrawal on-chain." },
                  { num: "03", title: "The API base URL", body: "All Signito endpoints live under /api. In development, run the API server locally. In production, use the published domain. No API key is required for public read endpoints." },
                ].map((item, i) => (
                  <div key={item.num} className={`p-10 ${i < 2 ? "border-r border-[#E0E0E0]" : ""}`}>
                    <div className="font-['JetBrains_Mono'] text-[#FF6B00] text-sm mb-4">{item.num}</div>
                    <h3 className="font-['Space_Grotesk'] font-bold text-[#0A0A0A] text-xl mb-4">{item.title}</h3>
                    <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-4">Step-by-step: your first vault</h2>
              <p className="text-[#888888] font-['Inter'] text-sm mb-12 max-w-2xl">Create a vault, deposit tokens, and withdraw using an OTS code. Five API calls total.</p>
              <div className="space-y-0 border border-[#E0E0E0] font-['JetBrains_Mono'] text-sm divide-y divide-[#E0E0E0]">
                {[
                  {
                    step: "1",
                    label: "POST /api/vault/create",
                    desc: "Create a new vault. Send your wallet address and a PBKDF2-derived vault code hash. The server stores the commitment and returns a vault ID.",
                    body: `{ "owner": "YOUR_WALLET_PUBKEY", "codeHash": "pbkdf2_derived_hex" }`,
                  },
                  {
                    step: "2",
                    label: "POST /api/vault/deposit",
                    desc: "Deposit SPL tokens into the vault. Sign a deposit instruction with your wallet. The server verifies the signature and credits the vault balance.",
                    body: `{ "vaultId": "vault_abc123", "amount": 1000000, "token": "sSOL" }`,
                  },
                  {
                    step: "3",
                    label: "GET /api/vault/:id/ots",
                    desc: "Request the next OTS (one-time sequence) code for withdrawal authorization. Each code is consumed once and cannot be reused.",
                    body: `Response: { "ots": "ots_7f3a...", "index": 0 }`,
                  },
                  {
                    step: "4",
                    label: "POST /api/vault/withdraw",
                    desc: "Submit a withdrawal with the OTS code. The server verifies the code against the stored hash chain and releases funds to the recipient address.",
                    body: `{ "vaultId": "vault_abc123", "ots": "ots_7f3a...", "recipient": "RECIPIENT_PUBKEY" }`,
                  },
                  {
                    step: "5",
                    label: "GET /api/vault/:id/status",
                    desc: "Check vault balance, remaining OTS codes, and transaction history. Use this to confirm the withdrawal succeeded.",
                    body: `Response: { "balance": 0, "otsRemaining": 9, "status": "active" }`,
                  },
                ].map((item) => (
                  <div key={item.step} className="px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-[#FF6B00] mr-3">{item.step}.</span>
                      <span className="text-[#0A0A0A] font-bold">{item.label}</span>
                    </div>
                    <div className="text-[#555555] font-['Inter'] text-xs leading-relaxed">{item.desc}</div>
                    <div className="text-[#888888] text-xs bg-[#F8F8F8] px-3 py-2 border border-[#E0E0E0] break-all">{item.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-4">Environment setup</h2>
              <p className="text-[#888888] font-['Inter'] text-sm mb-12 max-w-2xl">Run the full stack locally in under two minutes.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h3 className="font-['Space_Grotesk'] font-bold text-xl mb-6">Clone and install</h3>
                  <div className="bg-[#0A0A0A] text-white font-['JetBrains_Mono'] text-xs p-6 space-y-2">
                    <div><span className="text-[#888888]"># clone the repo</span></div>
                    <div>git clone https://github.com/signito/signito</div>
                    <div className="mt-3">cd signito</div>
                    <div>pnpm install</div>
                    <div className="mt-3"><span className="text-[#888888]"># copy env vars</span></div>
                    <div>cp .env.example .env</div>
                    <div className="mt-3"><span className="text-[#888888]"># start the API server</span></div>
                    <div>pnpm --filter @workspace/api-server run dev</div>
                    <div className="mt-3"><span className="text-[#888888]"># start the frontend</span></div>
                    <div>pnpm --filter @workspace/shield-app run dev</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-['Space_Grotesk'] font-bold text-xl mb-6">Required environment variables</h3>
                  <div className="border border-[#E0E0E0] font-['JetBrains_Mono'] text-xs divide-y divide-[#E0E0E0]">
                    {[
                      ["DATABASE_URL", "PostgreSQL connection string"],
                      ["SESSION_SECRET", "Express session secret, any random string"],
                      ["HELIUS_API_KEY", "Helius RPC key for Solana access"],
                      ["PORT", "Auto-assigned per artifact by the platform"],
                      ["BASE_PATH", "Auto-assigned per artifact by the platform"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex gap-4 px-4 py-3">
                        <span className="text-[#FF6B00] shrink-0">{k}</span>
                        <span className="text-[#888888]">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
      <Footer />
    </div>
  );
}
