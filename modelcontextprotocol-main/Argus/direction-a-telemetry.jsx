// Direction A — Telemetry
// POV: ARGUS is an instrument. Engineers read it like they read a scope
// or a flight deck. Persistent status strip on every screen. Heavy mono.
// One accent: amber. Everything else is ink-on-bone.

const ATok = {
  font: '"IBM Plex Sans", system-ui, sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, monospace',
  accent: '#c9871f',          // amber, only for live/state
  fail: '#1d1b18',            // failures are bold ink, not red
  paper: '#f4efe2',
  bg: '#1a1815',              // dark instrument body for chrome strip
  ink0: '#0e0d0b',
  ink1: '#1d1b18',
  ink2: '#3a362f',
  ink3: '#6b665d',
  ink4: '#a09a8e',
  ink5: '#c9c4b8',
  ink6: '#e2dccc',
  ink7: '#efeadc',
};

// ─── Common chrome: persistent status strip on every screen ──────
function AStrip({ scan = 'SCN-0142', state = 'IDLE', tool = '— · —', endpoint, hint }) {
  return (
    <div style={{
      height: 28, background: ATok.bg, color: ATok.ink6,
      fontFamily: ATok.mono, fontSize: 10.5, letterSpacing: '0.06em',
      display: 'flex', alignItems: 'center', padding: '0 14px', gap: 18,
      flexShrink: 0,
    }}>
      <span style={{ fontWeight: 700, letterSpacing: '0.18em', color: '#fff' }}>ARGUS</span>
      <span style={{ color: ATok.ink4 }}>v0.4.1·draft-2026-v1</span>
      <span style={{ width: 1, height: 12, background: ATok.ink3 }} />
      <span><span style={{ color: ATok.ink4 }}>scan</span> {scan}</span>
      <span><span style={{ color: ATok.ink4 }}>state</span> <span style={{ color: state === 'RUNNING' ? ATok.accent : '#fff' }}>● {state}</span></span>
      <span style={{ flex: 1 }} />
      {endpoint && <span style={{ color: ATok.ink4 }}>{endpoint}</span>}
      {hint && <span style={{ color: ATok.ink4 }}>{hint}</span>}
      <span style={{ color: ATok.ink4 }}>14:08:42</span>
    </div>
  );
}

// Left rail with three tools
function ARail({ active = 'TEST' }) {
  const items = [
    ['TEST',  '01'],
    ['BUILD', '02'],
    ['LEARN', '03'],
  ];
  return (
    <div style={{
      width: 64, background: ATok.ink1, color: ATok.ink6,
      fontFamily: ATok.mono, display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '14px 0', gap: 4, flexShrink: 0,
    }}>
      {items.map(([label, num]) => (
        <div key={label} style={{
          width: 52, padding: '12px 0',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          background: active === label ? ATok.bg : 'transparent',
          borderLeft: active === label ? `2px solid ${ATok.accent}` : '2px solid transparent',
          color: active === label ? '#fff' : ATok.ink4,
        }}>
          <span style={{ fontSize: 9, letterSpacing: '0.16em' }}>{num}</span>
          <span style={{ fontSize: 10, letterSpacing: '0.14em', fontWeight: 600 }}>{label}</span>
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 9, color: ATok.ink3, letterSpacing: '0.12em', writingMode: 'vertical-rl', transform: 'rotate(180deg)', padding: '14px 0' }}>
        LOCALSTORAGE · 4 SCANS UNSAVED
      </div>
    </div>
  );
}

// Section heading
function AH({ kicker, title, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '14px 18px 10px', borderBottom: `1px solid ${ATok.ink5}` }}>
      <div>
        <div style={{ fontFamily: ATok.mono, fontSize: 9.5, letterSpacing: '0.18em', color: ATok.ink3 }}>{kicker}</div>
        <div style={{ fontFamily: ATok.mono, fontSize: 15, fontWeight: 600, color: ATok.ink0, letterSpacing: '0.04em', marginTop: 2 }}>{title}</div>
      </div>
      {right}
    </div>
  );
}

