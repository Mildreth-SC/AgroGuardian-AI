import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Monorepo: lockfile exists at repo root; keep Next rooted in web/
    root: path.join(__dirname),
  },
};

export default nextConfig;
