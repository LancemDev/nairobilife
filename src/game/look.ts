/** Layered avatar description, shared by the avatar renderer and the server's validation. */
export interface Look {
  skin: string;
  hair: string;
  hairColor: string;
  top: string;
  topColor: string;
  bottom: string;
  bottomColor: string;
  shoes: string;
  extra: string;
  bg: string;
}

export const LOOK_OPTIONS = {
  skin: ["#3b2219", "#5a3825", "#7a4a2e", "#9a6440", "#b98159", "#d9a77c"],
  hair: ["fade", "afro", "braids", "locs", "bun", "cornrows", "bald", "hijab", "cap"],
  hairColor: ["#141010", "#3d2314", "#7b4a2a", "#c9a25a", "#b8322a", "#6f42c1"],
  top: ["tee", "hoodie", "shirt", "kitenge", "jersey", "blazer", "dress"],
  topColor: ["#0b7a3b", "#c8102e", "#1b1612", "#f2b705", "#2563eb", "#ec4899", "#f5f5f4", "#7c3aed"],
  bottom: ["jeans", "trousers", "shorts", "skirt", "maxi"],
  bottomColor: ["#1e3a8a", "#1b1612", "#6b4f3a", "#d6c7ae", "#0b7a3b", "#c8102e", "#f5f5f4", "#7c3aed"],
  shoes: ["sneakers", "official", "sandals", "boots"],
  extra: ["none", "glasses", "shades", "earrings", "chain", "beads"],
  bg: ["#f2b705", "#bfe3c8", "#f8c9cf", "#c7dcf7", "#e9dcc3", "#d8c8f0"],
} as const satisfies Record<keyof Look, readonly string[]>;

export const LOOK_LABELS: Record<string, string> = {
  fade: "Fade", afro: "Afro", braids: "Braids", locs: "Locs", bun: "Bun", cornrows: "Cornrows", bald: "Bald", hijab: "Hijab", cap: "Cap",
  tee: "Tee", hoodie: "Hoodie", shirt: "Shirt", kitenge: "Kitenge", jersey: "Harambee Stars jersey", blazer: "Blazer", dress: "Dress",
  jeans: "Jeans", trousers: "Trousers", shorts: "Shorts", skirt: "Skirt", maxi: "Maxi skirt",
  sneakers: "Sneakers", official: "Official shoes", sandals: "Sandals", boots: "Boots",
  none: "None", glasses: "Glasses", shades: "Shades", earrings: "Earrings", chain: "Chain", beads: "Maasai beads",
};

export const DEFAULT_LOOK: Look = { skin: LOOK_OPTIONS.skin[2], hair: "fade", hairColor: LOOK_OPTIONS.hairColor[0], top: "tee", topColor: LOOK_OPTIONS.topColor[0], bottom: "jeans", bottomColor: LOOK_OPTIONS.bottomColor[0], shoes: "sneakers", extra: "none", bg: LOOK_OPTIONS.bg[0] };

/** Keeps only known values; anything else falls back to the default. */
export function sanitizeLook(input: unknown): Look {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const out = { ...DEFAULT_LOOK };
  for (const key of Object.keys(LOOK_OPTIONS) as (keyof Look)[]) {
    const v = src[key];
    if (typeof v === "string" && (LOOK_OPTIONS[key] as readonly string[]).includes(v)) out[key] = v;
  }
  return out;
}

export function randomLook(rng: () => number = Math.random): Look {
  const pick = <T>(list: readonly T[]) => list[Math.floor(rng() * list.length)];
  return { skin: pick(LOOK_OPTIONS.skin), hair: pick(LOOK_OPTIONS.hair), hairColor: pick(LOOK_OPTIONS.hairColor), top: pick(LOOK_OPTIONS.top), topColor: pick(LOOK_OPTIONS.topColor), bottom: pick(LOOK_OPTIONS.bottom), bottomColor: pick(LOOK_OPTIONS.bottomColor), shoes: pick(LOOK_OPTIONS.shoes), extra: pick(LOOK_OPTIONS.extra), bg: pick(LOOK_OPTIONS.bg) };
}
