"use client";

import { GROCERY } from "@/game/data";
import { canAfford, groceriesFor, groceryCost, type GroceryChannel } from "@/game/engine";
import { useGame } from "@/game/store";
import type { GameState } from "@/game/types";
import { Btn, ksh } from "./ui";

export default function GroceryShop({ s, channel }: { s: GameState; channel: GroceryChannel }) {
  const send = useGame((st) => st.send);
  return (
    <div className="space-y-2">
      {channel === "delivery" && <p className="text-sm text-muted">Delivered to your door in 40 minutes. 15% markup plus KSh 100 delivery per order.</p>}
      {groceriesFor(channel).map((id) => {
        const g = GROCERY[id];
        const one = groceryCost(s, id, 1, channel);
        const three = groceryCost(s, id, 3, channel);
        return (
          <div key={id} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-background/50 px-3 py-2">
            <div className="min-w-0">
              <div className="truncate font-semibold">
                {g.emoji} {g.name}
              </div>
              <div className="text-xs text-muted">
                {ksh(one)} · you have {s.pantry[id] ?? 0}
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <Btn variant="ghost" disabled={!canAfford(s, one) || !!s.event} onClick={() => send({ type: "buyGrocery", id, qty: 1, channel })}>
                +1
              </Btn>
              <Btn variant="ghost" disabled={!canAfford(s, three) || !!s.event} onClick={() => send({ type: "buyGrocery", id, qty: 3, channel })}>
                +3
              </Btn>
            </div>
          </div>
        );
      })}
    </div>
  );
}
