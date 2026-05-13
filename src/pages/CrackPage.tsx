import React from "react";
import { LandingNavBar } from "../components/LandingNavBar";
import { Footer } from "../components/Footer";

export default function CrackPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-['Inter']">
      <LandingNavBar />
      
      <main className="pt-32 pb-20">
        <div className="max-w-[3200px] mx-auto px-8 md:px-16">
          
          <div className="mb-16">
            <span className="tag mb-6">CRACK CHALLENGE</span>
            <h1 className="font-['Space_Grotesk'] text-4xl md:text-5xl font-bold leading-tight mb-8">
              We share the private key. <br />
              Can you move the funds?
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <div className="card">
              <h3 className="text-[#888888] font-['JetBrains_Mono'] text-xs tracking-wider uppercase mb-2">Network</h3>
              <p className="font-['Space_Grotesk'] font-bold text-lg">Solana Mainnet</p>
            </div>
            <div className="card">
              <h3 className="text-[#888888] font-['JetBrains_Mono'] text-xs tracking-wider uppercase mb-2">Status</h3>
              <p className="font-['Space_Grotesk'] font-bold text-lg text-[#FF6B00]">Deploying soon</p>
            </div>
            <div className="card md:col-span-2">
              <h3 className="text-[#888888] font-['JetBrains_Mono'] text-xs tracking-wider uppercase mb-2">Vault Address</h3>
              <p className="font-['JetBrains_Mono'] text-sm break-all">PENDING_DEPLOY</p>
            </div>
            <div className="card md:col-span-2">
              <h3 className="text-[#888888] font-['JetBrains_Mono'] text-xs tracking-wider uppercase mb-2">Shared Private Key</h3>
              <p className="font-['JetBrains_Mono'] text-sm break-all text-[#888888]">4a8c9b2e... (pending deploy)</p>
            </div>
            <div className="card">
              <h3 className="text-[#888888] font-['JetBrains_Mono'] text-xs tracking-wider uppercase mb-2">Vault Code</h3>
              <p className="font-['Space_Grotesk'] font-bold">Unknown</p>
            </div>
            <div className="card">
              <h3 className="text-[#888888] font-['JetBrains_Mono'] text-xs tracking-wider uppercase mb-2">Prize</h3>
              <p className="font-['Space_Grotesk'] font-bold">All vault funds</p>
            </div>
          </div>

          <div className="mb-16">
            <h2 className="font-['Space_Grotesk'] text-2xl font-bold mb-6">Rules</h2>
            <ol className="list-decimal list-inside space-y-4 text-[#888888] font-['Inter']">
              <li>The private key for the vault account is public.</li>
              <li>The funds are shielded by the PBKDF2-based OTS Protocol.</li>
              <li>Any transaction to move the funds requires the correct pre-image hash from the chain.</li>
              <li>If you can drain the vault funds, you win.</li>
            </ol>
          </div>

          <div className="mb-16">
            <h2 className="font-['Space_Grotesk'] text-2xl font-bold mb-6">How it works</h2>
            <p className="text-[#888888] font-['Inter'] leading-relaxed mb-4">
              Signito relies on mathematical proofs, not just custody. By chaining hashes securely, we can expose the private key of an intermediate vault without exposing the funds. To spend, a user provides the n-1 hash in the chain, which the contract verifies by hashing it once and comparing it to the stored state.
            </p>
          </div>

          <div className="pt-8 border-t border-[#2A2A2A] text-center">
            <p className="text-[#888888] text-sm">
              Real funds are on the line. This is a live Mainnet challenge.
            </p>
          </div>

        </div>
      </main>
      
      <Footer />
    </div>
  );
}
