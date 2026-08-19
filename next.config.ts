import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone with only the files the server actually needs, so
  // the production image doesn't have to carry node_modules around.
  output: "standalone",
  images: {
    localPatterns: [{ pathname: "/**" }],
  },
};

export default nextConfig;
