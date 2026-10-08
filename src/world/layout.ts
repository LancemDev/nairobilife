import { AREA, CAREERS, VENUE } from "@/game/data";
import { availableActions, estateOf, has, placeOf, unitOf } from "@/game/engine";
import type { ActionView, GameState } from "@/game/types";

/** Every kind of thing you can tap in a room. Each has a 3D model in Props.tsx. */
export type PropKind =
  | "bed" | "toilet" | "shower" | "stove" | "fridge" | "sofa" | "tv" | "radio" | "console" | "speaker"
  | "shelf" | "desk" | "guitar" | "rack" | "mirror" | "ringLight" | "dog" | "jacuzzi" | "cinema" | "poolTable"
  | "plant" | "art" | "lamp" | "generator" | "solar" | "tank" | "chairs" | "door"
  | "stall" | "grill" | "table" | "counter" | "dancefloor" | "dj" | "screen" | "trees" | "board" | "podium"
  | "hospitalBed" | "checkin" | "matatu" | "motorbike" | "pews" | "mic" | "washroom" | "alley" | "goal" | "kiosk" | "pool"
  | "rug" | "bench" | "palm" | "seats" | "departures" | "luggage" | "train" | "speakers" | "crates";

export interface Prop {
  id: string;
  kind: PropKind;
  label: string;
  x: number;
  z: number;
  rot: number;
  actions: ActionView[];
}

export interface Room {
  key: string;
  w: number;
  d: number;
  floor: string;
  floor2: string;
  wall: string;
  accent: string;
  outdoor: boolean;
  sign: string;
  props: Prop[];
  /** Free spots for people to stand. */
  spots: [number, number][];
  /** Where the player stands when they arrive. */
  entry: [number, number];
}

const PALETTES: Record<string, { floor: string; floor2: string; wall: string; accent: string; outdoor?: boolean }> = {
  cbd: { floor: "#d9d4cb", floor2: "#cfc9be", wall: "#3d5a80", accent: "#f2b705" },
  westlands: { floor: "#2b2d42", floor2: "#33354d", wall: "#14213d", accent: "#e76f51" },
  kilimani: { floor: "#e9dcc9", floor2: "#dfd0bb", wall: "#2a9d8f", accent: "#f4a261" },
  upperhill: { floor: "#e5e7eb", floor2: "#d9dce1", wall: "#1d3557", accent: "#a8dadc" },
  eastleigh: { floor: "#f1e3c6", floor2: "#e8d6b3", wall: "#9c6644", accent: "#0b7a3b" },
  gikomba: { floor: "#c9b79c", floor2: "#bda88a", wall: "#6c584c", accent: "#c8102e", outdoor: true },
  eastlands: { floor: "#cfc6b8", floor2: "#c4baa9", wall: "#7b2cbf", accent: "#f2b705" },
  thikaroad: { floor: "#dcdcdc", floor2: "#d0d0d0", wall: "#0b7a3b", accent: "#f2b705" },
  ruaka: { floor: "#e8e1d5", floor2: "#ddd4c5", wall: "#457b9d", accent: "#f2b705" },
  karura: { floor: "#7aa95c", floor2: "#6f9d52", wall: "#2d6a4f", accent: "#d4a373", outdoor: true },
  southb: { floor: "#e3d5c3", floor2: "#d8c8b3", wall: "#bc4749", accent: "#f2b705" },
  langata: { floor: "#c8a97e", floor2: "#bd9c6f", wall: "#7f4f24", accent: "#c8102e", outdoor: true },
  karen: { floor: "#efe6d8", floor2: "#e6dbca", wall: "#386641", accent: "#bc6c25" },
  runda: { floor: "#f3efe7", floor2: "#ebe5da", wall: "#264653", accent: "#e9c46a" },
  rongai: { floor: "#cfc6b8", floor2: "#c4baa9", wall: "#d00000", accent: "#ffba08" },
  kitengela: { floor: "#2b2d42", floor2: "#33354d", wall: "#5a189a", accent: "#ff006e" },
  jkia: { floor: "#eef0f2", floor2: "#e2e5e8", wall: "#f5f5f4", accent: "#1d4ed8" },
  ngong: { floor: "#88b06a", floor2: "#7da35f", wall: "#3a5a40", accent: "#dda15e", outdoor: true },
  mombasa: { floor: "#f4e4bc", floor2: "#ecd8a8", wall: "#0077b6", accent: "#f2b705" },
  kisumu: { floor: "#e3d5b8", floor2: "#d8c8a6", wall: "#2a6f97", accent: "#f2b705" },
};

