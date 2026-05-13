import React, { useState, useEffect, useMemo, createContext, useContext } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import {
  CoinbaseWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

export type ClusterName = "devnet" | "mainnet";

interface ClusterContextValue {
  cluster: ClusterName;
}

export const ClusterContext = createContext<ClusterContextValue>({ cluster: "mainnet" });

export function useCluster(): ClusterContextValue {
  return useContext(ClusterContext);
}

function Root() {
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [cluster, setCluster] = useState<ClusterName>("mainnet");

  useEffect(() => {
    const origin = window.location.origin;
    fetch(`${origin}/api/rpc/cluster`)
      .then((r) => r.json())
      .then((data: { cluster?: string }) => {
        const c: ClusterName = data.cluster === "devnet" ? "devnet" : "mainnet";
        setCluster(c);
        setEndpoint(`${origin}/api/rpc/${c}`);
      })
      .catch(() => {
        setEndpoint(`${origin}/api/rpc/mainnet`);
      });
  }, []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new CoinbaseWalletAdapter(),
    ],
    [],
  );

  if (!endpoint) return null;

  return (
    <ClusterContext.Provider value={{ cluster }}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect={false}>
          <App />
        </WalletProvider>
      </ConnectionProvider>
    </ClusterContext.Provider>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);
