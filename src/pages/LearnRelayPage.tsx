import React from "react";
import { LandingNavBar } from "../components/LandingNavBar";
import { Footer } from "../components/Footer";
import { MountainDivider } from "../components/MountainDivider";
import sketchRelay from "../assets/sketch-relay-routing.jpg";


export default function LearnRelayPage() {
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
              <h1 className="font-['Space_Grotesk'] text-5xl md:text-7xl font-bold mb-6 leading-tight">SignitoRelay</h1>
              <p className="text-[#888888] font-['Inter'] text-lg max-w-xl leading-relaxed">
                Every Solana transaction needs a fee-payer to sign it. If your wallet pays the fee for a StealthSend withdrawal, an observer can link your wallet address to the withdrawal address and partially undo the privacy. SignitoRelay solves this by acting as the fee-payer so your wallet never appears in the transaction.
              </p>
            </div>
            <div className="hidden md:block border border-[#1A1A1A] overflow-hidden">
              <img src={sketchRelay} alt="Relay transaction routing diagram" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Post-hero white content */}
        <div className="relative z-10 bg-white text-[#0A0A0A]">
          <MountainDivider />

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-8">Why a relay is necessary for ZK withdrawals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <p className="text-[#555555] font-['Inter'] leading-relaxed mb-6">
                    On Solana, every transaction must be signed by a fee-payer. If you use your own wallet as the fee-payer for a StealthSend withdrawal, a blockchain observer can see your wallet address in the transaction. Even though the ZK proof hides which deposit is yours, your wallet is now linked to the withdrawal address.
                  </p>
                  <p className="text-[#555555] font-['Inter'] leading-relaxed mb-6">
                    SignitoRelay acts as a third-party fee-payer. You submit the ZK proof to the relay over HTTPS. The relay constructs the Solana transaction using its own keypair as the fee-payer, pays the fee, and broadcasts the transaction. Your wallet address never appears in the broadcast transaction.
                  </p>
                  <p className="text-[#888888] font-['Inter'] text-sm leading-relaxed">
                    The relay cannot steal funds even if it tries. The ZK proof cryptographically binds the withdrawal to the specific recipient address you chose. If the relay changed the recipient, the proof would be invalid and the Solana program would reject the transaction.
                  </p>
                </div>
                <div className="border border-[#E0E0E0] p-8 bg-[#F8F8F8] font-['JetBrains_Mono'] text-xs space-y-3">
                  <div className="text-[#888888] mb-4">relay call sequence</div>
                  <div><span className="text-[#0A0A0A]">1.</span> <span className="text-[#888888]">browser generates ZK proof</span></div>
                  <div className="pl-4 text-[#888888]">proof = groth16.prove(circuit, inputs)</div>
                  <div className="mt-2"><span className="text-[#0A0A0A]">2.</span> <span className="text-[#888888]">POST /api/relay/withdraw</span></div>
                  <div className="pl-4 text-[#888888]">{"{ proof, nullifier, recipient }"}</div>
                  <div className="mt-2"><span className="text-[#0A0A0A]">3.</span> <span className="text-[#888888]">relay builds transaction</span></div>
                  <div className="pl-4 text-[#888888]">tx.feePayer = RELAY_KEYPAIR</div>
                  <div className="pl-4 text-[#888888]">tx.add(withdrawInstruction)</div>
                  <div className="mt-2"><span className="text-[#0A0A0A]">4.</span> <span className="text-[#888888]">relay signs and broadcasts</span></div>
                  <div className="pl-4 text-[#888888]">await sendAndConfirmTransaction(tx)</div>
                  <div className="mt-2"><span className="text-[#0A0A0A]">5.</span> <span className="text-[#888888]">funds arrive at recipient</span></div>
                  <div className="pl-4 text-[#888888]">your wallet: absent from tx history</div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-12">Trust model: what you need to believe</h2>
              <div className="border-2 border-[#0A0A0A] font-['JetBrains_Mono'] text-sm divide-y-2 divide-[#0A0A0A]">
                {[
                  ["Can the relay steal my funds?", "No. The ZK proof binds the recipient address. Changing it makes the proof invalid. The on-chain program rejects any transaction where the proof does not match."],
                  ["Can the relay censor my withdrawal?", "In principle yes, it could refuse to broadcast. You can run your own relay or use any compatible fee-payer keypair as an alternative. The relay code is open source."],
                  ["Does the relay see my secret note?", "No. You only send the proof and the nullifier to the relay. The secret note that connects deposit to withdrawal never leaves your browser tab."],
                  ["Is the relay code open source?", "Yes. Review artifacts/api-server/src/routes/relay.ts in the public repository to verify the relay logic yourself."],
                ].map(([q, a]) => (
                  <div key={q as string} className="px-8 py-6">
                    <div className="text-[#FF6B00] mb-3 font-bold">{q}</div>
                    <div className="text-[#555555] font-['Inter'] text-sm leading-relaxed">{a}</div>
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