// ─────────── 1. BRAND CARD ──────────────────────────────────────
function A_Brand() {
  return (
    <div style={{ width: '100%', height: '100%', background: ATok.paper, fontFamily: ATok.font, color: ATok.ink0, padding: 40, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ fontFamily: ATok.mono, fontSize: 10, letterSpacing: '0.2em', color: ATok.ink3 }}>DIRECTION A · TELEMETRY · WORDMARK + SYMBOL</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        {/* Mark: registration mark, not an eye */}
        <svg width="86" height="86" viewBox="0 0 86 86" fill="none">
          <rect x="0.5" y="0.5" width="85" height="85" stroke={ATok.ink2} strokeWidth="1" />
          <circle cx="43" cy="43" r="28" stroke={ATok.ink0} strokeWidth="1.5" />
          <circle cx="43" cy="43" r="14" stroke={ATok.ink0} strokeWidth="1.5" />
          <circle cx="43" cy="43" r="3" fill={ATok.accent} />
          <line x1="43" y1="6" x2="43" y2="22" stroke={ATok.ink0} strokeWidth="1.5" />
          <line x1="43" y1="64" x2="43" y2="80" stroke={ATok.ink0} strokeWidth="1.5" />
          <line x1="6" y1="43" x2="22" y2="43" stroke={ATok.ink0} strokeWidth="1.5" />
          <line x1="64" y1="43" x2="80" y2="43" stroke={ATok.ink0} strokeWidth="1.5" />
        </svg>
        <div>
          <div style={{ fontFamily: ATok.mono, fontWeight: 700, fontSize: 64, letterSpacing: '0.04em', lineHeight: 0.95 }}>ARGUS</div>
          <div style={{ fontFamily: ATok.mono, fontSize: 11, letterSpacing: '0.18em', color: ATok.ink3, marginTop: 4 }}>MCP·INSTRUMENTATION</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 4 }}>
        {[
          ['INK 0',  ATok.ink0, '#0e0d0b'],
          ['PAPER',  ATok.paper, '#f4efe2'],
          ['AMBER',  ATok.accent, '#c9871f'],
        ].map(([label, bg, hex]) => (
          <div key={label} style={{ background: bg, height: 56, padding: '8px 10px', color: bg === ATok.ink0 ? '#fff' : ATok.ink1, fontFamily: ATok.mono, fontSize: 10, letterSpacing: '0.12em', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span>{label}</span><span style={{ opacity: 0.7 }}>{hex}</span>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: ATok.mono, fontSize: 11, color: ATok.ink2, lineHeight: 1.5, borderTop: `1px solid ${ATok.ink5}`, paddingTop: 14 }}>
        <div style={{ color: ATok.ink3, letterSpacing: '0.16em', fontSize: 9 }}>TYPE</div>
        <div style={{ marginTop: 4 }}>IBM Plex Mono · 400 / 600 / 700</div>
        <div>IBM Plex Sans · 400 / 600 (body, rare)</div>
      </div>
    </div>
  );
}

// ─────────── 2. HOME / DASHBOARD ───────────────────────────────
function A_Home() {
  return (
    <div style={{ width: '100%', height: '100%', background: ATok.paper, display: 'flex', flexDirection: 'column', fontFamily: ATok.font, color: ATok.ink0 }}>
      <AStrip state="IDLE" endpoint="last·localhost:3845/mcp" />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <ARail active="" />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 1, background: ATok.ink5 }}>
          {/* Left: scan history table */}
          <div style={{ background: ATok.paper, display: 'flex', flexDirection: 'column' }}>
            <AH kicker="01 · TEST" title="SCAN HISTORY" right={
              <button style={{ fontFamily: ATok.mono, fontSize: 10, letterSpacing: '0.16em', padding: '6px 12px', border: `1px solid ${ATok.ink0}`, background: ATok.ink0, color: '#fff' }}>NEW SCAN ↵</button>
            } />
            <div style={{ fontFamily: ATok.mono, fontSize: 10.5, lineHeight: 1, color: ATok.ink2 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 90px 50px 32px 50px', padding: '8px 18px', color: ATok.ink3, letterSpacing: '0.1em', fontSize: 9.5, borderBottom: `1px solid ${ATok.ink5}` }}>
                <span>SCAN</span><span>ENDPOINT</span><span>TRANSPORT</span><span>DUR</span><span>GR</span><span>PASS</span>
              </div>
              {SCAN_HISTORY.map((s, i) => (
                <div key={s[0]} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 90px 50px 32px 50px', padding: '10px 18px', borderBottom: `1px solid ${ATok.ink6}`, background: i === 0 ? '#fff' : 'transparent' }}>
                  <span style={{ color: ATok.ink1 }}>{s[0]}</span>
                  <span style={{ color: ATok.ink1 }}>{s[2]}</span>
                  <span style={{ color: ATok.ink2 }}>{s[3]}</span>
                  <span style={{ color: ATok.ink2 }}>{s[4]}</span>
                  <span style={{ color: ATok.ink0, fontWeight: 700 }}>{s[5]}</span>
                  <span style={{ color: ATok.ink2 }}>{s[6]}/243</span>
                </div>
              ))}
            </div>

            <div style={{ flex: 1 }} />

            {/* Grade trend line */}
            <div style={{ padding: '14px 18px', borderTop: `1px solid ${ATok.ink5}` }}>
              <div style={{ fontFamily: ATok.mono, fontSize: 9.5, letterSpacing: '0.16em', color: ATok.ink3, marginBottom: 8 }}>GRADE · LAST 7 SCANS</div>
              <svg width="100%" height="56" viewBox="0 0 700 56" preserveAspectRatio="none">
                {/* horizontal gridlines for A,B,C,D */}
                {[10, 22, 34, 46].map((y, i) => (
                  <line key={i} x1="0" y1={y} x2="700" y2={y} stroke={ATok.ink6} strokeWidth="1" />
                ))}
                <polyline points="20,46 120,40 220,28 320,22 420,42 520,16 620,12 680,6" fill="none" stroke={ATok.ink1} strokeWidth="1.4" />
                {[[20,46],[120,40],[220,28],[320,22],[420,42],[520,16],[620,12],[680,6]].map((p,i)=>(
                  <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill={i===7?ATok.accent:ATok.ink1} />
                ))}
                <text x="694" y="10" fill={ATok.ink3} fontSize="9" fontFamily={ATok.mono} textAnchor="end">A</text>
                <text x="694" y="46" fill={ATok.ink3} fontSize="9" fontFamily={ATok.mono} textAnchor="end">D</text>
              </svg>
            </div>
          </div>

          {/* Right: builds + jump-to-learn */}
          <div style={{ background: ATok.paper, display: 'flex', flexDirection: 'column' }}>
            <AH kicker="02 · BUILD" title="LOCAL BUILDS" right={
              <span style={{ fontFamily: ATok.mono, fontSize: 10, color: ATok.ink3 }}>{BUILDS.length} servers</span>
            } />
            <div style={{ fontFamily: ATok.mono, fontSize: 10.5 }}>
              {BUILDS.map((b, i) => (
                <div key={b[0]} style={{ padding: '12px 18px', borderBottom: `1px solid ${ATok.ink6}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: ATok.ink0, fontWeight: 600 }}>{b[0]}</div>
                    <div style={{ color: ATok.ink3, fontSize: 9.5, marginTop: 2, letterSpacing: '0.06em' }}>{b[1].toUpperCase()} · {b[2]} TOOLS · {b[3]} PROMPTS · {b[4]} RES</div>
                  </div>
                  <div style={{ fontSize: 9.5, color: ATok.ink3 }}>{b[5]}</div>
                </div>
              ))}
              <div style={{ padding: '12px 18px', color: ATok.ink3, fontSize: 10 }}>+ NEW BUILD</div>
            </div>

            <AH kicker="03 · LEARN" title="SPEC · DRAFT-2026-V1" right={
              <span style={{ fontFamily: ATok.mono, fontSize: 10, color: ATok.ink3 }}>243 checks indexed</span>
            } />
            <div style={{ padding: '14px 18px', fontFamily: ATok.mono, fontSize: 10.5, color: ATok.ink2, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div>§7.5  PKCE Requirements <span style={{ color: ATok.ink4 }}>· last viewed 12m</span></div>
              <div>§9.1  Cache Validators <span style={{ color: ATok.ink4 }}>· last viewed 14m</span></div>
              <div>§4.3  SSE (deprecated) <span style={{ color: ATok.ink4 }}>· last viewed 1h</span></div>
              <div style={{ color: ATok.ink3, marginTop: 6, fontSize: 9.5, letterSpacing: '0.1em' }}>⌘K  JUMP TO SECTION</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────── 3. TEST · INPUT ──────────────────────────────────
function A_TestInput() {
  const Row = ({ label, value, hint, mono = true }) => (
    <div style={{ borderBottom: `1px solid ${ATok.ink6}`, padding: '14px 0', display: 'grid', gridTemplateColumns: '160px 1fr 200px', gap: 16, alignItems: 'baseline' }}>
      <div style={{ fontFamily: ATok.mono, fontSize: 10, letterSpacing: '0.14em', color: ATok.ink3 }}>{label}</div>
      <div style={{ fontFamily: mono ? ATok.mono : ATok.font, fontSize: 14, color: ATok.ink0 }}>{value}</div>
      <div style={{ fontFamily: ATok.mono, fontSize: 10, color: ATok.ink3, textAlign: 'right' }}>{hint}</div>
    </div>
  );
  return (
    <div style={{ width: '100%', height: '100%', background: ATok.paper, display: 'flex', flexDirection: 'column', fontFamily: ATok.font, color: ATok.ink0 }}>
      <AStrip state="READY" endpoint="localhost:3845/mcp" hint="composing scan" />
      <div style={{ flex: 1, display: 'flex' }}>
        <ARail active="TEST" />
        <div style={{ flex: 1, padding: '24px 32px', overflow: 'hidden' }}>
          <div style={{ fontFamily: ATok.mono, fontSize: 9.5, letterSpacing: '0.2em', color: ATok.ink3 }}>01 · TEST / NEW SCAN</div>
          <div style={{ fontFamily: ATok.mono, fontSize: 22, fontWeight: 600, letterSpacing: '0.02em', marginTop: 4 }}>COMPOSE SCAN</div>

          <div style={{ marginTop: 22, borderTop: `1px solid ${ATok.ink2}` }}>
            <Row label="ENDPOINT" value="localhost:3845/mcp" hint="ip · 127.0.0.1" />
            <Row label="TRANSPORT" value="HTTP+SSE  ·  stdio  ·  WebSocket" hint="HTTP+SSE selected" />
            <Row label="AUTH" value="Bearer  •••••••••2c8a" hint="optional" />
            <Row label="SPEC PROFILE" value="draft-2026-v1  ·  243 checks" hint="locked" />
            <Row label="CATEGORIES" value="all 19" hint="customize →" />
            <Row label="TIMEOUT/CHECK" value="2000 ms" hint="per spec §3.4" />
            <Row label="PARALLELISM" value="8 in-flight" hint="↑ 16  ↓ 1" />
          </div>

          <div style={{ marginTop: 22, display: 'flex', gap: 12, alignItems: 'center' }}>
            <button style={{ fontFamily: ATok.mono, fontSize: 12, letterSpacing: '0.18em', padding: '12px 22px', border: 'none', background: ATok.ink0, color: '#fff' }}>RUN SCAN ↵</button>
            <span style={{ fontFamily: ATok.mono, fontSize: 10, color: ATok.ink3 }}>estimated 28s · 243 checks</span>
          </div>

          {/* Live signal preview - already pinged */}
          <div style={{ marginTop: 28, fontFamily: ATok.mono, fontSize: 10.5, color: ATok.ink2, borderTop: `1px solid ${ATok.ink6}`, paddingTop: 14 }}>
            <div style={{ color: ATok.ink3, fontSize: 9.5, letterSpacing: '0.16em', marginBottom: 8 }}>PRE-FLIGHT PROBE</div>
            <div>↑ initialize <span style={{ color: ATok.ink3 }}>→</span> response 12ms <span style={{ color: ATok.accent }}>● ok</span></div>
            <div>↑ ping        <span style={{ color: ATok.ink3 }}>→</span> response 4ms  <span style={{ color: ATok.accent }}>● ok</span></div>
            <div>↑ tools/list  <span style={{ color: ATok.ink3 }}>→</span> response 21ms <span style={{ color: ATok.accent }}>● ok</span> · 14 tools detected</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────── 4. TEST · SCANNING (LIVE) ★ ───────────────────────
function A_Scanning() {
  // Build a live-feeling list of streaming checks
  const streamLines = [
    ['14:08:11.204', 'transport.http.framing.content-length',         'pass', '8ms'],
    ['14:08:11.212', 'transport.http.framing.chunked-encoding',       'pass', '6ms'],
    ['14:08:11.220', 'transport.sse.event-id.monotonic',              'pass', '11ms'],
    ['14:08:11.232', 'transport.sse.retry.respect-server-hint',       'FAIL', '1200ms'],
    ['14:08:11.241', 'transport.stdio.message-delimiter',             'skip', '—'],
    ['14:08:11.249', 'jsonrpc.version-field.required',                'pass', '4ms'],
    ['14:08:11.257', 'jsonrpc.batch.partial-response',                'FAIL', '14ms'],
    ['14:08:11.266', 'jsonrpc.batch.empty-array-rejected',            'pass', '5ms'],
    ['14:08:11.274', 'jsonrpc.request.id.uniqueness',                 'pass', '7ms'],
    ['14:08:11.281', 'jsonrpc.notification.no-response',              'pass', '3ms'],
    ['14:08:11.289', 'jsonrpc.error.reserved-codes',                  'pass', '6ms'],
    ['14:08:11.298', 'lifecycle.initialize.protocol-version',         'pass', '12ms'],
    ['14:08:11.310', 'lifecycle.initialize.capabilities.symmetric',   'pass', '8ms'],
    ['14:08:11.318', 'lifecycle.initialized.notification',            'pass', '5ms'],
    ['14:08:11.326', 'lifecycle.shutdown.graceful',                   'pass', '11ms'],
    ['14:08:11.337', 'lifecycle.shutdown.in-flight-requests',         'FAIL', '2010ms'],
    ['14:08:11.348', 'auth.bearer-token.scope-validation',            'FAIL', '8ms'],
    ['14:08:11.356', 'auth.bearer-token.expiry-check',                'FAIL', '6ms'],
    ['14:08:11.364', 'auth.oauth.pkce.s256-only',                     'FAIL', '9ms'],
    ['14:08:11.373', 'auth.oauth.refresh-rotation',                   'FAIL', '14ms'],
    ['14:08:11.382', 'auth.oauth.state.csrf',                         'FAIL', '7ms'],
    ['14:08:11.391', 'auth.session.timeout',                          'FAIL', '6ms'],
    ['14:08:11.400', 'auth.session.rotation-on-privilege-change',     'running', null],
  ];
  return (
    <div style={{ width: '100%', height: '100%', background: ATok.paper, display: 'flex', flexDirection: 'column', fontFamily: ATok.font }}>
      <AStrip state="RUNNING" endpoint="localhost:3845/mcp" hint="scan in progress" />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <ARail active="TEST" />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 1, background: ATok.ink5, minHeight: 0 }}>
          {/* Center: log + sweep meter */}
          <div style={{ background: ATok.paper, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <AH kicker="01 · TEST · LIVE" title="SCN-0142 · STREAMING" right={
              <div style={{ display: 'flex', gap: 14, fontFamily: ATok.mono, fontSize: 10, color: ATok.ink2 }}>
                <span><span style={{ color: ATok.ink3 }}>elapsed</span> 12.4s</span>
                <span><span style={{ color: ATok.ink3 }}>eta</span> 16s</span>
                <span><span style={{ color: ATok.ink3 }}>tps</span> 8.6 chk/s</span>
              </div>
            } />

            {/* Big readout */}
            <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, borderBottom: `1px solid ${ATok.ink5}` }}>
              {[
                ['RUN', '107/243', '#fff', ATok.accent],
                ['PASS', '94', '#fff', ATok.ink0],
                ['FAIL', '13', '#fff', ATok.ink0],
                ['SKIP', '0', '#fff', ATok.ink3],
              ].map(([k,v,bg,c],i) => (
                <div key={i} style={{ background: bg, padding: '10px 12px', borderLeft: `2px solid ${c}` }}>
                  <div style={{ fontFamily: ATok.mono, fontSize: 9.5, letterSpacing: '0.16em', color: ATok.ink3 }}>{k}</div>
                  <div style={{ fontFamily: ATok.mono, fontSize: 26, fontWeight: 600, color: c, lineHeight: 1.1, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Sweep meter — per-category fill */}
            <div style={{ padding: '12px 18px', borderBottom: `1px solid ${ATok.ink5}` }}>
              <div style={{ fontFamily: ATok.mono, fontSize: 9.5, letterSpacing: '0.16em', color: ATok.ink3, marginBottom: 8 }}>CATEGORY SWEEP · 7 / 19 COMPLETE</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(19, 1fr)', gap: 3, height: 36 }}>
                {CATEGORIES.map(([name, total, fail], i) => {
                  const done = i < 7 ? total : i === 7 ? Math.floor(total * 0.5) : 0;
                  const pct = done / total;
                  const failed = i < 7 ? fail : 0;
                  return (
                    <div key={name} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative' }}>
                      <div style={{ flex: pct, background: failed > 0 ? ATok.ink0 : ATok.ink2, minHeight: pct > 0 ? 1 : 0 }} />
                      <div style={{ flex: 1 - pct, background: i === 7 ? `repeating-linear-gradient(45deg, ${ATok.accent} 0 4px, transparent 4px 8px)` : ATok.ink6 }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(19, 1fr)', gap: 3, marginTop: 6 }}>
                {CATEGORIES.map(([name], i) => (
                  <div key={name} style={{ fontFamily: ATok.mono, fontSize: 7.5, color: i < 7 ? ATok.ink2 : ATok.ink4, transform: 'rotate(-45deg)', transformOrigin: 'top left', whiteSpace: 'nowrap' }}>{name.slice(0,4).toUpperCase()}</div>
                ))}
              </div>
            </div>

            {/* Stream */}
            <div style={{ flex: 1, overflow: 'hidden', fontFamily: ATok.mono, fontSize: 10.5, color: ATok.ink2 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 50px 50px', padding: '8px 18px', color: ATok.ink3, letterSpacing: '0.1em', fontSize: 9, borderBottom: `1px solid ${ATok.ink6}` }}>
                <span>TIME</span><span>CHECK</span><span>STATUS</span><span>DUR</span>
              </div>
              {streamLines.slice(-14).reverse().map((l, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 50px 50px', padding: '5px 18px', borderBottom: `1px solid ${ATok.ink6}`, color: ATok.ink2 }}>
                  <span style={{ color: ATok.ink4 }}>{l[0]}</span>
                  <span style={{ color: l[2]==='FAIL' ? ATok.ink0 : ATok.ink1, fontWeight: l[2]==='FAIL' ? 600 : 400 }}>{l[1]}</span>
                  <span style={{ color: l[2]==='FAIL' ? ATok.ink0 : l[2]==='running' ? ATok.accent : ATok.ink3, fontWeight: 600 }}>
                    {l[2]==='running' ? '● run' : l[2].toUpperCase()}
                  </span>
                  <span style={{ color: ATok.ink3 }}>{l[3] || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: inspector — currently running check */}
          <div style={{ background: ATok.paper, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <AH kicker="INSPECTOR" title="LIVE PROBE" />
            <div style={{ padding: '14px 18px', fontFamily: ATok.mono, fontSize: 10.5, color: ATok.ink2 }}>
              <div style={{ color: ATok.ink3, fontSize: 9, letterSpacing: '0.16em', marginBottom: 4 }}>CURRENT</div>
              <div style={{ color: ATok.ink0, fontWeight: 600 }}>auth.session.rotation-on-privilege-change</div>
              <div style={{ color: ATok.ink3, marginTop: 8, fontSize: 9.5, letterSpacing: '0.12em' }}>SPEC §7.6.2</div>

              <div style={{ marginTop: 14, color: ATok.ink3, fontSize: 9, letterSpacing: '0.16em' }}>SENT</div>
              <pre style={{ margin: '4px 0 0', padding: '8px 10px', background: '#fff', border: `1px solid ${ATok.ink6}`, fontSize: 10, overflow: 'hidden' }}>{`POST /mcp
auth: Bearer …2c8a
{ "method": "tools/call",
  "params": { "name":
    "repo.read_file" } }`}</pre>

              <div style={{ marginTop: 14, color: ATok.ink3, fontSize: 9, letterSpacing: '0.16em' }}>WAITING</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: ATok.accent }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: ATok.accent, animation: 'apulse 1.2s infinite' }} />
                1842 ms
              </div>

              <div style={{ marginTop: 22, color: ATok.ink3, fontSize: 9, letterSpacing: '0.16em' }}>STOP / PAUSE</div>
              <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                <button style={{ flex: 1, fontFamily: ATok.mono, fontSize: 10, letterSpacing: '0.14em', padding: '8px 0', border: `1px solid ${ATok.ink3}`, background: 'transparent', color: ATok.ink2 }}>PAUSE</button>
                <button style={{ flex: 1, fontFamily: ATok.mono, fontSize: 10, letterSpacing: '0.14em', padding: '8px 0', border: `1px solid ${ATok.ink0}`, background: 'transparent', color: ATok.ink0 }}>ABORT</button>
              </div>
            </div>
            <style>{`@keyframes apulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────── 5. TEST · RESULTS (OVERVIEW) ★ ───────────────────
function A_Results() {
  return (
    <div style={{ width: '100%', height: '100%', background: ATok.paper, display: 'flex', flexDirection: 'column', fontFamily: ATok.font }}>
      <AStrip state="COMPLETE" endpoint="localhost:3845/mcp" hint="28.4s · 229 pass · 14 fail" />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <ARail active="TEST" />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr', gap: 1, background: ATok.ink5 }}>
          {/* Grade reveal panel */}
          <div style={{ background: ATok.ink1, color: ATok.ink6, padding: '24px 22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: ATok.mono, fontSize: 9.5, letterSpacing: '0.2em', color: ATok.ink4 }}>SCN-0142 · 14:08 · LOCAL</div>
            <div style={{ fontFamily: ATok.mono, fontSize: 9.5, letterSpacing: '0.2em', color: ATok.ink4, marginTop: 2 }}>localhost:3845/mcp · HTTP+SSE</div>

            <div style={{ marginTop: 24, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontFamily: ATok.mono, fontWeight: 700, fontSize: 140, lineHeight: 0.85, letterSpacing: '-0.04em', color: ATok.accent }}>B+</div>
              <div>
                <div style={{ fontFamily: ATok.mono, fontSize: 24, fontWeight: 600 }}>229</div>
                <div style={{ fontFamily: ATok.mono, fontSize: 11, color: ATok.ink4 }}>of 243</div>
              </div>
            </div>

            <div style={{ marginTop: 6, fontFamily: ATok.mono, fontSize: 11, color: ATok.ink5 }}>
              ↑ <span style={{ color: ATok.accent }}>+8</span> from SCN-0141 · B
            </div>

            <div style={{ marginTop: 28, fontFamily: ATok.mono, fontSize: 10.5, color: ATok.ink5, lineHeight: 1.7, borderTop: `1px solid ${ATok.ink2}`, paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: ATok.ink4 }}>pass</span><span>229</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: ATok.ink4 }}>fail · critical</span><span>3</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: ATok.ink4 }}>fail · major</span><span>9</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: ATok.ink4 }}>fail · minor</span><span>2</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: ATok.ink4 }}>skip / n/a</span><span>0</span></div>
            </div>

            <div style={{ flex: 1 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 18 }}>
              {['DOWNLOAD HTML', 'DOWNLOAD JSON', 'DOWNLOAD MD'].map((t) => (
                <button key={t} style={{ fontFamily: ATok.mono, fontSize: 10, letterSpacing: '0.16em', padding: '9px 12px', border: `1px solid ${ATok.ink3}`, background: 'transparent', color: ATok.ink6, textAlign: 'left' }}>↓ {t}</button>
              ))}
              <button style={{ marginTop: 6, fontFamily: ATok.mono, fontSize: 10, letterSpacing: '0.16em', padding: '9px 12px', border: 'none', background: ATok.accent, color: ATok.ink0, fontWeight: 700 }}>RE-SCAN ↵</button>
            </div>
          </div>

          {/* Right: category breakdown table */}
          <div style={{ background: ATok.paper, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <AH kicker="CATEGORY BREAKDOWN" title="19 CATEGORIES · 243 CHECKS" right={
              <div style={{ display: 'flex', gap: 8, fontFamily: ATok.mono, fontSize: 10, color: ATok.ink3 }}>
                <span>SORT</span><span style={{ color: ATok.ink0 }}>FAIL ↓</span><span>·</span><span>NAME</span><span>·</span><span>SCORE</span>
              </div>
            } />

            <div style={{ display: 'grid', gridTemplateColumns: '24px 1.4fr 1.6fr 60px 60px', padding: '8px 18px', color: ATok.ink3, letterSpacing: '0.1em', fontSize: 9.5, borderBottom: `1px solid ${ATok.ink5}`, fontFamily: ATok.mono }}>
              <span></span><span>CATEGORY</span><span>SCORE</span><span>FAIL</span><span>GRADE</span>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', fontFamily: ATok.mono, fontSize: 11 }}>
              {CATEGORIES.map(([name, total, fail], i) => {
                const pass = total - fail;
                const pct = pass / total;
                const grade = pct >= 0.95 ? 'A' : pct >= 0.85 ? 'A-' : pct >= 0.75 ? 'B' : pct >= 0.6 ? 'C' : 'D';
                return (
                  <div key={name} style={{ display: 'grid', gridTemplateColumns: '24px 1.4fr 1.6fr 60px 60px', padding: '8px 18px', borderBottom: `1px solid ${ATok.ink6}`, alignItems: 'center', background: fail > 0 ? '#fff' : 'transparent' }}>
                    <span style={{ color: ATok.ink4, fontSize: 9.5 }}>{String(i+1).padStart(2,'0')}</span>
                    <span style={{ color: ATok.ink0, fontWeight: fail>0?600:400 }}>{name} {fail > 0 && <span style={{ color: ATok.ink3, fontWeight: 400, marginLeft: 6 }}>↗</span>}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontVariantNumeric: 'tabular-nums', color: ATok.ink2, minWidth: 56 }}>{pass}/{total}</span>
                      <span style={{ flex: 1, height: 6, background: ATok.ink6, position: 'relative' }}>
                        <span style={{ position: 'absolute', inset: 0, width: `${pct*100}%`, background: fail>0 ? ATok.ink1 : ATok.ink2 }} />
                        {fail > 0 && <span style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct*100}%`, right: 0, background: `repeating-linear-gradient(45deg, ${ATok.accent} 0 3px, transparent 3px 6px)` }} />}
                      </span>
                    </span>
                    <span style={{ color: fail>0 ? ATok.ink0 : ATok.ink3, fontWeight: fail>0?700:400 }}>{fail || '—'}</span>
                    <span style={{ color: ATok.ink0, fontWeight: 600 }}>{grade}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────── 6. TEST · DRILL-IN ★ ──────────────────────────────
function A_Drill() {
  const fail = CHECKS.Auth.filter((c) => c[1] === 'fail');
  return (
    <div style={{ width: '100%', height: '100%', background: ATok.paper, display: 'flex', flexDirection: 'column', fontFamily: ATok.font }}>
      <AStrip state="REPORT" endpoint="localhost:3845/mcp" hint="SCN-0142 · category: Authorization" />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <ARail active="TEST" />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '360px 1fr', gap: 1, background: ATok.ink5, minHeight: 0 }}>
          {/* Failed checks list */}
          <div style={{ background: ATok.paper, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <AH kicker="CATEGORY · 04" title="AUTHORIZATION · 8 FAIL" right={
              <span style={{ fontFamily: ATok.mono, fontSize: 10, color: ATok.ink3 }}>10/18 pass</span>
            } />
            <div style={{ padding: '8px 0', fontFamily: ATok.mono, fontSize: 10.5 }}>
              {CHECKS.Auth.map((c, i) => (
                <div key={c[0]} style={{
                  padding: '10px 18px', borderLeft: i === 0 ? `3px solid ${ATok.ink0}` : '3px solid transparent',
                  background: i === 0 ? '#fff' : 'transparent', borderBottom: `1px solid ${ATok.ink6}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ color: c[1]==='fail' ? ATok.ink0 : ATok.ink3, fontWeight: c[1]==='fail'?600:400 }}>{c[0]}</span>
                    <span style={{ color: c[1]==='fail' ? ATok.ink0 : ATok.ink4, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em' }}>
                      {c[1].toUpperCase()}
                    </span>
                  </div>
                  {c[2] && <div style={{ color: ATok.ink2, fontSize: 9.5, marginTop: 3, lineHeight: 1.4 }}>{c[2]}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Fix detail */}
          <div style={{ background: ATok.paper, padding: '20px 26px', overflow: 'hidden', fontFamily: ATok.mono, fontSize: 11.5, color: ATok.ink2, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 9.5, letterSpacing: '0.2em', color: ATok.ink3 }}>CHECK · 04.001 · CRITICAL</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: ATok.ink0, marginTop: 4, letterSpacing: '0.01em' }}>auth.bearer-token.scope-validation</div>
            <div style={{ fontSize: 11, color: ATok.ink3, marginTop: 4 }}>spec §7.4 · scopes · 2 attempts · 8ms avg</div>

            <div style={{ marginTop: 18, fontSize: 9.5, letterSpacing: '0.16em', color: ATok.ink3 }}>WHAT THE SPEC SAYS</div>
            <div style={{ marginTop: 6, padding: '12px 14px', borderLeft: `3px solid ${ATok.ink0}`, background: '#fff', fontFamily: '"Newsreader", serif', fontSize: 13, lineHeight: 1.55, color: ATok.ink1, fontStyle: 'italic' }}>
              "A server MUST reject any tool invocation whose required scope is
              not present in the bearer token. The rejection MUST use error code
              -32002 (insufficient_scope) and MUST NOT execute the tool."
              <div style={{ fontFamily: ATok.mono, fontSize: 10, color: ATok.ink3, marginTop: 8, fontStyle: 'normal' }}>— §7.4 · paragraph 3</div>
            </div>

            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontSize: 9.5, letterSpacing: '0.16em', color: ATok.ink3 }}>SENT</div>
                <pre style={{ margin: '6px 0 0', padding: '10px 12px', background: '#fff', border: `1px solid ${ATok.ink6}`, fontSize: 10.5, lineHeight: 1.5, overflow: 'hidden' }}>{`POST /mcp
authorization: Bearer eyJ…2c8a
{ "method": "tools/call",
  "params": {
    "name": "repo.read_file",
    "arguments": { … } } }
# token scope = ["read"]
# tool requires = ["write"]`}</pre>
              </div>
              <div>
                <div style={{ fontSize: 9.5, letterSpacing: '0.16em', color: ATok.ink3 }}>RECEIVED <span style={{ color: ATok.ink0, marginLeft: 6 }}>← UNEXPECTED</span></div>
                <pre style={{ margin: '6px 0 0', padding: '10px 12px', background: '#fff', border: `1px solid ${ATok.ink0}`, fontSize: 10.5, lineHeight: 1.5, overflow: 'hidden' }}>{`HTTP/1.1 200 OK
{ "result": {
    "content": [{
      "type": "text",
      "text": "wrote 3 lines"
    }] } }
# expected -32002 insufficient_scope`}</pre>
              </div>
            </div>

            <div style={{ marginTop: 16, fontSize: 9.5, letterSpacing: '0.16em', color: ATok.ink3 }}>SUGGESTED FIX</div>
            <pre style={{ margin: '6px 0 0', padding: '12px 14px', background: ATok.ink1, color: ATok.ink6, fontSize: 10.5, lineHeight: 1.6, overflow: 'hidden' }}>{`// before tools/call dispatch
const required = tool.scopes ?? [];
const granted  = ctx.token.scopes;
if (!required.every(s => granted.includes(s))) {
  return rpc.error(-32002, 'insufficient_scope', {
    required, granted
  });
}`}</pre>

            <div style={{ marginTop: 'auto', paddingTop: 14, display: 'flex', gap: 12, alignItems: 'center', fontSize: 10, color: ATok.ink3 }}>
              <button style={{ fontFamily: ATok.mono, fontSize: 10, letterSpacing: '0.14em', padding: '8px 14px', border: `1px solid ${ATok.ink0}`, background: ATok.ink0, color: '#fff' }}>OPEN IN LEARN · §7.4 →</button>
              <button style={{ fontFamily: ATok.mono, fontSize: 10, letterSpacing: '0.14em', padding: '8px 14px', border: `1px solid ${ATok.ink3}`, background: 'transparent', color: ATok.ink2 }}>COPY FIX</button>
              <span style={{ marginLeft: 'auto' }}>↑↓ next check  ·  ⌘C copy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────── 7. BUILD · CANVAS ★ ───────────────────────────────
function A_BuildCanvas() {
  return (
    <div style={{ width: '100%', height: '100%', background: ATok.paper, display: 'flex', flexDirection: 'column', fontFamily: ATok.font }}>
      <AStrip state="DRAFT" endpoint="build · github-readonly" hint="unsaved · 4 changes" />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <ARail active="BUILD" />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '220px 1fr 340px', gap: 1, background: ATok.ink5, minHeight: 0 }}>
          {/* Left: components list */}
          <div style={{ background: ATok.paper, overflow: 'hidden' }}>
            <AH kicker="ASSEMBLY" title="GITHUB-READONLY" />
            <div style={{ padding: '12px 16px', fontFamily: ATok.mono, fontSize: 10.5 }}>
              <div style={{ color: ATok.ink3, fontSize: 9, letterSpacing: '0.16em' }}>TOOLS · 8</div>
              {TOOLS_FOR_BUILD.map((t,i) => (
                <div key={t[0]} style={{ padding: '7px 8px', marginTop: 2, background: i===1 ? '#fff' : 'transparent', borderLeft: i===1 ? `2px solid ${ATok.ink0}` : '2px solid transparent', color: i===1 ? ATok.ink0 : ATok.ink2, fontWeight: i===1?600:400 }}>
                  {t[0]}
                </div>
              ))}
              <div style={{ color: ATok.ink3, fontSize: 9, letterSpacing: '0.16em', marginTop: 16 }}>PROMPTS · 2</div>
              <div style={{ padding: '7px 8px', color: ATok.ink2 }}>summarize-pr</div>
              <div style={{ padding: '7px 8px', color: ATok.ink2 }}>review-diff</div>
              <div style={{ color: ATok.ink3, fontSize: 9, letterSpacing: '0.16em', marginTop: 16 }}>RESOURCES · 3</div>
              <div style={{ padding: '7px 8px', color: ATok.ink2 }}>repo://*/README</div>
              <div style={{ padding: '7px 8px', color: ATok.ink2 }}>repo://*/CHANGELOG</div>
              <div style={{ padding: '7px 8px', color: ATok.ink2 }}>schema://github-v4</div>
              <div style={{ marginTop: 16, padding: '8px 8px', color: ATok.ink3, border: `1px dashed ${ATok.ink4}` }}>+ ADD COMPONENT</div>
            </div>
          </div>

          {/* Center: pipeline view of selected tool */}
          <div style={{ background: ATok.paper, padding: '20px 26px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: ATok.mono, fontSize: 9.5, letterSpacing: '0.2em', color: ATok.ink3 }}>TOOL · 02 / 08</div>
            <div style={{ fontFamily: ATok.mono, fontSize: 22, fontWeight: 600, color: ATok.ink0 }}>repo.read_file</div>

            {/* Linear pipeline */}
            <div style={{ marginTop: 22, display: 'flex', alignItems: 'stretch', gap: 0, fontFamily: ATok.mono, fontSize: 10.5 }}>
              {[
                ['INPUT', 'repo: string\npath: string\nref?: string', 3],
                ['VALIDATE', 'json-schema\nrequired={repo,path}', 2],
                ['AUTHORIZE', 'scope: read\nrate: 60/min', 2],
                ['HANDLER', 'src/handlers/\nread_file.ts', 4],
                ['OUTPUT', 'content: string\nmime: string\nbytes: integer', 3],
              ].map(([label, body, lines], i, arr) => (
                <React.Fragment key={label}>
                  <div style={{ flex: 1, padding: 12, border: `1px solid ${ATok.ink3}`, background: i === 3 ? '#fff' : ATok.paper, position: 'relative' }}>
                    <div style={{ color: ATok.ink3, fontSize: 9, letterSpacing: '0.16em' }}>{label}</div>
                    <pre style={{ margin: '6px 0 0', fontSize: 10, color: ATok.ink1, whiteSpace: 'pre-wrap' }}>{body}</pre>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ATok.ink3 }}>→</div>
                  )}
                </React.Fragment>
              ))}
            </div>

            <div style={{ marginTop: 22, fontFamily: ATok.mono, fontSize: 9.5, letterSpacing: '0.16em', color: ATok.ink3 }}>HANDLER · src/handlers/read_file.ts</div>
            <pre style={{ marginTop: 6, padding: '12px 14px', background: '#fff', border: `1px solid ${ATok.ink5}`, fontFamily: ATok.mono, fontSize: 11, lineHeight: 1.55, color: ATok.ink1, flex: 1, overflow: 'hidden' }}>{`export async function repoReadFile(args, ctx) {
  const { repo, path, ref = 'HEAD' } = args;
  const tree = await ctx.gh.tree(repo, ref);
  const blob = tree.find(t => t.path === path);
  if (!blob) throw rpc.error(-32011, 'not_found', { path });

  const raw = await ctx.gh.blob(repo, blob.sha);
  return {
    content: raw.toString('utf8'),
    mime:    detectMime(path),
    bytes:   raw.byteLength,
  };
}`}</pre>

            <div style={{ marginTop: 12, fontFamily: ATok.mono, fontSize: 10, color: ATok.ink3 }}>
              <span style={{ color: ATok.accent }}>● </span> 1 unsaved · auto-formatted on generate
            </div>
          </div>

          {/* Right: inspector for selected tool */}
          <div style={{ background: ATok.paper, overflow: 'hidden' }}>
            <AH kicker="INSPECTOR" title="SCHEMA · DESCRIPTION" />
            <div style={{ padding: '14px 18px', fontFamily: ATok.mono, fontSize: 10.5, color: ATok.ink2 }}>
              <div style={{ color: ATok.ink3, fontSize: 9, letterSpacing: '0.16em' }}>NAME</div>
              <input defaultValue="repo.read_file" style={{ width: '100%', marginTop: 4, padding: '6px 8px', border: `1px solid ${ATok.ink4}`, fontFamily: ATok.mono, fontSize: 11, background: '#fff', boxSizing: 'border-box' }} />

              <div style={{ color: ATok.ink3, fontSize: 9, letterSpacing: '0.16em', marginTop: 14 }}>DESCRIPTION</div>
              <textarea defaultValue="Read a single file from a GitHub repository at the given ref." style={{ width: '100%', marginTop: 4, padding: '6px 8px', border: `1px solid ${ATok.ink4}`, fontFamily: ATok.mono, fontSize: 11, lineHeight: 1.4, background: '#fff', minHeight: 50, boxSizing: 'border-box', resize: 'none' }} />

              <div style={{ color: ATok.ink3, fontSize: 9, letterSpacing: '0.16em', marginTop: 14 }}>PARAMETERS</div>
              <div style={{ marginTop: 6, border: `1px solid ${ATok.ink5}`, background: '#fff' }}>
                {[
                  ['repo', 'string', 'required'],
                  ['path', 'string', 'required'],
                  ['ref',  'string', 'optional'],
                ].map(([n,t,r]) => (
                  <div key={n} style={{ padding: '7px 10px', display: 'grid', gridTemplateColumns: '70px 50px 1fr', alignItems: 'center', fontSize: 10.5, borderBottom: `1px solid ${ATok.ink6}` }}>
                    <span style={{ color: ATok.ink0, fontWeight: 600 }}>{n}</span>
                    <span style={{ color: ATok.ink2 }}>{t}</span>
                    <span style={{ color: r==='required' ? ATok.ink0 : ATok.ink3, fontSize: 9.5, letterSpacing: '0.1em' }}>{r}</span>
                  </div>
                ))}
                <div style={{ padding: '8px 10px', color: ATok.ink3, fontSize: 10.5 }}>+ ADD</div>
              </div>

              <div style={{ color: ATok.ink3, fontSize: 9, letterSpacing: '0.16em', marginTop: 14 }}>SCOPE</div>
              <div style={{ marginTop: 4, fontSize: 11 }}>read</div>

              <div style={{ color: ATok.ink3, fontSize: 9, letterSpacing: '0.16em', marginTop: 14 }}>SPEC CONFORMANCE</div>
              <div style={{ marginTop: 4, color: ATok.ink2, fontSize: 10.5 }}>● input schema valid</div>
              <div style={{ color: ATok.ink2, fontSize: 10.5 }}>● description ≤ 1024 chars</div>
              <div style={{ color: ATok.ink2, fontSize: 10.5 }}>○ no example calls (rec.)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────── 8. BUILD · GENERATION ─────────────────────────────
function A_BuildGen() {
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
    ['src/prompts/review-diff.ts',       '486 B'],
    ['src/resources/index.ts',           '622 B'],
    ['package.json',                     '480 B'],
    ['tsconfig.json',                    '210 B'],
    ['README.md',                        '1.7 kB'],
  ];
  return (
    <div style={{ width: '100%', height: '100%', background: ATok.paper, display: 'flex', flexDirection: 'column', fontFamily: ATok.font }}>
      <AStrip state="READY-TO-EMIT" endpoint="build · github-readonly" hint="TypeScript · 15 files" />
      <div style={{ flex: 1, display: 'flex' }}>
        <ARail active="BUILD" />
        <div style={{ flex: 1, padding: '24px 32px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
          <div>
            <div style={{ fontFamily: ATok.mono, fontSize: 9.5, letterSpacing: '0.2em', color: ATok.ink3 }}>02 · BUILD · EMIT</div>
            <div style={{ fontFamily: ATok.mono, fontSize: 22, fontWeight: 600, color: ATok.ink0, marginTop: 4 }}>REVIEW & DOWNLOAD</div>

            <div style={{ marginTop: 20, border: `1px solid ${ATok.ink5}`, fontFamily: ATok.mono, fontSize: 10.5 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', padding: '8px 14px', background: ATok.ink7, color: ATok.ink3, fontSize: 9.5, letterSpacing: '0.12em', borderBottom: `1px solid ${ATok.ink5}` }}>
                <span>FILE</span><span style={{ textAlign: 'right' }}>SIZE</span>
              </div>
              {files.map((f, i) => (
                <div key={f[0]} style={{ display: 'grid', gridTemplateColumns: '1fr 80px', padding: '6px 14px', borderBottom: i < files.length - 1 ? `1px solid ${ATok.ink6}` : 'none', alignItems: 'center', background: i % 2 ? 'transparent' : '#fff' }}>
                  <span style={{ color: ATok.ink1 }}>{f[0]}</span><span style={{ color: ATok.ink3, textAlign: 'right' }}>{f[1]}</span>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', padding: '8px 14px', background: ATok.ink7, color: ATok.ink1, fontWeight: 600 }}>
                <span>TOTAL · github-readonly-2026-05-26.zip</span><span style={{ textAlign: 'right' }}>11.7 kB</span>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontFamily: ATok.mono, fontSize: 9.5, letterSpacing: '0.2em', color: ATok.ink3 }}>SETTINGS</div>

            <div style={{ marginTop: 14, fontFamily: ATok.mono, fontSize: 11, color: ATok.ink2, borderTop: `1px solid ${ATok.ink2}` }}>
              {[
                ['LANGUAGE',   <span><span style={{ color: ATok.ink0, fontWeight: 600 }}>TypeScript</span> &nbsp; <span style={{ color: ATok.ink4 }}>Python</span></span>],
                ['RUNTIME',    'Node 20 ESM'],
                ['TRANSPORTS', 'HTTP, stdio'],
                ['AUTH',       'Bearer · OAuth 2.1 (PKCE)'],
                ['LICENSE',    'MIT'],
                ['LINTER',     'eslint · @typescript-eslint'],
                ['FORMATTER',  'prettier 3.x'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', padding: '12px 0', borderBottom: `1px solid ${ATok.ink6}` }}>
                  <span style={{ color: ATok.ink3, fontSize: 10, letterSpacing: '0.14em' }}>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button style={{ fontFamily: ATok.mono, fontSize: 12, letterSpacing: '0.18em', padding: '14px 18px', border: 'none', background: ATok.ink0, color: '#fff', textAlign: 'left' }}>↓ DOWNLOAD .ZIP &nbsp;·&nbsp; 11.7 kB</button>
              <button style={{ fontFamily: ATok.mono, fontSize: 10, letterSpacing: '0.16em', padding: '10px 16px', border: `1px solid ${ATok.ink3}`, background: 'transparent', color: ATok.ink2, textAlign: 'left' }}>↓ COPY CURL · ONE-LINER RUN</button>
              <button style={{ fontFamily: ATok.mono, fontSize: 10, letterSpacing: '0.16em', padding: '10px 16px', border: `1px solid ${ATok.ink3}`, background: 'transparent', color: ATok.ink2, textAlign: 'left' }}>↓ DOCKERFILE</button>
            </div>

            <div style={{ marginTop: 18, padding: '12px 14px', background: '#fff', border: `1px solid ${ATok.ink5}`, fontFamily: ATok.mono, fontSize: 10.5, color: ATok.ink2, lineHeight: 1.6 }}>
              <span style={{ color: ATok.ink3 }}># after download</span><br />
              cd github-readonly && npm i<br />
              npm run dev <span style={{ color: ATok.ink3 }}># stdio</span><br />
              npm run dev:http <span style={{ color: ATok.ink3 }}># :3845</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────── 9. LEARN ──────────────────────────────────────────
function A_Learn() {
  return (
    <div style={{ width: '100%', height: '100%', background: ATok.paper, display: 'flex', flexDirection: 'column', fontFamily: ATok.font }}>
      <AStrip state="READ" endpoint="spec · draft-2026-v1" hint="§7.4 · Scopes" />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <ARail active="LEARN" />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '240px 1fr 280px', gap: 1, background: ATok.ink5, minHeight: 0 }}>
          {/* Spec tree */}
          <div style={{ background: ATok.paper, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${ATok.ink5}` }}>
              <input placeholder="⌘K  search spec…" style={{ width: '100%', padding: '7px 10px', fontFamily: ATok.mono, fontSize: 11, border: `1px solid ${ATok.ink4}`, background: '#fff', boxSizing: 'border-box' }} />
            </div>
            <div style={{ padding: '8px 0', fontFamily: ATok.mono, fontSize: 11 }}>
              {SPEC_TREE.map((s) => {
                const depth = s[0].split('.').length;
                const active = s[0] === '7.4';
                return (
                  <div key={s[0]} style={{ padding: `3px 14px 3px ${14 + (depth-1)*14}px`, color: active ? ATok.ink0 : ATok.ink2, background: active ? '#fff' : 'transparent', fontWeight: active ? 600 : 400, borderLeft: active ? `2px solid ${ATok.ink0}` : '2px solid transparent', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{s[1]}</span>
                    <span style={{ color: ATok.ink4, fontSize: 10 }}>§{s[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div style={{ background: ATok.paper, padding: '24px 32px', overflow: 'hidden' }}>
            <div style={{ fontFamily: ATok.mono, fontSize: 9.5, letterSpacing: '0.2em', color: ATok.ink3 }}>§7 AUTHORIZATION · §7.4</div>
            <div style={{ fontFamily: '"Newsreader", serif', fontSize: 34, color: ATok.ink0, marginTop: 4, lineHeight: 1.1 }}>Scopes</div>

            <div style={{ marginTop: 16, fontFamily: '"Newsreader", serif', fontSize: 15, lineHeight: 1.65, color: ATok.ink1 }}>
              <p style={{ margin: '0 0 12px' }}>A scope is a string declared by a tool, prompt, or resource and granted to a token. A server MUST treat scopes as authoritative: an unscoped operation MUST NOT be permitted, regardless of the token's identity.</p>
              <p style={{ margin: '0 0 12px' }}>Scopes form a flat namespace. Wildcards (<code style={{ fontFamily: ATok.mono, background: ATok.ink7, padding: '1px 4px' }}>"repo.*"</code>) MAY be granted but MUST NOT be inferred.</p>
              <p style={{ margin: '0 0 12px' }}>A server MUST reject any tool invocation whose required scope is not present in the bearer token. The rejection MUST use error code <code style={{ fontFamily: ATok.mono, background: ATok.ink7, padding: '1px 4px' }}>-32002</code> and MUST NOT execute the tool.</p>
            </div>

            <div style={{ marginTop: 14, fontFamily: ATok.mono, fontSize: 9.5, letterSpacing: '0.16em', color: ATok.ink3 }}>EXAMPLE</div>
            <pre style={{ marginTop: 6, padding: '14px 16px', background: ATok.ink1, color: ATok.ink6, fontFamily: ATok.mono, fontSize: 11, lineHeight: 1.6 }}>{`{
  "error": {
    "code": -32002,
    "message": "insufficient_scope",
    "data": { "required": ["write"], "granted": ["read"] }
  }
}`}</pre>
          </div>

          {/* Right rail: related */}
          <div style={{ background: ATok.paper, padding: '20px 18px', overflow: 'hidden' }}>
            <div style={{ fontFamily: ATok.mono, fontSize: 9.5, letterSpacing: '0.18em', color: ATok.ink3 }}>RELATED CHECKS</div>
            <div style={{ marginTop: 8, fontFamily: ATok.mono, fontSize: 10.5 }}>
              <div style={{ padding: '8px 0', borderBottom: `1px solid ${ATok.ink6}`, color: ATok.ink1 }}>auth.bearer-token.scope-validation</div>
              <div style={{ padding: '8px 0', borderBottom: `1px solid ${ATok.ink6}`, color: ATok.ink1 }}>auth.bearer-token.expiry-check</div>
              <div style={{ padding: '8px 0', borderBottom: `1px solid ${ATok.ink6}`, color: ATok.ink1 }}>auth.error.no-token-leak</div>
            </div>

            <div style={{ marginTop: 18, fontFamily: ATok.mono, fontSize: 9.5, letterSpacing: '0.18em', color: ATok.ink3 }}>SECTIONS YOU MIGHT NEED</div>
            <div style={{ marginTop: 8, fontFamily: ATok.mono, fontSize: 10.5 }}>
              <div style={{ padding: '6px 0', color: ATok.ink2 }}>§7.3  OAuth 2.1</div>
              <div style={{ padding: '6px 0', color: ATok.ink2 }}>§7.5  PKCE Requirements</div>
              <div style={{ padding: '6px 0', color: ATok.ink2 }}>§10   Error Codes</div>
            </div>

            <div style={{ marginTop: 22, padding: '12px 12px', background: '#fff', border: `1px solid ${ATok.ink5}`, fontFamily: ATok.mono, fontSize: 10.5, color: ATok.ink2 }}>
              <div style={{ color: ATok.ink3, fontSize: 9.5, letterSpacing: '0.14em' }}>YOUR LAST SCAN</div>
              <div style={{ color: ATok.ink0, fontWeight: 600, marginTop: 4 }}>SCN-0142 · B+</div>
              <div style={{ color: ATok.ink2, marginTop: 4 }}>fails 2 checks in §7.4</div>
              <button style={{ marginTop: 8, width: '100%', fontFamily: ATok.mono, fontSize: 10, letterSpacing: '0.14em', padding: '7px 10px', border: `1px solid ${ATok.ink0}`, background: ATok.ink0, color: '#fff' }}>← BACK TO REPORT</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────── 10. EMPTY / ERROR STATES ─────────────────────────
function A_States() {
  return (
    <div style={{ width: '100%', height: '100%', background: ATok.paper, display: 'flex', flexDirection: 'column', fontFamily: ATok.font, color: ATok.ink0 }}>
      <AStrip state="FRESH" endpoint="—" hint="first run · no scans" />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: ATok.ink5 }}>
        {/* Empty state */}
        <div style={{ background: ATok.paper, padding: '40px 36px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: ATok.mono, fontSize: 9.5, letterSpacing: '0.2em', color: ATok.ink3 }}>EMPTY · FIRST RUN</div>
          <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
            <div style={{ fontFamily: ATok.mono, fontSize: 9.5, letterSpacing: '0.18em', color: ATok.ink3 }}>NO SCANS · LOCALSTORAGE EMPTY</div>
            <div style={{ fontFamily: ATok.mono, fontSize: 38, fontWeight: 700, color: ATok.ink0, marginTop: 8, lineHeight: 1 }}>POINT AT A SERVER.</div>
            <div style={{ fontFamily: ATok.mono, fontSize: 12, color: ATok.ink2, marginTop: 12, lineHeight: 1.6, maxWidth: 360 }}>
              ARGUS runs 243 checks against your MCP server and grades the result. It runs in this browser tab. Nothing is uploaded.
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
              <input placeholder="ws:// http:// stdio://" style={{ flex: 1, padding: '12px 14px', fontFamily: ATok.mono, fontSize: 13, border: `1px solid ${ATok.ink2}`, background: '#fff', boxSizing: 'border-box' }} />
              <button style={{ fontFamily: ATok.mono, fontSize: 11, letterSpacing: '0.16em', padding: '12px 18px', border: 'none', background: ATok.ink0, color: '#fff' }}>SCAN ↵</button>
            </div>
            <div style={{ fontFamily: ATok.mono, fontSize: 10, color: ATok.ink3, marginTop: 10 }}>
              or try the bundled example: <span style={{ color: ATok.ink1 }}>example://everything-server</span>
            </div>
          </div>
        </div>

        {/* Error state */}
        <div style={{ background: ATok.paper, padding: '40px 36px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: ATok.mono, fontSize: 9.5, letterSpacing: '0.2em', color: ATok.ink3 }}>ERROR · SCAN ABORTED</div>
          <div style={{ marginTop: 24 }}>
            <div style={{ fontFamily: ATok.mono, fontSize: 9, letterSpacing: '0.18em', color: ATok.ink3 }}>SCN-0143 · 14:31</div>
            <div style={{ fontFamily: ATok.mono, fontSize: 26, fontWeight: 600, color: ATok.ink0, marginTop: 4, letterSpacing: '0.02em' }}>UNREACHABLE</div>
            <div style={{ fontFamily: ATok.mono, fontSize: 11.5, color: ATok.ink2, marginTop: 14, lineHeight: 1.6 }}>
              <div><span style={{ color: ATok.ink3 }}>endpoint  </span> localhost:3845/mcp</div>
              <div><span style={{ color: ATok.ink3 }}>transport </span> HTTP+SSE</div>
              <div><span style={{ color: ATok.ink3 }}>cause     </span> ECONNREFUSED · no listener on 3845</div>
              <div><span style={{ color: ATok.ink3 }}>attempted </span> 3 of 3 retries (back-off 100/400/1600ms)</div>
            </div>

            <div style={{ marginTop: 22, fontFamily: ATok.mono, fontSize: 9.5, letterSpacing: '0.16em', color: ATok.ink3 }}>WHAT NOW</div>
            <div style={{ marginTop: 6, fontFamily: ATok.mono, fontSize: 11, color: ATok.ink1, lineHeight: 1.7 }}>
              ▸ confirm your server is running on the listed port<br />
              ▸ check transport — your server may speak stdio only<br />
              ▸ re-scan with —debug to capture the handshake
            </div>

            <div style={{ marginTop: 22, display: 'flex', gap: 8 }}>
              <button style={{ fontFamily: ATok.mono, fontSize: 11, letterSpacing: '0.16em', padding: '10px 16px', border: 'none', background: ATok.ink0, color: '#fff' }}>RETRY ↵</button>
              <button style={{ fontFamily: ATok.mono, fontSize: 11, letterSpacing: '0.16em', padding: '10px 16px', border: `1px solid ${ATok.ink3}`, background: 'transparent', color: ATok.ink2 }}>EDIT ENDPOINT</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────── 11. RATIONALE ─────────────────────────────────────
function A_Rationale() {
  return (
    <Rationale
      accent={ATok.accent}
      title="An instrument, not a dashboard."
      body={
        <span>
          Argus is the device an engineer points at their MCP server when they
          want a verdict. So the entire app reads like an instrument: a
          persistent status strip showing what state the system is in, a single
          monospace voice across every screen, a single signal colour
          (<b>amber</b>) reserved for live or live-ish things — running scans,
          unsaved drafts, "this is the data point you should look at". Failures
          are not red; failures are <b>ink-black and louder than everything
          else</b>. The grade reveal is the only screen that breaks the rules:
          oversized tabular numeral, dark plate, the amber turned up to make B+
          feel earned. Everything else is bone, ink, and rule.
        </span>
      }
      optimized="Calmness under load. The live scan should feel like a heart monitor — busy but unworried. Tabular numerals everywhere so values never jiggle as they update."
      rejected="Crosshair-and-eye iconography. Scan-progress doughnut charts. Any colour that isn't amber, ink, or paper. 'Modern' soft shadows."
    />
  );
}

Object.assign(window, {
  A_Brand, A_Home, A_TestInput, A_Scanning, A_Results, A_Drill,
  A_BuildCanvas, A_BuildGen, A_Learn, A_States, A_Rationale,
});
