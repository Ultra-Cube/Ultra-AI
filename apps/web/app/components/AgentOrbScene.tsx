'use client';

import { useRef, useState, useEffect } from 'react';

/**
 * AgentOrbScene — a dependency-free 3D visualization of the agent staff.
 *
 * Renders agents as nodes orbiting a central "core" in 3D space using CSS 3D
 * transforms (perspective + rotateX/rotateY). Drag to rotate the whole scene;
 * it also auto-rotates slowly. Each node's color encodes status and its size/
 * ring encodes open workload, so an operator can track the whole team at a
 * glance. No WebGL / three.js dependency — pure CSS transforms, so it always
 * builds and stays light.
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
  active: '#22c55e',
  busy: '#f59e0b',
  idle: '#38bdf8',
  offline: '#6b7280',
  suspended: '#ef4444',
};

export default function AgentOrbScene({
  agents,
  onSelect,
  selectedId,
}: {
  agents: SceneAgent[];
  onSelect?: (id: string) => void;
  selectedId?: string | null;
}) {
  const [rot, setRot] = useState({ x: -18, y: 0 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const auto = useRef<number | null>(null);

  // Gentle auto-rotation until the user grabs the scene.
  useEffect(() => {
    const tick = () => {
      if (!dragging.current) {
        setRot((r) => ({ ...r, y: (r.y + 0.25) % 360 }));
      }
      auto.current = requestAnimationFrame(tick);
    };
    auto.current = requestAnimationFrame(tick);
    return () => {
      if (auto.current) cancelAnimationFrame(auto.current);
    };
  }, []);

  const onDown = (e: React.PointerEvent) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setRot((r) => ({
      x: Math.max(-80, Math.min(80, r.x - dy * 0.4)),
      y: r.y + dx * 0.4,
    }));
  };
  const onUp = () => {
    dragging.current = false;
  };

  const radius = 180;
  const n = Math.max(agents.length, 1);

  return (
    <div className="orb-scene-wrap">
      <div
        className="orb-scene"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      >
        <div
          className="orb-space"
          style={{ transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}
        >
          {/* central core */}
          <div className="orb-core" title="Ultra AI core">
            🧠
          </div>

          {/* orbit ring */}
          <div className="orb-ring" />

          {agents.map((a, i) => {
            const angle = (i / n) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const color = STATUS_COLOR[a.status] ?? '#6b7280';
            const size = 46 + Math.min(a.openTasks, 6) * 6;
            const selected = selectedId === a.id;
            return (
              <button
                key={a.id}
                className={`orb-node${selected ? ' selected' : ''}`}
                style={{
                  transform: `translate3d(${x}px, 0px, ${z}px) rotateY(${-rot.y}deg) rotateX(${-rot.x}deg)`,
                  width: size,
                  height: size,
                  borderColor: color,
                  boxShadow: `0 0 18px ${color}66`,
                }}
                onClick={() => onSelect?.(a.id)}
                title={`${a.name} · ${a.department} · ${a.status} · ${a.openTasks} open`}
              >
                <span className="orb-avatar">{a.avatar}</span>
                <span className="orb-dot" style={{ background: color }} />
                {a.openTasks > 0 && <span className="orb-badge">{a.openTasks}</span>}
              </button>
            );
          })}
        </div>
      </div>
      <p className="muted orb-hint">Drag to rotate · click an agent to focus</p>
    </div>
  );
}
