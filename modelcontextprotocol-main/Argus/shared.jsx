// Shared bits: realistic data shapes used across all 4 directions,
// plus a Rationale card component. Each direction renders its own
// chrome — the data is the only thing they have in common.

// ─── Realistic-ish check IDs, organized by category ────────────
const CHECKS = {
  Transport: [
    ['transport.http.framing.content-length', 'pass'],
    ['transport.http.framing.chunked-encoding', 'pass'],
    ['transport.sse.event-id.monotonic', 'pass'],
    ['transport.sse.retry.respect-server-hint', 'fail',
      'Server sent retry: 3000 but client reconnected after 1.2s — must obey server hint',
      'spec §4.3.2'],
    ['transport.stdio.message-delimiter', 'pass'],
    ['transport.stdio.utf8-only', 'pass'],
    ['transport.websocket.subprotocol', 'skip'],
  ],
  JSONRPC: [
    ['jsonrpc.version-field.required', 'pass'],
    ['jsonrpc.batch.partial-response', 'fail',
      'Batch of 4 requests returned single error object — must return array with per-item results',
      'spec §5.1.4'],
    ['jsonrpc.batch.empty-array-rejected', 'pass'],
    ['jsonrpc.request.id.uniqueness', 'pass'],
    ['jsonrpc.notification.no-response', 'pass'],
    ['jsonrpc.error.reserved-codes', 'pass'],
  ],
  Lifecycle: [
    ['lifecycle.initialize.protocol-version', 'pass'],
    ['lifecycle.initialize.capabilities.symmetric', 'pass'],
    ['lifecycle.initialized.notification', 'pass'],
    ['lifecycle.shutdown.graceful', 'pass'],
    ['lifecycle.shutdown.in-flight-requests', 'fail',
      'shutdown returned ok while 2 requests in-flight — must reject new and drain existing',
      'spec §3.2.1'],
  ],
  Auth: [
    ['auth.bearer-token.scope-validation', 'fail',
      'Token with scope=read accepted on resources/write — must reject with -32002',
      'spec §7.4'],
    ['auth.bearer-token.expiry-check', 'fail',
      'Expired token accepted (exp claim 2 hours past)',
      'spec §7.4.2'],
    ['auth.oauth.pkce.s256-only', 'fail',
      'PKCE challenge plain accepted — must require S256',
      'spec §7.5.1'],
    ['auth.oauth.refresh-rotation', 'fail',
      'Refresh token reused after rotation — server returned new token but accepted old',
      'spec §7.5.4'],
    ['auth.oauth.state.csrf', 'fail',
      'state parameter not verified on callback',
      'spec §7.5.2'],
    ['auth.session.timeout', 'fail',
      'Idle session held open past 30m (held 4h12m)',
      'spec §7.6'],
    ['auth.session.rotation-on-privilege-change', 'fail',
      'Session ID unchanged after role elevation',
      'spec §7.6.2'],
    ['auth.error.no-token-leak', 'fail',
      'Auth error response echoed bearer token in detail field',
      'spec §7.7'],
    ['auth.basic.tls-only', 'pass'],
    ['auth.api-key.header-name', 'pass'],
  ],
  Security: [
    ['security.tls.min-version', 'pass'],
    ['security.tls.cert-pinning.optional', 'pass'],
    ['security.input.size-limits', 'fail',
      'Accepted 80MB payload — limit is 16MB per §8.2',
      'spec §8.2'],
    ['security.path-traversal.resources', 'pass'],
    ['security.rate-limit.advisory-header', 'pass'],
  ],
  Discovery: [
    ['discovery.tools.list.pagination', 'pass'],
    ['discovery.tools.schema.json-schema-draft', 'pass'],
    ['discovery.tools.descriptions.length', 'pass'],
    ['discovery.prompts.list.argument-validation', 'pass'],
    ['discovery.resources.uri.scheme', 'pass'],
    ['discovery.resources.subscribe.support', 'pass'],
  ],
  Statelessness: [
    ['stateless.tools-call.idempotency', 'pass'],
    ['stateless.session.optional', 'pass'],
    ['stateless.cursor.opaque', 'pass'],
  ],
  Caching: [
    ['caching.tools-list.etag', 'fail',
      'tools/list response missing ETag — clients cannot revalidate',
      'spec §9.1'],
    ['caching.resources-read.if-modified-since', 'fail',
      'resources/read ignores If-Modified-Since header',
      'spec §9.1.3'],
    ['caching.prompts-list.cache-control', 'fail',
      'Cache-Control omitted on prompts/list (recommended: max-age=300)',
      'spec §9.2'],
    ['caching.subscribe.invalidate-on-update', 'fail',
      'resources/updated notification not sent after server-side write',
      'spec §9.3'],
    ['caching.tools-list.vary-header', 'fail',
      'Vary header missing — proxies may serve wrong content per auth',
      'spec §9.1.4'],
    ['caching.resources-read.weak-etag-allowed', 'fail',
      'W/"abc" rejected as malformed — weak ETags must be accepted',
      'spec §9.1.5'],
  ],
  Routing: [
    ['routing.method.unknown-error-code', 'pass'],
    ['routing.method.case-sensitive', 'pass'],
    ['routing.params.unknown-fields-ignored', 'pass'],
  ],
};

