import { createSession, hashPassword, publicProfile, safeEqual, sessionCookie, findUser } from "@/server/auth";
import { body, db, fail, json, route, str } from "@/server/http";

export const POST = route(async (req: Request) => {
  const b = await body<{ username: string; password: string }>(req);
  const username = str(b.username, 20).toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  const row = await db().prepare("SELECT id, pass_hash, salt FROM users WHERE username = ?").bind(username).first<{ id: string; pass_hash: string; salt: string }>();
  // Hash even when the user is missing so response time doesn't reveal which usernames exist.
  const hash = await hashPassword(password, row?.salt ?? "no-such-user");
  if (!row || !safeEqual(hash, row.pass_hash)) return fail(401, "Wrong username or password.");
  const { token, expires } = await createSession(row.id);
  return json({ user: publicProfile((await findUser(username))!) }, 200, { "Set-Cookie": sessionCookie(token, expires, req) });
});
