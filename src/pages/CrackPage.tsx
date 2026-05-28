import React, { useState } from "react";
import { Link } from "wouter";
import { LandingNavBar } from "../components/LandingNavBar";
import { Footer } from "../components/Footer";

const PRIVATE_KEY = "dnjQ73efCE87kxVFvs4QiEgPmzENpi4zsED5niJn8NR75WGyv2QqW1bfYDSPSvfMSMiQpKzWRhsZz7hRxaTfyLs";
const PROGRAM_ID = "HyciDEYB9hXdmmLMexTHv2QYDaJmuZr1AF7sipBbVLLH";

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="card md:col-span-2">
      <h3 className="text-[#888888] font-['JetBrains_Mono'] text-xs tracking-wider uppercase mb-2">{label}</h3>
      <button
        className="w-full flex items-center justify-between gap-3 group"
        onClick={() => {
          void navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          });
        }}
      >
        <span className="font-['JetBrains_Mono'] text-sm break-all text-left text-white">{value}</span>
        <span className={`shrink-0 font-['JetBrains_Mono'] text-xs transition-colors ${copied ? "text-green-400" : "text-[#555555] group-hover:text-[#FF6B00]"}`}>
          {copied ? "copied" : "copy"}
        </span>
      </button>
    </div>
  );
}

export default function CrackPage() {
  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] font-['Inter']">
      <LandingNavBar />

      <main className="pt-32 pb-20">
        <div className="max-w-[860px] mx-auto px-8 md:px-16">

          <div className="mb-12">
            <span className="tag tag-orange mb-6 inline-block">CRACK CHALLENGE</span>
            <h1 className="font-['Space_Grotesk'] text-4xl md:text-6xl font-bold leading-tight mb-4">
              The private key is public. The vault is funded.
            </h1>
            <p className="font-['Space_Grotesk'] text-3xl md:text-4xl font-bold text-[#FF6B00] leading-tight mb-10">
              If you can drain it, it's yours.
            </p>

            <div className="space-y-5 text-[#444444] leading-relaxed text-base max-w-[680px]">
              <p>
                Signito is built around two promises: privacy and security. Privacy means your transactions cannot be traced back to you. Security means even if your wallet is fully compromised, your funds stay protected. Most protocols offer one or the other. Signito was designed to deliver both at the same time.
              </p>
              <p>
                The program running this vault is open source. The code is publicly available on GitHub. It has been independently verified by OtterSec, one of the most respected audit firms in the Solana ecosystem. The on-chain binary matches the published source code exactly. There is nothing hidden. Anyone with the skills can read every line, every instruction, every check the program performs before releasing funds.
              </p>
              <p>
                If there is a flaw in the logic, it should be easy to exploit. If the security claim is wrong, the money should be trivial to take. We are putting that to the test.
              </p>
              <p>
                We loaded real SOL into a Signito vault, then published the private key to this wallet right here, for anyone in the world to see and use. A private key normally gives complete control over a wallet. In any normal situation, that SOL would be gone within minutes.
              </p>
              <p>
                It is not gone. Because Signito splits control into two separate layers. The private key controls the wallet. The vault code controls the vault. Before releasing a single lamport, the Solana program demands a valid one-time proof derived from the vault code, a secret that only the original depositor knows. It is never stored on-chain, never visible in any transaction, and cannot be derived from the private key. The program enforces this at the contract level, with no override and no exception.
              </p>
              <p>
                The private key is right here. The source code is public. The audit is on record. The SOL is still in the vault. Take your shot.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div className="card">
              <h3 className="text-[#888888] font-['JetBrains_Mono'] text-xs tracking-wider uppercase mb-2">Network</h3>
              <p className="font-['Space_Grotesk'] font-bold text-lg">Solana Mainnet</p>
            </div>
            <div className="card">
              <h3 className="text-[#888888] font-['JetBrains_Mono'] text-xs tracking-wider uppercase mb-2">Status</h3>
              <p className="font-['Space_Grotesk'] font-bold text-lg text-[#FF6B00]">Live</p>
            </div>
            <div className="card">
              <h3 className="text-[#888888] font-['JetBrains_Mono'] text-xs tracking-wider uppercase mb-2">Vault Code</h3>
              <p className="font-['Space_Grotesk'] font-bold">Secret. You figure it out.</p>
            </div>
            <div className="card">
              <h3 className="text-[#888888] font-['JetBrains_Mono'] text-xs tracking-wider uppercase mb-2">Prize</h3>
              <p className="font-['Space_Grotesk'] font-bold text-[#FF6B00]">All vault funds</p>
            </div>
            <CopyField label="Shared Private Key" value={PRIVATE_KEY} />
            <CopyField label="Program ID (OtterSec Verified)" value={PROGRAM_ID} />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link href="/crack/challenge" className="btn-primary text-center">
              Take the Challenge
            </Link>
            <a
              href="https://github.com/signitoprivacy/signito-vault"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-center"
            >
              View Source on GitHub
            </a>
          </div>

          <div className="border-t border-[#E0E0E0] pt-10 text-center">
            <p className="text-[#888888] text-sm font-['JetBrains_Mono']">
              Live on Solana Mainnet. Real funds. No time limit.
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
