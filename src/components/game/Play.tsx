"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { AREA, CITY_NAME, GOALS, NPC, WISH } from "@/game/data";
import { activeMoodlets, canChoose, clock, dayOf, groceryChannels, hourOf, isBlackout, isRushHour, isWaterCut, mood, npcsHere, placeOf, sickness, weekdayOf } from "@/game/engine";
import { splitIcon } from "@/game/icons";
import { useGame } from "@/game/store";
import type { GameState, LogEntry, NeedKey } from "@/game/types";
import { api, type Profile } from "@/online/api";
import { useOnline } from "@/online/store";
import { useSync } from "@/online/useSync";
import type { Prop } from "@/world/layout";
import { Avatar } from "./Avatar";
import BuyTray from "./BuyTray";
import GroceryShop from "./GroceryShop";
import { SocialSheet } from "./Here";
import { Icon } from "./Icon";
import MapScreen from "./MapScreen";
import { PlayerSheet } from "./Online";
import PhoneOverlay from "./Phone";
import DeparturesBoard from "./Departures";
import RideOverlay from "./RideOverlay";
import { duration, ksh } from "./ui";
import { useUi, type Overlay } from "./uiStore";

const World = dynamic(() => import("@/world/World"), { ssr: false, loading: () => <div className="absolute inset-0 grid place-items-center text-muted">Loading Kanairo…</div> });

const DOCK: { id: Exclude<Overlay, null> | "home"; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "buy", label: "Buy", icon: "sofa" },
  { id: "map", label: "Map", icon: "map" },
  { id: "phone", label: "Phone", icon: "device-mobile" },
];

const NEEDS: { key: NeedKey; icon: string; label: string }[] = [
  { key: "hunger", icon: "bowl", label: "Hunger" },
  { key: "energy", icon: "bolt", label: "Energy" },
  { key: "fun", icon: "confetti", label: "Fun" },
  { key: "social", icon: "message-circle", label: "Social" },
  { key: "hygiene", icon: "droplets", label: "Hygiene" },
  { key: "bladder", icon: "toilet-paper", label: "Bladder" },
];

const moodWord = (m: number) => (m >= 80 ? ["Ecstatic", "mood-happy", "text-kgreen"] : m >= 60 ? ["Happy", "mood-smile", "text-kgreen"] : m >= 40 ? ["Okay", "mood-empty", "text-amber-600"] : m >= 20 ? ["Uncomfortable", "mood-sad", "text-orange-600"] : ["Miserable", "mood-cry", "text-kred"]);
const barColor = (v: number) => (v < 20 ? "bg-kred" : v < 45 ? "bg-sun" : "bg-kgreen");

