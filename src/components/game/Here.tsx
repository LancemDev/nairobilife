"use client";

import { useEffect, useState } from "react";
import { AREA, NPC, SOCIALS, relLabel } from "@/game/data";
import { availableActions, clock, dayOf, groceryChannels, npcsHere, placeOf, socialBlocked, socialOdds } from "@/game/engine";
import { useGame } from "@/game/store";
import type { ActionView, GameState } from "@/game/types";
import { splitIcon } from "@/game/icons";
import { api, type Profile } from "@/online/api";
import { useOnline } from "@/online/store";
import { Avatar } from "./Avatar";
import GroceryShop from "./GroceryShop";
import { Icon } from "./Icon";
import { Btn, Card, duration, IconLabel, ksh, Meter, Sheet } from "./ui";

export default function Here({ s, onOpenMap }: { s: GameState; onOpenMap: () => void }) {
  const send = useGame((st) => st.send);
  const [npc, setNpc] = useState<string | null>(null);
  const [shop, setShop] = useState(false);
  const place = placeOf(s);
  const area = AREA[place.area];
  const actions = availableActions(s);
  const sections = groupBy(actions, (a) => a.section ?? "Things to do");
  const people = npcsHere(s);
  const channels = groceryChannels(s).filter((c) => c !== "delivery");

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-line bg-card">
        <div className="border-b border-line p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                <IconLabel emoji={area.emoji}>{area.name}</IconLabel>
              </div>
              <h2 className="font-display text-3xl font-extrabold leading-tight">
                <IconLabel emoji={place.emoji} size={26}>{place.name}</IconLabel>
              </h2>
            </div>
            <Btn variant="ghost" onClick={onOpenMap}>
              <IconLabel name="map">Go</IconLabel>
            </Btn>
          </div>
          <p className="mt-1 text-muted">{place.blurb}</p>
          <p className="mt-2 text-sm italic">“{area.vibe}”</p>
          {(people.length > 0 || channels.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {people.map((id) => {
                const n = NPC[id];
                const r = s.relationships[id];
                return (
                  <button key={id} onClick={() => setNpc(id)} className="flex items-center gap-2 rounded-full border border-line bg-background/60 py-1 pl-1 pr-3 text-sm transition hover:border-foreground">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-sun/30"><Icon emoji={n.emoji} size={16} /></span>
                    <span className="font-semibold">{n.name}</span>
                    <span className="text-xs" style={{ color: relLabel(r?.rel ?? 0, r?.bae, r?.married).color }}>
                      {relLabel(r?.rel ?? 0, r?.bae, r?.married).label}
                    </span>
                  </button>
                );
              })}
              {channels.length > 0 && (
                <button onClick={() => setShop(true)} className="flex items-center gap-2 rounded-full border border-kgreen/40 bg-kgreen/10 px-3 py-1 text-sm font-semibold text-kgreen transition hover:border-kgreen">
                  <IconLabel name="shopping-cart">{channels[0] === "mamaMboga" ? "Mama Mboga" : "Supermarket"}</IconLabel>
                </button>
              )}
            </div>
          )}
        </div>
        {Object.entries(sections).map(([title, list]) => (
          <div key={title} className="border-b border-line last:border-0">
            <h3 className="px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-muted">{title}</h3>
            <ul className="grid gap-2 p-3 sm:grid-cols-2">
              {list.map((a) => (
                <li key={a.id}>
                  <ActionButton a={a} onClick={() => send({ type: "act", id: a.id })} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
      <PlayersHere area={place.area} location={s.location} />
      <Diary s={s} />
      {npc && <SocialSheet s={s} npc={npc} onClose={() => setNpc(null)} />}
      {shop && (
        <Sheet title={channels[0] === "mamaMboga" ? "Mama Mboga" : "Supermarket"} onClose={() => setShop(false)}>
          <GroceryShop s={s} channel={channels[0]} />
        </Sheet>
      )}
    </div>
  );
}

/** Real players hanging around the same area right now. */
function PlayersHere({ area, location }: { area: string; location: string }) {
  const me = useOnline((st) => st.me);
  const view = useOnline((st) => st.view);
  // Tagged with the area so a stale list never shows under a new heading.
  const [data, setData] = useState<{ area: string; players: Profile[] }>({ area: "", players: [] });
  const players = data.area === area ? data.players : [];
  useEffect(() => {
    if (!me) return;
    let live = true;
    const load = () => api.online(area).then((d) => live && setData({ area, players: d.players })).catch(() => {});
    load();
    const id = setInterval(() => !document.hidden && load(), 30_000);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, [me, area, location]);
  if (!me || !players.length) return null;
  return (
    <Card title={`Players around ${AREA[area]?.name ?? ""}`}>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {players.map((p) => (
          <button key={p.username} onClick={() => view(p.username)} className="flex w-16 shrink-0 flex-col items-center gap-1 text-center">
            <Avatar look={p.look} size={52} ring={p.venue === location ? "var(--kenya-green)" : undefined} />
            <span className="w-full truncate text-xs font-semibold">{p.displayName}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

function ActionButton({ a, onClick }: { a: ActionView; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={!!a.disabled} className="flex h-full w-full gap-3 rounded-xl border border-line bg-background/60 p-3 text-left transition enabled:hover:border-foreground enabled:hover:bg-sun/20 enabled:active:scale-[0.98] disabled:opacity-50">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sun/25"><Icon emoji={a.emoji} size={22} /></span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-snug">{a.label}</span>
        <span className="block text-sm text-muted">{a.disabled ?? a.detail}</span>
        <span className="mt-1 flex gap-3 font-mono text-xs text-muted">
          <IconLabel name="clock" size={12}>{duration(a.minutes)}</IconLabel>
          {a.cost > 0 && <span>{ksh(a.cost)}</span>}
        </span>
      </span>
    </button>
  );
}

export function SocialSheet({ s, npc, onClose }: { s: GameState; npc: string; onClose: () => void }) {
  const send = useGame((st) => st.send);
  const n = NPC[npc];
  const r = s.relationships[npc] ?? { rel: 0 };
  const label = relLabel(r.rel, r.bae, r.married);
  const present = npcsHere(s).includes(npc);
  return (
    <Sheet title={<IconLabel emoji={n.emoji} size={22}>{`${n.name}, ${n.age}`}</IconLabel>} onClose={onClose}>
      <p className="text-muted">{n.bio}</p>
      <p className="mt-2 italic">{n.line}</p>
      <div className="mt-3">
        <Meter label={<span style={{ color: label.color }}>{label.label}</span>} value={r.rel + 100} max={200} tone="neutral" display={Math.round(r.rel)} />
      </div>
      {!present && <p className="mt-3 text-sm text-kred">{n.name} has left.</p>}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {SOCIALS.map((soc) => {
          const blocked = socialBlocked(s, npc, soc.id);
          return (
            <button key={soc.id} disabled={!!blocked || !present || !!s.event} onClick={() => send({ type: "social", npc, social: soc.id })} className="rounded-xl border border-line bg-background/60 p-2.5 text-left text-sm transition enabled:hover:border-foreground disabled:opacity-40">
              <div className="font-semibold">
                <IconLabel emoji={soc.emoji}>{soc.label}</IconLabel>
              </div>
              <div className="text-xs text-muted">{blocked ?? `${Math.round(socialOdds(s, soc.id) * 100)}% · ${soc.minutes}m`}</div>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

function Diary({ s }: { s: GameState }) {
  const tone = { info: "", good: "text-kgreen", bad: "text-kred", event: "font-semibold" };
  return (
    <Card title="Diary">
      <ol className="max-h-72 space-y-1.5 overflow-y-auto pr-1 text-sm">
        {s.log.slice(0, 50).map((e) => (
          <li key={e.id} className="flex gap-3">
            <span className="shrink-0 font-mono text-xs leading-5 text-muted">
              D{dayOf(e.time)} {clock(e.time)}
            </span>
            <IconLabel name={splitIcon(e.text).icon ?? "point"} className={`!whitespace-normal ${tone[e.tone]}`}>{splitIcon(e.text).text}</IconLabel>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function groupBy<T>(list: T[], key: (t: T) => string) {
  const out: Record<string, T[]> = {};
  for (const item of list) (out[key(item)] ??= []).push(item);
  return out;
}
