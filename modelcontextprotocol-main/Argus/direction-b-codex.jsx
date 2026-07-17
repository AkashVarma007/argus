// Direction B — Codex
// POV: ARGUS is a forensic ledger. The product reads like a legal
// inspection report — numbered, quoted, footnoted. Serif headlines,
// monospace evidence, italic spec citations. Oxblood reserved for
// FAIL — the only place the page bleeds.

const BTok = {
  serif: '"Newsreader", "Times New Roman", serif',
  sans: '"Inter", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
  oxblood: '#7a1c1c',
  paper: '#f6f1e4',
  rule: '#1d1b18',
  ink0: '#100d08',
  ink1: '#231f17',
  ink2: '#3d3625',
  ink3: '#7a7259',
  ink4: '#a39a82',
  ink5: '#c8bfa3',
  ink6: '#e2d9bf',
};

// ─── Shared chrome ────────────────────────────────────────────
function BMast({ section = 'EXAMINATION', folio = '0142', subtitle }) {
  return (
    <div style={{
      padding: '14px 36px 12px', background: BTok.paper,
      borderBottom: `2px double ${BTok.rule}`,
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 22 }}>
        <span style={{ fontFamily: BTok.serif, fontSize: 22, fontWeight: 600, letterSpacing: -0.3, color: BTok.ink0 }}>
          <span style={{ fontStyle: 'italic' }}>Argus</span> <span style={{ fontVariant: 'small-caps', fontSize: 12, letterSpacing: '0.1em', color: BTok.ink3, marginLeft: 2 }}>—— mcp inspector</span>
        </span>
        <span style={{ fontFamily: BTok.mono, fontSize: 10, letterSpacing: '0.16em', color: BTok.ink3 }}>{section}</span>
      </div>
      <div style={{ fontFamily: BTok.mono, fontSize: 10, letterSpacing: '0.16em', color: BTok.ink3 }}>
        FOLIO {folio} · {subtitle}
      </div>
    </div>
  );
}
function BNav({ active }) {
  const items = ['Examine', 'Compose', 'Reference'];
  return (
    <div style={{
      borderBottom: `1px solid ${BTok.ink5}`, background: BTok.paper,
      padding: '8px 36px', display: 'flex', gap: 28, alignItems: 'center',
      flexShrink: 0,
    }}>
      {items.map((it) => (
        <span key={it} style={{
          fontFamily: BTok.serif, fontSize: 14,
          color: it === active ? BTok.ink0 : BTok.ink3,
          fontStyle: it === active ? 'normal' : 'italic',
          borderBottom: it === active ? `2px solid ${BTok.ink0}` : '2px solid transparent',
          paddingBottom: 4,
        }}>{it}</span>
      ))}
      <span style={{ flex: 1 }} />
      <span style={{ fontFamily: BTok.mono, fontSize: 10, color: BTok.ink3 }}>⌘K</span>
    </div>
  );
}

// ─── Rationale ────────────────────────────────────────────────
function B_Rationale() {
  return (
    <Rationale
      accent={BTok.oxblood}
      title="Read it like a deposition."
      body={
        <span>
          Argus produces a verdict. So Argus looks like the document a verdict
          arrives in. Serif headlines (Newsreader) carry the body; mono carries
          the evidence; italics carry the spec's own voice. The page is
          numbered, every claim has a citation, and quoted text is set off in a
          rule the way a law review pulls a holding. Failures are the only
          place the page bleeds — a single oxblood, used only for FAIL.
          Everything else stays in ink-on-bone so when a failure shows up, it
          is impossible to miss.
        </span>
      }
      optimized="The drill-in moment. A failed check should read like a finding — the spec quote, the evidence, the suggested remedy, in that order."
      rejected="Pastel cards, dashboard widgets, sentence-case section heads, anything that says 'design system' before it says 'document'."
    />
  );
}

