import { requireUser } from "@/server/auth";
import { body, db, json, route } from "@/server/http";

/** Marks incoming transfers as received. Returns only the ones this call actually claimed. */
export const POST = route(async (req: Request) => {
  const me = await requireUser(req);
  const b = await body<{ ids: number[] }>(req);
  const ids = (Array.isArray(b.ids) ? b.ids : []).filter((n): n is number => Number.isInteger(n)).slice(0, 50);
  const claimed: { id: number; amount: number; note: string; from: string; fromName: string }[] = [];
  for (const id of ids) {
    const row = await db()
      .prepare(
        `UPDATE transfers SET claimed_at = ? WHERE id = ? AND to_id = ? AND claimed_at IS NULL
         RETURNING id, amount, note, (SELECT username FROM users WHERE id = from_id) AS username, (SELECT display_name FROM users WHERE id = from_id) AS display_name`,
      )
      .bind(Date.now(), id, me.id)
      .first<{ id: number; amount: number; note: string; username: string; display_name: string }>();
    if (row) claimed.push({ id: row.id, amount: row.amount, note: row.note, from: row.username, fromName: row.display_name });
  }
  if (claimed.length) {
    const total = claimed.reduce((n, t) => n + t.amount, 0);
    await db().prepare("UPDATE users SET money = money + ? WHERE id = ?").bind(total, me.id).run();
  }
  return json({ claimed });
});
