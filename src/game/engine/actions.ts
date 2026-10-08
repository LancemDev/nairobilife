import {
  ADMIT_COST,
  CAREERS,
  CHEMIST_COST,
  CLASSES_TO_GRADUATE,
  CLINIC_COST,
  COURSE,
  COURSES,
  OFFICES,
  RECIPES,
  SHA_COVER,
  VENUE,
  WORK_TONES,
} from "../data";
import type { ActionDef, ActionView, GameState, Rng, SkillKey } from "../types";
import {
  addMoodlet,
  addNeeds,
  advance,
  canAfford,
  checkBody,
  clamp,
  dayOf,
  earn,
  estateOf,
  fire,
  gainSkill,
  has,
  hasPower,
  hasReward,
  hasWater,
  hourOf,
  inHours,
  isBlackout,
  isWeekend,
  log,
  makeSick,
  mood,
  pay,
  price,
  progress,
  sickness,
  traits,
  weekdayIdx,
  type Done,
} from "./core";

import { airportActions } from "./flights";

export type ActionImpl = ActionView & { run: (s: GameState, rng: Rng) => Done | void };

const fmtHour = (h: number) => `${h}:00`;

function tagFun(s: GameState, tags: string[] = []) {
  let fun = 0;
  for (const t of traits(s)) for (const tag of tags) fun += t.tagFun?.[tag] ?? 0;
  return fun;
}

function blockedBy(s: GameState, a: ActionDef): string | undefined {
  const r = a.req;
  if (a.open && !inHours(hourOf(s.time), a.open)) return `Open ${fmtHour(a.open[0])}–${fmtHour(a.open[1])}`;
  if (!r) return;
  if (r.weekend && !isWeekend(s.time)) return "Weekends only";
  if (r.object && !has(s, r.object)) return "You need the right item at home";
  if (r.degree && !s.study?.graduated) return "Needs a degree";
  if (r.power && !hasPower(s)) return "Blackout. No power";
  if (r.water && !hasWater(s)) return "Maji hakuna";
  if (r.healthy && s.sick) return "You're sick";
}

function fromDef(s: GameState, a: ActionDef, section?: string): ActionImpl {
  const genFuel = needsPower(a) && isBlackout(s) && !has(s, "solar") && has(s, "generator") ? 100 : 0;
  const cost = price(s, a.cost ?? 0) + genFuel;
  const blocked = blockedBy(s, a) ?? (!canAfford(s, cost) ? "Can't afford" : undefined);
  const earnHint = a.earn ? `Earn ~KSh ${Math.round(a.earn.base + s.skills[a.earn.skill] * a.earn.per).toLocaleString()}` : undefined;
  return {
    id: a.id,
    label: a.label,
    emoji: a.emoji,
    minutes: a.minutes,
    cost,
    section,
    detail: a.crime ? `Risky: ${Math.round(a.crime.catch * 100)}% chance the karao catch you.` : (earnHint ?? a.text),
    disabled: blocked,
    run: (d, rng) => {
      pay(d, cost);
      advance(d, a.minutes, rng, !!a.sleep);
      const festival = d.policies.includes("festival") && a.tags?.includes("party") ? 1.2 : 1;
      addNeeds(d, a.needs, festival);
      const extraFun = tagFun(d, a.tags);
      if (extraFun) addNeeds(d, { fun: extraFun });
      for (const [k, v] of Object.entries(a.skills ?? {})) gainSkill(d, k as SkillKey, v);
      if (a.moodlet) addMoodlet(d, a.moodlet);
      let text = a.text;
      if (a.earn) {
        const fund = d.policies.includes("hustleFund") ? 1.2 : 1;
        const amount = Math.round((a.earn.base + d.skills[a.earn.skill] * a.earn.per) * (0.7 + rng() * 0.6) * fund);
        earn(d, amount);
        text += ` You made KSh ${amount.toLocaleString()}.`;
      }
      if (a.risk && rng() < a.risk.chance && !d.sick) makeSick(d, a.risk.sickness);
      for (const roll of a.rolls ?? []) {
        if (rng() < roll.chance + (roll.skill ? d.skills[roll.skill] / 200 : 0)) {
          text += ` ${roll.text}`;
          if (roll.moodlet) addMoodlet(d, roll.moodlet);
          if (roll.money) earn(d, roll.money);
          addNeeds(d, roll.needs);
          break;
        }
      }
      if (a.crime) {
        if (rng() < a.crime.catch) {
          arrest(d, a.crime.fine, a.label.toLowerCase());
          return { action: a.id, tags: a.tags, venue: d.location };
        }
        if (a.crime.reward) {
          const loot = Math.round(a.crime.reward[0] + rng() * (a.crime.reward[1] - a.crime.reward[0]));
          d.money += loot;
          text += ` You got away with KSh ${loot.toLocaleString()}.`;
        }
        addMoodlet(d, "gotAway");
      }
      log(d, `${a.emoji} ${text}`, a.earn ? "good" : "info");
      if (a.goTo) {
        d.location = a.goTo;
        log(d, `📍 You've arrived at ${VENUE[a.goTo].name}.`);
      }
      return { action: a.id, tags: a.tags, venue: d.location };
    },
  };
}

