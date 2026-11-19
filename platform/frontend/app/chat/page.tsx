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

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Logo, Icon } from '../components/Sidebar';

const OPEN_WEBUI_URL =
  process.env.NEXT_PUBLIC_OPEN_WEBUI_URL ?? 'http://localhost:8080';

interface EngineHealth {
  id: string;
  label: string;
  port: number;
  up: boolean;
}

export default function ChatPage() {
  const [engines, setEngines] = useState<EngineHealth[] | null>(null);
  const [webuiUp, setWebuiUp] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/engines')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d?.engines) setEngines(d.engines);
      })
      .catch(() => {});
    fetch(OPEN_WEBUI_URL, { mode: 'no-cors' })
      .then(() => {
        if (alive) setWebuiUp(true);
      })
      .catch(() => {
        if (alive) setWebuiUp(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const healthy = engines?.filter((e) => e.up).length ?? 0;
  const total = engines?.length ?? 0;

  return (
    <div className="uai-page uai-page-fill">
      <div className="uai-chatbar">
        <div className="uai-chatbar-brand">
          <Logo />
          <div>
            <div className="uai-chatbar-title">Ultra AI</div>
            <div className="uai-chatbar-sub">Open WebUI · primary surface</div>
          </div>
        </div>
        <div className="uai-chatbar-right">
          {engines && (
            <span className="uai-chatbar-status">
              <span
                className={`uai-dot ${healthy === total ? 'ok' : 'warn'}`}
              />
              {healthy}/{total} engines
            </span>
          )}
          <Link href="/zeroai" className="uai-chatbar-link">
            <Icon name="brain" size={13} /> ZeroAI
          </Link>
          <Link href="/dashboard" className="uai-chatbar-link">
            <Icon name="gauge" size={13} /> Dashboard
          </Link>
          <a
            href={OPEN_WEBUI_URL}
            target="_blank"
            rel="noreferrer"
            className="uai-chatbar-link"
          >
            <Icon name="external" size={13} /> Standalone
          </a>
        </div>
      </div>

      <div className="uai-surface uai-surface-fill">
        {webuiUp === false ? (
          <div className="uai-empty">
            <Icon name="chat" size={28} />
            <div className="uai-empty-title">Open WebUI is offline</div>
            <div className="uai-empty-sub">
              The Open WebUI container is not reachable at {OPEN_WEBUI_URL}.
              Start it with <code>docker compose up -d open-webui</code>, or
              use <Link href="/zeroai">ZeroAI</Link> meanwhile.
            </div>
          </div>
        ) : (
          <iframe
            src={OPEN_WEBUI_URL}
            title="Open WebUI — Ultra AI"
            className="uai-frame uai-frame-fill"
            allow="microphone; clipboard-read; clipboard-write"
          />
        )}
      </div>
    </div>
  );
}
