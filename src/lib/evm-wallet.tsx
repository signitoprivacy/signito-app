import { createContext, useContext, useState, type ReactNode } from "react";
import { useAccount, useSendTransaction, useDisconnect } from "wagmi";
import { useAppKit } from "@reown/appkit/react";

export interface EvmAccount {
  address: `0x${string}`;
  chainId: number;
}

export interface EvmWalletContextValue {
  account: EvmAccount | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendTransaction: (tx: {
    to: string;
    value: bigint;
    data?: string;
  }) => Promise<`0x${string}`>;
}

export function useEvmWallet(): EvmWalletContextValue {
  const { address, isConnected, chainId, status } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  const account: EvmAccount | null =
    isConnected && address && chainId
      ? { address, chainId }
      : null;

  return {
    account,
    isConnected,
    isConnecting: status === "connecting" || status === "reconnecting",
    connect: () => open({ view: "Connect" }).then(() => {}),
    disconnect,
    sendTransaction: async (tx) => {
      const hash = await sendTransactionAsync({
        to: tx.to as `0x${string}`,
        value: tx.value,
        data: (tx.data ?? "0x") as `0x${string}`,
      });
      return hash;
    },
  };
}

export interface ChainContextValue {
  activeChain: "solana" | "base";
  setActiveChain: (chain: "solana" | "base") => void;
}

export const ChainContext = createContext<ChainContextValue>({
  activeChain: "solana",
  setActiveChain: () => {},
});

export function ChainProvider({ children }: { children: ReactNode }) {
  const [activeChain, setActiveChain] = useState<"solana" | "base">("solana");
  return (
    <ChainContext.Provider value={{ activeChain, setActiveChain }}>
      {children}
    </ChainContext.Provider>
  );
}

export function useActiveChain() {
  return useContext(ChainContext);
}
