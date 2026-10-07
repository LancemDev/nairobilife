import { ONLINE_MS, publicProfile, requireUser, type UserRow } from "@/server/auth";
import { db, json, route, str } from "@/server/http";

const COLS = "id, username, display_name, bio, look, created_at, last_seen, area, venue, title, money, net_worth";

/** ?q= searches usernames; otherwise lists who's online (optionally in one area), plus per-area counts. */
export const GET = route(async (req: Request) => {
  const me = await requireUser(req);
  const url = new URL(req.url);
  const q = str(url.searchParams.get("q"), 20).toLowerCase().replace(/[^a-z0-9_]/g, "");
  const area = str(url.searchParams.get("area"), 32);
  const since = Date.now() - ONLINE_MS;

  if (q) {
    const rows = await db().prepare(`SELECT ${COLS} FROM users WHERE username LIKE ? AND id != ? ORDER BY last_seen DESC LIMIT 20`).bind(`${q}%`, me.id).all<UserRow>();
    return json({ players: rows.results.map(publicProfile) });
  }
  const [rows, counts] = await Promise.all([
    area
      ? db().prepare(`SELECT ${COLS} FROM users WHERE last_seen > ? AND area = ? AND id != ? ORDER BY last_seen DESC LIMIT 50`).bind(since, area, me.id).all<UserRow>()
      : db().prepare(`SELECT ${COLS} FROM users WHERE last_seen > ? AND id != ? ORDER BY last_seen DESC LIMIT 50`).bind(since, me.id).all<UserRow>(),
    db().prepare("SELECT area, COUNT(*) AS n FROM users WHERE last_seen > ? AND area IS NOT NULL AND id != ? GROUP BY area").bind(since, me.id).all<{ area: string; n: number }>(),
  ]);
  return json({ players: rows.results.map(publicProfile), areas: Object.fromEntries(counts.results.map((c) => [c.area, c.n])) });
});
