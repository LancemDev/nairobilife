"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Vector2, type Group, type Object3D } from "three";
import { sanitizeLook, type Look } from "@/game/look";

const SPEED = 2.4;
const LONG_SLEEVES = new Set(["hoodie", "shirt", "blazer", "kitenge"]);

export type Pose = "stand" | "sleep" | "sit" | "use" | "walk";

/** Silhouette per body type: radii at hip, waist, chest and shoulder (metres). */
const BODY: Record<string, { hip: number; waist: number; chest: number; shoulder: number; limb: number }> = {
  average: { hip: 0.16, waist: 0.135, chest: 0.165, shoulder: 0.19, limb: 1 },
  slim: { hip: 0.145, waist: 0.12, chest: 0.15, shoulder: 0.175, limb: 0.9 },
  curvy: { hip: 0.195, waist: 0.13, chest: 0.18, shoulder: 0.18, limb: 1.08 },
  broad: { hip: 0.17, waist: 0.16, chest: 0.2, shoulder: 0.23, limb: 1.15 },
};

function Mat({ c, rough = 0.75 }: { c: string; rough?: number }) {
  return <meshStandardMaterial color={c} roughness={rough} />;
}

/** A capsule hanging down from its top, so it rotates around a joint. */
function Limb({ len, r, c, top }: { len: number; r: number; c: string; top?: number }) {
  return (
    <mesh position={[0, -len / 2, 0]} castShadow>
      <capsuleGeometry args={[top ?? r, len - r * 2, 6, 14]} />
      <Mat c={c} />
    </mesh>
  );
}

/**
 * A walking, posable 3D person built from smooth shapes: a lathed torso with waist and hips,
 * jointed arms and legs, and a face. It moves itself toward `target` and calls `onArrive`.
 */
