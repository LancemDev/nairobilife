"use client";

import { useId } from "react";
import { DEFAULT_LOOK, LOOK_LABELS, LOOK_OPTIONS, randomLook, sanitizeLook, type Look } from "@/game/look";

const SHADE = "rgba(0,0,0,0.18)";
const LONG_SLEEVES = new Set(["hoodie", "shirt", "blazer", "kitenge"]);
/** The head was drawn on a 100×100 portrait; this maps it onto the full body's head position. */
const HEAD = "translate(9 -4) scale(0.82)";

/**
 * Full-body SVG character on a 100×200 canvas. `variant="head"` crops the same drawing to a round
 * head-and-shoulders badge for lists, chats and the HUD. `look` may come from the server, so it's
 * sanitised first.
 */
export function Avatar({ look, size = 48, className = "", ring, variant = "head" }: { look?: Partial<Look> | null; size?: number; className?: string; ring?: string; variant?: "head" | "full" }) {
  const l = sanitizeLook(look ?? DEFAULT_LOOK);
  const clip = useId().replace(/:/g, "");
  const full = variant === "full";
  return (
    <svg
      viewBox={full ? "0 0 100 200" : "24 4 52 52"}
      width={size}
      height={full ? size * 2 : size}
      className={`shrink-0 ${full ? "rounded-2xl" : "rounded-full"} ${className}`}
      style={ring ? { boxShadow: `0 0 0 3px ${ring}` } : undefined}
      aria-hidden
    >
      <clipPath id={clip}>{full ? <rect width="100" height="200" rx="14" /> : <circle cx="50" cy="30" r="26" />}</clipPath>
      <g clipPath={`url(#${clip})`}>
        <rect x="0" y="0" width="100" height="200" fill={l.bg} />
        {full && <ellipse cx="50" cy="187" rx="30" ry="4.5" fill={SHADE} />}
        <g transform={HEAD}>
          <BackHair l={l} />
        </g>
        <Body l={l} />
        <g transform={HEAD}>
          <Head l={l} />
        </g>
      </g>
    </svg>
  );
}

function BackHair({ l }: { l: Look }) {
  if (l.hair === "afro") return <circle cx="50" cy="36" r="27" fill={l.hairColor} />;
  if (l.hair === "braids" || l.hair === "locs")
    return (
      <g fill={l.hairColor}>
        {[30, 36, 42, 58, 64, 70].map((x) => (
          <rect key={x} x={x - (l.hair === "locs" ? 3 : 2)} y="30" width={l.hair === "locs" ? 6 : 4} height="52" rx="3" />
        ))}
      </g>
    );
  return null;
}

