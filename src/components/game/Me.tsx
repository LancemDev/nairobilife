"use client";

import { ASPIRATION, CAREER, CLASSES_TO_GRADUATE, COURSE, GOALS, REWARDS, TRAIT, VENUE, WISH, WORK_TONES } from "@/game/data";
import { activeMoodlets, clock, dayOf, netWorth } from "@/game/engine";
import { useState } from "react";
import { useGame } from "@/game/store";
import { api } from "@/online/api";
import { useOnline } from "@/online/store";
import Account from "./Account";
import { Avatar } from "./Avatar";
import { ProfileEditor } from "./Online";
import { SKILL_KEYS, type GameState } from "@/game/types";
import { Icon } from "./Icon";
import { Btn, Card, IconLabel, ksh, Meter } from "./ui";

export default function Me({ s }: { s: GameState }) {
  const send = useGame((st) => st.send);
  const reset = useGame((st) => st.reset);
  const career = s.job && CAREER[s.job.career];
  const dream = ASPIRATION[s.player.aspirationId];
  const dreamPct = Math.min(1, dream.progress(s));
  const blocked = !!s.event;

  return (
    <div className="space-y-3">
      <ProfileCard s={s} />
      <Card title={<IconLabel emoji="🏆">Lifetime dream</IconLabel>}>
        <div className="flex items-center gap-3">
          <Icon emoji={dream.emoji} size={32} className="text-kgreen" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{dream.label}</div>
            <div className="text-xs text-muted">{dream.desc}</div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-kgreen" style={{ width: `${dreamPct * 100}%` }} />
            </div>
          </div>
        </div>
      </Card>

      <Card title={<IconLabel emoji="✨">Today&apos;s wishes</IconLabel>} right={<IconLabel name="sparkles" className="font-mono text-sm">{s.vibes}</IconLabel>}>
        <ul className="space-y-1.5">
          {s.wishes.ids.map((id) => {
            const w = WISH[id];
            const done = s.wishes.done.includes(id);
            return (
              <li key={id} className={`flex items-center justify-between text-sm ${done ? "text-muted line-through" : ""}`}>
                <span>
                  <IconLabel emoji={done ? "✅" : w.emoji}>{w.label}</IconLabel>
                </span>
                <span className="font-mono text-xs">+{w.vibes}</span>
              </li>
            );
          })}
        </ul>
        {GOALS.some((g) => !s.goalsDone.includes(g.id)) && (
          <>
            <h4 className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted">Getting started</h4>
            <ul className="mt-1 grid grid-cols-2 gap-1 text-sm">
              {GOALS.map((g) => (
                <li key={g.id} className={s.goalsDone.includes(g.id) ? "text-muted line-through" : ""}>
                  <IconLabel emoji={s.goalsDone.includes(g.id) ? "✅" : g.emoji}>{g.label}</IconLabel>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card title={<IconLabel emoji="💼">Work</IconLabel>}>
        {career && s.job ? (
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold">{career.levels[s.job.level].title}</span> · {career.name} · {VENUE[career.venue].name}
            </div>
            <div className="text-muted">
              {ksh(career.levels[s.job.level].pay)}/shift · start {career.start[0]}:00–{career.start[1]}:00
              {career.levels[s.job.level + 1] && ` · next: ${career.levels[s.job.level + 1].title}`}
            </div>
            <Meter label="Performance" value={s.job.performance} />
            <div className="flex flex-wrap gap-1 pt-1">
              {WORK_TONES.map((t) => (
                <button key={t.id} disabled={blocked} onClick={() => send({ type: "setTone", tone: t.id })} title={t.desc} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${s.job!.tone === t.id ? "border-foreground bg-sun/40" : "border-line"}`}>
                  <IconLabel emoji={t.emoji}>{t.label}</IconLabel>
                </button>
              ))}
            </div>
            <Btn variant="danger" disabled={blocked} onClick={() => window.confirm("Quit your job?") && send({ type: "quitJob" })}>
              Quit job
            </Btn>
          </div>
        ) : (
          <p className="text-sm text-muted">Unemployed. Check the Kazi app on your phone for openings.</p>
        )}
        {s.study && (
          <p className="mt-3 text-sm">
            {COURSE[s.study.course].name}: {s.study.graduated ? "Graduated ✓" : `${s.study.classes}/${CLASSES_TO_GRADUATE} classes`}
          </p>
        )}
      </Card>

      <Card title={<IconLabel emoji="🧠">Skills</IconLabel>}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          {SKILL_KEYS.map((k) => (
            <Meter key={k} label={k[0].toUpperCase() + k.slice(1)} value={s.skills[k]} tone="neutral" />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {s.player.traits.map((t) => (
            <span key={t} title={TRAIT[t].desc} className="rounded-full bg-sun/30 px-2.5 py-1 text-xs font-semibold">
              <IconLabel emoji={TRAIT[t].emoji}>{TRAIT[t].label}</IconLabel>
            </span>
          ))}
        </div>
      </Card>

      <Card title={<IconLabel emoji="😶‍🌫️">Moodlets</IconLabel>}>
        {activeMoodlets(s).length === 0 ? (
          <p className="text-sm text-muted">Feeling neutral.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {activeMoodlets(s).map((m) => (
              <span key={m.id} title={`Until ${clock(m.until)}`} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${m.mood >= 0 ? "bg-kgreen/15 text-kgreen" : "bg-kred/15 text-kred"}`}>
                <IconLabel emoji={m.emoji}>{m.label} {m.mood > 0 ? "+" : ""}{m.mood}</IconLabel>
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card title={<IconLabel emoji="🎁">Perks</IconLabel>} right={<IconLabel name="sparkles" className="font-mono text-sm">{s.vibes}</IconLabel>}>
        <div className="grid gap-2 sm:grid-cols-2">
          {REWARDS.map((r) => {
            const owned = s.rewards.includes(r.id);
            return (
              <button key={r.id} disabled={owned || s.vibes < r.cost || blocked} onClick={() => send({ type: "reward", id: r.id })} className={`rounded-xl border p-2.5 text-left text-sm transition enabled:hover:border-foreground disabled:opacity-60 ${owned ? "border-kgreen bg-kgreen/10" : "border-line"}`}>
                <div className="flex justify-between font-semibold">
                  <span>
                    <IconLabel emoji={r.emoji}>{r.label}</IconLabel>
                  </span>
                  <span className="font-mono text-xs">{owned ? "✓" : r.cost}</span>
                </div>
                <div className="text-xs text-muted">{r.desc}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card title={<IconLabel emoji="📊">Life so far</IconLabel>}>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <Stat label="Days in Kanairo" value={dayOf(s.time)} />
          <Stat label="Net worth" value={ksh(netWorth(s))} />
          <Stat label="Total earned" value={ksh(s.stats.earned)} />
          <Stat label="Shifts worked" value={s.stats.shifts} />
          <Stat label="Promotions" value={s.stats.promotions} />
          <Stat label="Friends" value={Object.values(s.relationships).filter((r) => r.rel >= 30).length} />
        </dl>
        <button onClick={() => window.confirm("Start a new life? Your current save will be lost.") && reset()} className="mt-4 text-sm text-muted underline-offset-2 hover:text-kred hover:underline">
          Start a new life
        </button>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-background/60 p-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-mono font-bold">{value}</dd>
    </div>
  );
}

function ProfileCard({ s }: { s: GameState }) {
  const me = useOnline((st) => st.me);
  const setMe = useOnline((st) => st.setMe);
  const [edit, setEdit] = useState(false);
  const [account, setAccount] = useState(false);
  return (
    <Card>
      <div className="flex items-center gap-4">
        {s.player.look ? <Avatar look={s.player.look} size={64} variant="full" /> : <span className="text-5xl">{s.player.avatar}</span>}
        <div className="min-w-0 flex-1">
          <div className="font-display text-xl font-bold">{me?.displayName ?? s.player.name}</div>
          <div className="text-sm text-muted">{me ? `@${me.username} · Online` : "Playing offline on this device"}</div>
          {me?.bio && <div className="truncate text-sm italic">“{me.bio}”</div>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Btn variant="ghost" onClick={() => setEdit(true)}>
          <IconLabel name="palette">{me ? "Edit profile" : "Edit look"}</IconLabel>
        </Btn>
        {me ? (
          <Btn
            variant="ghost"
            onClick={async () => {
              await api.putSave(s).catch(() => {});
              await api.logout().catch(() => {});
              setMe(null);
            }}
          >
            Log out
          </Btn>
        ) : (
          <Btn onClick={() => setAccount(true)}><IconLabel name="world">Go online</IconLabel></Btn>
        )}
      </div>
      {edit && <ProfileEditor onClose={() => setEdit(false)} />}
      {account && <Account onClose={() => setAccount(false)} />}
    </Card>
  );
}