// ─── Brand ────────────────────────────────────────────────────
function B_Brand() {
  return (
    <div style={{ width: '100%', height: '100%', background: BTok.paper, padding: 40, boxSizing: 'border-box', fontFamily: BTok.sans, color: BTok.ink0, display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ fontFamily: BTok.mono, fontSize: 10, letterSpacing: '0.2em', color: BTok.ink3 }}>DIRECTION B · CODEX · WORDMARK</div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, borderBottom: `2px double ${BTok.rule}`, paddingBottom: 20 }}>
        {/* Mark: typographic A with overscore */}
        <svg width="78" height="86" viewBox="0 0 78 86" fill="none">
          <line x1="6" y1="10" x2="72" y2="10" stroke={BTok.ink0} strokeWidth="2.5" />
          <line x1="6" y1="16" x2="72" y2="16" stroke={BTok.ink0} strokeWidth="1" />
          <path d="M14 80 L39 22 L64 80 M24 60 L54 60" stroke={BTok.ink0} strokeWidth="3" fill="none" />
          <circle cx="39" cy="44" r="3" fill={BTok.oxblood} />
        </svg>
        <div>
          <div style={{ fontFamily: BTok.serif, fontSize: 78, lineHeight: 0.9, letterSpacing: -1, fontWeight: 600 }}>Argus.</div>
          <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 16, color: BTok.ink3, marginTop: 2 }}>
            <span style={{ fontVariant: 'small-caps', letterSpacing: '0.08em' }}>an inspector of model context protocol servers</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        <div>
          <div style={{ fontFamily: BTok.mono, fontSize: 10, letterSpacing: '0.16em', color: BTok.ink3 }}>PALETTE</div>
          <div style={{ display: 'flex', marginTop: 6 }}>
            {[BTok.ink0, BTok.ink2, BTok.paper, BTok.ink6, BTok.oxblood].map((c, i) => (
              <div key={i} style={{ flex: 1, height: 48, background: c, border: c === BTok.paper ? `1px solid ${BTok.ink5}` : 'none' }} />
            ))}
          </div>
          <div style={{ fontFamily: BTok.mono, fontSize: 9.5, color: BTok.ink3, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span>INK</span><span>RULE</span><span>PAPER</span><span>QUIET</span><span>OXBLOOD</span>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: BTok.mono, fontSize: 10, letterSpacing: '0.16em', color: BTok.ink3 }}>TYPE</div>
          <div style={{ fontFamily: BTok.serif, fontSize: 22, lineHeight: 1.1, marginTop: 4 }}>Newsreader Display</div>
          <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 14, color: BTok.ink2 }}>Newsreader Italic — quotations</div>
          <div style={{ fontFamily: BTok.mono, fontSize: 11.5, color: BTok.ink2, marginTop: 4 }}>JetBrains Mono — evidence</div>
        </div>
      </div>

      <div style={{ marginTop: 'auto', fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 14, color: BTok.ink2, borderTop: `1px solid ${BTok.ink5}`, paddingTop: 12 }}>
        “The hundred-eyed giant, who never fully slept.” &nbsp; <span style={{ fontFamily: BTok.mono, fontSize: 10, letterSpacing: '0.12em', color: BTok.ink3 }}>— OVID, METAMORPHOSES I.625</span>
      </div>
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────
function B_Home() {
  return (
    <div style={{ width: '100%', height: '100%', background: BTok.paper, display: 'flex', flexDirection: 'column' }}>
      <BMast section="ENTRY" subtitle="THIS BROWSER · NO ACCOUNT · 03 RETURNED VISITS" />
      <BNav active="" />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.4fr 1fr', minHeight: 0 }}>
        {/* Left column — running ledger of scans */}
        <div style={{ padding: '28px 36px', borderRight: `1px solid ${BTok.ink5}`, overflow: 'hidden' }}>
          <div style={{ fontFamily: BTok.serif, fontSize: 42, letterSpacing: -0.8, lineHeight: 0.95, color: BTok.ink0 }}>
            Welcome back<span style={{ fontStyle: 'italic' }}>,</span>
          </div>
          <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 22, color: BTok.ink2, marginTop: 4 }}>your last examination concluded three days ago.</div>

          <div style={{ marginTop: 24, fontFamily: BTok.mono, fontSize: 9.5, letterSpacing: '0.16em', color: BTok.ink3 }}>EXAMINATIONS · CHRONOLOGICAL</div>
          <div style={{ marginTop: 8, borderTop: `1px solid ${BTok.ink2}` }}>
            {SCAN_HISTORY.map((s, i) => (
              <div key={s[0]} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 90px 60px 70px', gap: 14, padding: '12px 0', borderBottom: `1px solid ${BTok.ink6}`, alignItems: 'baseline' }}>
                <span style={{ fontFamily: BTok.mono, fontSize: 11, color: BTok.ink3 }}>№ {s[0].split('-')[1]}</span>
                <span style={{ fontFamily: BTok.serif, fontSize: 15, color: BTok.ink0 }}>{s[2]} <span style={{ color: BTok.ink3, fontStyle: 'italic' }}>via {s[3]}</span></span>
                <span style={{ fontFamily: BTok.mono, fontSize: 10.5, color: BTok.ink3 }}>{s[1].slice(5)}</span>
                <span style={{ fontFamily: BTok.mono, fontSize: 11, color: BTok.ink2 }}>{s[6]}/243</span>
                <span style={{ fontFamily: BTok.serif, fontSize: 22, fontWeight: 600, color: BTok.ink0, textAlign: 'right' }}>{s[5]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — open tools */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '22px 28px', borderBottom: `1px solid ${BTok.ink5}` }}>
            <div style={{ fontFamily: BTok.mono, fontSize: 9.5, letterSpacing: '0.18em', color: BTok.ink3 }}>I · EXAMINE</div>
            <div style={{ fontFamily: BTok.serif, fontSize: 24, color: BTok.ink0, marginTop: 2 }}>Grade an MCP server.</div>
            <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 13, color: BTok.ink2, marginTop: 4 }}>243 conformance checks · DRAFT-2026-v1</div>
            <button style={{ marginTop: 10, fontFamily: BTok.serif, fontSize: 14, padding: '8px 16px', background: BTok.ink0, color: BTok.paper, border: 'none' }}>Begin examination →</button>
          </div>

          <div style={{ padding: '22px 28px', borderBottom: `1px solid ${BTok.ink5}` }}>
            <div style={{ fontFamily: BTok.mono, fontSize: 9.5, letterSpacing: '0.18em', color: BTok.ink3 }}>II · COMPOSE</div>
            <div style={{ fontFamily: BTok.serif, fontSize: 24, color: BTok.ink0, marginTop: 2 }}>Assemble a server.</div>
            <div style={{ marginTop: 8, fontFamily: BTok.mono, fontSize: 11, color: BTok.ink2, lineHeight: 1.8 }}>
              {BUILDS.slice(0,3).map((b) => (
                <div key={b[0]} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>· {b[0]} <span style={{ color: BTok.ink3 }}>({b[1]})</span></span>
                  <span style={{ color: BTok.ink3 }}>{b[5]}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '22px 28px', flex: 1 }}>
            <div style={{ fontFamily: BTok.mono, fontSize: 9.5, letterSpacing: '0.18em', color: BTok.ink3 }}>III · REFERENCE</div>
            <div style={{ fontFamily: BTok.serif, fontSize: 24, color: BTok.ink0, marginTop: 2 }}>Consult the spec.</div>
            <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 13, color: BTok.ink2, marginTop: 4 }}>last read · §7.5 PKCE Requirements</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Test · Input ─────────────────────────────────────────────
function B_TestInput() {
  return (
    <div style={{ width: '100%', height: '100%', background: BTok.paper, display: 'flex', flexDirection: 'column' }}>
      <BMast section="EXAMINATION · COMPOSE" subtitle="UNCOMMITTED" />
      <BNav active="Examine" />
      <div style={{ flex: 1, padding: '28px 60px 28px 36px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 20 }}>
          <div style={{ fontFamily: BTok.serif, fontSize: 64, fontWeight: 600, color: BTok.ink0, lineHeight: 1 }}>§1</div>
          <div>
            <div style={{ fontFamily: BTok.serif, fontSize: 32, color: BTok.ink0, letterSpacing: -0.4 }}>Subject of examination</div>
            <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 14, color: BTok.ink2 }}>The endpoint to be inspected, and the manner of approach.</div>
          </div>
        </div>

        <div style={{ marginTop: 22, borderTop: `1px solid ${BTok.ink2}`, fontFamily: BTok.serif, fontSize: 14, color: BTok.ink1 }}>
          {[
            ['1.01', 'Endpoint',     <span style={{ fontFamily: BTok.mono, fontSize: 13 }}>localhost:3845/mcp</span>, '127.0.0.1'],
            ['1.02', 'Transport',    'HTTP with Server-Sent Events',                                              'spec §4.2'],
            ['1.03', 'Authorization',<span style={{ fontFamily: BTok.mono, fontSize: 13 }}>Bearer ••••2c8a</span>, 'optional'],
            ['1.04', 'Profile',      'draft-2026-v1 — all 243 checks',                                            'locked'],
            ['1.05', 'Categories',   'all 19',                                                                    'customise'],
            ['1.06', 'Timeout per check', '2000 ms',                                                              'per §3.4'],
            ['1.07', 'Concurrency',  '8 in flight',                                                               '↑ 16 / ↓ 1'],
          ].map(([n, k, v, hint]) => (
            <div key={n} style={{ display: 'grid', gridTemplateColumns: '60px 200px 1fr 180px', padding: '14px 0', borderBottom: `1px solid ${BTok.ink6}`, alignItems: 'baseline' }}>
              <span style={{ fontFamily: BTok.mono, fontSize: 11, color: BTok.ink3 }}>{n}</span>
              <span style={{ fontStyle: 'italic', color: BTok.ink2 }}>{k}</span>
              <span style={{ color: BTok.ink0 }}>{v}</span>
              <span style={{ fontFamily: BTok.mono, fontSize: 10.5, color: BTok.ink3, textAlign: 'right' }}>{hint}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 16 }}>
          <button style={{ fontFamily: BTok.serif, fontSize: 16, padding: '10px 22px', background: BTok.ink0, color: BTok.paper, border: 'none' }}>Begin examination ↵</button>
          <span style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 13, color: BTok.ink3 }}>estimated duration · 28 seconds</span>
        </div>
      </div>
    </div>
  );
}