const CAREER_PROP: Record<string, PropKind> = {
  matatu: "matatu", boda: "motorbike", tech: "desk", banking: "counter", music: "mic", trading: "stall",
  nursing: "hospitalBed", medicine: "hospitalBed", salon: "mirror", chef: "grill", waiter: "table", dj: "dj",
  fitnessCoach: "rack", creator: "ringLight", teaching: "board", football: "goal", law: "podium", civil: "counter",
  radio: "mic", aviation: "checkin", callcentre: "desk", security: "kiosk",
};

const KIND_LABEL: Partial<Record<PropKind, string>> = {
  stall: "Food stall", grill: "Grill", table: "Table", counter: "Counter", dancefloor: "Dance floor", screen: "Screen",
  trees: "Trail", board: "Lecture hall", podium: "Podium", hospitalBed: "Ward", checkin: "Check-in", washroom: "Washroom",
  alley: "Shady corner", kiosk: "Kiosk", pews: "Pews", mic: "Studio", shelf: "Shelves", rack: "Weights", door: "Front door",
  pool: "Pool", goal: "Pitch", motorbike: "Boda stage", matatu: "Matatu", desk: "Desk", dj: "DJ booth", train: "Madaraka Express",
};

type Deco = { kind: PropKind; x: number; z: number; rot?: number };
const AIRPORTS = new Set(["jkia", "moiAirport", "kisumuAirport"]);
const STATIONS = new Set(["sgrNairobi", "sgrMombasa"]);
const CLUBS = new Set(["k1", "alchemist", "outering", "namanga", "nyaliHotel", "kisumuTown", "comedyClub"]);
const MARKETS = new Set(["gikomba", "kenyattaMarket", "firstAve", "eatStreet", "villageMarket"]);
const STAGES = new Set(["kencom", "rongaiStage", "nganyaStage"]);

/** Set dressing that makes each kind of place read at a glance. */
function scenery(venue: string, w: number, d: number): Deco[] {
  if (AIRPORTS.has(venue))
    return [
      { kind: "departures", x: -w / 2 + 0.2, z: -d / 4, rot: Math.PI / 2 },
      { kind: "seats", x: -1.6, z: 1.2 },
      { kind: "seats", x: 1.6, z: 1.2 },
      { kind: "seats", x: -1.6, z: 2.6 },
      { kind: "seats", x: 1.6, z: 2.6 },
      { kind: "palm", x: -w / 2 + 1, z: d / 2 - 1 },
      { kind: "palm", x: w / 2 - 1, z: d / 2 - 1 },
      { kind: "luggage", x: 3.6, z: -0.6 },
    ];
  if (STATIONS.has(venue))
    return [
      { kind: "seats", x: -2, z: 1.5 },
      { kind: "seats", x: 2, z: 1.5 },
      { kind: "departures", x: -w / 2 + 0.2, z: 0, rot: Math.PI / 2 },
      { kind: "luggage", x: 0, z: 2.8 },
    ];
  if (CLUBS.has(venue))
    return [
      { kind: "speakers", x: -w / 2 + 1, z: 0 },
      { kind: "speakers", x: w / 2 - 1, z: 0, rot: Math.PI },
      { kind: "seats", x: 0, z: d / 2 - 1.4, rot: Math.PI },
    ];
  if (MARKETS.has(venue))
    return [
      { kind: "crates", x: -1.5, z: 1 },
      { kind: "crates", x: 1.8, z: 2 },
      { kind: "stall", x: 0, z: d / 2 - 1.6, rot: Math.PI },
    ];
  if (STAGES.has(venue))
    return [
      { kind: "matatu", x: w / 2 - 2.2, z: 1.5, rot: -0.3 },
      { kind: "seats", x: -2.4, z: 2.4 },
      { kind: "crates", x: -w / 2 + 1.2, z: d / 2 - 1.2 },
    ];
  return [
    { kind: "rug", x: 0, z: 0.4 },
    { kind: "bench", x: -2.2, z: d / 2 - 1.6, rot: Math.PI },
    { kind: "bench", x: 2.2, z: d / 2 - 1.6, rot: Math.PI },
  ];
}

