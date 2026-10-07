"use client";

import { useEffect, useRef, useState } from "react";
import {
  AREA,
  BANK,
  BUSINESSES,
  BUSINESS_RESALE,
  CAR,
  CARS,
  CAR_RESALE,
  CAREERS,
  DELIVERY_FEE,
  DELIVERY_MENU,
  DERBY_ODDS,
  LAND_SEARCH_FEE,
  LAND_SELL_FEE,
  NPC,
  OFFICE,
  OFFICES,
  PLOT,
  PLOTS,
  POLICIES,
  SHA_WEEKLY,
  VENUE,
} from "@/game/data";
import { canAfford, clock, dayOf, electionOdds, fulizaLimit, isWeekend, netWorth, price } from "@/game/engine";
import { useGame } from "@/game/store";
import type { GameState } from "@/game/types";
import { useOnline } from "@/online/store";
import Account from "./Account";
import GroceryShop from "./GroceryShop";
import { UjumbeApp, WatuApp } from "./Online";
import { Btn, Card, Empty, ksh, Row, Tabs } from "./ui";

type App = "mpesa" | "benki" | "chakula" | "kazi" | "mali" | "ndege" | "siasa" | "gist" | "ujumbe" | "watu";
const APPS: { id: App; label: string; emoji: string; color: string }[] = [
  { id: "ujumbe", label: "Ujumbe", emoji: "💬", color: "bg-emerald-600" },
  { id: "watu", label: "Watu", emoji: "👥", color: "bg-cyan-700" },
  { id: "mpesa", label: "M-Pesa", emoji: "💸", color: "bg-kgreen" },
  { id: "benki", label: "Benki", emoji: "🏦", color: "bg-sky-700" },
  { id: "chakula", label: "Chakula", emoji: "🛵", color: "bg-orange-500" },
  { id: "kazi", label: "Kazi", emoji: "💼", color: "bg-violet-700" },
  { id: "mali", label: "Mali", emoji: "🏗️", color: "bg-amber-700" },
  { id: "ndege", label: "Ndege", emoji: "🛫", color: "bg-kred" },
  { id: "siasa", label: "Siasa", emoji: "🏛️", color: "bg-slate-700" },
  { id: "gist", label: "Mtaa Gist", emoji: "🗞️", color: "bg-pink-600" },
];