// ─── Test · Scanning (live) ★ ─────────────────────────────────
function B_Scanning() {
  const lines = [
    ['14:08:11.204', 'transport.http.framing.content-length',         'PASS'],
    ['14:08:11.212', 'transport.http.framing.chunked-encoding',       'PASS'],
    ['14:08:11.220', 'transport.sse.event-id.monotonic',              'PASS'],
    ['14:08:11.232', 'transport.sse.retry.respect-server-hint',       'FAIL'],
    ['14:08:11.241', 'transport.stdio.message-delimiter',             'skip'],
    ['14:08:11.249', 'jsonrpc.version-field.required',                'PASS'],
    ['14:08:11.257', 'jsonrpc.batch.partial-response',                'FAIL'],
    ['14:08:11.266', 'jsonrpc.batch.empty-array-rejected',            'PASS'],
    ['14:08:11.274', 'jsonrpc.request.id.uniqueness',                 'PASS'],
    ['14:08:11.281', 'jsonrpc.notification.no-response',              'PASS'],
    ['14:08:11.289', 'jsonrpc.error.reserved-codes',                  'PASS'],
    ['14:08:11.298', 'lifecycle.initialize.protocol-version',         'PASS'],
    ['14:08:11.310', 'lifecycle.initialize.capabilities.symmetric',   'PASS'],
    ['14:08:11.337', 'lifecycle.shutdown.in-flight-requests',         'FAIL'],
    ['14:08:11.348', 'auth.bearer-token.scope-validation',            'FAIL'],
    ['14:08:11.356', 'auth.bearer-token.expiry-check',                'FAIL'],
    ['14:08:11.364', 'auth.oauth.pkce.s256-only',                     'FAIL'],
    ['14:08:11.373', 'auth.oauth.refresh-rotation',                   'FAIL'],
    ['14:08:11.382', 'auth.oauth.state.csrf',                         'FAIL'],
    ['14:08:11.391', 'auth.session.timeout',                          'FAIL'],
  ];
  return (
    <div style={{ width: '100%', height: '100%', background: BTok.paper, display: 'flex', flexDirection: 'column' }}>
      <BMast section="EXAMINATION · IN PROGRESS" subtitle="SCN-0142 · ELAPSED 00:12.4" />
      <BNav active="Examine" />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', minHeight: 0 }}>
        {/* Left: the ledger as it's written */}
        <div style={{ padding: '24px 36px', overflow: 'hidden', borderRight: `1px solid ${BTok.ink5}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontFamily: BTok.mono, fontSize: 10, letterSpacing: '0.18em', color: BTok.ink3 }}>§2 · OBSERVATIONS</div>
              <div style={{ fontFamily: BTok.serif, fontSize: 30, color: BTok.ink0, letterSpacing: -0.4 }}>
                The examiner notes, in order received—
              </div>
            </div>
            <div style={{ fontFamily: BTok.serif, fontSize: 56, fontWeight: 600, color: BTok.ink0, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              107<span style={{ color: BTok.ink4, fontSize: 28, fontWeight: 400 }}> / 243</span>
            </div>
          </div>

          <div style={{ marginTop: 10, fontFamily: BTok.serif, fontStyle: 'italic', color: BTok.ink2, fontSize: 13 }}>
            94 affirmed · <span style={{ color: BTok.oxblood, fontWeight: 600, fontStyle: 'normal' }}>13 found wanting</span> · 0 abstained · 16s remaining
          </div>

          {/* progress rule */}
          <div style={{ marginTop: 14, height: 3, background: BTok.ink6, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, width: '44%', background: BTok.ink0 }} />
          </div>

          {/* Ledger of observations */}
          <div style={{ marginTop: 18, flex: 1, overflow: 'hidden' }}>
            {lines.slice(-13).reverse().map((l, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 70px', padding: '5px 0', borderBottom: `1px dotted ${BTok.ink5}`, fontFamily: BTok.mono, fontSize: 11 }}>
                <span style={{ color: BTok.ink3 }}>{l[0]}</span>
                <span style={{ color: l[2]==='FAIL' ? BTok.oxblood : BTok.ink1, fontWeight: l[2]==='FAIL'?600:400 }}>{l[1]}</span>
                <span style={{ color: l[2]==='FAIL' ? BTok.oxblood : BTok.ink3, textAlign: 'right', fontStyle: l[2]==='skip'?'italic':'normal' }}>{l[2]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: marginalia */}
        <div style={{ padding: '24px 28px', overflow: 'hidden', background: '#f1ead4' }}>
          <div style={{ fontFamily: BTok.mono, fontSize: 9.5, letterSpacing: '0.18em', color: BTok.ink3 }}>EXAMINER'S NOTE</div>
          <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 15, color: BTok.ink1, marginTop: 8, lineHeight: 1.55 }}>
            Authorization is the present concern. Eight of the eighteen checks have
            been entered as failures; the bearer-token scope handling, in particular,
            permits writes against read-only scopes. The Examiner will set this
            finding into the report.
          </div>

          <div style={{ marginTop: 22, fontFamily: BTok.mono, fontSize: 9.5, letterSpacing: '0.18em', color: BTok.ink3 }}>CURRENTLY BEFORE</div>
          <div style={{ fontFamily: BTok.mono, fontSize: 12, color: BTok.ink0, marginTop: 6, fontWeight: 600 }}>auth.session.rotation-on-privilege-change</div>
          <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 12.5, color: BTok.ink2, marginTop: 2 }}>spec §7.6.2 · awaiting response (1.8s)</div>

          <div style={{ marginTop: 22, fontFamily: BTok.mono, fontSize: 9.5, letterSpacing: '0.18em', color: BTok.ink3 }}>CATEGORIES ENTERED</div>
          <div style={{ marginTop: 6, fontFamily: BTok.serif, fontSize: 14, lineHeight: 1.6, color: BTok.ink1 }}>
            {CATEGORIES.slice(0,9).map(([n,t,f], i) => (
              <div key={n} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: i < 7 ? BTok.ink0 : BTok.ink4, fontStyle: i < 7 ? 'normal' : 'italic' }}>{i+1}. {n}</span>
                <span style={{ fontFamily: BTok.mono, fontSize: 11, color: f > 0 ? BTok.oxblood : BTok.ink3 }}>{i < 7 ? `${t - (i<7?f:0)}/${t}` : i === 7 ? '½' : '—'}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'auto', fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 12, color: BTok.ink3, paddingTop: 16 }}>
            The Examiner cannot be hurried.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Test · Results (overview) ★ ──────────────────────────────
function B_Results() {
  return (
    <div style={{ width: '100%', height: '100%', background: BTok.paper, display: 'flex', flexDirection: 'column' }}>
      <BMast section="EXAMINATION · CONCLUDED" subtitle="SCN-0142 · 14:08:39" />
      <BNav active="Examine" />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.05fr 1fr', minHeight: 0 }}>

        {/* Left: the verdict page */}
        <div style={{ padding: '28px 44px 28px 36px', borderRight: `1px solid ${BTok.ink5}`, overflow: 'hidden', position: 'relative' }}>
          <div style={{ fontFamily: BTok.mono, fontSize: 9.5, letterSpacing: '0.2em', color: BTok.ink3 }}>FOLIO № 0142 · IN THE MATTER OF</div>
          <div style={{ fontFamily: BTok.serif, fontSize: 32, color: BTok.ink0, marginTop: 2, letterSpacing: -0.4, lineHeight: 1.1 }}>
            localhost<span style={{ color: BTok.ink3 }}>:</span>3845/mcp,
            <br />a server speaking HTTP &amp; SSE.
          </div>

          <div style={{ marginTop: 26, borderTop: `2px double ${BTok.rule}`, borderBottom: `2px double ${BTok.rule}`, padding: '26px 0', position: 'relative' }}>
            <div style={{ fontFamily: BTok.mono, fontSize: 10, letterSpacing: '0.2em', color: BTok.ink3 }}>VERDICT, AS RECORDED</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 6 }}>
              <div style={{ fontFamily: BTok.serif, fontSize: 180, lineHeight: 0.78, fontWeight: 600, color: BTok.ink0, letterSpacing: -6 }}>B+</div>
              <div>
                <div style={{ fontFamily: BTok.serif, fontSize: 38, color: BTok.ink0, lineHeight: 1 }}>229</div>
                <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 16, color: BTok.ink2 }}>of two hundred forty-three</div>
                <div style={{ fontFamily: BTok.mono, fontSize: 11, color: BTok.ink3, marginTop: 8 }}>↑ improved from B · SCN-0141</div>
              </div>
            </div>
            {/* fake stamp */}
            <div style={{
              position: 'absolute', right: 14, bottom: 18, transform: 'rotate(-9deg)',
              border: `2px solid ${BTok.oxblood}`, color: BTok.oxblood,
              padding: '6px 14px', fontFamily: BTok.mono, fontSize: 10, letterSpacing: '0.18em', fontWeight: 700,
              borderRadius: 2, opacity: 0.85,
            }}>14 FINDINGS</div>
          </div>

          <div style={{ marginTop: 16, fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 14, color: BTok.ink2, lineHeight: 1.55 }}>
            The subject is, on the whole, conformant. Three findings are
            <span style={{ color: BTok.oxblood, fontWeight: 600, fontStyle: 'normal' }}> critical</span> in severity
            and merit immediate remedy. Nine are <span style={{ color: BTok.oxblood, fontStyle: 'normal' }}>major</span>;
            two are <span style={{ color: BTok.ink2, fontStyle: 'normal' }}>minor</span>. Particulars overleaf.
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
            <button style={{ fontFamily: BTok.serif, fontSize: 13, padding: '8px 14px', background: BTok.ink0, color: BTok.paper, border: 'none' }}>Download report.html</button>
            <button style={{ fontFamily: BTok.serif, fontSize: 13, padding: '8px 14px', background: 'transparent', color: BTok.ink1, border: `1px solid ${BTok.ink2}` }}>.json</button>
            <button style={{ fontFamily: BTok.serif, fontSize: 13, padding: '8px 14px', background: 'transparent', color: BTok.ink1, border: `1px solid ${BTok.ink2}` }}>.md</button>
            <span style={{ flex: 1 }} />
            <button style={{ fontFamily: BTok.serif, fontSize: 13, padding: '8px 14px', background: BTok.oxblood, color: '#fff', border: 'none' }}>Re-examine ↵</button>
          </div>
        </div>

        {/* Right: register of findings */}
        <div style={{ padding: '28px 32px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: BTok.mono, fontSize: 9.5, letterSpacing: '0.2em', color: BTok.ink3 }}>REGISTER OF CATEGORIES</div>
          <div style={{ fontFamily: BTok.serif, fontSize: 22, color: BTok.ink0, marginTop: 2 }}>The nineteen categories, in order of finding.</div>

          <div style={{ marginTop: 14, flex: 1, overflow: 'hidden', borderTop: `1px solid ${BTok.ink2}` }}>
            {CATEGORIES.map(([name, total, fail], i) => {
              const pct = (total - fail) / total;
              const grade = pct >= 0.95 ? 'A' : pct >= 0.85 ? 'A-' : pct >= 0.75 ? 'B' : pct >= 0.6 ? 'C' : 'D';
              return (
                <div key={name} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 70px 70px 40px', padding: '7px 0', borderBottom: `1px solid ${BTok.ink6}`, alignItems: 'baseline' }}>
                  <span style={{ fontFamily: BTok.mono, fontSize: 10.5, color: BTok.ink3 }}>§ {String(i+1).padStart(2,'0')}</span>
                  <span style={{ fontFamily: BTok.serif, fontSize: 14, color: fail > 0 ? BTok.ink0 : BTok.ink1 }}>{name}{fail > 0 && <span style={{ color: BTok.oxblood, fontWeight: 700 }}> ‡</span>}</span>
                  <span style={{ fontFamily: BTok.mono, fontSize: 11, color: BTok.ink2 }}>{total - fail}/{total}</span>
                  <span style={{ fontFamily: BTok.mono, fontSize: 11, color: fail > 0 ? BTok.oxblood : BTok.ink3, fontWeight: fail>0?600:400 }}>{fail > 0 ? `${fail} fail` : '—'}</span>
                  <span style={{ fontFamily: BTok.serif, fontSize: 15, color: BTok.ink0, textAlign: 'right' }}>{grade}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 8, fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 12, color: BTok.ink3, textAlign: 'right' }}>
            ‡ marks categories with findings.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Test · Drill-in ★ ────────────────────────────────────────
function B_Drill() {
  return (
    <div style={{ width: '100%', height: '100%', background: BTok.paper, display: 'flex', flexDirection: 'column' }}>
      <BMast section="FINDING · 04 · CRITICAL" subtitle="SCN-0142 · §7.4" />
      <BNav active="Examine" />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr', minHeight: 0 }}>

        {/* Findings list */}
        <div style={{ overflow: 'hidden', borderRight: `1px solid ${BTok.ink5}`, padding: '24px 24px' }}>
          <div style={{ fontFamily: BTok.mono, fontSize: 9.5, letterSpacing: '0.18em', color: BTok.ink3 }}>§04 AUTHORIZATION</div>
          <div style={{ fontFamily: BTok.serif, fontSize: 22, color: BTok.ink0, lineHeight: 1.1 }}>Eight findings</div>
          <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 13, color: BTok.ink2, marginTop: 2 }}>10 of 18 affirmed</div>

          <div style={{ marginTop: 16, borderTop: `1px solid ${BTok.ink2}` }}>
            {CHECKS.Auth.filter(c => c[1]==='fail').map((c, i) => (
              <div key={c[0]} style={{
                padding: '12px 12px', borderBottom: `1px solid ${BTok.ink6}`,
                background: i === 0 ? '#f1ead4' : 'transparent',
                borderLeft: i === 0 ? `3px solid ${BTok.oxblood}` : '3px solid transparent',
              }}>
                <div style={{ fontFamily: BTok.mono, fontSize: 9.5, color: BTok.ink3, letterSpacing: '0.1em' }}>{String(i+1).padStart(2,'0')} · {c[3]}</div>
                <div style={{ fontFamily: BTok.mono, fontSize: 11, color: i === 0 ? BTok.oxblood : BTok.ink1, fontWeight: i === 0 ? 600 : 500, marginTop: 2 }}>{c[0]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Finding body */}
        <div style={{ padding: '28px 44px 28px 36px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
            <div style={{ fontFamily: BTok.serif, fontSize: 64, fontWeight: 600, color: BTok.oxblood, lineHeight: 0.9 }}>‡</div>
            <div>
              <div style={{ fontFamily: BTok.mono, fontSize: 10, letterSpacing: '0.2em', color: BTok.ink3 }}>FINDING 04.001 · CRITICAL</div>
              <div style={{ fontFamily: BTok.serif, fontSize: 30, color: BTok.ink0, letterSpacing: -0.3, lineHeight: 1.1, marginTop: 4 }}>
                The bearer token's <span style={{ fontStyle: 'italic' }}>scope</span> is not enforced against the tool's <span style={{ fontStyle: 'italic' }}>required scope.</span>
              </div>
              <div style={{ fontFamily: BTok.mono, fontSize: 11, color: BTok.ink3, marginTop: 6 }}>auth.bearer-token.scope-validation · spec §7.4</div>
            </div>
          </div>

          <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '40px 1fr', gap: 18 }}>
            <div style={{ fontFamily: BTok.serif, fontSize: 16, color: BTok.ink3, lineHeight: 1.5 }}>§1</div>
            <div>
              <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 11.5, letterSpacing: '0.04em', color: BTok.ink3, textTransform: 'uppercase' }}>The spec, in its own voice</div>
              <blockquote style={{ margin: '6px 0 0', padding: '4px 0 4px 18px', borderLeft: `3px solid ${BTok.ink0}`, fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 16, lineHeight: 1.55, color: BTok.ink1 }}>
                A server <b style={{ fontStyle: 'normal' }}>MUST</b> reject any tool invocation whose required scope is
                not present in the bearer token. The rejection <b style={{ fontStyle: 'normal' }}>MUST</b> use error code
                <code style={{ fontFamily: BTok.mono, fontStyle: 'normal', background: 'transparent', padding: 0 }}> -32002</code> and <b style={{ fontStyle: 'normal' }}>MUST NOT</b> execute the tool.
                <div style={{ fontFamily: BTok.mono, fontStyle: 'normal', fontSize: 10, color: BTok.ink3, marginTop: 6, letterSpacing: '0.04em' }}>— §7.4 ¶ 3</div>
              </blockquote>
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '40px 1fr 1fr', gap: 18 }}>
            <div style={{ fontFamily: BTok.serif, fontSize: 16, color: BTok.ink3 }}>§2</div>
            <div>
              <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 11.5, letterSpacing: '0.04em', color: BTok.ink3, textTransform: 'uppercase' }}>Tendered</div>
              <pre style={{ margin: '4px 0 0', padding: '12px 14px', background: '#f1ead4', fontFamily: BTok.mono, fontSize: 10.5, lineHeight: 1.6, color: BTok.ink1, overflow: 'hidden' }}>{`POST /mcp
authorization: Bearer eyJ…2c8a
{ "method": "tools/call",
  "params": {
    "name": "repo.read_file",
    "arguments": { … } } }
// token granted = ["read"]
// tool requires = ["write"]`}</pre>
            </div>
            <div>
              <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 11.5, letterSpacing: '0.04em', color: BTok.oxblood, textTransform: 'uppercase' }}>Received, against the spec</div>
              <pre style={{ margin: '4px 0 0', padding: '12px 14px', background: '#f1ead4', borderLeft: `3px solid ${BTok.oxblood}`, fontFamily: BTok.mono, fontSize: 10.5, lineHeight: 1.6, color: BTok.ink1, overflow: 'hidden' }}>{`HTTP/1.1 200 OK
{ "result": {
    "content": [{
      "type": "text",
      "text": "wrote 3 lines"
    }] } }
// expected: -32002 insufficient_scope`}</pre>
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '40px 1fr', gap: 18 }}>
            <div style={{ fontFamily: BTok.serif, fontSize: 16, color: BTok.ink3 }}>§3</div>
            <div>
              <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 11.5, letterSpacing: '0.04em', color: BTok.ink3, textTransform: 'uppercase' }}>The remedy proposed</div>
              <pre style={{ margin: '4px 0 0', padding: '12px 14px', background: BTok.ink0, color: BTok.paper, fontFamily: BTok.mono, fontSize: 11, lineHeight: 1.6, overflow: 'hidden' }}>{`// before tools/call dispatch
const required = tool.scopes ?? [];
const granted  = ctx.token.scopes;
if (!required.every(s => granted.includes(s))) {
  return rpc.error(-32002, 'insufficient_scope', { required, granted });
}`}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Build · Canvas ★ ─────────────────────────────────────────
function B_BuildCanvas() {
  return (
    <div style={{ width: '100%', height: '100%', background: BTok.paper, display: 'flex', flexDirection: 'column' }}>
      <BMast section="COMPOSE · github-readonly · TS" subtitle="UNCOMMITTED · 04 EDITS" />
      <BNav active="Compose" />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px', minHeight: 0 }}>

        {/* Document body */}
        <div style={{ padding: '24px 36px', overflow: 'hidden' }}>
          <div style={{ fontFamily: BTok.mono, fontSize: 10, letterSpacing: '0.2em', color: BTok.ink3 }}>SPECIFICATION · CHAPTER I</div>
          <div style={{ fontFamily: BTok.serif, fontSize: 36, color: BTok.ink0, letterSpacing: -0.4 }}>github-readonly</div>
          <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 14, color: BTok.ink2, marginTop: 2 }}>
            A server providing read-only access to GitHub repositories.
          </div>

          {/* Outline */}
          <div style={{ marginTop: 18, fontFamily: BTok.serif, fontSize: 14, color: BTok.ink1, columnCount: 2, columnGap: 36, lineHeight: 1.5 }}>
            {[
              ['1', 'Capabilities'],
              ['1.1', 'tools.listChanged = true'],
              ['1.2', 'prompts.listChanged = false'],
              ['1.3', 'resources.subscribe = true'],
              ['2', 'Tools — 8'],
              ['2.1', 'repo.search'],
              ['2.2', 'repo.read_file  *editing'],
              ['2.3', 'repo.list_dir'],
              ['2.4', 'issues.list'],
              ['2.5', 'issues.create'],
              ['2.6', 'pulls.list'],
              ['2.7', 'pulls.diff'],
              ['2.8', 'workflows.dispatch'],
              ['3', 'Prompts — 2'],
              ['3.1', 'summarize-pr'],
              ['3.2', 'review-diff'],
              ['4', 'Resources — 3'],
              ['4.1', 'repo://*/README'],
              ['4.2', 'repo://*/CHANGELOG'],
              ['4.3', 'schema://github-v4'],
            ].map(([num, label], i) => (
              <div key={num} style={{ display: 'flex', gap: 10, breakInside: 'avoid', padding: '2px 0', color: num === '2.2' ? BTok.ink0 : BTok.ink2, fontWeight: num === '2.2' ? 700 : (!num.includes('.') ? 600 : 400) }}>
                <span style={{ fontFamily: BTok.mono, fontSize: 11, color: BTok.ink3, minWidth: 28 }}>§{num}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Selected tool body */}
          <div style={{ marginTop: 22, borderTop: `2px double ${BTok.rule}`, paddingTop: 14 }}>
            <div style={{ fontFamily: BTok.mono, fontSize: 10, letterSpacing: '0.18em', color: BTok.ink3 }}>§2.2 · TOOL</div>
            <div style={{ fontFamily: BTok.serif, fontSize: 26, color: BTok.ink0 }}>repo.read_file</div>
            <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 13, color: BTok.ink2 }}>Read a single file from a GitHub repository at the given ref.</div>

            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
              <div>
                <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 12, letterSpacing: '0.04em', color: BTok.ink3, textTransform: 'uppercase' }}>Parameters</div>
                <div style={{ marginTop: 6, fontFamily: BTok.mono, fontSize: 11.5, color: BTok.ink1, lineHeight: 1.6 }}>
                  <div><span style={{ color: BTok.ink3 }}>repo  </span>string · required <span style={{ color: BTok.ink3 }}>— "owner/name"</span></div>
                  <div><span style={{ color: BTok.ink3 }}>path  </span>string · required <span style={{ color: BTok.ink3 }}>— "src/index.ts"</span></div>
                  <div><span style={{ color: BTok.ink3 }}>ref   </span>string · optional <span style={{ color: BTok.ink3 }}>— default "HEAD"</span></div>
                </div>
                <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 12, letterSpacing: '0.04em', color: BTok.ink3, textTransform: 'uppercase', marginTop: 14 }}>Returns</div>
                <div style={{ marginTop: 6, fontFamily: BTok.mono, fontSize: 11.5, color: BTok.ink1, lineHeight: 1.6 }}>
                  <div><span style={{ color: BTok.ink3 }}>content </span>string</div>
                  <div><span style={{ color: BTok.ink3 }}>mime    </span>string</div>
                  <div><span style={{ color: BTok.ink3 }}>bytes   </span>integer</div>
                </div>
              </div>
              <div>
                <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 12, letterSpacing: '0.04em', color: BTok.ink3, textTransform: 'uppercase' }}>Handler</div>
                <pre style={{ margin: '6px 0 0', padding: '12px 14px', background: '#f1ead4', fontFamily: BTok.mono, fontSize: 11, lineHeight: 1.55, color: BTok.ink1, overflow: 'hidden' }}>{`export async function repoReadFile(args, ctx) {
  const { repo, path, ref = 'HEAD' } = args;
  const tree = await ctx.gh.tree(repo, ref);
  const blob = tree.find(t => t.path === path);
  if (!blob)
    throw rpc.error(-32011, 'not_found');
  const raw = await ctx.gh.blob(repo, blob.sha);
  return { content: raw.toString('utf8') };
}`}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Right margin — colophon + integrity */}
        <div style={{ padding: '24px 24px', overflow: 'hidden', borderLeft: `1px solid ${BTok.ink5}`, background: '#f1ead4', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: BTok.mono, fontSize: 9.5, letterSpacing: '0.18em', color: BTok.ink3 }}>COLOPHON</div>
          <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 13, color: BTok.ink1, marginTop: 6, lineHeight: 1.55 }}>
            github-readonly · 8 tools · 2 prompts · 3 resources · TypeScript.<br />
            First composed 6 May. Edited continually.
          </div>

          <div style={{ marginTop: 22, fontFamily: BTok.mono, fontSize: 9.5, letterSpacing: '0.18em', color: BTok.ink3 }}>INTEGRITY · LOCAL CHECK</div>
          <div style={{ marginTop: 8, fontFamily: BTok.mono, fontSize: 11, color: BTok.ink1, lineHeight: 1.8 }}>
            ● input schemas valid (8/8)<br />
            ● handlers compile<br />
            ● scopes declared on all tools<br />
            <span style={{ color: BTok.oxblood }}>‡ 2 tools without examples (rec.)</span><br />
            ● descriptions ≤ 1024 chars
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button style={{ fontFamily: BTok.serif, fontSize: 14, padding: '10px 14px', background: BTok.ink0, color: BTok.paper, border: 'none' }}>Generate &amp; review →</button>
            <button style={{ fontFamily: BTok.serif, fontSize: 13, padding: '8px 14px', background: 'transparent', color: BTok.ink1, border: `1px solid ${BTok.ink2}` }}>Examine against draft-2026-v1</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Build · Generation ───────────────────────────────────────
