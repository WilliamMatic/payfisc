import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... autres configurations
  async redirects() {
    return [];
  },
}

module.exports = nextConfig
