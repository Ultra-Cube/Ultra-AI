// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

export type McpTransport = 'stdio' | 'sse' | 'http';

export interface StdioServerConfig {
  transport: 'stdio';
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}

export interface RemoteServerConfig {
  transport: 'sse' | 'http';
  url: string;
  headers?: Record<string, string>;
}

export type McpServerConfig = StdioServerConfig | RemoteServerConfig;

export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface McpToolResult {
  content: unknown;
  isError?: boolean;
}

export interface McpServerInfo {
  name: string;
  transport: McpTransport;
  tools: McpTool[];
  status: 'connected' | 'disconnected' | 'error';
  lastError?: string;
}

export interface CallPolicy {
  /** tool name patterns the hub may invoke; empty = all */
  allow?: string[];
  /** tool name patterns always denied (wins over allow) */
  deny?: string[];
  requireConfirm?: boolean;
}

export interface HubCallResult {
  server: string;
  tool: string;
  result?: McpToolResult;
  error?: string;
  confirmed?: boolean;
}
