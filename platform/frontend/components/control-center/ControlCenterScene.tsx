'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

export type MetricStats = {
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
  cores?: number;
  platform?: string;
};

export type ServiceNode = {
  id: string;
  label: string;
  url: string;
  status: 'up' | 'down';
  latencyMs: number;
};

export type SelectedNode =
  | { kind: 'metric'; id: string; label: string; value: number; unit: string }
  | { kind: 'service'; node: ServiceNode };

export type NodeKind = 'cpu' | 'memory' | 'disk' | 'service';

export type SceneNode = {
  id: string;
  label: string;
  kind: NodeKind;
  position: [number, number, number];
  value: number; // 0..100 for metrics, 100 up / 0 down for services
  color: string;
  detail: string;
};

function usageColor(v: number): string {
  if (v < 60) return '#34d399';
  if (v < 85) return '#fbbf24';
  return '#f87171';
}

function buildNodes(stats: MetricStats | null, services: ServiceNode[]): SceneNode[] {
  const nodes: SceneNode[] = [];
  if (stats) {
    const metrics: { id: string; label: string; key: 'cpu' | 'memory' | 'disk'; unit: string }[] = [
      { id: 'cpu', label: 'CPU', key: 'cpu', unit: '%' },
      { id: 'memory', label: 'Memory', key: 'memory', unit: '%' },
      { id: 'disk', label: 'Disk', key: 'disk', unit: '%' },
    ];
    metrics.forEach((m, i) => {
      const value = stats[m.key];
      const angle = (i / metrics.length) * Math.PI * 2 - Math.PI / 2;
      nodes.push({
        id: `metric-${m.id}`,
        label: `${m.label} ${value.toFixed(0)}${m.unit}`,
        kind: m.id as NodeKind,
        position: [Math.cos(angle) * 4.5, 1.6, Math.sin(angle) * 4.5],
        value,
        color: usageColor(value),
        detail: `${m.label} usage: ${value.toFixed(1)}%`,
      });
    });
  }
  services.forEach((s, i) => {
    const angle = (i / Math.max(services.length, 1)) * Math.PI * 2 + Math.PI / 4;
    const up = s.status === 'up';
    nodes.push({
      id: `service-${s.id}`,
      label: `${s.label} · ${up ? `${s.latencyMs}ms` : 'DOWN'}`,
      kind: 'service',
      position: [Math.cos(angle) * 2.6, -0.4, Math.sin(angle) * 2.6],
      value: up ? 100 : 0,
      color: up ? '#60a5fa' : '#f87171',
      detail: `${s.label}: ${up ? 'UP' : 'DOWN'} (${s.latencyMs}ms) — ${s.url}`,
    });
  });
  return nodes;
}

function NodeMesh({
  node,
  selected,
  onSelect,
}: {
  node: SceneNode;
  selected: boolean;
  onSelect: (n: SceneNode) => void;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const isMetric = node.kind !== 'service';
  const baseScale = isMetric ? 0.55 + (node.value / 100) * 0.75 : 0.45;

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * 2.4 + node.position[0]) * 0.08;
    mesh.current.scale.setScalar(baseScale * pulse * (selected ? 1.35 : 1));
    mesh.current.rotation.y = t * 0.6;
  });

  return (
    <group position={node.position}>
      <mesh
        ref={mesh}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
        }}
      >
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={isMetric ? 0.55 : 0.35}
          roughness={0.25}
          metalness={0.7}
        />
      </mesh>
      {selected && (
        <mesh>
          <torusGeometry args={[1.7, 0.045, 8, 48]} />
          <meshBasicMaterial color="#e2e8f0" transparent opacity={0.9} />
        </mesh>
      )}
      <Html center distanceFactor={14} position={[0, 1.6, 0]}>
        <div
          style={{
            color: '#e2e8f0',
            fontSize: 12,
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            textShadow: '0 1px 3px #000',
          }}
        >
          {node.label}
        </div>
      </Html>
    </group>
  );
}

export default function ControlCenterScene({
  stats,
  services,
  selectedId,
  onSelect,
}: {
  stats: MetricStats | null;
  services: ServiceNode[];
  selectedId: string | null;
  onSelect: (node: SceneNode | null) => void;
}) {
  const nodes = useMemo(() => buildNodes(stats, services), [stats, services]);

  const handleSelect = (n: SceneNode) => {
    onSelect(n.id === selectedId ? null : n);
  };

  return (
    <Canvas
      camera={{ position: [0, 6.5, 11], fov: 55 }}
      onPointerMissed={() => onSelect(null)}
      style={{ background: 'radial-gradient(circle at 50% 35%, #0f172a 0%, #020617 75%)' }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[6, 8, 6]} intensity={60} color="#93c5fd" />
      <pointLight position={[-6, 4, -4]} intensity={30} color="#a78bfa" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]}>
        <ringGeometry args={[2.2, 4.4, 64]} />
        <meshBasicMaterial color="#1e293b" side={THREE.DoubleSide} />
      </mesh>
      {nodes.map((n) => (
        <NodeMesh
          key={n.id}
          node={n}
          selected={n.id === selectedId}
          onSelect={handleSelect}
        />
      ))}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={6}
        maxDistance={22}
        maxPolarAngle={Math.PI / 2.05}
      />
    </Canvas>
  );
}
