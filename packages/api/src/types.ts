export interface WorkspaceRecommendationRequest {
  userId: string;
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
