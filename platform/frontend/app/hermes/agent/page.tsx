// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗██╗      █████╗ ██████╗                                         ║
// ║ ██║   ██║██║     ██╔══██╗██╔══██╗                                        ║
// ║ ██║   ██║██║     ███████║██████╔╝                                        ║
// ║ ╚██╗ ██╔╝██║     ██╔══██║██╔══██╗                                        ║
// ║  ╚████╔╝ ███████╗██║  ██║██████╔╝                                        ║
// ║   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝                                         ║
// ║                                                                          ║
// ║ Project   : Ultra AI — Proprietary AI Platform                           ║
// ║ Developer : Ultra Cube Tech — ucubetech.com                              ║
// ║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
// ║ GitHub    : github.com/Ultra-Cube                                        ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

'use client';
import { useState, useRef, useEffect } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function HermesAgentPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      content:
        'مرحباً، أنا Hermes Agent — النواة المعرفية لـ Ultra AI. كيف أساعدك؟',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [model, setModel] = useState('hermes-agent');
  const [models, setModels] = useState<string[]>(['hermes-agent']);
  const [online, setOnline] = useState<boolean | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/hermes/api/v1/models')
      .then((r) => r.json())
      .then((d) => {
        const ids = (d?.data || []).map((m: { id: string }) => m.id);
        if (ids.length) {
          setModels(ids);
          setModel(ids[0]);
        }
        setOnline(true);
      })
      .catch(() => setOnline(false));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await fetch('/hermes/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          stream: false,
        }),
      });
      const data = await res.json();
      const reply =
        data?.choices?.[0]?.message?.content ||
        data?.error?.message ||
        `HTTP ${res.status}`;
      setMessages((m) => [...m, { role: 'assistant', content: String(reply) }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content:
            'تعذّر الوصول إلى Hermes api_server (127.0.0.1:8642). تأكد أن البوابة تعمل.',
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="page"
      style={{
        maxWidth: 860,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 140px)',
      }}
    >
      <div className="hero" style={{ padding: '1rem 0' }}>
        <h1 style={{ fontSize: '1.6rem' }}>Hermes Agent</h1>
        <p>
          النواة المعرفية — محادثة مباشرة عبر OpenAI-compatible API{' '}
          <span
            className={`badge ${online ? 'ok' : online === false ? 'err' : ''}`}
          >
            {online === null ? '…' : online ? 'api_server متصل' : 'غير متصل'}
          </span>{' '}
          <a
            href="http://localhost:9119"
            target="_blank"
            rel="noreferrer"
            className="badge"
          >
            Dashboard ↗
          </a>
        </p>
      </div>

      <div
        className="card"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'
            }
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="chat-bubble-ai" style={{ color: 'var(--muted)' }}>
            …
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.6rem',
          marginTop: '0.8rem',
          alignItems: 'center',
        }}
      >
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          style={{ maxWidth: 220 }}
        >
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <div className="chat-composer" style={{ flex: 1 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="اسأل Hermes…"
            rows={1}
          />
          <button onClick={send} disabled={busy || !input.trim()}>
            إرسال
          </button>
        </div>
      </div>
    </div>
  );
}
