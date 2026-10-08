"use client";

import { useState } from "react";
import { CABINS, CITY_NAME, CITY_OF_AIRPORT, type Cabin } from "@/game/data";
import { canAfford, canBook, dayOf, departures, placeOf, type Departure } from "@/game/engine";
import { useGame } from "@/game/store";
import type { GameState } from "@/game/types";
import { Icon } from "./Icon";
import { duration, ksh } from "./ui";
import { useUi } from "./uiStore";

const clock = (t: number) => `${String(Math.floor((t % 1440) / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
const STATUS_TONE: Record<string, string> = {
  "On time": "text-emerald-400",
  Delayed: "text-amber-400",
  Boarding: "text-sky-300 animate-pulse",
  "Check-in closed": "text-orange-400",
  "Gate closed": "text-red-400",
};
const seatOf = (code: string, cabin: Cabin) => {
  const n = [...code].reduce((h, c) => h + c.charCodeAt(0), 0);
  return cabin === "business" ? `${1 + (n % 3)}${"ACDF"[n % 4]}` : `${8 + (n % 20)}${"ABCDEF"[n % 6]}`;
};

/** The airport's split-flap board: pick a flight, choose a cabin, check in, and carry a boarding pass. */
export default function DeparturesBoard({ s }: { s: GameState }) {
  const send = useGame((st) => st.send);
  const close = useUi((st) => st.open);
  const [picked, setPicked] = useState<Departure | null>(null);
  const [cabin, setCabin] = useState<Cabin>("economy");
  const list = departures(s);
  const here = placeOf(s);
  const f = s.flight;
  const tomorrow = (t: number) => dayOf(t) !== dayOf(s.time);

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/40 p-3 sm:items-center" onClick={() => close(null)}>
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-[#0b1220] text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <Icon name="plane-departure" size={26} className="text-amber-400" />
          <div className="min-w-0 flex-1">
            <div className="font-mono text-lg font-bold tracking-widest text-amber-400">DEPARTURES</div>
            <div className="truncate text-xs text-white/60">{here.name} · Kuondoka</div>
          </div>
          <div className="font-mono text-2xl font-bold text-amber-300">{clock(s.time)}</div>
          <button onClick={() => close(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10">
            <Icon name="x" size={20} />
          </button>
        </div>

        {f && f.from === s.location && (
          <div className="mx-3 mt-3 overflow-hidden rounded-2xl bg-white text-foreground">
            <div className="flex items-center justify-between bg-kgreen px-4 py-2 text-white">
              <span className="text-sm font-bold">{f.airline} · Boarding pass</span>
              <span className="font-mono text-sm">{f.code}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pt-3">
              <div>
                <div className="font-display text-3xl font-black">{CITY_OF_AIRPORT[f.from] === "nairobi" ? "NBO" : CITY_OF_AIRPORT[f.from] === "mombasa" ? "MBA" : "KIS"}</div>
                <div className="text-xs text-muted">{CITY_NAME[CITY_OF_AIRPORT[f.from]]}</div>
              </div>
              <Icon name="plane" size={22} className="text-muted" />
              <div className="text-right">
                <div className="font-display text-3xl font-black">{f.to === "nairobi" ? "NBO" : f.to === "mombasa" ? "MBA" : "KIS"}</div>
                <div className="text-xs text-muted">{CITY_NAME[f.to]}</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 px-4 py-3 text-center">
              {[
                ["Boarding", clock(f.dep - 45)],
                ["Departs", clock(f.dep)],
                ["Gate", String(f.gate)],
                ["Seat", seatOf(f.code, f.cabin)],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-[10px] uppercase text-muted">{k}</div>
                  <div className="font-mono text-lg font-bold">{v}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-dashed border-black/20 px-4 py-2 text-xs">
              <span className="rounded-full bg-sun/30 px-2 py-0.5 font-semibold capitalize">{f.cabin}</span>
              <span className="flex-1 text-muted">{f.cabin === "business" ? "Lounge access included." : "Head to the gate when boarding opens."}</span>
              <button onClick={() => send({ type: "cancelFlight" })} className="font-semibold text-kred">
                Cancel (50% refund)
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-[3.5rem_4.5rem_1fr_2.5rem_6.5rem] gap-2 px-4 pb-1 pt-3 font-mono text-[10px] uppercase tracking-wider text-white/50">
          <span>Time</span>
          <span>Flight</span>
          <span>To</span>
          <span>Gate</span>
          <span className="text-right">Remarks</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {list.map((d) => (
            <button
              key={`${d.code}${d.dep}`}
              onClick={() => (setPicked(d), setCabin("economy"))}
              className={`grid w-full grid-cols-[3.5rem_4.5rem_1fr_2.5rem_6.5rem] items-center gap-2 rounded-xl px-2 py-2 text-left font-mono text-sm transition ${picked?.code === d.code && picked.dep === d.dep ? "bg-white/15" : "hover:bg-white/5"}`}
            >
              <span className="font-bold text-amber-300">
                {clock(d.dep)}
                {tomorrow(d.dep) && <sup className="ml-0.5 text-[9px] text-white/50">+1</sup>}
              </span>
              <span>{d.code}</span>
              <span className="truncate font-sans font-semibold uppercase tracking-wide">{CITY_NAME[d.to]}</span>
              <span className="text-center">{d.gate}</span>
              <span className={`text-right text-xs font-semibold ${STATUS_TONE[d.status]}`}>{d.status}</span>
            </button>
          ))}
        </div>

        {picked && (
          <div className="border-t border-white/10 bg-white p-4 text-foreground">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg font-bold">
                  {picked.airline} {picked.code} · {CITY_NAME[picked.to]}
                </div>
                <div className="text-xs text-muted">
                  Departs {clock(picked.dep)}
                  {tomorrow(picked.dep) ? " tomorrow" : ""} · {duration(picked.air)} in the air · Gate {picked.gate}
                  {picked.delayed ? " · delayed" : ""}
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {CABINS.map((c) => (
                <button key={c.id} onClick={() => setCabin(c.id)} className={`rounded-2xl border-2 p-3 text-left transition ${cabin === c.id ? "border-kgreen bg-kgreen/10" : "border-black/10"}`}>
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    <Icon name={c.id === "business" ? "armchair" : "user"} size={16} /> {c.label}
                  </div>
                  <div className="font-mono text-sm">{ksh(picked.fares[c.id])}</div>
                  <div className="text-[11px] text-muted">{c.id === "business" ? "Lounge, hot meal, extra legroom" : "Tea, biscuits, a window if you're lucky"}</div>
                </button>
              ))}
            </div>
            <button
              disabled={!!f || !canBook(picked) || !canAfford(s, picked.fares[cabin])}
              onClick={() => {
                send({ type: "bookFlight", code: picked.code, dep: picked.dep, cabin });
                setPicked(null);
              }}
              className="mt-3 w-full rounded-2xl bg-kgreen py-3 font-semibold text-white disabled:opacity-40"
            >
              {f ? "You already have a ticket" : !canBook(picked) ? picked.status : !canAfford(s, picked.fares[cabin]) ? "Can't afford" : `Check in · ${ksh(picked.fares[cabin])}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
