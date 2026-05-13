import React from "react";
import { Link } from "wouter";
import { LandingNavBar } from "../components/LandingNavBar";
import { Footer } from "../components/Footer";
import { HeroGlobe } from "../components/HeroGlobe";
import { useGetPlatformStats } from "@workspace/api-client-react";
import signitoLogoUrl from "@assets/signito-logo-nobg.png";
import sketchStep01 from "../assets/sketch-step01-wallet.png";
import sketchStep02 from "../assets/sketch-step02-chain.png";
import sketchStep03 from "../assets/sketch-step03-paths.png";
import sketchStep04 from "../assets/sketch-step04-withdraw.png";

export default function LandingPage() {
  const { data: platformStats } = useGetPlatformStats();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-['Inter'] overflow-x-hidden">
      <LandingNavBar />

      <main>
        {/* Hero: full viewport, 2-col layout with globe */}
        <div className="min-h-screen flex flex-col relative overflow-hidden z-0" style={{ isolation: "isolate" }}>

          {/* Globe: absolutely positioned, large, half-visible on right */}
          <div
            className="hidden md:block absolute pointer-events-none"
            style={{
              left: "68%",
              top: "50%",
              transform: "translateY(-50%)",
              width: "clamp(860px, 100vh, 1260px)",
              height: "clamp(860px, 100vh, 1260px)",
            }}
            aria-hidden="true"
          >
            <HeroGlobe />
          </div>

          {/* Text content: left side */}
          <div className="flex items-start">
            <div className="w-full max-w-[3200px] mx-auto px-8 md:px-16 pt-[20vh] pb-10 relative z-10">
              <div className="max-w-2xl">
                <h1 className="font-['Space_Grotesk'] text-4xl md:text-5xl lg:text-[56px] font-bold mb-3 tracking-tight leading-tight">
                  Signito Makes<br />Every Signature<span className="text-[#FF6B00]"> Incognito</span>
                </h1>
                <p className="text-[#888888] text-lg mb-12 max-w-lg">
                  Signito is a non-custodial privacy protocol on Solana that lets you shield SPL assets, send transactions anonymously through zero-knowledge proofs, and sign vouchers offline without ever exposing your wallet identity.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Link href="/app" className="btn-primary" data-testid="button-launch-app">Launch App</Link>
                  <Link href="/docs/" className="btn-secondary" data-testid="button-read-docs">Read the docs</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: 3 feature cards */}
          <div className="w-full pt-10 pb-6 relative z-10">
            <div className="max-w-[1200px] mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-4">

              <Link href="/features/safevault" className="hero-news-card group no-underline" data-testid="card-safevault">
                <div className="hero-news-thumb bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center justify-center">
                  <span className="font-['JetBrains_Mono'] text-[#FF6B00] font-bold text-lg">OTS</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-['Space_Grotesk'] font-bold text-white text-sm mb-1 group-hover:text-[#FF6B00] transition-colors">SafeVault: OTS Protocol Shield</p>
                  <p className="text-[#888888] text-xs leading-snug">Deposit SPL tokens behind a PBKDF2 hash chain. Withdraw with OTS reveals, never your private key.</p>
                  <span className="text-[#FF6B00] text-xs font-['Space_Grotesk'] font-bold mt-2 inline-flex items-center gap-1">
                    Open SafeVault <span aria-hidden="true">›</span>
                  </span>
                </div>
              </Link>

              <Link href="/features/stealthsend" className="hero-news-card group no-underline" data-testid="card-stealthsend">
                <div className="hero-news-thumb bg-white/5 border border-white/15 flex items-center justify-center">
                  <span className="font-['JetBrains_Mono'] text-white font-bold text-lg">ZK</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-['Space_Grotesk'] font-bold text-white text-sm mb-1 group-hover:text-[#FF6B00] transition-colors">StealthSend: ZK Privacy Pool</p>
                  <p className="text-[#888888] text-xs leading-snug">Deposit to the anonymity pool and withdraw to a fresh address using Groth16 zero-knowledge proofs.</p>
                  <span className="text-[#FF6B00] text-xs font-['Space_Grotesk'] font-bold mt-2 inline-flex items-center gap-1">
                    Open StealthSend <span aria-hidden="true">›</span>
                  </span>
                </div>
              </Link>

              <Link href="/features/airsign" className="hero-news-card group no-underline" data-testid="card-airsign">
                <div className="hero-news-thumb bg-[#2A2A2A] border border-[#3A3A3A] flex items-center justify-center">
                  <span className="font-['JetBrains_Mono'] text-[#888888] font-bold text-xs tracking-widest">AIR</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-['Space_Grotesk'] font-bold text-white text-sm mb-1 group-hover:text-[#FF6B00] transition-colors">AirSign: Offline Vouchers</p>
                  <p className="text-[#888888] text-xs leading-snug">Generate Ed25519 signatures on an air-gapped device. Redeem vouchers on-chain when back online.</p>
                  <span className="text-[#FF6B00] text-xs font-['Space_Grotesk'] font-bold mt-2 inline-flex items-center gap-1">
                    Open AirSign <span aria-hidden="true">›</span>
                  </span>
                </div>
              </Link>

            </div>
          </div>

        </div>

        {/* Features section: white bg, white mountain peaks cut up into the black hero */}
        <div id="features" className="relative z-10 bg-white mt-40 min-h-screen flex flex-col justify-center px-8 md:px-16 py-24">
          {/* White SVG mountain: overlaps the black hero above */}
          <svg
            className="absolute top-0 left-0 w-full pointer-events-none"
            style={{ transform: "translateY(-99%)", overflow: "visible" }}
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            fill="#FFFFFF"
            overflow="visible"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0,120 L0,90 L180,10 L360,80 L540,5 L720,75 L900,0 L1080,70 L1200,20 L1350,-130 L1440,-60 L1440,120 Z" />
          </svg>

          {/* Animated nodes travelling along the mountain jagged edge */}
          <svg
            className="absolute top-0 left-0 w-full pointer-events-none"
            style={{ transform: "translateY(-99%)", zIndex: 10, overflow: "visible" }}
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            overflow="visible"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <path
                id="ridgeLine"
                d="M-80,90 L0,90 L180,10 L360,80 L540,5 L720,75 L900,0 L1080,70 L1200,20 L1350,-130 L1440,-60 L1520,-60"
              />
            </defs>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <g key={i}>
                <animateMotion
                  dur="18s"
                  repeatCount="indefinite"
                  begin={`${-(i * 18) / 7}s`}
                  rotate="0"
                >
                  <mpath href="#ridgeLine" />
                </animateMotion>
                <circle r="7" fill="#0A0A0A" stroke="#FF6B00" strokeWidth="1.5" />
                <image
                  href={signitoLogoUrl}
                  x="-5"
                  y="-5"
                  width="10"
                  height="10"
                  preserveAspectRatio="xMidYMid meet"
                />
              </g>
            ))}
          </svg>

          {/* Sketch ballpoint-pen node network: decorative background behind cards */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none select-none"
            viewBox="0 0 1440 520"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Edges */}
            <g stroke="rgba(30,30,30,0.09)" strokeWidth="0.9" strokeLinecap="round" fill="none">
              <line x1="72" y1="45" x2="210" y2="30" /><line x1="210" y1="30" x2="380" y2="72" />
              <line x1="380" y1="72" x2="520" y2="28" /><line x1="520" y1="28" x2="680" y2="58" />
              <line x1="680" y1="58" x2="820" y2="38" /><line x1="820" y1="38" x2="960" y2="66" />
              <line x1="960" y1="66" x2="1100" y2="30" /><line x1="1100" y1="30" x2="1270" y2="52" />
              <line x1="1270" y1="52" x2="1410" y2="42" />
              <line x1="72" y1="45" x2="140" y2="145" /><line x1="210" y1="30" x2="300" y2="162" />
              <line x1="380" y1="72" x2="460" y2="134" /><line x1="520" y1="28" x2="620" y2="158" />
              <line x1="680" y1="58" x2="750" y2="124" /><line x1="820" y1="38" x2="900" y2="152" />
              <line x1="960" y1="66" x2="1050" y2="134" /><line x1="1100" y1="30" x2="1190" y2="162" />
              <line x1="1270" y1="52" x2="1360" y2="142" />
              <line x1="140" y1="145" x2="300" y2="162" /><line x1="300" y1="162" x2="460" y2="134" />
              <line x1="460" y1="134" x2="620" y2="158" /><line x1="620" y1="158" x2="750" y2="124" />
              <line x1="750" y1="124" x2="900" y2="152" /><line x1="900" y1="152" x2="1050" y2="134" />
              <line x1="1050" y1="134" x2="1190" y2="162" /><line x1="1190" y1="162" x2="1360" y2="142" />
              <line x1="140" y1="145" x2="82" y2="245" /><line x1="300" y1="162" x2="220" y2="262" />
              <line x1="460" y1="134" x2="390" y2="234" /><line x1="620" y1="158" x2="560" y2="258" />
              <line x1="750" y1="124" x2="700" y2="234" /><line x1="900" y1="152" x2="840" y2="262" />
              <line x1="1050" y1="134" x2="1000" y2="244" /><line x1="1190" y1="162" x2="1150" y2="258" />
              <line x1="1360" y1="142" x2="1310" y2="238" />
              <line x1="82" y1="245" x2="220" y2="262" /><line x1="220" y1="262" x2="390" y2="234" />
              <line x1="390" y1="234" x2="560" y2="258" /><line x1="560" y1="258" x2="700" y2="234" />
              <line x1="700" y1="234" x2="840" y2="262" /><line x1="840" y1="262" x2="1000" y2="244" />
              <line x1="1000" y1="244" x2="1150" y2="258" /><line x1="1150" y1="258" x2="1310" y2="238" />
              <line x1="82" y1="245" x2="162" y2="352" /><line x1="220" y1="262" x2="340" y2="334" />
              <line x1="390" y1="234" x2="500" y2="362" /><line x1="560" y1="258" x2="660" y2="342" />
              <line x1="700" y1="234" x2="800" y2="362" /><line x1="840" y1="262" x2="960" y2="348" />
              <line x1="1000" y1="244" x2="1120" y2="362" /><line x1="1150" y1="258" x2="1280" y2="348" />
              <line x1="162" y1="352" x2="340" y2="334" /><line x1="340" y1="334" x2="500" y2="362" />
              <line x1="500" y1="362" x2="660" y2="342" /><line x1="660" y1="342" x2="800" y2="362" />
              <line x1="800" y1="362" x2="960" y2="348" /><line x1="960" y1="348" x2="1120" y2="362" />
              <line x1="1120" y1="362" x2="1280" y2="348" /><line x1="1280" y1="348" x2="1430" y2="360" />
              <line x1="162" y1="352" x2="92" y2="445" /><line x1="340" y1="334" x2="252" y2="458" />
              <line x1="500" y1="362" x2="430" y2="434" /><line x1="660" y1="342" x2="600" y2="452" />
              <line x1="800" y1="362" x2="772" y2="438" /><line x1="960" y1="348" x2="950" y2="452" />
              <line x1="1120" y1="362" x2="1102" y2="442" /><line x1="1280" y1="348" x2="1282" y2="458" />
              <line x1="92" y1="445" x2="252" y2="458" /><line x1="252" y1="458" x2="430" y2="434" />
              <line x1="430" y1="434" x2="600" y2="452" /><line x1="600" y1="452" x2="772" y2="438" />
              <line x1="772" y1="438" x2="950" y2="452" /><line x1="950" y1="452" x2="1102" y2="442" />
              <line x1="1102" y1="442" x2="1282" y2="458" /><line x1="1282" y1="458" x2="1422" y2="448" />
              {/* diagonal cross-links */}
              <line x1="140" y1="145" x2="460" y2="134" /><line x1="620" y1="158" x2="1050" y2="134" />
              <line x1="220" y1="262" x2="560" y2="258" /><line x1="700" y1="234" x2="1150" y2="258" />
              <line x1="340" y1="334" x2="660" y2="342" /><line x1="800" y1="362" x2="1280" y2="348" />
            </g>
            {/* Nodes: regular */}
            <g fill="none" stroke="rgba(30,30,30,0.14)" strokeWidth="1">
              {[
                [72,45],[210,30],[380,72],[520,28],[680,58],[820,38],[960,66],[1100,30],[1270,52],[1410,42],
                [140,145],[300,162],[460,134],[620,158],[750,124],[900,152],[1050,134],[1190,162],[1360,142],
                [82,245],[220,262],[390,234],[560,258],[700,234],[840,262],[1000,244],[1150,258],[1310,238],
                [162,352],[340,334],[500,362],[660,342],[800,362],[960,348],[1120,362],[1280,348],[1430,360],
                [92,445],[252,458],[430,434],[600,452],[772,438],[950,452],[1102,442],[1282,458],[1422,448],
              ].map(([cx,cy], idx) => (
                <circle key={idx} cx={cx} cy={cy} r="3" />
              ))}
            </g>
            {/* Accent nodes: faint orange */}
            <g fill="rgba(255,107,0,0.18)" stroke="rgba(255,107,0,0.35)" strokeWidth="1">
              {[[520,28],[750,124],[1000,244],[660,342],[252,458]].map(([cx,cy], idx) => (
                <circle key={idx} cx={cx} cy={cy} r="5" />
              ))}
            </g>
          </svg>

          <div className="max-w-[1200px] mx-auto relative z-10">
            <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-12 text-[#0A0A0A] text-center">Three ways to protect your transactions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div className="border-[3px] border-[#D0D0D0] p-8 bg-white hover:border-[#FF6B00] transition-colors group">
                <span className="tag tag-orange mb-6">OTS</span>
                <h3 className="font-['Space_Grotesk'] text-xl font-bold mb-4 text-[#0A0A0A] group-hover:text-[#FF6B00] transition-colors">OTS Protocol Vault</h3>
                <p className="text-[#555555] text-sm leading-relaxed mb-8">
                  Shield funds using a PBKDF2 hash chain. Reveal pre-images to authorize transfers without exposing your private key.
                </p>
                <Link href="/app" className="text-[#0A0A0A] font-['Space_Grotesk'] font-bold text-sm underline underline-offset-4 decoration-[#AAAAAA] hover:decoration-[#FF6B00] transition-colors">
                  Open SafeVault
                </Link>
              </div>

              <div className="border-[3px] border-[#D0D0D0] p-8 bg-white hover:border-[#FF6B00] transition-colors group">
                <span className="tag tag-orange mb-6">ZK</span>
                <h3 className="font-['Space_Grotesk'] text-xl font-bold mb-4 text-[#0A0A0A] group-hover:text-[#FF6B00] transition-colors">ZK Privacy Transfer</h3>
                <p className="text-[#555555] text-sm leading-relaxed mb-8">
                  Deposit to the anonymity pool and unshield to a fresh address using Groth16 zero-knowledge proofs.
                </p>
                <Link href="/app" className="text-[#0A0A0A] font-['Space_Grotesk'] font-bold text-sm underline underline-offset-4 decoration-[#AAAAAA] hover:decoration-[#FF6B00] transition-colors">
                  Open StealthSend
                </Link>
              </div>

              <div className="border-[3px] border-[#D0D0D0] p-8 bg-white hover:border-[#FF6B00] transition-colors group">
                <span className="tag tag-orange mb-6">OFFLINE</span>
                <h3 className="font-['Space_Grotesk'] text-xl font-bold mb-4 text-[#0A0A0A] group-hover:text-[#FF6B00] transition-colors">Offline Voucher</h3>
                <p className="text-[#555555] text-sm leading-relaxed mb-8">
                  Generate Ed25519 signatures on an air-gapped device. Redeem vouchers on-chain when you return online.
                </p>
                <Link href="/app" className="text-[#0A0A0A] font-['Space_Grotesk'] font-bold text-sm underline underline-offset-4 decoration-[#AAAAAA] hover:decoration-[#FF6B00] transition-colors">
                  Open AirSign
                </Link>
              </div>

            </div>
          </div>

          {/* Down arrow: click to jump to section 3 */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <a
              href="#how-it-works"
              className="w-11 h-11 border-2 border-[#0A0A0A] flex items-center justify-center text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#EFEFEF] transition-colors animate-bounce"
              aria-label="Scroll to next section"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </a>
          </div>
        </div>

        {/* Section 3: How it works */}
        <div id="how-it-works" className="relative bg-[#0A0A0A] z-10">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, #2A2A2A 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />

          {/* Centered headline block */}
          <div className="max-w-[1200px] mx-auto px-8 md:px-16 pt-28 pb-20 text-center relative z-10">
            <span className="font-['JetBrains_Mono'] text-[#FF6B00] text-xs tracking-[0.25em] block mb-6 uppercase">How it works</span>
            <h2 className="font-['Space_Grotesk'] text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
              Privacy in four steps.<br />
              <span className="text-[#FF6B00]">No custodian. No mixer.</span>
            </h2>
            <p className="text-[#555555] text-lg max-w-5xl mx-auto leading-relaxed text-balance">
              Every operation is a direct on-chain instruction signed by your wallet. No funds pass through a third party, no custodian holds your keys. Signito handles only the cryptographic scaffolding: OTS hash chains, Groth16 ZK proofs, and Ed25519 offline vouchers.
            </p>
          </div>

          {/* 4 steps: full-width 2-col rows separated by borders */}
          <div className="border-t border-[#1A1A1A] relative z-10">

            {/* Step 01 */}
            <div className="border-b border-[#1A1A1A] group hover:bg-[#0A0A0A]/80 transition-colors">
              <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-16 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">
                <div>
                  <span className="font-['JetBrains_Mono'] text-[#FF6B00] text-6xl font-bold block mb-8 leading-none">01</span>
                  <h3 className="font-['Space_Grotesk'] text-2xl md:text-3xl font-bold text-white mb-5 group-hover:text-[#FF6B00] transition-colors leading-tight">
                    Connect your Solana wallet
                  </h3>
                  <p className="text-[#666666] leading-relaxed mb-8">
                    Link any Solana wallet, Phantom, Backpack, or Solflare, to the Solana cluster. Signito uses the Wallet Standard adapter so no custom plugin is required. Your private key stays in your wallet at all times; the protocol never sees it.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <span className="font-['JetBrains_Mono'] text-xs border border-[#2A2A2A] px-3 py-1.5 text-[#555555]">Phantom</span>
                    <span className="font-['JetBrains_Mono'] text-xs border border-[#2A2A2A] px-3 py-1.5 text-[#555555]">Backpack</span>
                    <span className="font-['JetBrains_Mono'] text-xs border border-[#2A2A2A] px-3 py-1.5 text-[#555555]">Solflare</span>
                  </div>
                </div>
                <div className="border border-[#1A1A1A] overflow-hidden">
                  <img src={sketchStep01} alt="Wallet connection flow diagram" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Step 02 */}
            <div className="border-b border-[#1A1A1A] group hover:bg-[#0A0A0A]/80 transition-colors">
              <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-16 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">
                <div className="md:order-2">
                  <span className="font-['JetBrains_Mono'] text-[#FF6B00] text-6xl font-bold block mb-8 leading-none">02</span>
                  <h3 className="font-['Space_Grotesk'] text-2xl md:text-3xl font-bold text-white mb-5 group-hover:text-[#FF6B00] transition-colors leading-tight">
                    Shield assets into SafeVault
                  </h3>
                  <p className="text-[#666666] leading-relaxed mb-8">
                    Deposit SOL or any SPL token into a SafeVault. The protocol derives a PBKDF2 hash chain from your vault code and mints a sToken receipt (sSOL, sUSDC). The on-chain balance is publicly visible, but every withdrawal requires the next OTS pre-image from the chain.
                  </p>
                  <Link href="/app" className="font-['Space_Grotesk'] text-sm font-bold text-[#FF6B00] hover:text-white transition-colors no-underline">
                    Open SafeVault &rsaquo;
                  </Link>
                </div>
                <div className="md:order-1 border border-[#1A1A1A] overflow-hidden">
                  <img src={sketchStep02} alt="PBKDF2 hash chain diagram" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Step 03 */}
            <div className="border-b border-[#1A1A1A] group hover:bg-[#0A0A0A]/80 transition-colors">
              <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-16 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">
                <div>
                  <span className="font-['JetBrains_Mono'] text-[#FF6B00] text-6xl font-bold block mb-8 leading-none">03</span>
                  <h3 className="font-['Space_Grotesk'] text-2xl md:text-3xl font-bold text-white mb-5 group-hover:text-[#FF6B00] transition-colors leading-tight">
                    Shield, send, or sign privately
                  </h3>
                  <p className="text-[#666666] leading-relaxed mb-8">
                    Three privacy paths depending on your use case. Reveal an OTS pre-image for a SafeVault withdrawal. Submit a Groth16 ZK proof to StealthSend funds to a fresh address with no on-chain link. Or sign an Ed25519 offline voucher via AirSign and deliver it by QR code without internet.
                  </p>
                  <div className="space-y-4">
                    {[
                      ["SafeVault", "OTS pre-image reveal"],
                      ["StealthSend", "Groth16 ZK proof"],
                      ["AirSign", "Ed25519 offline signature"],
                    ].map(([label, detail]) => (
                      <div key={label} className="flex items-center gap-6 border-b border-[#1A1A1A] pb-4">
                        <span className="font-['JetBrains_Mono'] text-[#FF6B00] text-sm w-32 shrink-0">{label}</span>
                        <span className="font-['JetBrains_Mono'] text-[#555555] text-sm">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border border-[#1A1A1A] overflow-hidden">
                  <img src={sketchStep03} alt="Three privacy paths diagram" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Step 04 */}
            <div className="border-b border-[#1A1A1A] group hover:bg-[#0A0A0A]/80 transition-colors">
              <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-16 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">
                <div className="md:order-2">
                  <span className="font-['JetBrains_Mono'] text-[#FF6B00] text-6xl font-bold block mb-8 leading-none">04</span>
                  <h3 className="font-['Space_Grotesk'] text-2xl md:text-3xl font-bold text-white mb-5 group-hover:text-[#FF6B00] transition-colors leading-tight">
                    Withdraw and exit clean
                  </h3>
                  <p className="text-[#666666] leading-relaxed mb-8">
                    Unshield assets back to any public address. The on-chain record contains a valid proof or pre-image but reveals nothing about the origin. No mixer, no delay, no counterparty. A single slot confirmation and the funds are at a fresh address with no traceable link to the vault.
                  </p>
                  <div className="grid grid-cols-2 gap-px border border-[#1A1A1A]">
                    {[
                      ["origin link", "none"],
                      ["delay", "~400ms"],
                      ["counterparty", "none"],
                      ["verification", "on-chain"],
                    ].map(([k, v]) => (
                      <div key={k} className="p-6 bg-[#060606] font-['JetBrains_Mono']">
                        <div className="text-[#444444] text-sm mb-2">{k}</div>
                        <div className="text-[#FF6B00] font-bold text-base">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="md:order-1 border border-[#1A1A1A] overflow-hidden">
                  <img src={sketchStep04} alt="Withdrawal flow diagram" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Section 4: Platform Stats */}
        <div className="relative bg-white py-32 px-8 md:px-16 z-10">
          <div className="max-w-[1200px] mx-auto">

            {/* Headline */}
            <div className="text-center mb-20">
              <h2 className="font-['Space_Grotesk'] text-4xl md:text-6xl font-bold text-[#0A0A0A] leading-tight">
                One protocol. <span className="text-[#FF6B00]">Zero custody.</span>
              </h2>
              <p className="text-[#555555] mt-4 font-['Inter'] text-base max-w-4xl mx-auto text-balance">
                Every vault created, every transaction shielded, every one-time code consumed, and every unit of value held in custody is pulled live from the Signito protocol on Solana. There is no caching, no estimation, and no interpolation. What you see below is the exact state of the network, updated continuously as blocks confirm.
              </p>
            </div>

            {/* Stats 2x2 grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-10 mb-24 justify-items-center text-center max-w-xl mx-auto w-full">
              <div>
                <div className="font-['Space_Grotesk'] text-[#FF6B00] text-7xl md:text-8xl font-bold mb-4 leading-none">
                  {platformStats ? platformStats.totalVaults.toLocaleString() : "--"}
                </div>
                <div className="font-['Inter'] text-[#333333] text-lg">vaults created on-chain</div>
              </div>
              <div>
                <div className="font-['Space_Grotesk'] text-[#FF6B00] text-7xl md:text-8xl font-bold mb-4 leading-none">
                  {platformStats ? platformStats.totalTransactions.toLocaleString() : "--"}
                </div>
                <div className="font-['Inter'] text-[#333333] text-lg">transactions shielded</div>
              </div>
              <div>
                <div className="font-['Space_Grotesk'] text-[#FF6B00] text-7xl md:text-8xl font-bold mb-4 leading-none">
                  {platformStats ? platformStats.transactionsUnshielded.toLocaleString() : "--"}
                </div>
                <div className="font-['Inter'] text-[#333333] text-lg">transactions unshielded</div>
              </div>
              <div>
                <div className="font-['Space_Grotesk'] text-[#FF6B00] text-7xl md:text-8xl font-bold mb-4 leading-none">
                  {platformStats ? `$${platformStats.totalVaultValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : "--"}
                </div>
                <div className="font-['Inter'] text-[#333333] text-lg">total value in vaults</div>
              </div>
            </div>

            {/* Globe: half-cropped, white bg */}
            <div className="relative w-full overflow-hidden mb-0" style={{ height: "clamp(180px, 40vw, 540px)" }}>
              <div
                className="absolute left-1/2 top-0"
                style={{
                  transform: "translateX(-50%)",
                  width: "clamp(280px, 80vw, 1200px)",
                  height: "clamp(280px, 80vw, 1200px)",
                }}
              >
                <HeroGlobe baseFill="#FF6B00" frozen />
              </div>
              <div
                className="absolute bottom-0 left-0 w-full pointer-events-none"
                style={{
                  height: "320px",
                  background: "radial-gradient(ellipse 120% 100% at 50% 100%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 35%, rgba(255,255,255,0.4) 60%, rgba(255,255,255,0) 80%)",
                }}
              />
            </div>

            {/* Crack Challenge CTA */}
            <div className="relative z-10 -mt-20 px-4 md:px-0">
              <div
                className="bg-white border-2 border-[#0A0A0A] grid grid-cols-1 md:grid-cols-2"
                style={{ boxShadow: "8px 8px 0px #FF6B00" }}
              >
                {/* Left */}
                <div className="p-10 md:p-14 border-b-2 md:border-b-0 md:border-r-2 border-[#0A0A0A]">
                  <span className="tag tag-orange mb-8">CRACK CHALLENGE</span>
                  <h2 className="font-['Space_Grotesk'] text-3xl md:text-5xl font-bold text-[#0A0A0A] mb-6 leading-tight">
                    The private key is public. The vault is funded.<br />
                    <span className="text-[#FF6B00]">If you can drain it, it's yours.</span>
                  </h2>
                  <p className="text-[#555555] leading-relaxed mb-8 text-sm">
                    We deployed a SafeVault on Solana, loaded it with real funds, and published the wallet private key publicly. The key gives you full signing authority. But the vault enforces an OTS Protocol: every withdrawal requires the next pre-image in the PBKDF2 hash sequence.
                  </p>
                  <p className="text-[#555555] leading-relaxed mb-10 text-sm">
                    Without the vault code seed, you cannot reconstruct the chain. The funds sit there, accessible to anyone who can break the OTS scheme. No one has.
                  </p>
                  <Link href="/crack" className="btn-primary" data-testid="button-crack-challenge">Take the Challenge</Link>
                </div>

                {/* Right: terminal */}
                <div className="p-10 md:p-14 flex flex-col justify-center bg-[#0A0A0A]">
                  <div className="font-['JetBrains_Mono'] text-xs">
                    <div className="border border-[#2A2A2A]">
                      <div className="border-b border-[#2A2A2A] px-5 py-3 flex items-center gap-2 bg-[#111111]">
                        <div className="w-2.5 h-2.5 rounded-full border border-[#3A3A3A]" />
                        <div className="w-2.5 h-2.5 rounded-full border border-[#3A3A3A]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B00]" />
                        <span className="text-[#555555] ml-2">ots_protocol.ts</span>
                        <span className="ml-auto text-[#333333]">readonly</span>
                      </div>
                      <div className="p-6 space-y-1.5 bg-[#060606]">
                        <div className="text-[#3A3A3A]">{"// PBKDF2 OTS Protocol, depth 32"}</div>
                        <div className="text-[#3A3A3A]">{"// vault_code is your secret"}</div>
                        <div className="mt-3">
                          <span className="text-[#7A7AFF]">function</span>
                          <span className="text-[#AAAAAA]"> deriveChain(</span>
                          <span className="text-[#FF6B00]">vault_code</span>
                          <span className="text-[#AAAAAA]">: string) {"{"}</span>
                        </div>
                        <div className="pl-4">
                          <span className="text-[#7A7AFF]">const</span>
                          <span className="text-[#AAAAAA]"> seed = </span>
                          <span className="text-[#FF6B00]">pbkdf2</span>
                          <span className="text-[#AAAAAA]">(vault_code, salt, 100_000)</span>
                        </div>
                        <div className="pl-4">
                          <span className="text-[#7A7AFF]">const</span>
                          <span className="text-[#AAAAAA]"> chain = []</span>
                        </div>
                        <div className="pl-4 text-[#3A3A3A]">{"// hash forward 32 times"}</div>
                        <div className="pl-4">
                          <span className="text-[#7A7AFF]">for</span>
                          <span className="text-[#AAAAAA]"> (let i = 0; i {"<"} 32; i++)</span>
                          <span className="text-[#AAAAAA]"> chain.push(</span>
                          <span className="text-[#FF6B00]">sha256</span>
                          <span className="text-[#AAAAAA]">(chain[i-1] ?? seed))</span>
                        </div>
                        <div className="pl-4 text-[#3A3A3A]">{"// withdraw = reveal chain[n-1]"}</div>
                        <div className="text-[#AAAAAA]">{"}"}</div>
                        <div className="mt-4 text-[#3A3A3A]">{"// published info"}</div>
                        <div>
                          <span className="text-[#FF6B00]">private_key</span>
                          <span className="text-[#666666]"> = </span>
                          <span className="text-[#AAAAAA]">[12, 45, 178, ...]</span>
                          <span className="text-green-600 ml-2">{"// public"}</span>
                        </div>
                        <div className="mt-2">
                          <span className="text-[#FF6B00]">vault_code</span>
                          <span className="text-[#666666]">  = </span>
                          <span className="text-[#444444] animate-pulse">???</span>
                          <span className="text-[#333333] ml-2">{"// find this"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
