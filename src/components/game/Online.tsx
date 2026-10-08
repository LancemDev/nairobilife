"use client";

import { useEffect, useRef, useState } from "react";
import { AREA, VENUE } from "@/game/data";
import { canAfford } from "@/game/engine";
import { sanitizeLook } from "@/game/look";
import { MAX_SEND, MIN_SEND, REPORT_REASONS } from "@/game/online";
import { useGame } from "@/game/store";
import type { GameState } from "@/game/types";
import { api, type Message, type Profile, type Thread } from "@/online/api";
import { useOnline } from "@/online/store";
import { Avatar, AvatarBuilder } from "./Avatar";
import { Icon } from "./Icon";
import { Btn, Empty, IconLabel, ksh, Sheet, Tabs } from "./ui";
import { useUi } from "./uiStore";

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60_000);
  return m < 1 ? "now" : m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`;
};

export function where(p: Profile) {
  if (!p.area) return "Somewhere in Kanairo";
  const v = p.venue && p.venue !== "home" ? VENUE[p.venue]?.name : "home";
  return `${v ? `${v}, ` : ""}${AREA[p.area]?.name ?? p.area}`;
}

/** Compact row for a player in lists. */
export function PlayerRow({ p, right, sub }: { p: Profile; right?: React.ReactNode; sub?: React.ReactNode }) {
  const view = useOnline((s) => s.view);
  return (
    <button onClick={() => view(p.username)} className="flex w-full items-center gap-3 rounded-xl border border-line bg-background/50 px-3 py-2 text-left transition hover:border-foreground">
      <span className="relative">
        <Avatar look={p.look} size={40} />
        {p.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-kgreen" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">
          {p.displayName} <span className="text-xs font-normal text-muted">@{p.username}</span>
        </span>
        <span className="block truncate text-xs text-muted">{sub ?? `${p.title || "Mwananchi"} · ${where(p)}`}</span>
      </span>
      {right}
    </button>
  );
}

const PLAYER_SOCIALS = [
  { id: "hello", label: "Say hello", icon: "hand-stop", gain: "+Social", lines: ["Rada! Niaje?", "Sasa! Uko poa?", "Mambo! Karibu sana."] },
  { id: "gist", label: "Gist", icon: "message-circle", gain: "+Fun · +Social", lines: ["Nipe story ya leo, kuna nini?", "Umeskia ile ya KPLC jana?", "Mtaa iko aje upande yako?"] },
  { id: "joke", label: "Crack joke", icon: "mood-happy", gain: "+Fun · +Social", lines: ["Matatu ilikuwa full hadi makanga alikaa kwa roof.", "Fuliza imenijua kuliko mum yangu.", "Nilienda gym mara moja, sasa niko na six-pack ya soda."] },
  { id: "shade", label: "Throw shade", icon: "mood-annoyed", gain: "+Fun", lines: ["Hiyo luku umetoa Gikomba ama?", "Wewe ni wa Pipeline? Nimeona ndio calves.", "Kuna mtu ameona doh yako? Hata mimi sijaiona."] },
] as const;

const pickLine = (lines: readonly string[]) => lines[Math.floor(Math.random() * lines.length)];

/** A real player you tapped: chat, socials, M-Pesa, block, report. Bottom card, like in the room. */
export function PlayerSheet({ s }: { s: GameState }) {
  const username = useOnline((st) => st.viewing);
  const view = useOnline((st) => st.view);
  const openApp = useUi((st) => st.openApp);
  const send = useGame((st) => st.send);
  const [data, setData] = useState<{ player: Profile; blocked: boolean } | null>(null);
  const [amount, setAmount] = useState(500);
  const [msg, setMsg] = useState<string | null>(null);
  const [report, setReport] = useState(false);

  useEffect(() => {
    if (!username) return;
    let live = true;
    api.player(username).then((d) => live && setData(d)).catch((e) => live && setMsg(e.message));
    return () => {
      live = false;
    };
  }, [username]);

  if (!username) return null;
  const close = () => {
    view(null);
    setData(null);
    setMsg(null);
    setReport(false);
  };
  const p = data?.player;

  const pay = async () => {
    setMsg(null);
    try {
      const res = await api.send(username, amount, "");
      send({ type: "transferOut", to: res.to, amount: res.amount });
      setMsg(`Sent ${ksh(res.amount)} to ${res.toName}.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Couldn't send.");
    }
  };

  const social = async (id: (typeof PLAYER_SOCIALS)[number]["id"]) => {
    const def = PLAYER_SOCIALS.find((x) => x.id === id)!;
    const line = pickLine(def.lines);
    try {
      await api.message(username, line);
      send({ type: "playerSocial", social: id, name: `@${username}` });
      setMsg(`You: "${line}"`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Couldn't reach them.");
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/20" onClick={close}>
      <div className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl sm:mb-4 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        {!p ? (
          <p className="text-sm text-muted">{msg ?? "Loading…"}</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar look={p.look} size={48} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-xl font-bold">@{p.username}</div>
                <div className="truncate text-sm text-muted">
                  Real player · {p.online ? `hanging out at ${where(p)}` : "offline"} · {ksh(p.netWorth)}
                </div>
              </div>
              <button onClick={close} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5">
                <Icon name="x" size={18} />
              </button>
            </div>
            {p.bio && <p className="rounded-2xl bg-background p-3 text-sm italic">“{p.bio}”</p>}
            {data.blocked ? (
              <div className="flex items-center justify-between gap-2 rounded-2xl bg-kred/10 p-3 text-sm text-kred">
                You blocked this player.
                <Btn variant="ghost" onClick={async () => setData({ ...data, blocked: (await api.block(p.username, false)).blocked })}>
                  Unblock
                </Btn>
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    close();
                    openApp("messages", p.username);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-kgreen py-3.5 font-display text-lg font-bold text-white shadow-lg transition hover:brightness-110 active:scale-[0.98]"
                >
                  <Icon name="message-circle" size={22} /> Chat
                </button>
                <div className="grid grid-cols-2 gap-2">
                  {PLAYER_SOCIALS.map((x) => (
                    <button key={x.id} onClick={() => social(x.id)} className="flex items-center gap-3 rounded-2xl bg-background px-3 py-2.5 text-left transition hover:bg-sun/20 active:scale-[0.98]">
                      <Icon name={x.icon} size={24} className="text-foreground/80" />
                      <span>
                        <span className="block text-sm font-semibold">{x.label}</span>
                        <span className="block text-[11px] text-muted">{x.gain}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-line p-2">
                  <Icon name="device-mobile-message" size={20} className="ml-1 text-kgreen" />
                  <div className="flex flex-1 gap-1 overflow-x-auto">
                    {[100, 500, 1000, 5000, 20000].map((a) => (
                      <button key={a} onClick={() => setAmount(a)} className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${amount === a ? "bg-foreground text-background" : "bg-background"}`}>
                        {a.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <Btn disabled={amount > s.money || amount < MIN_SEND || amount > MAX_SEND || !canAfford(s, amount)} onClick={pay}>
                    Send
                  </Btn>
                </div>
                <div className="flex justify-center gap-2">
                  <button onClick={async () => setData({ ...data, blocked: (await api.block(p.username, true)).blocked })} className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted hover:text-foreground">
                    <IconLabel name="ban" size={13}>Block</IconLabel>
                  </button>
                  <button onClick={() => setReport(!report)} className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted hover:text-kred">
                    <IconLabel name="flag" size={13}>Report</IconLabel>
                  </button>
                </div>
                {report && (
                  <div className="grid grid-cols-2 gap-1">
                    {REPORT_REASONS.map((r) => (
                      <Btn
                        key={r.id}
                        variant="ghost"
                        onClick={async () => {
                          await api.report(p.username, r.id).catch(() => {});
                          setReport(false);
                          setData({ ...data, blocked: true });
                          setMsg("Thanks. We've blocked them for you and will review the report.");
                        }}
                      >
                        {r.label}
                      </Btn>
                    ))}
                  </div>
                )}
              </>
            )}
            {msg && <p className="text-center text-sm text-muted">{msg}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

/** One-on-one chat inside the phone's Messages app. Polls every few seconds while open. */
export function ChatView({ username }: { username: string }) {
  const view = useOnline((st) => st.view);
  const [player, setPlayer] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    const load = () =>
      api
        .conversation(username)
        .then((d) => {
          if (!live) return;
          setPlayer(d.player);
          setMessages(d.messages);
        })
        .catch((e) => live && setError(e instanceof Error ? e.message : "Couldn't load messages."));
    load();
    const id = setInterval(() => !document.hidden && load(), 5000);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, [username]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const submit = async () => {
    const body = text.trim();
    if (!body) return;
    setText("");
    try {
      const { message } = await api.message(username, body);
      setMessages((m) => [...m, message]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send.");
      setText(body);
    }
  };

  return (
    <div className="flex h-full min-h-[60dvh] flex-col">
      <button onClick={() => player && view(player.username)} className="mb-2 flex items-center gap-2 rounded-2xl bg-white p-2 text-left shadow-sm">
        {player && <Avatar look={player.look} size={36} />}
        <span className="min-w-0">
          <span className="block truncate font-semibold">{player?.displayName ?? `@${username}`}</span>
          <span className="block truncate text-xs text-muted">{player ? (player.online ? "Online" : "Offline") : ""}</span>
        </span>
      </button>
      <div className="flex flex-1 flex-col gap-2">
        {messages.length === 0 && <Empty>Say rada!</Empty>}
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.mine ? "self-end rounded-br-sm bg-kgreen text-white" : "self-start rounded-bl-sm bg-white shadow-sm"}`}>
            {m.body}
            <div className={`mt-0.5 text-[10px] ${m.mine ? "text-white/70" : "text-muted"}`}>{ago(m.at)}</div>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      {error && <p className="mt-2 text-sm text-kred">{error}</p>}
      <form
        className="sticky bottom-0 mt-3 flex gap-2 bg-background pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Andika ujumbe…" className="min-w-0 flex-1 rounded-full border border-line bg-white px-4 py-2 outline-none focus:border-foreground" />
        <button disabled={!text.trim()} aria-label="Send" className="grid h-10 w-10 place-items-center rounded-full bg-kgreen text-white disabled:opacity-40">
          <Icon name="player-play" size={18} />
        </button>
      </form>
    </div>
  );
}

/** Phone app: conversations. */
export function UjumbeApp() {
  const chat = useUi((st) => st.setChat);
  const [threads, setThreads] = useState<Thread[] | null>(null);
  useEffect(() => {
    let live = true;
    const load = () => api.threads().then((d) => live && setThreads(d.threads)).catch(() => live && setThreads([]));
    load();
    const id = setInterval(() => !document.hidden && load(), 10_000);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, []);
  if (!threads) return <p className="text-sm text-muted">Loading…</p>;
  if (!threads.length) return <Empty>No messages yet. Find people in the Watu app.</Empty>;
  return (
    <div className="space-y-2">
      {threads.map((t) => (
        <button key={t.player.username} onClick={() => chat(t.player.username)} className="flex w-full items-center gap-3 rounded-xl border border-line bg-card px-3 py-2 text-left transition hover:border-foreground">
          <Avatar look={t.player.look} size={40} />
          <span className="min-w-0 flex-1">
            <span className="flex justify-between gap-2">
              <span className="truncate font-semibold">{t.player.displayName}</span>
              <span className="text-xs text-muted">{ago(t.at)}</span>
            </span>
            <span className={`block truncate text-sm ${t.unread ? "font-semibold" : "text-muted"}`}>
              {t.mine ? "You: " : ""}
              {t.last}
            </span>
          </span>
          {t.unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-kred px-1 text-xs font-bold text-white">{t.unread}</span>}
        </button>
      ))}
    </div>
  );
}

/** Phone app: who's online, search, and the Rich List. */
export function WatuApp() {
  const [tab, setTab] = useState<"online" | "search" | "rich">("online");
  const [list, setList] = useState<Profile[] | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => {
    let live = true;
    if (tab === "search") {
      if (q.length < 2) return;
      const t = setTimeout(() => api.search(q).then((d) => live && setList(d.players)).catch(() => {}), 300);
      return () => {
        live = false;
        clearTimeout(t);
      };
    }
    (tab === "online" ? api.online() : api.rich()).then((d) => live && setList(d.players)).catch(() => live && setList([]));
    return () => {
      live = false;
    };
  }, [tab, q]);
  const shown = tab === "search" && q.length < 2 ? [] : list;
  return (
    <>
      <Tabs
        value={tab}
        onChange={(t) => {
          setTab(t);
          setList(null);
        }}
        items={[{ id: "online", label: <IconLabel emoji="🟢">Online</IconLabel> }, { id: "search", label: <IconLabel emoji="🔍">Search</IconLabel> }, { id: "rich", label: <IconLabel emoji="💰">Rich List</IconLabel> }]}
      />
      {tab === "search" && <input value={q} onChange={(e) => setQ(e.target.value.toLowerCase())} placeholder="Search usernames" autoCapitalize="none" className="w-full rounded-xl border border-line bg-card px-3 py-2" />}
      {shown === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : shown.length === 0 ? (
        <Empty>{tab === "online" ? "Nobody else is online right now." : tab === "search" ? "Type at least two letters." : "No one yet."}</Empty>
      ) : (
        <div className="space-y-2">
          {shown.map((p, i) => (
            <PlayerRow key={p.username} p={p} sub={tab === "rich" ? `#${i + 1} · ${ksh(p.netWorth)}` : undefined} />
          ))}
        </div>
      )}
    </>
  );
}

/** Your own profile: avatar builder, display name, bio. */
export function ProfileEditor({ onClose }: { onClose: () => void }) {
  const me = useOnline((st) => st.me);
  const setMe = useOnline((st) => st.setMe);
  const game = useGame((st) => st.game);
  const send = useGame((st) => st.send);
  const [look, setLook] = useState(sanitizeLook(me?.look ?? game?.player.look));
  const [displayName, setDisplayName] = useState(me?.displayName ?? game?.player.name ?? "");
  const [bio, setBio] = useState(me?.bio ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    setBusy(true);
    send({ type: "setLook", look });
    try {
      if (me) setMe((await api.updateProfile({ look, displayName, bio })).user);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet title="Edit your look" onClose={onClose}>
      <AvatarBuilder look={look} onChange={setLook} />
      {me && (
        <div className="mt-4 space-y-2">
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={24} placeholder="Display name" className="w-full rounded-xl border border-line bg-card px-3 py-2" />
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} rows={2} placeholder="Bio: who are you in Kanairo?" className="w-full rounded-xl border border-line bg-card px-3 py-2" />
        </div>
      )}
      {error && <p className="mt-2 text-sm text-kred">{error}</p>}
      <Btn className="mt-4 w-full py-3" disabled={busy} onClick={save}>
        Save
      </Btn>
    </Sheet>
  );
}
