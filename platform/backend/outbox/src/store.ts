/**
 * Event stores and cursor stores for the outbox.
 *
 * JsonlEventStore: append-only JSONL with fsync on every append, a lockfile
 * for single-writer exclusion, and crash recovery — a truncated trailing
 * line is dropped on open so the chain resumes at the last complete event.
 */

import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

import type { CursorStore, EventStore, OutboxEvent } from './types';

export class InMemoryEventStore implements EventStore {
  private events: OutboxEvent[] = [];

  append(event: OutboxEvent): void {
    this.events.push(event);
  }

  all(): OutboxEvent[] {
    return [...this.events];
  }
}

function isProbablyEvent(v: unknown): v is OutboxEvent {
  const e = v as OutboxEvent;
  return (
    typeof e === 'object' &&
    e !== null &&
    e.schema === 'ultra.event.v1' &&
    typeof e.id === 'string' &&
    typeof e.prev_hash === 'string' &&
    typeof e.sig === 'object' &&
    e.sig !== null
  );
}

export class JsonlEventStore implements EventStore {
  private fd: number | null = null;
  private buffer: OutboxEvent[] = [];
  private lockPath: string;
  private lockFd: number | null = null;

  constructor(private readonly path: string) {
    this.lockPath = `${path}.lock`;
  }

  /**
   * Open the store: acquire the lockfile, then load existing events.
   * A partial trailing line (crash mid-write) is discarded.
   */
  open(): void {
    mkdirSync(dirname(this.path), { recursive: true });
    this.acquireLock();

    this.buffer = [];
    if (existsSync(this.path)) {
      const raw = readFileSync(this.path, 'utf8');
      const lines = raw.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '') continue;
        let parsed: unknown;
        try {
          parsed = JSON.parse(line);
        } catch {
          if (
            i === lines.length - 1 ||
            lines.slice(i + 1).every((l) => l.trim() === '')
          ) {
            // Truncated final write — recover up to last complete event.
            break;
          }
          throw new Error(`corrupt outbox line ${i + 1} in ${this.path}`);
        }
        if (!isProbablyEvent(parsed)) {
          throw new Error(
            `invalid event record at line ${i + 1} in ${this.path}`
          );
        }
        this.buffer.push(parsed);
      }
    }

    this.fd = openSync(this.path, 'a');
  }

  append(event: OutboxEvent): void {
    if (this.fd === null) throw new Error('JsonlEventStore is not open');
    const line = `${JSON.stringify(event)}\n`;
    writeSync(this.fd, line, undefined, 'utf8');
    fsyncSync(this.fd);
    this.buffer.push(event);
  }

  all(): OutboxEvent[] {
    return [...this.buffer];
  }

  close(): void {
    if (this.fd !== null) {
      fsyncSync(this.fd);
      closeSync(this.fd);
      this.fd = null;
    }
    this.releaseLock();
  }

  /** Raw file size — useful for tests/diagnostics. */
  sizeBytes(): number {
    return existsSync(this.path) ? statSync(this.path).size : 0;
  }

  private acquireLock(): void {
    if (existsSync(this.lockPath)) {
      const stale = this.isStaleLock();
      if (!stale) {
        throw new Error(`outbox locked: ${this.lockPath}`);
      }
      unlinkSync(this.lockPath);
    }
    this.lockFd = openSync(this.lockPath, 'wx');
    writeSync(this.lockFd, `${process.pid} ${Date.now()}\n`, undefined, 'utf8');
    fsyncSync(this.lockFd);
  }

  private releaseLock(): void {
    if (this.lockFd !== null) {
      closeSync(this.lockFd);
      this.lockFd = null;
    }
    try {
      rmSync(this.lockPath, { force: true });
    } catch {
      /* ignore */
    }
  }

  /** Lock is stale if the recorded pid is no longer alive. */
  private isStaleLock(): boolean {
    try {
      const content = readFileSync(this.lockPath, 'utf8').trim();
      const pid = Number(content.split(/\s+/)[0]);
      if (!Number.isInteger(pid) || pid <= 0) return true;
      process.kill(pid, 0); // throws if not alive
      return false;
    } catch (err) {
      return (err as NodeJS.ErrnoException).code === 'ESRCH';
    }
  }
}

export class InMemoryCursorStore implements CursorStore {
  private cursors = new Map<string, string>();

  get(targetId: string): string | undefined {
    return this.cursors.get(targetId);
  }

  set(targetId: string, id: string): void {
    this.cursors.set(targetId, id);
  }
}

/** JSON-file backed cursor store (one file per targetId). */
export class JsonCursorStore implements CursorStore {
  constructor(private readonly dir: string) {}

  private file(targetId: string): string {
    return join(this.dir, `${targetId.replace(/[^a-zA-Z0-9._-]/g, '_')}.json`);
  }

  get(targetId: string): string | undefined {
    const f = this.file(targetId);
    if (!existsSync(f)) return undefined;
    try {
      const parsed = JSON.parse(readFileSync(f, 'utf8')) as { id?: string };
      return typeof parsed.id === 'string' ? parsed.id : undefined;
    } catch {
      return undefined;
    }
  }

  set(targetId: string, id: string): void {
    mkdirSync(this.dir, { recursive: true });
    const f = this.file(targetId);
    const tmp = `${f}.tmp`;
    writeFileSync(tmp, `${JSON.stringify({ id })}\n`, 'utf8');
    renameSync(tmp, f);
  }
}
