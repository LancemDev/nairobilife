"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Vector3, type Object3D, type PerspectiveCamera } from "three";
import { NPC } from "@/game/data";
import { npcsHere } from "@/game/engine";
import { randomLook, type Look } from "@/game/look";
import type { GameState } from "@/game/types";
import type { Profile } from "@/online/api";
import { Character } from "./Character";
import { buildRoom, type Prop, type Room } from "./layout";
import { PropModel } from "./Props";

const WALL_H = 2.8;

/** Deterministic look for an NPC so Mzee Kariuki always wears the same thing. */
function npcLook(id: string): Look {
  let seed = [...id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 2 ** 31, 7);
  return randomLook(() => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31));
}

/** Where to stand to use a prop: in front of it, toward the room's centre. */
function standSpot(p: Prop): [number, number] {
  return [p.x + Math.sin(p.rot) * 1.4, p.z + Math.cos(p.rot) * 1.4];
}

type Person = { key: string; kind: "npc" | "player"; label: string; look: Partial<Look> | null; spot: [number, number] };

/** A label follows either a fixed point or a moving object (characters). */
interface Anchor {
  pos?: [number, number, number];
  obj?: Object3D | null;
  el?: HTMLElement | null;
}

export interface WorldProps {
  s: GameState;
  busy: boolean;
  others: Profile[];
  selected: string | null;
  onSelect: (prop: Prop | null) => void;
  onNpc: (id: string) => void;
  onPlayer: (username: string) => void;
}

const LABEL_STYLE = {
  sign: "!rounded-lg !px-4 !py-1 font-display !text-lg font-extrabold uppercase tracking-wide bg-sun text-foreground",
  prop: "bg-white/85 text-foreground",
  lit: "bg-foreground text-background",
  npc: "bg-white/95 text-foreground",
  player: "bg-blue-600 text-white",
  you: "bg-kgreen text-white",
};

