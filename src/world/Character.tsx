"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import {
  AnimationMixer,
  Box3,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  LoopRepeat,
  Mesh,
  MeshStandardMaterial,
  Skeleton,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  Vector4,
  type AnimationAction,
  type AnimationClip,
  type Bone,
  type BufferGeometry,
  type Object3D,
  type SkinnedMesh,
} from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { sanitizeLook, type Look } from "@/game/look";

const DIR = "/models/people/";
const SPEED = 1.9;
const LONG_SLEEVES = new Set(["hoodie", "shirt", "blazer", "kitenge", "jersey"]);

export type Pose = "stand" | "sleep" | "sit" | "use" | "walk" | "dance" | "drive";

/** The pack's hairstyles, plus a few shapes we build ourselves. */
const HAIR: Record<string, { file?: string; extra?: "afro" | "hijab" | "cap" }> = {
  fade: { file: "hair_buzzed" },
  afro: { extra: "afro" },
  braids: { file: "hair_long" },
  locs: { file: "hair_long" },
  bun: { file: "hair_buns" },
  cornrows: { file: "hair_buzzedfemale" },
  bald: {},
  hijab: { extra: "hijab" },
  cap: { file: "hair_buzzed", extra: "cap" },
};

/** Bone scales per body type: [bone, width (x/z), length (y)]. Bones grow along local Y. */
const BUILD: Record<string, [string, number, number][]> = {
  average: [["spine_03", 0.92, 1], ["upperarm_l", 0.86, 1], ["upperarm_r", 0.86, 1], ["lowerarm_l", 0.9, 1], ["lowerarm_r", 0.9, 1], ["thigh_l", 0.94, 1], ["thigh_r", 0.94, 1]],
  slim: [["spine_03", 0.84, 1], ["spine_02", 0.9, 1], ["upperarm_l", 0.78, 1], ["upperarm_r", 0.78, 1], ["lowerarm_l", 0.85, 1], ["lowerarm_r", 0.85, 1], ["thigh_l", 0.86, 1], ["thigh_r", 0.86, 1]],
  curvy: [["spine_03", 0.95, 1], ["spine_01", 1.08, 1], ["pelvis", 1.14, 1], ["thigh_l", 1.12, 1], ["thigh_r", 1.12, 1], ["upperarm_l", 0.9, 1], ["upperarm_r", 0.9, 1]],
  broad: [["spine_03", 1.06, 1], ["spine_02", 1.1, 1], ["spine_01", 1.12, 1], ["upperarm_l", 1.02, 1], ["upperarm_r", 1.02, 1], ["thigh_l", 1.06, 1], ["thigh_r", 1.06, 1]],
};

const CLIP: Record<string, string> = {
  idle: "Idle_Loop",
  talk: "Idle_Talking_Loop",
  walk: "Walk_Loop",
  sit: "Sitting_Idle_Loop",
  use: "Interact",
  dance: "Dance_Loop",
  drive: "Driving_Loop",
};

/**
 * Body regions from the skeleton: each vertex belongs to the bone that moves it most.
 * 0 skin (head, neck, hands) · 1 torso · 2 upper arm · 3 forearm · 4 hips · 5 thigh · 6 shin · 7 foot.
 */
function regionOf(bone: string) {
  if (/^spine|^clavicle/.test(bone)) return 1;
  if (/^upperarm/.test(bone)) return 2;
  if (/^lowerarm/.test(bone)) return 3;
  if (bone === "pelvis") return 4;
  if (/^thigh/.test(bone)) return 5;
  if (/^calf/.test(bone)) return 6;
  if (/^foot|^ball/.test(bone)) return 7;
  return 0;
}

const tagged = new WeakSet<BufferGeometry>();
function tagRegions(mesh: SkinnedMesh) {
  const g = mesh.geometry;
  if (tagged.has(g)) return;
  const idx = g.getAttribute("skinIndex");
  const wt = g.getAttribute("skinWeight");
  const out = new Float32Array(idx.count);
  for (let i = 0; i < idx.count; i++) {
    let best = 0;
    let bw = -1;
    for (let k = 0; k < 4; k++) {
      const w = wt.getComponent(i, k);
      if (w > bw) {
        bw = w;
        best = idx.getComponent(i, k);
      }
    }
    out[i] = regionOf(mesh.skeleton.bones[best]?.name ?? "");
  }
  g.setAttribute("bclass", new Float32BufferAttribute(out, 1));
  tagged.add(g);
}

