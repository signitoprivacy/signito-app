import { useWallet as useSolanaWallet, useConnection } from "@solana/wallet-adapter-react";
import type { WalletName } from "@solana/wallet-adapter-base";
import type { Transaction, VersionedTransaction } from "@solana/web3.js";

export function useWallet() {
  const {
    publicKey,
    connected,
    select,
    connect,
    disconnect,
    signMessage,
    signTransaction,
    sendTransaction,
  } = useSolanaWallet();
  const { connection } = useConnection();

  const connectWallet = (walletName: string) => {
    select(walletName as WalletName);
    setTimeout(() => {
      connect().catch(() => {});
    }, 50);
  };

  return {
    publicKey: publicKey?.toBase58() ?? null,
    connected,
    connect: connectWallet,
    disconnect,
    signMessage,
    signTransaction: signTransaction as
      | (<T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>)
      | undefined,
    sendTransaction,
    connection,
  };
}
