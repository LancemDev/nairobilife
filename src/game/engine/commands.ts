import {
  BANK,
  BIRTH_LOTTERY,
  BUSINESS,
  BUSINESS_RESALE,
  CAR,
  CAR_RESALE,
  DATE_COST,
  DELIVERY_FEE,
  DELIVERY_MENU,
  DERBY_ODDS,
  ESTATE,
  GROCERY,
  LAND_SEARCH_FEE,
  LAND_SELL_FEE,
  MAMA_MBOGA,
  NPC,
  OBJECT,
  OFFICES,
  ORIGIN,
  PLOT,
  REWARD,
  RING_COST,
  SOCIAL,
  SUPERMARKET_VENUES,
  UNIT,
  WEDDING_TIERS,
  WISHES,
  WORK_TONES,
} from "../data";
import type { GameState, Player, Rng, TravelMode } from "../types";
import { doAction } from "./actions";
import {
  addMoodlet,
  addNeeds,
  addRel,
  advance,
  applyEffect,
  bae,
  canAfford,
  canChoose,
  checkBody,
  dayOf,
  earn,
  gainSkill,
  isWeekend,
  log,
  npcsHere,
  pay,
  price,
  progress,
  traits,
  unitOf,
  weeklyRent,
  hasReward,
  mood,
} from "./core";
import { travel } from "./travel";

export type GroceryChannel = "mamaMboga" | "supermarket" | "delivery";

export type Command =
  | { type: "act"; id: string }
  | { type: "travel"; dest: string; mode: TravelMode }
  | { type: "choose"; index: number }
  | { type: "social"; npc: string; social: string }
  | { type: "call"; npc: string }
  | { type: "date"; npc: string }
  | { type: "propose"; npc: string }
  | { type: "wedding"; tier: string }
  | { type: "breakUp"; npc: string }
  | { type: "sendMoney"; npc: string; amount: number }
  | { type: "buyObject"; id: string }
  | { type: "sellObject"; id: string }
  | { type: "buyGrocery"; id: string; qty: number; channel: GroceryChannel }
  | { type: "orderFood"; id: string }
  | { type: "setTone"; tone: string }
  | { type: "quitJob" }
  | { type: "moveHouse"; estate: string; unit: string }
  | { type: "bank"; op: "deposit" | "withdraw" | "borrow" | "repay" | "bond"; amount: number }
  | { type: "buyBusiness"; id: string }
  | { type: "sellBusiness"; id: string }
  | { type: "buyPlot"; id: string; search: boolean }
  | { type: "sellPlot"; index: number }
  | { type: "buyCar"; id: string }
  | { type: "sellCar"; id: string }
  | { type: "useCar"; id: string | null }
  | { type: "crash"; stake: number; target: number }
  | { type: "derby"; stake: number; pick: keyof typeof DERBY_ODDS }
  | { type: "policy"; id: string }
  | { type: "reward"; id: string }
  /** Online M-Pesa: the server has already accepted these. */
  | { type: "transferOut"; to: string; amount: number }
  | { type: "transferIn"; from: string; amount: number; note: string }
  | { type: "setLook"; look: import("../look").Look };

// ---------------------------------------------------------------------------
// New game

export interface NewLife {
  name: string;
  avatar: string;
  look?: import("../look").Look;
  originId: string;
  lotteryId: string;
  traits: string[];
  aspirationId: string;
}