function needsPower(a: ActionDef) {
  return !!a.req?.power;
}

export function arrest(s: GameState, fine: number, charge: string) {
  const bribe = Math.round(fine / 4);
  addMoodlet(s, "arrested");
  s.event = {
    id: "arrest",
    title: "Arrested!",
    text: `"Wewe! Kuja hapa." Two karao grab your arm. The charge: ${charge}.`,
    choices: [
      { label: `Pay the fine (KSh ${fine.toLocaleString()})`, result: "You pay and walk out. Expensive lesson.", effect: { money: -fine } },
      {
        label: `"Kitu kidogo?" (KSh ${bribe.toLocaleString()})`,
        odds: { base: 0.45, skill: "charm" },
        result: "The officer pockets it and looks the other way. You feel dirty.",
        effect: { money: -bribe, moodlet: "guilty" },
        fail: { result: "Wrong officer. Now it's bribery too: a bigger fine and a night in the cells.", effect: { money: -Math.round(fine * 1.5), minutes: 480, needs: { hygiene: -30, fun: -20 } } },
      },
      {
        label: "Call a lawyer (KSh 5,000)",
        odds: { base: hasReward(s, "goodLawyer") ? 0.8 : 0.55 },
        result: "Your lawyer gets the case thrown out. \"Hakuna ushahidi.\"",
        effect: { money: -5000 },
        fail: { result: "Even the lawyer couldn't help. Fine paid on top of fees.", effect: { money: -(5000 + fine) } },
      },
      { label: "Sit in the cell", result: "Eight hours on a cold floor. Released with a warning.", effect: { minutes: 480, needs: { hygiene: -30, fun: -20, social: -10 } } },
    ],
  };
  log(s, `🚓 Arrested for ${charge}.`, "bad");
}

// ---------------------------------------------------------------------------
// Home

