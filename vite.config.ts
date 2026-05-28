import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 3000;

const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [
    nodePolyfills({
      include: ["buffer", "crypto", "stream", "util", "process"],
      globals: { Buffer: true, process: true },
    }),
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    {
      name: "stub-wagmi-tempo",
      enforce: "pre" as const,
      resolveId(id: string) {
        if (id === "@wagmi/core/tempo") return "\0virtual:stub-wagmi-tempo";
      },
      load(id: string) {
        if (id === "\0virtual:stub-wagmi-tempo") {
          return "export const tempoWallet = undefined; export default {};";
        }
      },
    },
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@walletconnect/environment": path.resolve(import.meta.dirname, "src/shims/walletconnect-env.ts"),
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      "vite-plugin-node-polyfills/shims/buffer": path.resolve(
        import.meta.dirname,
        "node_modules/vite-plugin-node-polyfills/shims/buffer/dist/index.js"
      ),
      "vite-plugin-node-polyfills/shims/process": path.resolve(
        import.meta.dirname,
        "node_modules/vite-plugin-node-polyfills/shims/process/dist/index.js"
      ),
      "vite-plugin-node-polyfills/shims/global": path.resolve(
        import.meta.dirname,
        "node_modules/vite-plugin-node-polyfills/shims/global/dist/index.js"
      ),
    },
    dedupe: ["react", "react-dom", "@solana/web3.js"],
  },
  optimizeDeps: {
    include: [
      "@solana/web3.js",
      "eventemitter3",
      "qrcode",
      "qrcode.react",
      "@tanstack/react-query",
      "react",
      "react-dom",
      "wouter",
      "wagmi",
      "@wagmi/core",
      "recharts",
      "dayjs",
      "dayjs/locale/en.js",
      "dayjs/plugin/relativeTime.js",
      "dayjs/plugin/updateLocale.js",
      "events",
      "bs58",
      "@walletconnect/time",
      "@walletconnect/window-getters",
      "@walletconnect/window-metadata",
      "@walletconnect/jsonrpc-utils",
      "@walletconnect/jsonrpc-http-connection",
      "@walletconnect/jsonrpc-provider",
      "@walletconnect/jsonrpc-types",
      "@walletconnect/safe-json",
      "@walletconnect/events",
      "@walletconnect/heartbeat",
      "@walletconnect/relay-api",
      "@walletconnect/relay-auth",
      "@walletconnect/logger",
      "cross-fetch",
      "blakejs",
      "vite-plugin-node-polyfills/shims/buffer",
      "vite-plugin-node-polyfills/shims/global",
      "vite-plugin-node-polyfills/shims/process",
      "@reown/appkit",
      "@reown/appkit/react",
      "@reown/appkit/networks",
      "@reown/appkit-adapter-solana",
      "@reown/appkit-adapter-wagmi",
    ],
    exclude: [
      "@solana/wallet-adapter-base",
      "@solana/wallet-adapter-react",
      "@noble/hashes",
      "@noble/ed25519",
    ],
    esbuildOptions: {
      target: "es2020",
      plugins: [
        {
          name: "stub-wagmi-tempo",
          setup(build: any) {
            build.onResolve({ filter: /^@wagmi\/core\/tempo$/ }, () => ({
              path: "stub-wagmi-tempo",
              namespace: "stub-wagmi-tempo",
            }));
            build.onLoad(
              { filter: /.*/, namespace: "stub-wagmi-tempo" },
              () => ({
                contents:
                  "export const tempoWallet = undefined; export default {};",
                loader: "js",
              })
            );
          },
        },
      ],
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-wagmi": ["wagmi", "@wagmi/core"],
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
