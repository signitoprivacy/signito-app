import React from "react";
import { LandingNavBar } from "../components/LandingNavBar";
import { Footer } from "../components/Footer";
import { MountainDivider } from "../components/MountainDivider";
import sketchOffline from "../assets/sketch-offline-signing.jpg";


export default function LearnOfflineSigningPage() {
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
              <h1 className="font-['Space_Grotesk'] text-5xl md:text-7xl font-bold mb-6 leading-tight">Offline Signing</h1>
              <p className="text-[#888888] font-['Inter'] text-lg max-w-xl leading-relaxed">
                Most private key theft happens on connected devices. A malicious browser extension or a compromised website can read your key the moment it is loaded into memory. Offline signing removes the attack surface by keeping the key on a device that has never touched the internet.
              </p>
            </div>
            <div className="hidden md:block border border-[#1A1A1A] overflow-hidden">
              <img src={sketchOffline} alt="Online vs air-gapped signing risk diagram" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Post-hero white content */}
        <div className="relative z-10 bg-white text-[#0A0A0A]">
          <MountainDivider />

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-8">How keys get stolen on connected devices</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <p className="text-[#555555] font-['Inter'] leading-relaxed mb-6">
                    When you sign a transaction in a browser wallet, your private key exists in the browser's JavaScript memory. Anything with access to that memory, including malicious extensions, injected scripts, or compromised dependencies, can extract the key silently.
                  </p>
                  <p className="text-[#555555] font-['Inter'] leading-relaxed mb-6">
                    Air-gapped signing removes the attack surface entirely. The device that holds the signing key never connects to any network. Even if the device is physically confiscated, the key is derived from a vault code you hold in memory, not stored on disk.
                  </p>
                  <p className="text-[#888888] font-['Inter'] text-sm leading-relaxed">
                    AirSign uses Ed25519, the same curve that Solana itself uses for transaction signing. Signatures are 64 bytes and verify on-chain in microseconds.
                  </p>
                </div>
                <div className="space-y-3">
                  {[
                    { threat: "Browser extension injection", mitigation: "Signing runs offline, extensions cannot access the signing session" },
                    { threat: "Network traffic interception", mitigation: "No data leaves the device during signing" },
                    { threat: "Clipboard monitoring", mitigation: "QR code delivery bypasses clipboard entirely" },
                    { threat: "Key stored on disk", mitigation: "Key is derived from vault code on demand and discarded after signing" },
                  ].map((row) => (
                    <div key={row.threat} className="border border-[#E0E0E0] p-5 grid grid-cols-2 gap-4">
                      <div>
                        <div className="font-['JetBrains_Mono'] text-[#FF6B00] text-xs mb-1">Threat</div>
                        <div className="text-[#555555] font-['Inter'] text-sm leading-relaxed">{row.threat}</div>
                      </div>
                      <div>
                        <div className="font-['JetBrains_Mono'] text-[#22c55e] text-xs mb-1">How AirSign handles it</div>
                        <div className="text-[#555555] font-['Inter'] text-sm leading-relaxed">{row.mitigation}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-4">Ed25519 fundamentals</h2>
              <p className="text-[#888888] font-['Inter'] text-sm mb-12 max-w-2xl">Ed25519 is the signature algorithm used by AirSign. Here is what each part does.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: "Key generation", body: "An Ed25519 keypair is a 32-byte private scalar and a 32-byte public point on the Curve25519 elliptic curve. In AirSign the private key is derived from your vault code via PBKDF2. It is never stored on disk." },
                  { title: "Signing", body: "The signature algorithm mixes the private key with the message using a deterministic nonce defined in RFC 8032. No random number generation is required, which means signing on constrained offline hardware is always safe." },
                  { title: "On-chain verification", body: "Verification only needs the public key, the message, and the 64-byte signature. Solana has a built-in ed25519 native program that verifies signatures cheaply. The verifier does not need the private key at any point." },
                  { title: "Replay protection", body: "Each voucher includes a unique nonce and expiry timestamp. The Signito program records the nullifier hash of every redeemed voucher on-chain. If the same voucher is submitted twice, the second submission is rejected." },
                ].map((item) => (
                  <div key={item.title} className="border-2 border-[#0A0A0A] p-8">
                    <h3 className="font-['Space_Grotesk'] font-bold text-[#0A0A0A] text-lg mb-4">{item.title}</h3>
                    <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed">{item.body}</p>
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
