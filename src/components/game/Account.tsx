"use client";

import { useState } from "react";
import { dayOf, netWorth } from "@/game/engine";
import { useGame } from "@/game/store";
import type { GameState } from "@/game/types";
import { api, type Profile } from "@/online/api";
import { useOnline } from "@/online/store";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { IconLabel, ksh } from "./ui";

type Conflict = { cloud: GameState; local: GameState; username: string };

/**
 * Puts the right life on this device for `username`: the cloud save if there is one, otherwise
 * whatever unclaimed life is already here. Returns a conflict when both exist and differ.
 */
export async function claimDevice(username: string): Promise<Conflict | null> {
  const { game: local, owner, load } = useGame.getState();
  const { save } = await api.loadSave();
  const mine = local && (owner === null || owner === username) ? local : null;
  if (save && mine && JSON.stringify(save) !== JSON.stringify(mine)) return { cloud: save, local: mine, username };
  if (save) load(save, username);
  else if (mine) {
    load(mine, username);
    await api.putSave(mine).catch(() => {});
  } else load(null, username);
  return null;
}

/** The first screen: sign up or log in before anything else. */
export default function AuthScreen() {
  const setMe = useOnline((s) => s.setMe);
  const load = useGame((s) => s.load);
  const [mode, setMode] = useState<"register" | "login">("register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [pending, setPending] = useState<Profile | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const { user } = mode === "login" ? await api.login(username, password) : await api.register(username, password, displayName || username);
      const clash = await claimDevice(user.username);
      // Signing in last means the game only renders once the right save is in place.
      if (clash) {
        setConflict(clash);
        setPending(user);
      } else setMe(user);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const keep = async (which: "cloud" | "local") => {
    if (!conflict) return;
    setBusy(true);
    if (which === "cloud") load(conflict.cloud, conflict.username);
    else {
      load(conflict.local, conflict.username);
      await api.putSave(conflict.local).catch(() => {});
    }
    setConflict(null);
    setBusy(false);
    setMe(pending);
  };

  return (
    <main className="flex min-h-dvh flex-col bg-[#bfe0f7]">
      <div className="stripe h-2" />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-10">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-kred">The 254 life-sim</p>
          <h1 className="font-display text-6xl font-extrabold leading-none">Nairobi Life</h1>
          <p className="mt-2 text-muted">Live your Kanairo story.</p>
          <div className="mt-4 flex justify-center gap-3 text-foreground/60" aria-hidden>
            {["bus", "motorbike", "meat", "building-skyscraper", "bolt", "device-mobile"].map((n) => (
              <Icon key={n} name={n} size={24} />
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-xl">
          {conflict ? (
            <>
              <h2 className="font-display text-xl font-bold">Which life do you want?</h2>
              <p className="mb-3 mt-1 text-sm text-muted">This account has a life saved already, and this device has another one. Keep one; the other is replaced.</p>
              <div className="grid gap-2">
                {(["cloud", "local"] as const).map((k) => {
                  const g = conflict[k];
                  return (
                    <button key={k} disabled={busy} onClick={() => keep(k)} className="flex items-center gap-3 rounded-2xl border border-line p-3 text-left transition hover:border-foreground">
                      <Avatar look={g.player.look} size={44} />
                      <span className="min-w-0 flex-1">
                        <IconLabel name={k === "cloud" ? "cloud" : "device-mobile"} className="font-semibold">
                          {k === "cloud" ? "Your saved life" : "This device"}
                        </IconLabel>
                        <span className="block text-sm text-muted">
                          {g.player.name} · Day {dayOf(g.time)} · {ksh(netWorth(g))}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-1 rounded-2xl bg-line/60 p-1">
                {(["register", "login"] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 text-sm font-semibold transition ${mode === m ? "bg-white shadow-sm" : "text-muted"}`}>
                    {m === "register" ? "Create account" : "Log in"}
                  </button>
                ))}
              </div>
              <form
                className="mt-4 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <Field icon="user">
                  <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="Username (e.g. otieno_254)" autoComplete="username" autoCapitalize="none" className="w-full bg-transparent py-3 outline-none" />
                </Field>
                {mode === "register" && (
                  <Field icon="id">
                    <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" maxLength={24} className="w-full bg-transparent py-3 outline-none" />
                  </Field>
                )}
                <Field icon="key">
                  <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password (8+ characters)" autoComplete={mode === "login" ? "current-password" : "new-password"} className="w-full bg-transparent py-3 outline-none" />
                </Field>
                {error && <p className="text-sm text-kred">{error}</p>}
                <button disabled={busy || !username || !password} className="w-full rounded-2xl bg-kgreen py-3.5 font-display text-lg font-bold text-white transition hover:brightness-110 disabled:opacity-50">
                  {busy ? "…" : mode === "login" ? "Log in" : "Create account"}
                </button>
              </form>
              <p className="mt-3 text-center text-xs text-muted">Your life is saved to your account, so you can pick it up on any device.</p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2 rounded-2xl border border-line bg-background/60 px-3 focus-within:border-foreground">
      <Icon name={icon} size={18} className="text-muted" />
      {children}
    </label>
  );
}
