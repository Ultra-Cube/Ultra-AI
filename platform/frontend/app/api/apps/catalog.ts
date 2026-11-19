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

/**
 * External application connector catalog + health probing.
 * `healthPath` is probed server-side so the UI gets honest status without
 * opening the app. `apiBase` is the REST surface callable through
 * /api/apps/[id]/proxy (GET only, whitelisted hosts only).
 */

export interface AppDef {
  id: string;
  name: string;
  category: "automation" | "observability" | "gateway" | "chat" | "runtime";
  baseUrl: string;
  healthPath: string;
  embedPath?: string;
  apiBase?: string;
  requiresConfirm: boolean;
  description: string;
}

const APPS: AppDef[] = [
  { id: "n8n", name: "n8n", category: "automation", baseUrl: "http://localhost:5678", healthPath: "/healthz", embedPath: "/", apiBase: "/api/v1", requiresConfirm: false, description: "Workflow automation engine" },
  { id: "grafana", name: "Grafana", category: "observability", baseUrl: "http://localhost:3001", healthPath: "/api/health", embedPath: "/", apiBase: "/api", requiresConfirm: false, description: "Metrics dashboards and alerting" },
  { id: "omniroute", name: "OmniRoute", category: "gateway", baseUrl: "http://localhost:20128", healthPath: "/health", embedPath: "/", apiBase: "/v1", requiresConfirm: true, description: "Model routing gateway (provider failover, budgets)" },
  { id: "hermes", name: "Hermes Dashboard", category: "runtime", baseUrl: "http://localhost:9119", healthPath: "/health", embedPath: "/", requiresConfirm: false, description: "Hermes agent runtime control surface" },
  { id: "open-webui", name: "Open WebUI", category: "chat", baseUrl: "http://localhost:8080", healthPath: "/health", embedPath: "/", requiresConfirm: false, description: "Primary chat surface (embedded in /chat)" },
];

export function getApp(id: string): AppDef | undefined {
  return APPS.find((a) => a.id === id);
}

export { APPS };

