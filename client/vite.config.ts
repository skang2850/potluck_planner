import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/potluck_planner/" : "/",
  server: { proxy: { "/api": "http://localhost:3000" } },
}));
