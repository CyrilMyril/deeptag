import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@deeptag/shared": path.resolve(__dirname, "../shared/src"),
    },
  },
  server: {
    fs: { allow: [path.resolve(__dirname, "..")] },
  },
});
