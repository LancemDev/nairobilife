import { sanitizeLook } from "@/game/look";
import { createSession, findUser, hashPassword, newId, newSalt, publicProfile, sessionCookie } from "@/server/auth";
import { body, db, fail, json, route, str } from "@/server/http";

export const POST = route(async (req: Request) => {
  const b = await body<{ username: string; password: string; displayName: string; look: unknown }>(req);
  const username = str(b.username, 20).toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  const displayName = str(b.displayName, 24) || username;
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return fail(400, "Username: 3–20 letters, numbers or underscores.");
  if (password.length < 8) return fail(400, "Password needs at least 8 characters.");
  if (await findUser(username)) return fail(409, "That username is taken.");

  const id = newId();
  const salt = newSalt();
  const now = Date.now();
  await db()
    .prepare("INSERT INTO users (id, username, pass_hash, salt, display_name, look, created_at, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(id, username, await hashPassword(password, salt), salt, displayName, JSON.stringify(sanitizeLook(b.look)), now, now)
    .run();
  const { token, expires } = await createSession(id);
  const user = (await findUser(username))!;
  return json({ user: publicProfile(user) }, 201, { "Set-Cookie": sessionCookie(token, expires, req) });
});