const HOME_OBJECT_ACTIONS: (ActionDef & { obj: string })[] = [
  { obj: "tv", id: "tv", label: "Watch TV", emoji: "📺", minutes: 90, needs: { fun: 15, energy: 3 }, req: { power: true }, tags: ["tv", "relax"], text: "Local news, then a telenovela you swore you'd stopped watching." },
  { obj: "bigTv", id: "bigTvWatch", label: "Watch the big screen", emoji: "📺", minutes: 120, needs: { fun: 25, energy: 3, social: 5 }, req: { power: true }, tags: ["tv", "relax"], text: "EPL in 4K. You can see the sweat." },
  { obj: "radio", id: "radio", label: "Listen to the radio", emoji: "📻", minutes: 60, needs: { fun: 8 }, skills: { music: 0.5 }, tags: ["music", "relax"], text: "Morning show gossip, then lingala." },
  { obj: "console", id: "fifa", label: "Play FIFA", emoji: "🎮", minutes: 90, needs: { fun: 25 }, req: { power: true }, tags: ["relax"], text: "You lost to the computer on easy. Rematch." },
  { obj: "speaker", id: "danceHome", label: "Dance in the living room", emoji: "🔊", minutes: 45, needs: { fun: 15, energy: -8 }, skills: { dance: 2 }, req: { power: true }, tags: ["dance"], text: "The neighbours bang on the wall. You keep going." },
  { obj: "bookshelf", id: "read", label: "Read a book", emoji: "📖", minutes: 90, needs: { fun: 8 }, skills: { tech: 1.5, charm: 0.5 }, tags: ["study"], text: "Three chapters in and you feel smarter." },
  { obj: "laptop", id: "code", label: "Code a side project", emoji: "💻", minutes: 120, needs: { fun: -3, energy: -5 }, skills: { tech: 3 }, req: { power: true }, tags: ["study"], text: "Your startup idea now has a login page." },
  { obj: "laptop", id: "freelanceHome", label: "Freelance from home", emoji: "🧑🏾‍💻", minutes: 240, needs: { energy: -10, fun: -5 }, skills: { tech: 1 }, earn: { base: 400, skill: "tech", per: 50 }, req: { power: true }, tags: ["gig"], text: "Upwork client, tight deadline." },
  { obj: "guitar", id: "guitar", label: "Practise guitar", emoji: "🎸", minutes: 60, needs: { fun: 8 }, skills: { music: 3 }, tags: ["music"], text: "Your fingers hurt. The song is coming together." },
  { obj: "dumbbells", id: "homeWorkout", label: "Home workout", emoji: "🏋🏾", minutes: 45, needs: { energy: -10, hygiene: -10 }, skills: { fitness: 2 }, moodlet: "pumped", tags: ["workout"], text: "Push-ups, curls, regret." },
  { obj: "mirror", id: "mirror", label: "Practise jokes in the mirror", emoji: "🪞", minutes: 30, needs: { fun: 4 }, skills: { comedy: 2, charm: 1 }, text: "You laugh at your own jokes. That counts." },
  { obj: "ringLight", id: "contentHome", label: "Film content at home", emoji: "💡", minutes: 90, needs: { fun: 8 }, skills: { photography: 2 }, req: { power: true }, rolls: [{ chance: 0.05, skill: "photography", text: "It went viral!", moodlet: "viral" }], tags: ["dance"], text: "Seventeen takes of a ten-second video." },
  { obj: "camera", id: "photoWalk", label: "Edit your photos", emoji: "📷", minutes: 90, needs: { fun: 10 }, skills: { photography: 4 }, req: { power: true }, text: "Lightroom presets and big dreams." },
  { obj: "dog", id: "dog", label: "Play with Simba", emoji: "🐕", minutes: 30, needs: { fun: 12, social: 10 }, tags: ["relax"], text: "He brings you a slipper. Not yours." },
  { obj: "sofa", id: "sofa", label: "Chill on the sofa", emoji: "🛋️", minutes: 60, needs: { energy: 8, fun: 6 }, tags: ["relax"], text: "Feet up. Phone out. Bliss." },
  { obj: "bigSofa", id: "bigSofaChill", label: "Sink into the sectional", emoji: "🛋️", minutes: 60, needs: { energy: 12, fun: 10 }, tags: ["relax"], text: "You may never get up." },
  { obj: "jacuzzi", id: "jacuzzi", label: "Soak in the jacuzzi", emoji: "🛁", minutes: 60, needs: { fun: 25, hygiene: 30, energy: 10 }, req: { power: true, water: true }, tags: ["relax"], text: "Bubbles. Peace. Success." },
  { obj: "homeCinema", id: "cinema", label: "Movie night at home", emoji: "🎬", minutes: 150, needs: { fun: 40, social: 5 }, req: { power: true }, tags: ["movie"], text: "Why go to Two Rivers?" },
  { obj: "poolTable", id: "pool", label: "Play pool", emoji: "🎱", minutes: 60, needs: { fun: 20, social: 5 }, skills: { hustle: 1 }, text: "You hustle yourself. You lose." },
];

const bedQuality = (s: GameState) => (has(s, "kingBed") ? 1.25 : has(s, "springBed") ? 1 : has(s, "mattress") ? 0.8 : 0.6);

