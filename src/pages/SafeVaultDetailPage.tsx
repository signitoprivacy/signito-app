import React from "react";
import { LandingNavBar } from "../components/LandingNavBar";
import { Footer } from "../components/Footer";
import sketchSafeVault from "../assets/sketch-safevault-chain.png";
import signitoLogoUrl from "@assets/signito-logo-nobg.png";

const MountainDivider = () => (
  <svg className="absolute top-0 left-0 w-full pointer-events-none"
    style={{ transform: "translateY(-99%)", overflow: "visible" }}
    viewBox="0 0 1440 120" preserveAspectRatio="none" fill="#FFFFFF"
    overflow="visible" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,120 L0,90 L180,10 L360,80 L540,5 L720,75 L900,0 L1080,70 L1200,20 L1350,-130 L1440,-60 L1440,120 Z" />
  </svg>
);

export default function SafeVaultDetailPage() {
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
              <div className="inline-block font-['JetBrains_Mono'] text-[#FF6B00] text-xs tracking-[0.2em] uppercase border border-[#FF6B00]/30 px-3 py-1 mb-8">Feature 01</div>
              <h1 className="font-['Space_Grotesk'] text-5xl md:text-7xl font-bold mb-6 leading-tight">SafeVault</h1>
              <p className="text-[#888888] font-['Inter'] text-lg max-w-xl leading-relaxed mb-6">
                SafeVault lets you deposit SPL tokens behind a one-time secret chain. To withdraw, you reveal one step in the chain. Your private key is never involved. Even if someone steals your wallet key, they cannot drain the vault without knowing your vault code.
              </p>
              <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed">
                Every vault generates a chain of 32 single-use credentials from your vault code using PBKDF2. Each withdrawal consumes the next credential in the chain. Once used, it cannot be reused.
              </p>
            </div>
            <div className="hidden md:block border border-[#1A1A1A] overflow-hidden">
              <img src={sketchSafeVault} alt="PBKDF2 hash chain diagram" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Post-hero white content */}
        <div className="relative z-10 bg-white text-[#0A0A0A]">
          <MountainDivider />

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-4">How it works, step by step</h2>
              <p className="text-[#888888] font-['Inter'] text-sm mb-16 max-w-2xl">You only need to remember your vault code. Everything else is derived from it automatically.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#E0E0E0]">
                {[
                  { step: "01", title: "Create a vault", body: "Choose a vault code. Signito runs it through PBKDF2 32 times, creating a chain of hashes. The chain hashes are stored on Solana. Your vault code stays on your device and is never sent anywhere." },
                  { step: "02", title: "Deposit any SPL token", body: "Send SOL, USDC, or any SPL token to your vault address. The program records the deposit. At this point, the funds are inside the vault and nothing can move them without a valid chain reveal." },
                  { step: "03", title: "Withdraw with one reveal", body: "To withdraw, you provide the next pre-image from your chain. The program hashes it and checks it matches what was stored. If it matches, funds are sent to any address you choose. That reveal is then consumed and cannot be used again." },
                ].map((item, i) => (
                  <div key={item.step} className={`p-10 ${i < 2 ? "border-r border-[#E0E0E0]" : ""}`}>
                    <div className="font-['JetBrains_Mono'] text-[#FF6B00] text-sm mb-4">{item.step}</div>
                    <h3 className="font-['Space_Grotesk'] font-bold text-[#0A0A0A] text-xl mb-4">{item.title}</h3>
                    <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-4">What protects your funds</h2>
              <p className="text-[#888888] font-['Inter'] text-sm mb-12 max-w-2xl">Two independent secrets must be held together to withdraw. Neither one alone is sufficient.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { label: "What an attacker needs to drain your vault", points: ["Your vault code, to reconstruct the PBKDF2 chain", "The exact depth in the chain (which pre-image is next)", "Both together, not just one, and not your wallet key"], color: "#FF6B00", bg: "border-[#FF6B00]/40" },
                  { label: "What Signito guarantees on your behalf", points: ["Vault code is never transmitted or stored on any server", "Each OTS reveal is single-use and consumed permanently", "The program logic is open: you can verify it on-chain yourself"], color: "#22c55e", bg: "border-[#22c55e]/40" },
                ].map((block) => (
                  <div key={block.label} className={`border-2 ${block.bg} p-8`}>
                    <h3 className="font-['Space_Grotesk'] font-bold text-[#0A0A0A] text-lg mb-6">{block.label}</h3>
                    <ul className="space-y-3">
                      {block.points.map((pt) => (
                        <li key={pt} className="flex items-start gap-3 text-[#555555] font-['Inter'] text-sm leading-relaxed">
                          <span style={{ color: block.color }} className="mt-0.5 shrink-0 font-bold">+</span>{pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-12">Technical specifications</h2>
              <div className="border border-[#E0E0E0] font-['JetBrains_Mono'] text-sm divide-y divide-[#E0E0E0]">
                {[["Hash function","PBKDF2-SHA256"],["Chain depth","32 pre-images per vault"],["Token support","Any SPL token (Token-2022 compatible)"],["Withdrawal target","Any Solana address, chosen at withdrawal time"],["Key involvement","None, private key not used for withdrawals"],["On-chain state","Leaf hashes, deposit amounts, consumed index"],["Vault code storage","Never stored, only used locally to derive chain"]].map(([k,v]) => (
                  <div key={k} className="flex justify-between px-6 py-4">
                    <span className="text-[#888888]">{k}</span>
                    <span className="text-[#555555] text-right max-w-xs">{v}</span>
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
