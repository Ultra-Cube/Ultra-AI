// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗ ██╗      ███████╗ ██████╗   █████╗                             ║
// ║ ██║   ██║ ██║      ╚══██╔══╝ ██╔══██╗ ██╔══██╗                           ║
// ║ ██║   ██║ ██║         ██║    ██████╔╝ ███████║                           ║
// ║ ╚██╗ ██╔╝ ██║         ██║    ██╔══██║ ██╔══██║                           ║
// ║  ╚████╔╝ ███████╗    ██║    ██║  ██║ ██║  ██║                            ║
// ║   ╚═══╝  ╚══════╝    ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝                            ║
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

'use client';

/**
 * Schema-driven renderer for the ZeroAI adaptive UI contract (ultra.ui.v1).
 * Renders UiSchema components generically; `bind` resolves dot-paths into
 * the supplied `data` object (typically a zeroai.run / gateway.chat result).
 */

export interface UiComponent {
  id: string;
  kind: string;
  bind?: string;
  props?: Record<string, unknown>;
  children?: UiComponent[];
}

export interface UiSchema {
  version: 'ultra.ui.v1';
  kind: string;
  title?: string;
  description?: string;
  components: UiComponent[];
}

export interface AdaptiveRendererProps {
  schema: UiSchema;
  data?: Record<string, unknown> | null;
  onAction?: (method: string, values: Record<string, string>) => void;
  onConfirm?: (approved: boolean) => void;
  busy?: boolean;
}

function resolve(
  data: Record<string, unknown> | null | undefined,
  path?: string
): unknown {
  if (!path || !data) return undefined;
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object')
      return (acc as Record<string, unknown>)[key];
    return undefined;
  }, data);
}

function text(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function Badge({ value }: { value: unknown }) {
  const v = text(value) || 'unknown';
  const cls =
    v === 'local'
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      : v === 'escalated' || v === 'network'
        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
        : 'bg-sky-500/15 text-sky-300 border-sky-500/30';
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium ${cls}`}
    >
      {v}
    </span>
  );
}

export default function AdaptiveRenderer({
  schema,
  data,
  onAction,
  onConfirm,
  busy,
}: AdaptiveRendererProps) {
  const values: Record<string, string> = {};

  const renderComponent = (c: UiComponent): React.ReactNode => {
    const bound = resolve(data, c.bind);
    const p = c.props ?? {};
    switch (c.kind) {
      case 'heading':
        return (
          <h3 key={c.id} className="text-lg font-semibold text-white">
            {text(p.text)}
          </h3>
        );
      case 'text':
        return (
          <p key={c.id} className="text-sm text-slate-300 whitespace-pre-wrap">
            {bound !== undefined ? text(bound) : text(p.text)}
          </p>
        );
      case 'status':
        return (
          <div key={c.id} className="text-sm">
            <span className="text-slate-400">{text(p.label ?? c.id)}: </span>
            <span className="text-white font-medium">
              {text(bound ?? p.text)}
            </span>
          </div>
        );
      case 'badge':
        return (
          <div key={c.id} className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">{text(p.label ?? 'Status')}</span>
            <Badge value={bound ?? p.text} />
          </div>
        );
      case 'field': {
        const name = String(p.name ?? c.id);
        const label = String(p.label ?? name);
        const type = String(p.type ?? 'text');
        const common =
          'w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white';
        return (
          <label key={c.id} className="block text-sm">
            <span className="text-slate-400">{label}</span>
            {type === 'textarea' ? (
              <textarea
                className={common}
                rows={3}
                name={name}
                onChange={(e) => {
                  values[name] = e.target.value;
                }}
              />
            ) : type === 'select' ? (
              <select className={common} name={name} defaultValue="">
                {(Array.isArray(p.options) ? p.options : []).map((o) => (
                  <option key={String(o)} value={String(o)}>
                    {String(o)}
                  </option>
                ))}
              </select>
            ) : (
              <input className={common} name={name} type={type} />
            )}
          </label>
        );
      }
      case 'form':
        return (
          <div key={c.id} className="space-y-3">
            {(c.children ?? []).map(renderComponent)}
          </div>
        );
      case 'table': {
        const rows = Array.isArray(bound) ? bound : [];
        const cols = Array.isArray(p.columns)
          ? (p.columns as string[])
          : rows.length
            ? Object.keys(rows[0] as Record<string, unknown>)
            : [];
        return (
          <div key={c.id} className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  {cols.map((col) => (
                    <th key={col} className="py-2 pr-4 font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-b border-slate-800">
                    {cols.map((col) => (
                      <td key={col} className="py-2 pr-4 text-slate-200">
                        {text((row as Record<string, unknown>)?.[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      case 'action':
        return (
          <button
            key={c.id}
            type="button"
            disabled={busy}
            onClick={() => onAction?.(String(p.method ?? ''), values)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {text(p.label ?? 'Run')}
          </button>
        );
      case 'confirm':
        return (
          <div key={c.id} className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onConfirm?.(true)}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {text(p.approveLabel ?? 'Approve')}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onConfirm?.(false)}
              className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-50"
            >
              {text(p.denyLabel ?? 'Deny')}
            </button>
          </div>
        );
      case 'json':
        return bound === undefined ? null : (
          <pre
            key={c.id}
            className="max-h-64 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-300"
          >
            {text(bound)}
          </pre>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {schema.title ? (
        <h2 className="text-xl font-semibold text-white">{schema.title}</h2>
      ) : null}
      {schema.description ? (
        <p className="text-sm text-slate-400">{schema.description}</p>
      ) : null}
      {schema.components.map(renderComponent)}
    </div>
  );
}