const CATEGORIES = [
  ['Transport',       16,  1],
  ['JSON-RPC',        14,  1],
  ['Lifecycle',       11,  1],
  ['Authorization',   18,  8],
  ['Security',        12,  1],
  ['Discovery',       19,  0],
  ['Tools',           22,  0],
  ['Prompts',         14,  0],
  ['Resources',       17,  0],
  ['Sampling',         9,  0],
  ['Roots',            6,  0],
  ['Logging',         11,  0],
  ['Statelessness',    8,  0],
  ['Caching',         14,  6],
  ['Routing',         13,  0],
  ['Progress',         8,  0],
  ['Cancellation',     7,  0],
  ['Capabilities',    12,  0],
  ['Error Codes',     12,  0],
];
// Total = 243; Fail = 14 actually... but brief says 14 fails B+. We'll show 17 → A-/B+ situations consistently.

const SCAN_HISTORY = [
  ['SCN-0142', '2026-05-26 14:08', 'localhost:3845/mcp',  'HTTP+SSE', '28.4s', 'B+', 229],
  ['SCN-0141', '2026-05-26 11:51', 'localhost:3845/mcp',  'HTTP+SSE', '27.9s', 'B',  221],
  ['SCN-0140', '2026-05-25 17:33', 'edge.scratch.dev',    'stdio',    '12.1s', 'A-', 234],
  ['SCN-0139', '2026-05-25 09:02', 'localhost:3845/mcp',  'HTTP+SSE', '28.0s', 'C+', 198],
  ['SCN-0138', '2026-05-23 22:14', 'localhost:3845/mcp',  'HTTP+SSE', '29.6s', 'C',  186],
  ['SCN-0137', '2026-05-23 21:48', 'localhost:3845/mcp',  'HTTP+SSE', '30.1s', 'D+', 168],
  ['SCN-0136', '2026-05-22 16:09', 'staging.octolib.io',  'HTTP',     '24.0s', 'A',  240],
];

const BUILDS = [
  ['github-readonly',  'TypeScript', 8, 2, 3, '2 days ago'],
  ['gh-actions-bridge', 'Python',     5, 0, 1, '4 days ago'],
  ['vector-store-mcp', 'TypeScript', 3, 1, 6, '1 week ago'],
  ['internal-docs',    'TypeScript', 4, 4, 2, '2 weeks ago'],
];

const TOOLS_FOR_BUILD = [
  ['repo.search',         'Search code in a GitHub repo',                'query: string, repo: string'],
  ['repo.read_file',      'Read a single file from a repo',              'repo: string, path: string, ref?: string'],
  ['repo.list_dir',       'List directory contents',                     'repo: string, path: string'],
  ['issues.list',         'List issues in a repo',                       'repo: string, state?: open|closed|all'],
  ['issues.create',       'Open a new issue',                            'repo: string, title: string, body?: string'],
  ['pulls.list',          'List pull requests',                          'repo: string, state?: open|closed|all'],
  ['pulls.diff',          'Get the unified diff for a PR',               'repo: string, number: integer'],
  ['workflows.dispatch',  'Trigger a workflow_dispatch event',           'repo: string, workflow: string, ref: string'],
];

const SPEC_TREE = [
  ['1', 'Introduction'],
  ['2', 'Protocol Basics'],
  ['2.1', 'Versioning'],
  ['2.2', 'Capability Negotiation'],
  ['3', 'Lifecycle'],
  ['3.1', 'Initialization'],
  ['3.2', 'Shutdown'],
  ['4', 'Transports'],
  ['4.1', 'stdio'],
  ['4.2', 'HTTP'],
  ['4.3', 'SSE (deprecated)'],
  ['5', 'JSON-RPC Framing'],
  ['6', 'Discovery'],
  ['6.1', 'tools/list'],
  ['6.2', 'prompts/list'],
  ['6.3', 'resources/list'],
  ['7', 'Authorization'],
  ['7.1', 'Overview'],
  ['7.2', 'Bearer Tokens'],
  ['7.3', 'OAuth 2.1'],
  ['7.4', 'Scopes'],
  ['7.5', 'PKCE Requirements'],
  ['8', 'Security'],
  ['9', 'Caching'],
  ['10', 'Error Codes'],
];

// ─── A small Rationale card component used by all directions ──────
function Rationale({ accent, title, body, optimized, rejected }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      padding: '36px 40px',
      background: '#faf8f1',
      boxSizing: 'border-box',
      fontFamily: '"Inter", system-ui, sans-serif',
      color: 'var(--ink-1)',
      display: 'flex', flexDirection: 'column', gap: 18,
      borderLeft: `4px solid ${accent}`,
    }}>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
        color: 'var(--ink-3)',
      }}>Rationale</div>

      <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 38, lineHeight: 1, letterSpacing: -0.5 }}>
        {title}
      </div>

      <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>
        {body}
      </div>

      <div style={{
        marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
        fontSize: 12, lineHeight: 1.5,
      }}>
        <div>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--ink-3)', marginBottom: 6,
          }}>What I optimized for</div>
          <div style={{ color: 'var(--ink-2)' }}>{optimized}</div>
        </div>
        <div>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--ink-3)', marginBottom: 6,
          }}>What I rejected</div>
          <div style={{ color: 'var(--ink-2)' }}>{rejected}</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  CHECKS, CATEGORIES, SCAN_HISTORY, BUILDS, TOOLS_FOR_BUILD, SPEC_TREE,
  Rationale,
});
