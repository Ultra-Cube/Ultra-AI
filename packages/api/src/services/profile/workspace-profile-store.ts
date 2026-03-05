import { WorkspaceRecommendationRequest } from '../../types';
import fs from 'node:fs';
import path from 'node:path';

export interface WorkspaceProfile {
  userId: string;
  role: WorkspaceRecommendationRequest['role'];
  pinnedWidgets: string[];
  preferredTools: string[];
  lastSignals: string[];
  updatedAt: string;
}

export class WorkspaceProfileStore {
  private readonly profiles = new Map<string, WorkspaceProfile>();
  private readonly storagePath: string;

  constructor(storagePath = path.resolve(process.cwd(), 'data/workspace-profiles.json')) {
    this.storagePath = storagePath;
    this.loadFromDisk();
  }

  get(userId: string): WorkspaceProfile | null {
    return this.profiles.get(userId) ?? null;
  }

  upsert(profile: Omit<WorkspaceProfile, 'updatedAt'>): WorkspaceProfile {
    const updated: WorkspaceProfile = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };

    this.profiles.set(profile.userId, updated);
    this.saveToDisk();
    return updated;
  }

  private loadFromDisk(): void {
    try {
      if (!fs.existsSync(this.storagePath)) {
        return;
      }

      const raw = fs.readFileSync(this.storagePath, 'utf8');
      const parsed = JSON.parse(raw) as WorkspaceProfile[];

      for (const profile of parsed) {
        this.profiles.set(profile.userId, profile);
      }
    } catch {
      // Fallback to empty in-memory store if the persisted file is invalid.
      this.profiles.clear();
    }
  }

  private saveToDisk(): void {
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(
      this.storagePath,
      JSON.stringify(Array.from(this.profiles.values()), null, 2),
      'utf8',
    );
  }
}
