'use client';

import { useState } from 'react';

import AppDock from '../components/AppDock';
import ZeroAiChat from './ZeroAiChat';

const OPEN_WEBUI_URL = process.env.NEXT_PUBLIC_OPEN_WEBUI_URL ?? 'http://127.0.0.1:8080';

type ChatTab = 'open-webui' | 'zeroai';

const TABS: { id: ChatTab; label: string; hint: string }[] = [
  { id: 'open-webui', label: 'Open WebUI', hint: 'Open-source chat UI · models, tools, RAG' },
  { id: 'zeroai', label: 'ZeroAI', hint: 'Local-first bridge · policy + memory + escalation' },
];

export default function ChatHubPage() {
  const [tab, setTab] = useState<ChatTab>('open-webui');

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="border-b border-slate-800 px-6 py-3 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold">Chat Hub</h1>
          <p className="text-xs text-slate-400">
            {TABS.find((t) => t.id === tab)?.hint}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <nav className="flex rounded-md border border-slate-800 overflow-hidden">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <AppDock />
        </div>
      </header>

      <main className="flex-1 p-4 overflow-hidden">
        {tab === 'open-webui' ? (
          <div className="h-full rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
            <iframe
              src={OPEN_WEBUI_URL}
              title="Open WebUI"
              className="w-full h-full border-0"
              allow="clipboard-read; clipboard-write; microphone"
            />
          </div>
        ) : (
          <ZeroAiChat />
        )}
      </main>
    </div>
  );
}
