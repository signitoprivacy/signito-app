import { createAppKit } from "@reown/appkit/react";
import { SolanaAdapter } from "@reown/appkit-adapter-solana";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { solana, baseSepolia } from "@reown/appkit/networks";

const projectId =
  (import.meta.env as Record<string, string>)["VITE_REOWN_PROJECT_ID"] ?? "";

export const solanaAdapter = new SolanaAdapter();

export const wagmiAdapter = new WagmiAdapter({
  networks: [baseSepolia],
  projectId,
  ssr: false,
});

createAppKit({
  adapters: [solanaAdapter, wagmiAdapter],
  networks: [solana, baseSepolia],
  defaultNetwork: solana,
  projectId,
  metadata: {
    name: "Signito",
    description: "Non-custodial transaction privacy protocol",
    url: typeof window !== "undefined" ? window.location.origin : "https://signito.org",
    icons: ["https://signito.org/ssol-logo.png"],
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#FF6B00",
    "--w3m-border-radius-master": "0px",
    "--w3m-font-family": "Space Grotesk, sans-serif",
  },
});
