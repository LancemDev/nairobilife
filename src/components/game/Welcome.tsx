"use client";

import dynamic from "next/dynamic";
import { dayOf, netWorth } from "@/game/engine";
import { useGame } from "@/game/store";
import type { GameState } from "@/game/types";
import { api } from "@/online/api";
import { useOnline } from "@/online/store";
import { Avatar } from "./Avatar";
import { ksh } from "./ui";

const World = dynamic(() => import("@/world/World"), { ssr: false });

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const noop = () => {};

/** Returning player: your home turning slowly behind a Continue card. */
export default function Welcome({ s, onContinue }: { s: GameState; onContinue: () => void }) {
  const me = useOnline((st) => st.me)!;
  const setMe = useOnline((st) => st.setMe);
  const { load, reset } = useGame();
  const home = { ...s, location: "home", event: null };
  const day = dayOf(s.time);
  const date = new Date(2026, 9, 4 + day);
  return (
    <main className="fixed inset-0 overflow-hidden bg-gradient-to-b from-[#bfe0f7] to-[#e8f3fb]">
      <World s={home} busy={false} others={[]} selected={null} onSelect={noop} onNpc={noop} onPlayer={noop} showcase />
      <div className="pointer-events-none absolute inset-x-0 top-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-kred">The 254 life-sim</p>
        <h1 className="font-display text-5xl font-extrabold sm:text-6xl">Nairobi Life</h1>
        <p className="mt-1 text-muted">Live your Kanairo story.</p>
      </div>
      <div className="absolute inset-x-0 bottom-6 flex justify-center px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white/95 p-4 shadow-2xl backdrop-blur">
          <div className="flex items-center gap-3 rounded-2xl bg-background p-2.5">
            <Avatar look={s.player.look} size={48} />
            <div className="min-w-0">
              <div className="truncate font-semibold">{me.displayName}</div>
              <div className="truncate text-sm text-muted">
                {DAYS[(day - 1) % 7]} {date.getDate()} {MONTHS[date.getMonth()]} · {ksh(netWorth(s))}
              </div>
            </div>
          </div>
          <button onClick={onContinue} className="mt-3 w-full rounded-2xl bg-kgreen py-3.5 font-display text-lg font-bold text-white shadow-lg transition hover:brightness-110 active:scale-[0.98]">
            Continue
          </button>
          <button
            onClick={() => window.confirm("Start a new life? Your current save will be replaced.") && load(null, me.username)}
            className="mt-2 w-full rounded-2xl border border-line bg-white py-3 font-semibold transition hover:border-foreground"
          >
            New life
          </button>
          <div className="mt-3 flex items-center justify-between text-xs text-muted">
            <span>
              Signed in as <span className="font-semibold text-foreground">@{me.username}</span>
            </span>
            <button
              onClick={async () => {
                await api.putSave(s).catch(() => {});
                await api.logout().catch(() => {});
                reset();
                setMe(null);
              }}
              className="font-semibold text-blue-600 hover:underline"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
