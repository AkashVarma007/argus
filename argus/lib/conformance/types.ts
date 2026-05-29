import type { Transport } from './transport/types'

export type SpecVersion = '2025-11-25' | 'DRAFT-2026-v1'

export type Category =
  | 'transport' | 'jsonrpc' | 'lifecycle' | 'capabilities'
  | 'tools' | 'resources' | 'prompts'
  | 'sampling' | 'elicitation' | 'utilities'
  | 'authorization' | 'security' | 'tasks' | 'hygiene'
  | 'rc' | 'discovery' | 'stateless' | 'subscriptions' | 'caching' | 'mrtr'

export type Severity = 'error' | 'warning' | 'info'
export type Confidence = 'high' | 'medium' | 'heuristic'
export type CheckStatus = 'pass' | 'fail' | 'skip' | 'error'

export type CapabilityRequirement =
  | 'tools' | 'resources' | 'prompts' | 'logging'
  | 'completions' | 'tasks' | 'subscribe'

export interface SpecRef {
  url: string
  section: string
  quote: string
}

export interface Evidence {
  request?: {
    method: string
    url?: string
    headers: Record<string, string>
    body?: unknown
  }
  response?: {
    status?: number
    headers?: Record<string, string>
    body?: unknown
  }
  expected?: unknown
  actual?: unknown
  notes?: string[]
  curlCommand?: string
}

export interface CheckResult {
  checkId: string
  status: CheckStatus
  message?: string
  durationMs: number
  evidence?: Evidence
}

export interface ServerCapabilities {
  tools?: { listChanged?: boolean }
  resources?: { listChanged?: boolean; subscribe?: boolean }
  prompts?: { listChanged?: boolean }
  logging?: Record<string, never>
  completions?: Record<string, never>
  tasks?: {
    list?: Record<string, never>
    cancel?: Record<string, never>
    requests?: { 'tools/call'?: Record<string, never> }
  }
  subscriptions?: { toolsListChanged?: boolean; resourcesListChanged?: boolean }
}

export interface InitializeResult {
  protocolVersion: string
  capabilities: ServerCapabilities
  serverInfo: { name: string; version: string; title?: string; description?: string }
  instructions?: string
}

export interface CheckContext {
  client: import('./client').McpClient
  rawHttp: import('./transport/raw').RawHttpClient
  transport: Transport
  spec: SpecVersion
  serverInfo: InitializeResult
  capabilities: ServerCapabilities
  log: (msg: string) => void
  authMode?: 'none' | 'oauth-discovery'
}

export interface Check {
  id: string
  category: Category
  severity: Severity
  confidence: Confidence
  appliesTo: SpecVersion[]
  title: string
  probe: string
  criterion: string
  specRef: SpecRef
  requires?: CapabilityRequirement[]
  deterministic: boolean
  slow?: boolean
  run(ctx: CheckContext): Promise<CheckResult>
}
