import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Single-player milestone: no ISR/data cache needed yet. Add an R2 incremental
// cache here once pages start revalidating.
export default defineCloudflareConfig({});
