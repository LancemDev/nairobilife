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
import { Btn, Empty, IconLabel, ksh, Sheet, Tabs } from "./ui";

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

/** Someone else's profile: message, send M-Pesa, block, report. */
export function PlayerSheet({ s }: { s: GameState }) {
  const username = useOnline((st) => st.viewing);
  const view = useOnline((st) => st.view);
  const chat = useOnline((st) => st.chat);
  const send = useGame((st) => st.send);
  const [data, setData] = useState<{ player: Profile; blocked: boolean } | null>(null);
  const [amount, setAmount] = useState(500);
  const [note, setNote] = useState("");
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
      const res = await api.send(username, amount, note);
      send({ type: "transferOut", to: res.to, amount: res.amount });
      setMsg(`Sent ${ksh(res.amount)} to ${res.toName}.`);
      setNote("");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Couldn't send.");
    }
  };

  return (
    <Sheet title={p ? p.displayName : "…"} onClose={close}>
      {!p ? (
        <p className="text-sm text-muted">{msg ?? "Loading…"}</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar look={p.look} size={72} variant="full" />
            <div className="min-w-0">
              <div className="text-sm text-muted">@{p.username}</div>
              <div className="font-semibold">{p.title || "Mwananchi"}</div>
              <div className="text-sm">
                {p.online ? "Online" : "Offline"} · {where(p)}
              </div>
              <div className="font-mono text-sm">Net worth {ksh(p.netWorth)}</div>
            </div>
          </div>
          {p.bio && <p className="rounded-xl bg-background/60 p-3 text-sm italic">“{p.bio}”</p>}
          {data.blocked ? (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-kred/10 p-3 text-sm text-kred">
              You blocked this player.
              <Btn variant="ghost" onClick={async () => setData({ ...data, blocked: (await api.block(p.username, false)).blocked })}>
                Unblock
              </Btn>
            </div>
          ) : (
            <>
              <Btn className="w-full" onClick={() => chat(p.username)}>
                <IconLabel name="message-circle">Message</IconLabel>
              </Btn>
              <div className="rounded-xl border border-line p-3">
                <div className="mb-2 text-sm font-semibold"><IconLabel name="device-mobile-message">Send M-Pesa</IconLabel></div>
                <div className="flex flex-wrap gap-1">
                  {[100, 500, 1000, 5000, 20000].map((a) => (
                    <button key={a} onClick={() => setAmount(a)} className={`rounded-full border px-3 py-1 text-sm ${amount === a ? "border-foreground bg-sun/40" : "border-line"}`}>
                      {a.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={80} placeholder="Note (optional)" className="mt-2 w-full rounded-lg border border-line bg-card px-3 py-2 text-sm" />
                <Btn className="mt-2 w-full" disabled={amount > s.money || amount < MIN_SEND || amount > MAX_SEND || !canAfford(s, amount)} onClick={pay}>
                  Send {ksh(amount)}
                </Btn>
              </div>
              <div className="flex gap-2">
                <Btn variant="ghost" className="flex-1" onClick={async () => setData({ ...data, blocked: (await api.block(p.username, true)).blocked })}>
                  <IconLabel name="ban">Block</IconLabel>
                </Btn>
                <Btn variant="danger" className="flex-1" onClick={() => setReport(!report)}>
                  <IconLabel name="flag">Report</IconLabel>
                </Btn>
              </div>
              {report && (
                <div className="grid gap-1">
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
          {msg && <p className="text-sm">{msg}</p>}
        </div>
      )}
    </Sheet>
  );
}

/** One-on-one chat. Polls every few seconds while open. */
export function ChatSheet() {
  const username = useOnline((st) => st.chatWith);
  const chat = useOnline((st) => st.chat);
  const view = useOnline((st) => st.view);
  const [player, setPlayer] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!username) return;
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

  if (!username) return null;
  const close = () => {
    chat(null);
    setMessages([]);
    setPlayer(null);
    setError(null);
  };
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
    <Sheet
      title={
        <button onClick={() => player && view(player.username)} className="flex items-center gap-2 text-left">
          {player && <Avatar look={player.look} size={32} />}
          <span>{player?.displayName ?? `@${username}`}</span>
        </button>
      }
      onClose={close}
    >
      <div className="flex min-h-[40vh] flex-col gap-2">
        {messages.length === 0 && <Empty>Say rada!</Empty>}
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.mine ? "self-end rounded-br-sm bg-kgreen text-white" : "self-start rounded-bl-sm bg-line/70"}`}>
            {m.body}
            <div className={`mt-0.5 text-[10px] ${m.mine ? "text-white/70" : "text-muted"}`}>{ago(m.at)}</div>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      {error && <p className="mt-2 text-sm text-kred">{error}</p>}
      <form
        className="sticky bottom-0 mt-3 flex gap-2 bg-card pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Andika ujumbe…" className="min-w-0 flex-1 rounded-xl border border-line bg-card px-3 py-2 outline-none focus:border-foreground" />
        <Btn disabled={!text.trim()}>Send</Btn>
      </form>
    </Sheet>
  );
}

/** Phone app: conversations. */
export function UjumbeApp() {
  const chat = useOnline((st) => st.chat);
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
