"use client";

import { useState } from "react";
import { ESTATES, GROCERY, OBJECTS, RECIPES, UNIT } from "@/game/data";
import { canAfford, estateOf, moveCost, price, unitOf, weeklyRent } from "@/game/engine";
import { useGame } from "@/game/store";
import type { GameState, HomeObject } from "@/game/types";
import { Btn, Card, Empty, ksh, Row, Tabs } from "./ui";

const CATS: { id: HomeObject["cat"]; label: string }[] = [
  { id: "sleep", label: "🛏️ Sleep" },
  { id: "kitchen", label: "🍳 Kitchen" },
  { id: "bath", label: "🚿 Bath" },
  { id: "comfort", label: "🛋️ Comfort" },
  { id: "fun", label: "📺 Fun" },
  { id: "skill", label: "🎸 Skills" },
  { id: "power", label: "⚡ Power" },
  { id: "decor", label: "🪴 Decor" },
  { id: "luxury", label: "💎 Luxury" },
];

export default function HomePanel({ s }: { s: GameState }) {
  const send = useGame((st) => st.send);
  const [tab, setTab] = useState<"buy" | "pantry" | "move">("buy");
  const [cat, setCat] = useState<HomeObject["cat"]>("sleep");
  const estate = estateOf(s);
  const unit = unitOf(s);
  const full = s.objects.length >= unit.slots;
  const blocked = !!s.event;

  return (
    <div className="space-y-3">
      <Card title={`🏠 ${unit.name}, ${estate.name}`}>
        <p className="-mt-2 text-sm text-muted">{estate.blurb}</p>
        <p className="mt-2 text-sm">
          Rent {ksh(weeklyRent(s))}/week, due Mondays · {s.objects.length}/{unit.slots} items
        </p>
      </Card>
      <Tabs value={tab} onChange={setTab} items={[{ id: "buy", label: "🛒 Buy mode" }, { id: "pantry", label: "🥫 Pantry" }, { id: "move", label: "🚚 Move house" }]} />

      {tab === "buy" && (
        <>
          <div className="flex flex-wrap gap-1">
            {CATS.map((c) => (
              <button key={c.id} onClick={() => setCat(c.id)} className={`rounded-full border px-3 py-1 text-sm ${cat === c.id ? "border-foreground bg-sun/40" : "border-line"}`}>
                {c.label}
              </button>
            ))}
          </div>
          {full && <p className="text-sm text-kred">Your place is full. Sell something or move somewhere bigger.</p>}
          <div className="space-y-2">
            {OBJECTS.filter((o) => o.cat === cat).map((o) => {
              const owned = s.objects.includes(o.id);
              const cost = price(s, o.price);
              return (
                <Row
                  key={o.id}
                  left={`${o.emoji} ${o.name}`}
                  sub={`${ksh(cost)} · ${o.desc}`}
                  right={
                    owned ? (
                      <Btn variant="ghost" disabled={blocked} onClick={() => send({ type: "sellObject", id: o.id })}>
                        Sell {ksh(o.price * 0.5)}
                      </Btn>
                    ) : (
                      <Btn disabled={full || !canAfford(s, cost) || blocked} onClick={() => send({ type: "buyObject", id: o.id })}>
                        Buy
                      </Btn>
                    )
                  }
                />
              );
            })}
          </div>
        </>
      )}

      {tab === "pantry" && (
        <Card title="Pantry">
          {Object.values(s.pantry).every((n) => n <= 0) ? (
            <Empty>Empty. Buy from the mama mboga at home, a supermarket, or the Chakula app.</Empty>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(s.pantry)
                .filter(([, n]) => n > 0)
                .map(([id, n]) => (
                  <span key={id} className="rounded-full border border-line px-3 py-1 text-sm">
                    {GROCERY[id].emoji} {GROCERY[id].name} ×{n}
                  </span>
                ))}
            </div>
          )}
          <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">Recipes</h4>
          <ul className="mt-2 space-y-1 text-sm">
            {RECIPES.map((r) => (
              <li key={r.id}>
                {r.emoji} <span className="font-semibold">{r.name}</span>: {Object.keys(r.needs).map((g) => GROCERY[g].name.split(" (")[0].toLowerCase()).join(", ")}
                {r.cooking > 0 && <span className="text-muted"> · cooking {r.cooking}+</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === "move" && (
        <div className="space-y-2">
          {s.arrears > 0 && <p className="text-sm text-kred">Clear your rent arrears before moving.</p>}
          {ESTATES.map((e) => (
            <Card key={e.id} title={e.name} right={<span className="text-xs text-muted">🚱 {Math.round(e.water * 100)}% · 🔊 {e.noise}</span>}>
              <p className="-mt-2 mb-2 text-sm text-muted">{e.blurb}</p>
              <div className="grid gap-1.5">
                {e.units.map((u) => {
                  const current = e.id === s.player.estateId && u === s.player.unitId;
                  const cost = moveCost(s, e.id, u);
                  const tooSmall = s.objects.length > UNIT[u].slots;
                  return (
                    <Row
                      key={u}
                      left={UNIT[u].name}
                      sub={`${ksh(weeklyRent(s, e.id, u))}/wk · ${UNIT[u].slots} items`}
                      right={
                        current ? (
                          <span className="text-xs font-semibold text-kgreen">You live here</span>
                        ) : (
                          <Btn variant="ghost" disabled={tooSmall || s.arrears > 0 || !canAfford(s, cost) || blocked} onClick={() => send({ type: "moveHouse", estate: e.id, unit: u })} title={tooSmall ? "Too much stuff" : `First week + movers: ${ksh(cost)}`}>
                            Move {ksh(cost)}
                          </Btn>
                        )
                      }
                    />
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
