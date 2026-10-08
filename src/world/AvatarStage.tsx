"use client";

import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { Look } from "@/game/look";
import { Character, type Pose } from "./Character";

/** A turntable for one person: used by the avatar builder and profile cards. */
export default function AvatarStage({ look, pose = "stand", idle = "idle", spin = true, className = "" }: { look: Partial<Look>; pose?: Pose; idle?: "idle" | "talk"; spin?: boolean; className?: string }) {
  return (
    <div className={className}>
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.25, 3.1], fov: 32 }}>
        <hemisphereLight args={["#ffffff", "#b9a88f", 1.1]} />
        <directionalLight position={[2.5, 4, 3]} intensity={1.8} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-3, 2, -2]} intensity={0.6} color="#cfe3ff" />
        <Character look={look} start={[0, 0]} pose={pose} idle={idle} />
        <ContactShadows position={[0, 0.001, 0]} opacity={0.45} scale={3} blur={2.4} far={2} />
        <OrbitControls target={[0, 0.95, 0]} enablePan={false} enableZoom={false} autoRotate={spin} autoRotateSpeed={1.2} minPolarAngle={1.1} maxPolarAngle={1.75} />
      </Canvas>
    </div>
  );
}
