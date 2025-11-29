// vite.config.ts (at repo root)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  // Tell Vite that the actual app root is the client folder
  root: path.resolve(__dirname, "client"),

  resolve: {
    alias: {
      // @ => client/src
      "@": path.resolve(__dirname, "client/src"),
    },
  },

  plugins: [react()],

  server: {
    port: 5173,
    strictPort: true,
  },

  build: {
    // Output to client/dist (you can also just use "dist" here)
    outDir: path.resolve(__dirname, "client/dist"),
    emptyOutDir: true,
  },
});
