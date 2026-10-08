"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { AREA } from "@/game/data";
import { canAfford, cityOf, estateOf, placeOf, quote, travelModes } from "@/game/engine";
import { iconName } from "@/game/icons";
import { useGame } from "@/game/store";
import type { GameState } from "@/game/types";
import { api, type Profile } from "@/online/api";
import { useOnline } from "@/online/store";
import { buildCity, type CityId, type Landmark } from "@/world/city";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { duration, ksh } from "./ui";
import { useUi } from "./uiStore";

const CityView = dynamic(() => import("@/world/CityView"), { ssr: false, loading: () => <div className="absolute inset-0 grid place-items-center text-white">Loading the city…</div> });

const CITIES: { id: CityId; label: string; icon: string }[] = [
  { id: "nairobi", label: "Nairobi", icon: "building-skyscraper" },
  { id: "mombasa", label: "Mombasa", icon: "beach" },
  { id: "kisumu", label: "Kisumu", icon: "fish" },
];

/** Full-screen 3D city: drag to explore, tap a place to go there. */
export default function MapScreen({ s }: { s: GameState }) {
  const send = useGame((st) => st.send);
  const open = useUi((st) => st.open);
  const startRide = useUi((st) => st.startRide);
  const view = useOnline((st) => st.view);
  const me = useOnline((st) => st.me);
  const here = placeOf(s);
  const [city, setCity] = useState<CityId>(cityOf(here.area) as CityId);
  const [picked, setPicked] = useState<Landmark | null>(null);
  const [players, setPlayers] = useState<Profile[]>([]);
  const pins = useRef(new Map<string, HTMLElement | null>());
  const home = estateOf(s);
  const landmarks = useMemo(() => buildCity(city, home.id).landmarks, [city, home.id]);

  useEffect(() => {
    if (!me) return;
    let live = true;
    const load = () => api.online().then((d) => live && setPlayers(d.players)).catch(() => {});
    load();
    const id = setInterval(() => !document.hidden && load(), 20_000);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, [me]);

  const cityPlayers = players.filter((p) => p.area && cityOf(p.area) === city);
  const target = picked && picked.id !== s.location ? placeOf(s, picked.id) : null;
  const blocked = target ? quote(s, target.id, "walk").blocked : undefined;

  return (
    <div className="absolute inset-0 z-20 bg-[#4a90b8]">
      <CityView city={city} homeEstate={home.id} here={s.location} players={cityPlayers} selected={picked?.id ?? null} onSelect={setPicked} onPlayer={view} counts={{}} pins={pins} />

      {/* pins over the canvas */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {landmarks.map((l) => {
          const mine = l.id === s.location;
          return (
            <button
              key={l.id}
              ref={(el) => void pins.current.set(l.id, el)}
              onClick={() => setPicked(l)}
              className={`pointer-events-auto absolute left-0 top-0 flex items-center gap-1 rounded-full py-1 pl-1 pr-2 text-[11px] font-semibold shadow-md transition will-change-transform ${picked?.id === l.id ? "bg-foreground text-background" : mine ? "bg-kgreen text-white" : "bg-white text-foreground"}`}
              style={{ transform: "translate(-9999px,0)" }}
            >
              <span className={`grid h-6 w-6 place-items-center rounded-full ${picked?.id === l.id || mine ? "bg-white/20" : "bg-sun/30"}`}>
                <Icon name={l.id === "home" ? "home" : iconName(l.emoji)} size={14} />
              </span>
              <span className="max-w-[120px] truncate">{mine ? "You're here" : l.name}</span>
            </button>
          );
        })}
        {cityPlayers.map((p) => (
          <button key={p.username} ref={(el) => void pins.current.set(`player:${p.username}`, el)} onClick={() => view(p.username)} className="pointer-events-auto absolute left-0 top-0 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow will-change-transform" style={{ transform: "translate(-9999px,0)" }}>
            @{p.username}
          </button>
        ))}
      </div>

      {/* city switcher */}
      <div className="absolute inset-x-0 top-16 flex justify-center px-3 sm:top-20">
        <div className="flex gap-1 rounded-full bg-white/95 p-1 shadow-lg">
          {CITIES.map((c) => (
            <button key={c.id} onClick={() => (setCity(c.id), setPicked(null))} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${city === c.id ? "bg-blue-600 text-white" : "text-muted hover:text-foreground"}`}>
              <Icon name={c.icon} size={16} /> {c.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => open(null)} className="absolute right-3 top-16 flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-semibold shadow-lg sm:top-20">
        <Icon name="x" size={16} /> Close
      </button>

      {/* travel card */}
      {picked && (
        <div className="absolute inset-x-0 bottom-28 flex justify-center px-3">
          <div className="w-full max-w-md rounded-3xl bg-white p-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sun/30">
                <Icon name={picked.id === "home" ? "home" : iconName(picked.emoji)} size={24} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-lg font-bold">{picked.name}</div>
                <div className="truncate text-xs text-muted">{AREA[picked.area]?.name} · {cityPlayers.filter((p) => p.venue === picked.id).length} players here</div>
              </div>
              <button onClick={() => setPicked(null)} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full hover:bg-black/5">
                <Icon name="x" size={18} />
              </button>
            </div>
            {cityPlayers.some((p) => p.venue === picked.id) && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {cityPlayers
                  .filter((p) => p.venue === picked.id)
                  .map((p) => (
                    <button key={p.username} onClick={() => view(p.username)} className="flex shrink-0 flex-col items-center gap-0.5">
                      <Avatar look={p.look} size={36} />
                      <span className="max-w-14 truncate text-[10px] font-semibold">@{p.username}</span>
                    </button>
                  ))}
              </div>
            )}
            {picked.id === s.location ? (
              <p className="mt-3 text-sm text-muted">You&apos;re here.</p>
            ) : blocked ? (
              <p className="mt-3 text-sm text-muted">{blocked}.</p>
            ) : (
              target && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(quote(s, target.id, "walk").local ? travelModes(s).slice(0, 1) : travelModes(s)).map((m) => {
                    const q = quote(s, target.id, m.id);
                    return (
                      <button
                        key={m.id}
                        disabled={!!s.event || !canAfford(s, q.fare)}
                        onClick={() => {
                          const cmd = { type: "travel" as const, dest: target.id, mode: m.id };
                          if (q.local) {
                            send(cmd);
                            open(null);
                          } else startRide({ kind: m.id, title: m.label, from: here.name, to: target.name, minutes: q.minutes, finish: cmd });
                        }}
                        className="flex items-center gap-2 rounded-2xl bg-background px-3 py-2 text-left transition enabled:hover:bg-sun/20 disabled:opacity-40"
                      >
                        <Icon emoji={q.local ? "🚶" : m.emoji} size={22} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{q.local ? "Walk over" : m.label}</span>
                          <span className="block font-mono text-[11px] text-muted">
                            {duration(q.minutes)} · {q.fare ? ksh(q.fare) : "free"}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
