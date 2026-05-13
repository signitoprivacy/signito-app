import React from "react";

export interface SelectableToken {
  symbol?: string | null;
  mint: string;
  uiAmount: number;
}

interface TokenSelectProps {
  solBalance: number;
  tokens: SelectableToken[];
  value: string;
  onChange: (token: string) => void;
  className?: string;
  disabled?: boolean;
}

export function TokenSelect({ solBalance, tokens, value, onChange, className, disabled }: TokenSelectProps) {
  const spendableTokens = tokens.filter((t) => t.uiAmount > 0);

  return (
    <select
      className={`input-field appearance-none cursor-pointer ${className ?? ""}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      <option value="SOL">SOL: {solBalance.toFixed(4)}</option>
      {spendableTokens.map((t) => {
        const label = t.symbol ?? `${t.mint.slice(0, 4)}...${t.mint.slice(-4)}`;
        return (
          <option key={t.mint} value={t.symbol ?? t.mint}>
            {label}: {t.uiAmount.toFixed(4)}
          </option>
        );
      })}
    </select>
  );
}