export default function Phone({ s }: { s: GameState }) {
  const [app, setApp] = useState<App | null>(null);
  const me = useOnline((st) => st.me);
  const unread = useOnline((st) => st.unread);
  const current = APPS.find((a) => a.id === app);
  return (
    <div className="mx-auto max-w-md rounded-[2rem] border-4 border-foreground bg-foreground p-1.5 shadow-xl">
      <div className="min-h-[560px] overflow-hidden rounded-[1.6rem] bg-background">
        <div className="flex items-center justify-between bg-foreground px-5 py-1.5 font-mono text-xs text-background">
          <span>{clock(s.time)}</span>
          <span>Safaricom 4G ▮▮▮</span>
        </div>
        {!current ? (
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Net worth</p>
            <p className="font-display text-3xl font-extrabold">{ksh(netWorth(s))}</p>
            <div className="mt-6 grid grid-cols-4 gap-4">
              {APPS.map((a) => (
                <button key={a.id} onClick={() => setApp(a.id)} className="flex flex-col items-center gap-1.5">
                  <span className={`relative grid h-14 w-14 place-items-center rounded-2xl text-2xl shadow-md ${a.color}`}>
                    {a.emoji}
                    {a.id === "ujumbe" && unread > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-kred px-1 text-xs font-bold text-white">{unread}</span>}
                  </span>
                  <span className="text-[11px] font-semibold">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className={`flex items-center gap-2 px-3 py-2.5 text-white ${current.color}`}>
              <button onClick={() => setApp(null)} className="rounded-lg px-2 py-1 text-sm font-semibold hover:bg-white/15">
                ← Home
              </button>
              <span className="font-display text-lg font-bold">
                {current.emoji} {current.label}
              </span>
            </div>
            <div className="space-y-3 p-3">
              {app === "mpesa" && <MPesa s={s} />}
              {app === "benki" && <Benki s={s} />}
              {app === "chakula" && <Chakula s={s} />}
              {app === "kazi" && <Kazi s={s} />}
              {app === "mali" && <Mali s={s} />}
              {app === "ndege" && <Ndege s={s} />}
              {app === "siasa" && <Siasa s={s} />}
              {app === "gist" && <Gist s={s} />}
              {(app === "ujumbe" || app === "watu") && (me ? app === "ujumbe" ? <UjumbeApp /> : <WatuApp /> : <GoOnline />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GoOnline() {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <p className="text-sm">Create a profile to message real players, see who&apos;s around, and send M-Pesa to friends.</p>
      <Btn className="mt-3 w-full" onClick={() => setOpen(true)}>
        🌐 Go online
      </Btn>
      {open && <Account onClose={() => setOpen(false)} />}
    </Card>
  );
}

function MPesa({ s }: { s: GameState }) {
  const send = useGame((st) => st.send);
  const me = useOnline((st) => st.me);
  const contacts = Object.entries(s.relationships).filter(([, r]) => r.rel >= 10);
  return (
    <>
      <Card>
        <p className="text-xs uppercase tracking-wider text-muted">Balance</p>
        <p className={`font-mono text-3xl font-bold ${s.money < 0 ? "text-kred" : ""}`}>{ksh(s.money)}</p>
        <p className="mt-1 text-sm text-muted">Fuliza limit: {ksh(fulizaLimit(s))} · 5% fee on overdrafts</p>
      </Card>
      {me && <p className="rounded-xl bg-kgreen/10 p-3 text-sm text-kgreen">To send to a real player, open their profile from Watu, Ujumbe or the map.</p>}
      <Card title="Send to a friend">
        {contacts.length === 0 ? (
          <Empty>Make some friends first. Their numbers will show up here.</Empty>
        ) : (
          <div className="space-y-2">
            {contacts.map(([id]) => (
              <Row
                key={id}
                left={`${NPC[id].emoji} ${NPC[id].name}`}
                right={
                  <div className="flex gap-1">
                    {[200, 1000].map((amt) => (
                      <Btn key={amt} variant="ghost" disabled={!canAfford(s, amt) || !!s.event} onClick={() => send({ type: "sendMoney", npc: id, amount: amt })}>
                        {amt.toLocaleString()}
                      </Btn>
                    ))}
                  </div>
                }
              />
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

function Benki({ s }: { s: GameState }) {
  const send = useGame((st) => st.send);
  const b = s.bank;
  const amounts = [1000, 5000, 20000, 100000];
  return (
    <>
      <Card title="Money market fund">
        <p className="font-mono text-2xl font-bold">{ksh(b.savings)}</p>
        <p className="text-sm text-muted">Earns about {(BANK.mmfDaily * 365 * 100).toFixed(0)}% a year, paid daily. Nyokabi at the bank approves.</p>
        <div className="mt-3 grid grid-cols-4 gap-1">
          {amounts.map((a) => (
            <Btn key={`d${a}`} variant="ghost" disabled={s.money < a || !!s.event} onClick={() => send({ type: "bank", op: "deposit", amount: a })}>
              +{a >= 1000 ? `${a / 1000}k` : a}
            </Btn>
          ))}
          {amounts.map((a) => (
            <Btn key={`w${a}`} variant="ghost" disabled={b.savings < a || !!s.event} onClick={() => send({ type: "bank", op: "withdraw", amount: a })}>
              −{a >= 1000 ? `${a / 1000}k` : a}
            </Btn>
          ))}
        </div>
      </Card>
      <Card title="Infrastructure bond">
        {b.bond ? (
          <p className="text-sm">
            {ksh(b.bond.amount)} invested. Pays {ksh(b.bond.amount * (1 + BANK.bondReturn))} on day {b.bond.matures} ({b.bond.matures - dayOf(s.time)} days left).
          </p>
        ) : (
          <>
            <p className="text-sm text-muted">Lock money for {BANK.bondDays} days, get {BANK.bondReturn * 100}% back on top. Minimum {ksh(BANK.bondMin)}.</p>
            <div className="mt-2 flex gap-1">
              {[50000, 200000, 1000000].map((a) => (
                <Btn key={a} variant="ghost" disabled={s.money < a || !!s.event} onClick={() => send({ type: "bank", op: "bond", amount: a })}>
                  {ksh(a)}
                </Btn>
              ))}
            </div>
          </>
        )}
      </Card>
      <Card title="📱 Haraka Loans">
        <p className="text-sm text-kred">12% interest every week. Digital lenders will call your mum.</p>
        <p className="mt-1 font-mono">Owed: {ksh(b.loan)} / limit {ksh(BANK.loanMax)}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {[2000, 10000].map((a) => (
            <Btn key={a} variant="danger" disabled={b.loan + a > BANK.loanMax || !!s.event} onClick={() => send({ type: "bank", op: "borrow", amount: a })}>
              Borrow {ksh(a)}
            </Btn>
          ))}
          <Btn variant="ghost" disabled={!b.loan || s.money < Math.min(b.loan, 5000) || !!s.event} onClick={() => send({ type: "bank", op: "repay", amount: Math.min(b.loan, Math.max(0, s.money)) })}>
            Repay what you can
          </Btn>
        </div>
      </Card>
      <Card title="SHA cover">
        <p className="text-sm text-muted">{s.insured ? `Covered. KSh ${SHA_WEEKLY}/week, 80% off hospital bills.` : "Not covered. Register at Kenyatta National Hospital."}</p>
      </Card>
    </>
  );
}

function Chakula({ s }: { s: GameState }) {
  const send = useGame((st) => st.send);
  const [tab, setTab] = useState<"food" | "groceries">("food");
  return (
    <>
      <Tabs value={tab} onChange={setTab} items={[{ id: "food", label: "🍗 Food" }, { id: "groceries", label: "🥬 Groceries" }]} />
      {tab === "food" ? (
        <div className="space-y-2">
          <p className="text-sm text-muted">Delivered in 40 minutes, wherever you are. +{ksh(DELIVERY_FEE)} delivery.</p>
          {DELIVERY_MENU.map((m) => {
            const cost = price(s, m.price) + DELIVERY_FEE;
            return (
              <Row
                key={m.id}
                left={`${m.emoji} ${m.name}`}
                sub={`+${m.hunger} hunger · ${ksh(cost)}`}
                right={
                  <Btn disabled={!canAfford(s, cost) || !!s.event} onClick={() => send({ type: "orderFood", id: m.id })}>
                    Order
                  </Btn>
                }
              />
            );
          })}
        </div>
      ) : (
        <GroceryShop s={s} channel="delivery" />
      )}
    </>
  );
}

function Kazi({ s }: { s: GameState }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">Apply in person at the workplace. Degrees come from UoN.</p>
      {CAREERS.map((c) => {
        const entry = c.levels[0];
        const missing = Object.entries(entry.req).filter(([k, v]) => s.skills[k as keyof typeof s.skills] < v!);
        const ready = !missing.length && (!entry.degree || s.study?.graduated);
        const v = VENUE[c.venue];
        return (
          <Row
            key={c.id}
            left={`${c.emoji} ${c.name}: ${entry.title}`}
            sub={`${ksh(entry.pay)}/shift → ${ksh(c.levels.at(-1)!.pay)} as ${c.levels.at(-1)!.title} · 📍 ${v.name}, ${AREA[v.area].name}${missing.length ? ` · needs ${missing.map(([k, n]) => `${k} ${n}`).join(", ")}` : ""}${entry.degree ? " · degree" : ""}`}
            right={s.job?.career === c.id ? <span className="text-xs font-semibold text-kgreen">Your job</span> : ready ? <span className="text-xs font-semibold text-kgreen">Ready ✓</span> : null}
          />
        );
      })}
    </div>
  );
}

function Mali({ s }: { s: GameState }) {
  const send = useGame((st) => st.send);
  const [tab, setTab] = useState<"land" | "biz" | "cars">("land");
  const blocked = !!s.event;
  return (
    <>
      <Tabs value={tab} onChange={setTab} items={[{ id: "land", label: "📐 Land" }, { id: "biz", label: "💼 Biashara" }, { id: "cars", label: "🚗 Magari" }]} />
      {tab === "land" && (
        <div className="space-y-2">
          {s.plots.length > 0 && (
            <Card title="Your plots">
              <div className="space-y-2">
                {s.plots.map((p, i) => (
                  <Row
                    key={i}
                    left={PLOT[p.id].name}
                    sub={p.fake ? "❌ Fake title. Worthless." : `Paid ${ksh(p.paid)} · worth ${ksh(p.value)} (${p.value >= p.paid ? "+" : ""}${(((p.value - p.paid) / p.paid) * 100).toFixed(1)}%)`}
                    right={!p.fake && <Btn variant="ghost" disabled={blocked} onClick={() => send({ type: "sellPlot", index: i })}>Sell {ksh(p.value * (1 - LAND_SELL_FEE))}</Btn>}
                  />
                ))}
              </div>
            </Card>
          )}
          <p className="text-sm text-muted">Land only goes up, they say. Skip the {ksh(LAND_SEARCH_FEE)} Ardhi House search and you risk buying from cartels.</p>
          {PLOTS.map((p) => (
            <Row
              key={p.id}
              left={p.name}
              sub={`${ksh(p.price)} · ~${(p.growth * 100).toFixed(1)}%/week · ${p.blurb}`}
              right={
                <div className="flex flex-col gap-1">
                  <Btn disabled={s.money < p.price + LAND_SEARCH_FEE || blocked} onClick={() => send({ type: "buyPlot", id: p.id, search: true })}>
                    Buy + search
                  </Btn>
                  <Btn variant="danger" disabled={s.money < p.price || blocked} onClick={() => send({ type: "buyPlot", id: p.id, search: false })}>
                    YOLO
                  </Btn>
                </div>
              }
            />
          ))}
        </div>
      )}
      {tab === "biz" && (
        <div className="space-y-2">
          <p className="text-sm text-muted">Income lands every Monday. Resale at {BUSINESS_RESALE * 100}%.</p>
          {BUSINESSES.map((b) => {
            const owned = s.businesses.some((x) => x.id === b.id);
            return (
              <Row
                key={b.id}
                left={`${b.emoji} ${b.name}`}
                sub={`${ksh(b.price)} · ${ksh(b.weekly[0])}–${ksh(b.weekly[1])}/week · ${b.blurb}`}
                right={owned ? <Btn variant="ghost" disabled={blocked} onClick={() => send({ type: "sellBusiness", id: b.id })}>Sell</Btn> : <Btn disabled={s.money < b.price || blocked} onClick={() => send({ type: "buyBusiness", id: b.id })}>Buy</Btn>}
              />
            );
          })}
        </div>
      )}
      {tab === "cars" && (
        <div className="space-y-2">
          <p className="text-sm text-muted">{s.carId ? `Driving: ${CAR[s.carId].name}. Fuel and CBD parking cost extra.` : "No car. Matatu life."}</p>
          {CARS.map((c) => {
            const owned = s.cars.includes(c.id);
            return (
              <Row
                key={c.id}
                left={`${c.emoji} ${c.name}`}
                sub={`${ksh(c.price)} · ${c.blurb}`}
                right={
                  owned ? (
                    <div className="flex flex-col gap-1">
                      <Btn variant="ghost" disabled={blocked} onClick={() => send({ type: "useCar", id: s.carId === c.id ? null : c.id })}>
                        {s.carId === c.id ? "Park it" : "Drive"}
                      </Btn>
                      <Btn variant="danger" disabled={blocked} onClick={() => send({ type: "sellCar", id: c.id })}>
                        Sell {ksh(c.price * CAR_RESALE)}
                      </Btn>
                    </div>
                  ) : (
                    <Btn disabled={s.money < c.price || blocked} onClick={() => send({ type: "buyCar", id: c.id })}>
                      Buy
                    </Btn>
                  )
                }
              />
            );
          })}
        </div>
      )}
    </>
  );
}

function Ndege({ s }: { s: GameState }) {
  const send = useGame((st) => st.send);
  const [stake, setStake] = useState(100);
  const [target, setTarget] = useState(2);
  const [shown, setShown] = useState<number | null>(null);
  const [flying, setFlying] = useState(false);
  const raf = useRef(0);
  const bet = s.lastBet?.kind === "crash" ? s.lastBet : null;

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const fly = () => {
    send({ type: "crash", stake, target });
    const result = useGame.getState().game?.lastBet;
    if (!result || result.kind !== "crash") return;
    const end = Math.min(result.result, target);
    const startAt = performance.now();
    setFlying(true);
    const tick = (now: number) => {
      const m = Math.min(end, Math.exp(0.35 * ((now - startAt) / 1000)));
      setShown(m);
      if (m < end) raf.current = requestAnimationFrame(tick);
      else setFlying(false);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const done = !flying && bet && shown !== null;
  return (
    <>
      <p className="rounded-xl bg-kred/10 p-3 text-xs text-kred">18+ · Betting is a game here, but in real life crash games are draining Kenyan youth. The house always wins.</p>
      <Card>
        <div className="relative h-36 overflow-hidden rounded-xl bg-gradient-to-b from-sky-200 to-sky-50">
          <div
            className="absolute text-4xl transition-transform"
            style={{ left: `${Math.min(80, ((shown ?? 1) - 1) * 18 + 5)}%`, bottom: `${Math.min(70, ((shown ?? 1) - 1) * 14 + 5)}%` }}
          >
            {done && !bet!.won ? "💥" : "🛫"}
          </div>
          <div className="absolute inset-0 grid place-items-center">
            <span className={`font-mono text-4xl font-extrabold ${done ? (bet!.won ? "text-kgreen" : "text-kred") : ""}`}>{(shown ?? 1).toFixed(2)}x</span>
          </div>
        </div>
        {done && <p className={`mt-2 text-center font-semibold ${bet!.won ? "text-kgreen" : "text-kred"}`}>{bet!.won ? `Cashed out! +${ksh(bet!.payout - bet!.stake)}` : `Crashed at ${bet!.label}. −${ksh(bet!.stake)}`}</p>}
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <label>
            Stake
            <select value={stake} onChange={(e) => setStake(+e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-card px-2 py-1.5">
              {[50, 100, 500, 1000, 5000, 20000].map((v) => (
                <option key={v} value={v}>{ksh(v)}</option>
              ))}
            </select>
          </label>
          <label>
            Auto cash-out
            <select value={target} onChange={(e) => setTarget(+e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-card px-2 py-1.5">
              {[1.2, 1.5, 2, 3, 5, 10, 50].map((v) => (
                <option key={v} value={v}>{v}x</option>
              ))}
            </select>
          </label>
        </div>
        <Btn className="mt-3 w-full" disabled={flying || s.money < stake || !!s.event} onClick={fly}>
          {flying ? "Flying…" : `Fly for ${ksh(stake)}`}
        </Btn>
      </Card>
      <Card title="⚽ Mashemeji Derby">
        {isWeekend(s.time) ? (
          <div className="grid grid-cols-3 gap-1">
            {(Object.keys(DERBY_ODDS) as (keyof typeof DERBY_ODDS)[]).map((k) => (
              <Btn key={k} variant="ghost" disabled={s.money < 200 || !!s.event} onClick={() => send({ type: "derby", stake: 200, pick: k })}>
                {{ gor: "Gor", draw: "Draw", ingwe: "Ingwe" }[k]} {DERBY_ODDS[k]}
              </Btn>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Gor Mahia vs AFC Leopards plays on the weekend.</p>
        )}
        {s.lastBet?.kind === "derby" && <p className="mt-2 text-sm">{s.lastBet.label}. {s.lastBet.won ? `You won ${ksh(s.lastBet.payout)}!` : "You lost your stake."}</p>}
      </Card>
    </>
  );
}

function Siasa({ s }: { s: GameState }) {
  const send = useGame((st) => st.send);
  const officeIdx = s.office ? OFFICES.findIndex((o) => o.id === s.office!.id) : -1;
  return (
    <>
      <Card>
        <p className="text-sm">🗳️ Voter: {s.voter ? "Niko kadi ✓" : "Not registered. Go to the IEBC desk at KICC."}</p>
        <p className="mt-1 text-sm">🏛️ Office: {s.office ? OFFICE[s.office.id].title : "Mwananchi"}</p>
        {s.campaign && (
          <p className="mt-1 text-sm">
            📣 Running for {OFFICE[s.campaign.office].title} · campaign {ksh(s.campaign.spent)} · win chance ~{Math.round(electionOdds(s) * 100)}% · results Saturday night. Rallies at KICC.
          </p>
        )}
        {!s.campaign && <p className="mt-1 text-sm text-muted">Register to run at KICC. Each office needs more charm and campaign money than the last.</p>}
      </Card>
      {s.office && (
        <Card title={`Policies (${s.policies.length}/${officeIdx + 1})`}>
          <div className="space-y-2">
            {POLICIES.map((p) => {
              const on = s.policies.includes(p.id);
              return (
                <Row
                  key={p.id}
                  left={`${p.emoji} ${p.label}`}
                  sub={p.desc}
                  right={
                    <Btn variant={on ? "solid" : "ghost"} disabled={(!on && s.policies.length > officeIdx) || !!s.event} onClick={() => send({ type: "policy", id: p.id })}>
                      {on ? "On" : "Off"}
                    </Btn>
                  }
                />
              );
            })}
          </div>
        </Card>
      )}
    </>
  );
}

function Gist({ s }: { s: GameState }) {
  const known = Object.entries(s.relationships).filter(([, r]) => r.rel >= 10).map(([id]) => NPC[id]);
  const news = s.log.filter((e) => e.tone === "event").slice(0, 12);
  return (
    <div className="space-y-2">
      {known.map((n) => (
        <div key={n.id} className="rounded-xl border border-line bg-card p-3">
          <div className="text-sm font-semibold">
            {n.emoji} @{n.name.toLowerCase().replace(/\s+/g, "")}
          </div>
          <p className="text-sm">{n.line.replace(/"/g, "")}</p>
        </div>
      ))}
      {news.map((e) => (
        <div key={e.id} className="rounded-xl border border-line bg-card p-3">
          <div className="text-xs text-muted">
            📰 Kanairo News · D{dayOf(e.time)} {clock(e.time)}
          </div>
          <p className="text-sm">{e.text}</p>
        </div>
      ))}
      {!known.length && !news.length && <Empty>Nothing yet. Make friends and the gist will flow.</Empty>}
    </div>
  );
}