/** Which prop a venue action lives on. */
function venueKind(a: ActionView, tags: string[]): PropKind {
  const id = a.id;
  if (id === "toilet") return "washroom";
  if (id.startsWith("work:") || id.startsWith("apply:")) return CAREER_PROP[id.split(":")[1]] ?? "desk";
  if (id.startsWith("enrol:") || id === "lecture" || id === "comrades") return "board";
  if (id === "doctor" || id === "admit" || id === "sha" || id === "donateBlood") return "hospitalBed";
  if (id === "registerVoter" || id === "runOffice" || id === "rally" || id === "huduma") return "podium";
  if (/^(sgr|busBack|lorry)/.test(id)) return id.startsWith("sgr") ? "train" : "matatu";
  if (/^(fly|planeSpot)/.test(id)) return "checkin";
  if (/pickpocket|fakePerfume|sneakVip|tagWall/.test(id)) return "alley";
  if (/hotelNight|kisumuHotel/.test(id)) return "bed";
  if (/swim|pool/.test(id)) return "pool";
  if (tags.includes("party") || tags.includes("dance")) return "dancefloor";
  if (tags.includes("movie")) return "screen";
  if (tags.includes("workout")) return tags.includes("nature") ? "trees" : "rack";
  if (tags.includes("nature")) return "trees";
  if (tags.includes("study")) return "shelf";
  if (tags.includes("worship")) return "pews";
  if (tags.includes("music")) return "mic";
  if (tags.includes("street")) return "stall";
  if (tags.includes("nyama")) return "grill";
  if (tags.includes("eat")) return "table";
  if (tags.includes("gig")) return "stall";
  return "kiosk";
}

// Actions don't carry their tags into views, so look them up from the venue definition.
const tagsOf = (venueId: string, actionId: string) => VENUE[venueId]?.actions.find((a) => a.id === actionId)?.tags ?? [];

/** Home: furniture you own, wired to what it lets you do. */
const HOME_KIND: [PropKind, (id: string) => boolean, string[]][] = [
  ["bed", (id) => id === "sleep" || id === "nap", ["kingBed", "springBed", "mattress"]],
  ["toilet", (id) => id === "toiletHome", ["toilet"]],
  ["shower", (id) => id === "shower", ["shower", "bucket"]],
  ["stove", (id) => id.startsWith("cook:"), ["gasCooker", "jiko"]],
  ["tv", (id) => id === "tv" || id === "bigTvWatch", ["bigTv", "tv"]],
  ["radio", (id) => id === "radio", ["radio"]],
  ["console", (id) => id === "fifa", ["console"]],
  ["speaker", (id) => id === "danceHome", ["speaker"]],
  ["shelf", (id) => id === "read", ["bookshelf"]],
  ["desk", (id) => id === "code" || id === "freelanceHome" || id === "photoWalk", ["laptop", "camera"]],
  ["guitar", (id) => id === "guitar", ["guitar"]],
  ["rack", (id) => id === "homeWorkout", ["dumbbells"]],
  ["mirror", (id) => id === "mirror", ["mirror"]],
  ["ringLight", (id) => id === "contentHome", ["ringLight"]],
  ["dog", (id) => id === "dog", ["dog"]],
  ["sofa", (id) => id === "sofa" || id === "bigSofaChill", ["bigSofa", "sofa"]],
  ["jacuzzi", (id) => id === "jacuzzi", ["jacuzzi"]],
  ["cinema", (id) => id === "cinema", ["homeCinema"]],
  ["poolTable", (id) => id === "pool", ["poolTable"]],
];
const DECOR: [PropKind, string][] = [["fridge", "fridge"], ["plant", "plant"], ["art", "art"], ["art", "kikoy"], ["lamp", "lamp"], ["lamp", "chandelier"], ["generator", "generator"], ["solar", "solar"], ["tank", "waterTank"], ["chairs", "plasticChairs"]];

