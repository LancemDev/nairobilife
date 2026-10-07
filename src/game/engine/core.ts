import {
  AREA,
  ASPIRATION,
  BANK,
  BUSINESS,
  CAREER,
  ESTATE,
  EVENTS,
  GOALS,
  LOTTERY,
  MOODLET,
  NPCS,
  OFFICE,
  OFFICES,
  PLOT,
  SHA_WEEKLY,
  SICKNESSES,
  SICKNESS,
  TRAIT,
  UNIT,
  VENUE,
  WISH,
  WISHES,
} from "../data";
import { NEED_KEYS, type Choice, type Effect, type EventContext, type GameState, type LogEntry, type NeedKey, type Rng, type SkillKey, type Hours } from "../types";

export const DAY = 1440;
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DECAY: Record<NeedKey, number> = { hunger: 4, energy: 3.5, bladder: 6, hygiene: 2.5, fun: 2.5, social: 2 };

export const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
export const pick = <T>(list: T[], rng: Rng) => list[Math.floor(rng() * list.length)];

// ---------------------------------------------------------------------------
// Time

export const dayOf = (t: number) => Math.floor(t / DAY) + 1;
export const hourOf = (t: number) => (t % DAY) / 60;
export const weekdayIdx = (t: number) => (dayOf(t) - 1) % 7;
export const weekdayOf = (t: number) => WEEKDAYS[weekdayIdx(t)];
export const isWeekend = (t: number) => weekdayIdx(t) >= 5;
export const inHours = (h: number, [from, to]: Hours) => (from <= to ? h >= from && h < to : h >= from || h < to);
export const isRushHour = (t: number) => {
  const h = hourOf(t);
  return !isWeekend(t) && (inHours(h, [6.5, 9]) || inHours(h, [17, 19.5]));
};
export function clock(t: number) {
  const h = Math.floor(hourOf(t));
  const m = Math.floor(t % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Lookups

export const estateOf = (s: GameState) => ESTATE[s.player.estateId];
export const unitOf = (s: GameState) => UNIT[s.player.unitId];
export const has = (s: GameState, obj: string) => s.objects.includes(obj);
export const hasReward = (s: GameState, id: string) => s.rewards.includes(id);
export const traits = (s: GameState) => s.player.traits.map((t) => TRAIT[t]).filter(Boolean);
export const isBlackout = (s: GameState) => !!s.blackout && s.time >= s.blackout.start && s.time < s.blackout.end;
export const isWaterCut = (s: GameState) => !!s.waterCut && s.time >= s.waterCut.start && s.time < s.waterCut.end;
export const hasPower = (s: GameState) => !isBlackout(s) || has(s, "solar") || has(s, "generator");
export const hasWater = (s: GameState) => !isWaterCut(s) || has(s, "waterTank");
export const sickness = (s: GameState) => (s.sick ? SICKNESS[s.sick.id] : null);
export const married = (s: GameState) => Object.entries(s.relationships).find(([, r]) => r.married)?.[0] ?? null;
export const bae = (s: GameState) => Object.entries(s.relationships).find(([, r]) => r.bae || r.married)?.[0] ?? null;

export const weeklyRent = (s: GameState, estateId = s.player.estateId, unitId = s.player.unitId) =>
  Math.round((UNIT[unitId].rent * ESTATE[estateId].rentFactor) / 50) * 50;

export function placeOf(s: GameState, id = s.location) {
  if (id === "home") {
    const e = estateOf(s);
    return { id, name: `Home · ${e.name}`, emoji: "🏠", area: e.area, x: e.x, y: e.y, blurb: `${unitOf(s).name}. ${e.blurb}` };
  }
  const v = VENUE[id];
  const a = AREA[v.area];
  return { id, name: v.name, emoji: v.emoji, area: v.area, x: a.x, y: a.y, blurb: v.blurb };
}

export const npcsHere = (s: GameState) => {
  const h = hourOf(s.time);
  const here = NPCS.filter((n) => n.venue === s.location && inHours(h, n.hours)).map((n) => n.id);
  const spouse = married(s);
  if (s.location === "home" && spouse && !here.includes(spouse)) here.push(spouse);
  return here;
};

export function netWorth(s: GameState) {
  const plots = s.plots.reduce((n, p) => n + (p.fake ? 0 : p.value), 0);
  const biz = s.businesses.reduce((n, b) => n + BUSINESS[b.id].price * 0.6, 0);
  return Math.round(s.money + s.bank.savings + (s.bank.bond?.amount ?? 0) - s.bank.loan + plots + biz);
}

// ---------------------------------------------------------------------------
// Log, money, moodlets, skills

export function log(s: GameState, text: string, tone: LogEntry["tone"] = "info") {
  s.log = [{ id: s.nextLogId++, time: s.time, text, tone }, ...s.log].slice(0, 120);
}

export const fulizaLimit = (s: GameState) => 2000 + Math.floor(Math.min(48000, s.stats.earned / 20) / 500) * 500;
export const canAfford = (s: GameState, amount: number) => amount <= 0 || s.money - amount >= -fulizaLimit(s);

export function pay(s: GameState, amount: number) {
  if (amount <= 0) return;
  const overdrawnBefore = Math.max(0, -s.money);
  s.money -= amount;
  const newlyOverdrawn = Math.max(0, -s.money) - overdrawnBefore;
  if (newlyOverdrawn > 0) {
    const fee = Math.ceil(newlyOverdrawn * 0.05);
    s.money -= fee;
    log(s, `Fuliza covered KSh ${newlyOverdrawn.toLocaleString()} (fee KSh ${fee}).`, "bad");
  }
}

export function earn(s: GameState, amount: number) {
  if (amount <= 0) return;
  s.money += amount;
  s.stats.earned += amount;
  s.today.earned += amount;
}

/** Shop prices after traits and perks. */
export function price(s: GameState, base: number) {
  let p = base;
  if (traits(s).some((t) => t.discount)) p *= 0.9;
  if (hasReward(s, "connected")) p *= 0.9;
  return Math.round(p);
}

export function addMoodlet(s: GameState, id: string) {
  const m = MOODLET[id];
  if (!m) return;
  const hours = m.mood > 0 && hasReward(s, "goodVibes") ? m.hours * 1.5 : m.hours;
  s.moodlets = [...s.moodlets.filter((x) => x.id !== id), { id, until: s.time + hours * 60 }];
}

export const activeMoodlets = (s: GameState) => s.moodlets.filter((m) => m.until > s.time && MOODLET[m.id]).map((m) => ({ ...MOODLET[m.id], until: m.until }));

export function mood(s: GameState) {
  const needs = NEED_KEYS.reduce((sum, k) => sum + s.needs[k], 0) / NEED_KEYS.length;
  const moodlets = activeMoodlets(s).reduce((sum, m) => sum + m.mood, 0);
  const decor = s.location === "home" ? s.objects.filter((o) => ["plant", "kikoy", "art", "curtains", "chandelier"].includes(o)).length * 2 : 0;
  return clamp(needs + moodlets + decor);
}

export function skillMultiplier(s: GameState, k: SkillKey) {
  let m = 1;
  for (const t of traits(s)) m *= t.skill?.[k] ?? 1;
  if (hasReward(s, "fastLearner")) m *= 1.2;
  if (s.policies.includes("cbdWifi") && placeOf(s).area === "cbd") m *= 1.2;
  return m;
}

export function gainSkill(s: GameState, k: SkillKey, amount: number) {
  s.skills[k] = clamp(s.skills[k] + (amount > 0 ? amount * skillMultiplier(s, k) : amount));
}

export function addNeeds(s: GameState, needs: Partial<Record<NeedKey, number>> | undefined, scale = 1) {
  for (const [k, v] of Object.entries(needs ?? {})) s.needs[k as NeedKey] = clamp(s.needs[k as NeedKey] + (v > 0 ? v * scale : v));
}

export function addRel(s: GameState, npc: string, delta: number) {
  const r = (s.relationships[npc] ??= { rel: 0 });
  r.rel = clamp(r.rel + delta, -100, 100);
}

function decayRate(s: GameState, k: NeedKey) {
  let r = DECAY[k];
  for (const t of traits(s)) r *= t.decay?.[k] ?? 1;
  const perks: Partial<Record<NeedKey, [string, number]>> = {
    hunger: ["ironBelly", 0.75],
    bladder: ["bladder", 0.7],
    energy: ["earlyBird", 0.75],
    fun: ["neverBored", 0.75],
  };
  const perk = perks[k];
  if (perk && hasReward(s, perk[0])) r *= perk[1];
  if (s.sick && (k === "energy" || k === "fun")) r *= sickness(s)!.serious ? 2 : 1.4;
  return r;
}

// ---------------------------------------------------------------------------
// Effects, events and the clock

export function applyEffect(s: GameState, e: Effect, rng: Rng) {
  if (e.money) {
    if (e.money < 0) pay(s, -e.money);
    else earn(s, e.money);
  }
  if (e.minutes) advance(s, e.minutes, rng);
  addNeeds(s, e.needs);
  for (const [k, v] of Object.entries(e.skills ?? {})) gainSkill(s, k as SkillKey, v);
  if (e.performance && s.job) s.job.performance = clamp(s.job.performance + e.performance);
  if (e.moodlet) addMoodlet(s, e.moodlet);
  if (e.vibes) s.vibes += e.vibes;
  if (e.rel) addRel(s, e.rel.npc, e.rel.delta);
}

export const canChoose = (s: GameState, c: Choice) => !c.effect.money || c.effect.money > 0 || canAfford(s, -c.effect.money);

export function triggerEvent(s: GameState, context: EventContext, rng: Rng) {
  if (s.event) return;
  // Never open an event the player can't answer.
  const pool = EVENTS.filter((e) => e.context === context && e.choices.some((c) => canChoose(s, c)) && (!e.when || e.when(s)));
  const total = pool.reduce((sum, e) => sum + e.weight, 0);
  let roll = rng() * total;
  for (const e of pool) {
    roll -= e.weight;
    if (roll < 0) {
      s.event = { id: e.id, title: e.title, text: e.text, choices: e.choices };
      return;
    }
  }
}

/** Passes time hour-by-hour so needs decay and day rollovers fire in order. */
export function advance(s: GameState, minutes: number, rng: Rng, asleep = false) {
  let remaining = minutes;
  while (remaining > 0) {
    const step = Math.min(remaining, 60 - (s.time % 60));
    const hours = step / 60;
    for (const k of NEED_KEYS) {
      const rate = decayRate(s, k) * (asleep ? (k === "hunger" || k === "bladder" ? 0.4 : 0) : 1);
      s.needs[k] = clamp(s.needs[k] - rate * hours);
    }
    const prevDay = dayOf(s.time);
    s.time += step;
    remaining -= step;
    if (dayOf(s.time) !== prevDay) onNewDay(s, rng);
  }
  s.moodlets = s.moodlets.filter((m) => m.until > s.time);
}

function rollWishes(s: GameState, rng: Rng) {
  const pool = [...WISHES];
  const ids: string[] = [];
  while (ids.length < 3 && pool.length) ids.push(pool.splice(Math.floor(rng() * pool.length), 1)[0].id);
  s.wishes = { day: dayOf(s.time), ids, done: [] };
}

function weekly(s: GameState, rng: Rng) {
  const estate = estateOf(s);
  const spouse = married(s);
  const rent = Math.round(weeklyRent(s) * (spouse ? 0.5 : 1));
  s.rentPaidThroughDay += 7;
  if (canAfford(s, rent)) {
    pay(s, rent);
    log(s, `Paid weekly rent for your ${unitOf(s).name.toLowerCase()} in ${estate.name}: KSh ${rent.toLocaleString()}${spouse ? " (your spouse paid half)" : ""}.`);
  } else {
    s.arrears += rent;
    addMoodlet(s, "landlord");
    log(s, `Couldn't pay rent. You owe the landlord KSh ${s.arrears.toLocaleString()}.`, "bad");
    if (s.arrears >= rent * 2) evict(s);
  }

  const lottery = LOTTERY[s.player.lotteryId];
  if (lottery?.allowance) {
    earn(s, lottery.allowance);
    log(s, `📲 Buda sent your weekly KSh ${lottery.allowance.toLocaleString()}. "Usitumie vibaya."`, "good");
  }
  if (s.insured) {
    pay(s, SHA_WEEKLY);
    log(s, `SHA contribution: KSh ${SHA_WEEKLY}.`);
  }

  let bizTotal = 0;
  for (const b of s.businesses) {
    const def = BUSINESS[b.id];
    const raided = (b.id === "smokieStand" || b.id === "mitumbaStall") && rng() < 0.15;
    const crackdown = b.id === "nganya" && rng() < 0.1;
    if (raided || crackdown) {
      log(s, `${def.emoji} ${def.name}: ${raided ? "kanjo shut you down for the week" : "NTSA crackdown, the nganya sat at the yard"}. Nothing earned.`, "bad");
      continue;
    }
    const amount = Math.round(def.weekly[0] + rng() * (def.weekly[1] - def.weekly[0]));
    bizTotal += amount;
  }
  if (bizTotal) {
    earn(s, bizTotal);
    log(s, `💼 Your businesses made KSh ${bizTotal.toLocaleString()} this week.`, "good");
  }

  for (const p of s.plots) {
    if (p.fake) {
      if (p.value > 0) log(s, `📐 Ardhi House: the title for ${PLOT[p.id].name} is fake. Land cartels got you. KSh ${p.paid.toLocaleString()} gone.`, "bad");
      p.value = 0;
    } else p.value = Math.round(p.value * (1 + PLOT[p.id].growth * (0.5 + rng())));
  }

  if (s.bank.loan > 0) {
    s.bank.loan = Math.round(s.bank.loan * (1 + BANK.loanWeekly));
    log(s, `The loan app added interest. You owe KSh ${s.bank.loan.toLocaleString()}.`, "bad");
  }

  if (s.office) {
    const office = OFFICE[s.office.id];
    earn(s, office.allowance);
    log(s, `🏛️ ${office.title} allowance: KSh ${office.allowance.toLocaleString()}.`, "good");
  }
}

export function electionOdds(s: GameState) {
  if (!s.campaign) return 0;
  const office = OFFICE[s.campaign.office];
  const raw = 0.15 + s.skills.charm / 250 + Math.min(1, s.campaign.spent / office.campaign) * 0.45 + (s.voter ? 0.05 : 0);
  return Math.max(0.05, Math.min(0.9, raw));
}

function resolveElection(s: GameState, rng: Rng) {
  if (!s.campaign) return;
  const office = OFFICE[s.campaign.office];
  if (rng() < electionOdds(s)) {
    s.office = { id: office.id, since: dayOf(s.time) };
    s.policies = s.policies.slice(0, OFFICES.indexOf(office) + 1);
    addMoodlet(s, "won");
    log(s, `🗳️ You won! Mheshimiwa ${s.player.name}, ${office.title}. Pick your policies in the Siasa app.`, "good");
  } else {
    addMoodlet(s, "rejected");
    log(s, `🗳️ You lost the ${office.title} race. "Tutarudi 2032," you tell your supporters.`, "bad");
  }
  s.campaign = null;
}

function evict(s: GameState) {
  log(s, "The landlord changed the locks. You've moved to a single room in Kayole and lost your deposit.", "bad");
  s.player.estateId = "kayole";
  s.player.unitId = "single";
  s.arrears = 0;
  s.objects = s.objects.filter((o) => !["kingBed", "bigSofa", "jacuzzi", "homeCinema", "poolTable", "chandelier"].includes(o));
  addMoodlet(s, "landlord");
}

function onNewDay(s: GameState, rng: Rng) {
  const day = dayOf(s.time);
  const dayStart = (day - 1) * DAY;
  const wd = weekdayIdx(s.time);
  s.stats.daysAlive++;
  s.today = { day, earned: 0, socials: 0 };
  rollWishes(s, rng);

  if (s.job) {
    const career = CAREER[s.job.career];
    const yesterday = (wd + 6) % 7;
    if (s.job.lastShiftDay < day - 1 && !career.off.includes(yesterday) && !s.sick) {
      s.job.performance = clamp(s.job.performance - 15);
      log(s, "You missed your shift yesterday. Your boss noticed (performance −15).", "bad");
      if (s.job.performance <= 0) fire(s);
    }
  }

  if (day > s.rentPaidThroughDay) weekly(s, rng);
  if (wd === 6) resolveElection(s, rng);

  if (s.bank.savings > 0) s.bank.savings = Math.round(s.bank.savings * (1 + BANK.mmfDaily));
  if (s.bank.bond && day >= s.bank.bond.matures) {
    const payout = Math.round(s.bank.bond.amount * (1 + BANK.bondReturn));
    earn(s, payout);
    log(s, `📈 Your infrastructure bond matured: KSh ${payout.toLocaleString()}.`, "good");
    s.bank.bond = null;
  }

  if (rng() < 0.3) {
    const start = dayStart + Math.floor(8 + rng() * 13) * 60;
    const end = start + Math.floor(2 + rng() * 5) * 60;
    s.blackout = { start, end };
    log(s, `⚡ KPLC notice: power interruption in ${estateOf(s).name}, ${clock(start)}–${clock(end)}.`, "event");
  }
  if (rng() < estateOf(s).water * (s.policies.includes("bowsers") ? 0.5 : 1)) {
    const start = dayStart + Math.floor(5 + rng() * 10) * 60;
    const end = start + Math.floor(8 + rng() * 16) * 60;
    s.waterCut = { start, end };
    log(s, `🚱 Water rationing in ${estateOf(s).name} from ${clock(start)} for ${Math.round((end - start) / 60)} hours.`, "event");
  }

  if (s.sick && s.time >= s.sick.until) {
    log(s, `You've recovered from ${SICKNESS[s.sick.id].name.toLowerCase()}.`, "good");
    s.sick = null;
    addMoodlet(s, "recovering");
  } else if (!s.sick) {
    const chance = 0.015 + (s.needs.hygiene < 25 ? 0.05 : 0) + (s.needs.hunger < 20 ? 0.04 : 0);
    if (rng() < chance) makeSick(s, s.needs.hygiene < 15 && rng() < 0.5 ? "typhoid" : "flu");
  }

  for (const r of Object.values(s.relationships)) {
    if (!r.bae && !r.married && r.rel > 30) r.rel -= 1;
    if (r.married && rng() < 0.5) addMoodlet(s, "warmHug");
  }

  if (rng() < 0.35) triggerEvent(s, "daily", rng);
}

export function makeSick(s: GameState, id: string) {
  const def = SICKNESS[id] ?? SICKNESSES[0];
  s.sick = { id: def.id, until: s.time + def.days * DAY };
  addMoodlet(s, def.serious ? "verySick" : "sick");
  log(s, `${def.emoji} You've come down with ${def.name.toLowerCase()}. ${def.blurb}`, "bad");
}

export function fire(s: GameState) {
  if (!s.job) return;
  log(s, `📦 You've been fired from ${CAREER[s.job.career].name}. Pack your things.`, "bad");
  s.job = null;
  addMoodlet(s, "fired");
}

/** Bodily emergencies after time passes. */
export function checkBody(s: GameState, rng: Rng) {
  if (s.needs.bladder <= 0) {
    s.needs.bladder = 100;
    s.needs.hygiene = 0;
    addMoodlet(s, "embarrassed");
    log(s, "🙈 You couldn't hold it any longer. Aibu! Find a washroom next time.", "bad");
  }
  if (s.needs.energy <= 0) {
    log(s, "You collapsed from exhaustion. A kind stranger got you home in a cab (KSh 800).", "bad");
    pay(s, Math.max(0, Math.min(800, s.money + fulizaLimit(s))));
    s.location = "home";
    advance(s, 10 * 60, rng, true);
    s.needs.energy = 70;
  }
}

// ---------------------------------------------------------------------------
// Wishes, goals and the lifetime dream

export interface Done {
  action?: string;
  tags?: string[];
  venue?: string;
  area?: string;
  social?: boolean;
  job?: boolean;
  buy?: boolean;
}

type Match = { action?: string; tag?: string; venue?: string; area?: string; social?: boolean; earned?: number; job?: boolean; buy?: boolean };

/** Wishes need three socials in a day; onboarding goals need just one. */
function matches(s: GameState, m: Match, d: Done, socialsNeeded: number) {
  if (m.earned !== undefined) return s.today.earned >= m.earned;
  if (m.social) return !!d.social && s.today.socials >= socialsNeeded;
  if (m.job) return !!d.job;
  if (m.buy) return !!d.buy;
  if (m.action) return m.action === d.action;
  if (m.tag) return !!d.tags?.includes(m.tag);
  if (m.venue) return m.venue === d.venue;
  if (m.area) return m.area === d.area;
  return false;
}

export function progress(s: GameState, d: Done) {
  if (d.venue) d.area ??= VENUE[d.venue]?.area;
  for (const id of s.wishes.ids) {
    const w = WISH[id];
    if (!w || s.wishes.done.includes(id) || !matches(s, w.match, d, 3)) continue;
    s.wishes.done.push(id);
    grantWish(s, w.label, w.vibes);
  }
  for (const g of GOALS) {
    if (s.goalsDone.includes(g.id)) continue;
    if (matches(s, g.match as Match, d, 1)) {
      s.goalsDone.push(g.id);
      s.vibes += 1;
      log(s, `✅ Goal done: ${g.label} (+1 ✨)`, "good");
    }
  }
  const dream = ASPIRATION[s.player.aspirationId];
  if (dream && !s.goalsDone.includes("dream") && dream.progress(s) >= 1) {
    s.goalsDone.push("dream");
    s.vibes += 20;
    addMoodlet(s, "dream");
    log(s, `🏆 Lifetime dream achieved: ${dream.label}! Kanairo imekuona. +20 ✨`, "event");
  }
}

function grantWish(s: GameState, label: string, vibes: number) {
  s.vibes += vibes;
  addMoodlet(s, "wishDone");
  log(s, `✨ Wish granted: ${label} (+${vibes} ✨)`, "good");
}

export const areaName = (id: string) => AREA[id]?.name ?? id;
