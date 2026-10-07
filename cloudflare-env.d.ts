// Bindings from wrangler.jsonc (regenerate with `bun run cf-typegen`).
import type { D1Database } from "@cloudflare/workers-types";

declare global {
  interface CloudflareEnv {
    DB: D1Database;
  }
}
