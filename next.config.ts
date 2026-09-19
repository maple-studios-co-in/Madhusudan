import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets `NEXT_DIST_DIR=.next-build npx next build` run while `next dev` owns .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async headers() {
    return [
      {
        // Footage and frame sequences are versioned by file/folder name
        // (…-v1, …-v6); safe to cache forever. New footage ⇒ new name.
        source: "/video/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/frames/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
