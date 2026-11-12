/**
 * JSON-RPC 2.0 protocol for the desktop bridge.
 *
 * The Ultra desktop shell (Code-OSS based) speaks this protocol over
 * WebSocket. Requests map onto HermesRuntime operations; server pushes
 * RuntimeEvent objects as `event` notifications.
 */

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
}

/** Notification emitted for every HermesRuntime event. */
export function eventNotification(event: unknown): JsonRpcNotification {
  return { jsonrpc: '2.0', method: 'event', params: event };
}

export const METHOD_NOT_FOUND = -32601;
export const INVALID_PARAMS = -32602;
export const INTERNAL_ERROR = -32603;
