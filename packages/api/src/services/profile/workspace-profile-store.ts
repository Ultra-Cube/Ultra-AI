import { WorkspaceRecommendationRequest } from '../../types';

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

  get(userId: string): WorkspaceProfile | null {
    return this.profiles.get(userId) ?? null;
  }

  upsert(profile: Omit<WorkspaceProfile, 'updatedAt'>): WorkspaceProfile {
    const updated: WorkspaceProfile = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };

    this.profiles.set(profile.userId, updated);
    return updated;
  }
}
