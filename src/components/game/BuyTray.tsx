"use client";

import { useState } from "react";
import { OBJECTS } from "@/game/data";
import { canAfford, price, unitOf } from "@/game/engine";
import { useGame } from "@/game/store";
import type { GameState, HomeObject } from "@/game/types";
import { Icon } from "./Icon";
import { ksh } from "./ui";
import { useUi } from "./uiStore";

const CATS: { id: HomeObject["cat"]; label: string; icon: string }[] = [
  { id: "sleep", label: "Sleep", icon: "bed" },
  { id: "kitchen", label: "Kitchen", icon: "tools-kitchen-2" },
  { id: "bath", label: "Bath", icon: "bath" },
  { id: "comfort", label: "Comfort", icon: "sofa" },
  { id: "fun", label: "Fun", icon: "device-tv" },
  { id: "skill", label: "Skills", icon: "guitar-pick" },
  { id: "power", label: "Power", icon: "bolt" },
  { id: "decor", label: "Decor", icon: "plant-2" },
  { id: "luxury", label: "Luxury", icon: "diamond" },
];

/** Buy mode: a tray over your room. Things you buy appear in the 3D scene straight away. */
export default function BuyTray({ s }: { s: GameState }) {
  const send = useGame((st) => st.send);
  const { open, openApp } = useUi();
  const [cat, setCat] = useState<HomeObject["cat"]>("sleep");
  const unit = unitOf(s);
  const full = s.objects.length >= unit.slots;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center px-3">
      <div className="pointer-events-auto w-full max-w-3xl rounded-3xl bg-white/97 p-3 shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 gap-1 overflow-x-auto">
            {CATS.map((c) => (
              <button key={c.id} onClick={() => setCat(c.id)} className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${cat === c.id ? "bg-foreground text-background" : "bg-background text-muted hover:text-foreground"}`}>
                <Icon name={c.icon} size={14} /> {c.label}
              </button>
            ))}
          </div>
          <span className="hidden shrink-0 font-mono text-xs text-muted sm:block">
            {s.objects.length}/{unit.slots} items
          </span>
          <button onClick={() => open(null)} aria-label="Close" className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-black/5">
            <Icon name="x" size={18} />
          </button>
        </div>
        {full && <p className="mt-2 text-xs text-kred">Your place is full. Sell something, or move somewhere bigger in the Houses app.</p>}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {OBJECTS.filter((o) => o.cat === cat).map((o) => {
            const owned = s.objects.includes(o.id);
            const cost = price(s, o.price);
            return (
              <div key={o.id} className={`flex w-36 shrink-0 flex-col rounded-2xl border p-2.5 ${owned ? "border-kgreen bg-kgreen/5" : "border-line"}`}>
                <span className="grid h-16 place-items-center rounded-xl bg-gradient-to-br from-sun/30 to-sun/5">
                  <Icon emoji={o.emoji} size={32} className="text-foreground/80" />
                </span>
                <span className="mt-2 truncate text-sm font-semibold">{o.name}</span>
                <span className="line-clamp-2 min-h-8 text-[11px] text-muted">{o.desc}</span>
                {owned ? (
                  <button onClick={() => send({ type: "sellObject", id: o.id })} className="mt-2 rounded-xl bg-background py-1.5 text-xs font-semibold hover:bg-kred/10 hover:text-kred">
                    Sell {ksh(o.price * 0.5)}
                  </button>
                ) : (
                  <button disabled={full || !canAfford(s, cost) || !!s.event} onClick={() => send({ type: "buyObject", id: o.id })} className="mt-2 rounded-xl bg-kgreen py-1.5 text-xs font-semibold text-white disabled:opacity-40">
                    {ksh(cost)}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex gap-2 text-xs">
          <button onClick={() => openApp("houses")} className="flex items-center gap-1 rounded-full bg-background px-3 py-1.5 font-semibold text-muted hover:text-foreground">
            <Icon name="truck" size={14} /> Move house
          </button>
          <button onClick={() => openApp("chakula")} className="flex items-center gap-1 rounded-full bg-background px-3 py-1.5 font-semibold text-muted hover:text-foreground">
            <Icon name="basket" size={14} /> Groceries
          </button>
        </div>
      </div>
    </div>
  );
}
