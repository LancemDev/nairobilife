"use client";

import { useState } from "react";
import { ESTATES, GROCERY, OBJECTS, RECIPES, UNIT } from "@/game/data";
import { canAfford, estateOf, moveCost, price, unitOf, weeklyRent } from "@/game/engine";
import { useGame } from "@/game/store";
import type { GameState, HomeObject } from "@/game/types";
import { Btn, Card, Empty, IconLabel, ksh, Row, Tabs } from "./ui";

const CATS: { id: HomeObject["cat"]; label: React.ReactNode }[] = [
  { id: "sleep", label: <IconLabel emoji="🛏️">Sleep</IconLabel> },
  { id: "kitchen", label: <IconLabel emoji="🍳">Kitchen</IconLabel> },
  { id: "bath", label: <IconLabel emoji="🚿">Bath</IconLabel> },
  { id: "comfort", label: <IconLabel emoji="🛋️">Comfort</IconLabel> },
  { id: "fun", label: <IconLabel emoji="📺">Fun</IconLabel> },
  { id: "skill", label: <IconLabel emoji="🎸">Skills</IconLabel> },
  { id: "power", label: <IconLabel emoji="⚡">Power</IconLabel> },
  { id: "decor", label: <IconLabel emoji="🪴">Decor</IconLabel> },
  { id: "luxury", label: <IconLabel emoji="💎">Luxury</IconLabel> },
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
      <Card title={<IconLabel emoji="🏠">{`${unit.name}, ${estate.name}`}</IconLabel>}>
        <p className="-mt-2 text-sm text-muted">{estate.blurb}</p>
        <p className="mt-2 text-sm">
          Rent {ksh(weeklyRent(s))}/week, due Mondays · {s.objects.length}/{unit.slots} items
        </p>
      </Card>
      <Tabs value={tab} onChange={setTab} items={[{ id: "buy", label: <IconLabel emoji="🛒">Buy mode</IconLabel> }, { id: "pantry", label: <IconLabel emoji="🥫">Pantry</IconLabel> }, { id: "move", label: <IconLabel emoji="🚚">Move house</IconLabel> }]} />

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
                  left={<IconLabel emoji={o.emoji}>{`${o.name}`}</IconLabel>}
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
                    <IconLabel emoji={GROCERY[id].emoji}>{GROCERY[id].name} ×{n}</IconLabel>
                  </span>
                ))}
            </div>
          )}
          <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">Recipes</h4>
          <ul className="mt-2 space-y-1 text-sm">
            {RECIPES.map((r) => (
              <li key={r.id}>
                <IconLabel emoji={r.emoji}><span className="font-semibold">{r.name}</span></IconLabel>: {Object.keys(r.needs).map((g) => GROCERY[g].name.split(" (")[0].toLowerCase()).join(", ")}
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
            <Card key={e.id} title={e.name} right={<span className="flex gap-2 text-xs text-muted"><IconLabel name="droplet-off" size={14}>{Math.round(e.water * 100)}%</IconLabel><IconLabel name="volume" size={14}>{e.noise}</IconLabel></span>}>
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