function homeActions(s: GameState): ActionImpl[] {
  const list: ActionImpl[] = [];
  const q = bedQuality(s);
  const noise = estateOf(s).noise;
  list.push({
    id: "sleep", label: "Sleep", emoji: "😴", minutes: 480, cost: 0, section: "Home",
    detail: q < 1 ? "On the floor-ish. You won't sleep great." : "Restores energy. You still get hungry.",
    run: (d, rng) => {
      advance(d, 480, rng, true);
      const boost = 90 * q * (hasReward(d, "powerNap") ? 1.3 : 1) - (rng() < 0.6 ? noise : 0);
      d.needs.energy = clamp(d.needs.energy + boost);
      addMoodlet(d, boost >= 85 ? "sleptWell" : noise >= 10 ? "sleptBad" : "sleptWell");
      log(d, `😴 You slept for 8 hours${boost < 85 && noise >= 10 ? ". The neighbours played music till 2am" : ""}.`);
      return { action: "sleep", tags: ["relax"] };
    },
  });
  list.push(fromDef(s, { id: "nap", label: "Quick nap", emoji: "🛌🏾", minutes: 90, needs: { energy: Math.round(20 * q) }, tags: ["relax"], text: "A short nap. Better." }, "Home"));
  list.push(fromDef(s, has(s, "toilet")
    ? { id: "toiletHome", label: "Use the toilet", emoji: "🚽", minutes: 5, needs: { bladder: 100 }, text: "Your own toilet. Luxury." }
    : { id: "toiletHome", label: "Plot toilet down the corridor", emoji: "🚪", minutes: 12, needs: { bladder: 100, hygiene: -3 }, text: "There was a queue." }, "Home"));
  const shower = has(s, "shower") && hasPower(s);
  list.push(fromDef(s, shower
    ? { id: "shower", label: "Hot shower", emoji: "🚿", minutes: 20, needs: { hygiene: 80 }, moodlet: "fresh", req: { water: true }, text: "Hot water, actually hot." }
    : { id: "shower", label: has(s, "bucket") ? "Bucket bath" : "Wash with a jerrycan", emoji: "🪣", minutes: 25, needs: { hygiene: has(s, "bucket") ? 60 : 45 }, moodlet: "fresh", req: { water: true }, text: "Cold water, quick scrub. Fresh enough." }, "Home"));

  for (const o of HOME_OBJECT_ACTIONS) if (has(s, o.obj)) list.push(fromDef(s, o, "Home"));

  const cooker = has(s, "gasCooker") ? "gas" : has(s, "jiko") ? "jiko" : null;
  for (const r of RECIPES) {
    const missing = Object.keys(r.needs).filter((g) => (s.pantry[g] ?? 0) < r.needs[g]);
    const minutes = Math.round(r.minutes * (cooker === "jiko" ? 1.3 : 1));
    list.push({
      id: `cook:${r.id}`, label: `Cook ${r.name}`, emoji: r.emoji, minutes, cost: 0, section: "Kitchen",
      detail: missing.length ? `Missing: ${missing.join(", ")}` : `Uses ${Object.keys(r.needs).join(", ")}.`,
      disabled: !cooker ? "You need a jiko or cooker" : missing.length ? "Missing ingredients" : undefined,
      run: (d, rng) => {
        for (const [g, n] of Object.entries(r.needs)) d.pantry[g] = (d.pantry[g] ?? 0) - n;
        advance(d, minutes, rng);
        const burnt = d.skills.cooking < r.cooking && rng() < (r.cooking - d.skills.cooking) / 40;
        const quality = (burnt ? 0.5 : 0.8 + d.skills.cooking / 250) * (cooker === "gas" ? 1 : 0.9);
        addNeeds(d, { hunger: r.hunger * quality, fun: r.fun * quality + tagFun(d, ["cook", "eat"]) });
        gainSkill(d, "cooking", burnt ? 2 : 1.5);
        addMoodlet(d, "homeCooked");
        log(d, burnt ? `${r.emoji} You burnt the ${r.name.toLowerCase()}. Edible. Mostly.` : `${r.emoji} You cooked ${r.name.toLowerCase()}. Nyumbani ni nyumbani.`);
        return { action: `cook:${r.id}`, tags: ["cook", "eat"] };
      },
    });
  }

  if (s.sick) {
    const sick = sickness(s)!;
    const cost = price(s, CHEMIST_COST);
    list.push({
      id: "chemist", label: "Get meds from the chemist", emoji: "💊", minutes: 30, cost, section: "Mtaa",
      detail: sick.serious ? "Won't cure something this serious. Go to KNH." : "Usually sorts out mild stuff.",
      disabled: canAfford(s, cost) ? undefined : "Can't afford",
      run: (d, rng) => {
        pay(d, cost);
        advance(d, 30, rng);
        if (!sick.serious && rng() < 0.75) {
          d.sick = null;
          addMoodlet(d, "recovering");
          log(d, "💊 Panadol, rest and lemon tea. You feel better already.", "good");
        } else log(d, "💊 The meds take the edge off, but you're still sick.", "bad");
      },
    });
  }

  for (const a of estateOf(s).actions) list.push(fromDef(s, a, "Mtaa"));

  if (s.arrears > 0)
    list.push({
      id: "arrears", label: "Pay rent arrears", emoji: "🧾", minutes: 10, cost: s.arrears, section: "Home", detail: "Keep the landlord off your back.",
      disabled: canAfford(s, s.arrears) ? undefined : "Can't afford",
      run: (d) => {
        pay(d, d.arrears);
        log(d, `🧾 Cleared rent arrears of KSh ${d.arrears.toLocaleString()}.`, "good");
        d.arrears = 0;
      },
    });
  return list;
}

