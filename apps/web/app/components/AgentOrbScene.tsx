'use client';

import dynamic from 'next/dynamic';

/**
 * AgentOrbScene — SSR-safe entry point for the agent staff visualization.
 *
 * The actual scene is a real three.js / @react-three/fiber WebGL render
 * (see AgentOrbScene3D). WebGL + three.js can't run during server rendering,
 * so we load it dynamically with `ssr: false` and show a lightweight themed
 * placeholder while the client bundle + canvas initialize.
 */

export type SceneAgent = {
  id: string;
  name: string;
  avatar: string;
  status: string;
  openTasks: number;
  department: string;
};

const AgentOrbScene3D = dynamic(() => import('./AgentOrbScene3D'), {
  ssr: false,
  loading: () => (
    <div className="orb3d-wrap">
      <div className="orb3d-loading">
        <div className="orb3d-spinner" />
        <p className="muted">Spinning up 3D org scene…</p>
      </div>
    </div>
  ),
});

export default function AgentOrbScene(props: {
  agents: SceneAgent[];
  onSelect?: (id: string) => void;
  selectedId?: string | null;
}) {
  return <AgentOrbScene3D {...props} />;
}
