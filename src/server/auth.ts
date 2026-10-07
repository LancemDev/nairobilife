import { db, fail } from "./http";

const COOKIE = "nl_session";
const SESSION_DAYS = 30;
/** Workers cap PBKDF2 at 100k iterations. */
const ITERATIONS = 100_000;

const hex = (buf: ArrayBuffer | Uint8Array) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const randomHex = (bytes: number) => hex(crypto.getRandomValues(new Uint8Array(bytes)));

export async function hashPassword(password: string, salt: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: ITERATIONS }, key, 256);
  return hex(bits);
}

export const newSalt = () => randomHex(16);
export const newId = () => crypto.randomUUID();

/** Constant-time comparison for equal-length hex strings. */
export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSession(userId: string) {
  const token = randomHex(32);
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  await db().prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").bind(token, userId, expires).run();
  return { token, expires };
}

export function sessionCookie(token: string, expires: number, req: Request) {
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${new Date(expires).toUTCString()}${secure}`;
}

export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

function tokenFrom(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  return cookie.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1) ?? null;
}

export interface UserRow {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  look: string;
  created_at: number;
  last_seen: number;
  area: string | null;
  venue: string | null;
  title: string;
  money: number;
  net_worth: number;
}

const USER_COLS = "u.id, u.username, u.display_name, u.bio, u.look, u.created_at, u.last_seen, u.area, u.venue, u.title, u.money, u.net_worth";

export async function currentUser(req: Request) {
  const token = tokenFrom(req);
  if (!token) return null;
  return db()
    .prepare(`SELECT ${USER_COLS} FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?`)
    .bind(token, Date.now())
    .first<UserRow>();
}

export async function requireUser(req: Request) {
  const user = await currentUser(req);
  if (!user) throw fail(401, "Log in first.");
  return user;
}

export async function endSession(req: Request) {
  const token = tokenFrom(req);
  if (token) await db().prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
}

export async function findUser(username: string) {
  return db().prepare(`SELECT ${USER_COLS} FROM users u WHERE u.username = ?`).bind(username).first<UserRow>();
}

export const ONLINE_MS = 3 * 60_000;

/** The public face of a player. Never includes money details beyond net worth. */
export function publicProfile(u: UserRow) {
  let look: unknown = {};
  try {
    look = JSON.parse(u.look);
  } catch {}
  return {
    username: u.username,
    displayName: u.display_name,
    bio: u.bio,
    look,
    title: u.title,
    area: u.area,
    venue: u.venue,
    netWorth: u.net_worth,
    online: Date.now() - u.last_seen < ONLINE_MS,
    joined: u.created_at,
  };
}
export type PublicProfile = ReturnType<typeof publicProfile>;