export function newGame(input: NewLife, rng: Rng = Math.random): GameState {
  const lottery = BIRTH_LOTTERY.find((l) => l.id === input.lotteryId) ?? BIRTH_LOTTERY[1];
  const origin = ORIGIN[input.originId];
  const skills = { hustle: 3, tech: 3, charm: 3, fitness: 3, cooking: 3, music: 2, dance: 2, comedy: 2, photography: 2 };
  for (const bonus of [origin?.skills ?? {}, lottery.skills])
    for (const [k, v] of Object.entries(bonus)) skills[k as keyof typeof skills] += v;
  const player: Player = { ...input, estateId: lottery.estate, unitId: lottery.unit };
  const s: GameState = {
    version: 2,
    player,
    time: 7 * 60,
    money: lottery.money,
    needs: { hunger: 75, energy: 90, bladder: 70, hygiene: 80, fun: 70, social: 60 },
    skills,
    moodlets: [],
    location: "home",
    job: null,
    study: null,
    objects: [...lottery.objects],
    pantry: { unga: 2, sukuma: 2, tomato: 2, tea: 3, milk: 3, sugar: 3, bread: 1 },
    rentPaidThroughDay: 7,
    arrears: 0,
    blackout: null,
    waterCut: null,
    sick: null,
    relationships: {},
    wishes: { day: 1, ids: [], done: [] },
    goalsDone: [],
    vibes: 0,
    rewards: [],
    bank: { savings: 0, loan: 0, bond: null },
    businesses: [],
    plots: [],
    cars: [],
    carId: null,
    office: null,
    policies: [],
    campaign: null,
    voter: false,
    insured: false,
    lastBet: null,
    today: { day: 1, earned: 0, socials: 0 },
    event: null,
    log: [],
    nextLogId: 1,
    stats: { shifts: 0, earned: 0, promotions: 0, daysAlive: 1 },
  };
  const pool = [...WISHES];
  for (let i = 0; i < 3; i++) s.wishes.ids.push(pool.splice(Math.floor(rng() * pool.length), 1)[0].id);
  log(s, `Karibu Kanairo, ${input.name}! ${lottery.label}: ${lottery.desc} First week's rent is paid. Tafuta mboka before next Monday.`, "event");
  return s;
}

// ---------------------------------------------------------------------------
// Helpers


export function socialOdds(s: GameState, socialId: string) {
  const def = SOCIAL[socialId];
  let p = def.chance;
  if (def.skill) p += s.skills[def.skill] / 200;
  p += traits(s).reduce((n, t) => n + (t.social ?? 0), 0);
  if (hasReward(s, "sweetTongue")) p += 0.15;
  if (def.romantic && hasReward(s, "charmer")) p += 0.15;
  if (mood(s) < 30) p -= 0.15;
  return Math.max(0.05, Math.min(0.98, p));
}

export function socialBlocked(s: GameState, npc: string, socialId: string): string | undefined {
  const def = SOCIAL[socialId];
  const r = s.relationships[npc] ?? { rel: 0 };
  if (r.rel < def.minRel) return "Not close enough yet";
  const partner = bae(s);
  if (def.romantic && partner && partner !== npc) return "You're taken";
  if (socialId === "askOut" && (r.bae || r.married)) return "Already together";
  return undefined;
}

const groceryPrice = (s: GameState, id: string, channel: GroceryChannel) => {
  const base = GROCERY[id].price * (channel === "delivery" ? 1.15 : channel === "mamaMboga" ? 1 : 0.95) * (s.objects.includes("fridge") ? 0.9 : 1);
  return price(s, base);
};
export const groceryCost = (s: GameState, id: string, qty: number, channel: GroceryChannel) =>
  groceryPrice(s, id, channel) * qty + (channel === "delivery" ? DELIVERY_FEE : 0);
export const groceryChannels = (s: GameState): GroceryChannel[] => [
  ...(s.location === "home" ? (["mamaMboga"] as const) : []),
  ...(SUPERMARKET_VENUES.includes(s.location) ? (["supermarket"] as const) : []),
  "delivery",
];
export const groceriesFor = (channel: GroceryChannel) => (channel === "mamaMboga" ? MAMA_MBOGA : Object.keys(GROCERY));

export const moveCost = (s: GameState, estate: string, unit: string) => weeklyRent(s, estate, unit) + 3000;

export function crashPoint(rng: Rng) {
  const u = rng();
  return Math.min(200, Math.max(1, Math.floor((0.97 / (1 - u)) * 100) / 100));
}

// ---------------------------------------------------------------------------
// Dispatch

export function dispatch(state: GameState, cmd: Command, rng: Rng = Math.random): GameState {
  if (cmd.type === "act") return doAction(state, cmd.id, rng);
  if (cmd.type === "travel") return travel(state, cmd.dest, cmd.mode, rng);
  if (cmd.type === "choose") return choose(state, cmd.index, rng);
  // Server-confirmed money moves and cosmetic changes apply even mid-event.
  if (cmd.type === "transferOut" || cmd.type === "transferIn" || cmd.type === "setLook") {
    const s = structuredClone(state);
    if (cmd.type === "setLook") s.player.look = cmd.look;
    else if (cmd.type === "transferOut") {
      s.money -= cmd.amount;
      log(s, `📲 Sent KSh ${cmd.amount.toLocaleString()} to @${cmd.to}.`);
    } else {
      s.money += cmd.amount;
      log(s, `📲 @${cmd.from} sent you KSh ${cmd.amount.toLocaleString()}${cmd.note ? `: "${cmd.note}"` : ""}.`, "good");
    }
    return s;
  }
  if (state.event) return state;
  const s = structuredClone(state);
  const ok = run(s, cmd, rng);
  if (!ok) return state;
  checkBody(s, rng);
  return s;
}

