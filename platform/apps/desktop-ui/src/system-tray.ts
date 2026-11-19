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

/**
 * System Tray
 * Tray menu model + lifecycle controller. Rendering is delegated to a
 * TrayAdapter port so a real platform backend (StatusNotifierItem / Win32
 * tray / Tauri tray) can be injected without changing the menu contract.
 */

import { EventEmitter } from 'events';

import { DesktopUIConfig, WebSurface } from './types';

export type TrayStatus = 'starting' | 'running' | 'degraded' | 'stopped';

export type TrayAction =
  | 'open-surface'
  | 'show-window'
  | 'hide-window'
  | 'quit'
  | 'status';

export interface TrayMenuItem {
  id: string;
  label: string;
  action: TrayAction;
  /** Extra payload, e.g. surface id for 'open-surface'. */
  payload?: string;
  enabled: boolean;
  separator?: boolean;
}

/**
 * Port implemented by platform tray backends. The default NullTrayAdapter
 * performs no OS rendering but keeps the full menu contract testable; real
 * adapters map items onto StatusNotifierItem/Win32 menus.
 */
export interface TrayAdapter {
  show(items: TrayMenuItem[], tooltip: string): Promise<void> | void;
  update(items: TrayMenuItem[], tooltip: string): Promise<void> | void;
  hide(): Promise<void> | void;
  dispose(): Promise<void> | void;
}

export class NullTrayAdapter implements TrayAdapter {
  async show(_items: TrayMenuItem[], _tooltip: string): Promise<void> {}
  async update(_items: TrayMenuItem[], _tooltip: string): Promise<void> {}
  async hide(): Promise<void> {}
  async dispose(): Promise<void> {}
}

const STATUS_LABEL: Record<TrayStatus, string> = {
  starting: 'Starting…',
  running: 'Running',
  degraded: 'Degraded',
  stopped: 'Stopped',
};

export class SystemTray extends EventEmitter {
  private config: DesktopUIConfig;
  private adapter: TrayAdapter;
  private status: TrayStatus = 'stopped';
  private surfaces: WebSurface[] = [];
  private windowVisible = true;
  private initialized = false;

  constructor(
    config: DesktopUIConfig,
    adapter: TrayAdapter = new NullTrayAdapter()
  ) {
    super();
    this.config = config;
    this.adapter = adapter;
  }

  async initialize(): Promise<void> {
    this.initialized = true;
    this.setStatus('starting');
    this.emit('initialized');
  }

  /** Surfaces offered under "Open" in the tray menu. */
  setSurfaces(surfaces: WebSurface[]): void {
    this.surfaces = [...surfaces];
    this.refresh();
  }

  setStatus(status: TrayStatus): void {
    this.status = status;
    this.refresh();
  }

  getStatus(): TrayStatus {
    return this.status;
  }

  setWindowVisible(visible: boolean): void {
    this.windowVisible = visible;
    this.refresh();
  }

  /** Build the current tray menu. */
  getMenuItems(): TrayMenuItem[] {
    const items: TrayMenuItem[] = [
      {
        id: 'status',
        label: STATUS_LABEL[this.status],
        action: 'status',
        enabled: false,
      },
      {
        id: 'sep-1',
        label: '',
        action: 'status',
        enabled: false,
        separator: true,
      },
      {
        id: 'show-window',
        label: 'Show Window',
        action: 'show-window',
        enabled: !this.windowVisible,
      },
      {
        id: 'hide-window',
        label: 'Hide Window',
        action: 'hide-window',
        enabled: this.windowVisible,
      },
    ];

    for (const surface of this.surfaces.filter((s) => s.primary)) {
      items.push({
        id: `surface-${surface.id}`,
        label: `Open ${surface.label}`,
        action: 'open-surface',
        payload: surface.id,
        enabled: true,
      });
    }

    items.push({
      id: 'sep-2',
      label: '',
      action: 'status',
      enabled: false,
      separator: true,
    });
    items.push({ id: 'quit', label: 'Quit', action: 'quit', enabled: true });
    return items;
  }

  getTooltip(): string {
    return `${this.config.title} — ${STATUS_LABEL[this.status]}`;
  }

  /** Route a menu selection through the event contract. */
  async select(itemId: string): Promise<boolean> {
    const item = this.getMenuItems().find((i) => i.id === itemId && i.enabled);
    if (!item) return false;
    this.emit('action', { action: item.action, payload: item.payload });
    if (item.action === 'quit') {
      this.emit('quit');
    }
    return true;
  }

  isVisible(): boolean {
    return this.initialized;
  }

  private async refresh(): Promise<void> {
    if (!this.initialized) return;
    const items = this.getMenuItems();
    await this.adapter.update(items, this.getTooltip());
    this.emit('menu-updated', items);
  }

  async show(): Promise<void> {
    if (!this.initialized) return;
    await this.adapter.show(this.getMenuItems(), this.getTooltip());
    this.emit('shown');
  }

  async hide(): Promise<void> {
    await this.adapter.hide();
    this.emit('hidden');
  }

  async cleanup(): Promise<void> {
    this.status = 'stopped';
    await this.adapter.dispose();
    this.emit('cleaned-up');
  }
}
