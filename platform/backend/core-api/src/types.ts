// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

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
