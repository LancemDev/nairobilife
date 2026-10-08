export const NEED_KEYS = ["hunger", "energy", "bladder", "hygiene", "fun", "social"] as const;
export const SKILL_KEYS = ["hustle", "tech", "charm", "fitness", "cooking", "music", "dance", "comedy", "photography"] as const;

export type NeedKey = (typeof NEED_KEYS)[number];
export type SkillKey = (typeof SKILL_KEYS)[number];
export type Needs = Record<NeedKey, number>;
export type Skills = Record<SkillKey, number>;
export type TravelMode = "walk" | "matatu" | "boda" | "cab" | "car";
export type Rng = () => number;

/** Hour range [from, to) on a 24h clock; wraps past midnight when from > to. */
export type Hours = [number, number];

// ---------------------------------------------------------------------------
// Content definitions

export interface Effect {
  money?: number;
  needs?: Partial<Needs>;
  skills?: Partial<Skills>;
  minutes?: number;
  performance?: number;
  moodlet?: string;
  vibes?: number;
  rel?: { npc: string; delta: number };
}

export interface Outcome {
  effect: Effect;
  result: string;
}

export interface Choice extends Outcome {
  label: string;
  /** Chance of success; a skill adds skill/200 on top of base. Failure applies `fail`. */
  odds?: { base: number; skill?: SkillKey };
  fail?: Outcome;
}

export type EventContext = "daily" | `travel:${TravelMode}` | `arrive:${string}` | "arrest";

export interface EventDef {
  id: string;
  context: EventContext;
  weight: number;
  when?: (s: GameState) => boolean;
  title: string;
  text: string;
  choices: Choice[];
}

export interface PendingEvent {
  id: string;
  title: string;
  text: string;
  choices: Choice[];
}

export interface Requirement {
  object?: string;
  degree?: boolean;
  car?: boolean;
  power?: boolean;
  water?: boolean;
  weekend?: boolean;
  healthy?: boolean;
}

export interface ActionDef {
  id: string;
  label: string;
  emoji: string;
  minutes: number;
  cost?: number;
  needs?: Partial<Needs>;
  skills?: Partial<Skills>;
  moodlet?: string;
  open?: Hours;
  tags?: string[];
  /** Gig income: base + skill * per, ±30%. */
  earn?: { base: number; skill: SkillKey; per: number };
  req?: Requirement;
  /** Chance of catching something (street food, rain…). */
  risk?: { chance: number; sickness: string };
  /** Random outcomes; the first roll that hits applies. Odds improve with skill/200. */
  rolls?: { chance: number; skill?: SkillKey; text: string; moodlet?: string; money?: number; needs?: Partial<Needs> }[];
  /** Risky actions: chance the karao catch you, the fine, and any loot. */
  crime?: { catch: number; fine: number; reward?: [number, number] };
  /** Sleep through it (hotel nights, overnight trains). */
  sleep?: boolean;
  /** Moves you to another venue when done (flights, trains). */
  goTo?: string;
  text: string;
}

export interface Area {
  id: string;
  /** Areas in other cities are only reachable by flight or train. */
  city?: "mombasa" | "kisumu";
  name: string;
  emoji: string;
  x: number;
  y: number;
  blurb: string;
  /** A line of local flavour, often in Sheng. */
  vibe: string;
}

export interface Venue {
  id: string;
  area: string;
  name: string;
  emoji: string;
  blurb: string;
  actions: ActionDef[];
}

export interface Unit {
  id: string;
  name: string;
  /** Weekly rent before the estate multiplier. */
  rent: number;
  slots: number;
}

export interface Estate {
  id: string;
  name: string;
  area: string;
  x: number;
  y: number;
  blurb: string;
  rentFactor: number;
  units: string[];
  /** Daily water-rationing chance. */
  water: number;
  /** Noise knocks this much energy off a night's sleep. */
  noise: number;
  actions: ActionDef[];
}

export interface JobLevel {
  title: string;
  pay: number;
  req: Partial<Skills>;
  degree?: boolean;
}

export interface Career {
  id: string;
  name: string;
  emoji: string;
  venue: string;
  skill: SkillKey;
  shiftHours: number;
  start: Hours;
  /** Days off, as weekday indices (0 = Mon). */
  off: number[];
  levels: JobLevel[];
}

export interface Moodlet {
  id: string;
  label: string;
  emoji: string;
  mood: number;
  hours: number;
}

export interface Trait {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  skill?: Partial<Record<SkillKey, number>>;
  decay?: Partial<Record<NeedKey, number>>;
  work?: number;
  social?: number;
  /** Extra fun when doing actions with this tag. */
  tagFun?: Record<string, number>;
  discount?: number;
}

export interface Aspiration {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  progress: (s: GameState) => number;
}

export interface BirthLottery {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  money: number;
  estate: string;
  unit: string;
  skills: Partial<Skills>;
  objects: string[];
  /** Weekly money from family. */
  allowance: number;
}

