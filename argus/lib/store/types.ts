export type Grade =
  | 'A+' | 'A' | 'A-'
  | 'B+' | 'B' | 'B-'
  | 'C+' | 'C' | 'C-'
  | 'D+' | 'D'
  | 'F'

export type Transport = 'http' | 'sse' | 'stdio-ws'

export type Severity = 'critical' | 'major' | 'minor' | 'info'

export type CheckStatus = 'pass' | 'fail' | 'skip' | 'error' | 'pending'

export type ScanId = `SCN-${string}`

export type BuildId = `BLD-${string}`

export interface BuildIssue {
  nodeId?: string
  edgeId?: string
  severity: 'error' | 'warning'
  message: string
  specRef?: string
}

export interface CheckResult {
  checkId: string
  category: string
  severity: Severity
  status: CheckStatus
  durationMs: number
  observed?: string
  expected?: string
  specRef?: string
  fixHint?: string
}

export interface Scan {
  id: ScanId
  startedAt: string
  endpoint: string
  transport: Transport
  spec: 'draft-2026-v1'
  durationMs: number
  grade: Grade
  summary: { pass: number; fail: number; skip: number; error: number }
  results: CheckResult[]
}

export interface ServerMeta {
  name: string
  version: string
  description: string
  license: string
}

export interface ToolDef {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  outputSchema?: Record<string, unknown>
}

export interface PromptDef {
  name: string
  description: string
  arguments: { name: string; description?: string; required?: boolean }[]
}

export interface ResourceDef {
  uri: string
  mimeType: string
  description: string
}

export interface CapabilityInfo {
  exposes: string[]
}

export type NodeData = ToolDef | PromptDef | ResourceDef | ServerMeta | CapabilityInfo

export interface BuildNode {
  id: string
  type: 'server' | 'tool' | 'prompt' | 'resource' | 'capability'
  position: { x: number; y: number }
  data: NodeData
}

export interface BuildEdge {
  id: string
  source: string
  target: string
  kind: 'membership' | 'dependency' | 'prompt-uses-tool'
}

export interface Build {
  id: BuildId
  name: string
  language: 'typescript' | 'python'
  packageMeta: ServerMeta
  nodes: BuildNode[]
  edges: BuildEdge[]
  viewport: { x: number; y: number; zoom: number }
  modifiedAt: string
}
