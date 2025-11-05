import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // Use webpack instead of Turbopack (more stable on Windows)
  webpack: (config, { isServer }) => {
    return config;
  },

  // Image optimization
  images: {
    unoptimized: process.env.NODE_ENV === 'production',
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  },
};

export default nextConfig;