// ---------------------------------------------------------------------------
// Work

function missingReq(s: GameState, req: Partial<Record<SkillKey, number>>, degree?: boolean) {
  const parts = Object.entries(req).filter(([k, v]) => s.skills[k as SkillKey] < v!).map(([k, v]) => `${k} ${v}`);
  if (degree && !s.study?.graduated) parts.push("a degree");
  return parts.join(", ");
}

function jobActions(s: GameState): ActionImpl[] {
  const list: ActionImpl[] = [];
  const today = dayOf(s.time);
  for (const c of CAREERS.filter((c) => c.venue === s.location)) {
    if (s.job?.career === c.id) {
      const level = c.levels[s.job.level];
      const tone = WORK_TONES.find((t) => t.id === s.job!.tone) ?? WORK_TONES[0];
      const off = c.off.includes(weekdayIdx(s.time));
      list.push({
        id: `work:${c.id}`, label: `Work: ${level.title}`, emoji: tone.emoji, minutes: c.shiftHours * 60, cost: 0, section: "Work",
        detail: `KSh ${level.pay.toLocaleString()} · ${tone.label}: ${tone.desc}`,
        disabled: off ? "Day off" : s.job.lastShiftDay === today ? "Done for today. Back tomorrow" : !inHours(hourOf(s.time), c.start) ? `Shift starts ${fmtHour(c.start[0])}–${fmtHour(c.start[1])}` : sickness(s)?.serious ? "Too sick to work" : undefined,
        run: (d, rng) => work(d, rng),
      });
    } else {
      const entry = c.levels[0];
      const missing = missingReq(s, entry.req, entry.degree);
      list.push({
        id: `apply:${c.id}`, label: `Apply: ${entry.title}`, emoji: "📝", minutes: 60, cost: 0, section: "Work",
        detail: `${c.name}. KSh ${entry.pay.toLocaleString()}/shift.${s.job ? " You'll quit your current job." : ""}`,
        disabled: missing ? `Needs ${missing}` : undefined,
        run: (d, rng) => {
          advance(d, 60, rng);
          d.job = { career: c.id, level: 0, performance: 20, lastShiftDay: today, tone: "normal" };
          log(d, `📝 You got the job: ${entry.title}! First shift tomorrow.`, "good");
          return { job: true };
        },
      });
    }
  }
  return list;
}

function work(s: GameState, rng: Rng): Done {
  const job = s.job!;
  const c = CAREERS.find((x) => x.id === job.career)!;
  const level = c.levels[job.level];
  const day = dayOf(s.time);
  const focus = 0.5 + (mood(s) / 100) * 0.7;
  advance(s, c.shiftHours * 60, rng);
  addNeeds(s, { energy: -15, fun: -5, hygiene: -10 });

  let toneMult = 1;
  switch (job.tone) {
    case "hard":
      toneMult = 1.5;
      addNeeds(s, { energy: -12, fun: -8 });
      break;
    case "gist":
      toneMult = 0.6;
      addNeeds(s, { social: 25, fun: 5 });
      break;
    case "suckUp":
      if (rng() < 0.4 + s.skills.charm / 200) toneMult = 1.8;
      else {
        toneMult = 0.3;
        addMoodlet(s, "embarrassed");
      }
      break;
    case "chill":
      toneMult = 0.4;
      addNeeds(s, { energy: 12 });
      break;
  }
  const traitWork = 1 + traits(s).reduce((n, t) => n + (t.work ?? 0), 0);
  const juice = hasReward(s, "hustleJuice") ? 1.25 : 1;
  const gain = Math.round((8 + s.skills[c.skill] / 10) * focus * toneMult * traitWork * juice);
  gainSkill(s, c.skill, 1);
  earn(s, level.pay);
  s.stats.shifts++;
  job.lastShiftDay = day;
  job.performance = clamp(job.performance + gain - (job.tone === "chill" ? 6 : 0));
  log(s, `💼 Shift done as ${level.title}. +KSh ${level.pay.toLocaleString()}, performance ${gain >= 0 ? "+" : ""}${gain}${focus < 0.8 ? " (you were distracted, look after yourself)" : ""}.`, "good");

  if (job.performance <= 0) fire(s);
  const next = c.levels[job.level + 1];
  if (s.job && job.performance >= 100 && next) {
    const missing = missingReq(s, next.req, next.degree);
    if (missing) {
      if (job.performance - gain < 100) log(s, `Your boss wants to promote you to ${next.title}, but you need ${missing}.`, "event");
    } else {
      job.level++;
      job.performance = 30;
      s.stats.promotions++;
      addMoodlet(s, "promoted");
      log(s, `🎉 Promoted to ${next.title}! New pay: KSh ${next.pay.toLocaleString()}/shift.`, "good");
    }
  }
  return { action: `work:${c.id}`, tags: ["work"], venue: c.venue };
}

