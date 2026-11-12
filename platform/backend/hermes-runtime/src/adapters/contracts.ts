/**
 * Adapter contracts — the extension surface of the Hermes runtime.
 *
 * Four adapter families keep provider/engine/tool/MCP quirks out of the
 * runtime core:
 *  - ProviderAdapter: LLM providers (OpenAI, Anthropic, Ollama, ...)
 *  - EngineAdapter: reasoning/orchestration engines (Hermes, LangGraph, ...)
 *  - ToolAdapter: callable tools exposed to the agent loop
 *  - MCPClient/MCPServer: Model Context Protocol transports
 */

import type { HermesMessage } from '../types';

// ---------------------------------------------------------------------------
// Provider adapters (LLM backends)
// ---------------------------------------------------------------------------

export interface ProviderCapabilities {
  streaming: boolean;
  toolCalling: boolean;
  embeddings: boolean;
  maxContextTokens?: number;
}

export interface ProviderGenerateRequest {
  model: string;
  messages: HermesMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];
  signal?: AbortSignal;
}

export interface ProviderGenerateResponse {
  content: string;
  model: string;
  provider: string;
  usage?: { promptTokens: number; completionTokens: number };
  toolCalls?: ToolCall[];
  latencyMs: number;
}

export interface ProviderAdapter {
  readonly id: string;
  readonly capabilities: ProviderCapabilities;
  generate(req: ProviderGenerateRequest): Promise<ProviderGenerateResponse>;
  embed?(texts: string[]): Promise<number[][]>;
}

// ---------------------------------------------------------------------------
// Engine adapters (reasoning/orchestration backends)
// ---------------------------------------------------------------------------

export interface EngineStep {
  kind: 'thought' | 'action' | 'observation' | 'answer';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface EngineRunRequest {
  goal: string;
  context: HermesMessage[];
  tools: ToolDefinition[];
  maxSteps: number;
  signal?: AbortSignal;
}

export interface EngineRunResult {
  answer: string;
  steps: EngineStep[];
  toolCallsMade: number;
  iterationsUsed: number;
}

export interface EngineAdapter {
  readonly id: string;
  run(req: EngineRunRequest, deps: EngineDeps): Promise<EngineRunResult>;
}

export interface EngineDeps {
  provider: ProviderAdapter;
  invokeTool: (call: ToolCall) => Promise<ToolResult>;
  onStep?: (step: EngineStep) => void;
}

// ---------------------------------------------------------------------------
// Tool adapters
// ---------------------------------------------------------------------------

export interface ToolDefinition {
  name: string;
  description: string;
  /** JSON Schema for the tool arguments. */
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  callId: string;
  ok: boolean;
  content: string;
  isError?: boolean;
}

export interface ToolAdapter {
  readonly definition: ToolDefinition;
  invoke(args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult>;
}

export interface ToolContext {
  sessionId: string;
  agentId: string;
  signal?: AbortSignal;
}

// ---------------------------------------------------------------------------
// MCP (Model Context Protocol) contracts
// ---------------------------------------------------------------------------

export interface MCPServerConfig {
  id: string;
  transport: 'stdio' | 'sse' | 'http';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

export interface MCPToolInfo {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/** Minimal client surface; implementations may wrap @modelcontextprotocol/sdk. */
export interface MCPClient {
  connect(config: MCPServerConfig): Promise<void>;
  disconnect(): Promise<void>;
  listTools(): Promise<MCPToolInfo[]>;
  callTool(name: string, args: Record<string, unknown>): Promise<unknown>;
}
