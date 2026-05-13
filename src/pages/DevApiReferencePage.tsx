import React from "react";
import { LandingNavBar } from "../components/LandingNavBar";
import { Footer } from "../components/Footer";
import sketchRelay from "../assets/sketch-relay-routing.png";
import signitoLogoUrl from "@assets/signito-logo-nobg.png";

const MountainDivider = () => (
  <svg className="absolute top-0 left-0 w-full pointer-events-none"
    style={{ transform: "translateY(-99%)", overflow: "visible" }}
    viewBox="0 0 1440 120" preserveAspectRatio="none" fill="#FFFFFF"
    overflow="visible" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,120 L0,90 L180,10 L360,80 L540,5 L720,75 L900,0 L1080,70 L1200,20 L1350,-130 L1440,-60 L1440,120 Z" />
  </svg>
);

const endpoints: { method: string; path: string; desc: string; group: string }[] = [
  { group: "Health", method: "GET", path: "/api/healthz", desc: "Returns 200 OK with server uptime. Use for liveness probes." },
  { group: "Status", method: "GET", path: "/api/status", desc: "Returns connectivity status for RPC, database, and relay. Checked server-side, never from the browser." },
  { group: "Portfolio", method: "GET", path: "/api/portfolio/:address", desc: "Returns SPL token balances for a given wallet address, fetched via the Helius proxy." },
  { group: "Transactions", method: "GET", path: "/api/transactions/:address", desc: "Returns recent transaction history for a wallet address. Paginated." },
  { group: "Vault", method: "POST", path: "/api/vault/create", desc: "Create a new SafeVault. Requires wallet address and PBKDF2-derived vault code hash." },
  { group: "Vault", method: "POST", path: "/api/vault/deposit", desc: "Deposit SPL tokens into a vault. Requires signed deposit instruction." },
  { group: "Vault", method: "POST", path: "/api/vault/withdraw", desc: "Withdraw from a vault using an OTS code. The OTS is consumed and cannot be reused." },
  { group: "Vault", method: "GET", path: "/api/vault/:id/status", desc: "Returns vault balance, OTS codes remaining, and last activity timestamp." },
  { group: "Stealth", method: "POST", path: "/api/stealth/deposit", desc: "Submit a StealthSend deposit. Derives a stealth address from the recipient's public key." },
  { group: "Stealth", method: "POST", path: "/api/stealth/prove", desc: "Generate a Groth16 ZK proof for a pending stealth withdrawal. Proof generated server-side for the circuit." },
  { group: "Stealth", method: "GET", path: "/api/stealth/pending/:address", desc: "List pending stealth deposits for a given wallet address." },
  { group: "Relay", method: "POST", path: "/api/relay/submit", desc: "Submit a signed Solana transaction for broadcast. The relay acts as fee-payer so your wallet stays out of the transaction." },
  { group: "RPC", method: "POST", path: "/api/rpc/:method", desc: "Proxy for Solana RPC calls. Keeps the Helius API key server-side and never exposed to the browser." },
];

const methodColor: Record<string, string> = {
  GET: "text-[#22C55E]",
  POST: "text-[#FF6B00]",
  DELETE: "text-[#EF4444]",
};