function choose(state: GameState, index: number, rng: Rng) {
  const choice = state.event?.choices[index];
  if (!choice || !canChoose(state, choice)) return state;
  const s = structuredClone(state);
  const title = s.event!.title;
  s.event = null;
  const success = !choice.odds || rng() < choice.odds.base + (choice.odds.skill ? s.skills[choice.odds.skill] / 200 : 0);
  const outcome = success || !choice.fail ? choice : choice.fail;
  applyEffect(s, outcome.effect, rng);
  log(s, `${title}: ${outcome.result}`, success ? "event" : "bad");
  checkBody(s, rng);
  return s;
}

/** Mutates the draft; returns false when the command isn't allowed. */
function run(s: GameState, cmd: Exclude<Command, { type: "act" | "travel" | "choose" | "transferOut" | "transferIn" | "setLook" }>, rng: Rng): boolean {
  switch (cmd.type) {
    case "social": {
      const def = SOCIAL[cmd.social];
      const npc = NPC[cmd.npc];
      if (!def || !npc || !npcsHere(s).includes(cmd.npc) || socialBlocked(s, cmd.npc, cmd.social)) return false;
      advance(s, def.minutes, rng);
      const r = (s.relationships[cmd.npc] ??= { rel: 0 });
      const success = rng() < socialOdds(s, cmd.social);
      s.today.socials++;
      if (success) {
        addRel(s, cmd.npc, def.rel);
        addNeeds(s, { social: def.social, fun: def.fun ?? 0 });
        if (def.skill) gainSkill(s, def.skill, 0.5);
        if (cmd.social === "askOut") {
          r.bae = true;
          addMoodlet(s, "inLove");
          log(s, `💘 ${npc.name} said yes! You're officially an item.`, "good");
        } else if (def.ask) {
          earn(s, def.ask);
          log(s, `🙏🏾 ${npc.name} sent you KSh ${def.ask.toLocaleString()} on M-Pesa. "Usizoee."`, "good");
        } else {
          if (cmd.social === "hug") addMoodlet(s, "warmHug");
          log(s, `${def.emoji} ${def.label} with ${npc.name}. ${def.rel >= 0 ? "That went well." : "Savage."}`);
        }
      } else {
        addRel(s, cmd.npc, -Math.ceil(Math.abs(def.rel) / 2) - 2);
        addNeeds(s, { social: Math.round(def.social / 3) });
        if (def.romantic) addMoodlet(s, "rejected");
        log(s, `${def.emoji} ${def.label} with ${npc.name}… awkward. ${def.romantic ? "They're not feeling it." : "It didn't land."}`, "bad");
      }
      progress(s, { social: true, tags: ["gist"] });
      return true;
    }
    case "call": {
      const npc = NPC[cmd.npc];
      const r = s.relationships[cmd.npc];
      if (!npc || !r || r.rel < 20) return false;
      advance(s, 20, rng);
      addRel(s, cmd.npc, 3);
      addNeeds(s, { social: 15, fun: 4 });
      s.today.socials++;
      log(s, `📞 Long call with ${npc.name}. ${npc.line}`);
      progress(s, { social: true, tags: ["gist"] });
      return true;
    }
    case "date": {
      const r = s.relationships[cmd.npc];
      const cost = price(s, DATE_COST);
      if (!r || !(r.bae || r.married) || !canAfford(s, cost)) return false;
      pay(s, cost);
      advance(s, 180, rng);
      addRel(s, cmd.npc, 10);
      addNeeds(s, { fun: 25, social: 30, hunger: 30 });
      addMoodlet(s, "dateNight");
      s.today.socials++;
      log(s, `🌹 Date night with ${NPC[cmd.npc].name}: dinner, a walk, too much laughing.`, "good");
      progress(s, { social: true, tags: ["eat"] });
      return true;
    }
    case "propose": {
      const r = s.relationships[cmd.npc];
      if (!r?.bae || r.engaged || r.married || r.rel < 85 || !canAfford(s, RING_COST)) return false;
      pay(s, RING_COST);
      if (rng() < 0.6 + r.rel / 500) {
        r.engaged = true;
        addMoodlet(s, "engaged");
        log(s, `💍 ${NPC[cmd.npc].name} said YES! Time to plan the ruracio.`, "good");
      } else {
        addRel(s, cmd.npc, -10);
        addMoodlet(s, "rejected");
        log(s, `💍 ${NPC[cmd.npc].name} said they're not ready. Ouch.`, "bad");
      }
      return true;
    }
    case "wedding": {
      const tier = WEDDING_TIERS.find((t) => t.id === cmd.tier);
      const entry = Object.entries(s.relationships).find(([, r]) => r.engaged);
      if (!tier || !entry || !canAfford(s, tier.cost)) return false;
      pay(s, tier.cost);
      advance(s, 600, rng);
      const [npc, r] = entry;
      r.engaged = false;
      r.married = true;
      r.bae = true;
      addRel(s, npc, 15);
      addMoodlet(s, "married");
      log(s, `💒 You married ${NPC[npc].name}! ${tier.label}. ${NPC[npc].name} moves in and splits the rent.`, "good");
      return true;
    }
    case "breakUp": {
      const r = s.relationships[cmd.npc];
      if (!r || !(r.bae || r.engaged || r.married)) return false;
      r.bae = r.engaged = r.married = false;
      addRel(s, cmd.npc, -40);
      addMoodlet(s, "heartbroken");
      log(s, `💔 You and ${NPC[cmd.npc].name} broke up.`, "bad");
      return true;
    }
    case "sendMoney": {
      const npc = NPC[cmd.npc];
      if (!npc || cmd.amount < 50 || !canAfford(s, cmd.amount)) return false;
      pay(s, cmd.amount);
      addRel(s, cmd.npc, Math.min(20, Math.round(cmd.amount / 200)));
      addMoodlet(s, "goodDeed");
      log(s, `📲 Sent KSh ${cmd.amount.toLocaleString()} to ${npc.name}. "Asante sana!"`);
      return true;
    }
    case "buyObject": {
      const o = OBJECT[cmd.id];
      const cost = o && price(s, o.price);
      if (!o || s.objects.includes(o.id) || s.objects.length >= unitOf(s).slots || !canAfford(s, cost)) return false;
      pay(s, cost);
      s.objects.push(o.id);
      log(s, `🛒 ${o.emoji} ${o.name} delivered home.`, "good");
      progress(s, { buy: true });
      return true;
    }
    case "sellObject": {
      const o = OBJECT[cmd.id];
      if (!o || !s.objects.includes(o.id)) return false;
      s.objects = s.objects.filter((x) => x !== o.id);
      s.money += Math.round(o.price * 0.5);
      log(s, `💸 Sold your ${o.name.toLowerCase()} for KSh ${Math.round(o.price * 0.5).toLocaleString()}.`);
      return true;
    }
    case "buyGrocery": {
      if (!GROCERY[cmd.id] || cmd.qty < 1 || !groceryChannels(s).includes(cmd.channel) || !groceriesFor(cmd.channel).includes(cmd.id)) return false;
      const cost = groceryCost(s, cmd.id, cmd.qty, cmd.channel);
      if (!canAfford(s, cost)) return false;
      pay(s, cost);
      s.pantry[cmd.id] = (s.pantry[cmd.id] ?? 0) + cmd.qty;
      if (cmd.channel === "delivery") advance(s, 40, rng);
      return true;
    }
    case "orderFood": {
      const item = DELIVERY_MENU.find((m) => m.id === cmd.id);
      const cost = item && price(s, item.price) + DELIVERY_FEE;
      if (!item || !canAfford(s, cost!)) return false;
      pay(s, cost!);
      advance(s, 40, rng);
      addNeeds(s, { hunger: item.hunger, fun: item.fun });
      addMoodlet(s, "fullBelly");
      log(s, `🛵 ${item.emoji} ${item.name} delivered. The rider called you \"boss\" three times.`);
      progress(s, { tags: ["eat"] });
      return true;
    }
    case "setTone": {
      if (!s.job || !WORK_TONES.some((t) => t.id === cmd.tone)) return false;
      s.job.tone = cmd.tone;
      return true;
    }
    case "quitJob": {
      if (!s.job) return false;
      log(s, "📦 You quit your job. Freedom, and no salary.", "bad");
      s.job = null;
      return true;
    }
    case "moveHouse": {
      const e = ESTATE[cmd.estate];
      const u = UNIT[cmd.unit];
      if (!e || !u || !e.units.includes(u.id) || s.arrears > 0) return false;
      if (e.id === s.player.estateId && u.id === s.player.unitId) return false;
      if (s.objects.length > u.slots) return false;
      const cost = moveCost(s, e.id, u.id);
      if (!canAfford(s, cost)) return false;
      pay(s, cost);
      advance(s, 240, rng);
      s.player.estateId = e.id;
      s.player.unitId = u.id;
      s.location = "home";
      s.rentPaidThroughDay = dayOf(s.time) + 6;
      log(s, `🚚 Moved into a ${u.name.toLowerCase()} in ${e.name}. ${e.blurb}`, "good");
      return true;
    }
    case "bank": {
      const amt = Math.round(cmd.amount);
      if (amt <= 0) return false;
      const b = s.bank;
      switch (cmd.op) {
        case "deposit":
          if (s.money < amt) return false;
          s.money -= amt;
          b.savings += amt;
          log(s, `🏦 Moved KSh ${amt.toLocaleString()} into your money market fund.`);
          return true;
        case "withdraw":
          if (b.savings < amt) return false;
          b.savings -= amt;
          s.money += amt;
          log(s, `🏦 Withdrew KSh ${amt.toLocaleString()} from your MMF.`);
          return true;
        case "borrow":
          if (b.loan + amt > BANK.loanMax) return false;
          b.loan += amt;
          s.money += amt;
          log(s, `📱 Haraka Loans sent KSh ${amt.toLocaleString()}. Interest: 12% a week. Choose wisely.`, "bad");
          return true;
        case "repay": {
          const pay2 = Math.min(amt, b.loan);
          if (pay2 <= 0 || s.money < pay2) return false;
          s.money -= pay2;
          b.loan -= pay2;
          log(s, `📱 Repaid KSh ${pay2.toLocaleString()}. ${b.loan ? `Still owe KSh ${b.loan.toLocaleString()}.` : "Loan cleared!"}`, "good");
          return true;
        }
        case "bond":
          if (b.bond || amt < BANK.bondMin || s.money < amt) return false;
          s.money -= amt;
          b.bond = { amount: amt, matures: dayOf(s.time) + BANK.bondDays };
          log(s, `📈 Bought an infrastructure bond: KSh ${amt.toLocaleString()}. Matures in ${BANK.bondDays} days.`);
          return true;
      }
      return false;
    }
    case "buyBusiness": {
      const b = BUSINESS[cmd.id];
      if (!b || s.businesses.some((x) => x.id === b.id) || !canAfford(s, b.price) || s.money < b.price) return false;
      pay(s, b.price);
      s.businesses.push({ id: b.id, since: dayOf(s.time) });
      log(s, `💼 You now own a ${b.name.toLowerCase()}. Income lands every Monday.`, "good");
      return true;
    }
    case "sellBusiness": {
      const b = BUSINESS[cmd.id];
      if (!b || !s.businesses.some((x) => x.id === b.id)) return false;
      s.businesses = s.businesses.filter((x) => x.id !== b.id);
      s.money += Math.round(b.price * BUSINESS_RESALE);
      log(s, `💼 Sold your ${b.name.toLowerCase()} for KSh ${Math.round(b.price * BUSINESS_RESALE).toLocaleString()}.`);
      return true;
    }
    case "buyPlot": {
      const p = PLOT[cmd.id];
      const cost = p && p.price + (cmd.search ? LAND_SEARCH_FEE : 0);
      if (!p || s.money < cost) return false;
      s.money -= cost;
      const fake = !cmd.search && rng() < p.cartel;
      s.plots.push({ id: p.id, paid: p.price, value: p.price, fake });
      log(s, `📐 Bought ${p.name}.${cmd.search ? " Ardhi House search came back clean." : " You skipped the land search…"}`, "good");
      return true;
    }
    case "sellPlot": {
      const plot = s.plots[cmd.index];
      if (!plot || plot.fake) return false;
      const proceeds = Math.round(plot.value * (1 - LAND_SELL_FEE));
      s.plots.splice(cmd.index, 1);
      s.money += proceeds;
      log(s, `📐 Sold ${PLOT[plot.id].name} for KSh ${proceeds.toLocaleString()} (bought at ${plot.paid.toLocaleString()}).`, proceeds > plot.paid ? "good" : "info");
      return true;
    }
    case "buyCar": {
      const c = CAR[cmd.id];
      if (!c || s.cars.includes(c.id) || s.money < c.price) return false;
      s.money -= c.price;
      s.cars.push(c.id);
      s.carId = c.id;
      addMoodlet(s, "newWhip");
      log(s, `🔑 You bought a ${c.name}! ${c.blurb}`, "good");
      return true;
    }
    case "sellCar": {
      const c = CAR[cmd.id];
      if (!c || !s.cars.includes(c.id)) return false;
      s.cars = s.cars.filter((x) => x !== c.id);
      if (s.carId === c.id) s.carId = s.cars[0] ?? null;
      s.money += Math.round(c.price * CAR_RESALE);
      log(s, `🔑 Sold the ${c.name} for KSh ${Math.round(c.price * CAR_RESALE).toLocaleString()}.`);
      return true;
    }
    case "useCar": {
      if (cmd.id !== null && !s.cars.includes(cmd.id)) return false;
      s.carId = cmd.id;
      return true;
    }
    case "crash": {
      if (cmd.stake < 10 || cmd.target < 1.1 || s.money < cmd.stake) return false;
      const point = crashPoint(rng);
      const won = point >= cmd.target;
      const payout = won ? Math.round(cmd.stake * cmd.target) : 0;
      s.money += payout - cmd.stake;
      s.lastBet = { kind: "crash", stake: cmd.stake, target: cmd.target, result: point, label: `${point.toFixed(2)}x`, won, payout, at: s.time };
      addMoodlet(s, won ? "bigWin" : "betLoss");
      if (!won && s.money < 500) addMoodlet(s, "sapa");
      log(s, won ? `🛫 Cashed out at ${cmd.target}x. +KSh ${(payout - cmd.stake).toLocaleString()}.` : `💥 Ndege crashed at ${point.toFixed(2)}x. −KSh ${cmd.stake.toLocaleString()}.`, won ? "good" : "bad");
      return true;
    }
    case "derby": {
      if (!isWeekend(s.time) || cmd.stake < 50 || s.money < cmd.stake) return false;
      const total = Object.values(DERBY_ODDS).reduce((n, o) => n + 1 / o, 0);
      let roll = rng() * total;
      let result: keyof typeof DERBY_ODDS = "gor";
      for (const [k, o] of Object.entries(DERBY_ODDS) as [keyof typeof DERBY_ODDS, number][]) {
        roll -= 1 / o;
        if (roll < 0) {
          result = k;
          break;
        }
      }
      const won = result === cmd.pick;
      const payout = won ? Math.round(cmd.stake * DERBY_ODDS[cmd.pick]) : 0;
      s.money += payout - cmd.stake;
      const label = { gor: "Gor Mahia won", draw: "It ended in a draw", ingwe: "AFC Leopards won" }[result];
      s.lastBet = { kind: "derby", stake: cmd.stake, target: DERBY_ODDS[cmd.pick], result: 0, label, won, payout, at: s.time };
      addMoodlet(s, won ? "bigWin" : "betLoss");
      log(s, `⚽ Mashemeji Derby: ${label}. ${won ? `You won KSh ${payout.toLocaleString()}!` : `You lost KSh ${cmd.stake.toLocaleString()}.`}`, won ? "good" : "bad");
      return true;
    }
    case "policy": {
      if (!s.office) return false;
      const max = OFFICES.findIndex((o) => o.id === s.office!.id) + 1;
      if (s.policies.includes(cmd.id)) s.policies = s.policies.filter((p) => p !== cmd.id);
      else if (s.policies.length < max) s.policies.push(cmd.id);
      else return false;
      return true;
    }
    case "reward": {
      const r = REWARD[cmd.id];
      if (!r || s.rewards.includes(r.id) || s.vibes < r.cost) return false;
      s.vibes -= r.cost;
      s.rewards.push(r.id);
      log(s, `✨ Unlocked ${r.label}: ${r.desc}`, "good");
      return true;
    }
  }
}