function Body({ l }: { l: Look }) {
  const dress = l.top === "dress";
  const long = LONG_SLEEVES.has(l.top);
  const legTop = dress ? 146 : l.bottom === "shorts" ? 136 : l.bottom === "skirt" ? 146 : 108;
  return (
    <g>
      {/* arms: behind the torso so shoulders blend */}
      {[
        { x: 21, rot: "rotate(8 30 58)", hand: 26 },
        { x: 68, rot: "rotate(-8 70 58)", hand: 74 },
      ].map((a) => (
        <g key={a.x} transform={a.rot}>
          <rect x={a.x} y="55" width="11" height={long ? 52 : 20} rx="5" fill={dress ? l.skin : l.topColor} />
          {!long && <rect x={a.x + 1} y="70" width="9" height="38" rx="4.5" fill={l.skin} />}
          <circle cx={a.hand + 0.5} cy="111" r="5" fill={l.skin} />
        </g>
      ))}

      {/* legs (skin shows below shorts and skirts) */}
      {l.bottom !== "maxi" || dress ? (
        <g fill={l.skin}>
          <rect x="34" y={legTop} width="13" height={178 - legTop} rx="5" />
          <rect x="53" y={legTop} width="13" height={178 - legTop} rx="5" />
        </g>
      ) : null}

      {/* bottoms */}
      {!dress && (l.bottom === "jeans" || l.bottom === "trousers") && (
        <g fill={l.bottomColor}>
          <rect x="31" y="104" width="18" height="74" rx="4" />
          <rect x="51" y="104" width="18" height="74" rx="4" />
          <rect x="30" y="104" width="40" height="14" rx="3" />
          {l.bottom === "jeans" && <path d="M40 120 L40 176 M60 120 L60 176" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />}
          {l.bottom === "trousers" && <path d="M40 112 L40 176 M60 112 L60 176" stroke={SHADE} strokeWidth="0.8" />}
        </g>
      )}
      {!dress && l.bottom === "shorts" && (
        <g fill={l.bottomColor}>
          <rect x="30" y="104" width="40" height="14" rx="3" />
          <rect x="31" y="104" width="18" height="34" rx="4" />
          <rect x="51" y="104" width="18" height="34" rx="4" />
        </g>
      )}
      {!dress && l.bottom === "skirt" && <path d="M30 104 L70 104 L77 148 L23 148 Z" fill={l.bottomColor} />}
      {!dress && l.bottom === "maxi" && <path d="M30 104 L70 104 L79 180 L21 180 Z" fill={l.bottomColor} />}

      {/* shoes */}
      <Shoes l={l} />

      {/* torso */}
      {dress ? (
        <path d="M33 60 C33 53 41 51 50 51 C59 51 67 53 67 60 L70 104 L79 150 L21 150 L30 104 Z" fill={l.topColor} />
      ) : (
        <path d="M31 60 C31 53 40 51 50 51 C60 51 69 53 69 60 L71 110 L29 110 Z" fill={l.topColor} />
      )}
      {l.top === "hoodie" && (
        <>
          <path d="M38 53 C40 64 60 64 62 53" stroke={SHADE} strokeWidth="2.5" fill="none" />
          <rect x="38" y="88" width="24" height="12" rx="3" fill={SHADE} />
          <path d="M46 58 L45 70 M54 58 L55 70" stroke="#f5f5f4" strokeWidth="1" />
        </>
      )}
      {l.top === "shirt" && (
        <>
          <path d="M43 51 L50 62 L57 51" fill="#f5f5f4" />
          <g fill={SHADE}>
            {[70, 80, 90, 100].map((y) => (
              <circle key={y} cx="50" cy={y} r="1" />
            ))}
          </g>
        </>
      )}
      {l.top === "blazer" && (
        <>
          <path d="M42 51 L50 78 L58 51 Z" fill="#f5f5f4" />
          <path d="M42 51 L50 78 L44 90 L35 58 Z M58 51 L50 78 L56 90 L65 58 Z" fill={SHADE} />
        </>
      )}
      {l.top === "jersey" && (
        <>
          <rect x="30" y="76" width="40" height="7" fill="#c8102e" />
          <rect x="30" y="83" width="40" height="2.5" fill="#f5f5f4" />
          <path d="M44 51 L50 57 L56 51" stroke="#f5f5f4" strokeWidth="2" fill="none" />
        </>
      )}
      {(l.top === "kitenge" || l.top === "dress") && (
        <g fill="#1b1612" opacity="0.5">
          {[
            [38, 66],
            [62, 66],
            [50, 80],
            [38, 94],
            [62, 94],
            ...(l.top === "dress" ? [[50, 112], [36, 128], [64, 128], [50, 142]] : []),
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="3" />
          ))}
          {l.top === "kitenge" && <path d="M30 72 L70 72 M30 88 L70 88" stroke="#f2b705" strokeWidth="1.5" />}
        </g>
      )}

      {/* neck */}
      <rect x="45" y="42" width="10" height="13" rx="4" fill={l.skin} />
      <rect x="45" y="49" width="10" height="4" fill={SHADE} />

      {l.extra === "chain" && <path d="M41 53 Q50 66 59 53" stroke="#f2b705" strokeWidth="1.8" fill="none" />}
      {l.extra === "beads" && (
        <g fill="none" strokeWidth="2.2">
          <path d="M40 53 Q50 62 60 53" stroke="#c8102e" />
          <path d="M38 55 Q50 66 62 55" stroke="#2563eb" />
          <path d="M36 57 Q50 70 64 57" stroke="#f2b705" />
        </g>
      )}
    </g>
  );
}

