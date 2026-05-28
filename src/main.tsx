import React, { useState, useEffect, createContext, useContext } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ConnectionProvider } from "@solana/wallet-adapter-react";
import { ChainProvider } from "./lib/evm-wallet";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiAdapter } from "./lib/reown";

import { overrideProgramId } from "@workspace/program";

export type ClusterName = "devnet" | "mainnet";

const PROGRAM_ID_MAINNET = "HyciDEYB9hXdmmLMexTHv2QYDaJmuZr1AF7sipBbVLLH";
const PROGRAM_ID_DEVNET = "5gbaenRHg2YK6X8WMMQZevD55bJ7fvr4V8E8e1feDt5D";

interface ClusterContextValue {
  cluster: ClusterName;
  programId: string;
}

export const ClusterContext = createContext<ClusterContextValue>({
  cluster: "mainnet",
  programId: PROGRAM_ID_MAINNET,
});

export function useCluster(): ClusterContextValue {
  return useContext(ClusterContext);
}

const queryClient = new QueryClient();

function Root() {
  const defaultOrigin = window.location.origin;
  const [endpoint, setEndpoint] = useState<string>(`${defaultOrigin}/api/rpc/mainnet`);
  const [cluster, setCluster] = useState<ClusterName>("mainnet");
  const [programId, setProgramId] = useState<string>(PROGRAM_ID_MAINNET);

  useEffect(() => {
    const origin = window.location.origin;
    const forcedCluster = (import.meta.env as Record<string, string>)["VITE_CLUSTER"] as ClusterName | undefined;

    if (forcedCluster === "devnet" || forcedCluster === "mainnet") {
      const pid = forcedCluster === "devnet" ? PROGRAM_ID_DEVNET : PROGRAM_ID_MAINNET;
      overrideProgramId(pid);
      setProgramId(pid);
      setCluster(forcedCluster);
      setEndpoint(`${origin}/api/rpc/${forcedCluster}`);
      return;
    }

    fetch(`${origin}/api/rpc/cluster`)
      .then((r) => r.json())
      .then((data: { cluster?: string; programId?: string }) => {
        const c: ClusterName = data.cluster === "devnet" ? "devnet" : "mainnet";
        const pid = data.programId ?? PROGRAM_ID_MAINNET;
        overrideProgramId(pid);
        setProgramId(pid);
        setCluster(c);
        setEndpoint(`${origin}/api/rpc/${c}`);
      })
      .catch(() => {
        setEndpoint(`${origin}/api/rpc/mainnet`);
      });
  }, []);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ChainProvider>
          <ClusterContext.Provider value={{ cluster, programId }}>
            <ConnectionProvider endpoint={endpoint}>
              <App />
            </ConnectionProvider>
          </ClusterContext.Provider>
        </ChainProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);