export interface Reward {
  id: string;
  label: string;
  emoji: string;
  cost: number;
  desc: string;
}

export interface WishDef {
  id: string;
  label: string;
  emoji: string;
  vibes: number;
  match: { action?: string; tag?: string; venue?: string; area?: string; social?: boolean; earned?: number };
}

export interface Npc {
  id: string;
  name: string;
  emoji: string;
  age: number;
  bio: string;
  venue: string;
  hours: Hours;
  line: string;
}

export interface SocialDef {
  id: string;
  label: string;
  emoji: string;
  minRel: number;
  rel: number;
  social: number;
  fun?: number;
  skill?: SkillKey;
  chance: number;
  minutes: number;
  romantic?: boolean;
  ask?: number;
}

export interface HomeObject {
  id: string;
  name: string;
  emoji: string;
  cat: "sleep" | "kitchen" | "bath" | "comfort" | "fun" | "skill" | "power" | "decor" | "luxury";
  price: number;
  desc: string;
  /** Multiplies how well related home actions restore needs. */
  quality?: number;
}

export interface Grocery {
  id: string;
  name: string;
  emoji: string;
  price: number;
}

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  needs: Record<string, number>;
  minutes: number;
  hunger: number;
  fun: number;
  cooking: number;
}

export interface Business {
  id: string;
  name: string;
  emoji: string;
  price: number;
  weekly: [number, number];
  blurb: string;
}

export interface Plot {
  id: string;
  name: string;
  price: number;
  /** Weekly appreciation, e.g. 0.02 = 2%. */
  growth: number;
  /** Chance the title deed turns out fake if you skip the search. */
  cartel: number;
  blurb: string;
}

export interface Car {
  id: string;
  name: string;
  emoji: string;
  price: number;
  kmh: number;
  perKm: number;
  blurb: string;
}

export interface Sickness {
  id: string;
  name: string;
  emoji: string;
  serious: boolean;
  days: number;
  blurb: string;
}

export interface Office {
  id: string;
  title: string;
  allowance: number;
  runFee: number;
  charm: number;
  /** Campaign spend that guarantees a decent shot. */
  campaign: number;
}

export interface Policy {
  id: string;
  label: string;
  emoji: string;
  desc: string;
}

export interface Course {
  id: string;
  name: string;
  skill: SkillKey;
  fees: number;
}

// ---------------------------------------------------------------------------
// Save state

export interface Player {
  name: string;
  avatar: string;
  originId: string;
  lotteryId: string;
  traits: string[];
  aspirationId: string;
  estateId: string;
  unitId: string;
  look?: import("./look").Look;
}

export interface LogEntry {
  id: number;
  time: number;
  text: string;
  tone: "info" | "good" | "bad" | "event";
}

export interface Relationship {
  rel: number;
  bae?: boolean;
  engaged?: boolean;
  married?: boolean;
}

export interface GameState {
  version: 2;
  player: Player;
  /** Minutes since Day 1 00:00. */
  time: number;
  money: number;
  needs: Needs;
  skills: Skills;
  moodlets: { id: string; until: number }[];
  /** A venue id, or "home". */
  location: string;
  job: { career: string; level: number; performance: number; lastShiftDay: number; tone: string } | null;
  study: { course: string; classes: number; graduated: boolean } | null;
  objects: string[];
  pantry: Record<string, number>;
  rentPaidThroughDay: number;
  arrears: number;
  blackout: { start: number; end: number } | null;
  waterCut: { start: number; end: number } | null;
  sick: { id: string; until: number } | null;
  relationships: Record<string, Relationship>;
  wishes: { day: number; ids: string[]; done: string[] };
  goalsDone: string[];
  vibes: number;
  rewards: string[];
  bank: { savings: number; loan: number; bond: { amount: number; matures: number } | null };
  businesses: { id: string; since: number }[];
  plots: { id: string; paid: number; value: number; fake: boolean }[];
  cars: string[];
  carId: string | null;
  office: { id: string; since: number } | null;
  policies: string[];
  campaign: { office: string; spent: number } | null;
  voter: boolean;
  insured: boolean;
  /** A booked flight: your boarding pass. Undefined on older saves. */
  flight?: { from: string; to: "nairobi" | "mombasa" | "kisumu"; dep: number; air: number; code: string; airline: string; gate: number; cabin: "economy" | "business"; fare: number } | null;
  lastBet: { kind: "crash" | "derby"; stake: number; target: number; result: number; label: string; won: boolean; payout: number; at: number } | null;
  today: { day: number; earned: number; socials: number };
  event: PendingEvent | null;
  log: LogEntry[];
  nextLogId: number;
  stats: { shifts: number; earned: number; promotions: number; daysAlive: number };
}

export interface ActionView {
  id: string;
  label: string;
  emoji: string;
  minutes: number;
  cost: number;
  detail: string;
  section?: string;
  disabled?: string;
}
