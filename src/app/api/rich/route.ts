import { publicProfile, type UserRow } from "@/server/auth";
import { db, json, route } from "@/server/http";

/** Nairobi Rich List: top players by net worth. */
export const GET = route(async () => {
  const rows = await db()
    .prepare("SELECT id, username, display_name, bio, look, created_at, last_seen, area, venue, title, money, net_worth FROM users ORDER BY net_worth DESC LIMIT 25")
    .all<UserRow>();
  return json({ players: rows.results.map(publicProfile) });
});
