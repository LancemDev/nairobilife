import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents/partialPrefetching hang in the Workers runtime (Next relies on setTimeout
  // semantics workerd doesn't have), so they stay off for Cloudflare.
  // The dev badge sits on top of the mobile bottom nav.
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

// Gives `next dev` the local D1 database from wrangler.jsonc.
initOpenNextCloudflareForDev();
