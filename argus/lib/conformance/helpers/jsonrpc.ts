export type JsonRpcId = string | number

export interface JsonRpcRequest {
  jsonrpc: '2.0'
  id: JsonRpcId
  method: string
  params?: unknown
}

export interface JsonRpcNotification {
  jsonrpc: '2.0'
  method: string
  params?: unknown
}

export interface JsonRpcSuccess {
  jsonrpc: '2.0'
  id: JsonRpcId
  result: unknown
}

export interface JsonRpcError {
  jsonrpc: '2.0'
  id: JsonRpcId | null
  error: { code: number; message: string; data?: unknown }
}

export type JsonRpcResponse = JsonRpcSuccess | JsonRpcError

let _id = 0
export function nextId(): number {
  _id += 1
  return _id
}

export function buildRequest(
  method: string,
  params: unknown | undefined,
  id: JsonRpcId,
): JsonRpcRequest {
  const req: JsonRpcRequest = { jsonrpc: '2.0', id, method }
  if (params !== undefined) req.params = params
  return req
}

export function buildNotification(method: string, params?: unknown): JsonRpcNotification {
  const n: JsonRpcNotification = { jsonrpc: '2.0', method }
  if (params !== undefined) n.params = params
  return n
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

export function isJsonRpcResponse(v: unknown): v is JsonRpcResponse {
  return isObj(v) && v.jsonrpc === '2.0' && ('result' in v || 'error' in v)
}

export function isJsonRpcSuccess(v: unknown): v is JsonRpcSuccess {
  return isObj(v) && v.jsonrpc === '2.0' && 'result' in v && !('error' in v)
}

export function isJsonRpcError(v: unknown): v is JsonRpcError {
  return isObj(v) && v.jsonrpc === '2.0' && 'error' in v && !('result' in v)
}

export function hasErrorCode(v: unknown, code: number): boolean {
  return isJsonRpcError(v) && v.error.code === code
}
