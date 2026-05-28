import React from "react";
import { LandingNavBar } from "../components/LandingNavBar";
import { Footer } from "../components/Footer";
import { MountainDivider } from "../components/MountainDivider";
import sketchOts from "../assets/sketch-otpchain-flow.jpg";


export default function LearnOtpChainPage() {
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
              <h1 className="font-['Space_Grotesk'] text-5xl md:text-7xl font-bold mb-6 leading-tight">OTS Protocol</h1>
              <p className="text-[#888888] font-['Inter'] text-lg max-w-xl leading-relaxed">
                The OTS Protocol is built on a list of single-use signatures that can only be consumed in order. Once a signature is used, it is gone. You cannot fake the next one without knowing the original seed. This is how Shielded Vault authorizes withdrawals without your private key.
              </p>
            </div>
            <div className="hidden md:block border border-[#1A1A1A] overflow-hidden">
              <img src={sketchOts} alt="PBKDF2 OTS hash chain diagram" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Post-hero white content */}
        <div className="relative z-10 bg-white text-[#0A0A0A]">
          <MountainDivider />

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-8">What is a hash chain, in plain terms?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <p className="text-[#555555] font-['Inter'] leading-relaxed mb-6">
                    Imagine a function that turns any input into a fixed-length output. The important thing is that this function only works in one direction. Given the output, you cannot figure out what the input was. This is called a one-way function.
                  </p>
                  <p className="text-[#555555] font-['Inter'] leading-relaxed mb-6">
                    A hash chain applies this one-way function repeatedly to a starting value, creating a sequence: seed, H(seed), H(H(seed)), H(H(H(seed))), and so on for 32 steps. The end result at each step is called a hash.
                  </p>
                  <p className="text-[#555555] font-['Inter'] leading-relaxed mb-6">
                    Signito stores the final hashes on-chain. To withdraw for the first time, you reveal the value that, when hashed, produces the stored leaf. The program checks the match and if it passes, funds are released and that leaf is consumed.
                  </p>
                  <p className="text-[#888888] font-['Inter'] text-sm leading-relaxed">
                    The key insight: you can always go forward in the chain (hash the current value to get the next one), but you can never go backward. An attacker who sees the stored hash cannot reconstruct your seed.
                  </p>
                </div>
                <div className="border border-[#E0E0E0] p-8 font-['JetBrains_Mono'] text-sm bg-[#F8F8F8]">
                  <div className="text-[#888888] mb-6 text-xs">chain construction from vault code</div>
                  <div className="space-y-2 text-xs">
                    <div><span className="text-[#7A7AFF]">const</span> <span className="text-[#0A0A0A]">seed</span> <span className="text-[#888888]">=</span> <span className="text-[#FF6B00]">vaultCode</span></div>
                    <div className="mt-3"><span className="text-[#7A7AFF]">const</span> <span className="text-[#0A0A0A]">h31</span> <span className="text-[#888888]">=</span> <span className="text-[#22c55e]">pbkdf2</span><span className="text-[#888888]">(seed,  1)</span></div>
                    <div><span className="text-[#7A7AFF]">const</span> <span className="text-[#0A0A0A]">h30</span> <span className="text-[#888888]">=</span> <span className="text-[#22c55e]">pbkdf2</span><span className="text-[#888888]">(h31, 1)</span></div>
                    <div><span className="text-[#7A7AFF]">const</span> <span className="text-[#0A0A0A]">h29</span> <span className="text-[#888888]">=</span> <span className="text-[#22c55e]">pbkdf2</span><span className="text-[#888888]">(h30, 1)</span></div>
                    <div className="text-[#888888]">{"// ... 32 steps total"}</div>
                    <div><span className="text-[#7A7AFF]">const</span> <span className="text-[#0A0A0A]">h00</span> <span className="text-[#888888]">=</span> <span className="text-[#22c55e]">pbkdf2</span><span className="text-[#888888]">(h01, 1)</span></div>
                    <div className="mt-5 text-[#888888]">{"// stored on Solana: h31...h00"}</div>
                    <div className="text-[#888888]">{"// to withdraw #1: reveal h00"}</div>
                    <div className="text-[#888888]">{"// program checks: pbkdf2(h00)==h01"}</div>
                    <div className="text-[#888888]">{"// to withdraw #2: reveal h01"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-6">How the program checks your reveal</h2>
              <p className="text-[#555555] font-['Inter'] leading-relaxed mb-6 max-w-2xl">
                When you submit a withdrawal, you provide the next pre-image in the chain. The on-chain program hashes it using PBKDF2 and compares the result to what is stored in the vault. If they match, the withdrawal is valid. The used leaf is marked as consumed permanently.
              </p>
              <p className="text-[#888888] font-['Inter'] text-sm leading-relaxed max-w-2xl">
                Your private key is not involved in any of this. The vault code is never sent to any server. The only thing the program cares about is whether the reveal hashes to the correct stored value.
              </p>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-4">Why PBKDF2 specifically?</h2>
              <p className="text-[#888888] font-['Inter'] text-sm mb-12 max-w-2xl">Not all hash functions are equal for this use case. PBKDF2 has three properties that make it ideal for deriving secrets from a vault code.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-[#0A0A0A]">
                {[
                  { title: "Key stretching", body: "PBKDF2 is intentionally slow to compute. A short vault code still produces a strong 256-bit key because brute-forcing it would require enormous time even on dedicated hardware. The iteration count is tunable." },
                  { title: "Fully deterministic", body: "Given the same vault code and salt, PBKDF2 always produces exactly the same output. This means you can reconstruct your entire chain from memory alone, no backup file needed, no cloud storage, no physical copy." },
                  { title: "Battle-tested standard", body: "PBKDF2 is defined in RFC 8018 and has been reviewed by cryptographers for decades. It uses no experimental assumptions. The same algorithm secures vault codes in most major operating systems today." },
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

        </div>

      </div>
      <Footer />
    </div>
  );
}
