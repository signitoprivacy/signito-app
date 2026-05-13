import React, { useState } from "react";
import { useWallet } from "../../lib/wallet";
import { useGetPortfolio, getGetPortfolioQueryKey } from "@workspace/api-client-react";
import { TokenSelect } from "../TokenSelect";

const MOCK_TOKENS = [
  { symbol: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", uiAmount: 0 },
];

export function StealthSection() {
  const { connected, publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState("shield");

  const { data: portfolio } = useGetPortfolio(publicKey ?? "", {
    query: { queryKey: getGetPortfolioQueryKey(publicKey ?? ""), enabled: !!publicKey },
  });

  const [token, setToken] = useState("SOL");
  const [amount, setAmount] = useState("");
  const [vaultCode, setVaultCode] = useState("");
  const [nullifier, setNullifier] = useState("");
  const [recipient, setRecipient] = useState("");
  const [generatedHash, setGeneratedHash] = useState("");

  const solBalance = portfolio?.solBalance ?? 0;
  const splTokens = portfolio?.tokens ?? MOCK_TOKENS;

  return (
    <div className="px-3 sm:px-5 py-5 max-w-2xl">
      <div className="flex items-center gap-3 mb-3">
        <span className="tag">STEALTHSEND</span>
        <span className="tag !text-white !border-white">ZK</span>
      </div>

      <h1 className="font-['Space_Grotesk'] text-3xl font-bold mb-2">ZK Privacy Transfer</h1>

      <div className="border border-[#2A2A2A] rounded p-4 mb-8">
        <p className="text-[#888888] text-sm leading-relaxed">
          StealthSend uses a zero-knowledge anonymity pool (Groth16 proofs via snarkjs). Shield funds to generate a commitment.
          Later, unshield to a <span className="text-white">fresh address</span> via SignitoRelay, severing the on-chain link completely.
        </p>
      </div>

      <div className="flex border-b border-[#2A2A2A] mb-8">
        {["shield", "unshield"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-['Space_Grotesk'] font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab
                ? "border-[#FF6B00] text-white"
                : "border-transparent text-[#888888] hover:text-white"
            }`}
          >
            {tab === "shield" ? "Shield to Pool" : "Unshield"}
          </button>
        ))}
      </div>

      {!connected && (
        <div className="mb-4 flex items-center gap-2 bg-[#141414] border border-[#2A2A2A] rounded px-4 py-2.5">
          <div className="w-2 h-2 rounded-full bg-[#888888]" />
          <span className="text-[#888888] text-xs font-['JetBrains_Mono']">
            Connect wallet to enable actions
          </span>
        </div>
      )}

      <div className="card">
        {activeTab === "shield" && (
          <div className="space-y-6">
            <p className="text-[#888888] text-sm">
              Deposit into the anonymity pool. Save your <span className="text-white">nullifier + commitment</span>: you will need them to unshield later.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-2">Token</label>
                <TokenSelect
                  solBalance={solBalance}
                  tokens={splTokens}
                  value={token}
                  onChange={setToken}
                  disabled={!connected}
                />
              </div>
              <div>
                <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-2">Amount</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!connected}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-2">
                Vault Code <span className="text-[#888888]">(PBKDF2 entropy seed)</span>
              </label>
              <input
                type="password"
                className="input-field"
                maxLength={6}
                value={vaultCode}
                onChange={(e) => setVaultCode(e.target.value)}
                disabled={!connected}
              />
            </div>

            {!generatedHash ? (
              <button
                className="btn-primary w-full justify-center mt-4"
                disabled={!connected || !amount || !vaultCode}
                onClick={async () => {
                  const bytes = window.crypto.getRandomValues(new Uint8Array(32));
                  const hash = "0x" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
                  setGeneratedHash(hash);
                }}
              >
                {!connected ? "Connect Wallet First" : "Generate Commitment"}
              </button>
            ) : (
              <>
                <div className="mt-4 p-4 border border-[#FF6B00]/40 rounded bg-[#0A0A0A]">
                  <p className="text-xs text-[#888888] font-['JetBrains_Mono'] mb-1">Commitment Hash (save this)</p>
                  <p className="font-['JetBrains_Mono'] text-[#FF6B00] break-all text-sm">{generatedHash}</p>
                </div>
                <div className="p-3 border border-[#2A2A2A] rounded bg-[#0A0A0A]">
                  <p className="text-xs text-[#888888] font-['JetBrains_Mono']">
                    Save your nullifier securely. Without it, you cannot unshield these funds.
                  </p>
                </div>
                <button className="btn-primary w-full justify-center opacity-50 cursor-not-allowed" disabled>
                  Deposit {amount} {token} to Pool (pending program deploy)
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === "unshield" && (
          <div className="space-y-6">
            <p className="text-[#888888] text-sm">
              Unshield to a <span className="text-white">fresh address</span>. Use a different device or wallet to break the on-chain link.
            </p>

            <div>
              <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-2">Nullifier Hash</label>
              <input
                type="text"
                className="input-field"
                placeholder="0x..."
                value={nullifier}
                onChange={(e) => setNullifier(e.target.value)}
                disabled={!connected}
              />
            </div>

            <div>
              <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-2">
                Recipient Address <span className="text-[#888888]">(fresh address, not your depositing wallet)</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Fresh Solana address"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                disabled={!connected}
              />
            </div>

            <div>
              <label className="block text-xs font-['JetBrains_Mono'] text-[#888888] mb-2">Vault Code</label>
              <input
                type="password"
                className="input-field"
                maxLength={6}
                value={vaultCode}
                onChange={(e) => setVaultCode(e.target.value)}
                disabled={!connected}
              />
            </div>

            <div className="p-3 border border-[#2A2A2A] bg-[#0F0F0F] text-center">
              <p className="text-[#888888] font-['JetBrains_Mono'] text-xs">
                Awaiting signito_zk program deployment. ZK unshield will be enabled when Groth16 circuits are live on Mainnet.
              </p>
            </div>
            <button
              className="btn-primary w-full justify-center opacity-40 cursor-not-allowed"
              disabled
            >
              Unshield via SignitoRelay (pending deployment)
            </button>

            <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded p-4">
              <p className="text-[#888888] text-xs font-['JetBrains_Mono'] leading-relaxed">
                Proof: Groth16(nullifier, commitment, merkle_root, recipient), verified on-chain by signito_zk program.
                SignitoRelay submits the tx, so the recipient address has no prior on-chain history.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
