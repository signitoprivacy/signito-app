import React from "react";
import { LandingNavBar } from "../components/LandingNavBar";
import { Footer } from "../components/Footer";
import sketchPrivacy from "../assets/sketch-privacy-model.png";
import signitoLogoUrl from "@assets/signito-logo-nobg.png";

const MountainDivider = () => (
  <svg className="absolute top-0 left-0 w-full pointer-events-none"
    style={{ transform: "translateY(-99%)", overflow: "visible" }}
    viewBox="0 0 1440 120" preserveAspectRatio="none" fill="#FFFFFF"
    overflow="visible" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,120 L0,90 L180,10 L360,80 L540,5 L720,75 L900,0 L1080,70 L1200,20 L1350,-130 L1440,-60 L1440,120 Z" />
  </svg>
);

export default function LearnPrivacyModelPage() {
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
              <div className="inline-block font-['JetBrains_Mono'] text-[#FF6B00] text-xs tracking-[0.2em] uppercase border border-[#FF6B00]/30 px-3 py-1 mb-8">Learn</div>
              <h1 className="font-['Space_Grotesk'] text-5xl md:text-7xl font-bold mb-6 leading-tight">Privacy Model</h1>
              <p className="text-[#888888] font-['Inter'] text-lg max-w-xl leading-relaxed">
                Being honest about what Signito hides and what it does not is the most important thing we can tell you. No privacy tool hides everything. Understanding the limits helps you use it correctly.
              </p>
            </div>
            <div className="hidden md:block border border-[#1A1A1A] overflow-hidden">
              <img src={sketchPrivacy} alt="Privacy boundary diagram: visible vs hidden" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Post-hero white content */}
        <div className="relative z-10 bg-white text-[#0A0A0A]">
          <MountainDivider />

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-4">Exactly what Signito hides and what it does not</h2>
              <p className="text-[#888888] font-['Inter'] text-sm mb-12 max-w-2xl">This is not marketing. This is the actual technical reality of each feature.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="border border-[#E0E0E0] p-8">
                  <h2 className="font-['Space_Grotesk'] text-xl font-bold mb-6 text-[#22c55e]">What Signito hides</h2>
                  <ul className="space-y-4">
                    {[
                      "The connection between your vault deposit address and the withdrawal destination (SafeVault)",
                      "The connection between a pool deposit and a pool withdrawal (StealthSend)",
                      "The identity of the voucher signer when a voucher is redeemed (AirSign)",
                      "Your vault code, which is only ever used on your device and never transmitted",
                      "The secret note used in ZK proofs, generated locally and never sent anywhere",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-[#555555] font-['Inter'] text-sm leading-relaxed">
                        <span className="text-[#22c55e] mt-0.5 shrink-0 font-bold">+</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border border-[#E0E0E0] p-8">
                  <h2 className="font-['Space_Grotesk'] text-xl font-bold mb-6 text-[#FF6B00]">What Signito does not hide</h2>
                  <ul className="space-y-4">
                    {[
                      "The fact that you are using Signito at all: all program interactions are public on Solana",
                      "Deposit amounts, which are visible on-chain the moment you deposit into SafeVault or StealthSend",
                      "The timing of your deposits and withdrawals, which can be correlated if you act quickly",
                      "Your IP address when you submit transactions, unless you use a VPN or Tor separately",
                      "On-chain history before you started using Signito: that stays public forever",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-[#555555] font-['Inter'] text-sm leading-relaxed">
                        <span className="text-[#FF6B00] mt-0.5 shrink-0 font-bold">-</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-4">Three assumptions your privacy depends on</h2>
              <p className="text-[#888888] font-['Inter'] text-sm mb-12 max-w-2xl">Privacy tools provide guarantees only when used correctly. These are the conditions that matter most.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-[#0A0A0A]">
                {[
                  { title: "Your vault code must stay secret", body: "SafeVault and AirSign both derive their signing keys from your vault code. If someone learns your vault code, they can reconstruct your key chain. Choose a strong, unique vault code for each vault and do not share it." },
                  { title: "The anonymity set must be large enough", body: "StealthSend privacy improves as more people deposit into the pool. If you deposit and then immediately withdraw with only a handful of deposits in the pool, an observer has a good chance of guessing which deposit is yours. Waiting for the pool to grow is essential." },
                  { title: "Timing and amounts can be correlated", body: "If you deposit exactly 100 SOL at 3:00 PM and withdraw exactly 100 SOL at 3:01 PM, timing analysis can link the two events even without knowing the cryptographic link. Use common round amounts and wait a meaningful amount of time between deposit and withdrawal." },
                ].map((item, i) => (
                  <div key={item.title} className={`p-10 ${i < 2 ? "border-r-2 border-[#0A0A0A]" : ""}`}>
                    <div className="font-['JetBrains_Mono'] text-[#FF6B00] text-xs mb-3">0{i + 1}</div>
                    <h3 className="font-['Space_Grotesk'] font-bold text-[#0A0A0A] text-lg mb-4">{item.title}</h3>
                    <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-12">Privacy level per feature</h2>
              <div className="border border-[#E0E0E0] font-['JetBrains_Mono'] text-sm divide-y divide-[#E0E0E0]">
                {[
                  ["SafeVault", "Hides deposit-to-withdrawal link. Deposit address and amount are public."],
                  ["StealthSend", "Hides deposit-to-withdrawal link cryptographically. Privacy scales with pool size."],
                  ["AirSign", "Hides signer identity at redemption time. Voucher amount and recipient are public after redemption."],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-8 px-6 py-5">
                    <span className="text-[#FF6B00] shrink-0 w-32">{k}</span>
                    <span className="text-[#555555]">{v}</span>
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