function Shoes({ l }: { l: Look }) {
  const feet = [
    { x: 30, y: 176 },
    { x: 51, y: 176 },
  ];
  return (
    <g>
      {feet.map((f) => {
        switch (l.shoes) {
          case "official":
            return (
              <g key={f.x}>
                <rect x={f.x} y={f.y} width="19" height="7" rx="3.5" fill="#1b1612" />
                <rect x={f.x + 3} y={f.y + 1} width="6" height="1.5" rx="0.75" fill="#fff" opacity="0.35" />
              </g>
            );
          case "sandals":
            return (
              <g key={f.x}>
                <rect x={f.x + 1} y={f.y} width="17" height="6" rx="3" fill={l.skin} />
                <rect x={f.x} y={f.y + 5} width="19" height="2.5" rx="1.25" fill="#6b4f3a" />
                <rect x={f.x + 4} y={f.y + 1} width="10" height="2" rx="1" fill="#6b4f3a" />
              </g>
            );
          case "boots":
            return (
              <g key={f.x}>
                <rect x={f.x + 2} y={f.y - 12} width="15" height="16" rx="3" fill="#5a3825" />
                <rect x={f.x} y={f.y} width="19" height="7.5" rx="3.5" fill="#5a3825" />
                <rect x={f.x} y={f.y + 5.5} width="19" height="2" fill="#1b1612" />
              </g>
            );
          default:
            return (
              <g key={f.x}>
                <rect x={f.x} y={f.y} width="19" height="8" rx="4" fill="#f5f5f4" />
                <rect x={f.x} y={f.y + 6} width="19" height="2" fill="#d6d3d1" />
                <path d={`M${f.x + 5} ${f.y + 4} L${f.x + 14} ${f.y + 2}`} stroke="#c8102e" strokeWidth="1.8" />
              </g>
            );
        }
      })}
    </g>
  );
}

function Head({ l }: { l: Look }) {
  return (
    <g>
      {l.hair === "hijab" && <path d="M24 82 C22 60 28 18 50 18 C72 18 78 60 76 82 Z" fill={l.topColor} />}
      <circle cx="33" cy="46" r="4" fill={l.skin} />
      <circle cx="67" cy="46" r="4" fill={l.skin} />
      <ellipse cx="50" cy="44" rx="17" ry="20" fill={l.skin} />

      <g fill="#1b1612">
        <circle cx="44" cy="45" r="1.9" />
        <circle cx="56" cy="45" r="1.9" />
      </g>
      <path d="M41 39.5 Q44 38 47 39.5 M53 39.5 Q56 38 59 39.5" stroke="#1b1612" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M44.5 53 Q50 57.5 55.5 53" stroke="#1b1612" strokeWidth="1.6" fill="none" strokeLinecap="round" />

      {l.hair === "fade" && <path d="M33 41 C32 21 68 21 67 41 C64 32 36 32 33 41 Z" fill={l.hairColor} />}
      {l.hair === "afro" && <path d="M31 40 C30 26 70 26 69 40 C64 31 36 31 31 40 Z" fill={l.hairColor} />}
      {(l.hair === "braids" || l.hair === "locs" || l.hair === "cornrows") && (
        <>
          <path d="M32 42 C31 20 69 20 68 42 C64 30 36 30 32 42 Z" fill={l.hairColor} />
          {l.hair === "cornrows" && <path d="M40 25 L38 36 M46 23 L45 34 M54 23 L55 34 M60 25 L62 36" stroke={SHADE} strokeWidth="1.5" />}
        </>
      )}
      {l.hair === "bun" && (
        <>
          <circle cx="50" cy="19" r="8" fill={l.hairColor} />
          <path d="M33 41 C32 21 68 21 67 41 C64 31 36 31 33 41 Z" fill={l.hairColor} />
        </>
      )}
      {l.hair === "hijab" && <path d="M31 44 C30 18 70 18 69 44 C66 30 34 30 31 44 Z" fill={l.topColor} stroke={SHADE} strokeWidth="0.8" />}
      {l.hair === "cap" && (
        <>
          <path d="M32 36 C32 18 68 18 68 36 Z" fill={l.topColor} />
          <path d="M48 34 L80 34 C80 38 66 39 48 38 Z" fill={l.topColor} stroke={SHADE} strokeWidth="1" />
        </>
      )}
      {l.hair === "bald" && <ellipse cx="44" cy="30" rx="5" ry="2.5" fill="#fff" opacity="0.18" />}

      {l.extra === "glasses" && (
        <g stroke="#1b1612" strokeWidth="1.4" fill="none">
          <circle cx="44" cy="45" r="5" />
          <circle cx="56" cy="45" r="5" />
          <path d="M49 45 L51 45" />
        </g>
      )}
      {l.extra === "shades" && (
        <g fill="#111">
          <rect x="37.5" y="41" width="11" height="7" rx="3" />
          <rect x="51.5" y="41" width="11" height="7" rx="3" />
          <rect x="48" y="43" width="4" height="1.5" />
        </g>
      )}
      {l.extra === "earrings" && (
        <g fill="#f2b705">
          <circle cx="33" cy="52" r="2.2" />
          <circle cx="67" cy="52" r="2.2" />
        </g>
      )}
    </g>
  );
}

