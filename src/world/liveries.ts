/** Nganya liveries, after the real ones on each route (see docs/nairobi-culture-research.md). */
export interface Livery {
  name: string;
  route: string;
  base: [string, string];
  ink: string;
  accent: string;
  led: string;
  motif: "wick" | "lions" | "stripes" | "dollars" | "bee" | "graffiti";
}

export const LIVERIES: Livery[] = [
  { name: "BABA YAGA", route: "Rongai · 125", base: ["#151515", "#e9dcc3"], ink: "#f5f0e6", accent: "#c8102e", led: "#ff2d55", motif: "wick" },
  { name: "DETROIT", route: "Rongai · 125", base: ["#0b4fa8", "#f5f7fa"], ink: "#ffffff", accent: "#9ca3af", led: "#38bdf8", motif: "lions" },
  { name: "OPPOSITE", route: "Umoja · 35", base: ["#c8102e", "#ffffff"], ink: "#ffffff", accent: "#111111", led: "#ff3b30", motif: "stripes" },
  { name: "MONEYFEST", route: "Ngong Rd · 111", base: ["#0b6b3a", "#0f2e1c"], ink: "#f2b705", accent: "#d4f5d0", led: "#22c55e", motif: "dollars" },
  { name: "BUMBLEBEE", route: "Thika Rd · 45", base: ["#f2b705", "#111111"], ink: "#111111", accent: "#ffffff", led: "#facc15", motif: "bee" },
  { name: "MOOD", route: "Rongai · 125", base: ["#5b21b6", "#ec4899"], ink: "#ffffff", accent: "#22d3ee", led: "#d946ef", motif: "graffiti" },
];

/** Which nganya you're likely to catch, by the area you're leaving or heading to. */
export function liveryFor(area: string, seed = 0): Livery | null {
  const pool = /rongai/.test(area) ? [0, 1, 5] : /eastlands|umoja|kayole|buru|pipeline/.test(area) ? [2, 0] : /thika|roysambu|kasarani|githurai/.test(area) ? [4] : /ngong/.test(area) ? [3] : null;
  return pool ? LIVERIES[pool[Math.abs(seed) % pool.length]] : null;
}