export default function World(props: WorldProps) {
  const { s, others, selected } = props;
  const room = useMemo(() => buildRoom(s), [s]);
  const [hover, setHover] = useState<string | null>(null);
  const anchors = useRef(new Map<string, Anchor>());

  const people: Person[] = useMemo(() => {
    const list: Omit<Person, "spot">[] = [
      ...npcsHere(s).map((id) => ({ key: `npc:${id}`, kind: "npc" as const, label: NPC[id].name, look: npcLook(id) })),
      ...others.filter((p) => p.venue === s.location).map((p) => ({ key: `player:${p.username}`, kind: "player" as const, label: `@${p.username}`, look: p.look })),
    ];
    return list.map((p, i) => ({ ...p, spot: room.spots[(i * 5 + 3) % Math.max(1, room.spots.length)] ?? [0, 0] }));
  }, [s, others, room.spots]);

  const anchor = useCallback((key: string, patch: Partial<Anchor>) => {
    const map = anchors.current;
    map.set(key, { ...map.get(key), ...patch });
  }, []);

  const labels: { key: string; text: string; kind: keyof typeof LABEL_STYLE; pos?: [number, number, number] }[] = [
    ...(room.sign ? [{ key: "sign", text: room.sign, kind: "sign" as const, pos: [0, WALL_H + 0.35, -room.d / 2] as [number, number, number] }] : []),
    ...room.props.filter((p) => p.actions.length).map((p) => ({ key: `prop:${p.id}`, text: p.label, kind: hover === p.id || selected === p.id ? ("lit" as const) : ("prop" as const), pos: [p.x, 1.7, p.z] as [number, number, number] })),
    ...people.map((p) => ({ key: p.key, text: p.label, kind: p.kind })),
    { key: "you", text: s.player.name, kind: "you" as const },
  ];

  return (
    <div className="absolute inset-0">
      <Canvas shadows dpr={[1, 1.75]} camera={{ position: [10, 12, 14], fov: 40 }} className="touch-none">
        <color attach="background" args={["#bfe0f7"]} />
        <hemisphereLight args={["#ffffff", "#8fb37a", 0.9]} />
        <directionalLight position={[8, 14, 6]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} />
        {/* Remount per room so the player starts at the door of each new place. */}
        <Scene key={room.key} room={room} people={people} hover={hover} setHover={setHover} anchor={anchor} {...props} />
        <Projector anchors={anchors} />
        <OrbitControls makeDefault enablePan={false} minDistance={8} maxDistance={60} minPolarAngle={0.45} maxPolarAngle={1.2} minAzimuthAngle={-0.9} maxAzimuthAngle={1.2} />
      </Canvas>
      {/* One DOM layer for every label, positioned by the Projector each frame. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {labels.map((l) => (
          <span
            key={l.key}
            ref={(el) => anchor(l.key, l.pos ? { el, pos: l.pos } : { el })}
            className={`absolute left-0 top-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold shadow will-change-transform ${LABEL_STYLE[l.kind]}`}
            style={{ transform: "translate(-9999px, 0)" }}
          >
            {l.text}
          </span>
        ))}
      </div>
    </div>
  );
}

// Scratch vector reused every frame by the label projector.
const v = new Vector3();

/** Moves every DOM label to its anchor's screen position each frame, without React renders. */
function Projector({ anchors }: { anchors: React.RefObject<Map<string, Anchor>> }) {
  useFrame(({ camera, size }) => {
    for (const a of anchors.current.values()) {
      if (!a.el) continue;
      if (a.obj) {
        a.obj.getWorldPosition(v);
        v.y += 2.15;
      } else if (a.pos) v.set(...a.pos);
      else continue;
      v.project(camera);
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      a.el.style.transform = v.z > 1 ? "translate(-9999px, 0)" : `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    }
  });
  return null;
}

function Scene({
  room,
  s,
  busy,
  people,
  hover,
  setHover,
  anchor,
  onSelect,
  onNpc,
  onPlayer,
}: WorldProps & { room: Room; people: Person[]; hover: string | null; setHover: (id: string | null) => void; anchor: (key: string, patch: Partial<Anchor>) => void }) {
  const [target, setTarget] = useState<[number, number] | null>(null);
  const [heading, setHeading] = useState<Prop | null>(null);

  const walkTo = (spot: [number, number], prop: Prop | null) => {
    onSelect(null);
    setHeading(prop);
    setTarget(spot);
  };

  const floorClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const x = Math.max(-room.w / 2 + 0.6, Math.min(room.w / 2 - 0.6, e.point.x));
    const z = Math.max(-room.d / 2 + 0.6, Math.min(room.d / 2 - 0.6, e.point.z));
    walkTo([x, z], null);
  };

  const cols = Math.max(1, Math.round(room.w / 2));
  const rows = Math.max(1, Math.round(room.d / 2));
  const tw = room.w / cols;
  const td = room.d / rows;

  return (
    <group>
      <Frame room={room} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <circleGeometry args={[Math.max(room.w, room.d) * 1.2, 64]} />
        <meshStandardMaterial color={room.outdoor ? "#8db86b" : "#c5d9b0"} />
      </mesh>

      {/* checkered floor, tiles sized to fit the room exactly */}
      <group onClick={floorClick}>
        {Array.from({ length: cols * rows }, (_, i) => {
          const cx = i % cols;
          const cz = Math.floor(i / cols);
          return (
            <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-room.w / 2 + (cx + 0.5) * tw, 0, -room.d / 2 + (cz + 0.5) * td]} receiveShadow>
              <planeGeometry args={[tw, td]} />
              <meshStandardMaterial color={(cx + cz) % 2 ? room.floor : room.floor2} />
            </mesh>
          );
        })}
      </group>

      {!room.outdoor ? (
        <group>
          {/* Dollhouse cutaway: tall back and left walls, low right and front walls. */}
          <Wall p={[0, WALL_H / 2, -room.d / 2]} s={[room.w + 0.3, WALL_H, 0.3]} c={room.wall} />
          <Wall p={[-room.w / 2, WALL_H / 2, 0]} s={[0.3, WALL_H, room.d]} c={room.wall} />
          <Wall p={[room.w / 2, 0.2, 0]} s={[0.3, 0.4, room.d]} c={room.wall} />
          <Wall p={[0, 0.2, room.d / 2]} s={[room.w + 0.3, 0.4, 0.3]} c={room.wall} />
        </group>
      ) : (
        <group>
          {[-room.w / 2, room.w / 2].flatMap((x) =>
            [-room.d / 2, 0, room.d / 2].map((z) => (
              <mesh key={`${x}${z}`} position={[x, 0.5, z]} castShadow>
                <cylinderGeometry args={[0.06, 0.06, 1, 8]} />
                <meshStandardMaterial color="#6b4423" />
              </mesh>
            )),
          )}
        </group>
      )}

      {room.props.map((p) => {
        const active = p.actions.length > 0;
        const lit = hover === p.id;
        return (
          <group
            key={p.id}
            position={[p.x, 0, p.z]}
            rotation={[0, p.rot, 0]}
            scale={lit ? 1.06 : 1}
            onClick={(e) => {
              if (!active) return;
              e.stopPropagation();
              walkTo(standSpot(p), p);
            }}
            onPointerOver={(e) => {
              if (!active) return;
              e.stopPropagation();
              setHover(p.id);
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              setHover(null);
              document.body.style.cursor = "";
            }}
          >
            <PropModel kind={p.kind} accent={room.accent} />
          </group>
        );
      })}

      {people.map((person) => (
        <Character
          key={person.key}
          look={person.look}
          start={person.spot}
          anchor={(obj) => anchor(person.key, { obj })}
          onClick={(e) => {
            e.stopPropagation();
            const id = person.key.split(":")[1];
            if (person.kind === "npc") onNpc(id);
            else onPlayer(id);
          }}
        />
      ))}

      <Character
        look={s.player.look}
        start={room.entry}
        target={target}
        busy={busy}
        anchor={(obj) => anchor("you", { obj })}
        onArrive={() => {
          if (heading) onSelect(heading);
          setHeading(null);
        }}
      />
    </group>
  );
}

/** Fits the whole room on screen for the current aspect ratio, from a 3/4 view. */
function Frame({ room }: { room: Room }) {
  const get = useThree((st) => st.get);
  const width = useThree((st) => st.size.width);
  const height = useThree((st) => st.size.height);
  useEffect(() => {
    const { camera, controls } = get();
    const cam = camera as PerspectiveCamera;
    const vfov = (cam.fov * Math.PI) / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * (width / height));
    const span = Math.hypot(room.w, room.d) * (width < height ? 0.5 : 0.62);
    const dist = Math.max(span / Math.tan(Math.min(vfov, hfov) / 2), 9);
    const dir = [0.5, 0.78, 0.95];
    const len = Math.hypot(...dir);
    cam.position.set((dir[0] / len) * dist, (dir[1] / len) * dist, (dir[2] / len) * dist);
    cam.lookAt(0, 0.3, 0);
    const c = controls as unknown as { target: Vector3; maxDistance: number; update: () => void } | null;
    if (c) {
      c.target.set(0, 0.3, 0);
      c.maxDistance = dist * 1.6;
      c.update();
    }
  }, [get, width, height, room.w, room.d]);
  return null;
}

function Wall({ p, s, c }: { p: [number, number, number]; s: [number, number, number]; c: string }) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} roughness={0.9} />
    </mesh>
  );
}
