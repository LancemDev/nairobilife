"use client";

import { useId } from "react";
import { DEFAULT_LOOK, LOOK_LABELS, LOOK_OPTIONS, randomLook, sanitizeLook, type Look } from "@/game/look";

/** Layered SVG portrait. `look` may come from the server, so it's sanitised first. */
export function Avatar({ look, size = 48, className = "", ring }: { look?: Partial<Look> | null; size?: number; className?: string; ring?: string }) {
  const l = sanitizeLook(look ?? DEFAULT_LOOK);
  const clip = useId().replace(/:/g, "");
  const shade = "rgba(0,0,0,0.18)";
  const back = { afro: true, braids: true, locs: true, hijab: true } as Record<string, boolean>;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`shrink-0 rounded-full ${className}`} style={ring ? { boxShadow: `0 0 0 3px ${ring}` } : undefined} aria-hidden>
      <clipPath id={clip}>
        <circle cx="50" cy="50" r="50" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <rect width="100" height="100" fill={l.bg} />
        {/* hair behind the head */}
        {back[l.hair] && l.hair === "afro" && <circle cx="50" cy="36" r="27" fill={l.hairColor} />}
        {back[l.hair] && (l.hair === "braids" || l.hair === "locs") && (
          <g fill={l.hairColor}>
            {[30, 36, 42, 58, 64, 70].map((x) => (
              <rect key={x} x={x - (l.hair === "locs" ? 3 : 2)} y="30" width={l.hair === "locs" ? 6 : 4} height="44" rx="3" />
            ))}
          </g>
        )}
        {l.hair === "hijab" && <path d="M24 100 C22 60 28 18 50 18 C72 18 78 60 76 100 Z" fill={l.topColor} />}

        {/* outfit */}
        <path d="M12 100 C12 80 28 70 50 70 C72 70 88 80 88 100 Z" fill={l.top === "hoodie" || l.top === "tee" || l.top === "jersey" || l.top === "kitenge" ? l.topColor : l.top === "blazer" ? "#1f2937" : l.topColor} />
        {l.top === "hoodie" && <path d="M34 72 C38 84 62 84 66 72" stroke={shade} strokeWidth="3" fill="none" />}
        {l.top === "shirt" && <path d="M43 71 L50 82 L57 71" fill="#f5f5f4" />}
        {l.top === "blazer" && (
          <>
            <path d="M42 71 L50 90 L58 71 Z" fill="#f5f5f4" />
            <path d="M42 71 L50 90 L40 100 L32 76 Z M58 71 L50 90 L60 100 L68 76 Z" fill={l.topColor} opacity="0.85" />
          </>
        )}
        {l.top === "jersey" && <path d="M12 88 L88 88 L88 94 L12 94 Z" fill="#c8102e" />}
        {l.top === "kitenge" && (
          <g fill="#1b1612" opacity="0.55">
            {[22, 36, 50, 64, 78].map((x, i) => (
              <circle key={x} cx={x} cy={i % 2 ? 86 : 94} r="3.5" />
            ))}
            {[29, 43, 57, 71].map((x, i) => (
              <rect key={x} x={x - 2} y={i % 2 ? 90 : 80} width="4" height="4" transform={`rotate(45 ${x} ${i % 2 ? 92 : 82})`} />
            ))}
          </g>
        )}

        {/* neck, head, ears */}
        <rect x="43" y="56" width="14" height="17" rx="5" fill={l.skin} />
        <rect x="43" y="64" width="14" height="5" fill={shade} />
        <circle cx="33" cy="46" r="4" fill={l.skin} />
        <circle cx="67" cy="46" r="4" fill={l.skin} />
        <ellipse cx="50" cy="44" rx="17" ry="20" fill={l.skin} />

        {/* face */}
        <g fill="#1b1612">
          <circle cx="44" cy="45" r="1.9" />
          <circle cx="56" cy="45" r="1.9" />
        </g>
        <path d="M41 39.5 Q44 38 47 39.5 M53 39.5 Q56 38 59 39.5" stroke="#1b1612" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <path d="M44.5 53 Q50 57.5 55.5 53" stroke="#1b1612" strokeWidth="1.6" fill="none" strokeLinecap="round" />

        {/* hair in front */}
        {l.hair === "fade" && <path d="M33 41 C32 21 68 21 67 41 C64 32 36 32 33 41 Z" fill={l.hairColor} />}
        {l.hair === "afro" && <path d="M31 40 C30 26 70 26 69 40 C64 31 36 31 31 40 Z" fill={l.hairColor} />}
        {(l.hair === "braids" || l.hair === "locs" || l.hair === "cornrows") && (
          <>
            <path d="M32 42 C31 20 69 20 68 42 C64 30 36 30 32 42 Z" fill={l.hairColor} />
            {l.hair === "cornrows" && <path d="M40 25 L38 36 M46 23 L45 34 M54 23 L55 34 M60 25 L62 36" stroke={shade} strokeWidth="1.5" />}
          </>
        )}
        {l.hair === "bun" && (
          <>
            <circle cx="50" cy="19" r="8" fill={l.hairColor} />
            <path d="M33 41 C32 21 68 21 67 41 C64 31 36 31 33 41 Z" fill={l.hairColor} />
          </>
        )}
        {l.hair === "hijab" && <path d="M31 44 C30 18 70 18 69 44 C66 30 34 30 31 44 Z" fill={l.topColor} stroke={shade} strokeWidth="0.8" />}
        {l.hair === "cap" && (
          <>
            <path d="M32 36 C32 18 68 18 68 36 Z" fill={l.topColor} />
            <path d="M48 34 L80 34 C80 38 66 39 48 38 Z" fill={l.topColor} stroke={shade} strokeWidth="1" />
          </>
        )}
        {l.hair === "bald" && <ellipse cx="44" cy="30" rx="5" ry="2.5" fill="#fff" opacity="0.18" />}

        {/* extras */}
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
        {l.extra === "chain" && <path d="M38 72 Q50 86 62 72" stroke="#f2b705" strokeWidth="2.2" fill="none" />}
        {l.extra === "beads" && (
          <g fill="none" strokeWidth="2.6">
            <path d="M36 72 Q50 84 64 72" stroke="#c8102e" />
            <path d="M33 74 Q50 90 67 74" stroke="#2563eb" />
            <path d="M30 77 Q50 96 70 77" stroke="#f2b705" />
          </g>
        )}
      </g>
    </svg>
  );
}

