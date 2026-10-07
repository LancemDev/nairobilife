"use client";

import { useState, useSyncExternalStore } from "react";
import { canChoose, clock, dayOf, placeOf, isBlackout, isRushHour, isWaterCut, mood, sickness, weekdayOf } from "@/game/engine";
import { useGame } from "@/game/store";
import type { GameState, NeedKey } from "@/game/types";
import { useOnline } from "@/online/store";
import { useSync } from "@/online/useSync";
import { Avatar } from "./Avatar";
import CityMap from "./CityMap";
import Here from "./Here";
import HomePanel from "./HomePanel";
import Me from "./Me";
import { ChatSheet, PlayerSheet } from "./Online";
import People from "./People";
import Phone from "./Phone";
import { Badge, ksh, Meter } from "./ui";

type Tab = "here" | "map" | "phone" | "home" | "people" | "me";
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "here", label: "Here", emoji: "📍" },
  { id: "map", label: "Map", emoji: "🗺️" },
  { id: "phone", label: "Phone", emoji: "📱" },
  { id: "home", label: "Home", emoji: "🏠" },
  { id: "people", label: "People", emoji: "👥" },
  { id: "me", label: "Me", emoji: "🧍🏾" },
];

const desktopQuery = "(min-width: 1024px)";
const subscribeDesktop = (cb: () => void) => {
  const mq = window.matchMedia(desktopQuery);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

export default function Play() {
  const game = useGame((s) => s.game)!;
  const desktop = useSyncExternalStore(subscribeDesktop, () => window.matchMedia(desktopQuery).matches, () => false);
  const [tab, setTab] = useState<Tab>("here");
  const unread = useOnline((s) => s.unread);
  useSync();
  const go = (t: Tab) => {
    setTab(t);
    window.scrollTo({ top: 0 });
  };

  const panel = (t: Tab) => {
    switch (t) {
      case "map":
        // Remount per area so the map opens on wherever you are now (e.g. after a flight).
        return <CityMap key={placeOf(game).area} s={game} onArrive={() => !desktop && go("here")} />;
      case "phone":
        return <Phone s={game} />;
      case "home":
        return <HomePanel s={game} />;
      case "people":
        return <People s={game} />;
      case "me":
        return <Me s={game} />;
      default:
        return <Here s={game} onOpenMap={() => go("map")} />;
    }
  };
  const sideTab = tab === "here" ? "map" : tab;

  return (
    <main className="flex flex-1 flex-col pb-20 lg:pb-0">
      <div className="stripe h-1.5" />
      <Hud s={game} />
      {desktop ? (
        <div className="mx-auto grid w-full max-w-6xl flex-1 gap-4 px-4 py-4 lg:grid-cols-[1fr_minmax(0,460px)]">
          <Here s={game} onOpenMap={() => setTab("map")} />
          <div className="space-y-3">
            <div className="flex gap-1 rounded-xl bg-line/60 p-1">
              {TABS.filter((t) => t.id !== "here").map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 rounded-lg px-2 py-1.5 text-sm font-semibold transition ${sideTab === t.id ? "bg-card shadow-sm" : "text-muted hover:text-foreground"}`}>
                  {t.emoji} {t.label}
                  {t.id === "phone" && unread > 0 && <span className="ml-1 rounded-full bg-kred px-1.5 text-xs text-white">{unread}</span>}
                </button>
              ))}
            </div>
            {panel(sideTab)}
          </div>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">{panel(tab)}</div>
      )}
      {!desktop && (
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-background/95 backdrop-blur" aria-label="Game">
          <div className="mx-auto grid max-w-2xl grid-cols-6">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => go(t.id)} aria-current={tab === t.id} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${tab === t.id ? "text-foreground" : "text-muted"}`}>
                <span className={`relative text-xl transition ${tab === t.id ? "scale-110" : "grayscale-[60%]"}`}>
                  {t.emoji}
                  {t.id === "phone" && unread > 0 && <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-kred px-1 text-[10px] font-bold text-white">{unread}</span>}
                </span>
                {t.label}
              </button>
            ))}
          </div>
        </nav>
      )}
      {game.event && <EventModal s={game} />}
      <PlayerSheet s={game} />
      <ChatSheet />
    </main>
  );
}

