import React from "react";
import { LandingNavBar } from "../components/LandingNavBar";
import { Footer } from "../components/Footer";
import { MountainDivider } from "../components/MountainDivider";
import sketchZk from "../assets/sketch-zkproofs-circuit.jpg";


export default function LearnZkProofsPage() {
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
              <h1 className="font-['Space_Grotesk'] text-5xl md:text-7xl font-bold mb-6 leading-tight">Zero-Knowledge Proofs</h1>
              <p className="text-[#888888] font-['Inter'] text-lg max-w-xl leading-relaxed">
                A zero-knowledge proof is a mathematical technique that lets you prove you know a secret without revealing the secret itself. In StealthSend, you prove you deposited into the pool without showing which deposit is yours.
              </p>
            </div>
            <div className="hidden md:block border border-[#1A1A1A] overflow-hidden">
              <img src={sketchZk} alt="ZK proof circuit diagram" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Post-hero white content */}
        <div className="relative z-10 bg-white text-[#0A0A0A]">
          <MountainDivider />

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-8">The core idea, explained simply</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <p className="text-[#555555] font-['Inter'] leading-relaxed mb-6">
                    Imagine a cave with a magic door in the middle. The door only opens if you know the secret code. You want to prove to someone outside the cave that you know the code, but without shouting it out loud.
                  </p>
                  <p className="text-[#555555] font-['Inter'] leading-relaxed mb-6">
                    Here is how: they wait at the entrance. You go in from either side. They call out which side they want you to come back from. If you know the code, you can always come back from the correct side. After many rounds, they are convinced you know the code without you ever saying it.
                  </p>
                  <p className="text-[#555555] font-['Inter'] leading-relaxed mb-6">
                    Groth16 does this mathematically in a single round. The proof is just 192 bytes and can be verified on-chain in milliseconds. You prove you know a valid deposit note without revealing which deposit is yours.
                  </p>
                  <p className="text-[#888888] font-['Inter'] text-sm leading-relaxed">
                    The proof is generated locally in your browser. The relay and the Solana program only see the proof and a nullifier hash. They never see the secret note that connects deposit to withdrawal.
                  </p>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "What you prove", value: "I know a (secret, nullifier) pair whose commitment is in the Merkle tree of pool deposits." },
                    { label: "What stays hidden", value: "The secret, the nullifier, and the exact leaf position in the tree." },
                    { label: "What gets published on-chain", value: "The nullifier hash (to prevent reuse) and the Merkle root at time of proof." },
                    { label: "Proof size", value: "192 bytes, constant regardless of how many deposits are in the pool." },
                  ].map((row) => (
                    <div key={row.label} className="border border-[#E0E0E0] p-5">
                      <div className="font-['Space_Grotesk'] font-bold text-[#FF6B00] text-xs uppercase tracking-wider mb-2">{row.label}</div>
                      <div className="text-[#555555] font-['Inter'] text-sm leading-relaxed">{row.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-4">Groth16: three parts to understand</h2>
              <p className="text-[#888888] font-['Inter'] text-sm mb-12 max-w-2xl">Groth16 is the specific proof system Signito uses. It is a zk-SNARK, meaning the proofs are small and fast to verify. Here is how each part works.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-[#0A0A0A]">
                {[
                  { title: "Trusted setup", body: "Before the system can work, a one-time ceremony generates a proving key and a verification key. Anyone can verify the ceremony output against the published circuit. The Signito ceremony result is public." },
                  { title: "Proving in your browser", body: "You run snarkjs locally in the browser with your secret note and the proving key. It outputs a 192-byte proof. This step can run fully offline once the proving key has been downloaded. Your secret never leaves the tab." },
                  { title: "Verification on Solana", body: "The Solana program calls the Groth16 verifier with your proof and the public inputs. If valid, funds are released to your address. If invalid, the transaction fails and nothing moves. No appeal, no exception." },
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
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-8">What is a nullifier and why does it matter?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <p className="text-[#555555] font-['Inter'] leading-relaxed mb-6">
                    Without a nullifier, you could withdraw multiple times from the same deposit. The nullifier prevents this without linking the withdrawal to the specific deposit.
                  </p>
                  <p className="text-[#555555] font-['Inter'] leading-relaxed mb-6">
                    Every secret note contains a nullifier value. When you withdraw, you publish the hash of that nullifier on-chain. The program checks that this nullifier hash has not appeared before. If it has, the withdrawal is rejected.
                  </p>
                  <p className="text-[#888888] font-['Inter'] text-sm leading-relaxed">
                    An outside observer sees the nullifier hash on-chain but cannot link it to any specific deposit because the nullifier is derived from your private secret, which was never published.
                  </p>
                </div>
                <div className="border border-[#E0E0E0] p-8 bg-[#F8F8F8]">
                  <div className="font-['JetBrains_Mono'] text-xs space-y-3">
                    <div className="text-[#888888] mb-4">double-spend attempt rejected</div>
                    <div><span className="text-[#0A0A0A]">withdrawal 1:</span> <span className="text-[#22c55e]">nullifier A</span> <span className="text-[#888888]">not seen before</span></div>
                    <div className="text-[#888888] pl-4">funds released to address X</div>
                    <div className="text-[#888888] pl-4">nullifier A stored on-chain</div>
                    <div className="mt-4"><span className="text-[#0A0A0A]">withdrawal 2:</span> <span className="text-[#FF6B00]">nullifier A</span> <span className="text-[#888888]">already seen</span></div>
                    <div className="text-[#FF6B00] pl-4">transaction rejected</div>
                    <div className="text-[#888888] pl-4">no funds moved</div>
                    <div className="mt-4 text-[#888888]">observer sees: two nullifiers</div>
                    <div className="text-[#888888]">observer does NOT see: which deposit</div>
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
