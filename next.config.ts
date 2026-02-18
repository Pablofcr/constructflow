import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['canvas'],
  webpack: (config) => {
    // Alias canvas to false so pdf.js doesn't try to load it in the browser
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
