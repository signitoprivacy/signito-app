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
            <p className="text-[#333333] font-['JetBrains_Mono'] text-xs">
              {new Date().getFullYear()} Signito Protocol
            </p>
          </div>

          {/* Column 1: Product */}
          <div>
            <h4 className="font-['Space_Grotesk'] font-bold text-[#FF6B00] text-sm mb-6">Product</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/features/safevault" className="text-[#888888] hover:text-white text-sm font-['Inter'] transition-colors no-underline block">
                  SafeVault
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
                <Link href="/docs/" className="text-[#888888] hover:text-white text-sm font-['Inter'] transition-colors no-underline block">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/docs/" className="text-[#888888] hover:text-white text-sm font-['Inter'] transition-colors no-underline block">
                  Quick Start
                </Link>
              </li>
              <li>
                <Link href="/docs/" className="text-[#888888] hover:text-white text-sm font-['Inter'] transition-colors no-underline block">
                  API Reference
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Help */}
          <div>
            <h4 className="font-['Space_Grotesk'] font-bold text-[#FF6B00] text-sm mb-6">Help</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/docs/" className="text-[#888888] hover:text-white text-sm font-['Inter'] transition-colors no-underline block">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/status" className="text-[#888888] hover:text-white text-sm font-['Inter'] transition-colors no-underline block">
                  System Status
                </Link>
              </li>
              <li>
                <Link href="/docs/" className="text-[#888888] hover:text-white text-sm font-['Inter'] transition-colors no-underline block">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/docs/" className="text-[#888888] hover:text-white text-sm font-['Inter'] transition-colors no-underline block">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

        </div>

      </div>
    </footer>
  );
}