// ---------------------------------------------------------------------------
// Special venues

function campusActions(s: GameState): ActionImpl[] {
  if (!s.study)
    return COURSES.map((c) => {
      const cost = c.fees;
      return {
        id: `enrol:${c.id}`, label: `Enrol: ${c.name}`, emoji: "📝", minutes: 60, cost, section: "Campus",
        detail: `${CLASSES_TO_GRADUATE} classes to graduate. Builds ${c.skill}.`,
        disabled: canAfford(s, cost) ? undefined : "Can't afford fees",
        run: (d, rng) => {
          pay(d, cost);
          advance(d, 60, rng);
          d.study = { course: c.id, classes: 0, graduated: false };
          log(d, `🎓 You're now a UoN student: ${c.name}. Comrade power!`, "good");
        },
      };
    });
  if (s.study.graduated) return [];
  const course = COURSE[s.study.course];
  return [{
    id: "lecture", label: `Attend class: ${course.name}`, emoji: "🧑🏾‍🏫", minutes: 180, cost: 0, section: "Campus",
    detail: `${s.study.classes}/${CLASSES_TO_GRADUATE} classes done.`,
    disabled: isWeekend(s.time) ? "No classes on weekends" : !inHours(hourOf(s.time), [8, 17]) ? "Classes run 8:00–17:00" : undefined,
    run: (d, rng) => {
      advance(d, 180, rng);
      addNeeds(d, { energy: -10, fun: -5, social: 10 });
      gainSkill(d, course.skill, 3);
      gainSkill(d, "tech", 0.5);
      d.study!.classes++;
      if (d.study!.classes >= CLASSES_TO_GRADUATE) {
        d.study!.graduated = true;
        addMoodlet(d, "graduated");
        log(d, `🎓 You graduated with a ${course.name}! Mum is crying at the ceremony.`, "good");
      } else log(d, `🧑🏾‍🏫 Lecture done. ${CLASSES_TO_GRADUATE - d.study!.classes} classes to go.`);
      return { action: "lecture", tags: ["study"], venue: "uon" };
    },
  }];
}

function hospitalActions(s: GameState): ActionImpl[] {
  const list: ActionImpl[] = [];
  const cover = s.insured ? 1 - SHA_COVER : 1;
  const sick = sickness(s);
  if (sick) {
    const clinic = Math.round(CLINIC_COST * cover);
    list.push({
      id: "doctor", label: "See a doctor", emoji: "🩺", minutes: 120, cost: clinic, section: "Hospital",
      detail: sick.serious ? "They'll probably admit you." : "Prescription and rest.",
      disabled: canAfford(s, clinic) ? undefined : "Can't afford",
      run: (d, rng) => {
        pay(d, clinic);
        advance(d, 120, rng);
        if (!sick.serious) {
          d.sick = null;
          addMoodlet(d, "recovering");
          log(d, "🩺 The doctor sorts you out. Rest and fluids.", "good");
        } else log(d, `🩺 It's ${sick.name.toLowerCase()}. The doctor recommends admission.`, "bad");
      },
    });
    if (sick.serious) {
      const admit = Math.round(ADMIT_COST * cover);
      list.push({
        id: "admit", label: "Get admitted", emoji: "🛏️", minutes: 1440, cost: admit, section: "Hospital",
        detail: "A day on a drip. You'll walk out cured.",
        disabled: canAfford(s, admit) ? undefined : "Can't afford",
        run: (d, rng) => {
          pay(d, admit);
          advance(d, 1440, rng, true);
          d.needs.energy = 80;
          d.needs.hunger = Math.max(d.needs.hunger, 50);
          d.sick = null;
          addMoodlet(d, "recovering");
          log(d, "🏥 Discharged after a day on a drip. Achieng the nurse says: \"Usirudi hapa.\"", "good");
        },
      });
    }
  }
  if (!s.insured)
    list.push({
      id: "sha", label: "Register for SHA cover", emoji: "🪪", minutes: 30, cost: 0, section: "Hospital",
      detail: "KSh 300/week. 80% off doctor and admission bills.",
      run: (d, rng) => {
        advance(d, 30, rng);
        d.insured = true;
        log(d, "🪪 You're now covered by SHA.", "good");
      },
    });
  return list;
}

