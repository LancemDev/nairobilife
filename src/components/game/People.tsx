"use client";

import { AREA, DATE_COST, NPC, NPCS, RING_COST, VENUE, WEDDING_TIERS, relLabel } from "@/game/data";
import { canAfford, price } from "@/game/engine";
import { useGame } from "@/game/store";
import type { GameState } from "@/game/types";
import { Btn, Card, Empty, ksh, Meter } from "./ui";

export default function People({ s }: { s: GameState }) {
  const send = useGame((st) => st.send);
  const known = Object.entries(s.relationships).sort(([, a], [, b]) => b.rel - a.rel);
  const strangers = NPCS.filter((n) => !s.relationships[n.id]);
  const engaged = known.find(([, r]) => r.engaged);
  const blocked = !!s.event;

  return (
    <div className="space-y-3">
      {engaged && (
        <Card title={`💍 Plan the wedding with ${NPC[engaged[0]].name}`}>
          <div className="grid gap-2">
            {WEDDING_TIERS.map((t) => (
              <button key={t.id} disabled={!canAfford(s, t.cost) || blocked} onClick={() => send({ type: "wedding", tier: t.id })} className="rounded-xl border border-line p-3 text-left transition enabled:hover:border-foreground disabled:opacity-40">
                <div className="flex justify-between font-semibold">
                  <span>
                    {t.emoji} {t.label}
                  </span>
                  <span className="font-mono text-sm">{ksh(t.cost)}</span>
                </div>
                <p className="text-sm text-muted">{t.desc}</p>
              </button>
            ))}
          </div>
        </Card>
      )}

      <Card title="Your people">
        {known.length === 0 ? (
          <Empty>No one yet. Say hi to the people you meet around Kanairo.</Empty>
        ) : (
          <div className="space-y-3">
            {known.map(([id, r]) => {
              const n = NPC[id];
              const label = relLabel(r.rel, r.bae, r.married);
              const v = VENUE[n.venue];
              return (
                <div key={id} className="rounded-xl border border-line bg-background/50 p-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-sun/30 text-2xl">{n.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">
                        {n.name} <span className="text-xs" style={{ color: label.color }}>{label.label}{r.engaged ? " · Engaged" : ""}</span>
                      </div>
                      <div className="truncate text-xs text-muted">
                        {r.married ? "Lives with you" : `📍 ${v.name}, ${AREA[v.area].name} · ${n.hours[0]}:00–${n.hours[1]}:00`}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Meter label="Relationship" value={r.rel + 100} max={200} tone="neutral" display={Math.round(r.rel)} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Btn variant="ghost" disabled={r.rel < 20 || blocked} onClick={() => send({ type: "call", npc: id })} title={r.rel < 20 ? "Get closer first" : undefined}>
                      📞 Call
                    </Btn>
                    {(r.bae || r.married) && (
                      <Btn variant="ghost" disabled={!canAfford(s, price(s, DATE_COST)) || blocked} onClick={() => send({ type: "date", npc: id })}>
                        🌹 Date ({ksh(price(s, DATE_COST))})
                      </Btn>
                    )}
                    {r.bae && !r.engaged && !r.married && (
                      <Btn disabled={r.rel < 85 || !canAfford(s, RING_COST) || blocked} onClick={() => send({ type: "propose", npc: id })} title={r.rel < 85 ? "Get closer first (85+)" : undefined}>
                        💍 Propose ({ksh(RING_COST)})
                      </Btn>
                    )}
                    {(r.bae || r.engaged || r.married) && (
                      <Btn variant="danger" disabled={blocked} onClick={() => send({ type: "breakUp", npc: id })}>
                        💔 Break up
                      </Btn>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {strangers.length > 0 && (
        <Card title="Around Kanairo">
          <div className="space-y-2">
            {strangers.map((n) => {
              const v = VENUE[n.venue];
              return (
                <div key={n.id} className="flex items-center gap-3 text-sm">
                  <span className="text-xl">{n.emoji}</span>
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-semibold">{n.name}</span> <span className="text-muted">· {v.name}, {n.hours[0]}:00–{n.hours[1]}:00</span>
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
