import React from "react";
import { LandingNavBar } from "../components/LandingNavBar";
import { Footer } from "../components/Footer";
import { MountainDivider } from "../components/MountainDivider";
import sketchSToken from "../assets/sketch-stoken-mint.jpg";


export default function LearnSTokenPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <LandingNavBar />
      <div>

        {/* Hero - dark */}
        <div className="border-b border-[#2A2A2A] relative overflow-hidden min-h-screen flex flex-col">
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #2A2A2A 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
          <div className="max-w-[3200px] mx-auto px-8 md:px-16 pt-[20vh] pb-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10 w-full">
            <div>
              <div className="inline-block font-['JetBrains_Mono'] text-[#FF6B00] text-xs tracking-[0.2em] uppercase border border-[#FF6B00]/30 px-3 py-1 mb-8">Learn</div>
              <h1 className="font-['Space_Grotesk'] text-5xl md:text-7xl font-bold mb-6 leading-tight">sToken Standard</h1>
              <p className="text-[#888888] font-['Inter'] text-lg max-w-xl leading-relaxed">
                When you deposit a token into a Signito vault, the protocol mints you a receipt token with a lowercase "s" prefix. sSOL is a receipt for shielded SOL. sUSDC is a receipt for shielded USDC. These receipt tokens are built on SPL Token-2022 and cannot be transferred, which prevents anyone else from claiming your position.
              </p>
            </div>
            <div className="hidden md:block border border-[#1A1A1A] overflow-hidden">
              <img src={sketchSToken} alt="sToken minting and redemption diagram" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Post-hero white content */}
        <div className="relative z-10 bg-white text-[#0A0A0A]">
          <MountainDivider />

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-8">What a shielded token is and why it exists</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <p className="text-[#555555] font-['Inter'] leading-relaxed mb-6">
                    When you deposit SOL into Shielded Vault, the vault program needs to track that the deposit belongs to you. It does this by minting an sSOL token to your wallet. The sSOL is proof of your deposit. When you withdraw, the sSOL is burned and your SOL is returned.
                  </p>
                  <p className="text-[#555555] font-['Inter'] leading-relaxed mb-6">
                    The sToken uses SPL Token-2022's NonTransferable extension. This means sSOL cannot be sent from one wallet to another. Only the vault program can move it, and only when a valid OTS reveal is provided.
                  </p>
                  <p className="text-[#555555] font-['Inter'] leading-relaxed mb-6">
                    Without NonTransferable, an attacker who obtained your sSOL token could attempt to redeem it before you. The extension closes this attack vector completely.
                  </p>
                  <p className="text-[#888888] font-['Inter'] text-sm leading-relaxed">
                    The "s" prefix is consistent across all tokens: sSOL, sUSDC, sBONK, and so on. Any SPL token can be shielded, producing a corresponding s-prefixed receipt.
                  </p>
                </div>
                <div className="space-y-4">
                  {[
                    { token: "sSOL", underlying: "SOL", program: "Token-2022", ext: "NonTransferable" },
                    { token: "sUSDC", underlying: "USDC", program: "Token-2022", ext: "NonTransferable" },
                    { token: "sXYZ", underlying: "Any SPL token", program: "Token-2022", ext: "NonTransferable" },
                  ].map((row) => (
                    <div key={row.token} className="border border-[#E0E0E0] p-5 font-['JetBrains_Mono'] text-sm grid grid-cols-2 gap-4 items-center">
                      <div>
                        <div className="text-[#FF6B00] text-xl font-bold mb-1">{row.token}</div>
                        <div className="text-[#888888] text-xs">underlying: {row.underlying}</div>
                      </div>
                      <div>
                        <div className="text-[#555555] text-xs mb-1">program: {row.program}</div>
                        <div className="text-[#FF6B00]/70 text-xs">ext: {row.ext}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-4">Token-2022 and the NonTransferable extension</h2>
              <p className="text-[#888888] font-['Inter'] text-sm mb-12 max-w-2xl">Token-2022 is the upgraded SPL token standard on Solana. It supports extensions that add behavior to tokens without requiring a separate contract. NonTransferable is one such extension.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-[#0A0A0A]">
                {[
                  { title: "What NonTransferable blocks", body: "The extension prevents any transfer instruction from succeeding on the sToken. The token can only be moved by the issuing vault program, which enforces the OTS Protocol condition before doing so." },
                  { title: "Why this matters for security", body: "Without NonTransferable, an attacker who got hold of your sSOL token could try to redeem it before you. The extension removes this possibility entirely. Your position in the vault is bound to your wallet address." },
                  { title: "Compatibility with existing tooling", body: "Token-2022 is supported by all major Solana wallets and DEXes. Standard SPL tooling works with Token-2022 tokens with minor flag adjustments. The sToken will appear in your wallet alongside your regular tokens." },
                ].map((item, i) => (
                  <div key={item.title} className={`p-10 ${i < 2 ? "border-r-2 border-[#0A0A0A]" : ""}`}>
                    <div className="font-['JetBrains_Mono'] text-[#FF6B00] text-xs mb-3">0{i + 1}</div>
                    <h3 className="font-['Space_Grotesk'] font-bold text-[#0A0A0A] text-xl mb-4">{item.title}</h3>
                    <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-12">sToken lifecycle</h2>
              <div className="border border-[#E0E0E0] font-['JetBrains_Mono'] text-sm divide-y divide-[#E0E0E0]">
                {[
                  ["Deposit", "Vault program receives your SOL, mints 1:1 sSOL to your wallet"],
                  ["Hold", "sSOL sits in your wallet, visible to any block explorer, but cannot be sent to another address"],
                  ["Withdraw", "You provide OTS reveal, program burns sSOL, releases SOL to any address you specify"],
                  ["After withdrawal", "sSOL is permanently burned, the OTS reveal is consumed, that leaf is gone from the chain"],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-8 px-6 py-5">
                    <span className="text-[#FF6B00] shrink-0 w-28">{k}</span>
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
