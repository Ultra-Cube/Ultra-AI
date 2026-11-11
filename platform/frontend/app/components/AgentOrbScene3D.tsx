'use client';

import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html, Billboard, Text, Line } from '@react-three/drei';
import * as THREE from 'three';

/**
 * AgentOrbScene3D — a real WebGL visualization of the agent staff built on
 * three.js via @react-three/fiber.
 *
 * Agents orbit a glowing central "core" in true 3D space. Each node is a
 * lit sphere whose color encodes status and whose size encodes open workload;
 * a connecting line tethers every agent to the core. The whole cluster slowly
 * auto-rotates, and the user can orbit / zoom with the mouse (OrbitControls).
 * Clicking a node selects that agent. Theme matches the app's deep-space /
 * electric design system.
 */

export type SceneAgent = {
  id: string;
  name: string;
  avatar: string;
  status: string;
  openTasks: number;
  department: string;
};

const STATUS_COLOR: Record<string, string> = {
  active: '#35d98a',
  busy: '#fbbf24',
  idle: '#38e0c8',
  offline: '#5b6684',
  suspended: '#fb6a6a',
};

const ACCENT = '#6d8bff';

function colorFor(status: string) {
  return STATUS_COLOR[status] ?? '#5b6684';
}

/** Central pulsing core representing the Ultra-AI brain. */
function Core() {
  const mesh = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const s = 1 + Math.sin(t * 1.6) * 0.04;
    if (mesh.current) {
      mesh.current.scale.setScalar(s);
      mesh.current.rotation.y = t * 0.25;
    }
    if (halo.current) {
      halo.current.scale.setScalar(1.25 + Math.sin(t * 1.6) * 0.08);
    }
  });

  return (
    <group>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[0.95, 1]} />
        <meshStandardMaterial
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={0.9}
          metalness={0.3}
          roughness={0.25}
          flatShading
        />
      </mesh>
      {/* Soft glow halo */}
      <mesh ref={halo}>
        <sphereGeometry args={[1.15, 32, 32]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.08} />
      </mesh>
      <pointLight color={ACCENT} intensity={3} distance={14} decay={1.6} />
      <Billboard position={[0, 1.7, 0]}>
        <Text
          fontSize={0.42}
          color="#eef2ff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.012}
          outlineColor="#070a12"
        >
          Ultra&nbsp;AI
        </Text>
      </Billboard>
    </group>
  );
}

type NodeProps = {
  agent: SceneAgent;
  position: [number, number, number];
  selected: boolean;
  onSelect?: (id: string) => void;
};

/** A single agent node: a lit sphere + floating label, tethered to the core. */
function AgentNode({ agent, position, selected, onSelect }: NodeProps) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const color = colorFor(agent.status);
  const radius = 0.34 + Math.min(agent.openTasks, 6) * 0.05;

  // Gentle per-node bobbing so the cluster feels alive.
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.position.y = position[1] + Math.sin(t * 1.2 + phase) * 0.12;
  });

  const active = selected || hovered;

  return (
    <>
      {/* Tether from core to node */}
      <Line
        points={[[0, 0, 0], position]}
        color={active ? color : '#2a3350'}
        lineWidth={active ? 2 : 1}
        transparent
        opacity={active ? 0.85 : 0.35}
      />

      <group ref={group} position={position}>
        <mesh
          onClick={(e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation();
            onSelect?.(agent.id);
          }}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'auto';
          }}
          scale={active ? 1.18 : 1}
        >
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={active ? 0.85 : 0.35}
            metalness={0.4}
            roughness={0.3}
          />
        </mesh>

        {/* Selection ring */}
        {selected && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[radius + 0.16, 0.025, 16, 48]} />
            <meshBasicMaterial color={ACCENT} />
          </mesh>
        )}

        {/* Open-task count bubble */}
        {agent.openTasks > 0 && (
          <Billboard position={[radius + 0.18, radius + 0.1, 0]}>
            <mesh>
              <circleGeometry args={[0.16, 24]} />
              <meshBasicMaterial color="#6d8bff" />
            </mesh>
            <Text position={[0, 0, 0.01]} fontSize={0.17} color="#fff" anchorX="center" anchorY="middle">
              {String(agent.openTasks)}
            </Text>
          </Billboard>
        )}

        {/* Avatar + name label */}
        <Billboard position={[0, -(radius + 0.28), 0]}>
          <Text
            fontSize={0.26}
            color={active ? '#ffffff' : '#c9d2f0'}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.01}
            outlineColor="#070a12"
            maxWidth={3}
          >
            {`${agent.avatar} ${agent.name}`}
          </Text>
        </Billboard>

        {/* Rich hover card */}
        {hovered && (
          <Html position={[0, radius + 0.45, 0]} center distanceFactor={8} zIndexRange={[20, 0]}>
            <div className="orb3d-tip">
              <strong>{agent.name}</strong>
              <span>{agent.department}</span>
              <span className="orb3d-tip-status" style={{ color }}>
                {agent.status} · {agent.openTasks} open
              </span>
            </div>
          </Html>
        )}
      </group>
    </>
  );
}

/** The rotating cluster of agent nodes around the core. */
function Cluster({
  agents,
  selectedId,
  onSelect,
}: {
  agents: SceneAgent[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.12;
  });

  // Distribute nodes on a sphere using a Fibonacci lattice so even small or
  // large teams look balanced in 3D (not just a flat ring).
  const positions = useMemo<[number, number, number][]>(() => {
    const n = Math.max(agents.length, 1);
    const R = 3.2;
    const golden = Math.PI * (3 - Math.sqrt(5));
    return agents.map((_, i) => {
      const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2; // -1..1
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      return [Math.cos(theta) * r * R, y * R * 0.7, Math.sin(theta) * r * R];
    });
  }, [agents]);

  return (
    <group ref={group}>
      <Core />
      {agents.map((a, i) => (
        <AgentNode
          key={a.id}
          agent={a}
          position={positions[i]}
          selected={selectedId === a.id}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

export default function AgentOrbScene3D({
  agents,
  onSelect,
  selectedId,
}: {
  agents: SceneAgent[];
  onSelect?: (id: string) => void;
  selectedId?: string | null;
}) {
  return (
    <div className="orb3d-wrap">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 2.2, 9], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={() => (document.body.style.cursor = 'auto')}
      >
        {/* Lighting rig */}
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 8, 5]} intensity={1.1} color="#aab8ff" />
        <directionalLight position={[-6, -3, -4]} intensity={0.5} color="#38e0c8" />

        <Cluster agents={agents} selectedId={selectedId} onSelect={onSelect} />

        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={5}
          maxDistance={16}
          autoRotate={false}
          rotateSpeed={0.6}
          zoomSpeed={0.7}
        />
      </Canvas>
      <p className="muted orb3d-hint">Drag to orbit · scroll to zoom · click an agent to focus</p>
    </div>
  );
}
