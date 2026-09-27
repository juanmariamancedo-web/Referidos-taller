import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite que el servidor de desarrollo de Next.js / Turbopack acepte el WebSocket (HMR) y scripts
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.ngrok-free.app",
    "192.168.100.23:3000",
    "localhost:3000",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "*.trycloudflare.com",
        "*.ngrok-free.app",
        "192.168.100.23:3000",
        "localhost:3000",
      ],
    },
  },
};

export default nextConfig;