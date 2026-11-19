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
// ║ GitHub Org: github.com/Ultra-Cube                                        ║
// ║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export default function AboutPage() {
  return (
    <div className="page narrow">
      <header className="page-head">
        <div>
          <h1>About Ultra AI</h1>
          <p className="muted">
            Multi-agent cognitive platform — local-first, gateway-escalating
          </p>
        </div>
      </header>

      <section className="card about-hero">
        <div className="about-logo">
          <svg width="72" height="72" viewBox="0 0 32 32" aria-hidden>
            <rect width="32" height="32" rx="7" fill="#14161c" />
            <g
              fill="none"
              stroke="#f97316"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 3.5 L26.5 8.75 L16 14 L5.5 8.75 Z" fill="#23262f" />
              <path d="M5.5 8.75 L16 14 L16 26.5 L5.5 21.25 Z" fill="#1b1e26" />
              <path
                d="M26.5 8.75 L16 14 L16 26.5 L26.5 21.25 Z"
                fill="#20242e"
              />
              <path d="M16 3.5 L26.5 8.75 L16 14 L5.5 8.75 Z" />
              <path d="M5.5 8.75 L16 14 L16 26.5 L5.5 21.25 Z" />
              <path d="M26.5 8.75 L16 14 L16 26.5 L26.5 21.25 Z" />
              <path d="M16 8.5 L20.5 6.4 L23.5 8.2" strokeWidth="1" />
              <circle cx="23.5" cy="8.2" r="0.9" fill="#f97316" stroke="none" />
              <path d="M11.5 10.8 L14 8.9" strokeWidth="1" />
              <circle
                cx="11.5"
                cy="10.8"
                r="0.9"
                fill="#f97316"
                stroke="none"
              />
              <path d="M8.5 15.5 L12 15.5 L12 18.5" strokeWidth="1" />
              <circle cx="8.5" cy="15.5" r="0.9" fill="#f97316" stroke="none" />
              <circle cx="12" cy="18.5" r="0.9" fill="#f97316" stroke="none" />
              <path d="M23.5 15.5 L20 15.5 L20 18.5" strokeWidth="1" />
              <circle
                cx="23.5"
                cy="15.5"
                r="0.9"
                fill="#f97316"
                stroke="none"
              />
              <circle cx="20" cy="18.5" r="0.9" fill="#f97316" stroke="none" />
              <path d="M16 19 L16 23.5 L13.5 25.5" strokeWidth="1" />
              <circle
                cx="13.5"
                cy="25.5"
                r="0.9"
                fill="#f97316"
                stroke="none"
              />
            </g>
          </svg>
        </div>
        <div>
          <h2>Ultra AI</h2>
          <p>
            A local-first multi-agent AI platform. Hermes Agent is the cognitive
            core; Ultra AI provides the Memory Bank, skill registry, MCP hub,
            orchestration layer, and central control plane — with escalation to
            the Ultra gateway only when needed.
          </p>
        </div>
      </section>

      <section className="card">
        <h2>Credits</h2>
        <dl className="kv">
          <dt>Development team</dt>
          <dd>
            <a
              href="https://ultra-zone.ucubetech.com/"
              target="_blank"
              rel="noreferrer"
            >
              Ultra Zone — ultra-zone.ucubetech.com
            </a>
          </dd>
          <dt>Owning &amp; supporting company</dt>
          <dd>
            <a href="https://ucubetech.com/" target="_blank" rel="noreferrer">
              UltraCube Technology — ucubetech.com
            </a>
          </dd>
        </dl>
      </section>

      <section className="card">
        <h2>Stack</h2>
        <ul className="stack-list">
          <li>
            Hermes Agent — cognitive runtime (api_server :8642, dashboard :9119)
          </li>
          <li>OmniRoute — model routing (:20128)</li>
          <li>n8n — workflow automation (:5678)</li>
          <li>Grafana + Prometheus — observability (:3001 / :9090)</li>
          <li>ZeroAI — local-first execution engine</li>
          <li>
            Directory-Control-Systems — central control (<code>control/</code>)
          </li>
        </ul>
        <p className="muted small">
          © {new Date().getFullYear()} UltraCube Technology. All rights
          reserved.
        </p>
      </section>
    </div>
  );
}
