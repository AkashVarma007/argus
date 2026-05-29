import type {
  Build,
  BuildIssue,
  BuildNode,
  CapabilityInfo,
  PromptDef,
  ResourceDef,
  ServerMeta,
  ToolDef,
} from '@/lib/store/types'
import { slugify } from './slug'

const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[\w.]+)?$/

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function validateBuild(b: Build): BuildIssue[] {
  const issues: BuildIssue[] = []

  const serverNodes = b.nodes.filter((n) => n.type === 'server')
  if (serverNodes.length === 0) {
    issues.push({ severity: 'error', message: 'Build has no server node.' })
  } else if (serverNodes.length > 1) {
    for (const n of serverNodes.slice(1)) {
      issues.push({
        nodeId: n.id,
        severity: 'error',
        message: 'Build has more than one server node.',
      })
    }
  }

  const nodeIds = new Set(b.nodes.map((n) => n.id))
  for (const edge of b.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      issues.push({
        edgeId: edge.id,
        severity: 'error',
        message: `Edge ${edge.id} references missing node.`,
      })
    }
  }

  const toolSlugs = new Map<string, BuildNode>()
  for (const n of b.nodes) {
    if (n.type !== 'tool') continue
    const tool = n.data as ToolDef
    const slug = slugify(tool.name ?? '')
    const prior = toolSlugs.get(slug)
    if (prior) {
      issues.push({
        nodeId: n.id,
        severity: 'error',
        message: `Duplicate tool name collides with ${prior.id} after slugify (${slug}).`,
      })
    } else {
      toolSlugs.set(slug, n)
    }
    if (!isPlainObject(tool.inputSchema)) {
      issues.push({
        nodeId: n.id,
        severity: 'error',
        message: `Tool ${tool.name || '(unnamed)'} has missing or invalid inputSchema.`,
      })
    }
    if (!tool.description || tool.description.trim() === '') {
      issues.push({
        nodeId: n.id,
        severity: 'warning',
        message: `Tool ${tool.name || '(unnamed)'} has no description.`,
      })
    }
  }

  const promptSlugs = new Map<string, BuildNode>()
  for (const n of b.nodes) {
    if (n.type !== 'prompt') continue
    const prompt = n.data as PromptDef
    const slug = slugify(prompt.name ?? '')
    const prior = promptSlugs.get(slug)
    if (prior) {
      issues.push({
        nodeId: n.id,
        severity: 'error',
        message: `Duplicate prompt name collides with ${prior.id} after slugify (${slug}).`,
      })
    } else {
      promptSlugs.set(slug, n)
    }
  }

  const resourceUris = new Map<string, BuildNode>()
  for (const n of b.nodes) {
    if (n.type !== 'resource') continue
    const resource = n.data as ResourceDef
    const prior = resourceUris.get(resource.uri)
    if (prior) {
      issues.push({
        nodeId: n.id,
        severity: 'error',
        message: `Duplicate resource uri (${resource.uri}) collides with ${prior.id}.`,
      })
    } else {
      resourceUris.set(resource.uri, n)
    }
  }

  const nodeById = new Map(b.nodes.map((n) => [n.id, n]))
  const serverNode = serverNodes[0]
  for (const edge of b.edges) {
    const target = nodeById.get(edge.target)
    if (edge.kind === 'prompt-uses-tool' && target && target.type !== 'tool') {
      issues.push({
        edgeId: edge.id,
        severity: 'warning',
        message: `Edge ${edge.id} is prompt-uses-tool but targets a non-tool node.`,
      })
    }
    if (edge.kind === 'membership' && serverNode) {
      if (edge.source !== serverNode.id && edge.target !== serverNode.id) {
        issues.push({
          edgeId: edge.id,
          severity: 'warning',
          message: `Membership edge ${edge.id} does not connect to the server node.`,
        })
      }
    }
  }

  const meta = b.packageMeta as ServerMeta
  if (!SEMVER_RE.test(meta.version)) {
    issues.push({
      severity: 'warning',
      message: `Package version "${meta.version}" is not valid semver.`,
    })
  }

  for (const n of b.nodes) {
    if (n.type !== 'capability') continue
    const cap = n.data as CapabilityInfo
    if (!Array.isArray(cap.exposes)) {
      issues.push({
        nodeId: n.id,
        severity: 'error',
        message: 'Capability node missing exposes list.',
      })
    }
  }

  return issues
}
