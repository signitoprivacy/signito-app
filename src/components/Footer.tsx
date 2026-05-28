import React from "react";
import { Link } from "wouter";
import signitoLogoUrl from "@assets/signito-logo-nobg.png";

export function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-[#1A1A1A]">
      <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-16 md:py-20">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">

          {/* Left: brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-3 no-underline mb-6 w-fit">
              <img src={signitoLogoUrl} alt="Signito" className="w-9 h-9 object-contain" />
              <span className="font-['Space_Grotesk'] font-bold text-white tracking-[0.18em] text-base">SIGNITO</span>
            </Link>
            <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed mb-8">
              Non-custodial transaction privacy on Solana. Shield assets, send anonymously, sign offline.
            </p>
            <p className="text-[#333333] font-['JetBrains_Mono'] text-xs mb-6">
              {new Date().getFullYear()} Signito Protocol
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://x.com/signitoprivacy"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
                className="text-[#555555] hover:text-white transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
                </svg>
              </a>
              <a
                href="https://github.com/signitoprivacy"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-[#555555] hover:text-white transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 1: Product */}
          <div>
            <h4 className="font-['Space_Grotesk'] font-bold text-[#FF6B00] text-sm mb-6">Product</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/features/safevault" className="text-[#888888] hover:text-white text-sm font-['Inter'] transition-colors no-underline block">
                  Shielded Vault
                </Link>
              </li>
              <li>
                <Link href="/features/stealthsend" className="text-[#888888] hover:text-white text-sm font-['Inter'] transition-colors no-underline block">
                  StealthSend
                </Link>
              </li>
              <li>
                <Link href="/features/airsign" className="text-[#888888] hover:text-white text-sm font-['Inter'] transition-colors no-underline block">
                  AirSign
                </Link>
              </li>
              <li>
                <Link href="/crack" className="text-[#888888] hover:text-[#FF6B00] text-sm font-['Inter'] transition-colors no-underline block">
                  Crack Challenge
                </Link>
              </li>
              <li>
                <Link href="/app" className="text-[#888888] hover:text-white text-sm font-['Inter'] transition-colors no-underline block">
                  Launch App
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Developers */}
          <div>
            <h4 className="font-['Space_Grotesk'] font-bold text-[#FF6B00] text-sm mb-6">Developers</h4>
            <ul className="space-y-4">
              <li>
                <a href="/docs/" className="text-[#888888] hover:text-white text-sm font-['Inter'] transition-colors no-underline block">
                  Documentation
                </a>
              </li>
              <li>
                <a href="/docs/quick-start" className="text-[#888888] hover:text-white text-sm font-['Inter'] transition-colors no-underline block">
                  Quick Start
                </a>
              </li>
              <li>
                <a href="/docs/api-reference" className="text-[#888888] hover:text-white text-sm font-['Inter'] transition-colors no-underline block">
                  API Reference
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Help */}
          <div>
            <h4 className="font-['Space_Grotesk'] font-bold text-[#FF6B00] text-sm mb-6">Help</h4>
            <ul className="space-y-4">
              <li>
                <a href="/docs/faq" className="text-[#888888] hover:text-white text-sm font-['Inter'] transition-colors no-underline block">
                  FAQ
                </a>
              </li>
              <li>
                <Link href="/status" className="text-[#888888] hover:text-white text-sm font-['Inter'] transition-colors no-underline block">
                  System Status
                </Link>
              </li>
              <li>
                <a href="/docs/" className="text-[#888888] hover:text-white text-sm font-['Inter'] transition-colors no-underline block">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/docs/" className="text-[#888888] hover:text-white text-sm font-['Inter'] transition-colors no-underline block">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

        </div>

      </div>
    </footer>
  );
}
