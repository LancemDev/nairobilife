import { AREAS, ESTATES, VENUES } from "@/game/data";

/** World units per map unit (area coordinates run 0–100). */
export const SCALE = 2;
export const toWorld = (x: number, y: number): [number, number] => [(x - 50) * SCALE, (y - 50) * SCALE];

export type CityId = "nairobi" | "mombasa" | "kisumu";

export interface Building {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  rot: number;
  color: string;
  /** Pitched roof colour; flat-roofed towers leave it out. */
  roof?: string;
}

export interface Tree {
  x: number;
  z: number;
  s: number;
  palm?: boolean;
}

export interface Road {
  a: [number, number];
  b: [number, number];
  w: number;
}

export interface Patch {
  x: number;
  z: number;
  r: number;
  color: string;
}

export type LandmarkKind = "tower" | "mall" | "market" | "club" | "hospital" | "church" | "mosque" | "stadium" | "terminal" | "campus" | "park" | "civic" | "restaurant" | "station" | "hotel" | "beach" | "home";

export interface Landmark {
  id: string;
  name: string;
  emoji: string;
  area: string;
  kind: LandmarkKind;
  x: number;
  z: number;
}

export interface City {
  id: CityId;
  half: number;
  roads: Road[];
  buildings: Building[];
  trees: Tree[];
  patches: Patch[];
  water: { x: number; z: number; w: number; d: number; rot: number }[];
  landmarks: Landmark[];
  districts: { name: string; x: number; z: number }[];
  runways: { x: number; z: number; w: number; d: number; rot: number }[];
  turbines: [number, number][];
}

