import { requireUser } from "@/server/auth";
import { body, db, int, json, route, str } from "@/server/http";

/**
 * Heartbeat: the client reports where it is and what it's worth; the server answers with unread
 * messages and incoming M-Pesa transfers. One cheap call every ~30s instead of several.
 */
export const POST = route(async (req: Request) => {
  const user = await requireUser(req);
  const b = await body<{ area: string; venue: string; title: string; money: number; netWorth: number }>(req);
  const money = int(b.money);
  const netWorth = int(b.netWorth);
  await db()
    .prepare("UPDATE users SET last_seen = ?, area = ?, venue = ?, title = ?, money = ?, net_worth = ? WHERE id = ?")
    .bind(Date.now(), str(b.area, 32) || null, str(b.venue, 32) || null, str(b.title, 48) || user.title, Number.isNaN(money) ? user.money : money, Number.isNaN(netWorth) ? user.net_worth : netWorth, user.id)
    .run();
  const [unread, incoming] = await Promise.all([
    db().prepare("SELECT COUNT(*) AS n FROM messages WHERE to_id = ? AND read_at IS NULL").bind(user.id).first<{ n: number }>(),
    db()
      .prepare("SELECT t.id, t.amount, t.note, u.username, u.display_name FROM transfers t JOIN users u ON u.id = t.from_id WHERE t.to_id = ? AND t.claimed_at IS NULL ORDER BY t.id")
      .bind(user.id)
      .all<{ id: number; amount: number; note: string; username: string; display_name: string }>(),
  ]);
  return json({ unread: unread?.n ?? 0, incoming: incoming.results.map((t) => ({ id: t.id, amount: t.amount, note: t.note, from: t.username, fromName: t.display_name })) });
});