const FULL_PREVIEW = new Set<keyof Look>(["top", "bottom", "shoes"]);

/** Pick-a-swatch editor for every part of the look. */
export function AvatarBuilder({ look, onChange }: { look: Look; onChange: (l: Look) => void }) {
  const set = <K extends keyof Look>(k: K, v: Look[K]) => onChange({ ...look, [k]: v });
  const color = (k: "skin" | "hairColor" | "topColor" | "bottomColor" | "bg", label: string) => (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {LOOK_OPTIONS[k].map((c) => (
          <button key={c} onClick={() => set(k, c)} aria-label={`${label} ${c}`} aria-pressed={look[k] === c} className={`h-8 w-8 rounded-full border-2 transition ${look[k] === c ? "scale-110 border-foreground" : "border-line"}`} style={{ background: c }} />
        ))}
      </div>
    </div>
  );
  const choice = (k: "hair" | "top" | "bottom" | "shoes" | "extra", label: string) => (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {LOOK_OPTIONS[k].map((v) => (
          <button key={v} onClick={() => set(k, v)} aria-pressed={look[k] === v} className={`flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2.5 text-xs font-semibold transition ${look[k] === v ? "border-foreground bg-sun/40" : "border-line bg-card"}`}>
            <Avatar look={{ ...look, [k]: v }} size={FULL_PREVIEW.has(k) ? 16 : 26} variant={FULL_PREVIEW.has(k) ? "full" : "head"} />
            {LOOK_LABELS[v]}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-2 sm:sticky sm:top-16 sm:self-start">
        <Avatar look={look} size={120} variant="full" />
        <button onClick={() => onChange(randomLook())} className="rounded-full border border-line px-3 py-1 text-sm font-semibold hover:border-foreground">
          Random
        </button>
      </div>
      <div className="space-y-3">
        {color("skin", "Skin")}
        {choice("hair", "Hair")}
        {color("hairColor", "Hair colour")}
        {choice("top", "Top")}
        {color("topColor", "Top colour")}
        {choice("bottom", "Bottom")}
        {color("bottomColor", "Bottom colour")}
        {choice("shoes", "Shoes")}
        {choice("extra", "Extras")}
        {color("bg", "Background")}
      </div>
    </div>
  );
}
