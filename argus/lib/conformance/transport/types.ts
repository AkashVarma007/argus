import type { JsonRpcRequest, JsonRpcNotification, JsonRpcResponse } from '../helpers/jsonrpc'

export type TransportKind = 'http' | 'sse' | 'bridge'

export interface TransportConfig {
  kind: TransportKind
  url: string
  proxyUrl?: string
  protocolVersion: '2025-11-25' | 'DRAFT-2026-v1'
  bridgeCommand?: string
  onServerRequest?: (req: JsonRpcRequest) => Promise<unknown>
  onServerNotification?: (notification: JsonRpcNotification) => void
}

export interface Transport {
  kind: TransportKind
  send(req: JsonRpcRequest): Promise<JsonRpcResponse>
  notify(n: JsonRpcNotification): Promise<void>
  close(): Promise<void>
  setServerRequestHandler?: (fn: ((req: JsonRpcRequest) => unknown | Promise<unknown>) | null) => void
  setServerNotificationHandler?: (fn: ((notification: JsonRpcNotification) => void) | null) => void
}
