import { defineConfig } from "vite";

// Relative base so the same build works on GitHub Pages project sites and locally.
export default defineConfig({
  base: "./",
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
  },
});