const NEEDS: { key: NeedKey; label: string; emoji: string }[] = [
  { key: "hunger", label: "Hunger", emoji: "🍛" },
  { key: "energy", label: "Energy", emoji: "⚡" },
  { key: "bladder", label: "Bladder", emoji: "🚽" },
  { key: "hygiene", label: "Hygiene", emoji: "🫧" },
  { key: "fun", label: "Fun", emoji: "🎉" },
  { key: "social", label: "Social", emoji: "💬" },
];

const moodFace = (m: number) => (m >= 80 ? "😁" : m >= 60 ? "🙂" : m >= 40 ? "😐" : m >= 20 ? "😟" : "😫");

function Hud({ s }: { s: GameState }) {
  const m = mood(s);
  const sick = sickness(s);
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          {s.player.look ? <Avatar look={s.player.look} size={40} /> : <span className="text-3xl leading-none">{s.player.avatar}</span>}
          <div className="leading-tight">
            <div className="font-display font-bold">{s.player.name}</div>
            <div className="text-xs text-muted">
              {weekdayOf(s.time)} · Day {dayOf(s.time)} · <span className="font-mono">{clock(s.time)}</span>
            </div>
          </div>
        </div>
        <div className="leading-tight">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">M-Pesa</div>
          <div className={`font-mono font-bold ${s.money < 0 ? "text-kred" : "text-kgreen"}`}>
            {ksh(s.money)}
            {s.money < 0 && <span className="ml-1 text-[10px]">FULIZA</span>}
          </div>
        </div>
        <div className="leading-tight" title="Mood, and vibes (earned from wishes, spent on perks)">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Mood · Vibes</div>
          <div className="font-mono font-bold">
            {moodFace(m)} {Math.round(m)} · ✨ {s.vibes}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {isRushHour(s.time) && <Badge className="bg-sun/40">🚦 Rush hour</Badge>}
          {isBlackout(s) && <Badge className="bg-foreground text-background">⚡ Blackout</Badge>}
          {isWaterCut(s) && <Badge className="bg-sky-200 text-sky-900">🚱 No water</Badge>}
          {sick && <Badge className="bg-kred/15 text-kred">{sick.emoji} {sick.name}</Badge>}
          {s.arrears > 0 && <Badge className="bg-kred/15 text-kred">🧾 Owe {ksh(s.arrears)}</Badge>}
        </div>
        <div className="grid w-full grid-cols-3 gap-x-3 gap-y-1.5 sm:grid-cols-6 lg:ml-auto lg:w-auto lg:min-w-[460px]">
          {NEEDS.map((n) => (
            <Meter key={n.key} label={`${n.emoji} ${n.label}`} value={s.needs[n.key]} />
          ))}
        </div>
      </div>
    </header>
  );
}

function EventModal({ s }: { s: GameState }) {
  const send = useGame((st) => st.send);
  const e = s.event!;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/50 p-4 sm:items-center" role="dialog" aria-modal aria-labelledby="event-title">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="stripe h-2" />
        <div className="space-y-4 p-5">
          <h2 id="event-title" className="font-display text-2xl font-extrabold">
            {e.title}
          </h2>
          <p>{e.text}</p>
          <div className="grid gap-2">
            {e.choices.map((c, i) => (
              <button key={c.label} onClick={() => send({ type: "choose", index: i })} disabled={!canChoose(s, c)} className="rounded-xl bg-foreground px-4 py-3 text-left font-semibold text-background transition enabled:hover:bg-kgreen disabled:opacity-40">
                {c.label}
                {c.odds && <span className="ml-2 text-xs font-normal opacity-70">(risky)</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