export default function DevApiReferencePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <LandingNavBar />
      <div>

        {/* Hero - dark */}
        <div className="border-b border-[#2A2A2A] relative overflow-hidden min-h-screen flex flex-col">
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #2A2A2A 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
          <img src={signitoLogoUrl} alt="" aria-hidden className="absolute right-[-80px] bottom-[-80px] w-[520px] opacity-[0.035] pointer-events-none select-none" />
          <div className="max-w-[3200px] mx-auto px-8 md:px-16 pt-[20vh] pb-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10 w-full">
            <div>
              <div className="inline-block font-['JetBrains_Mono'] text-[#FF6B00] text-xs tracking-[0.2em] uppercase border border-[#FF6B00]/30 px-3 py-1 mb-8">Developers</div>
              <h1 className="font-['Space_Grotesk'] text-5xl md:text-7xl font-bold mb-6 leading-tight">API Reference</h1>
              <p className="text-[#888888] font-['Inter'] text-lg max-w-xl leading-relaxed mb-6">
                Signito exposes a REST API defined by an OpenAPI 3.1 spec. Every endpoint is documented, typed, and codegen-ready. No hidden routes, no undocumented behavior.
              </p>
              <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed">
                The spec lives at <span className="font-['JetBrains_Mono'] text-[#888888]">lib/api-spec/openapi.yaml</span>. Run codegen after any change to regenerate React Query hooks and Zod schemas automatically.
              </p>
            </div>
            <div className="hidden md:block border border-[#1A1A1A] overflow-hidden">
              <img src={sketchRelay} alt="API routing diagram" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Post-hero white content */}
        <div className="relative z-10 bg-white text-[#0A0A0A]">
          <MountainDivider />

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-4">All endpoints</h2>
              <p className="text-[#888888] font-['Inter'] text-sm mb-12 max-w-2xl">Grouped by domain. Base URL is <span className="font-['JetBrains_Mono']">/api</span> on any Signito deployment.</p>
              <div className="border border-[#E0E0E0] font-['JetBrains_Mono'] text-sm divide-y divide-[#E0E0E0]">
                {endpoints.map((ep) => (
                  <div key={ep.path} className="grid grid-cols-1 md:grid-cols-[120px_1fr_2fr] gap-4 px-6 py-4 items-start">
                    <div>
                      <span className="font-['JetBrains_Mono'] text-xs text-[#888888] border border-[#E0E0E0] px-2 py-0.5 mr-2">{ep.group}</span>
                    </div>
                    <div>
                      <span className={`font-bold mr-3 text-xs ${methodColor[ep.method] ?? "text-[#888888]"}`}>{ep.method}</span>
                      <span className="text-[#0A0A0A] text-xs break-all">{ep.path}</span>
                    </div>
                    <div className="text-[#555555] font-['Inter'] text-xs leading-relaxed">{ep.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-4">Codegen workflow</h2>
              <p className="text-[#888888] font-['Inter'] text-sm mb-12 max-w-2xl">The OpenAPI spec drives type-safe client code automatically. Edit the spec, run one command, get updated hooks and schemas.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h3 className="font-['Space_Grotesk'] font-bold text-xl mb-6">Run codegen</h3>
                  <div className="bg-[#0A0A0A] text-white font-['JetBrains_Mono'] text-xs p-6 space-y-3">
                    <div><span className="text-[#888888]"># after editing openapi.yaml</span></div>
                    <div>pnpm --filter @workspace/api-spec run codegen</div>
                    <div className="mt-4 text-[#888888]"># outputs to:</div>
                    <div>lib/api-client/src/generated/</div>
                    <div className="mt-4 text-[#888888]"># generated files include:</div>
                    <div>signito.ts           <span className="text-[#555555]"># React Query hooks</span></div>
                    <div>signito.zod.ts       <span className="text-[#555555]"># Zod schemas</span></div>
                    <div>signito.schemas.ts   <span className="text-[#555555]"># TypeScript types</span></div>
                  </div>
                </div>
                <div>
                  <h3 className="font-['Space_Grotesk'] font-bold text-xl mb-6">Using generated hooks</h3>
                  <div className="bg-[#0A0A0A] text-white font-['JetBrains_Mono'] text-xs p-6 space-y-2">
                    <div><span className="text-[#888888]">// import from generated client</span></div>
                    <div>{"import { useGetPlatformStats }"}</div>
                    <div className="pl-4">{"from '@workspace/api-client-react';"}</div>
                    <div className="mt-4"><span className="text-[#888888]">// use in any React component</span></div>
                    <div>{"function StatusBadge() {"}</div>
                    <div className="pl-4">{"const { data } = useGetPlatformStats();"}</div>
                    <div className="pl-4">{"return <span>{data?.status}</span>;"}</div>
                    <div>{"}"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-4">Authentication and rate limits</h2>
              <p className="text-[#888888] font-['Inter'] text-sm mb-12 max-w-2xl">Public read endpoints require no auth. Write endpoints verify wallet signatures on-chain, not API keys.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: "No API keys for reads", body: "GET endpoints like /api/status, /api/portfolio/:address, and /api/healthz require no authentication. They are safe to call from any client." },
                  { title: "Wallet signatures for writes", body: "POST endpoints that mutate state require a Solana wallet signature in the request body. The server verifies the signature against the on-chain program state." },
                  { title: "Rate limiting", body: "All endpoints are rate-limited per IP. The default limit is 120 requests per minute. Relay endpoints have a stricter limit of 30 requests per minute." },
                  { title: "CORS policy", body: "The API server allows requests from any origin in development. In production, the allowed origin is restricted to the published Signito domain." },
                ].map((item) => (
                  <div key={item.title} className="border-2 border-[#0A0A0A] p-8">
                    <h3 className="font-['Space_Grotesk'] font-bold text-[#0A0A0A] text-lg mb-3">{item.title}</h3>
                    <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
      <Footer />
    </div>
  );
}
