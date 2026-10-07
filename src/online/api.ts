import type { Look } from "@/game/look";
import type { GameState } from "@/game/types";

export interface Profile {
  username: string;
  displayName: string;
  bio: string;
  look: Look;
  title: string;
  area: string | null;
  venue: string | null;
  netWorth: number;
  online: boolean;
  joined: number;
}

export interface Incoming {
  id: number;
  amount: number;
  note: string;
  from: string;
  fromName: string;
}

export interface Thread {
  player: Profile;
  last: string;
  at: number;
  mine: boolean;
  unread: number;
}

export interface Message {
  id: number;
  mine: boolean;
  body: string;
  at: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function call<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(`/api/${path}`, {
    ...rest,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...rest.headers },
    body: json === undefined ? rest.body : JSON.stringify(json),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? "Something went wrong. Try again.", res.status);
  return data as T;
}

export const api = {
  me: () => call<{ user: Profile | null }>("me"),
  register: (username: string, password: string, displayName: string, look?: Look) => call<{ user: Profile }>("auth/register", { method: "POST", json: { username, password, displayName, look } }),
  login: (username: string, password: string) => call<{ user: Profile }>("auth/login", { method: "POST", json: { username, password } }),
  logout: () => call<{ ok: true }>("auth/logout", { method: "POST" }),
  updateProfile: (patch: Partial<Pick<Profile, "displayName" | "bio" | "look">>) => call<{ user: Profile }>("me", { method: "PATCH", json: patch }),

  loadSave: () => call<{ save: GameState | null; updatedAt: number | null }>("save"),
  putSave: (save: GameState, keepalive = false) => call<{ updatedAt: number }>("save", { method: "PUT", body: JSON.stringify(save), keepalive }),

  presence: (p: { area: string; venue: string; title: string; money: number; netWorth: number }) => call<{ unread: number; incoming: Incoming[] }>("presence", { method: "POST", json: p }),
  claim: (ids: number[]) => call<{ claimed: Incoming[] }>("transfers/claim", { method: "POST", json: { ids } }),
  send: (to: string, amount: number, note: string) => call<{ ok: true; to: string; toName: string; amount: number }>("transfers", { method: "POST", json: { to, amount, note } }),

  online: (area?: string) => call<{ players: Profile[]; areas: Record<string, number> }>(`players${area ? `?area=${encodeURIComponent(area)}` : ""}`),
  search: (q: string) => call<{ players: Profile[] }>(`players?q=${encodeURIComponent(q)}`),
  player: (username: string) => call<{ player: Profile; blocked: boolean }>(`players/${encodeURIComponent(username)}`),
  rich: () => call<{ players: Profile[] }>("rich"),

  threads: () => call<{ threads: Thread[] }>("messages"),
  conversation: (username: string) => call<{ player: Profile; messages: Message[] }>(`messages?with=${encodeURIComponent(username)}`),
  message: (to: string, body: string) => call<{ message: Message }>("messages", { method: "POST", json: { to, body } }),

  block: (username: string, block: boolean) => call<{ blocked: boolean }>("block", { method: "POST", json: { username, block } }),
  report: (username: string, reason: string, messageId?: number) => call<{ ok: true }>("report", { method: "POST", json: { username, reason, messageId } }),
};
