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
import { canAfford, clock, dayOf, electionOdds, fulizaLimit, isWeekend, placeOf, price } from "@/game/engine";
import { useGame } from "@/game/store";
import type { GameState } from "@/game/types";
import { splitIcon } from "@/game/icons";
import { useOnline } from "@/online/store";
import GroceryShop from "./GroceryShop";
import HomePanel from "./HomePanel";
import Me from "./Me";
import { ChatView, UjumbeApp, WatuApp } from "./Online";
import People from "./People";
import { useUi, type PhoneApp } from "./uiStore";
import { Icon } from "./Icon";
import { Btn, Card, Empty, IconLabel, ksh, Row, Tabs } from "./ui";

/** App icons: a filled glyph on an iOS-style squircle. Dock apps sit in the glass bar at the bottom. */
const APPS: { id: PhoneApp; label: string; icon: string; bg: string; fg?: string }[] = [
  { id: "contacts", label: "Phone", icon: "phone-filled", bg: "bg-gradient-to-b from-[#5af27a] to-[#1fc33f]" },
  { id: "messages", label: "Messages", icon: "message-circle-filled", bg: "bg-gradient-to-b from-[#5af27a] to-[#1fc33f]" },
  { id: "mpesa", label: "M-PESA", icon: "cash-banknote-filled", bg: "bg-white", fg: "text-[#3bb54a]" },
  { id: "watu", label: "Watu", icon: "users-group", bg: "bg-gradient-to-b from-[#6ac8ff] to-[#1f8bf0]" },
  { id: "profile", label: "Profile", icon: "user-filled", bg: "bg-gradient-to-b from-[#a1a1aa] to-[#6b6b73]" },
  { id: "houses", label: "Keja", icon: "home-filled", bg: "bg-gradient-to-b from-[#ffb340] to-[#ff8a00]" },
  { id: "benki", label: "Benki", icon: "building-bank", bg: "bg-gradient-to-b from-[#3d4ed8] to-[#1e2a8a]" },
  { id: "chakula", label: "Chakula", icon: "tools-kitchen-2", bg: "bg-gradient-to-b from-[#ff6a3d] to-[#e8361c]" },
  { id: "kazi", label: "Kazi", icon: "briefcase-filled", bg: "bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e]" },
  { id: "mali", label: "Mali", icon: "building-estate", bg: "bg-gradient-to-b from-[#34c7a0] to-[#0f8f6e]" },
  { id: "ndege", label: "Aviator", icon: "rocket", bg: "bg-gradient-to-b from-[#ff375f] to-[#c4002b]" },
  { id: "siasa", label: "Siasa", icon: "building-monument", bg: "bg-white", fg: "text-[#0b7a3b]" },
  { id: "gist", label: "Mtaa Gist", icon: "news", bg: "bg-gradient-to-b from-[#ff4f8b] to-[#d6246a]" },
];
const DOCK_APPS: PhoneApp[] = ["contacts", "messages", "mpesa", "watu"];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const CITY_LABEL = { nairobi: "Nairobi", mombasa: "Mombasa", kisumu: "Kisumu" } as const;

/** Rough, believable weather: cool Nairobi mornings, hot humid coast, warm lake. */
function weather(city: keyof typeof CITY_LABEL, t: number) {
  const h = (t % 1440) / 60;
  const [lo, hi] = city === "mombasa" ? [24, 31] : city === "kisumu" ? [18, 29] : [13, 25];
  const temp = Math.round(lo + (hi - lo) * Math.max(0, Math.sin(((h - 6) / 14) * Math.PI)));
  const day = Math.floor(t / 1440);
  const cloudy = (day * 7 + (city === "nairobi" ? 1 : 3)) % 3 === 0;
  const night = h < 6 || h >= 19;
  return { temp, lo, hi, text: cloudy ? (h > 14 && h < 18 && city !== "mombasa" ? "Afternoon showers" : "Mostly cloudy") : night ? "Clear" : "Sunny", icon: cloudy ? "cloud-filled" : night ? "moon" : "sun-filled", night };
}

