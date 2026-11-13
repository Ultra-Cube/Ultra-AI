/**
 * @ultra-ai/hermes-runtime
 * Hermes Agent runtime for Ultra AI Platform: memory, skills, reasoning,
 * orchestration, and provider/engine/tool/MCP adapter contracts.
 */

export { HermesRuntime } from './runtime/hermes-runtime';

// Types
export type {
  AgentId,
  SessionId,
  HermesMessage,
  HermesSession,
  HermesConfig,
  HermesTask,
  RuntimeEvent,
  EventHandler,
} from './types';

// Adapter contracts
export type {
  ProviderAdapter,
  ProviderCapabilities,
  ProviderGenerateRequest,
  ProviderGenerateResponse,
  EngineAdapter,
  EngineRunRequest,
  EngineRunResult,
  EngineStep,
  EngineDeps,
  ToolAdapter,
  ToolDefinition,
  ToolCall,
  ToolResult,
  ToolContext,
  MCPServerConfig,
  MCPToolInfo,
  MCPClient,
} from './adapters/contracts';

// Providers
export { MockProvider, ProviderHttpError } from './adapters/mock-provider';
export type { MockProviderOptions } from './adapters/mock-provider';
export {
  OpenAICompatibleProvider,
  providers as openAICompatibleProviders,
} from './adapters/openai-compatible';
export type { OpenAICompatibleOptions } from './adapters/openai-compatible';
export { AnthropicProvider } from './adapters/anthropic';
export type { AnthropicOptions } from './adapters/anthropic';

// Memory
export { InMemoryMemoryStore } from './memory/memory';
export type {
  MemoryStore,
  MemoryEntry,
  MemoryQuery,
  MemoryScope,
} from './memory/memory';

// Skills
export { SkillRegistry } from './skills/skills';
export type { SkillDefinition } from './skills/skills';

// Reasoning
export { ReActReasoner, ReasonerEngineAdapter } from './reasoning/reasoner';
export type { Reasoner } from './reasoning/reasoner';

// Orchestration
export { Orchestrator } from './orchestration/orchestrator';
export type {
  AgentHandle,
  DelegationRequest,
  DelegationResult,
  OrchestratorDeps,
} from './orchestration/orchestrator';
