import React from "react";
import { LandingNavBar } from "../components/LandingNavBar";
import { Footer } from "../components/Footer";
import { MountainDivider } from "../components/MountainDivider";
import sketchAirGap from "../assets/sketch-airsign-airgap.jpg";


export default function AirSignDetailPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <LandingNavBar />
      <div>

        {/* Hero - dark */}
        <div className="border-b border-[#2A2A2A] relative overflow-hidden min-h-screen flex flex-col">
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #2A2A2A 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
          <div className="max-w-[3200px] mx-auto px-8 md:px-16 pt-[20vh] pb-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10 w-full">
            <div>
              <div className="inline-block font-['JetBrains_Mono'] text-[#FF6B00] text-xs tracking-[0.2em] uppercase border border-[#FF6B00]/30 px-3 py-1 mb-8">Feature 03</div>
              <h1 className="font-['Space_Grotesk'] text-5xl md:text-7xl font-bold mb-6 leading-tight">AirSign</h1>
              <p className="text-[#888888] font-['Inter'] text-lg max-w-xl leading-relaxed mb-6">
                AirSign lets you sign payment vouchers on a device that has no internet connection. Your private key never exists on a network-connected machine. You export the signed voucher as a QR code, and the recipient redeems it on-chain later.
              </p>
              <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed">
                The signing key is derived from your vault code on demand and only in the offline device's memory. It is never stored on disk and never transmitted over any network.
              </p>
            </div>
            <div className="hidden md:block border border-[#1A1A1A] overflow-hidden">
              <img src={sketchAirGap} alt="Air-gapped signing flow diagram" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Post-hero white content */}
        <div className="relative z-10 bg-white text-[#0A0A0A]">
          <MountainDivider />

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-4">The voucher lifecycle</h2>
              <p className="text-[#888888] font-['Inter'] text-sm mb-16 max-w-2xl">A voucher is a small signed message that says "pay this amount to this address". It works like a paper check, but cryptographically guaranteed.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#E0E0E0]">
                {[
                  { step: "01", title: "Prepare offline", body: "On an air-gapped device, open the AirSign page. Enter the voucher parameters: recipient address, amount, token type, and expiry date. No internet connection is needed for this step." },
                  { step: "02", title: "Sign the voucher", body: "AirSign derives an Ed25519 keypair from your vault code using PBKDF2. It signs the voucher payload locally. The private key material is computed in memory and never touches any network-connected component." },
                  { step: "03", title: "Deliver and redeem", body: "Export the signed voucher as a QR code. The recipient scans it on any device and submits it to the Signito program. The program verifies the Ed25519 signature and releases the specified funds to the recipient." },
                ].map((item, i) => (
                  <div key={item.step} className={`p-10 ${i < 2 ? "border-r border-[#E0E0E0]" : ""}`}>
                    <div className="font-['JetBrains_Mono'] text-[#FF6B00] text-sm mb-4">{item.step}</div>
                    <h3 className="font-['Space_Grotesk'] font-bold text-[#0A0A0A] text-xl mb-4">{item.title}</h3>
                    <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-4">When to use AirSign</h2>
              <p className="text-[#888888] font-['Inter'] text-sm mb-12 max-w-2xl">AirSign is most useful when you want the signing to happen in a completely isolated environment so that even a fully compromised device cannot expose the signing key.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: "Cold-storage disbursements", body: "Sign multiple vouchers offline for planned payouts. Keep the signing device air-gapped permanently. Each voucher is redeemed independently by the intended recipient at their convenience." },
                  { title: "Physical gift vouchers", body: "Print a QR code onto a physical card. The holder redeems it on any device without needing a wallet. The signing key never appears on any connected machine at any point." },
                  { title: "Batch authorization", body: "Pre-sign many small vouchers in a single offline session. Distribute them over time. The signing device can be powered off permanently after the session. None of the recipients need to know each other." },
                  { title: "Testable access grants", body: "Pre-sign vouchers that activate only when a recipient provides the correct claim. The voucher carries the terms and the signature. No custodian, no time-lock oracle, just cryptographic authorization." },
                ].map((item) => (
                  <div key={item.title} className="border-2 border-[#0A0A0A] p-8">
                    <h3 className="font-['Space_Grotesk'] font-bold text-[#0A0A0A] text-lg mb-3">{item.title}</h3>
                    <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-4">The key that never existed on any network</h2>
              <p className="text-[#888888] font-['Inter'] text-sm mb-12 max-w-2xl">Most hardware wallets store the signing key on a device. AirSign derives it on demand from the vault code, uses it, and discards it. The key has no persistent form anywhere.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-[#0A0A0A]">
                {[
                  {
                    label: "01",
                    title: "No stored key",
                    body: "The Ed25519 keypair is derived fresh from your vault code each time you sign. It lives only in device memory during the signing operation. When the session ends, the key is gone. There is nothing to extract from disk.",
                  },
                  {
                    label: "02",
                    title: "No network exposure",
                    body: "Signing happens on an offline device. The private key material is computed in memory on a machine that has never touched the internet during the signing session. There is no network path for the key to travel.",
                  },
                  {
                    label: "03",
                    title: "Two secrets required",
                    body: "To forge a voucher you need the vault code. To redeem a voucher you need the on-chain signature to match the PDA-bound key. Stealing the private key of the redeeming wallet does nothing because the voucher authorizes a specific destination.",
                  },
                ].map((item, i) => (
                  <div key={item.label} className={`p-10 ${i < 2 ? "border-r-2 border-[#0A0A0A]" : ""}`}>
                    <div className="font-['JetBrains_Mono'] text-[#FF6B00] text-xs mb-3">{item.label}</div>
                    <h3 className="font-['Space_Grotesk'] font-bold text-[#0A0A0A] text-xl mb-4">{item.title}</h3>
                    <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 border border-[#E0E0E0] bg-[#F9F9F9] px-8 py-6">
                <div className="font-['JetBrains_Mono'] text-xs text-[#888888] mb-3">ATTACK SURFACE COMPARISON</div>
                <div className="grid grid-cols-2 gap-8 font-['Inter'] text-sm">
                  <div>
                    <div className="font-bold text-[#0A0A0A] mb-2">Standard hot wallet signing</div>
                    <ul className="space-y-1 text-[#CC3300] text-xs">
                      <li>Key stored on connected device</li>
                      <li>Key accessible to any malware on that machine</li>
                      <li>Key transmitted when browser extension is active</li>
                      <li>Compromised device = compromised key</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-bold text-[#0A0A0A] mb-2">AirSign offline signing</div>
                    <ul className="space-y-1 text-[#0A6B00] text-xs">
                      <li>Key derived on demand from vault code</li>
                      <li>Key never exists on a network-connected machine</li>
                      <li>Key never transmitted anywhere</li>
                      <li>Compromised online device cannot reach the signing key</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-12">Technical specifications</h2>
              <div className="border border-[#E0E0E0] font-['JetBrains_Mono'] text-sm divide-y divide-[#E0E0E0]">
                {[
                  ["Signature scheme", "Ed25519"],
                  ["Key derivation", "PBKDF2 from vault code (deterministic, on-demand)"],
                  ["Voucher format", "JSON payload with base58 signature"],
                  ["Delivery format", "QR code (base64 encoded payload)"],
                  ["Network requirement", "None for signing, online only for redemption"],
                  ["Expiry", "Configurable per voucher at sign time"],
                  ["Replay protection", "Nullifier hash stored on-chain after first redemption"],
                  ["Protocol fee", "0.15% per redemption, enforced on-chain"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between px-6 py-4">
                    <span className="text-[#888888]">{k}</span>
                    <span className="text-[#555555] text-right max-w-xs">{v}</span>
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