/** Clothes painted onto the body by region, with a little thickness and a fabric finish. */
function dress(base: MeshStandardMaterial, cols: Vector4[], skin: Color, pattern: Vector4) {
  const mat = base.clone();
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uCol = { value: cols };
    sh.uniforms.uSkin = { value: skin };
    sh.uniforms.uPattern = { value: pattern };
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float bclass;\nflat varying int vClass;\nvarying vec4 vCloth;\nuniform vec4 uCol[8];")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvClass = int(bclass + 0.5);\nvCloth = uCol[vClass];\ntransformed += objectNormal * vCloth.a * (vClass == 7 ? 0.014 : vClass == 1 ? 0.012 : 0.008);",
      );
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nflat varying int vClass;\nvarying vec4 vCloth;\nuniform vec3 uSkin;\nuniform vec4 uPattern;")
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        // Hems blend across one edge instead of following the triangles.
        float cloth = smoothstep(0.35, 0.65, vCloth.a);
        vec3 c = vCloth.a > 0.01 ? vCloth.rgb / vCloth.a : vec3(0.0);
        if (uPattern.a > 0.5 && vClass >= 1 && vClass <= 3) {
          vec2 q = vMapUv * 60.0;
          float k = step(0.55, fract(q.x + q.y)) * step(0.3, fract(q.x - q.y));
          c = mix(c, uPattern.rgb, k);
        }
        float l = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
        diffuseColor.rgb = mix(diffuseColor.rgb * uSkin, c * (0.8 + 0.4 * smoothstep(0.03, 0.35, l)), cloth);`,
      )
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.9, step(0.5, vCloth.a));")
      .replace("#include <normal_fragment_maps>", "#include <normal_fragment_maps>\nnormal = normalize(mix(normal, nonPerturbedNormal, 0.9 * step(0.5, vCloth.a)));");
  };
  mat.customProgramCacheKey = () => "nl-dressed";
  return mat;
}

const lin = (hex: string) => new Color(hex);
// Average colour of the pack's skin texture: the look's skin tone is applied relative to it.
const SKIN_REF = lin("#a0704f");
const SHOES: Record<string, string | null> = { sneakers: "#f1f1ef", official: "#1b1612", sandals: null, boots: "#4a3020" };

function outfit(l: Look) {
  const top = lin(l.topColor);
  const bottom = lin(l.bottomColor);
  const dressed = l.top === "dress";
  // Premultiplied, so colour and coverage blend together across a hem.
  const v = (c: Color | null) => (c ? new Vector4(c.r, c.g, c.b, 1) : new Vector4(0, 0, 0, 0));
  const legs = dressed ? top : bottom;
  const bareShins = l.bottom === "shorts" || l.bottom === "skirt" || l.bottom === "maxi" || dressed;
  const shoe = SHOES[l.shoes];
  const cols = [v(null), v(top), v(dressed ? null : top), v(LONG_SLEEVES.has(l.top) ? top : null), v(legs), v(legs), v(bareShins ? null : bottom), v(shoe ? lin(shoe) : null)];
  const s = lin(l.skin);
  const skin = new Color(Math.min(2.6, s.r / SKIN_REF.r), Math.min(2.6, s.g / SKIN_REF.g), Math.min(2.6, s.b / SKIN_REF.b));
  const accent = l.top === "kitenge" ? lin(l.topColor === "#f2b705" ? "#c8102e" : "#f2b705") : l.top === "jersey" ? lin("#f5f5f4") : null;
  return { cols, skin, pattern: accent ? new Vector4(accent.r, accent.g, accent.b, 1) : new Vector4(0, 0, 0, 0) };
}

function std(color: string, rough = 0.85, metal = 0) {
  return new MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}

/** Builds one dressed, rigged person for a look. Everything is cloned, so many people share the assets. */
function useHuman(look: Look) {
  const body = useGLTF(`${DIR}${look.frame === "fem" ? "body_f" : "body_m"}.glb`);
  const brows = useGLTF(`${DIR}${look.frame === "fem" ? "eyebrows_female" : "eyebrows_regular"}.glb`);
  const hairFile = HAIR[look.hair]?.file;
  const hair = useGLTF(`${DIR}${hairFile ?? "hair_buzzed"}.glb`);
  const beard = useGLTF(`${DIR}hair_beard.glb`);

  return useMemo(() => {
    const root = cloneSkinned(body.scene) as Group;
    const bones: Record<string, Bone> = {};
    root.traverse((o) => {
      if ((o as Bone).isBone) bones[o.name] = o as Bone;
    });
    const { cols, skin, pattern } = outfit(look);

    let parent: Object3D = root;
    root.traverse((o) => {
      const m = o as SkinnedMesh;
      if (!m.isSkinnedMesh) return;
      m.castShadow = true;
      m.frustumCulled = false;
      const mat = m.material as MeshStandardMaterial;
      if (/Superhero/.test(mat.name)) {
        tagRegions(m);
        m.material = dress(mat, cols, skin, pattern);
        parent = m.parent ?? root;
      }
    });

    // Face the model down +Z (toes point forward), then size it to a real person.
    const inner = new Group();
    inner.add(root);
    inner.updateMatrixWorld(true);
    const foot = new Vector3();
    const toe = new Vector3();
    bones.foot_l?.getWorldPosition(foot);
    bones.ball_l?.getWorldPosition(toe);
    root.rotation.y = -Math.atan2(toe.x - foot.x, toe.z - foot.z);
    inner.updateMatrixWorld(true);
    const box = new Box3().setFromObject(inner);
    const tall = box.max.y - box.min.y || 1.85;

    // Pack hairstyles and brows are rigged to the same skeleton: rebind them to this body.
    const attachRigged = (scene: Object3D, color: string) => {
      const src = cloneSkinned(scene);
      const meshes: SkinnedMesh[] = [];
      src.traverse((o) => {
        if ((o as SkinnedMesh).isSkinnedMesh) meshes.push(o as SkinnedMesh);
      });
      for (const m of meshes) {
        m.bind(new Skeleton(m.skeleton.bones.map((b) => bones[b.name] ?? b), m.skeleton.boneInverses), m.bindMatrix);
        m.frustumCulled = false;
        m.castShadow = true;
        const hm = (m.material as MeshStandardMaterial).clone();
        hm.color = lin(color).multiplyScalar(2.2);
        m.material = hm;
        parent.add(m);
      }
    };
    attachRigged(brows.scene, look.hairColor);
    if (hairFile) attachRigged(hair.scene, look.hairColor);
    if (look.frame === "masc" && (look.hair === "fade" || look.hair === "bald") && look.extra === "none") attachRigged(beard.scene, look.hairColor);

    // Head-mounted extras: placed in the rest pose, then parented to the head bone.
    const head = bones.Head;
    if (head) {
      const hp = new Vector3();
      head.getWorldPosition(hp);
      const top = box.max.y;
      const r = Math.max(0.1, (top - hp.y) * 0.55);
      const c = new Vector3(hp.x, top - r * 1.05, hp.z + r * 0.05);
      const add = (m: Mesh) => {
        m.castShadow = true;
        inner.add(m);
        head.attach(m);
      };
      const extra = HAIR[look.hair]?.extra;
      if (extra === "afro") {
        const g = new IcosahedronGeometry(r * 1.3, 4);
        const p = g.getAttribute("position");
        for (let i = 0; i < p.count; i++) {
          const n = 1 + 0.06 * Math.sin(p.getX(i) * 90) * Math.sin(p.getY(i) * 80) * Math.sin(p.getZ(i) * 70);
          p.setXYZ(i, p.getX(i) * n, p.getY(i) * n * 0.92, p.getZ(i) * n);
        }
        g.computeVertexNormals();
        const m = new Mesh(g, std(look.hairColor, 1));
        m.position.set(c.x, c.y + r * 0.6, c.z - r * 0.4);
        add(m);
      }
      if (extra === "hijab") {
        const cloth = std(look.topColor === "#f5f5f4" ? "#1b1612" : look.topColor, 0.95);
        cloth.side = DoubleSide;
        const cap = new Mesh(new SphereGeometry(r * 1.18, 32, 20, Math.PI / 2 + 0.75, Math.PI * 2 - 1.5, 0, Math.PI * 0.78), cloth);
        cap.position.copy(c);
        add(cap);
        const drape = new Mesh(new CylinderGeometry(r * 1.0, r * 2.1, r * 1.6, 32, 1, true), cloth);
        drape.position.set(c.x, c.y - r * 1.55, c.z - r * 0.05);
        add(drape);
      }
      if (extra === "cap") {
        const capM = std(look.topColor, 0.8);
        const cap = new Mesh(new SphereGeometry(r * 1.12, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), capM);
        cap.position.set(c.x, c.y + r * 0.15, c.z);
        add(cap);
        const brim = new Mesh(new CylinderGeometry(r * 0.9, r * 0.9, r * 0.06, 24, 1, false, -Math.PI / 2, Math.PI), capM);
        brim.position.set(c.x, c.y + r * 0.15, c.z + r * 0.75);
        add(brim);
      }
      if (look.extra === "glasses" || look.extra === "shades") {
        const frame = std("#111", 0.4, 0.3);
        const lens = look.extra === "shades" ? std("#0b0b0b", 0.15, 0.6) : new MeshStandardMaterial({ color: "#cfe8ff", transparent: true, opacity: 0.25, roughness: 0.05 });
        for (const sx of [-1, 1]) {
          const ring = new Mesh(new TorusGeometry(r * 0.3, r * 0.04, 8, 20), frame);
          ring.position.set(c.x + sx * r * 0.38, c.y + r * 0.02, c.z + r * 1.05);
          add(ring);
          const glass = new Mesh(new CylinderGeometry(r * 0.29, r * 0.29, 0.003, 20), lens);
          glass.rotation.x = Math.PI / 2;
          glass.position.copy(ring.position);
          add(glass);
        }
      }
      if (look.extra === "earrings") {
        for (const sx of [-1, 1]) {
          const e = new Mesh(new TorusGeometry(r * 0.12, r * 0.03, 8, 16), std("#f2b705", 0.3, 0.9));
          e.position.set(c.x + sx * r * 0.98, c.y - r * 0.45, c.z);
          e.rotation.y = Math.PI / 2;
          add(e);
        }
      }
    }
    const neck = bones.neck_01;
    if (neck && (look.extra === "chain" || look.extra === "beads")) {
      const np = new Vector3();
      neck.getWorldPosition(np);
      const beads = look.extra === "beads";
      const ring = new Mesh(new TorusGeometry(beads ? 0.1 : 0.085, beads ? 0.02 : 0.006, 10, 32), beads ? std("#c8102e", 0.6) : std("#f2b705", 0.25, 1));
      ring.rotation.x = Math.PI / 2 - 0.25;
      ring.scale.set(1, 1, beads ? 0.35 : 1);
      ring.position.set(np.x, np.y - 0.02, np.z + 0.015);
      ring.castShadow = true;
      inner.add(ring);
      neck.attach(ring);
    }

    // Skirts and dresses: fabric hanging from the hips that follows the pelvis.
    const pelvis = bones.pelvis;
    const skirt = look.top === "dress" ? "dress" : look.bottom === "skirt" ? "skirt" : look.bottom === "maxi" ? "maxi" : null;
    if (pelvis && skirt) {
      const pp = new Vector3();
      pelvis.getWorldPosition(pp);
      const waist = pp.y + tall * 0.06;
      const len = skirt === "maxi" ? waist - tall * 0.06 : tall * 0.27;
      const mat = std(skirt === "dress" ? look.topColor : look.bottomColor, 0.92);
      mat.side = DoubleSide;
      const m = new Mesh(new CylinderGeometry(tall * 0.088, tall * (skirt === "maxi" ? 0.12 : 0.13), len, 36, 4, true), mat);
      m.position.set(pp.x, waist - len / 2, pp.z);
      m.castShadow = true;
      inner.add(m);
      pelvis.attach(m);
    }

    for (const [name, w, h] of BUILD[look.body] ?? []) bones[name]?.scale.set(w, h, w);
    const target = (look.frame === "fem" ? 1.66 : 1.76) * (look.body === "broad" ? 1.02 : 1);
    inner.scale.setScalar(target / tall);
    return { object: inner, root };
  }, [body.scene, brows.scene, hair.scene, beard.scene, hairFile, look]);
}

function Model({ look, pose, busy, walking, idle }: { look: Look; pose: Pose; busy?: boolean; walking: React.RefObject<boolean>; idle: "idle" | "talk" }) {
  const { object, root } = useHuman(look);
  const { animations } = useGLTF(`${DIR}anims.glb`);
  const mixer = useMemo(() => new AnimationMixer(root), [root]);
  const actions = useMemo(() => {
    const map: Record<string, AnimationAction> = {};
    for (const [k, name] of Object.entries(CLIP)) {
      const clip = animations.find((a: AnimationClip) => a.name === name);
      if (!clip) continue;
      // Root motion would drag people across the room: keep them in place.
      const inPlace = clip.clone();
      inPlace.tracks = inPlace.tracks.filter((t) => !/^root\.position/.test(t.name));
      map[k] = mixer.clipAction(inPlace);
      map[k].setLoop(LoopRepeat, Infinity);
      if (k === "walk") map[k].timeScale = 1.25;
    }
    return map;
  }, [animations, mixer]);
  const current = useRef<string | null>(null);

  useEffect(
    () => () => {
      mixer.stopAllAction();
      current.current = null;
    },
    [mixer],
  );

  useFrame((_, dt) => {
    const want =
      pose === "sit" ? "sit" : pose === "dance" ? "dance" : pose === "drive" ? "drive" : pose === "use" || (busy && pose === "stand") ? "use" : pose === "walk" || walking.current ? "walk" : pose === "sleep" ? "idle" : idle;
    if (want !== current.current && actions[want]) {
      const next = actions[want];
      // First clip starts at full weight so nobody is ever caught in the T-pose.
      if (current.current) next.reset().fadeIn(0.25).play();
      else next.reset().play();
      if (current.current) actions[current.current]?.fadeOut(0.25);
      current.current = want;
    }
    mixer.update(Math.min(dt, 0.1));
  });

  return <primitive object={object} />;
}

/**
 * A real, rigged 3D person dressed from a look. It moves itself toward `target`, plays walk/idle/sit
 * animations, and calls `onArrive` when it gets there.
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
  idle = "idle",
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
  /** Where to be while posing (the seat, or where the feet go on a bed), with the facing angle and seat/mattress height. */
  poseAt?: { x: number; z: number; rot: number; y: number } | null;
  /** What they do while standing around. */
  idle?: "idle" | "talk";
}) {
  const l = useMemo(() => sanitizeLook(look), [look]);
  const root = useRef<Group | null>(null);
  const body = useRef<Group>(null);
  const walking = useRef(false);
  const arrived = useRef(true);
  const lastTarget = useRef("");

  useFrame((_, dt) => {
    const g = root.current;
    if (!g) return;
    const key = target ? target.join(",") : "";
    if (key !== lastTarget.current) {
      lastTarget.current = key;
      arrived.current = !target;
    }
    let moving = false;
    if (pose === "walk") {
      if (poseAt) g.rotation.y = poseAt.rot;
    } else if (pose !== "stand" && poseAt) {
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
        // Turn smoothly toward where we're going.
        const d = Math.atan2(Math.sin(Math.atan2(dx, dz) - g.rotation.y), Math.cos(Math.atan2(dx, dz) - g.rotation.y));
        g.rotation.y += d * Math.min(1, dt * 10);
        moving = true;
      } else if (!arrived.current) {
        arrived.current = true;
        onArrive?.();
      }
    }
    walking.current = moving;

    // Lying down: tip the whole body back onto the bed. Sitting: lower onto the seat.
    const b = body.current;
    if (b) {
      const lying = pose === "sleep";
      const k = Math.min(1, dt * 8);
      b.rotation.x += ((lying ? -Math.PI / 2 : 0) - b.rotation.x) * k;
      // The sitting clip puts the hips ~0.3 m behind the feet, so step forward to land them on the seat.
      // Lying: the feet go at poseAt and the head falls back toward the pillow.
      const y = lying ? (poseAt?.y ?? 0.55) + 0.1 : pose === "sit" ? (poseAt?.y ?? 0.45) - 0.45 : pose === "drive" ? (poseAt?.y ?? 0) : 0;
      b.position.y += (y - b.position.y) * k;
      b.position.z += ((pose === "sit" ? 0.3 : 0) - b.position.z) * k;
    }
  });

  return (
    <group
      ref={(g) => {
        root.current = g;
        anchor?.(g);
      }}
      position={[start[0], 0, start[1]]}
      onClick={onClick}
    >
      <group ref={body}>
        <Suspense fallback={null}>
          <Model look={l} pose={pose} busy={busy} walking={walking} idle={idle} />
        </Suspense>
      </group>
    </group>
  );
}

for (const f of ["body_m", "body_f", "anims", "eyebrows_regular", "eyebrows_female", "hair_buzzed", "hair_beard"]) useGLTF.preload(`${DIR}${f}.glb`);
