import { requireUser } from "@/server/auth";
import { db, fail, json, route } from "@/server/http";

const MAX_SAVE = 512_000;

export const GET = route(async (req: Request) => {
  const user = await requireUser(req);
  const row = await db().prepare("SELECT data, updated_at FROM saves WHERE user_id = ?").bind(user.id).first<{ data: string; updated_at: number }>();
  return json({ save: row ? JSON.parse(row.data) : null, updatedAt: row?.updated_at ?? null });
});

export const PUT = route(async (req: Request) => {
  const user = await requireUser(req);
  const text = await req.text();
  if (text.length > MAX_SAVE) return fail(413, "Save is too big.");
  try {
    const save = JSON.parse(text);
    if (!save || save.version !== 2) return fail(400, "Unknown save format.");
  } catch {
    return fail(400, "Save isn't valid JSON.");
  }
  const now = Date.now();
  await db()
    .prepare("INSERT INTO saves (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT (user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at")
    .bind(user.id, text, now)
    .run();
  return json({ updatedAt: now });
});