export default function Play() {
  const game = useGame((s) => s.game)!;
  const send = useGame((s) => s.send);
  const me = useOnline((s) => s.me);
  const unread = useOnline((s) => s.unread);
  const { overlay, open, openApp, ride, startRide } = useUi();
  useSync();

  const [prop, setProp] = useState<Prop | null>(null);
  const [busy, setBusy] = useState<{ label: string; icon: string; minutes: number; prop: Prop } | null>(null);
  const [npc, setNpc] = useState<string | null>(null);
  const [clean, setClean] = useState(false);
  const [hereOpen, setHereOpen] = useState(false);
  const [status, setStatus] = useState(false);
  const [others, setOthers] = useState<Profile[]>([]);
  const view = useOnline((s) => s.view);
  const place = placeOf(game);
  const atHome = game.location === "home";

  // Real players in this area, for the 3D room.
  useEffect(() => {
    if (!me) return;
    let live = true;
    const load = () => api.online(place.area).then((d) => live && setOthers(d.players)).catch(() => {});
    load();
    const id = setInterval(() => !document.hidden && load(), 30_000);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, [me, place.area, game.location]);

  const act = (id: string) => {
    const a = prop?.actions.find((x) => x.id === id);
    if (!a || a.disabled || busy) return;
    const used = prop!;
    setProp(null);
    if (id === "departures") {
      open("departures");
      return;
    }
    // Flights, the SGR and long-distance buses play as a ride before you arrive.
    if (id === "board" && game.flight) {
      startRide({ kind: "plane", title: `${game.flight.airline} ${game.flight.code}`, from: place.name, to: CITY_NAME[game.flight.to], minutes: game.flight.air, finish: { type: "act", id } });
      return;
    }
    const trip = /^sgr/.test(id) ? "train" : /^(busBack|lorry)$/.test(id) ? "matatu" : null;
    if (trip) {
      startRide({ kind: trip, title: a.label, from: place.name, to: a.label.replace(/^(Madaraka Express to|Night bus to|Hitch a lorry to)\s*/i, "").replace(/\s*\(.*\)$/, ""), minutes: a.minutes, finish: { type: "act", id } });
      return;
    }
    setBusy({ label: a.label, icon: a.emoji, minutes: a.minutes, prop: used });
    // Let the character lie down, sit or get busy for a moment before time jumps forward.
    setTimeout(() => {
      send({ type: "act", id });
      setBusy(null);
    }, Math.min(3200, 1400 + a.minutes * 4));
  };

  const dock = (id: (typeof DOCK)[number]["id"]) => {
    setProp(null);
    if (id === "home") open(null);
    else if (id === "phone") openApp(null);
    else open(overlay === id ? null : id);
  };
  const active = overlay ?? "home";

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#bfe0f7] text-foreground">
      {/* The room unmounts under the full-screen map so only one 3D scene runs at a time. */}
      {overlay !== "map" && !ride && <World s={game} busy={!!busy} busyProp={busy?.prop ?? null} others={others} selected={prop?.id ?? null} onSelect={(p) => (p?.kind === "departures" && p.actions.some((a) => a.id === "departures") ? (setProp(null), open("departures")) : setProp(p))} onNpc={setNpc} onPlayer={view} />}
      {overlay === "map" && <MapScreen s={game} />}

      {!clean && (
        <>
          <TopBar s={game} />
          {overlay !== "map" && <LeftStack s={game} onClean={() => setClean(true)} onOpen={() => setStatus(!status)} />}
        </>
      )}
      {clean && (
        <button onClick={() => setClean(false)} className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold shadow">
          Show HUD
        </button>
      )}
      <Toasts log={game.log} />
      <Arrival s={game} />

      {!overlay && prop && !busy && <ActionMenu prop={prop} onAct={act} onClose={() => setProp(null)} />}
      {busy && <Busy busy={busy} />}
      {status && !overlay && !clean && <StatusPanel s={game} onClose={() => setStatus(false)} />}
      {!overlay && hereOpen && <HereCard s={game} others={others} onClose={() => setHereOpen(false)} onNpc={setNpc} />}
      {overlay === "buy" && <BuyTray s={game} />}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        {overlay !== "map" && (
          <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-white/95 py-1 pl-3 pr-1 text-sm font-semibold shadow-lg">
            <Icon emoji={place.emoji} size={18} className="text-kgreen" />
            <button onClick={() => setHereOpen(!hereOpen)} className="flex max-w-[52vw] items-center gap-1 truncate px-1">
              <span className="truncate">{place.name}</span>
              <Icon name={hereOpen ? "chevron-down" : "chevron-up"} size={16} />
            </button>
            <button onClick={() => dock("map")} aria-label="Map" className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5">
              <Icon name="map" size={18} />
            </button>
          </div>
        )}
        <nav className="pointer-events-auto flex gap-1 rounded-2xl bg-white/95 p-1.5 shadow-xl" aria-label="Game">
          {DOCK.map((d) => {
            const disabled = d.id === "buy" && !atHome;
            return (
              <button
                key={d.id}
                disabled={disabled}
                title={disabled ? "Go home to buy things for your place" : undefined}
                onClick={() => dock(d.id)}
                className={`relative flex w-[72px] flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold transition disabled:opacity-35 sm:w-24 ${active === d.id ? "bg-foreground text-background" : "text-muted enabled:hover:text-foreground"}`}
              >
                <Icon name={d.icon} size={22} />
                {d.label}
                {d.id === "phone" && unread > 0 && <span className="absolute right-3 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-kred px-1 text-[10px] font-bold text-white">{unread}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {overlay === "phone" && <PhoneOverlay s={game} />}
      {overlay === "departures" && <DeparturesBoard s={game} />}
      {ride && <RideOverlay />}
      {npc && <SocialSheet s={game} npc={npc} onClose={() => setNpc(null)} />}
      {game.event && <EventModal s={game} />}
      <PlayerSheet s={game} />
    </main>
  );
}

/** What's around you right now: the vibe, who's here, and the local shop. */
function HereCard({ s, others, onClose, onNpc }: { s: GameState; others: Profile[]; onClose: () => void; onNpc: (id: string) => void }) {
  const view = useOnline((st) => st.view);
  const place = placeOf(s);
  const area = AREA[place.area];
  const npcs = npcsHere(s);
  const players = others.filter((p) => p.venue === s.location && s.location !== "home");
  const shop = groceryChannels(s).find((c) => c !== "delivery");
  const [shopping, setShopping] = useState(false);
  return (
    <div className="absolute inset-x-0 bottom-36 z-10 flex justify-center px-3">
      <div className="max-h-[50dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white/97 p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">{area?.name}</div>
            <div className="font-display text-xl font-bold">{place.name}</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full hover:bg-black/5">
            <Icon name="x" size={18} />
          </button>
        </div>
        <p className="mt-1 text-sm italic text-muted">“{area?.vibe}”</p>
        {(npcs.length > 0 || players.length > 0) && (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
            {players.map((p) => (
              <button key={p.username} onClick={() => view(p.username)} className="flex w-14 shrink-0 flex-col items-center gap-1">
                <Avatar look={p.look} size={44} ring="#2563eb" />
                <span className="w-full truncate text-[10px] font-semibold">@{p.username}</span>
              </button>
            ))}
            {npcs.map((id) => (
              <button key={id} onClick={() => onNpc(id)} className="flex w-14 shrink-0 flex-col items-center gap-1">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-sun/30">
                  <Icon emoji={NPC[id].emoji} size={22} />
                </span>
                <span className="w-full truncate text-[10px] font-semibold">{NPC[id].name}</span>
              </button>
            ))}
          </div>
        )}
        {shop && (
          <div className="mt-3">
            <button onClick={() => setShopping(!shopping)} className="flex items-center gap-1 rounded-full bg-kgreen/10 px-3 py-1.5 text-sm font-semibold text-kgreen">
              <Icon name="shopping-cart" size={16} /> {shop === "mamaMboga" ? "Mama Mboga" : "Supermarket"}
            </button>
            {shopping && (
              <div className="mt-2">
                <GroceryShop s={s} channel={shop} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TopBar({ s }: { s: GameState }) {
  const m = mood(s);
  const [word, icon, color] = moodWord(m);
  const night = hourOf(s.time) >= 19 || hourOf(s.time) < 6;
  const sick = sickness(s);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center px-3 pt-3">
      <div className="pointer-events-auto flex max-w-full items-center gap-3 overflow-x-auto rounded-full bg-white/95 px-4 py-2 text-sm font-semibold shadow-lg">
        <span className="flex shrink-0 items-center gap-1.5">
          <Icon name={night ? "moon" : "sun"} size={16} className={night ? "text-indigo-500" : "text-amber-500"} />
          {weekdayOf(s.time)} {dayOf(s.time)} · {clock(s.time)}
        </span>
        <span className="h-4 w-px bg-line" />
        <span className={`flex shrink-0 items-center gap-1 ${color}`}>
          <Icon name={icon} size={18} />
          <span className="hidden sm:inline">{word}</span>
        </span>
        {(isBlackout(s) || isWaterCut(s) || isRushHour(s.time) || sick) && <span className="h-4 w-px bg-line" />}
        {isBlackout(s) && <Icon name="bolt" size={16} className="text-foreground" />}
        {isWaterCut(s) && <Icon name="droplet-off" size={16} className="text-sky-600" />}
        {isRushHour(s.time) && <Icon name="traffic-lights" size={16} className="text-amber-600" />}
        {sick && <Icon emoji={sick.emoji} size={16} className="text-kred" />}
        <span className="h-4 w-px bg-line" />
        <span className={`shrink-0 font-mono ${s.money < 0 ? "text-kred" : ""}`}>{ksh(s.money)}</span>
      </div>
    </div>
  );
}

const SKILL_ICON: Record<string, string> = { hustle: "cash", tech: "device-laptop", charm: "heart", fitness: "barbell", cooking: "chef-hat", music: "music", dance: "music", comedy: "mood-happy", photography: "camera" };
const left = (until: number, now: number) => {
  const m = Math.max(0, until - now);
  return m >= 60 ? `${Math.round(m / 60)}h` : `${m}m`;
};

/** Drops down beside the HUD: needs with numbers, mood, moodlets, goals and top skills. Tap outside to close. */
function StatusPanel({ s, onClose }: { s: GameState; onClose: () => void }) {
  const m = Math.round(mood(s));
  const [word, icon, tone] = moodWord(m);
  const goal = GOALS.find((g) => !s.goalsDone.includes(g.id));
  const wishes = s.wishes.ids.map((id) => WISH[id]).filter(Boolean);
  const skills = Object.entries(s.skills).sort((a, b) => b[1] - a[1]).slice(0, 4);
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute left-3 top-16 z-40 max-h-[calc(100dvh-180px)] w-[min(320px,calc(100vw-24px))] overflow-y-auto rounded-3xl bg-white/97 p-4 shadow-2xl sm:left-[15rem] sm:top-3">
        <div className="flex items-center gap-2">
          <Icon name={icon} size={26} className={tone} />
          <div className="flex-1">
            <div className={`font-display text-lg font-bold leading-tight ${tone}`}>{word}</div>
            <div className="text-xs text-muted">Mood {m}/100</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full hover:bg-black/5">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
          {NEEDS.map((n) => (
            <div key={n.key}>
              <div className="flex items-center gap-1 text-xs">
                <Icon name={n.icon} size={13} className="text-muted" />
                <span className="flex-1 font-medium">{n.label}</span>
                <span className="font-mono text-muted">{Math.round(s.needs[n.key])}</span>
              </div>
              <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-line">
                <div className={`h-full rounded-full ${barColor(s.needs[n.key])}`} style={{ width: `${s.needs[n.key]}%` }} />
              </div>
            </div>
          ))}
        </div>
        {activeMoodlets(s).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {activeMoodlets(s).map((x) => (
              <span key={x.id} className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${x.mood >= 0 ? "bg-kgreen/12 text-kgreen" : "bg-kred/12 text-kred"}`}>
                <Icon emoji={x.emoji} size={13} />
                {x.label}
                <span className="font-mono opacity-70">
                  {x.mood > 0 ? "+" : ""}
                  {x.mood} · {left(x.until, s.time)}
                </span>
              </span>
            ))}
          </div>
        )}
        {(goal || wishes.length > 0) && (
          <div className="mt-3 space-y-1.5 border-t border-line pt-3">
            {goal && (
              <div className="flex items-center gap-2 text-xs">
                <Icon name="target" size={15} className="text-kgreen" />
                <span className="flex-1 font-medium">{goal.label}</span>
              </div>
            )}
            {wishes.map((w) => (
              <div key={w.id} className={`flex items-center gap-2 text-xs ${s.wishes.done.includes(w.id) ? "text-muted line-through" : ""}`}>
                <Icon name="sparkles" size={15} className="text-amber-500" />
                <span className="flex-1">{w.label}</span>
                <span className="font-mono text-muted">+{w.vibes}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 grid grid-cols-4 gap-1 border-t border-line pt-3">
          {skills.map(([k, v]) => (
            <div key={k} className="flex flex-col items-center rounded-xl bg-background py-1.5">
              <Icon name={SKILL_ICON[k] ?? "sparkles"} size={16} />
              <span className="text-[10px] capitalize text-muted">{k}</span>
              <span className="font-mono text-xs font-bold">{Math.round(v)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function LeftStack({ s, onClean, onOpen }: { s: GameState; onClean: () => void; onOpen: () => void }) {
  const goal = GOALS.find((g) => !s.goalsDone.includes(g.id));
  const wish = s.wishes.ids.map((id) => WISH[id]).find((w) => w && !s.wishes.done.includes(w.id));
  const top = goal ? { icon: "target", title: goal.label, sub: "Getting started" } : wish ? { icon: "sparkles", title: wish.label, sub: `Wish · +${wish.vibes} vibes` } : null;
  const moodlets = activeMoodlets(s).slice(0, 3);
  return (
    <div className="absolute left-3 top-16 flex w-44 flex-col gap-2 sm:top-3 sm:w-52">
      {top && (
        <button onClick={onOpen} className="flex items-center gap-2 rounded-2xl bg-white/95 p-2 text-left shadow-lg">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-kgreen text-white">
            <Icon name={top.icon} size={18} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-semibold">{top.title}</span>
            <span className="block truncate text-[11px] text-muted">{top.sub}</span>
          </span>
        </button>
      )}
      <button onClick={onOpen} className="grid grid-cols-3 gap-x-2 gap-y-1.5 rounded-2xl bg-white/95 p-2.5 shadow-lg" aria-label="Needs">
        {NEEDS.map((n) => (
          <span key={n.key} className="flex items-center gap-1" title={`${n.label} ${Math.round(s.needs[n.key])}`}>
            <Icon name={n.icon} size={13} className="text-muted" />
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <span className={`block h-full rounded-full ${barColor(s.needs[n.key])}`} style={{ width: `${s.needs[n.key]}%` }} />
            </span>
          </span>
        ))}
      </button>
      {moodlets.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {moodlets.map((m) => (
            <span key={m.id} title={m.label} className={`grid h-7 w-7 place-items-center rounded-full shadow ${m.mood >= 0 ? "bg-kgreen text-white" : "bg-kred text-white"}`}>
              <Icon emoji={m.emoji} size={15} />
            </span>
          ))}
        </div>
      )}
      <button onClick={onClean} className="w-fit rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-muted shadow">
        Clean screen
      </button>
    </div>
  );
}

function ActionMenu({ prop, onAct, onClose }: { prop: Prop; onAct: (id: string) => void; onClose: () => void }) {
  return (
    <div className="absolute inset-x-0 bottom-36 flex justify-center px-3">
      <div className="max-h-[42vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white/97 p-3 shadow-2xl">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">{prop.label}</h3>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full hover:bg-black/5">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="grid gap-1.5">
          {prop.actions.map((a) => (
            <button key={a.id} disabled={!!a.disabled} onClick={() => onAct(a.id)} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2 text-left transition enabled:hover:border-foreground enabled:hover:bg-sun/15 enabled:active:scale-[0.98] disabled:opacity-45">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sun/25">
                <Icon emoji={a.emoji} size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{a.label}</span>
                {a.disabled && <span className="block truncate text-xs text-kred">{a.disabled}</span>}
              </span>
              <span className="flex shrink-0 flex-col items-end gap-0.5 font-mono text-[11px] text-muted">
                <span className="flex items-center gap-0.5">
                  <Icon name="clock" size={12} />
                  {duration(a.minutes)}
                </span>
                {a.cost > 0 && <span>{ksh(a.cost)}</span>}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Busy({ busy }: { busy: { label: string; icon: string; minutes: number; prop: Prop } }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-36 flex justify-center px-3">
      <div className="flex w-full max-w-xs items-center gap-3 rounded-2xl bg-foreground/90 p-3 text-background shadow-2xl">
        <Icon emoji={busy.icon} size={24} className="animate-bounce" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{busy.label}</span>
          <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/20">
            <span className="block h-full rounded-full bg-sun" style={{ animation: `grow ${Math.min(3200, 1400 + busy.minutes * 4)}ms linear forwards` }} />
          </span>
        </span>
        <span className="font-mono text-xs opacity-70">{duration(busy.minutes)}</span>
      </div>
    </div>
  );
}

/** Short-lived notifications for new diary entries, instead of a wall of text. */
function Toasts({ log }: { log: LogEntry[] }) {
  const seen = useRef<number | null>(null);
  const [items, setItems] = useState<LogEntry[]>([]);
  const newest = log[0]?.id ?? 0;
  useEffect(() => {
    if (seen.current === null) {
      seen.current = newest;
      return;
    }
    const fresh = log.filter((e) => e.id > seen.current!).reverse();
    seen.current = newest;
    if (!fresh.length) return;
    const t0 = setTimeout(() => setItems((cur) => [...cur, ...fresh].slice(-3)), 0);
    const t1 = setTimeout(() => setItems((cur) => cur.filter((x) => !fresh.includes(x))), 4500);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
    };
  }, [newest, log]);
  const tone = { info: "bg-white text-foreground", good: "bg-kgreen text-white", bad: "bg-kred text-white", event: "bg-foreground text-background" };
  return (
    <div className="pointer-events-none absolute right-3 top-16 flex w-[min(320px,calc(100vw-24px))] flex-col gap-2 sm:top-3">
      {items.map((e) => {
        const { icon, text } = splitIcon(e.text);
        return (
          <div key={e.id} className={`flex items-start gap-2 rounded-2xl px-3 py-2 text-sm shadow-lg ${tone[e.tone]}`}>
            <Icon name={icon ?? (e.tone === "good" ? "circle-check" : e.tone === "bad" ? "ban" : "bell")} size={18} className="mt-0.5" />
            <span className="line-clamp-3">{text}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Banner when you arrive somewhere new. */
function Arrival({ s }: { s: GameState }) {
  const place = placeOf(s);
  const [shown, setShown] = useState<string | null>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t0 = setTimeout(() => setShown(s.location), 0);
    const t1 = setTimeout(() => setShown(null), 2200);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
    };
  }, [s.location]);
  if (shown !== s.location) return null;
  const area = AREA[place.area];
  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/4 flex justify-center px-4">
      <div className="animate-[fadeUp_2.2s_ease_forwards] rounded-3xl bg-white/95 px-6 py-4 text-center shadow-2xl">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted">{area?.name}</div>
        <div className="font-display text-3xl font-extrabold">{place.name}</div>
        <div className="mt-1 max-w-xs text-sm italic text-muted">{area?.vibe}</div>
      </div>
    </div>
  );
}

function EventModal({ s }: { s: GameState }) {
  const send = useGame((st) => st.send);
  const e = s.event!;
  const icon = useMemo(() => (e.id === "arrest" ? "car-crash" : "bell"), [e.id]);
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal aria-labelledby="event-title">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="stripe h-2" />
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sun/30">
              <Icon name={icon} size={24} />
            </span>
            <h2 id="event-title" className="font-display text-2xl font-extrabold leading-tight">
              {e.title}
            </h2>
          </div>
          <p className="text-[15px]">{splitIcon(e.text).text}</p>
          <div className="grid gap-2">
            {e.choices.map((c, i) => (
              <button key={c.label} onClick={() => send({ type: "choose", index: i })} disabled={!canChoose(s, c)} className="rounded-2xl bg-foreground px-4 py-3 text-left font-semibold text-background transition enabled:hover:bg-kgreen disabled:opacity-40">
                {splitIcon(c.label).text}
                {c.odds && <span className="ml-2 text-xs font-normal opacity-70">(risky)</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