function B_BuildGen() {
  const files = [
    ['src/index.ts',                     '342 B'],
    ['src/handlers/repo.search.ts',      '1.4 kB'],
    ['src/handlers/repo.read_file.ts',   '892 B'],
    ['src/handlers/repo.list_dir.ts',    '654 B'],
    ['src/handlers/issues.list.ts',      '780 B'],
    ['src/handlers/issues.create.ts',    '920 B'],
    ['src/handlers/pulls.list.ts',       '702 B'],
    ['src/handlers/pulls.diff.ts',       '1.1 kB'],
    ['src/handlers/workflows.dispatch.ts','1.0 kB'],
    ['src/prompts/summarize-pr.ts',      '512 B'],
    ['src/resources/index.ts',           '622 B'],
    ['package.json',                     '480 B'],
    ['README.md',                        '1.7 kB'],
  ];
  return (
    <div style={{ width: '100%', height: '100%', background: BTok.paper, display: 'flex', flexDirection: 'column' }}>
      <BMast section="COMPOSE · TYPESETTING" subtitle="github-readonly · v0.1.0" />
      <BNav active="Compose" />
      <div style={{ flex: 1, padding: '24px 36px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 36, minHeight: 0 }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontFamily: BTok.mono, fontSize: 10, letterSpacing: '0.2em', color: BTok.ink3 }}>CHAPTER II · TYPESETTING</div>
          <div style={{ fontFamily: BTok.serif, fontSize: 28, color: BTok.ink0, letterSpacing: -0.3 }}>The fair copy.</div>
          <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 13, color: BTok.ink2, marginTop: 4 }}>13 files · 11.7 kB · ready to be sent down to your machine.</div>

          <div style={{ marginTop: 16, borderTop: `1px solid ${BTok.ink2}` }}>
            {files.map((f, i) => (
              <div key={f[0]} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 80px', padding: '7px 0', borderBottom: `1px solid ${BTok.ink6}`, alignItems: 'baseline' }}>
                <span style={{ fontFamily: BTok.mono, fontSize: 10.5, color: BTok.ink3 }}>{String(i+1).padStart(2,'0')}</span>
                <span style={{ fontFamily: BTok.mono, fontSize: 12, color: BTok.ink0 }}>{f[0]}</span>
                <span style={{ fontFamily: BTok.mono, fontSize: 10.5, color: BTok.ink3, textAlign: 'right' }}>{f[1]}</span>
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 80px', padding: '10px 0', borderTop: `2px double ${BTok.rule}`, fontFamily: BTok.serif, fontStyle: 'italic', color: BTok.ink0 }}>
              <span></span><span>github-readonly-2026-05-26.zip</span><span style={{ fontFamily: BTok.mono, fontStyle: 'normal', textAlign: 'right' }}>11.7 kB</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: BTok.mono, fontSize: 10, letterSpacing: '0.2em', color: BTok.ink3 }}>SETTINGS</div>
          <div style={{ marginTop: 6, fontFamily: BTok.serif, fontSize: 14, color: BTok.ink1, borderTop: `1px solid ${BTok.ink2}` }}>
            {[
              ['Language',  <><span style={{ fontWeight: 600 }}>TypeScript</span> <span style={{ color: BTok.ink3 }}>·</span> <span style={{ color: BTok.ink4 }}>Python</span></>],
              ['Runtime',   'Node 20 ESM'],
              ['Transports','HTTP · stdio'],
              ['Auth',      'Bearer · OAuth 2.1 (PKCE)'],
              ['License',   'MIT'],
              ['Formatter', 'prettier 3.x'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', padding: '11px 0', borderBottom: `1px solid ${BTok.ink6}` }}>
                <span style={{ color: BTok.ink3, fontStyle: 'italic' }}>{k}</span><span>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button style={{ fontFamily: BTok.serif, fontSize: 16, padding: '14px 18px', background: BTok.ink0, color: BTok.paper, border: 'none', textAlign: 'left' }}>↓ &nbsp; Send down · github-readonly.zip</button>
            <button style={{ fontFamily: BTok.serif, fontSize: 13, padding: '10px 16px', background: 'transparent', color: BTok.ink1, border: `1px solid ${BTok.ink2}`, textAlign: 'left' }}>Copy curl one-liner</button>
            <button style={{ fontFamily: BTok.serif, fontSize: 13, padding: '10px 16px', background: 'transparent', color: BTok.ink1, border: `1px solid ${BTok.ink2}`, textAlign: 'left' }}>Dockerfile</button>
          </div>

          <div style={{ marginTop: 'auto', fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 12, color: BTok.ink3, paddingTop: 12 }}>
            Once received, you may examine the server against the spec with one keypress.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Learn ────────────────────────────────────────────────────
function B_Learn() {
  return (
    <div style={{ width: '100%', height: '100%', background: BTok.paper, display: 'flex', flexDirection: 'column' }}>
      <BMast section="REFERENCE · DRAFT-2026-V1" subtitle="§7.4 SCOPES" />
      <BNav active="Reference" />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr 280px', minHeight: 0 }}>

        <div style={{ padding: '20px 22px', overflow: 'hidden', borderRight: `1px solid ${BTok.ink5}` }}>
          <input placeholder="⌘K search the spec…" style={{ width: '100%', padding: '8px 10px', fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 13, border: `1px solid ${BTok.ink2}`, background: '#fff', boxSizing: 'border-box' }} />
          <div style={{ marginTop: 14, fontFamily: BTok.mono, fontSize: 9.5, letterSpacing: '0.16em', color: BTok.ink3 }}>TABLE OF CONTENTS</div>
          <div style={{ marginTop: 6, fontFamily: BTok.serif, fontSize: 13, lineHeight: 1.55 }}>
            {SPEC_TREE.map((s) => {
              const depth = s[0].split('.').length;
              const active = s[0] === '7.4';
              return (
                <div key={s[0]} style={{ padding: `2px 0 2px ${(depth-1)*12}px`, color: active ? BTok.ink0 : BTok.ink2, fontWeight: active ? 700 : 400, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{s[1]}</span>
                  <span style={{ fontFamily: BTok.mono, fontSize: 11, color: BTok.ink3 }}>§{s[0]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '24px 44px', overflow: 'hidden' }}>
          <div style={{ fontFamily: BTok.mono, fontSize: 10, letterSpacing: '0.2em', color: BTok.ink3 }}>§7 AUTHORIZATION · §7.4</div>
          <div style={{ fontFamily: BTok.serif, fontSize: 46, color: BTok.ink0, letterSpacing: -0.8, marginTop: 4, lineHeight: 0.95 }}>Scopes<span style={{ color: BTok.ink4 }}>.</span></div>

          <div style={{ marginTop: 18, fontFamily: BTok.serif, fontSize: 15, lineHeight: 1.65, color: BTok.ink1 }}>
            <p style={{ margin: '0 0 12px' }}>A <i>scope</i> is a string declared by a tool, prompt, or resource and granted to a token. A server <b>MUST</b> treat scopes as authoritative: an unscoped operation <b>MUST NOT</b> be permitted, regardless of the token's identity.</p>
            <p style={{ margin: '0 0 12px' }}>Scopes form a flat namespace. Wildcards (<code style={{ fontFamily: BTok.mono, fontSize: 13 }}>"repo.*"</code>) <b>MAY</b> be granted but <b>MUST NOT</b> be inferred.</p>
            <p style={{ margin: '0 0 12px' }}>A server <b>MUST</b> reject any tool invocation whose required scope is not present in the bearer token. The rejection <b>MUST</b> use error code <code style={{ fontFamily: BTok.mono, fontSize: 13 }}>-32002</code> and <b>MUST NOT</b> execute the tool.</p>
          </div>

          <div style={{ marginTop: 16, fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 12, letterSpacing: '0.04em', color: BTok.ink3, textTransform: 'uppercase' }}>Example</div>
          <pre style={{ marginTop: 6, padding: '14px 16px', background: '#f1ead4', fontFamily: BTok.mono, fontSize: 12, lineHeight: 1.55, color: BTok.ink1, overflow: 'hidden' }}>{`{
  "error": {
    "code": -32002,
    "message": "insufficient_scope",
    "data": { "required": ["write"], "granted": ["read"] }
  }
}`}</pre>
        </div>

        <div style={{ padding: '24px 22px', borderLeft: `1px solid ${BTok.ink5}`, background: '#f1ead4', overflow: 'hidden' }}>
          <div style={{ fontFamily: BTok.mono, fontSize: 9.5, letterSpacing: '0.18em', color: BTok.ink3 }}>CITED BY</div>
          <div style={{ marginTop: 8, fontFamily: BTok.mono, fontSize: 11, color: BTok.ink1, lineHeight: 1.8 }}>
            auth.bearer-token.scope-validation<br />
            auth.bearer-token.expiry-check<br />
            auth.error.no-token-leak
          </div>
          <div style={{ marginTop: 22, fontFamily: BTok.mono, fontSize: 9.5, letterSpacing: '0.18em', color: BTok.ink3 }}>RELATED SECTIONS</div>
          <div style={{ marginTop: 6, fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 13, color: BTok.ink2, lineHeight: 1.6 }}>
            §7.3  OAuth 2.1<br />
            §7.5  PKCE Requirements<br />
            §10   Error Codes
          </div>
          <div style={{ marginTop: 22, padding: '14px 14px', border: `1px solid ${BTok.oxblood}`, background: BTok.paper }}>
            <div style={{ fontFamily: BTok.mono, fontSize: 9.5, letterSpacing: '0.14em', color: BTok.oxblood }}>FROM YOUR LAST EXAMINATION</div>
            <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 13.5, color: BTok.ink1, marginTop: 4 }}>SCN-0142 found <b style={{ fontStyle: 'normal' }}>two failures</b> under §7.4.</div>
            <button style={{ marginTop: 8, fontFamily: BTok.serif, fontSize: 12.5, padding: '6px 12px', background: BTok.ink0, color: BTok.paper, border: 'none' }}>← Return to report</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── States ───────────────────────────────────────────────────
function B_States() {
  return (
    <div style={{ width: '100%', height: '100%', background: BTok.paper, display: 'flex', flexDirection: 'column' }}>
      <BMast section="STATES · EMPTY + ERROR" subtitle="ILLUSTRATIVE" />
      <BNav active="" />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 0 }}>

        <div style={{ padding: '36px 40px', borderRight: `1px solid ${BTok.ink5}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: BTok.mono, fontSize: 10, letterSpacing: '0.2em', color: BTok.ink3 }}>FIRST RUN · NO RECORD</div>
          <div style={{ fontFamily: BTok.serif, fontSize: 50, color: BTok.ink0, letterSpacing: -1, lineHeight: 0.95, marginTop: 14 }}>
            Nothing has been examined here yet.
          </div>
          <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 16, color: BTok.ink2, marginTop: 12, lineHeight: 1.55, maxWidth: 440 }}>
            Argus keeps its records in this browser, on this device. Begin by entering the address of a server you would like examined.
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <input placeholder="http://localhost:3845/mcp" style={{ flex: 1, padding: '12px 14px', fontFamily: BTok.mono, fontSize: 13, border: `1px solid ${BTok.ink2}`, background: '#fff', boxSizing: 'border-box' }} />
            <button style={{ fontFamily: BTok.serif, fontSize: 14, padding: '12px 22px', background: BTok.ink0, color: BTok.paper, border: 'none' }}>Begin ↵</button>
          </div>
          <div style={{ marginTop: 'auto', fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 13, color: BTok.ink3 }}>
            243 checks. ~28 seconds. No upload.
          </div>
        </div>

        <div style={{ padding: '36px 40px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: BTok.mono, fontSize: 10, letterSpacing: '0.2em', color: BTok.oxblood }}>EXAMINATION SUSPENDED · SCN-0143</div>
          <div style={{ fontFamily: BTok.serif, fontSize: 42, color: BTok.ink0, letterSpacing: -0.5, lineHeight: 1, marginTop: 14 }}>
            The subject could not be reached<span style={{ color: BTok.oxblood }}>.</span>
          </div>
          <div style={{ fontFamily: BTok.serif, fontStyle: 'italic', fontSize: 15, color: BTok.ink2, marginTop: 10, lineHeight: 1.55, maxWidth: 460 }}>
            Three attempts were made to <span style={{ fontFamily: BTok.mono, fontStyle: 'normal', fontSize: 13 }}>localhost:3845/mcp</span>; each was refused with <span style={{ fontFamily: BTok.mono, fontStyle: 'normal', fontSize: 13 }}>ECONNREFUSED</span>. The Examiner has set down what was learned and will resume on your word.
          </div>

          <div style={{ marginTop: 22, fontFamily: BTok.mono, fontSize: 11.5, color: BTok.ink1, lineHeight: 1.85 }}>
            <div><span style={{ color: BTok.ink3 }}>endpoint  </span>localhost:3845/mcp</div>
            <div><span style={{ color: BTok.ink3 }}>transport </span>HTTP+SSE</div>
            <div><span style={{ color: BTok.ink3 }}>cause     </span>ECONNREFUSED</div>
            <div><span style={{ color: BTok.ink3 }}>attempts  </span>3 of 3 · back-off 100/400/1600 ms</div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
            <button style={{ fontFamily: BTok.serif, fontSize: 14, padding: '10px 18px', background: BTok.ink0, color: BTok.paper, border: 'none' }}>Retry ↵</button>
            <button style={{ fontFamily: BTok.serif, fontSize: 14, padding: '10px 18px', background: 'transparent', color: BTok.ink1, border: `1px solid ${BTok.ink2}` }}>Edit endpoint</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  B_Brand, B_Home, B_TestInput, B_Scanning, B_Results, B_Drill,
  B_BuildCanvas, B_BuildGen, B_Learn, B_States, B_Rationale,
});