export function Character({
  look,
  start,
  target,
  anchor,
  onArrive,
  onClick,
  busy,
  pose = "stand",
  poseAt,
}: {
  look?: Partial<Look> | null;
  start: [number, number];
  target?: [number, number] | null;
  /** Registers the character's root so the DOM label layer can follow it. */
  anchor?: (obj: Object3D | null) => void;
  onArrive?: () => void;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  busy?: boolean;
  pose?: Pose;
  /** Where to be while posing (e.g. the middle of the bed), with the facing angle and seat height. */
  poseAt?: { x: number; z: number; rot: number; y: number } | null;
}) {
  const l = sanitizeLook(look);
  const b = BODY[l.body] ?? BODY.average;
  const root = useRef<Group | null>(null);
  const body = useRef<Group>(null);
  const thighs = [useRef<Group>(null), useRef<Group>(null)];
  const knees = [useRef<Group>(null), useRef<Group>(null)];
  const arms = [useRef<Group>(null), useRef<Group>(null)];
  const elbows = [useRef<Group>(null), useRef<Group>(null)];
  const arrived = useRef(true);
  const lastTarget = useRef("");

  // Torso profile from hips to shoulders, spun into a smooth body.
  const torso = useMemo(
    () => [new Vector2(0.02, 0), new Vector2(b.hip, 0.03), new Vector2(b.hip * 0.98, 0.1), new Vector2(b.waist, 0.22), new Vector2(b.chest, 0.36), new Vector2(b.chest * 0.98, 0.44), new Vector2(b.shoulder * 0.9, 0.5), new Vector2(0.07, 0.56)],
    [b],
  );

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    const key = target ? target.join(",") : "";
    if (key !== lastTarget.current) {
      lastTarget.current = key;
      arrived.current = !target;
    }
    let walking = pose === "walk";
    if (walking) {
      // Walking in place: the world moves past instead (travel rides).
      if (poseAt) g.rotation.y = poseAt.rot;
    } else if (pose !== "stand" && poseAt) {
      // Slide into the bed or seat.
      g.position.x += (poseAt.x - g.position.x) * Math.min(1, dt * 6);
      g.position.z += (poseAt.z - g.position.z) * Math.min(1, dt * 6);
      g.rotation.y = poseAt.rot;
    } else if (target) {
      const dx = target[0] - g.position.x;
      const dz = target[1] - g.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.05) {
        const step = Math.min(dist, SPEED * dt);
        g.position.x += (dx / dist) * step;
        g.position.z += (dz / dist) * step;
        g.rotation.y = Math.atan2(dx, dz);
        walking = true;
      } else if (!arrived.current) {
        arrived.current = true;
        onArrive?.();
      }
    }

    const t = state.clock.elapsedTime;
    const swing = walking ? Math.sin(t * 9) * 0.55 : 0;
    const bd = body.current;
    if (bd) {
      // Lying down: tip the whole body back onto the bed. Sitting: drop the hips to the seat.
      const lying = pose === "sleep";
      const seatY = poseAt?.y ?? 0.45;
      bd.rotation.x += ((lying ? -Math.PI / 2 : 0) - bd.rotation.x) * Math.min(1, dt * 6);
      // Lying: the root sits at the foot of the bed, so only lift onto the mattress.
      // Sitting: drop the hips (0.92 m when standing) onto the seat.
      const y = lying ? seatY + 0.1 : pose === "sit" ? seatY + 0.05 - 0.92 : walking ? Math.abs(Math.sin(t * 9)) * 0.03 : Math.sin(t * 1.6) * 0.004;
      bd.position.y += (y - bd.position.y) * Math.min(1, dt * 8);
    }
    thighs.forEach((th, i) => {
      if (!th.current) return;
      const sitting = pose === "sit";
      th.current.rotation.x = sitting ? -1.45 : (i ? -swing : swing);
    });
    knees.forEach((kn, i) => {
      if (!kn.current) return;
      const sitting = pose === "sit";
      const back = Math.max(0, i ? swing : -swing);
      kn.current.rotation.x = sitting ? 1.45 : back * 1.1;
    });
    arms.forEach((ar, i) => {
      if (!ar.current) return;
      const using = pose === "use" || (busy && pose === "stand");
      ar.current.rotation.x = using ? -0.9 + Math.sin(t * 6 + i) * 0.15 : pose === "sleep" ? 0 : (i ? swing : -swing) * 0.8;
      ar.current.rotation.z = (i ? -1 : 1) * (pose === "sleep" ? 0.15 : 0.08);
    });
    elbows.forEach((el) => {
      if (!el.current) return;
      el.current.rotation.x = pose === "use" || busy ? -0.7 : walking ? -0.25 : -0.12;
    });
  });

  const dress = l.top === "dress";
  const sleeve = LONG_SLEEVES.has(l.top) ? l.topColor : l.skin;
  const upperArm = dress ? l.skin : l.topColor;
  const pants = !dress && (l.bottom === "jeans" || l.bottom === "trousers");
  const thighColor = pants || (!dress && l.bottom === "shorts") ? l.bottomColor : l.skin;
  const shinColor = pants ? l.bottomColor : l.skin;
  const shoe = { sneakers: "#f5f5f4", official: "#1b1612", sandals: "#6b4f3a", boots: "#5a3825" }[l.shoes] ?? "#f5f5f4";
  const limb = 0.055 * b.limb;
  const hipY = 0.92;

  return (
    <group
      ref={(g) => {
        root.current = g;
        anchor?.(g);
      }}
      position={[start[0], 0, start[1]]}
      onClick={onClick}
      onPointerOver={() => onClick && (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <group ref={body}>
        {/* legs: hip → knee → foot */}
        {[-1, 1].map((side, i) => (
          <group key={side} ref={thighs[i]} position={[side * (b.hip * 0.5), hipY, 0]}>
            <Limb len={0.44} r={limb * 1.25} c={thighColor} />
            <group ref={knees[i]} position={[0, -0.43, 0]}>
              <Limb len={0.44} r={limb * 0.95} c={shinColor} />
              <mesh position={[0, -0.44, 0.05]} castShadow>
                <capsuleGeometry args={[0.045, 0.12, 4, 10]} />
                <Mat c={shoe} />
              </mesh>
            </group>
          </group>
        ))}

        {/* skirts and dresses hang from the waist */}
        {!dress && l.bottom === "skirt" && (
          <mesh position={[0, hipY - 0.12, 0]} castShadow>
            <cylinderGeometry args={[b.hip * 1.05, b.hip * 1.45, 0.38, 20, 1, true]} />
            <meshStandardMaterial color={l.bottomColor} side={2} />
          </mesh>
        )}
        {!dress && l.bottom === "maxi" && (
          <mesh position={[0, hipY - 0.42, 0]} castShadow>
            <cylinderGeometry args={[b.hip * 1.05, b.hip * 1.8, 0.95, 20, 1, true]} />
            <meshStandardMaterial color={l.bottomColor} side={2} />
          </mesh>
        )}
        {dress && (
          <mesh position={[0, hipY - 0.2, 0]} castShadow>
            <cylinderGeometry args={[b.hip * 1.05, b.hip * 1.6, 0.5, 20, 1, true]} />
            <meshStandardMaterial color={l.topColor} side={2} />
          </mesh>
        )}

        {/* torso: lathed, flattened front-to-back */}
        <mesh position={[0, hipY - 0.04, 0]} scale={[1, 1, 0.72]} castShadow>
          <latheGeometry args={[torso, 24]} />
          <Mat c={l.topColor} rough={0.8} />
        </mesh>
        {pants && (
          <mesh position={[0, hipY + 0.02, 0]} scale={[1, 1, 0.72]} castShadow>
            <cylinderGeometry args={[b.hip * 1.01, b.hip * 1.01, 0.12, 24]} />
            <Mat c={l.bottomColor} />
          </mesh>
        )}
        {l.top === "jersey" && (
          <mesh position={[0, hipY + 0.32, 0]} scale={[1, 1, 0.73]}>
            <cylinderGeometry args={[b.chest * 1.005, b.chest * 1.005, 0.05, 24]} />
            <Mat c="#c8102e" />
          </mesh>
        )}

        {/* arms: shoulder → elbow → hand */}
        {[-1, 1].map((side, i) => (
          <group key={side} ref={arms[i]} position={[side * (b.shoulder + 0.02), hipY + 0.46, 0]}>
            <Limb len={0.3} r={limb * 1.05} c={upperArm} />
            <group ref={elbows[i]} position={[0, -0.29, 0]}>
              <Limb len={0.27} r={limb * 0.9} c={sleeve} />
              <mesh position={[0, -0.3, 0.01]} castShadow>
                <sphereGeometry args={[0.05, 12, 10]} />
                <Mat c={l.skin} />
              </mesh>
            </group>
          </group>
        ))}

        {/* neck and head */}
        <mesh position={[0, hipY + 0.58, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 0.12, 12]} />
          <Mat c={l.skin} />
        </mesh>
        <group position={[0, hipY + 0.76, 0]}>
          <mesh scale={[0.9, 1.05, 0.95]} castShadow>
            <sphereGeometry args={[0.13, 24, 18]} />
            <Mat c={l.skin} rough={0.6} />
          </mesh>
          {/* face */}
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.042, 0.015, 0.112]}>
              <mesh scale={[1, 0.75, 0.5]}>
                <sphereGeometry args={[0.018, 10, 8]} />
                <Mat c="#f8fafc" rough={0.3} />
              </mesh>
              <mesh position={[0, 0, 0.006]}>
                <sphereGeometry args={[0.009, 8, 6]} />
                <Mat c="#1b1612" rough={0.2} />
              </mesh>
              <mesh position={[0, 0.03, 0]} rotation={[0, 0, side * -0.15]}>
                <boxGeometry args={[0.035, 0.007, 0.01]} />
                <Mat c="#1b1612" />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -0.02, 0.122]} scale={[0.8, 1, 1]}>
            <sphereGeometry args={[0.018, 10, 8]} />
            <Mat c={l.skin} rough={0.6} />
          </mesh>
          <mesh position={[0, -0.06, 0.112]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.006, 0.035, 4, 8]} />
            <Mat c="#5b2a1f" />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.118, 0, 0]} scale={[0.5, 1, 0.8]}>
              <sphereGeometry args={[0.03, 10, 8]} />
              <Mat c={l.skin} />
            </mesh>
          ))}
          <Hair l={l} />
          {(l.extra === "glasses" || l.extra === "shades") && (
            <mesh position={[0, 0.016, 0.125]}>
              <boxGeometry args={[0.13, 0.03, 0.01]} />
              <meshStandardMaterial color={l.extra === "shades" ? "#111" : "#3f3f46"} transparent opacity={l.extra === "shades" ? 0.95 : 0.6} />
            </mesh>
          )}
          {l.extra === "earrings" &&
            [-1, 1].map((side) => (
              <mesh key={side} position={[side * 0.12, -0.04, 0]}>
                <torusGeometry args={[0.015, 0.004, 6, 12]} />
                <Mat c="#f2b705" rough={0.3} />
              </mesh>
            ))}
        </group>
        {l.extra === "chain" && (
          <mesh position={[0, hipY + 0.47, 0.05]} rotation={[Math.PI / 2.4, 0, 0]}>
            <torusGeometry args={[0.07, 0.006, 6, 20]} />
            <Mat c="#f2b705" rough={0.3} />
          </mesh>
        )}
        {l.extra === "beads" && (
          <mesh position={[0, hipY + 0.48, 0.03]} rotation={[Math.PI / 2.2, 0, 0]}>
            <torusGeometry args={[0.085, 0.014, 6, 24]} />
            <Mat c="#c8102e" />
          </mesh>
        )}
      </group>
    </group>
  );
}

