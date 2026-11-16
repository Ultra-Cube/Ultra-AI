'use client';

import { useEffect, useState } from 'react';

import AdaptiveRenderer from '../components/AdaptiveRenderer';
import type { UiSchema } from '../components/AdaptiveRenderer';
import AppDock from '../components/AppDock';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  locality?: string;
  route?: string;
}

export default function ZeroAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [bridgeOnline, setBridgeOnline] = useState<boolean | null>(null);
  const [schema, setSchema] = useState<UiSchema | null>(null);
  const [rawResult, setRawResult] = useState<Record<string, unknown> | null>(
    null
  );

  useEffect(() => {
    fetch('/api/zeroai/edge/status')
      .then((r) => r.json())
      .then((d) => setBridgeOnline(Boolean(d?.connected)))
      .catch(() => setBridgeOnline(false));
    fetch('/api/zeroai/ui-schema')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.schema) setSchema(d.schema);
      })
      .catch(() => undefined);
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    try {
      const res = await fetch('/api/zeroai/edge/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      const response = (data?.response ?? {}) as Record<string, unknown>;
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content:
            (response.answer as string) ??
            data?.error ??
            JSON.stringify(response),
          locality: data?.locality ?? (response.locality as string),
          route: data?.route ?? (response.route as string),
        },
      ]);
      setRawResult(response);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: `Edge bridge unreachable: ${String(e)}`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ZeroAI Chat</h1>
          <p className="text-sm text-slate-400">
            Local-first execution · bridge{' '}
            {bridgeOnline === null
              ? 'checking…'
              : bridgeOnline
                ? 'online'
                : 'offline'}
          </p>
        </div>
        <AppDock />
      </header>

      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-3 min-h-[280px] max-h-[55vh] overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-slate-500 text-sm">
            Send a prompt — the edge bridge routes it through local memory,
            policy, local model/tools, or escalates to Ultra.
          </p>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-md px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-indigo-600/20 ml-8'
                  : 'bg-slate-800 mr-8'
              }`}
            >
              {m.content}
              {m.locality ? (
                <span className="block mt-1 text-[10px] uppercase tracking-wide text-slate-400">
                  {m.route} · {m.locality}
                </span>
              ) : null}
            </div>
          ))
        )}
      </div>

      {schema ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">
            Adaptive UI · {schema.kind}
          </p>
          <AdaptiveRenderer schema={schema} data={rawResult} />
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Ask ZeroAI…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void send();
          }}
        />
        <button
          onClick={() => void send()}
          disabled={busy}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {busy ? 'Running…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
