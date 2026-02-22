import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,

  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "localhost:80",
        "localhost:3001",
        "mpako.net",
        "www.mpako.net",
        "https://www.mpako.net",
        "https://mpako.net",
      ],
    },
  },
};

export default nextConfig;