const HOME_SIZE: Record<string, [number, number]> = { single: [7, 6], bedsitter: [8, 7], onebed: [10, 8], twobed: [12, 9], maisonette: [13, 11], mansion: [16, 12] };

/**
 * Positions around the walls (back, then left, then right), then a second ring further in.
 * Never returns the same spot twice; callers drop anything that doesn't fit.
 */
function wallSlots(w: number, d: number, n: number): { x: number; z: number; rot: number }[] {
  const out: { x: number; z: number; rot: number }[] = [];
  const step = 2.3;
  for (let ring = 0; ring < 2 && out.length < n; ring++) {
    const inset = 1.2 + ring * 2.4;
    for (let x = -w / 2 + 1.5 + ring * 2.4; x <= w / 2 - 2.4 - ring * 2.4 + 0.01; x += step) out.push({ x, z: -d / 2 + inset, rot: 0 });
    for (let z = -d / 2 + inset + step; z <= d / 2 - 1.8; z += step) out.push({ x: -w / 2 + inset, z, rot: Math.PI / 2 });
    for (let z = -d / 2 + inset + step; z <= d / 2 - 1.8; z += step) out.push({ x: w / 2 - inset, z, rot: -Math.PI / 2 });
  }
  return out;
}

function spotsFor(w: number, d: number, taken: { x: number; z: number }[]) {
  const spots: [number, number][] = [];
  for (let x = -w / 2 + 2; x <= w / 2 - 2; x += 1.6)
    for (let z = -d / 2 + 2.6; z <= d / 2 - 1.5; z += 1.6) if (taken.every((t) => Math.hypot(t.x - x, t.z - z) > 1.8)) spots.push([x, z]);
  return spots;
}

