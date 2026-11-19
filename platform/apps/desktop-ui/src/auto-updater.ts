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
 * Auto Updater
 *
 * Update lifecycle controller for the desktop shell. Like the system tray,
 * the actual download/install mechanics are platform-specific (Tauri updater,
 * Electron autoUpdater, Squirrel), so this module owns the *contract*: check
 * → available → download → ready → install, with status events the shell and
 * UI can render. A NullUpdateAdapter is the default so the controller is fully
 * testable without a packaging backend.
 */

import { EventEmitter } from 'events';

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'up-to-date'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'error';

export interface UpdateInfo {
  version: string;
  /** Human-readable release notes, if the feed provides them. */
  notes?: string;
  /** Optional download size in bytes for progress display. */
  sizeBytes?: number;
}

export interface UpdateProgress {
  downloadedBytes: number;
  totalBytes: number;
}

/**
 * Platform seam: implementations talk to the real updater backend. All methods
 * are optional-capable via NullUpdateAdapter defaults; the controller only
 * calls what it needs.
 */
export interface UpdateAdapter {
  checkForUpdates(): Promise<UpdateInfo | null>;
  download(
    update: UpdateInfo,
    onProgress?: (p: UpdateProgress) => void
  ): Promise<void>;
  quitAndInstall(): Promise<void> | void;
}

export class NullUpdateAdapter implements UpdateAdapter {
  async checkForUpdates(): Promise<UpdateInfo | null> {
    return null;
  }

  async download(
    _update: UpdateInfo,
    _onProgress?: (p: UpdateProgress) => void
  ): Promise<void> {}

  async quitAndInstall(): Promise<void> {}
}

export class AutoUpdater extends EventEmitter {
  private status: UpdateStatus = 'idle';
  private pending: UpdateInfo | null = null;
  private readonly adapter: UpdateAdapter;
  private readonly autoDownload: boolean;

  constructor(opts: { autoDownload?: boolean; adapter?: UpdateAdapter } = {}) {
    super();
    this.autoDownload = opts.autoDownload !== false;
    this.adapter = opts.adapter ?? new NullUpdateAdapter();
  }

  getStatus(): UpdateStatus {
    return this.status;
  }

  getPendingUpdate(): UpdateInfo | null {
    return this.pending;
  }

  /**
   * Check the update feed. Emits 'status-changed' on every transition and
   * 'update-available' when a newer version exists. When autoDownload is on
   * (default), an available update is downloaded immediately.
   */
  async check(): Promise<UpdateInfo | null> {
    this.setStatus('checking');
    let info: UpdateInfo | null;
    try {
      info = await this.adapter.checkForUpdates();
    } catch (err) {
      this.setStatus('error');
      this.emit('error', err);
      return null;
    }

    if (!info) {
      this.pending = null;
      this.setStatus('up-to-date');
      return null;
    }

    this.pending = info;
    this.setStatus('available');
    this.emit('update-available', info);

    if (this.autoDownload) {
      await this.download();
    }
    return info;
  }

  /** Download the pending update. No-op when nothing is pending or already downloading. */
  async download(): Promise<void> {
    if (
      !this.pending ||
      this.status === 'downloading' ||
      this.status === 'ready'
    ) {
      return;
    }
    this.setStatus('downloading');
    try {
      await this.adapter.download(this.pending, (p) =>
        this.emit('download-progress', p)
      );
      this.setStatus('ready');
      this.emit('update-ready', this.pending);
    } catch (err) {
      this.setStatus('error');
      this.emit('error', err);
    }
  }

  /** Apply a downloaded update: asks the adapter to restart into the new version. */
  async install(): Promise<boolean> {
    if (this.status !== 'ready' || !this.pending) {
      return false;
    }
    await this.adapter.quitAndInstall();
    return true;
  }

  /** Reset to idle (e.g. after a failed install attempt or manual retry). */
  reset(): void {
    this.pending = null;
    this.setStatus('idle');
  }

  private setStatus(status: UpdateStatus): void {
    if (this.status === status) {
      return;
    }
    this.status = status;
    this.emit('status-changed', status);
  }
}