function Hair({ l }: { l: Look }) {
  const c = l.hairColor;
  switch (l.hair) {
    case "bald":
      return null;
    case "afro":
      return (
        <mesh position={[0, 0.05, -0.02]} castShadow>
          <sphereGeometry args={[0.18, 18, 14]} />
          <Mat c={c} rough={1} />
        </mesh>
      );
    case "bun":
      return (
        <>
          <Cap c={c} />
          <mesh position={[0, 0.15, -0.04]}>
            <sphereGeometry args={[0.055, 12, 10]} />
            <Mat c={c} rough={1} />
          </mesh>
        </>
      );
    case "braids":
    case "locs":
      return (
        <>
          <Cap c={c} />
          {[-0.08, -0.04, 0, 0.04, 0.08].map((x) => (
            <mesh key={x} position={[x, -0.12, -0.09]} castShadow>
              <capsuleGeometry args={[l.hair === "locs" ? 0.016 : 0.01, 0.28, 4, 6]} />
              <Mat c={c} rough={1} />
            </mesh>
          ))}
        </>
      );
    case "hijab":
      return (
        <>
          <mesh position={[0, 0.01, -0.025]} scale={[1, 1.1, 1]} castShadow>
            <sphereGeometry args={[0.148, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            <meshStandardMaterial color={l.topColor} side={2} />
          </mesh>
          <mesh position={[0, -0.15, -0.02]} castShadow>
            <cylinderGeometry args={[0.1, 0.2, 0.2, 18, 1, true]} />
            <meshStandardMaterial color={l.topColor} side={2} />
          </mesh>
        </>
      );
    case "cap":
      return (
        <>
          <mesh position={[0, 0.06, 0]} scale={[1, 0.7, 1]} castShadow>
            <sphereGeometry args={[0.135, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Mat c={l.topColor} />
          </mesh>
          <mesh position={[0, 0.06, 0.13]} rotation={[0.15, 0, 0]}>
            <boxGeometry args={[0.16, 0.012, 0.1]} />
            <Mat c={l.topColor} />
          </mesh>
        </>
      );
    default:
      return <Cap c={c} />;
  }
}

/** Short hair: a cap that hugs the top and back of the head. */
function Cap({ c }: { c: string }) {
  return (
    <mesh position={[0, 0.02, -0.01]} scale={[0.93, 1.05, 0.98]} castShadow>
      <sphereGeometry args={[0.135, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.48]} />
      <Mat c={c} rough={1} />
    </mesh>
  );
}
