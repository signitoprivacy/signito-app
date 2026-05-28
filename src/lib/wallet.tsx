import {
  useAppKitAccount,
  useAppKitProvider,
  useDisconnect,
} from "@reown/appkit/react";
import { useConnection } from "@solana/wallet-adapter-react";
import type { Connection, Transaction, VersionedTransaction } from "@solana/web3.js";

interface SolanaWalletProvider {
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
  signTransaction?: <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>;
  sendTransaction?: (
    tx: Transaction | VersionedTransaction,
    connection: Connection,
    options?: { preflightCommitment?: string; skipPreflight?: boolean; maxRetries?: number }
  ) => Promise<string>;
}

export function useWallet() {
  const { address, isConnected } = useAppKitAccount({ namespace: "solana" });
  const { walletProvider } = useAppKitProvider<SolanaWalletProvider>("solana");
  const { disconnect } = useDisconnect();
  const { connection } = useConnection();

  return {
    publicKey: isConnected && address ? address : null,
    connected: isConnected,
    connect: () => {},
    disconnect,
    signMessage: walletProvider?.signMessage?.bind(walletProvider) as
      | ((message: Uint8Array) => Promise<Uint8Array>)
      | undefined,
    signTransaction: walletProvider?.signTransaction?.bind(walletProvider) as
      | (<T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>)
      | undefined,
    sendTransaction: walletProvider?.sendTransaction?.bind(walletProvider) as
      | ((tx: Transaction | VersionedTransaction, conn: Connection) => Promise<string>)
      | undefined,
    connection,
  };
}
