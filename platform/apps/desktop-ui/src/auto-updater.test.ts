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

import {
  AutoUpdater,
  NullUpdateAdapter,
  UpdateAdapter,
  UpdateInfo,
} from './auto-updater';

const update: UpdateInfo = { version: '1.2.0', notes: 'fixes' };

function fakeAdapter(overrides: Partial<UpdateAdapter> = {}): UpdateAdapter {
  return {
    checkForUpdates: async () => update,
    download: async () => {},
    quitAndInstall: async () => {},
    ...overrides,
  };
}

describe('AutoUpdater', () => {
  test('NullUpdateAdapter reports up-to-date', async () => {
    const u = new AutoUpdater({ adapter: new NullUpdateAdapter() });
    expect(await u.check()).toBeNull();
    expect(u.getStatus()).toBe('up-to-date');
  });

  test('available update auto-downloads and reaches ready', async () => {
    const u = new AutoUpdater({ adapter: fakeAdapter() });
    const events: string[] = [];
    u.on('status-changed', (s) => events.push(s));
    const info = await u.check();
    expect(info).toEqual(update);
    expect(u.getStatus()).toBe('ready');
    expect(u.getPendingUpdate()).toEqual(update);
    expect(events).toContain('available');
    expect(events).toContain('downloading');
    expect(events).toContain('ready');
  });

  test('manual download when autoDownload=false', async () => {
    const u = new AutoUpdater({ autoDownload: false, adapter: fakeAdapter() });
    await u.check();
    expect(u.getStatus()).toBe('available');
    await u.download();
    expect(u.getStatus()).toBe('ready');
  });

  test('install only works when ready', async () => {
    const adapter = fakeAdapter();
    const quitSpy = jest.spyOn(adapter, 'quitAndInstall');
    const u = new AutoUpdater({ adapter });
    expect(await u.install()).toBe(false);
    await u.check();
    expect(await u.install()).toBe(true);
    expect(quitSpy).toHaveBeenCalledTimes(1);
  });

  test('check error transitions to error status', async () => {
    const u = new AutoUpdater({
      adapter: fakeAdapter({
        checkForUpdates: async () => {
          throw new Error('feed down');
        },
      }),
    });
    const err = new Promise((r) => u.once('error', r));
    expect(await u.check()).toBeNull();
    expect(u.getStatus()).toBe('error');
    await err;
  });

  test('download error transitions to error', async () => {
    const u = new AutoUpdater({
      adapter: fakeAdapter({
        download: async () => {
          throw new Error('net fail');
        },
      }),
    });
    const err = new Promise((r) => u.once('error', r));
    await u.check();
    expect(u.getStatus()).toBe('error');
    await err;
  });

  test('download progress is forwarded', async () => {
    const u = new AutoUpdater({
      autoDownload: false,
      adapter: fakeAdapter({
        download: async (_upd, onProgress) => {
          onProgress?.({ downloadedBytes: 5, totalBytes: 10 });
        },
      }),
    });
    const progress = new Promise((r) => u.once('download-progress', r));
    await u.check();
    await u.download();
    expect(await progress).toEqual({ downloadedBytes: 5, totalBytes: 10 });
  });

  test('reset clears pending update', async () => {
    const u = new AutoUpdater({ autoDownload: false, adapter: fakeAdapter() });
    await u.check();
    u.reset();
    expect(u.getStatus()).toBe('idle');
    expect(u.getPendingUpdate()).toBeNull();
  });
});
