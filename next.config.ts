import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.simplecastcdn.com',
      },
      {
        protocol: 'https',
        hostname: '**.libsyn.com',
      },
      {
        protocol: 'https',
        hostname: '**.buzzsprout.com',
      },
      {
        protocol: 'https',
        hostname: '**.transistor.fm',
      },
      {
        protocol: 'https',
        hostname: '**.podbean.com',
      },
    ],
  },
};

export default nextConfig;