function rngFor(seed: string) {
  let h = [...seed].reduce((n, c) => (n * 33 + c.charCodeAt(0)) >>> 0, 5381);
  return () => ((h = (h * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

const ROOFS = ["#b23a2e", "#8f2d22", "#c2522f", "#3f6e8c", "#2f5d50", "#6b4f3a", "#9a3412", "#475569"];
const WALLS = ["#f1e7d6", "#e8dcc6", "#f5efe6", "#dfd3bf", "#efe3cf", "#e7e0d6"];
const TOWERS = ["#9fb6c8", "#c3ccd6", "#7f9bb3", "#d8dee6", "#b6c4d1", "#8aa1b5"];
const STALLS = ["#c8102e", "#0b7a3b", "#f2b705", "#2563eb", "#ec4899", "#f97316"];

/** What each area looks like from above. */
const DISTRICT: Record<string, { kind: "houses" | "towers" | "midrise" | "stalls" | "forest" | "park" | "hills" | "airport" | "villas" | "sparse"; n: number; r: number; patch: string }> = {
  cbd: { kind: "towers", n: 70, r: 12, patch: "#c9ccd1" },
  westlands: { kind: "towers", n: 55, r: 11, patch: "#c9ccd1" },
  upperhill: { kind: "towers", n: 40, r: 9, patch: "#cfd3d8" },
  kilimani: { kind: "midrise", n: 70, r: 11, patch: "#cfdcc0" },
  eastleigh: { kind: "midrise", n: 90, r: 10, patch: "#d8cfbd" },
  gikomba: { kind: "stalls", n: 120, r: 8, patch: "#d6c8ae" },
  eastlands: { kind: "houses", n: 260, r: 17, patch: "#cad7b4" },
  thikaroad: { kind: "houses", n: 160, r: 14, patch: "#cad7b4" },
  ruaka: { kind: "midrise", n: 80, r: 10, patch: "#cfdcc0" },
  karura: { kind: "forest", n: 320, r: 14, patch: "#5f8f4e" },
  southb: { kind: "houses", n: 130, r: 11, patch: "#cad7b4" },
  langata: { kind: "park", n: 160, r: 15, patch: "#a9b97a" },
  karen: { kind: "villas", n: 45, r: 15, patch: "#9cc27f" },
  runda: { kind: "villas", n: 40, r: 11, patch: "#9cc27f" },
  rongai: { kind: "houses", n: 150, r: 13, patch: "#cad7b4" },
  kitengela: { kind: "sparse", n: 110, r: 14, patch: "#d3d7a9" },
  jkia: { kind: "airport", n: 6, r: 14, patch: "#c7cbc5" },
  ngong: { kind: "hills", n: 90, r: 14, patch: "#7fa860" },
};

/** Arterial roads from the CBD, in area coordinates, matching the old 2D map. */
const NAIROBI_ROADS: [number, number][][] = [
  [[50, 47], [36, 35], [33, 13]],
  [[50, 47], [47, 25], [53, 11]],
  [[50, 47], [66, 22], [75, 10]],
  [[50, 47], [74, 47], [92, 50]],
  [[50, 47], [74, 70], [80, 92]],
  [[50, 47], [44, 56], [40, 73], [32, 94]],
  [[44, 56], [34, 52], [22, 78], [8, 90]],
  [[50, 47], [58, 63]],
  [[50, 47], [61, 38]],
  [[36, 35], [34, 52]],
  [[61, 38], [74, 47], [66, 22]],
];

function distToSegment(px: number, pz: number, r: Road) {
  const [ax, az] = r.a;
  const [bx, bz] = r.b;
  const dx = bx - ax;
  const dz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

function landmarkKind(id: string, emoji: string): LandmarkKind {
  if (/jkia|Airport/i.test(id)) return "terminal";
  if (/sgr/i.test(id)) return "station";
  if (/knh/.test(id)) return "hospital";
  if (/church|jeevanjee/.test(id)) return id === "church" ? "church" : "park";
  if (/jamia/.test(id)) return "mosque";
  if (/stadium|desert/.test(id)) return "stadium";
  if (/uon|school|bootcamp|library/.test(id)) return "campus";
  if (/k1|alchemist|outering|namanga|comedy|coastClub/.test(id)) return "club";
  if (/sarit|trm|tworivers|villageMarket|firstAve|hubKaren/.test(id)) return "mall";
  if (/gikomba|kenyattaMarket|eatStreet|kencom|rongaiStage|nganyaStage/.test(id)) return "market";
  if (/karura|park|ngongHills|impala|dunga|pirates/.test(id)) return id === "pirates" || id === "dunga" ? "beach" : "park";
  if (/kicc|milimani|bank|callcentre|techhub|radio|kisumuTown/.test(id)) return "civic";
  if (/carnivore|kibanda|southJoints|riverroad|oldTown/.test(id)) return "restaurant";
  if (/Hotel|nyali/i.test(id)) return "hotel";
  void emoji;
  return "tower";
}

/** Builds the whole city deterministically, so every player sees the same Nairobi. */
export function buildCity(city: CityId, homeEstate: string): City {
  if (city !== "nairobi") return buildTown(city);
  const roads: Road[] = [];
  for (const path of NAIROBI_ROADS)
    for (let i = 0; i < path.length - 1; i++) roads.push({ a: toWorld(...path[i]), b: toWorld(...path[i + 1]), w: 2.2 });

  const areas = AREAS.filter((a) => !a.city);
  const patches: Patch[] = [];
  const buildings: Building[] = [];
  const trees: Tree[] = [];
  const runways: City["runways"] = [];
  const turbines: [number, number][] = [];
  const landmarks: Landmark[] = [];

  // Venue landmarks sit on plazas around each area's centre.
  for (const a of areas) {
    const venues = VENUES.filter((v) => v.area === a.id);
    const [cx, cz] = toWorld(a.x, a.y);
    venues.forEach((v, i) => {
      const ang = (i / Math.max(1, venues.length)) * Math.PI * 2 + 0.6;
      const rad = venues.length === 1 ? 0 : 4.5 + venues.length * 0.35;
      landmarks.push({ id: v.id, name: v.name, emoji: v.emoji, area: a.id, kind: landmarkKind(v.id, v.emoji), x: cx + Math.cos(ang) * rad, z: cz + Math.sin(ang) * rad });
    });
  }
  const home = ESTATES.find((e) => e.id === homeEstate);
  if (home) {
    const [hx, hz] = toWorld(home.x, home.y);
    landmarks.push({ id: "home", name: `Home · ${home.name}`, emoji: "🏠", area: home.area, kind: "home", x: hx, z: hz });
  }

  // Local streets: a cross through each district.
  for (const a of areas) {
    const [cx, cz] = toWorld(a.x, a.y);
    const d = DISTRICT[a.id];
    if (!d || d.kind === "forest" || d.kind === "park" || d.kind === "hills") continue;
    roads.push({ a: [cx - d.r, cz + d.r * 0.35], b: [cx + d.r, cz + d.r * 0.35], w: 1.2 });
    roads.push({ a: [cx - d.r * 0.4, cz - d.r], b: [cx - d.r * 0.4, cz + d.r], w: 1.2 });
  }

  const clear = (x: number, z: number, pad: number) => roads.every((r) => distToSegment(x, z, r) > r.w / 2 + pad) && landmarks.every((l) => Math.hypot(l.x - x, l.z - z) > 3.2);

  for (const a of areas) {
    const d = DISTRICT[a.id];
    if (!d) continue;
    const [cx, cz] = toWorld(a.x, a.y);
    patches.push({ x: cx, z: cz, r: d.r + 2, color: d.patch });
    const rng = rngFor(a.id);
    const spot = () => {
      const ang = rng() * Math.PI * 2;
      const rad = Math.sqrt(rng()) * d.r;
      return [cx + Math.cos(ang) * rad, cz + Math.sin(ang) * rad] as const;
    };
    for (let i = 0; i < d.n * 2 && (d.kind === "airport" ? false : buildings.length + trees.length < 1e5); i++) {
      const [x, z] = spot();
      switch (d.kind) {
        case "houses":
        case "sparse": {
          if (d.kind === "sparse" && rng() < 0.45) break;
          if (!clear(x, z, 0.8)) break;
          const w = 1.4 + rng() * 1;
          buildings.push({ x, z, w, d: w * (0.8 + rng() * 0.4), h: 0.9 + rng() * (d.kind === "sparse" ? 0.6 : 1.4), rot: Math.round(rng() * 4) * (Math.PI / 2) + (rng() - 0.5) * 0.1, color: WALLS[Math.floor(rng() * WALLS.length)], roof: ROOFS[Math.floor(rng() * ROOFS.length)] });
          if (rng() < 0.12) trees.push({ x: x + 1.4, z: z + 1.1, s: 0.7 + rng() * 0.4 });
          break;
        }
        case "towers": {
          if (!clear(x, z, 1.5)) break;
          const w = 2.4 + rng() * 2.6;
          const central = 1 - Math.hypot(x - cx, z - cz) / d.r;
          buildings.push({ x, z, w, d: w * (0.7 + rng() * 0.6), h: 4 + rng() * 6 + central * 16, rot: Math.round(rng() * 4) * (Math.PI / 2), color: TOWERS[Math.floor(rng() * TOWERS.length)] });
          break;
        }
        case "midrise": {
          if (!clear(x, z, 1)) break;
          const w = 2 + rng() * 1.6;
          buildings.push({ x, z, w, d: w * (0.8 + rng() * 0.5), h: 2.5 + rng() * 5, rot: Math.round(rng() * 4) * (Math.PI / 2), color: rng() < 0.5 ? WALLS[Math.floor(rng() * WALLS.length)] : TOWERS[Math.floor(rng() * TOWERS.length)] });
          break;
        }
        case "stalls": {
          if (!clear(x, z, 0.4)) break;
          buildings.push({ x, z, w: 1, d: 1, h: 0.6, rot: (rng() - 0.5) * 0.4, color: "#a1887f", roof: STALLS[Math.floor(rng() * STALLS.length)] });
          break;
        }
        case "villas": {
          if (!clear(x, z, 1.6)) break;
          const w = 2.6 + rng() * 1.4;
          buildings.push({ x, z, w, d: w * 0.8, h: 1.6 + rng() * 0.8, rot: rng() * Math.PI, color: "#f8f5ef", roof: ROOFS[Math.floor(rng() * 3)] });
          for (let t = 0; t < 4; t++) trees.push({ x: x + (rng() - 0.5) * 6, z: z + (rng() - 0.5) * 6, s: 0.9 + rng() * 0.6 });
          break;
        }
        case "forest":
        case "hills":
          if (clear(x, z, 0.3)) trees.push({ x, z, s: 0.8 + rng() * 0.9 });
          break;
        case "park":
          if (rng() < 0.6 && clear(x, z, 0.3)) trees.push({ x, z, s: 0.7 + rng() * 0.6, palm: rng() < 0.2 });
          break;
      }
    }
    if (d.kind === "airport") {
      runways.push({ x: cx + 2, z: cz + 8, w: 30, d: 3.2, rot: -0.25 });
      runways.push({ x: cx - 6, z: cz + 2, w: 3, d: 10, rot: -0.25 });
    }
    if (d.kind === "hills") for (let t = 0; t < 7; t++) turbines.push([cx - 8 + t * 2.8, cz - 6 + (t % 2) * 2]);
  }

  // Street trees along the arterials.
  const rng = rngFor("avenues");
  for (const r of roads.filter((r) => r.w > 2))
    for (let t = 0.1; t < 1; t += 0.08) {
      const x = r.a[0] + (r.b[0] - r.a[0]) * t;
      const z = r.a[1] + (r.b[1] - r.a[1]) * t;
      const nx = -(r.b[1] - r.a[1]);
      const nz = r.b[0] - r.a[0];
      const len = Math.hypot(nx, nz) || 1;
      if (rng() < 0.7) trees.push({ x: x + (nx / len) * 2.2, z: z + (nz / len) * 2.2, s: 0.6 + rng() * 0.3 });
    }

  return {
    id: city,
    half: 105,
    roads,
    buildings,
    trees,
    patches,
    // The Nairobi River, cutting east across town north of the CBD.
    water: [
      { x: -40, z: -8, w: 70, d: 2.4, rot: 0.08 },
      { x: 20, z: -6, w: 50, d: 2.4, rot: -0.12 },
      { x: 62, z: 0, w: 40, d: 2.4, rot: 0.1 },
    ],
    landmarks,
    districts: areas.map((a) => ({ name: a.name, x: toWorld(a.x, a.y)[0], z: toWorld(a.x, a.y)[1] + (DISTRICT[a.id]?.r ?? 10) + 3 })),
    runways,
    turbines,
  };
}

/** Mombasa and Kisumu: a smaller town on the water's edge. */
function buildTown(city: Exclude<CityId, "nairobi">): City {
  const venues = VENUES.filter((v) => v.area === city);
  const rng = rngFor(city);
  const landmarks: Landmark[] = venues.map((v, i) => {
    const ang = (i / venues.length) * Math.PI * 2;
    return { id: v.id, name: v.name, emoji: v.emoji, area: city, kind: landmarkKind(v.id, v.emoji), x: Math.cos(ang) * 16, z: Math.sin(ang) * 12 - 4 };
  });
  const roads: Road[] = [
    { a: [-40, -2], b: [40, -2], w: 2.2 },
    { a: [0, -30], b: [0, 18], w: 2.2 },
    { a: [-30, -18], b: [30, -18], w: 1.2 },
  ];
  const buildings: Building[] = [];
  const trees: Tree[] = [];
  for (let i = 0; i < 260; i++) {
    const x = (rng() - 0.5) * 80;
    const z = -34 + rng() * 52;
    if (roads.some((r) => distToSegment(x, z, r) < r.w / 2 + 0.8) || landmarks.some((l) => Math.hypot(l.x - x, l.z - z) < 4)) continue;
    const w = 1.4 + rng();
    buildings.push({ x, z, w, d: w, h: 1 + rng() * (city === "mombasa" ? 2.5 : 1.6), rot: Math.round(rng() * 4) * (Math.PI / 2), color: city === "mombasa" ? (rng() < 0.5 ? "#f8f5ef" : "#e9dcc3") : WALLS[Math.floor(rng() * WALLS.length)], roof: city === "mombasa" && rng() < 0.6 ? undefined : ROOFS[Math.floor(rng() * ROOFS.length)] });
    if (rng() < 0.25) trees.push({ x: x + 1.5, z: z + 1, s: 0.8, palm: city === "mombasa" });
  }
  return {
    id: city,
    half: 50,
    roads,
    buildings,
    trees,
    patches: [{ x: 0, z: -6, r: 30, color: city === "mombasa" ? "#e8d9b0" : "#cad7b4" }],
    // The Indian Ocean or Lake Victoria fills the south of the board.
    water: [{ x: 0, z: 36, w: 104, d: 30, rot: 0 }],
    landmarks,
    districts: [{ name: city === "mombasa" ? "Mombasa Island" : "Kisumu", x: 0, z: -34 }],
    runways: [{ x: 32, z: -28, w: 24, d: 2.6, rot: 0.1 }],
    turbines: [],
  };
}
