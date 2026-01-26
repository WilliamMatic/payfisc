import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Déplacé hors de "experimental"
  cacheComponents: true, // Active le support de "use cache"

  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:80', 'localhost:3001'],
    },
  },
};

export default nextConfig;
