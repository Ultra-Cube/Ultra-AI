export interface WorkspaceRecommendationRequest {
  role: 'video-designer' | 'developer' | 'researcher' | 'marketer' | 'custom';
  preferredTools?: string[];
  usageSignals?: string[];
}

export interface WorkspaceRecommendation {
  role: WorkspaceRecommendationRequest['role'];
  sections: string[];
  pinnedWidgets: string[];
  suggestedTools: string[];
  adaptationEnabled: boolean;
}

export interface AuthRequest {
  email: string;
  password: string;
}
