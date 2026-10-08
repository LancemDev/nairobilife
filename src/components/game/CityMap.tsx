"use client";

import { useState } from "react";
import { AREAS, AREA, CITY_AREAS, VENUES } from "@/game/data";
import { canAfford, cityOf, estateOf, npcsHere, placeOf, quote, travelModes } from "@/game/engine";
import { useOnline } from "@/online/store";
import { useGame } from "@/game/store";
import type { GameState } from "@/game/types";
import { iconName } from "@/game/icons";
import { Icon } from "./Icon";
import { ICONS } from "./icons";
import { Card, duration, IconLabel, ksh, Tabs } from "./ui";

const NAIROBI = AREAS.filter((a) => !a.city);

/** A Tabler icon drawn inside the map's SVG, centred on (x, y). */
function MapGlyph({ name, x, y, size, color }: { name: string; x: number; y: number; size: number; color: string }) {
  const Cmp = ICONS[name] ?? ICONS["circle-dot"];
  return <Cmp x={x - size / 2} y={y - size / 2} width={size} height={size} stroke={1.8} color={color} style={{ pointerEvents: "none" }} />;
}

export default function CityMap({ s, onArrive }: { s: GameState; onArrive?: () => void }) {
  const send = useGame((st) => st.send);
  const here = placeOf(s);
  const home = estateOf(s);
  const [areaId, setArea] = useState(here.area);
  const [dest, setDest] = useState<string | null>(null);
  const counts = useOnline((st) => st.areaCounts);
  const city = cityOf(areaId);
  const area = AREA[areaId];
  const spots = [...(home.area === areaId ? [{ id: "home", name: `Home · ${home.name}`, emoji: "🏠", blurb: "Your place." }] : []), ...VENUES.filter((v) => v.area === areaId)];
  const target = dest && dest !== s.location ? placeOf(s, dest) : null;

  return (
    <div className="space-y-3">
      <Tabs
        value={city}
        onChange={(c) => {
          setArea(c === "nairobi" ? (cityOf(here.area) === "nairobi" ? here.area : "jkia") : c);
          setDest(null);
        }}
        items={[{ id: "nairobi", label: <IconLabel emoji="🏙️">Nairobi</IconLabel> }, ...CITY_AREAS.map((a) => ({ id: a.id as string, label: <IconLabel emoji={a.emoji}>{`${a.name}${counts[a.id] ? ` · ${counts[a.id]} online` : ""}`}</IconLabel> }))]}
      />
      {city === "nairobi" && <Card title="Kanairo" right={<span className="text-xs text-muted">Tap an area · green badge = players online</span>}>
        <svg viewBox="0 0 100 100" className="w-full select-none rounded-xl bg-[#ece2d0]" role="group" aria-label="Map of Nairobi">
          <g stroke="#d9cbb2" strokeWidth="1.4" fill="none" strokeLinecap="round">
            <path d="M50 47 L36 35 L33 13" />
            <path d="M50 47 L47 25 L53 11" />
            <path d="M50 47 L66 22" />
            <path d="M50 47 L74 47 L88 50" />
            <path d="M50 47 L74 70 L80 88" />
            <path d="M50 47 L44 56 L40 73 L32 90" />
            <path d="M44 56 L34 52 L22 78 L10 88" />
            <path d="M50 47 L58 63" />
            <path d="M50 47 L61 38" />
          </g>
          {NAIROBI.map((a) => {
            const isHere = here.area === a.id;
            const selected = areaId === a.id;
            return (
              <g key={a.id} onClick={() => { setArea(a.id); setDest(null); }} className="cursor-pointer" role="button" aria-label={a.name}>
                <circle cx={a.x} cy={a.y} r={selected ? 4.4 : 3.6} fill={isHere ? "var(--kenya-green)" : selected ? "var(--sun)" : "var(--card)"} stroke="var(--foreground)" strokeWidth="0.5" />
                <MapGlyph name={isHere && s.location !== "home" ? "user" : iconName(a.emoji)} x={a.x} y={a.y} size={4} color={isHere ? "#fff" : "var(--foreground)"} />
                <text x={a.x} y={a.y + 7} textAnchor="middle" fontSize="2.5" fontWeight={selected || isHere ? 700 : 500} fill="var(--foreground)">
                  {a.name}
                </text>
                {counts[a.id] > 0 && (
                  <>
                    <circle cx={a.x - 3.4} cy={a.y - 3.4} r="2.2" fill="var(--kenya-green)" stroke="var(--card)" strokeWidth="0.5" />
                    <text x={a.x - 3.4} y={a.y - 2.6} textAnchor="middle" fontSize="2.2" fontWeight={700} fill="#fff">
                      {counts[a.id] > 9 ? "9+" : counts[a.id]}
                    </text>
                  </>
                )}
              </g>
            );
          })}
          {/* Home rides on its area's node so it never covers a label. */}
          <g onClick={() => { setArea(home.area); setDest("home"); }} className="cursor-pointer" role="button" aria-label="Home">
            <rect x={AREA[home.area].x + 1.6} y={AREA[home.area].y - 6.4} width="5" height="5" rx="1.4" fill={s.location === "home" ? "var(--kenya-green)" : "var(--kenya-red)"} stroke="var(--foreground)" strokeWidth="0.4" />
            <MapGlyph name={s.location === "home" ? "user" : "home"} x={AREA[home.area].x + 4.1} y={AREA[home.area].y - 3.9} size={3.2} color="#fff" />
          </g>
        </svg>
      </Card>}

      <Card title={<IconLabel emoji={area.emoji}>{`${area.name}`}</IconLabel>}>
        <p className="-mt-2 mb-3 text-sm text-muted">{area.blurb}</p>
        <div className="grid gap-2">
          {spots.map((v) => {
            const isHere = v.id === s.location;
            const people = isHere ? npcsHere(s).length : 0;
            return (
              <button key={v.id} disabled={isHere} onClick={() => setDest(v.id)} className={`flex items-center gap-3 rounded-xl border p-2.5 text-left transition disabled:opacity-60 ${dest === v.id ? "border-foreground bg-sun/30" : "border-line bg-background/50 hover:border-muted"}`}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sun/25"><Icon emoji={v.emoji} size={22} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">
                    {v.name}
                    {isHere && <span className="ml-2 text-xs font-normal text-kgreen">You&apos;re here{people ? ` · ${people} around` : ""}</span>}
                  </span>
                  <span className="block truncate text-xs text-muted">{v.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {target && quote(s, target.id, "walk").blocked && (
        <Card title={`Go to ${target.name}`}>
          <p className="text-sm text-muted">{quote(s, target.id, "walk").blocked}. {cityOf(here.area) === "nairobi" ? "JKIA and the SGR terminus are in the JKIA area." : "The airport and the bus or train are in the city list above."}</p>
        </Card>
      )}
      {target && !quote(s, target.id, "walk").blocked && (
        <Card title={`Go to ${target.name}`}>
          <div className="grid grid-cols-2 gap-2">
            {(quote(s, target.id, "walk").local ? travelModes(s).slice(0, 1) : travelModes(s)).map((m) => {
              const q = quote(s, target.id, m.id);
              const blocked = !!s.event || !canAfford(s, q.fare);
              return (
                <button
                  key={m.id}
                  disabled={blocked}
                  onClick={() => {
                    send({ type: "travel", dest: target.id, mode: m.id });
                    setDest(null);
                    onArrive?.();
                  }}
                  className="rounded-xl border border-line bg-background/50 px-3 py-2 text-left transition enabled:hover:border-foreground disabled:opacity-40"
                >
                  <div className="font-semibold">
                    {q.local ? <IconLabel name="walk">Walk over</IconLabel> : <IconLabel emoji={m.emoji}>{m.label}</IconLabel>}
                  </div>
                  <div className="font-mono text-xs text-muted">
                    {duration(q.minutes)} · {q.fare ? ksh(q.fare) : "free"}
                    {q.energy > 1 && ` · −${q.energy} energy`}
                    {q.rush && !q.local && m.id !== "walk" && m.id !== "boda" && " · rush hour"}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
