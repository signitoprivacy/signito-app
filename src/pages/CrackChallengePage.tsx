import React, { useState } from "react";
import { LandingNavBar } from "../components/LandingNavBar";
import { Footer } from "../components/Footer";

const PRIVATE_KEY = "dnjQ73efCE87kxVFvs4QiEgPmzENpi4zsED5niJn8NR75WGyv2QqW1bfYDSPSvfMSMiQpKzWRhsZz7hRxaTfyLs";
const SSOL_CA = "B6CmtJ8VUeWYwqK8jnEBQGZVweBqBtNxdKBG8n2p4yLw";

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="w-full border border-[#2A2A2A] text-white text-xs font-['JetBrains_Mono'] py-3 px-4 flex items-center justify-between gap-3 hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors group"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
    >
      <span className="truncate text-left">{value}</span>
      <span className={`shrink-0 transition-colors ${copied ? "text-green-400" : "text-[#555555] group-hover:text-[#FF6B00]"}`}>
        {copied ? "copied" : "copy"}
      </span>
    </button>
  );
}

function ScreenshotPlaceholder({ label }: { label: string }) {
  return (
    <div className="border border-dashed border-[#333333] bg-[#111111] flex items-center justify-center h-56 w-full">
      <p className="text-[#555555] text-xs font-['JetBrains_Mono'] text-center px-4">[Screenshot: {label}]</p>
    </div>
  );
}

interface StepProps {
  number: number;
  title: string;
  text: React.ReactNode;
  screenshots: string[];
}