function AppIcon({ a, size = 60, badge = 0, label = true, onOpen }: { a: (typeof APPS)[number]; size?: number; badge?: number; label?: boolean; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="flex flex-col items-center gap-1 transition active:scale-90 active:brightness-75">
      <span className={`relative grid place-items-center rounded-[23%] shadow-[0_1px_3px_rgba(0,0,0,.25)] ${a.bg}`} style={{ width: size, height: size }}>
        <Icon name={a.icon} size={Math.round(size * 0.55)} stroke={1.8} className={a.fg ?? "text-white"} />
        {badge > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-[22px] min-w-[22px] place-items-center rounded-full bg-[#ff3b30] px-1.5 text-[13px] font-semibold text-white">{badge}</span>}
      </span>
      {label && <span className="max-w-[72px] truncate text-[11.5px] font-medium tracking-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,.35)]">{a.label}</span>}
    </button>
  );
}

/** A phone you hold up over the game, laid out like a real iPhone home screen. */
export default function PhoneOverlay({ s }: { s: GameState }) {
  const { app, chatWith, openApp, open, setChat } = useUi();
  const unread = useOnline((st) => st.unread);
  const current = APPS.find((a) => a.id === app);
  const day = dayOf(s.time);
  // In-game calendar starts on Monday 5 October 2026 (Day 1).
  const date = new Date(2026, 9, 4 + day);
  const city = (AREA[placeOf(s).area]?.city ?? "nairobi") as keyof typeof CITY_LABEL;
  const w = weather(city, s.time);
  const close = () => open(null);
  const next = s.flight
    ? { title: `${s.flight.code} → ${s.flight.to[0].toUpperCase()}${s.flight.to.slice(1)}`, when: clock(s.flight.dep), tone: "bg-[#ff9500]" }
    : { title: "Rent due", when: s.rentPaidThroughDay > day ? `in ${s.rentPaidThroughDay - day + 1} days` : "today", tone: "bg-[#ff3b30]" };
  const homeGrid = APPS.filter((a) => !DOCK_APPS.includes(a.id));
  const dark = !current;
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-black/45 p-3 backdrop-blur-[2px]" onClick={close}>
      <div className="relative flex h-[min(844px,calc(100dvh-72px))] w-[min(390px,calc(100vw-24px),calc((100dvh-72px)*0.47))] flex-col" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="absolute -top-1 right-0 z-10 flex -translate-y-full items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold shadow-lg">
          <Icon name="x" size={16} /> Put phone away
        </button>
        {/* titanium frame with side buttons */}
        <div className="relative mt-10 flex flex-1 flex-col rounded-[3.4rem] bg-gradient-to-b from-[#5b5b60] via-[#2c2c30] to-[#4a4a50] p-[3px] shadow-[0_30px_80px_rgba(0,0,0,.55)]">
          <span className="absolute -left-[3px] top-28 h-8 w-[3px] rounded-l bg-[#3a3a3e]" />
          <span className="absolute -left-[3px] top-44 h-14 w-[3px] rounded-l bg-[#3a3a3e]" />
          <span className="absolute -left-[3px] top-[15.5rem] h-14 w-[3px] rounded-l bg-[#3a3a3e]" />
          <span className="absolute -right-[3px] top-48 h-20 w-[3px] rounded-r bg-[#3a3a3e]" />
          <div className="flex flex-1 flex-col overflow-hidden rounded-[3.2rem] bg-black p-[9px]">
            <div
              className="relative flex flex-1 flex-col overflow-hidden rounded-[2.6rem] font-[system-ui,-apple-system,'SF_Pro_Text',sans-serif]"
              style={
                current
                  ? { background: "#f2f2f7" }
                  : {
                      background: w.night
                        ? "radial-gradient(120% 70% at 20% 0%, #3b2a8f 0%, transparent 60%), radial-gradient(90% 60% at 100% 60%, #0f5c63 0%, transparent 60%), radial-gradient(100% 70% at 0% 100%, #6b1d5c 0%, transparent 60%), #0b0d1f"
                        : "radial-gradient(120% 70% at 15% 0%, #ff9f6b 0%, transparent 55%), radial-gradient(90% 60% at 100% 45%, #3aa17e 0%, transparent 60%), radial-gradient(110% 70% at 0% 100%, #1d4f8f 0%, transparent 65%), #0d3b4a",
                    }
              }
            >
              {/* status bar + dynamic island */}
              <div className={`relative z-10 flex h-[54px] shrink-0 items-center justify-between px-8 pt-1 text-[15px] font-semibold ${dark ? "text-white" : "text-black"}`}>
                <span className="w-16 text-center tracking-tight">{clock(s.time)}</span>
                <span className="absolute left-1/2 top-[11px] h-[34px] w-[122px] -translate-x-1/2 rounded-full bg-black" />
                <span className="flex w-16 items-center justify-end gap-1.5">
                  <span className="flex items-end gap-[1.5px]">
                    {[4, 6, 8, 10].map((h, i) => (
                      <span key={h} className={`w-[3px] rounded-[1px] ${i < 3 ? "bg-current" : "bg-current/35"}`} style={{ height: h }} />
                    ))}
                  </span>
                  <Icon name="wifi" size={15} stroke={2.5} />
                  <span className="relative flex h-[12px] w-[24px] items-center rounded-[4px] border border-current/40 p-[1.5px]">
                    <span className="h-full w-[70%] rounded-[2px] bg-current" />
                    <span className="absolute -right-[3px] h-[4px] w-[1.5px] rounded-r bg-current/40" />
                  </span>
                </span>
              </div>

              {!current ? (
                <div className="flex min-h-0 flex-1 flex-col px-[22px] pb-3">
                  {/* widgets */}
                  <div className="mt-2 grid grid-cols-2 gap-[22px]">
                    <div className={`aspect-square rounded-[22px] p-3 text-white shadow-lg ${w.night ? "bg-gradient-to-b from-[#1c2541] to-[#3a506b]" : "bg-gradient-to-b from-[#2f7fd8] to-[#62b0f0]"}`}>
                      <div className="flex items-center gap-1 text-[13px] font-semibold">
                        {CITY_LABEL[city]} <Icon name="map-pin-filled" size={10} />
                      </div>
                      <div className="text-[42px] font-light leading-none">{w.temp}°</div>
                      <div className="mt-auto pt-3">
                        <Icon name={w.icon} size={16} className="text-yellow-200" />
                        <div className="text-[12px] font-semibold leading-tight">{w.text}</div>
                        <div className="text-[12px] font-medium opacity-80">
                          H:{w.hi}° L:{w.lo}°
                        </div>
                      </div>
                    </div>
                    <div className="flex aspect-square flex-col rounded-[22px] bg-white p-3 text-black shadow-lg">
                      <div className="text-[11px] font-bold uppercase text-[#ff3b30]">{DAYS[(day - 1) % 7]}</div>
                      <div className="text-[38px] font-light leading-none">{date.getDate()}</div>
                      <div className="mt-auto flex gap-1.5">
                        <span className={`w-1 rounded-full ${next.tone}`} />
                        <div className="min-w-0">
                          <div className="truncate text-[12px] font-semibold">{next.title}</div>
                          <div className="text-[11px] text-black/50">{next.when}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-[22px] text-center text-[11.5px] font-medium text-white [text-shadow:0_1px_2px_rgba(0,0,0,.35)]">
                    <span>Weather</span>
                    <span>Calendar</span>
                  </div>

                  <div className="mt-4 grid grid-cols-4 justify-items-center gap-y-4">
                    {homeGrid.map((a) => (
                      <AppIcon key={a.id} a={a} onOpen={() => openApp(a.id)} />
                    ))}
                  </div>

                  <div className="mt-auto flex justify-center pb-3 pt-4">
                    <span className="flex items-center gap-1 rounded-full bg-white/25 px-3 py-1 text-[12px] font-semibold text-white backdrop-blur-md">
                      <Icon name="search" size={12} stroke={3} /> Search
                    </span>
                  </div>
                  {/* dock */}
                  <div className="flex justify-around rounded-[32px] bg-white/25 px-3 py-[14px] backdrop-blur-xl">
                    {DOCK_APPS.map((id) => {
                      const a = APPS.find((x) => x.id === id)!;
                      return <AppIcon key={id} a={a} label={false} badge={id === "messages" ? unread : 0} onOpen={() => openApp(id)} />;
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                  {/* iOS navigation bar: back button, then a large title */}
                  <div className="shrink-0 bg-[#f2f2f7]/95 px-4 pb-2 backdrop-blur">
                    <button onClick={() => (app === "messages" && chatWith ? setChat(null) : openApp(null))} className="-ml-1.5 flex items-center text-[17px] text-[#007aff]">
                      <Icon name="chevron-left" size={26} stroke={2.4} />
                      {app === "messages" && chatWith ? "Messages" : "Home"}
                    </button>
                    {!(app === "messages" && chatWith) && <h1 className="mt-1 text-[32px] font-bold leading-tight tracking-tight text-black">{current.label}</h1>}
                  </div>
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 pb-3 text-black">
                    {app === "messages" && (chatWith ? <ChatView username={chatWith} /> : <UjumbeApp />)}
                    {app === "contacts" && <People s={s} />}
                    {app === "watu" && <WatuApp />}
                    {app === "profile" && <Me s={s} />}
                    {app === "houses" && <HomePanel s={s} />}
                    {app === "mpesa" && <MPesa s={s} />}
                    {app === "benki" && <Benki s={s} />}
                    {app === "chakula" && <Chakula s={s} />}
                    {app === "kazi" && <Kazi s={s} />}
                    {app === "mali" && <Mali s={s} />}
                    {app === "ndege" && <Ndege s={s} />}
                    {app === "siasa" && <Siasa s={s} />}
                    {app === "gist" && <Gist s={s} />}
                  </div>
                </div>
              )}
              {/* home indicator: swipe up (tap) to go home */}
              <button onClick={() => openApp(null)} aria-label="Home screen" className={`absolute bottom-2 left-1/2 h-[5px] w-[134px] -translate-x-1/2 rounded-full ${dark ? "bg-white" : "bg-black"}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
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
                left={<IconLabel emoji={NPC[id].emoji}>{`${NPC[id].name}`}</IconLabel>}
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
      <Card title={<IconLabel name="device-mobile">Haraka Loans</IconLabel>}>
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
      <Tabs value={tab} onChange={setTab} items={[{ id: "food", label: <IconLabel emoji="🍗">Food</IconLabel> }, { id: "groceries", label: <IconLabel emoji="🥬">Groceries</IconLabel> }]} />
      {tab === "food" ? (
        <div className="space-y-2">
          <p className="text-sm text-muted">Delivered in 40 minutes, wherever you are. +{ksh(DELIVERY_FEE)} delivery.</p>
          {DELIVERY_MENU.map((m) => {
            const cost = price(s, m.price) + DELIVERY_FEE;
            return (
              <Row
                key={m.id}
                left={<IconLabel emoji={m.emoji}>{`${m.name}`}</IconLabel>}
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
            left={<IconLabel emoji={c.emoji}>{`${c.name}: ${entry.title}`}</IconLabel>}
            sub={`${ksh(entry.pay)}/shift → ${ksh(c.levels.at(-1)!.pay)} as ${c.levels.at(-1)!.title} · ${v.name}, ${AREA[v.area].name}${missing.length ? ` · needs ${missing.map(([k, n]) => `${k} ${n}`).join(", ")}` : ""}${entry.degree ? " · degree" : ""}`}
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
      <Tabs value={tab} onChange={setTab} items={[{ id: "land", label: <IconLabel emoji="📐">Land</IconLabel> }, { id: "biz", label: <IconLabel emoji="💼">Biashara</IconLabel> }, { id: "cars", label: <IconLabel emoji="🚗">Magari</IconLabel> }]} />
      {tab === "land" && (
        <div className="space-y-2">
          {s.plots.length > 0 && (
            <Card title="Your plots">
              <div className="space-y-2">
                {s.plots.map((p, i) => (
                  <Row
                    key={i}
                    left={PLOT[p.id].name}
                    sub={p.fake ? "Fake title. Worthless." : `Paid ${ksh(p.paid)} · worth ${ksh(p.value)} (${p.value >= p.paid ? "+" : ""}${(((p.value - p.paid) / p.paid) * 100).toFixed(1)}%)`}
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
                left={<IconLabel emoji={b.emoji}>{`${b.name}`}</IconLabel>}
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
                left={<IconLabel emoji={c.emoji}>{`${c.name}`}</IconLabel>}
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
            <Icon name={done && !bet!.won ? "flame" : "plane-departure"} size={36} className={done && !bet!.won ? "text-kred" : "text-foreground"} />
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
      <Card title={<IconLabel name="ball-football">Mashemeji Derby</IconLabel>}>
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
        <p className="text-sm">Voter: {s.voter ? "Niko kadi ✓" : "Not registered. Go to the IEBC desk at KICC."}</p>
        <p className="mt-1 text-sm">Office: {s.office ? OFFICE[s.office.id].title : "Mwananchi"}</p>
        {s.campaign && (
          <p className="mt-1 text-sm">
            Running for {OFFICE[s.campaign.office].title} · campaign {ksh(s.campaign.spent)} · win chance ~{Math.round(electionOdds(s) * 100)}% · results Saturday night. Rallies at KICC.
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
                  left={<IconLabel emoji={p.emoji}>{`${p.label}`}</IconLabel>}
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
            <IconLabel emoji={n.emoji}>@{n.name.toLowerCase().replace(/\s+/g, "")}</IconLabel>
          </div>
          <p className="text-sm">{n.line.replace(/"/g, "")}</p>
        </div>
      ))}
      {news.map((e) => (
        <div key={e.id} className="rounded-xl border border-line bg-card p-3">
          <div className="text-xs text-muted">
            Kanairo News · D{dayOf(e.time)} {clock(e.time)}
          </div>
          <p className="text-sm">{splitIcon(e.text).text}</p>
        </div>
      ))}
      {!known.length && !news.length && <Empty>Nothing yet. Make friends and the gist will flow.</Empty>}
    </div>
  );
}