function politicsActions(s: GameState): ActionImpl[] {
  const list: ActionImpl[] = [];
  if (!s.voter)
    list.push({
      id: "registerVoter", label: "Register as a voter (Niko Kadi!)", emoji: "🗳️", minutes: 45, cost: 0, section: "Siasa", detail: "Join the Gen Z wave.",
      run: (d, rng) => {
        advance(d, 45, rng);
        d.voter = true;
        addMoodlet(d, "voted");
        log(d, "🗳️ Niko kadi! You're registered to vote.", "good");
      },
    });
  const currentIdx = s.office ? OFFICES.findIndex((o) => o.id === s.office!.id) : -1;
  const next = OFFICES[currentIdx + 1];
  if (!s.campaign && next) {
    const fee = next.runFee;
    list.push({
      id: "runOffice", label: `Run for ${next.title}`, emoji: "📣", minutes: 60, cost: fee, section: "Siasa",
      detail: `Nomination fee. Election on Saturday night. Needs charm ${next.charm}.`,
      disabled: s.skills.charm < next.charm ? `Needs charm ${next.charm}` : canAfford(s, fee) ? undefined : "Can't afford",
      run: (d, rng) => {
        pay(d, fee);
        advance(d, 60, rng);
        d.campaign = { office: next.id, spent: 0 };
        log(d, `📣 You're running for ${next.title}! Hold rallies and spend on the campaign before Saturday.`, "event");
      },
    });
  }
  if (s.campaign) {
    const office = OFFICES.find((o) => o.id === s.campaign!.office)!;
    const cost = Math.round(office.campaign / 10);
    list.push({
      id: "rally", label: "Hold a rally", emoji: "📢", minutes: 180, cost, section: "Siasa",
      detail: `Campaign spend ${Math.round((s.campaign.spent / office.campaign) * 100)}% of what you need.`,
      disabled: canAfford(s, cost) ? undefined : "Can't afford",
      run: (d, rng) => {
        pay(d, cost);
        advance(d, 180, rng);
        d.campaign!.spent += cost;
        addNeeds(d, { energy: -15, social: 30 });
        gainSkill(d, "charm", 2);
        log(d, "📢 Branded t-shirts, a truck with speakers, a crowd chanting your name.");
      },
    });
  }
  return list;
}

// ---------------------------------------------------------------------------
// Public API

export function actionsFor(s: GameState): ActionImpl[] {
  if (s.location === "home") return homeActions(s);
  const venue = VENUE[s.location];
  const list = [...jobActions(s), ...venue.actions.map((a) => fromDef(s, a))];
  if (s.location === "uon") list.push(...campusActions(s));
  if (s.location === "knh") list.push(...hospitalActions(s));
  if (s.location === "kicc") list.push(...politicsActions(s));
  list.push(...airportActions(s));
  return list;
}

export function availableActions(s: GameState): ActionView[] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- strip the closure before handing views to React
  return actionsFor(s).map(({ run, ...view }) => view);
}

export function doAction(state: GameState, actionId: string, rng: Rng = Math.random): GameState {
  if (state.event) return state;
  const action = actionsFor(state).find((a) => a.id === actionId);
  if (!action || action.disabled) return state;
  const s = structuredClone(state);
  const done = action.run(s, rng) ?? { action: action.id };
  checkBody(s, rng);
  progress(s, { venue: s.location === "home" ? undefined : s.location, ...done });
  return s;
}
