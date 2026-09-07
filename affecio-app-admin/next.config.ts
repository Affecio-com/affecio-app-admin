import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Turbopack from picking the parent folder's package-lock.json as workspace root
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
