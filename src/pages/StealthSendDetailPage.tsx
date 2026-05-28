import React from "react";
import { LandingNavBar } from "../components/LandingNavBar";
import { Footer } from "../components/Footer";
import { MountainDivider } from "../components/MountainDivider";
import sketchPool from "../assets/sketch-stealthsend-pool.jpg";
import sketchZk from "../assets/sketch-zkproofs-circuit.jpg";


export default function StealthSendDetailPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <LandingNavBar />
      <div>

        {/* Hero - dark */}
        <div className="border-b border-[#2A2A2A] relative overflow-hidden min-h-screen flex flex-col">
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #2A2A2A 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
          <div className="max-w-[3200px] mx-auto px-8 md:px-16 pt-[20vh] pb-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10 w-full">
            <div>
              <div className="inline-block font-['JetBrains_Mono'] text-[#FF6B00] text-xs tracking-[0.2em] uppercase border border-[#FF6B00]/30 px-3 py-1 mb-8">Feature 02</div>
              <h1 className="font-['Space_Grotesk'] text-5xl md:text-7xl font-bold mb-6 leading-tight">StealthSend</h1>
              <p className="text-[#888888] font-['Inter'] text-lg max-w-xl leading-relaxed mb-6">
                StealthSend lets you deposit tokens into a shared privacy pool and withdraw to a completely different address. Nobody watching the blockchain can connect which deposit belongs to which withdrawal. The link is broken by mathematics.
              </p>
              <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed">
                The proof is generated entirely in your browser. No server ever sees your secret. The relay that broadcasts the transaction cannot redirect your funds even if it wanted to.
              </p>
            </div>
            <div className="hidden md:block border border-[#1A1A1A] overflow-hidden">
              <img src={sketchPool} alt="Privacy pool deposits and withdrawals diagram" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Post-hero white content */}
        <div className="relative z-10 bg-white text-[#0A0A0A]">
          <MountainDivider />

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-4">How it works, step by step</h2>
              <p className="text-[#888888] font-['Inter'] text-sm mb-16 max-w-2xl">Four steps. The proof generation is the most important: it happens locally in your browser and proves membership without revealing identity.</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-[#E0E0E0]">
                {[
                  { step: "01", title: "Deposit", body: "Send tokens to the pool contract. Your browser generates a secret note and inserts a commitment hash into an on-chain Merkle tree. Keep the note safe, you need it to withdraw." },
                  { step: "02", title: "Wait", body: "Let more deposits accumulate in the pool. The more people who have deposited, the harder it is to guess which deposit is yours. Patience improves your privacy significantly." },
                  { step: "03", title: "Prove", body: "Open StealthSend in your browser. Provide your secret note. snarkjs generates a Groth16 proof that proves you know a valid note in the tree, without showing which one." },
                  { step: "04", title: "Withdraw", body: "Submit the proof to SignitoRelay. The relay broadcasts the withdrawal transaction. Your funds arrive at your chosen address with no wallet signature linking you to the deposit." },
                ].map((item, i) => (
                  <div key={item.step} className={`p-8 ${i < 3 ? "border-r border-[#E0E0E0]" : ""}`}>
                    <div className="font-['JetBrains_Mono'] text-[#FF6B00] text-sm mb-4">{item.step}</div>
                    <h3 className="font-['Space_Grotesk'] font-bold text-[#0A0A0A] text-lg mb-3">{item.title}</h3>
                    <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div>
                  <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-6">What the ZK proof actually proves</h2>
                  <p className="text-[#555555] font-['Inter'] leading-relaxed mb-6">
                    A zero-knowledge proof lets you say "I know something" without revealing what that something is. In StealthSend, you prove "I know a secret note whose commitment is in this Merkle tree" without revealing which leaf it is.
                  </p>
                  <p className="text-[#555555] font-['Inter'] leading-relaxed mb-6">
                    The proof is about 192 bytes, a constant size no matter how many deposits are in the pool. The Solana program verifies it on-chain in a single instruction. If the proof is invalid, the transaction fails and nothing moves.
                  </p>
                  <p className="text-[#888888] font-['Inter'] text-sm leading-relaxed">
                    A nullifier hash is published when you withdraw. This prevents you from withdrawing twice using the same note, without revealing which deposit the nullifier belongs to.
                  </p>
                </div>
                <div className="hidden md:block border border-[#E0E0E0] overflow-hidden">
                  <img src={sketchZk} alt="ZK proof circuit diagram" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-4">Three things that make it work</h2>
              <p className="text-[#888888] font-['Inter'] text-sm mb-12 max-w-2xl">Groth16 has three phases. Understanding each helps you trust the system without needing to take anyone's word for it.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-[#0A0A0A]">
                {[
                  { title: "Trusted setup ceremony", body: "Groth16 needs a one-time setup to create a proving key and a verification key. The keys are public. Anyone can verify the ceremony output against the circuit. The Signito ceremony result is published openly." },
                  { title: "In-browser proving", body: "You run snarkjs on your own machine with your secret note and the proving key. It outputs a proof. This runs fully offline after the proving key loads. The note never leaves your device." },
                  { title: "On-chain verification", body: "The Solana program calls the built-in Groth16 verifier with your proof and the public inputs. If the proof is valid, funds are released to your chosen address. Invalid proofs are rejected silently with no fund movement." },
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
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-4">Privacy is one layer. Security is another.</h2>
              <p className="text-[#888888] font-['Inter'] text-sm mb-12 max-w-2xl">StealthSend breaks the on-chain link between deposit and withdrawal. That is the privacy guarantee. But Signito adds a second, independent guarantee: the funds cannot be moved at all without the vault code.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-2 border-[#0A0A0A]">
                <div className="p-10 border-r-2 border-[#0A0A0A]">
                  <div className="font-['JetBrains_Mono'] text-[#FF6B00] text-xs mb-3">PRIVACY</div>
                  <h3 className="font-['Space_Grotesk'] font-bold text-[#0A0A0A] text-xl mb-4">No on-chain link</h3>
                  <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed mb-4">
                    The ZK proof proves membership in the deposit set without revealing which deposit is yours. An observer watching the Solana ledger cannot connect your receiving address to your sending address.
                  </p>
                  <p className="text-[#888888] font-['Inter'] text-xs leading-relaxed">
                    This is the standard privacy guarantee, shared by all ZK pool protocols.
                  </p>
                </div>
                <div className="p-10">
                  <div className="font-['JetBrains_Mono'] text-[#FF6B00] text-xs mb-3">SECURITY</div>
                  <h3 className="font-['Space_Grotesk'] font-bold text-[#0A0A0A] text-xl mb-4">Key leak does not drain funds</h3>
                  <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed mb-4">
                    Funds deposited via StealthSend sit behind the OTS vault. Even if your private key is exposed in a phishing attack or database breach, an attacker cannot construct a valid withdrawal without the vault code. The key and the vault code are completely separate secrets.
                  </p>
                  <p className="text-[#888888] font-['Inter'] text-xs leading-relaxed">
                    This is the additional security guarantee that most privacy protocols do not provide.
                  </p>
                </div>
              </div>
              <div className="mt-6 border border-[#E0E0E0] px-8 py-6 font-['JetBrains_Mono'] text-xs">
                <span className="text-[#888888]">To drain a StealthSend vault:</span>
                <span className="text-[#0A0A0A] ml-4">private key</span>
                <span className="text-[#CCCCCC] mx-2">+</span>
                <span className="text-[#0A0A0A]">vault code</span>
                <span className="text-[#CCCCCC] mx-2">+</span>
                <span className="text-[#0A0A0A]">correct OTS chain depth</span>
                <span className="text-[#888888] ml-4">-- the vault code is never stored or transmitted</span>
              </div>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-12">Technical specifications</h2>
              <div className="border border-[#E0E0E0] font-['JetBrains_Mono'] text-sm divide-y divide-[#E0E0E0]">
                {[
                  ["Proof system", "Groth16 (zk-SNARK)"],
                  ["Proving library", "snarkjs (in-browser WASM)"],
                  ["Commitment scheme", "Pedersen commitment"],
                  ["Merkle tree depth", "20 levels (up to 1 million deposits)"],
                  ["Relay", "SignitoRelay broadcasts as fee-payer"],
                  ["Anonymity set", "All deposits currently in the pool"],
                  ["Note format", "secret + nullifier, 32 bytes each"],
                  ["Proof size", "192 bytes (constant, Groth16 property)"],
                  ["Protocol fee", "0.15% per withdrawal, enforced on-chain"],
                ].map(([k, v]) => (
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
