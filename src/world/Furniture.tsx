"use client";

import { useGLTF } from "@react-three/drei";
import { Suspense, useMemo, type ReactNode } from "react";
import { Box3, Group, Vector3, type Mesh } from "three";
import type { PropKind } from "./layout";

const DIR = "/models/furniture/";
/** Kenney's furniture is modelled at about half real size. */
const SCALE = 2;

/** One piece of furniture: centred on its footprint, sitting on the floor, front facing +Z (into the room). */
function Piece({ name, x = 0, z = 0, y = 0, r = 0, s = 1 }: { name: string; x?: number; z?: number; y?: number; r?: number; s?: number }) {
  const gltf = useGLTF(`${DIR}${name}.glb`);
  const object = useMemo(() => {
    const scene = gltf.scene.clone(true);
    scene.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    const box = new Box3().setFromObject(scene);
    const c = box.getCenter(new Vector3());
    scene.position.set(-c.x, -box.min.y, -c.z);
    const g = new Group();
    g.add(scene);
    return g;
  }, [gltf.scene]);
  return (
    <group position={[x, y, z]} rotation={[0, r, 0]} scale={SCALE * s}>
      <primitive object={object} />
    </group>
  );
}

/** How each kind of room prop is furnished, in the prop's own frame (front = +Z). */
const SETS: Partial<Record<PropKind, ReactNode>> = {
  bed: <Piece name="bedDouble" />,
  toilet: <Piece name="toilet" r={0} />,
  shower: <Piece name="shower" />,
  stove: (
    <>
      <Piece name="kitchenCabinet" x={-0.45} />
      <Piece name="kitchenStove" x={0.45} />
    </>
  ),
  fridge: <Piece name="kitchenFridge" />,
  sofa: <Piece name="loungeSofa" />,
  tv: (
    <>
      <Piece name="cabinetTelevision" />
      <Piece name="televisionModern" y={0.62} z={-0.1} />
    </>
  ),
  console: (
    <>
      <Piece name="cabinetTelevision" />
      <Piece name="televisionModern" y={0.62} z={-0.1} />
    </>
  ),
  radio: (
    <>
      <Piece name="bench" />
      <Piece name="radio" y={0.94} s={0.9} />
    </>
  ),
  speaker: (
    <>
      <Piece name="speaker" x={-0.35} />
      <Piece name="speaker" x={0.35} />
    </>
  ),
  shelf: (
    <>
      <Piece name="bookcaseOpen" />
      <Piece name="books" y={0.62} z={0.05} />
    </>
  ),
  desk: (
    <>
      <Piece name="desk" />
      <Piece name="laptop" y={0.76} />
      <Piece name="chairDesk" z={0.62} r={Math.PI} />
    </>
  ),
  lamp: <Piece name="lampRoundFloor" />,
  plant: <Piece name="pottedPlant" />,
  chairs: (
    <>
      <Piece name="chair" x={-0.35} />
      <Piece name="chair" x={0.35} />
    </>
  ),
  table: (
    <>
      <Piece name="tableRound" />
      <Piece name="chairCushion" x={-0.85} r={Math.PI / 2} />
      <Piece name="chairCushion" x={0.85} r={-Math.PI / 2} />
    </>
  ),
  counter: (
    <>
      <Piece name="kitchenBar" x={-0.86} />
      <Piece name="kitchenBar" />
      <Piece name="kitchenBar" x={0.86} />
      <Piece name="kitchenCoffeeMachine" x={-0.5} y={0.84} z={-0.1} />
      <Piece name="stoolBar" x={-0.5} z={0.75} />
      <Piece name="stoolBar" x={0.5} z={0.75} />
    </>
  ),
  lounge: (
    <>
      <Piece name="loungeChairRelax" x={-0.8} r={0} />
      <Piece name="loungeChairRelax" x={0.8} r={0} />
      <Piece name="tableCoffee" z={0.9} />
      <Piece name="lampRoundFloor" x={1.6} z={-0.2} />
    </>
  ),
  mirror: (
    <>
      <Piece name="bathroomSink" y={0.8} />
      <Piece name="bathroomMirror" y={1.2} z={-0.2} />
    </>
  ),
  rug: <Piece name="rugRectangle" s={0.9} />,
  bench: <Piece name="benchCushion" s={1.1} />,
};

/** A real furniture model for this prop kind, or null to fall back to the hand-built one. */
export function FurnitureModel({ kind }: { kind: PropKind }) {
  const set = SETS[kind];
  if (!set) return null;
  return <Suspense fallback={null}>{set}</Suspense>;
}

export const hasFurniture = (kind: PropKind) => kind in SETS;

for (const f of ["bedDouble", "loungeSofa", "kitchenFridge", "kitchenStove", "toilet", "shower", "televisionModern", "cabinetTelevision"]) useGLTF.preload(`${DIR}${f}.glb`);
