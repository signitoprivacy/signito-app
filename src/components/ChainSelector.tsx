import { useLocation } from "wouter";
import { useActiveChain } from "@/lib/evm-wallet";

export function ChainSelector() {
  const { activeChain, setActiveChain } = useActiveChain();
  const [, navigate] = useLocation();

  function switchToSolana() {
    setActiveChain("solana");
    navigate("/app");
  }

  function switchToBase() {
    setActiveChain("base");
    navigate("/app/base");
  }

  return (
    <div className="inline-flex items-center border border-[#333] bg-[#0A0A0A]">
      <button
        onClick={switchToSolana}
        className={`px-4 py-1.5 text-xs font-mono font-bold tracking-widest transition-colors ${
          activeChain === "solana"
            ? "bg-[#FF6B00] text-black"
            : "text-[#666] hover:text-white"
        }`}
      >
        SOLANA
      </button>
      <div className="w-px h-4 bg-[#333]" />
      <button
        onClick={switchToBase}
        className={`px-4 py-1.5 text-xs font-mono font-bold tracking-widest transition-colors ${
          activeChain === "base"
            ? "bg-[#FF6B00] text-black"
            : "text-[#666] hover:text-white"
        }`}
      >
        BASE
      </button>
    </div>
  );
}
