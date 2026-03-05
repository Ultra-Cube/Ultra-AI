'use client';

import { FormEvent, useMemo, useState } from 'react';

type Role =
  | 'video-designer'
  | 'developer'
  | 'researcher'
  | 'marketer'
  | 'custom';

interface WorkspaceRecommendation {
  role: Role;
  sections: string[];
  pinnedWidgets: string[];
  suggestedTools: string[];
  adaptationEnabled: boolean;
}

interface ProcessResult {
  output: string;
  model: string;
}

const roles: Role[] = [
  'video-designer',
  'developer',
  'researcher',
  'marketer',
  'custom',
];

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export default function HomePage() {
  const [role, setRole] = useState<Role>('video-designer');
  const [prompt, setPrompt] = useState('I need help planning a video editing workflow.');
  const [signals, setSignals] = useState('caption editing,render export');
  const [recommendation, setRecommendation] = useState<WorkspaceRecommendation | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleTitle = useMemo(() => role.replace('-', ' '), [role]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const workspaceRes = await fetch(`${API_BASE}/ai/workspace/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          role,
          usageSignals: signals
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });

      if (!workspaceRes.ok) {
        throw new Error('Failed to fetch workspace recommendation.');
      }

      const workspaceData = await workspaceRes.json();
      setRecommendation(workspaceData.recommendation as WorkspaceRecommendation);

      const processRes = await fetch(`${API_BASE}/ai/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: prompt }),
      });

      if (!processRes.ok) {
        throw new Error('Failed to process AI prompt.');
      }

      const processData = await processRes.json();
      setResult(processData.result as ProcessResult);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="hero card">
        <p className="kicker">Ultra AI Adaptive Workspace</p>
        <h1>Workspace built for your craft</h1>
        <p>
          Pick your role and Ultra AI generates a tailored interface, then processes your
          request using the best available AI model path.
        </p>
      </section>

      <section className="grid">
        <form className="card form" onSubmit={onSubmit}>
          <label>
            Role
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {roles.map((r) => (
                <option value={r} key={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label>
            Usage Signals (comma-separated)
            <input
              value={signals}
              onChange={(e) => setSignals(e.target.value)}
              placeholder="caption editing, render export"
            />
          </label>

          <label>
            Prompt
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} />
          </label>

          <button disabled={loading} type="submit">
            {loading ? 'Generating...' : 'Generate Workspace + AI Output'}
          </button>

          {error ? <p className="error">{error}</p> : null}
        </form>

        <article className="card output">
          <h2>{roleTitle}</h2>
          <p className="muted">Live recommendation preview</p>

          {recommendation ? (
            <>
              <div>
                <h3>Sections</h3>
                <ul>
                  {recommendation.sections.map((section) => (
                    <li key={section}>{section}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3>Suggested Tools</h3>
                <ul>
                  {recommendation.suggestedTools.map((tool) => (
                    <li key={tool}>{tool}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="muted">No workspace recommendation yet.</p>
          )}

          {result ? (
            <div className="result">
              <h3>AI Output</h3>
              <p>{result.output}</p>
              <small>Model: {result.model}</small>
            </div>
          ) : null}
        </article>
      </section>
    </main>
  );
}
