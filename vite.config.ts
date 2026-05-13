import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [
    nodePolyfills({
      include: ["buffer", "crypto", "stream", "util", "process"],
      globals: { Buffer: true, process: true },
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
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
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: [
      "@solana/web3.js",
      "@solana/wallet-adapter-base",
      "@solana/wallet-adapter-react",
      "@solana/wallet-adapter-wallets",
      "@tanstack/react-query",
      "react",
      "react-dom",
      "wouter",
    ],
    esbuildOptions: {
      target: "es2020",
    },
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-solana": [
            "@solana/web3.js",
            "@solana/wallet-adapter-base",
            "@solana/wallet-adapter-react",
          ],
          "vendor-wallets": ["@solana/wallet-adapter-wallets"],
          "vendor-query": ["@tanstack/react-query"],
        },
      },
    },
  },
  server: {
    port: Number(process.env.PORT ?? 3000),
    host: "0.0.0.0",
  },
  preview: {
    port: Number(process.env.PORT ?? 4173),
    host: "0.0.0.0",
  },
});
