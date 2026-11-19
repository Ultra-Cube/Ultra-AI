// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { NullTrayAdapter, SystemTray, TrayMenuItem } from './system-tray';
import { DesktopUIConfig } from './types';

const config: DesktopUIConfig = {
  title: 'Ultra AI',
  width: 1200,
  height: 800,
  icon: 'icon.png',
  enableTray: true,
  enableAutoUpdate: true,
  port: 3000,
};

class RecordingAdapter extends NullTrayAdapter {
  updates: TrayMenuItem[][] = [];
  async update(items: TrayMenuItem[]): Promise<void> {
    this.updates.push(items);
  }
}

describe('SystemTray', () => {
  it('starts stopped and not visible before initialize', () => {
    const tray = new SystemTray(config);
    expect(tray.getStatus()).toBe('stopped');
    expect(tray.isVisible()).toBe(false);
  });

  it('transitions to starting on initialize and becomes visible', async () => {
    const tray = new SystemTray(config);
    await tray.initialize();
    expect(tray.getStatus()).toBe('starting');
    expect(tray.isVisible()).toBe(true);
  });

  it('builds a menu with status, window controls, surfaces and quit', async () => {
    const tray = new SystemTray(config);
    await tray.initialize();
    tray.setStatus('running');
    tray.setSurfaces([
      { id: 'dashboard', label: 'Dashboard', path: '/', primary: true },
      { id: 'hermes', label: 'Hermes', path: '/hermes', primary: true },
      { id: 'settings', label: 'Settings', path: '/settings' },
    ]);

    const items = tray.getMenuItems();
    const ids = items.map((i) => i.id);
    expect(ids).toContain('status');
    expect(ids).toContain('show-window');
    expect(ids).toContain('hide-window');
    expect(ids).toContain('surface-dashboard');
    expect(ids).toContain('surface-hermes');
    expect(ids).not.toContain('surface-settings');
    expect(ids).toContain('quit');
  });

  it('disables hide-window when window already hidden and vice versa', async () => {
    const tray = new SystemTray(config);
    await tray.initialize();
    tray.setWindowVisible(false);
    const items = tray.getMenuItems();
    expect(items.find((i) => i.id === 'show-window')?.enabled).toBe(true);
    expect(items.find((i) => i.id === 'hide-window')?.enabled).toBe(false);
  });

  it('emits action and quit events on select', async () => {
    const tray = new SystemTray(config);
    await tray.initialize();
    const actions: unknown[] = [];
    let quit = false;
    tray.on('action', (a) => actions.push(a));
    tray.on('quit', () => (quit = true));

    await tray.select('quit');
    expect(quit).toBe(true);

    tray.setSurfaces([
      { id: 'hermes', label: 'Hermes', path: '/hermes', primary: true },
    ]);
    await tray.select('surface-hermes');
    expect(actions).toContainEqual({
      action: 'open-surface',
      payload: 'hermes',
    });
  });

  it('returns false when selecting a disabled or unknown item', async () => {
    const tray = new SystemTray(config);
    await tray.initialize();
    // show-window is disabled while the window is already visible
    expect(await tray.select('show-window')).toBe(false);
    expect(await tray.select('nonexistent')).toBe(false);
  });

  it('pushes menu updates to the adapter on state changes', async () => {
    const adapter = new RecordingAdapter();
    const tray = new SystemTray(config, adapter);
    await tray.initialize();
    tray.setStatus('running');
    expect(adapter.updates.length).toBeGreaterThanOrEqual(2);
    const last = adapter.updates[adapter.updates.length - 1];
    expect(last.find((i) => i.id === 'status')?.label).toBe('Running');
  });

  it('disposes the adapter and marks stopped on cleanup', async () => {
    const tray = new SystemTray(config);
    await tray.initialize();
    await tray.cleanup();
    expect(tray.getStatus()).toBe('stopped');
  });

  it('includes product title in tooltip', async () => {
    const tray = new SystemTray(config);
    await tray.initialize();
    tray.setStatus('degraded');
    expect(tray.getTooltip()).toBe('Ultra AI — Degraded');
  });
});
