import React, { useState, useRef } from "react";
import { Link } from "wouter";
import signitoLogoUrl from "@assets/signito-logo-nobg.png";

type MenuId = "features" | "learn" | "developers";

// ─── Features mega menu ───────────────────────────────────────────────────────
function FeaturesMenu({ onClose }: { onClose: () => void }) {
  return (
    <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-10">
      <div className="grid grid-cols-4 gap-8">

        {/* Left intro */}
        <div className="border-r border-[#2A2A2A] pr-8">
          <p className="font-['Space_Grotesk'] font-bold text-white text-sm tracking-[0.15em] uppercase border-b-2 border-[#FF6B00] pb-2 mb-4 w-fit">
            Features
          </p>
          <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed mb-4">
            Shield assets. Send privately. Sign offline.
          </p>
          <p className="text-[#3A3A3A] font-['JetBrains_Mono'] text-xs leading-relaxed mb-6 border-l-2 border-[#FF6B00]/40 pl-3">
            Private key compromised? Shielded funds still require the vault code. Two independent secrets.
          </p>
          <Link href="/#features" className="text-[#FF6B00] font-['Space_Grotesk'] font-bold text-xs no-underline hover:text-white transition-colors" onClick={onClose}>
            See all features
          </Link>
        </div>

        {/* 3 product cards */}
        {[
          {
            tag: "OTS",
            title: "Shielded Vault",
            desc: "Your key stays cold. Withdrawals run on OTS reveals.",
            href: "/features/safevault",
            sub: "OTS Protocol shield",
          },
          {
            tag: "ZK",
            title: "StealthSend",
            desc: "Into the pool. Out to a fresh address. No on-chain link.",
            href: "/features/stealthsend",
            sub: "ZK privacy pool",
          },
          {
            tag: "AIR",
            title: "AirSign",
            desc: "Air-gapped signing. Deliver as QR. Redeem when you are back online.",
            href: "/features/airsign",
            sub: "Offline Ed25519",
          },
        ].map((p) => (
          <Link key={p.tag} href={p.href} onClick={onClose}
            className="group no-underline border border-[#2A2A2A] p-5 hover:border-[#FF6B00]/40 transition-colors block"
          >
            <div className="font-['JetBrains_Mono'] text-[#FF6B00] text-xs mb-3">{p.tag}</div>
            <div className="font-['Space_Grotesk'] font-bold text-white text-sm mb-2 group-hover:text-[#FF6B00] transition-colors">
              {p.title}
            </div>
            <div className="text-[#555555] font-['Inter'] text-xs leading-relaxed mb-4">{p.desc}</div>
            <div className="text-[#333333] font-['JetBrains_Mono'] text-xs">{p.sub}</div>
          </Link>
        ))}

      </div>

      {/* Crack Challenge strip at bottom */}
      <div className="mt-6 border-t border-[#2A2A2A] pt-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="font-['JetBrains_Mono'] text-[#FF6B00] text-xs border border-[#FF6B00]/30 px-2 py-0.5">LIVE</div>
          <span className="text-[#888888] font-['Inter'] text-sm">
            The private key is public. The vault is funded. If you can drain it, it's yours.
          </span>
        </div>
        <Link href="/crack" onClick={onClose}
          className="text-[#FF6B00] font-['Space_Grotesk'] font-bold text-xs no-underline hover:text-white transition-colors shrink-0 ml-6"
        >
          Take the Challenge
        </Link>
      </div>
    </div>
  );
}

// ─── Learn mega menu ──────────────────────────────────────────────────────────
function LearnMenu({ onClose }: { onClose: () => void }) {
  return (
    <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-10">
      <div className="grid grid-cols-3 gap-12">

        {/* Left intro */}
        <div className="border-r border-[#2A2A2A] pr-10">
          <p className="font-['Space_Grotesk'] font-bold text-white text-sm tracking-[0.15em] uppercase border-b-2 border-[#FF6B00] pb-2 mb-4 w-fit">
            How it works
          </p>
          <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed mb-3">
            Each Signito feature rests on a different cryptographic primitive. Start here to understand the protocol from first principles.
          </p>
          <p className="text-[#333333] font-['JetBrains_Mono'] text-xs">
            No trusted third parties. No custodians.
          </p>
        </div>

        {/* Articles list: one wide column, each item has a longer description */}
        <div className="col-span-2 grid grid-cols-2 gap-x-10 gap-y-6">
          {[
            {
              title: "OTS Protocol (PBKDF2)",
              desc: "How repeated hashing creates single-use withdrawal credentials that cannot be forged without the seed.",
              href: "/learn/ots-protocol",
            },
            {
              title: "Zero-Knowledge Proofs",
              desc: "Groth16 zk-SNARKs: what they prove, what they hide, and how in-browser proving works with snarkjs.",
              href: "/learn/zk-proofs",
            },
            {
              title: "Offline Ed25519 Signing",
              desc: "Why air-gapped signing eliminates an entire class of key-theft attacks before they can happen.",
              href: "/learn/offline-signing",
            },
            {
              title: "Privacy Model",
              desc: "What Signito actually hides, what it does not hide, and what assumptions your privacy depends on.",
              href: "/learn/privacy-model",
            },
            {
              title: "Non-Custodial Guarantee",
              desc: "No admin key, no freeze function, no counterparty. The math enforces the rules.",
              href: "/learn/non-custodial",
            },
            {
              title: "SignitoRelay",
              desc: "How broadcasts reach Solana without linking your fee-payer address to your withdrawal.",
              href: "/learn/relay",
            },
            {
              title: "sToken: Shielded Receipt",
              desc: "What sSOL and sUSDC are, why they are NonTransferable, and how they bind to your vault PDA.",
              href: "/learn/stoken",
            },
          ].map((a) => (
            <Link key={a.title} href={a.href} onClick={onClose}
              className="group no-underline block"
            >
              <div className="font-['Inter'] text-sm text-[#CCCCCC] group-hover:text-white transition-colors mb-1">
                {a.title}
              </div>
              <div className="font-['Inter'] text-xs text-[#3A3A3A] leading-relaxed group-hover:text-[#555555] transition-colors">
                {a.desc}
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}

// ─── Developers mega menu ─────────────────────────────────────────────────────
function DevelopersMenu({ onClose }: { onClose: () => void }) {
  const devPages = [
    {
      label: "Quick Start",
      href: "/developers/quick-start",
      desc: "First API call in under ten minutes. Clone, configure, run.",
    },
    {
      label: "API Reference",
      href: "/developers/api-reference",
      desc: "All endpoints listed with method, path, and description.",
    },
    {
      label: "OpenAPI Spec",
      href: "/developers/openapi",
      desc: "Contract-first development with Orval codegen and Zod schemas.",
    },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-10">
      <div className="grid grid-cols-4 gap-8">

        {/* Left intro */}
        <div className="col-span-1 border-r border-[#2A2A2A] pr-8">
          <p className="font-['Space_Grotesk'] font-bold text-white text-sm tracking-[0.15em] uppercase border-b-2 border-[#FF6B00] pb-2 mb-4 w-fit">
            Developers
          </p>
          <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed mb-6">
            The OpenAPI spec is the source of truth. All endpoints are documented and codegen-ready. Integrate via REST from any language.
          </p>
          <a href="/docs/"
            className="btn-secondary text-xs !py-2 !px-4 w-fit inline-flex"
          >
            Open Docs
          </a>
        </div>

        {/* Developer pages */}
        <div className="col-span-2 border-r border-[#2A2A2A] pr-8">
          <p className="font-['Space_Grotesk'] text-[#FF6B00] text-xs tracking-[0.15em] uppercase mb-5">Guides</p>
          <div className="space-y-1">
            {devPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                onClick={onClose}
                className="group block no-underline border border-transparent hover:border-[#2A2A2A] px-4 py-3 transition-colors"
              >
                <div className="font-['Space_Grotesk'] font-bold text-white text-sm mb-1 group-hover:text-[#FF6B00] transition-colors">
                  {page.label}
                </div>
                <div className="text-[#555555] font-['Inter'] text-xs leading-relaxed">{page.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Stack + status */}
        <div>
          <p className="font-['Space_Grotesk'] text-[#FF6B00] text-xs tracking-[0.15em] uppercase mb-3">Stack</p>
          <div className="font-['JetBrains_Mono'] text-xs border border-[#2A2A2A] mb-6">
            {[
              ["API", "Express 5"],
              ["DB", "PostgreSQL + Drizzle"],
              ["ZK", "Groth16 / snarkjs"],
              ["RPC", "Helius proxy"],
            ].map(([k, v], i, arr) => (
              <div key={k} className={`flex justify-between gap-4 px-3 py-2 ${i < arr.length - 1 ? "border-b border-[#2A2A2A]" : ""}`}>
                <span className="text-[#FF6B00]/60">{k}</span>
                <span className="text-[#888888]">{v}</span>
              </div>
            ))}
          </div>
          <p className="font-['Space_Grotesk'] text-[#FF6B00] text-xs tracking-[0.15em] uppercase mb-3">Links</p>
          <ul className="space-y-2">
            <li>
              <Link href="/status" onClick={onClose} className="text-[#888888] hover:text-white font-['Inter'] text-xs transition-colors no-underline block">
                System Status
              </Link>
            </li>
            <li>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                className="text-[#888888] hover:text-white font-['Inter'] text-xs transition-colors no-underline block"
                onClick={onClose}
              >
                GitHub ↗
              </a>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}

// ─── Main navbar ──────────────────────────────────────────────────────────────
export function LandingNavBar() {
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enter = (id: MenuId) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(id);
  };

  const leave = () => {
    closeTimer.current = setTimeout(() => setOpenMenu(null), 100);
  };

  const close = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(null);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-[#0A0A0A] border-b border-[#2A2A2A] z-50">
      {/* Main bar */}
      <div className="h-[60px] flex items-center justify-between px-8 md:px-16">
        <Link href="/" className="flex items-center gap-1 no-underline" onClick={close}>
          <img src={signitoLogoUrl} alt="Signito" className="w-10 h-10 object-contain" />
          <span className="font-['Space_Grotesk'] font-bold text-white tracking-widest text-lg">SIGNITO</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {(["features", "learn", "developers"] as MenuId[]).map((id) => (
            <div key={id} onMouseEnter={() => enter(id)} onMouseLeave={leave}>
              <button
                className={`px-4 py-2 font-['Inter'] text-sm transition-colors bg-transparent border-0 outline-none cursor-pointer capitalize ${
                  openMenu === id ? "text-white" : "text-[#888888] hover:text-white"
                }`}
              >
                {id === "learn" ? "How it works" : id.charAt(0).toUpperCase() + id.slice(1)}
                <span className={`ml-1.5 text-[9px] inline-block transition-transform duration-150 ${openMenu === id ? "-translate-y-px" : "translate-y-px"}`}>
                  {openMenu === id ? "▴" : "▾"}
                </span>
              </button>
            </div>
          ))}
          <Link href="/status" onClick={close}
            className="px-4 py-2 text-[#888888] hover:text-white font-['Inter'] text-sm transition-colors no-underline"
          >
            Status
          </Link>
        </div>

        <Link href="/app" className="btn-primary" data-testid="link-launch-app" onClick={close}>
          Launch App
        </Link>
      </div>

      {/* Dropdown panel */}
      {openMenu && (
        <div
          className="border-t border-[#2A2A2A] bg-[#0A0A0A] border-b-2 border-b-[#2A2A2A]"
          onMouseEnter={() => enter(openMenu)}
          onMouseLeave={leave}
        >
          {openMenu === "features" && <FeaturesMenu onClose={close} />}
          {openMenu === "learn" && <LearnMenu onClose={close} />}
          {openMenu === "developers" && <DevelopersMenu onClose={close} />}
        </div>
      )}
    </nav>
  );
}