export function buildRoom(s: GameState): Room {
  const actions = availableActions(s);
  const place = placeOf(s);
  const pal = PALETTES[place.area] ?? PALETTES.cbd;

  if (s.location === "home") {
    const [w, d] = HOME_SIZE[unitOf(s).id] ?? [9, 8];
    const props: Omit<Prop, "x" | "z" | "rot">[] = [];
    const used = new Set<string>();
    for (const [kind, match, objs] of HOME_KIND) {
      const mine = actions.filter((a) => match(a.id));
      const own = objs.find((o) => has(s, o));
      // Bed, toilet, shower and stove always appear (floor mattress, plot toilet, jerrycan, empty corner).
      if (!mine.length && !own) continue;
      mine.forEach((a) => used.add(a.id));
      props.push({ id: kind, kind, label: own ? labelFor(own) : kind === "toilet" ? "Plot toilet" : kind === "shower" ? "Wash area" : kind === "stove" ? "Kitchen corner" : kind, actions: mine });
    }
    for (const [kind, obj] of DECOR) if (has(s, obj)) props.push({ id: `decor-${obj}`, kind, label: labelFor(obj), actions: [] });
    const rest = actions.filter((a) => !used.has(a.id));
    // Things you can use get wall space first; decor fills whatever is left.
    props.sort((a, b) => Number(b.actions.length > 0) - Number(a.actions.length > 0));
    const slots = wallSlots(w, d, props.length);
    const placed = props.slice(0, slots.length).map((p, i) => ({ ...p, ...slots[i] }));
    // The front door holds everything about the mtaa outside, plus rent.
    placed.push({ id: "door", kind: "door", label: `Mtaa · ${estateOf(s).name}`, actions: rest, x: w / 2 - 0.9, z: -d / 2 + 0.25, rot: 0 });
    return { key: `home-${s.player.estateId}-${unitOf(s).id}`, w, d, floor: "#d8cbb5", floor2: "#cfc0a6", wall: "#2a9d8f", accent: "#e9c46a", outdoor: false, sign: "", props: placed, spots: spotsFor(w, d, placed), entry: [w / 2 - 1, -d / 2 + 1.8] };
  }

  const venue = VENUE[s.location];
  const groups = new Map<string, Omit<Prop, "x" | "z" | "rot">>();
  for (const a of actions) {
    const kind = venueKind(a, tagsOf(s.location, a.id));
    const travel = kind === "checkin" || kind === "train" || (kind === "matatu" && /busBack|lorry/.test(a.id));
    const key = a.id.startsWith("work:") || a.id.startsWith("apply:") ? `${kind}-${a.id.split(":")[1]}` : travel ? `${kind}-${a.id}` : kind;
    const g = groups.get(key) ?? { id: key, kind, label: travel ? a.label.replace(/ \(.*\)$/, "") : (KIND_LABEL[kind] ?? kind), actions: [] };
    if (a.id.startsWith("work:") || a.id.startsWith("apply:")) g.label = CAREERS.find((c) => c.id === a.id.split(":")[1])?.name ?? g.label;
    g.actions.push(a);
    groups.set(key, g);
  }
  const list = [...groups.values()];
  const big = list.length > 6 || ["gikomba", "jkia", "stadium", "karura", "park"].includes(s.location);
  const w = big ? 16 : 13;
  const d = big ? 12 : 10;
  const slots = wallSlots(w, d, list.length);
  const props: Prop[] = list.slice(0, slots.length).map((p, i) => ({ ...p, ...slots[i] }));
  // A little set dressing so rooms never feel empty.
  const dressing: Prop[] = [
    { id: "plant-a", kind: pal.outdoor ? "trees" : "plant", label: "", x: -w / 2 + 0.9, z: d / 2 - 1, rot: 0, actions: [] },
    { id: "plant-b", kind: "plant", label: "", x: w / 2 - 0.9, z: -d / 2 + 0.9, rot: 0, actions: [] },
    ...(pal.outdoor && !MARKETS.has(s.location) ? [] : scenery(s.location, w, d).map((p, i) => ({ id: `deco-${i}`, label: "", actions: [], rot: 0, ...p }))),
  ];
  return {
    key: `venue-${s.location}`,
    w, d,
    floor: pal.floor, floor2: pal.floor2, wall: pal.wall, accent: pal.accent,
    outdoor: !!pal.outdoor,
    sign: venue?.name ?? AREA[place.area]?.name ?? "",
    props: [...props, ...dressing],
    spots: spotsFor(w, d, props),
    entry: [0, d / 2 - 1.5],
  };
}

const OBJ_LABEL: Record<string, string> = {
  kingBed: "King-size bed", springBed: "Spring bed", mattress: "Foam mattress", toilet: "Toilet", shower: "Instant shower", bucket: "Bucket & basin",
  gasCooker: "Gas cooker", jiko: "Charcoal jiko", bigTv: "75\" TV", tv: "Smart TV", radio: "Radio", console: "Game console", speaker: "Party speaker",
  bookshelf: "Bookshelf", laptop: "Laptop desk", camera: "Camera desk", guitar: "Guitar", dumbbells: "Dumbbells", mirror: "Mirror", ringLight: "Ring light",
  dog: "Simba", bigSofa: "Sectional", sofa: "Sofa", jacuzzi: "Jacuzzi", homeCinema: "Home cinema", poolTable: "Pool table", fridge: "Fridge",
  plant: "Plant", art: "Art", kikoy: "Kikoy", lamp: "Lamp", chandelier: "Chandelier", generator: "Generator", solar: "Solar inverter", waterTank: "Water tank", plasticChairs: "Plastic chairs",
};
const labelFor = (obj: string) => OBJ_LABEL[obj] ?? obj;
