"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useGame } from "@/game/store";
import { useOnline } from "@/online/store";
import AuthScreen, { claimDevice } from "./Account";
import Creator from "./Creator";
import Play from "./Play";
import Welcome from "./Welcome";

const subscribe = (cb: () => void) => useGame.persist.onFinishHydration(cb);

/** Account first: sign in, then load your life from the cloud or create one. */
export default function Game() {
  const hydrated = useSyncExternalStore(subscribe, () => useGame.persist.hasHydrated(), () => false);
  const me = useOnline((s) => s.me);
  const hasGame = useGame((s) => s.game !== null);
  const owner = useGame((s) => s.owner);
  const [claiming, setClaiming] = useState<string | null>(null);
  // Only shown when the page opens; once you continue (or create a life) you're in.
  const [entered, setEntered] = useState(false);
  const game = useGame((s) => s.game);

  useEffect(() => {
    useGame.persist.rehydrate();
    useOnline.getState().refresh();
  }, []);

  // Returning with a session cookie: make sure the save on this device is this account's.
  const needsClaim = hydrated && !!me && owner !== me.username;
  useEffect(() => {
    if (!needsClaim || !me || claiming === me.username) return;
    const user = me.username;
    queueMicrotask(() => setClaiming(user));
    claimDevice(user)
      .then((clash) => clash && useGame.getState().load(clash.cloud, user))
      .catch(() => useGame.getState().load(null, user));
  }, [needsClaim, me, claiming]);

  if (!hydrated || me === undefined || needsClaim) return <Splash />;
  if (!me) return <AuthScreen />;
  if (!hasGame) return <Creator onDone={() => setEntered(true)} />;
  if (!entered) return <Welcome s={game!} onContinue={() => setEntered(true)} />;
  return <Play />;
}

function Splash() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#bfe0f7]">
      <div className="text-center">
        <h1 className="font-display text-5xl font-extrabold">Nairobi Life</h1>
        <p className="mt-2 animate-pulse text-muted">Loading Kanairo…</p>
      </div>
    </main>
  );
}
