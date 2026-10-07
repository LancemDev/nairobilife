import { DAILY_CAP, MAX_SEND, MIN_SEND } from "@/game/online";
import { findUser, requireUser } from "@/server/auth";
import { body, db, fail, int, json, route, str } from "@/server/http";

/**
 * Send in-game KSh to another player. The server debits the sender's last reported balance at once
 * so a client can't fire off more than it has; the recipient claims it on their next heartbeat.
 */
export const POST = route(async (req: Request) => {
  const me = await requireUser(req);
  const b = await body<{ to: string; amount: number; note: string }>(req);
  const amount = int(b.amount);
  if (!(amount >= MIN_SEND && amount <= MAX_SEND)) return fail(400, `Send between KSh ${MIN_SEND} and KSh ${MAX_SEND.toLocaleString()}.`);
  const them = await findUser(str(b.to, 20).toLowerCase());
  if (!them || them.id === me.id) return fail(404, "No player by that name.");
  const blocked = await db().prepare("SELECT 1 FROM blocks WHERE (user_id = ? AND blocked_id = ?) OR (user_id = ? AND blocked_id = ?)").bind(them.id, me.id, me.id, them.id).first();
  if (blocked) return fail(403, "You can't send money to this player.");
  const sentToday = await db().prepare("SELECT COALESCE(SUM(amount), 0) AS n FROM transfers WHERE from_id = ? AND created_at > ?").bind(me.id, Date.now() - 86_400_000).first<{ n: number }>();
  if ((sentToday?.n ?? 0) + amount > DAILY_CAP) return fail(429, "Daily M-Pesa limit reached.");

  // Conditional debit: only succeeds if the reported balance covers it.
  const debit = await db().prepare("UPDATE users SET money = money - ? WHERE id = ? AND money >= ?").bind(amount, me.id, amount).run();
  if (!debit.meta.changes) return fail(402, "Not enough money in your M-Pesa.");
  await db()
    .prepare("INSERT INTO transfers (from_id, to_id, amount, note, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(me.id, them.id, amount, str(b.note, 80), Date.now())
    .run();
  return json({ ok: true, to: them.username, toName: them.display_name, amount }, 201);
});