function Step({ number, title, text, screenshots }: StepProps) {
  return (
    <div className="border-t border-[#2A2A2A] py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        <div className="space-y-3">
          {screenshots.map((label) => (
            <ScreenshotPlaceholder key={label} label={label} />
          ))}
        </div>
        <div>
          <div className="flex items-start gap-4 mb-4">
            <span className="font-['JetBrains_Mono'] text-[#FF6B00] text-xl font-bold shrink-0">{String(number).padStart(2, "0")}.</span>
            <h2 className="font-['Space_Grotesk'] text-xl font-bold leading-snug">{title}</h2>
          </div>
          <div className="text-[#888888] text-sm leading-relaxed space-y-3 pl-9">
            {text}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CrackChallengePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-['Inter']">
      <LandingNavBar />

      <main className="pt-32 pb-20">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12">

          <div className="mb-14">
            <span className="tag tag-orange mb-5 inline-block">CRACK CHALLENGE</span>
            <h1 className="font-['Space_Grotesk'] text-4xl md:text-6xl font-bold leading-tight mb-5">
              The private key is public.<br />
              <span className="text-[#FF6B00]">If you can drain it, it's yours.</span>
            </h1>
            <p className="text-[#888888] text-base leading-relaxed max-w-[680px]">
              The private key is yours. The vault is funded. Below are the exact steps to import the wallet, connect to Signito, and attempt to withdraw the funds. If you can do it, the SOL is yours.
            </p>
          </div>

          <div className="border border-[#2A2A2A] bg-[#111111] p-6 mb-14 space-y-4">
            <p className="text-[#888888] font-['JetBrains_Mono'] text-xs tracking-wider uppercase">Shared Private Key</p>
            <CopyButton value={PRIVATE_KEY} label={PRIVATE_KEY} />
            <p className="text-[#555555] text-xs font-['JetBrains_Mono']">
              This is the real private key to the challenge wallet. Import it into any Solana wallet. The vault is on this address.
            </p>
          </div>

          <Step
            number={1}
            title="Import the private key into Phantom"
            screenshots={["Phantom: Import Private Key screen"]}
            text={
              <p>
                Open Phantom wallet. Go to Settings, then click "Add or connect wallet", then choose "Import private key". Paste the key above and confirm. You now have full signing authority over this wallet.
              </p>
            }
          />

          <Step
            number={2}
            title="Visit Signito and connect the wallet"
            screenshots={["Signito app: dashboard after connecting the challenge wallet"]}
            text={
              <p>
                Go to signito.org and click "Launch App" at the top right. When prompted, connect with Phantom and select the wallet you just imported. You will land on the app dashboard.
              </p>
            }
          />

          <Step
            number={3}
            title="Check the vault and try to unshield"
            screenshots={[
              "Signito app: SafeVault unshield panel showing vault code required",
              "Signito app: transaction rejected without vault code",
            ]}
            text={
              <p>
                On the dashboard you will see a SafeVault section. The vault already exists and holds shielded SOL. Click "Unshield" and enter any amount. The program will ask for the vault code. This is where the challenge lives. Without the correct vault code, every attempt will be rejected by the on-chain program.
              </p>
            }
          />

          <Step
            number={4}
            title="Try ZK Transfer (StealthSend)"
            screenshots={["Signito app: StealthSend panel with vault code required"]}
            text={
              <p>
                Go to the StealthSend tab and try to send the shielded balance to any address. This also requires a valid vault code and a one-time proof. The program will reject any attempt that cannot produce the correct proof at the current chain depth.
              </p>
            }
          />

          <Step
            number={5}
            title="Try anything else"
            screenshots={["GitHub: signito-vault program source code"]}
            text={
              <>
                <p>
                  The source code is public on GitHub. The program is OtterSec verified. You can read every instruction, construct custom transactions, call the program directly via CLI, or try any other approach. If you find a way to move the funds without the vault code, they are yours. We want to know how you did it.
                </p>
                <div className="flex gap-3 flex-wrap pt-2">
                  <a
                    href="https://github.com/signitoprivacy/signito-vault"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-sm"
                  >
                    View Source on GitHub
                  </a>
                  <a
                    href="https://verify.osec.io/status/HyciDEYB9hXdmmLMexTHv2QYDaJmuZr1AF7sipBbVLLH"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-sm"
                  >
                    OtterSec Verification
                  </a>
                </div>
              </>
            }
          />

          <div className="border-t border-[#2A2A2A] pt-12 mt-4">
            <h2 className="font-['Space_Grotesk'] text-2xl font-bold mb-6">The vault token is sSOL</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
              <div>
                <ScreenshotPlaceholder label="Phantom: searching sSOL by contract address and marking as not spam" />
              </div>
              <div className="space-y-5">
                <div className="space-y-3 text-[#888888] text-sm leading-relaxed">
                  <p>
                    When SOL is deposited into a Signito vault, the program mints an sSOL token to the depositor's wallet as a receipt. sSOL stands for Shielded SOL. It uses SPL Token-2022 with the NonTransferable extension, which means it cannot be sent from one wallet to another. Only the vault program can move it, and only when a valid vault code proof is provided.
                  </p>
                  <p>
                    Because sSOL is NonTransferable, your wallet may automatically treat it as spam and hide it from your token list. It is still there. You need to add it manually.
                  </p>
                </div>

                <div className="border border-[#2A2A2A] bg-[#111111] p-5 space-y-3">
                  <p className="text-[#888888] font-['JetBrains_Mono'] text-xs tracking-wider uppercase">sSOL Contract Address</p>
                  <CopyButton value={SSOL_CA} label={SSOL_CA} />
                </div>

                <div className="space-y-3">
                  <h3 className="font-['Space_Grotesk'] font-bold text-base">How to add sSOL to Phantom</h3>
                  <ol className="space-y-2 text-[#888888] text-sm leading-relaxed">
                    {[
                      "Copy the sSOL contract address above.",
                      "Open Phantom and go to the tokens tab.",
                      "Tap the search icon and paste the contract address.",
                      "sSOL will appear in results. Tap it.",
                      'Phantom may show a spam warning. Tap "Mark as not spam" to confirm and add it to your list.',
                    ].map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="font-['JetBrains_Mono'] text-[#FF6B00] shrink-0">{String(i + 1).padStart(2, "0")}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#2A2A2A] pt-10 mt-12 text-center">
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
