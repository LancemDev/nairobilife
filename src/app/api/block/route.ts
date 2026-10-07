import { findUser, requireUser } from "@/server/auth";
import { body, db, fail, json, route, str } from "@/server/http";

export const POST = route(async (req: Request) => {
  const me = await requireUser(req);
  const b = await body<{ username: string; block: boolean }>(req);
  const them = await findUser(str(b.username, 20).toLowerCase());
  if (!them || them.id === me.id) return fail(404, "No player by that name.");
  if (b.block === false) await db().prepare("DELETE FROM blocks WHERE user_id = ? AND blocked_id = ?").bind(me.id, them.id).run();
  else await db().prepare("INSERT OR IGNORE INTO blocks (user_id, blocked_id) VALUES (?, ?)").bind(me.id, them.id).run();
  return json({ blocked: b.block !== false });
});
