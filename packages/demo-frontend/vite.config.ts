import react from "@vitejs/plugin-react";
import os from "os";
import { defineConfig } from "vite";

// Helper to get local IPv4
const networkInterfaces = os.networkInterfaces();
const localIp = Object.values(networkInterfaces)
  .flat()
  .find((i) => i?.family === "IPv4" && !i.internal)?.address;

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const backendUrl =
    process.env.METEOR_BRIDGE_BACKEND_URL ??
    process.env.VITE_METEOR_BRIDGE_BACKEND_URL ??
    (mode === "production" ? cloudflareBackendUrl : undefined);

  return {
    server: {
      host: true,
      port: 5200,
    },
    define: {
      "globalThis.__METEOR_BRIDGE_BACKEND_URL__": JSON.stringify(backendUrl),
      "process.env": {
        NODE_ENV: process.env.NODE_ENV ?? mode,
        LOCAL_IP: localIp || "localhost",
        METEOR_BRIDGE_BACKEND_URL: backendUrl,
        VITE_METEOR_BRIDGE_BACKEND_URL: backendUrl,
      },
    },
    plugins: [react()],
  };
});
