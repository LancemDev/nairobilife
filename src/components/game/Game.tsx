"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useGame } from "@/game/store";
import { useOnline } from "@/online/store";
import Account from "./Account";
import Creator from "./Creator";
import Play from "./Play";

const subscribe = (cb: () => void) => useGame.persist.onFinishHydration(cb);

export default function Game() {
  const hydrated = useSyncExternalStore(subscribe, () => useGame.persist.hasHydrated(), () => false);
  const hasGame = useGame((s) => s.game !== null);
  const [creating, setCreating] = useState(false);
  const [login, setLogin] = useState(false);

  useEffect(() => {
    useGame.persist.rehydrate();
    useOnline.getState().refresh();
  }, []);

  if (!hydrated) return <TitleScreen />;
  if (hasGame) return <Play />;
  if (creating) return <Creator onBack={() => setCreating(false)} />;
  return (
    <>
      <TitleScreen onStart={() => setCreating(true)} onLogin={() => setLogin(true)} />
      {login && <Account initial="login" onClose={() => setLogin(false)} />}
    </>
  );
}

function TitleScreen({ onStart, onLogin }: { onStart?: () => void; onLogin?: () => void }) {
  return (
    <main className="flex flex-1 flex-col">
      <div className="stripe h-3" />
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-8 px-4 py-12">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-kred">The 254 life-sim</p>
          <h1 className="font-display text-6xl font-extrabold leading-[0.95] sm:text-7xl">
            Nairobi
            <br />
            Life
          </h1>
          <p className="mt-4 text-lg text-muted">
            Move to the city, find a hustle, ride matatus, survive KPLC blackouts, and try to make it from a Kayole bedsitter to Karen.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-2xl" aria-hidden>
          <span>🚐</span>
          <span>🏍️</span>
          <span>🍖</span>
          <span>🦒</span>
          <span>⚡</span>
          <span>📱</span>
        </div>
        <button
          onClick={onStart}
          disabled={!onStart}
          className="w-full rounded-2xl bg-foreground px-6 py-4 font-display text-xl font-bold text-background transition hover:bg-kgreen disabled:opacity-50 sm:w-auto"
        >
          {onStart ? "Anza maisha →" : "Loading…"}
        </button>
        {onLogin && (
          <button onClick={onLogin} className="text-left text-sm font-semibold text-muted underline-offset-4 hover:text-foreground hover:underline">
            Already have a profile? Ingia (log in) and pick up your life →
          </button>
        )}
      </div>
    </main>
  );
}