/** Pick-a-swatch editor for every part of the look. */
export function AvatarBuilder({ look, onChange }: { look: Look; onChange: (l: Look) => void }) {
  const set = <K extends keyof Look>(k: K, v: Look[K]) => onChange({ ...look, [k]: v });
  const color = (k: "skin" | "hairColor" | "topColor" | "bg", label: string) => (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {LOOK_OPTIONS[k].map((c) => (
          <button key={c} onClick={() => set(k, c)} aria-label={`${label} ${c}`} aria-pressed={look[k] === c} className={`h-8 w-8 rounded-full border-2 transition ${look[k] === c ? "scale-110 border-foreground" : "border-line"}`} style={{ background: c }} />
        ))}
      </div>
    </div>
  );
  const choice = (k: "hair" | "top" | "extra", label: string) => (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {LOOK_OPTIONS[k].map((v) => (
          <button key={v} onClick={() => set(k, v)} aria-pressed={look[k] === v} className={`flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2.5 text-xs font-semibold transition ${look[k] === v ? "border-foreground bg-sun/40" : "border-line bg-card"}`}>
            <Avatar look={{ ...look, [k]: v }} size={26} />
            {LOOK_LABELS[v]}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-2">
        <Avatar look={look} size={132} />
        <button onClick={() => onChange(randomLook())} className="rounded-full border border-line px-3 py-1 text-sm font-semibold hover:border-foreground">
          🎲 Random
        </button>
      </div>
      <div className="space-y-3">
        {color("skin", "Skin")}
        {choice("hair", "Hair")}
        {color("hairColor", "Hair colour")}
        {choice("top", "Outfit")}
        {color("topColor", "Outfit colour")}
        {choice("extra", "Extras")}
        {color("bg", "Background")}
      </div>
    </div>
  );
}
