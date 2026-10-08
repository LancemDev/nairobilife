"use client";

import { useState } from "react";
import { ASPIRATIONS, BIRTH_LOTTERY, ESTATE, ORIGINS, TRAITS, UNIT } from "@/game/data";
import { randomLook } from "@/game/look";
import { weeklyRent } from "@/game/engine";
import { useGame } from "@/game/store";
import { api } from "@/online/api";
import { useOnline } from "@/online/store";
import type { GameState } from "@/game/types";
import { AvatarBuilder } from "./Avatar";
import { Icon } from "./Icon";
import { IconLabel, ksh } from "./ui";

const STEPS = ["Look", "Personality", "Dream", "Birth lottery"] as const;

export default function Creator({ onDone }: { onDone?: () => void }) {
  const start = useGame((s) => s.start);
  const me = useOnline((s) => s.me);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(me?.displayName ?? "");
  const [look, setLook] = useState(() => randomLook());
  const [originId, setOrigin] = useState(ORIGINS[0].id);
  const [traits, setTraits] = useState<string[]>([]);
  const [aspirationId, setAspiration] = useState(ASPIRATIONS[0].id);
  const [lotteryId, setLottery] = useState<string | null>(null);

  const begin = () => {
    if (!me) return;
    start({ name: name.trim(), avatar: "🧑🏾", look, originId, traits, aspirationId, lotteryId: lotteryId! }, me.username);
    // Save the new life to the account straight away, and use the look as the profile picture.
    const game = useGame.getState().game;
    if (game) api.putSave(game).catch(() => {});
    api.updateProfile({ look }).then((r) => useOnline.getState().setMe(r.user)).catch(() => {});
    onDone?.();
  };

  const canNext = [name.trim().length > 0, traits.length === 2, !!aspirationId, !!lotteryId][step];
  const toggleTrait = (id: string) =>
    setTraits((t) => (t.includes(id) ? t.filter((x) => x !== id) : t.length < 2 ? [...t, id] : [t[1], id]));

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="flex items-center justify-between">
        <button onClick={() => setStep(step - 1)} className={`text-sm text-muted hover:text-foreground ${step ? "" : "invisible"}`}>
          ← Back
        </button>
        <ol className="flex gap-1.5" aria-label="Steps">
          {STEPS.map((label, i) => (
            <li key={label} className={`h-1.5 w-8 rounded-full ${i <= step ? "bg-foreground" : "bg-line"}`} title={label} />
          ))}
        </ol>
      </div>
      <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-kred">Step {step + 1} · {STEPS[step]}</p>

      {step === 0 && (
        <div className="mt-2 space-y-6">
          <h1 className="font-display text-4xl font-extrabold">Who are you?</h1>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder="Your name, e.g. Achieng"
            autoFocus
            className="w-full rounded-xl border border-line bg-card px-4 py-3 text-lg outline-none focus:border-foreground"
          />
          <AvatarBuilder look={look} onChange={setLook} />
          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted">Where are you from?</h2>
            <Grid items={ORIGINS.map((o) => ({ id: o.id, title: o.name, desc: o.blurb }))} selected={[originId]} onPick={setOrigin} />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="mt-2 space-y-4">
          <h1 className="font-display text-4xl font-extrabold">Pick two traits</h1>
          <p className="text-muted">They change how fast your needs drop, which skills you learn quickly, and what you enjoy.</p>
          <Grid items={TRAITS.map((t) => ({ id: t.id, title: <IconLabel emoji={t.emoji}>{t.label}</IconLabel>, desc: t.desc }))} selected={traits} onPick={toggleTrait} />
        </div>
      )}

      {step === 2 && (
        <div className="mt-2 space-y-4">
          <h1 className="font-display text-4xl font-extrabold">Your lifetime dream</h1>
          <p className="text-muted">Achieve it for a big vibes bonus and bragging rights.</p>
          <Grid items={ASPIRATIONS.map((a) => ({ id: a.id, title: <IconLabel emoji={a.emoji}>{a.label}</IconLabel>, desc: a.desc }))} selected={[aspirationId]} onPick={setAspiration} />
        </div>
      )}

      {step === 3 && (
        <div className="mt-2 space-y-4">
          <h1 className="font-display text-4xl font-extrabold">Birth lottery</h1>
          <p className="text-muted">Life isn&apos;t fair. Pick your starting point.</p>
          <div className="grid gap-3">
            {BIRTH_LOTTERY.map((l) => {
              const rent = weeklyRent({ player: { estateId: l.estate, unitId: l.unit } } as GameState);
              return (
                <button key={l.id} onClick={() => setLottery(l.id)} aria-pressed={lotteryId === l.id} className={`rounded-2xl border p-4 text-left transition ${lotteryId === l.id ? "border-foreground bg-sun/30" : "border-line bg-card hover:border-muted"}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <IconLabel emoji={l.emoji} size={22} className="font-display text-xl font-bold">{l.label}</IconLabel>
                    <span className="font-mono text-sm">{ksh(l.money)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{l.desc}</p>
                  <p className="mt-2 text-xs text-muted">
                    <Icon name="home" size={13} className="mr-1 inline" />{UNIT[l.unit].name}, {ESTATE[l.estate].name} · {ksh(rent)}/wk{l.allowance ? ` · +${ksh(l.allowance)}/wk from family` : ""}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        disabled={!canNext}
        onClick={() => (step < STEPS.length - 1 ? setStep(step + 1) : begin())}
        className="mt-8 w-full rounded-2xl bg-foreground px-6 py-4 font-display text-xl font-bold text-background transition enabled:hover:bg-kgreen disabled:opacity-40"
      >
        {step < STEPS.length - 1 ? "Next →" : "Move to Kanairo"}
      </button>
    </main>
  );
}

function Grid({ items, selected, onPick }: { items: { id: string; title: React.ReactNode; desc: string }[]; selected: string[]; onPick: (id: string) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <button key={item.id} onClick={() => onPick(item.id)} aria-pressed={selected.includes(item.id)} className={`rounded-xl border px-4 py-3 text-left transition ${selected.includes(item.id) ? "border-foreground bg-sun/30" : "border-line bg-card hover:border-muted"}`}>
          <div className="font-semibold">{item.title}</div>
          <p className="text-sm text-muted">{item.desc}</p>
        </button>
      ))}
    </div>
  );
}
