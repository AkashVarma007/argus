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

// ─── Global motion + dark-theme support ────────────────────────
// Injected once. All directions get the same keyframes vocabulary.
if (typeof document !== 'undefined' && !document.getElementById('argus-motion')) {
  const css = document.createElement('style');
  css.id = 'argus-motion';
  css.textContent = `
  @keyframes argus-pulse  { 0%,100% { opacity: 1 } 50% { opacity: 0.35 } }
  @keyframes argus-blink  { 0%,49% { opacity: 1 } 50%,100% { opacity: 0 } }
  @keyframes argus-breathe{ 0%,100% { opacity: 0.55 } 50% { opacity: 1 } }
  @keyframes argus-sweep  { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
  @keyframes argus-tick   { from { opacity: 0; transform: translateY(2px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes argus-pop    { 0% { transform: scale(0.4); opacity: 0 } 60% { transform: scale(1.1); opacity: 1 } 100% { transform: scale(1); opacity: 1 } }
  @keyframes argus-shimmer{ 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
  @keyframes argus-rotate { from { transform: rotate(0) } to { transform: rotate(360deg) } }
  @keyframes argus-draw   { from { stroke-dashoffset: var(--len, 600) } to { stroke-dashoffset: 0 } }
  @keyframes argus-glow   { 0%,100% { filter: drop-shadow(0 0 16px var(--g, currentColor)) drop-shadow(0 0 2px var(--g, currentColor)) }
                            50%      { filter: drop-shadow(0 0 32px var(--g, currentColor)) drop-shadow(0 0 4px var(--g, currentColor)) } }
  @keyframes argus-caret  { 0%,49% { opacity: 1 } 50%,100% { opacity: 0 } }
  @keyframes argus-wave   { 0% { transform: scaleY(0.4) } 30% { transform: scaleY(1) } 60% { transform: scaleY(0.55) } 100% { transform: scaleY(0.4) } }
  @keyframes argus-radar  { 0% { transform: rotate(0); opacity: 0.55 } 100% { transform: rotate(360deg); opacity: 0.55 } }
  `;
  document.head.appendChild(css);
}

// A tiny live-dot used in every chrome strip — every screen has motion this way.
function LiveDot({ color = 'currentColor', size = 6, dur = '1.6s' }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size, borderRadius: size,
      background: color, boxShadow: `0 0 ${size * 1.5}px ${color}`,
      animation: `argus-pulse ${dur} ease-in-out infinite`,
    }} />
  );
}

// ─── A small Rationale card component used by all directions ──────
function Rationale({ accent, title, body, optimized, rejected, surface = '#0b0e12', text = '#e9edf2', muted = '#8b9099', subtle = '#5a5f68', hairline = '#1d2129' }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      padding: '34px 38px',
      background: surface,
      backgroundImage: `radial-gradient(circle at 0% 0%, ${hairline} 0%, transparent 55%)`,
      boxSizing: 'border-box',
      fontFamily: '"Inter", system-ui, sans-serif',
      color: text,
      display: 'flex', flexDirection: 'column', gap: 16,
      borderLeft: `2px solid ${accent}`,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* faint accent corner glow */}
      <div style={{
        position: 'absolute', top: -60, left: -40, width: 200, height: 200,
        background: `radial-gradient(circle, ${accent}26 0%, transparent 60%)`,
        pointerEvents: 'none', animation: 'argus-breathe 6s ease-in-out infinite',
      }} />

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
        color: muted, position: 'relative', zIndex: 1,
      }}>
        <LiveDot color={accent} size={5} /> Rationale
      </div>

      <div style={{
        fontFamily: '"Inter", system-ui, sans-serif',
        fontWeight: 700, fontSize: 32, lineHeight: 1.05, letterSpacing: '-0.025em',
        color: text, position: 'relative', zIndex: 1,
      }}>
        {title}
      </div>

      <div style={{ fontSize: 13.5, lineHeight: 1.55, color: muted, position: 'relative', zIndex: 1 }}>
        {body}
      </div>

      <div style={{
        marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
        fontSize: 12, lineHeight: 1.5, position: 'relative', zIndex: 1,
        borderTop: `1px solid ${hairline}`, paddingTop: 16,
      }}>
        <div>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 9.5, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: subtle, marginBottom: 6,
          }}>Optimized for</div>
          <div style={{ color: muted }}>{optimized}</div>
        </div>
        <div>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 9.5, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: subtle, marginBottom: 6,
          }}>Rejected</div>
          <div style={{ color: muted }}>{rejected}</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  CHECKS, CATEGORIES, SCAN_HISTORY, BUILDS, TOOLS_FOR_BUILD, SPEC_TREE,
  Rationale, LiveDot,
});
