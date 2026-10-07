import { REPORT_REASONS } from "@/game/online";
import { findUser, requireUser } from "@/server/auth";
import { body, db, fail, int, json, route, str } from "@/server/http";

export const POST = route(async (req: Request) => {
  const me = await requireUser(req);
  const b = await body<{ username: string; reason: string; messageId: number }>(req);
  const reason = str(b.reason, 20);
  if (!REPORT_REASONS.some((r) => r.id === reason)) return fail(400, "Pick a reason.");
  const them = await findUser(str(b.username, 20).toLowerCase());
  if (!them || them.id === me.id) return fail(404, "No player by that name.");
  const messageId = int(b.messageId);
  await db()
    .prepare("INSERT INTO reports (reporter_id, target_id, reason, message_id, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(me.id, them.id, reason, Number.isNaN(messageId) ? null : messageId, Date.now())
    .run();
  // Reporting also blocks, so the reporter stops hearing from them straight away.
  await db().prepare("INSERT OR IGNORE INTO blocks (user_id, blocked_id) VALUES (?, ?)").bind(me.id, them.id).run();
  return json({ ok: true }, 201);
});
