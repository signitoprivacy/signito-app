import React from "react";
import { LandingNavBar } from "../components/LandingNavBar";
import { Footer } from "../components/Footer";
import sketchNonCustodial from "../assets/sketch-noncustodial-flow.png";
import signitoLogoUrl from "@assets/signito-logo-nobg.png";

const MountainDivider = () => (
  <svg className="absolute top-0 left-0 w-full pointer-events-none"
    style={{ transform: "translateY(-99%)", overflow: "visible" }}
    viewBox="0 0 1440 120" preserveAspectRatio="none" fill="#FFFFFF"
    overflow="visible" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,120 L0,90 L180,10 L360,80 L540,5 L720,75 L900,0 L1080,70 L1200,20 L1350,-130 L1440,-60 L1440,120 Z" />
  </svg>
);

export default function LearnNonCustodialPage() {
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
              <h1 className="font-['Space_Grotesk'] text-5xl md:text-7xl font-bold mb-6 leading-tight">Non-Custodial Guarantee</h1>
              <p className="text-[#888888] font-['Inter'] text-lg max-w-xl leading-relaxed">
                Non-custodial means there is no company, server, or person that holds your funds on your behalf. The only entity that controls your funds is the on-chain Solana program, and the only way it moves funds is when the cryptographic condition is satisfied.
              </p>
            </div>
            <div className="hidden md:block border border-[#1A1A1A] overflow-hidden">
              <img src={sketchNonCustodial} alt="Non-custodial flow: you, program, funds" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Post-hero white content */}
        <div className="relative z-10 bg-white text-[#0A0A0A]">
          <MountainDivider />

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-8">What this means in plain terms</h2>
              <p className="text-[#555555] font-['Inter'] text-lg leading-relaxed max-w-3xl mb-12">
                Every Signito feature enforces its logic in a Solana program that runs on the blockchain. The program has no admin key, no upgrade authority that can access funds, and no back door. Once you deposit, the only way the funds move is when the correct proof or reveal is provided.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#E0E0E0]">
                {[
                  { title: "SafeVault", body: "Withdrawals require a valid OTS pre-image from your PBKDF2 chain. The program cannot be instructed by Signito, by a court order, or by anyone to bypass this check. The code is the rule." },
                  { title: "StealthSend", body: "Withdrawals require a valid Groth16 proof that satisfies the circuit. The pool contract has no admin function. No one can censor a valid withdrawal or redirect funds to a different address." },
                  { title: "AirSign", body: "Voucher redemption verifies an Ed25519 signature against the public key derived from the vault. The program does not know who the signer is, only whether the signature is cryptographically correct." },
                ].map((item, i) => (
                  <div key={item.title} className={`p-10 ${i < 2 ? "border-r border-[#E0E0E0]" : ""}`}>
                    <h3 className="font-['Space_Grotesk'] font-bold text-[#FF6B00] text-xl mb-4">{item.title}</h3>
                    <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-12">Common questions</h2>
              <div className="space-y-4">
                {[
                  { q: "Can Signito freeze my vault?", a: "No. The program has no admin key and no freeze instruction. Once you create a vault, only a valid OTS reveal from your chain can move the funds. There is no way for anyone, including Signito, to override this." },
                  { q: "Can Signito see my vault code?", a: "No. Vault codes are entered in your browser and used to derive keys entirely in your device's memory. They are never sent to any server. Signito cannot see them even if it wanted to." },
                  { q: "What happens if Signito shuts down?", a: "The on-chain programs continue to operate regardless of whether Signito the company exists. The frontend is open source, so anyone can run a replacement interface. Your funds are not contingent on Signito being online." },
                  { q: "Do I need to create an account or verify my identity?", a: "No. The protocol is permissionless. There is no account registration, no email address, no identity check, and no compliance gate of any kind. You interact directly with the Solana program." },
                  { q: "Can Signito take a fee from my withdrawal without asking?", a: "No. The withdrawal amount is specified in the proof or reveal and enforced on-chain. The program cannot silently deduct any amount that was not part of the original transaction parameters." },
                ].map((item) => (
                  <div key={item.q} className="border-2 border-[#0A0A0A] p-8">
                    <h3 className="font-['Space_Grotesk'] font-bold text-[#0A0A0A] text-lg mb-3">{item.q}</h3>
                    <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed">{item.a}</p>
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
