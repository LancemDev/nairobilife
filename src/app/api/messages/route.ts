import { findUser, publicProfile, requireUser, type UserRow } from "@/server/auth";
import { body, db, fail, json, route, str } from "@/server/http";

const MAX_LEN = 500;

/** No query: inbox threads. ?with=username: that conversation (marks it read). */
export const GET = route(async (req: Request) => {
  const me = await requireUser(req);
  const other = new URL(req.url).searchParams.get("with");
  if (other) {
    const them = await findUser(other.toLowerCase());
    if (!them) return fail(404, "No player by that name.");
    const rows = await db()
      .prepare("SELECT id, from_id, body, created_at FROM messages WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?) ORDER BY id DESC LIMIT 100")
      .bind(me.id, them.id, them.id, me.id)
      .all<{ id: number; from_id: string; body: string; created_at: number }>();
    await db().prepare("UPDATE messages SET read_at = ? WHERE to_id = ? AND from_id = ? AND read_at IS NULL").bind(Date.now(), me.id, them.id).run();
    return json({
      player: publicProfile(them),
      messages: rows.results.reverse().map((m) => ({ id: m.id, mine: m.from_id === me.id, body: m.body, at: m.created_at })),
    });
  }
  const rows = await db()
    .prepare(
      `SELECT u.id, u.username, u.display_name, u.bio, u.look, u.created_at, u.last_seen, u.area, u.venue, u.title, u.money, u.net_worth,
              m.body AS last_body, m.created_at AS last_at, m.from_id AS last_from,
              (SELECT COUNT(*) FROM messages x WHERE x.from_id = u.id AND x.to_id = ? AND x.read_at IS NULL) AS unread
       FROM messages m
       JOIN users u ON u.id = CASE WHEN m.from_id = ? THEN m.to_id ELSE m.from_id END
       WHERE m.id IN (
         SELECT MAX(id) FROM messages WHERE from_id = ? OR to_id = ?
         GROUP BY CASE WHEN from_id = ? THEN to_id ELSE from_id END
       )
       ORDER BY m.id DESC LIMIT 50`,
    )
    .bind(me.id, me.id, me.id, me.id, me.id)
    .all<UserRow & { last_body: string; last_at: number; last_from: string; unread: number }>();
  return json({
    threads: rows.results.map((r) => ({ player: publicProfile(r), last: r.last_body, at: r.last_at, mine: r.last_from === me.id, unread: r.unread })),
  });
});

export const POST = route(async (req: Request) => {
  const me = await requireUser(req);
  const b = await body<{ to: string; body: string }>(req);
  const text = str(b.body, MAX_LEN);
  if (!text) return fail(400, "Write something first.");
  const them = await findUser(str(b.to, 20).toLowerCase());
  if (!them || them.id === me.id) return fail(404, "No player by that name.");
  const blocked = await db().prepare("SELECT 1 FROM blocks WHERE (user_id = ? AND blocked_id = ?) OR (user_id = ? AND blocked_id = ?)").bind(them.id, me.id, me.id, them.id).first();
  if (blocked) return fail(403, "You can't message this player.");
  const recent = await db().prepare("SELECT COUNT(*) AS n FROM messages WHERE from_id = ? AND created_at > ?").bind(me.id, Date.now() - 60_000).first<{ n: number }>();
  if ((recent?.n ?? 0) >= 20) return fail(429, "Slow down a little.");
  const now = Date.now();
  const res = await db().prepare("INSERT INTO messages (from_id, to_id, body, created_at) VALUES (?, ?, ?, ?)").bind(me.id, them.id, text, now).run();
  return json({ message: { id: res.meta.last_row_id, mine: true, body: text, at: now } }, 201);
});
