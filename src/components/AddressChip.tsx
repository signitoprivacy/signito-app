import React, { useState } from "react";

interface AddressChipProps {
  address: string;
  chars?: number;
}

export function AddressChip({ address, chars = 4 }: AddressChipProps) {
  const [copied, setCopied] = useState(false);
  
  if (!address) return null;
  
  const truncated = `${address.slice(0, chars)}...${address.slice(-chars)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className="bg-[#141414] border border-[#2A2A2A] hover:border-[#FF6B00] rounded px-3 py-1.5 flex items-center gap-2 transition-colors cursor-pointer"
      title={address}
    >
      <div className="w-2 h-2 rounded-full bg-[#FF6B00]"></div>
      <span className="font-['JetBrains_Mono'] text-white text-xs">{copied ? "COPIED!" : truncated}</span>
    </button>
  );
}
