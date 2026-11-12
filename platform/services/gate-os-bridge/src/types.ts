/**
 * Types mirroring platform/api/contracts/gate-os/openapi.yaml (/v1 contract).
 * Keep in sync with the OpenAPI document — it is the source of truth.
 */

export type EnvironmentId =
  | 'everyday'
  | 'gaming'
  | 'dev'
  | 'design'
  | 'media'
  | 'security'
  | 'business';

export type EnvironmentPreset = {
  id: EnvironmentId;
  label: string;
  aiProfile: string;
  enginesOn: string[];
  resourceNote: string;
};

export type EnvironmentProfile = {
  env: EnvironmentId;
  models?: Record<string, string>;
  engines?: Record<string, boolean>;
  budgets?: {
    maxConcurrentTasks?: number;
    offlineOnly?: boolean;
  };
  updatedAt?: string;
};

export type UiPanelKind =
  | 'assistant'
  | 'search'
  | 'dashboard'
  | 'editor'
  | 'monitor'
  | 'media'
  | 'security'
  | 'automation';

export type UiSpec = {
  env: EnvironmentId;
  specVersion: string;
  panels: { id: string; kind: UiPanelKind; visible?: boolean }[];
  assistant: { enabled: boolean; mode?: 'inline' | 'overlay' | 'hidden' };
  resourceHints?: Record<string, string>;
};

export type IntentRequest = {
  text: string;
  env?: EnvironmentId;
};

export type IntentResponse = {
  intent: string;
  confidence: number;
  suggestedEnvironment: EnvironmentId;
  actions: { type: string; label: string; payload?: Record<string, unknown> }[];
};

export type PlatformEventType =
  | 'environment.switched'
  | 'resource.pressure'
  | 'user.preference.changed'
  | 'notification.request';

export type PlatformEvent = {
  type: PlatformEventType;
  env?: EnvironmentId;
  ts: string;
  payload?: Record<string, unknown>;
  idempotencyKey?: string;
};

export type Health = {
  status: 'ok';
  contractVersion: string;
  uptimeSeconds: number;
};

export type Capabilities = {
  contractVersion: string;
  environments: EnvironmentId[];
  providers: string[];
  engines: string[];
  skills: string[];
  features: Record<string, boolean>;
};

export type ApiError = {
  error: string;
  code?: 'NOT_FOUND' | 'VALIDATION_ERROR' | 'UNAUTHORIZED';
  details?: string[];
};
