import {
  WorkspaceRecommendation,
  WorkspaceRecommendationRequest,
} from '../types';

const ROLE_SECTIONS: Record<WorkspaceRecommendationRequest['role'], string[]> = {
  'video-designer': ['timeline', 'preview', 'assets', 'captions', 'exports'],
  developer: ['chat', 'code-tools', 'api-console', 'logs', 'history'],
  researcher: ['chat', 'datasets', 'analysis', 'citations', 'reports'],
  marketer: ['chat', 'campaigns', 'content-studio', 'analytics', 'exports'],
  custom: ['chat', 'tools', 'history', 'settings'],
};

const ROLE_TOOLS: Record<WorkspaceRecommendationRequest['role'], string[]> = {
  'video-designer': ['caption-generator', 'scene-detection', 'export-presets'],
  developer: ['api-debugger', 'code-assistant', 'prompt-testing'],
  researcher: ['document-summarizer', 'citation-helper', 'table-analysis'],
  marketer: ['copy-generator', 'seo-auditor', 'campaign-planner'],
  custom: ['general-assistant'],
};

export class WorkspaceRecommender {
  recommend(input: WorkspaceRecommendationRequest): WorkspaceRecommendation {
    const baseSections = ROLE_SECTIONS[input.role] ?? ROLE_SECTIONS.custom;
    const baseTools = ROLE_TOOLS[input.role] ?? ROLE_TOOLS.custom;

    const signalTools = this.mapSignalsToTools(input.usageSignals ?? []);
    const suggestedTools = this.unique([
      ...baseTools,
      ...(input.preferredTools ?? []),
      ...signalTools,
    ]);

    return {
      role: input.role,
      sections: baseSections,
      pinnedWidgets: baseSections.slice(0, 2),
      suggestedTools,
      adaptationEnabled: true,
    };
  }

  private mapSignalsToTools(signals: string[]): string[] {
    const tools: string[] = [];

    for (const signal of signals) {
      const normalized = signal.toLowerCase();
      if (normalized.includes('subtitle') || normalized.includes('caption')) {
        tools.push('caption-generator');
      }
      if (normalized.includes('export') || normalized.includes('render')) {
        tools.push('export-presets');
      }
      if (normalized.includes('bug') || normalized.includes('error')) {
        tools.push('debug-assistant');
      }
    }

    return tools;
  }

  private unique(items: string[]): string[] {
    return Array.from(new Set(items));
  }
}
