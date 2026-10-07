"use client";

import { useState } from "react";
import { dayOf, netWorth } from "@/game/engine";
import { useGame } from "@/game/store";
import type { GameState } from "@/game/types";
import { api } from "@/online/api";
import { useOnline } from "@/online/store";
import { Avatar } from "./Avatar";
import { Btn, ksh, Sheet, Tabs } from "./ui";

type Conflict = { cloud: GameState; local: GameState };

/** Log in / sign up, then reconcile this device's save with the cloud. */
export default function Account({ onClose, initial = "register" }: { onClose: () => void; initial?: "login" | "register" }) {
  const game = useGame((s) => s.game);
  const load = useGame((s) => s.load);
  const setMe = useOnline((s) => s.setMe);
  const [mode, setMode] = useState<"login" | "register">(initial);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(game?.player.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState<Conflict | null>(null);

  const reconcile = async () => {
    const { save } = await api.loadSave();
    const local = useGame.getState().game;
    if (save && !local) load(save);
    else if (local && !save) await api.putSave(local);
    else if (save && local && JSON.stringify(save) !== JSON.stringify(local)) return setConflict({ cloud: save, local });
    onClose();
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const { user } = mode === "login" ? await api.login(username, password) : await api.register(username, password, displayName || username, game?.player.look);
      setMe(user);
      await reconcile();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const keep = async (which: "cloud" | "local") => {
    if (!conflict) return;
    setBusy(true);
    if (which === "cloud") load(conflict.cloud);
    else await api.putSave(conflict.local).catch(() => {});
    setBusy(false);
    onClose();
  };

  if (conflict)
    return (
      <Sheet title="Which life do you want?" onClose={onClose}>
        <p className="mb-3 text-sm text-muted">This account already has a life saved. Pick one to keep. The other is replaced.</p>
        <div className="grid gap-2">
          {(["cloud", "local"] as const).map((k) => {
            const g = conflict[k];
            return (
              <button key={k} disabled={busy} onClick={() => keep(k)} className="flex items-center gap-3 rounded-xl border border-line p-3 text-left transition hover:border-foreground">
                <Avatar look={g.player.look} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{k === "cloud" ? "☁️ Your saved life" : "📱 This device"}</span>
                  <span className="block text-sm text-muted">
                    {g.player.name} · Day {dayOf(g.time)} · {ksh(netWorth(g))}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Sheet>
    );

  return (
    <Sheet title={mode === "login" ? "Ingia: log in" : "Create your profile"} onClose={onClose}>
      <Tabs value={mode} onChange={setMode} items={[{ id: "register", label: "Sign up" }, { id: "login", label: "Log in" }]} />
      <p className="mt-3 text-sm text-muted">
        {mode === "register" ? "Go online: show up on the map, message other players, send M-Pesa, and keep your life safe in the cloud." : "Welcome back. Your life is saved in the cloud."}
      </p>
      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="Username (e.g. otieno_254)" autoComplete="username" autoCapitalize="none" className="w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:border-foreground" />
        {mode === "register" && <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" maxLength={24} className="w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:border-foreground" />}
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password (8+ characters)" autoComplete={mode === "login" ? "current-password" : "new-password"} className="w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:border-foreground" />
        {error && <p className="text-sm text-kred">{error}</p>}
        <Btn className="w-full py-3" disabled={busy || !username || !password}>
          {busy ? "…" : mode === "login" ? "Log in" : "Create profile"}
        </Btn>
      </form>
    </Sheet>
  );
}
