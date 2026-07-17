// Direction C — Lattice
// POV: the 243 checks are the product. Show them. Not in a chart, not
// in a card — as themselves, in a 19-row lattice. Every screen has the
// lattice in it somewhere. Geometric sans (Inter) + mono. One accent:
// signal green, for affirmative state only.

const CTok = {
  sans: '"Inter", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
  green: '#2bf07f',           // phosphor — the only color
  greenSoft: '#0e3a23',
  paper: '#070d15',           // deep navy-black (observatory dome)
  ink0: '#e8eef7',
  ink1: '#c2cad6',
  ink2: '#828b97',
  ink3: '#525a66',
  ink4: '#3a414c',
  ink5: '#1f2531',            // hairline
  ink6: '#141a25',
  ink7: '#0e131c',
  surface1: '#0d141e',        // elevated card
  surface2: '#141d28',        // raised
  glow: 'rgba(43,240,127,0.5)',
};

// Generate a deterministic pattern for the lattice cells per category.
// Index 0..total-1 → state: 'pass' | 'fail' | 'skip'
function cellsFor(category, total, fail) {
  // Spread failures across category, leave 1 skip at end on a couple
  const states = Array(total).fill('pass');
  // place failures pseudo-randomly but stable
  let seed = category.length * 31;
  const used = new Set();
  let placed = 0;
  while (placed < fail) {
    seed = (seed * 9301 + 49297) % 233280;
    const idx = seed % total;
    if (!used.has(idx)) { used.add(idx); states[idx] = 'fail'; placed++; }
  }
  return states;
}

// ─── Shell ───────────────────────────────────────────────────
function CTopBar({ tab = 'TEST' }) {
  return (
    <div style={{
      height: 44, background: CTok.paper, borderBottom: `1px solid ${CTok.ink5}`,
      display: 'flex', alignItems: 'stretch', fontFamily: CTok.sans, flexShrink: 0,
    }}>
      {/* Brand block */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', gap: 10, borderRight: `1px solid ${CTok.ink5}` }}>
        <svg width="22" height="22" viewBox="0 0 22 22">
          {[0,1,2,3].map(r => [0,1,2,3].map(c => (
            <rect key={`${r}${c}`} x={r*5+1} y={c*5+1} width="3" height="3" fill={(r+c) % 2 === 0 ? CTok.ink0 : CTok.ink5} />
          )))}
        </svg>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', color: CTok.ink0 }}>argus</span>
        <span style={{ fontFamily: CTok.mono, fontSize: 10, color: CTok.ink3, marginLeft: 4 }}>v0.4.1</span>
      </div>
      {/* Tabs */}
      {['TEST', 'BUILD', 'LEARN'].map((t) => (
        <div key={t} style={{
          padding: '0 22px', display: 'flex', alignItems: 'center',
          fontSize: 12.5, fontWeight: 600, letterSpacing: '0.05em',
          color: t === tab ? CTok.ink0 : CTok.ink3,
          borderBottom: t === tab ? `2px solid ${CTok.ink0}` : '2px solid transparent',
          marginBottom: -1,
        }}>{t.toLowerCase()}</div>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', gap: 18, fontFamily: CTok.mono, fontSize: 11, color: CTok.ink3 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <LiveDot color={CTok.green} size={6} dur="1.5s" />
          <span style={{ color: CTok.ink1 }}>ready</span>
        </span>
        <span style={{ width: 1, height: 14, background: CTok.ink5 }} />
        <span>⌘K  search 243 checks</span>
        <span style={{ width: 1, height: 14, background: CTok.ink5 }} />
        <span>{SCAN_HISTORY.length} scans · {BUILDS.length} builds</span>
      </div>
    </div>
  );
}

// The lattice cell unit
function Cell({ state, dim, size = 12, gap = 2, animate = false }) {
  const base = {
    width: size, height: size, flexShrink: 0,
  };
  if (state === 'pass') return <div style={{
    ...base, background: CTok.green, opacity: dim ? 0.18 : 1,
    boxShadow: dim ? 'none' : `0 0 ${size * 0.7}px ${CTok.green}55`,
    animation: animate ? 'argus-pop 360ms ease-out both' : undefined,
  }} />;
  if (state === 'fail') return <div style={{
    ...base, background: CTok.ink0, opacity: dim ? 0.3 : 1,
    boxShadow: dim ? 'none' : `0 0 ${size}px ${CTok.ink0}aa, inset 0 0 0 1px ${CTok.ink0}`,
  }} />;
  if (state === 'skip') return <div style={{ ...base, background: 'transparent', border: `1px solid ${CTok.ink4}`, boxSizing: 'border-box' }} />;
  if (state === 'run')  return <div style={{
    ...base, background: CTok.green, opacity: 0.9,
    animation: 'argus-pulse 0.7s ease-in-out infinite',
    boxShadow: `0 0 ${size * 1.2}px ${CTok.green}`,
  }} />;
  if (state === 'pending') return <div style={{ ...base, background: CTok.ink5 }} />;
  return <div style={{ ...base, background: CTok.ink5 }} />;
}

// Render a whole 19-row lattice — total width tries to fit
function Lattice({ width = 760, cellSize = 12, gap = 2, dim = false, override = null, scanProgress = null }) {
  // We have 243 total. Compute per-row layout — fit per row at given width.
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: CTok.mono, fontSize: 10 }}>
      {CATEGORIES.map(([name, total, fail], rowIdx) => {
        const states = cellsFor(name, total, fail);
        // optional override per-row state (e.g. running, pending)
        return (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, color: CTok.ink2 }}>
            <span style={{ width: 96, fontSize: 10.5, color: CTok.ink2, letterSpacing: '0.04em', textAlign: 'right', flexShrink: 0 }}>{name}</span>
            <span style={{ display: 'flex', gap }}>
              {states.map((s, i) => {
                let actual = s;
                if (override) actual = override(rowIdx, i, s, total);
                if (scanProgress) actual = scanProgress(rowIdx, i, s);
                return <Cell key={i} state={actual} dim={dim} size={cellSize} />;
              })}
            </span>
            <span style={{ fontSize: 10, color: CTok.ink4, marginLeft: 6, flexShrink: 0 }}>{total - fail}/{total}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Rationale ────────────────────────────────────────────────
function C_Rationale() {
  return (
    <Rationale
      accent={CTok.green}
      title="Show the work."
      body={
        <span>
          The 243 checks aren't a number — they're the artifact. Every screen
          in this direction shows them as themselves: a 19-row lattice where
          each cell is a real check. The grade is a summary statistic; the
          lattice <i>is</i> the report. During a scan, the lattice fills in
          left-to-right, top-to-bottom; on the results page, the same lattice
          is the navigation; on Build, the same grid metaphor returns as
          tool/prompt/resource slots. <b>Green is the only colour</b>, and it
          means <i>this passed</i>. Failure is the absence of green: solid ink.
        </span>
      }
      optimized="Density without anxiety. Engineers should be able to count their failures by glancing at the lattice."
      rejected="Doughnut charts. Radial progress. Soft pastel pass/fail colours. Anything that hides the underlying data."
    />
  );
}

// ─── Brand ────────────────────────────────────────────────────
function C_Brand() {
  return (
    <div style={{ width: '100%', height: '100%', background: CTok.paper, fontFamily: CTok.sans, color: CTok.ink0, padding: 40, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.2em', color: CTok.ink3 }}>DIRECTION C · LATTICE · WORDMARK + SYMBOL</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        {/* Big mark: 6x6 lattice forming A */}
        <svg width="100" height="100" viewBox="0 0 100 100">
          {Array.from({length: 6}).map((_, r) =>
            Array.from({length: 6}).map((_, c) => {
              // A-shape: define which cells are filled
              const A = [
                [0,0,1,1,0,0],
                [0,1,0,0,1,0],
                [0,1,0,0,1,0],
                [1,1,1,1,1,1],
                [1,0,0,0,0,1],
                [1,0,0,0,0,1],
              ];
              const filled = A[r][c];
              return <rect key={`${r}${c}`} x={c*16+2} y={r*16+2} width="12" height="12" fill={filled ? CTok.ink0 : CTok.ink6} />;
            })
          )}
        </svg>
        <div>
          <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 0.9, color: CTok.ink0 }}>argus</div>
          <div style={{ fontFamily: CTok.mono, fontSize: 11, letterSpacing: '0.18em', color: CTok.ink3, marginTop: 4 }}>243 CHECKS · 19 CATEGORIES</div>
        </div>
      </div>

      <div>
        <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.16em', color: CTok.ink3 }}>SYSTEM</div>
        <div style={{ marginTop: 8, display: 'flex', gap: 14, alignItems: 'center' }}>
          <Cell state="pass" size={20} /> <span style={{ fontFamily: CTok.mono, fontSize: 11, color: CTok.ink2 }}>pass</span>
          <Cell state="fail" size={20} /> <span style={{ fontFamily: CTok.mono, fontSize: 11, color: CTok.ink2 }}>fail</span>
          <Cell state="skip" size={20} /> <span style={{ fontFamily: CTok.mono, fontSize: 11, color: CTok.ink2 }}>skip</span>
          <Cell state="run" size={20} /> <span style={{ fontFamily: CTok.mono, fontSize: 11, color: CTok.ink2 }}>running</span>
          <Cell state="pending" size={20} /> <span style={{ fontFamily: CTok.mono, fontSize: 11, color: CTok.ink2 }}>pending</span>
        </div>
      </div>

      <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, fontFamily: CTok.mono, fontSize: 11, color: CTok.ink2 }}>
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: '0.18em', color: CTok.ink3 }}>TYPE</div>
          <div style={{ fontSize: 14, color: CTok.ink0, fontFamily: CTok.sans, fontWeight: 700, marginTop: 4 }}>Inter — Display · 700/800</div>
          <div style={{ fontFamily: CTok.sans }}>Inter — Body · 400/600</div>
          <div>JetBrains Mono — Data</div>
        </div>
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: '0.18em', color: CTok.ink3 }}>GRID</div>
          <div>cell · 12px</div>
          <div>gap  · 2px</div>
          <div>row  · 16px stride</div>
        </div>
      </div>
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────
function C_Home() {
  return (
    <div style={{ width: '100%', height: '100%', background: CTok.paper, display: 'flex', flexDirection: 'column' }}>
      <CTopBar tab="" />
      <div style={{ flex: 1, padding: '28px 40px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 36, minHeight: 0, overflow: 'hidden' }}>
        <div>
          <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.2em', color: CTok.ink3 }}>LAST SCAN · 3 DAYS AGO</div>
          <div style={{ fontFamily: CTok.sans, fontSize: 56, fontWeight: 800, color: CTok.ink0, letterSpacing: '-0.03em', lineHeight: 0.95, marginTop: 4 }}>
            229<span style={{ color: CTok.ink4 }}>/243</span>
          </div>
          <div style={{ fontSize: 14, color: CTok.ink2, marginTop: 8 }}>localhost:3845/mcp · SCN-0142 · B+</div>

          {/* mini lattice preview */}
          <div style={{ marginTop: 22, padding: '20px 22px', background: CTok.surface1, border: `1px solid ${CTok.ink5}` }}>
            <Lattice cellSize={10} dim={false} />
          </div>

          <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
            <button style={{ fontFamily: CTok.sans, fontSize: 14, fontWeight: 600, padding: '10px 20px', background: CTok.green, color: CTok.surface1, border: 'none' }}>Run again ↵</button>
            <button style={{ fontFamily: CTok.sans, fontSize: 14, fontWeight: 500, padding: '10px 20px', background: CTok.surface1, color: CTok.ink1, border: `1px solid ${CTok.ink4}` }}>New endpoint</button>
            <button style={{ fontFamily: CTok.sans, fontSize: 14, fontWeight: 500, padding: '10px 20px', background: CTok.surface1, color: CTok.ink1, border: `1px solid ${CTok.ink4}` }}>Open SCN-0142</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.2em', color: CTok.ink3 }}>HISTORY · 7 SCANS</div>
          <div style={{ marginTop: 10, fontFamily: CTok.mono, fontSize: 11.5, borderTop: `1px solid ${CTok.ink5}`, overflow: 'hidden' }}>
            {SCAN_HISTORY.map((s, i) => (
              <div key={s[0]} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 70px 38px 50px', padding: '9px 0', borderBottom: `1px solid ${CTok.ink6}`, alignItems: 'center', gap: 8 }}>
                <span style={{ color: CTok.ink2 }}>{s[0].slice(4)}</span>
                <span style={{ color: CTok.ink1 }}>{s[2].length > 22 ? s[2].slice(0,20)+'…' : s[2]}</span>
                <span style={{ color: CTok.ink3 }}>{s[1].slice(5,10)}</span>
                <span style={{ color: CTok.ink0, fontWeight: 700 }}>{s[5]}</span>
                <span style={{ color: CTok.ink2 }}>{s[6]}/243</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.2em', color: CTok.ink3 }}>BUILDS · 4 LOCAL</div>
          <div style={{ marginTop: 10, fontFamily: CTok.mono, fontSize: 11.5, borderTop: `1px solid ${CTok.ink5}` }}>
            {BUILDS.map((b) => (
              <div key={b[0]} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px', padding: '8px 0', borderBottom: `1px solid ${CTok.ink6}`, alignItems: 'center' }}>
                <span style={{ color: CTok.ink0 }}>{b[0]} <span style={{ color: CTok.ink3 }}>{b[1].toLowerCase().slice(0,2)}</span></span>
                <span style={{ color: CTok.ink2 }}>{b[2]}·{b[3]}·{b[4]}</span>
                <span style={{ color: CTok.ink3, textAlign: 'right' }}>{b[5]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Test · Input ─────────────────────────────────────────────
function C_TestInput() {
  return (
    <div style={{ width: '100%', height: '100%', background: CTok.paper, display: 'flex', flexDirection: 'column' }}>
      <CTopBar tab="TEST" />
      <div style={{ flex: 1, padding: '32px 40px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 36, minHeight: 0 }}>

        <div>
          <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.2em', color: CTok.ink3 }}>NEW SCAN</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: CTok.ink0, letterSpacing: '-0.02em', marginTop: 4 }}>Point at a server.</div>

          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 220px', gap: 0, border: `1px solid ${CTok.ink2}`, background: CTok.surface1 }}>
            <input defaultValue="localhost:3845/mcp" style={{ padding: '18px 20px', fontFamily: CTok.mono, fontSize: 17, border: 'none', outline: 'none', background: CTok.surface1 }} />
            <button style={{ background: CTok.green, color: CTok.surface1, fontFamily: CTok.sans, fontSize: 15, fontWeight: 600, border: 'none' }}>Run scan ↵</button>
          </div>

          <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, fontFamily: CTok.sans, fontSize: 13 }}>
            {[
              ['transport', 'HTTP + SSE',  ['HTTP+SSE', 'stdio', 'WS']],
              ['auth',      'Bearer …2c8a', ['none', 'Bearer', 'OAuth 2.1']],
              ['parallelism','8 in-flight', ['1','4','8','16']],
              ['timeout',   '2000 ms',     ['500', '2000', '5000']],
              ['profile',   'draft-2026-v1', ['locked']],
              ['categories','all 19',        ['all 19', 'custom']],
            ].map(([k, v, opts]) => (
              <div key={k}>
                <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.14em', color: CTok.ink3 }}>{k.toUpperCase()}</div>
                <div style={{ marginTop: 4, fontSize: 14, color: CTok.ink0, fontWeight: 600 }}>{v}</div>
                <div style={{ marginTop: 4, display: 'flex', gap: 4 }}>
                  {opts.map((o, i) => (
                    <span key={o} style={{ fontFamily: CTok.mono, fontSize: 10.5, padding: '4px 8px', border: `1px solid ${CTok.ink5}`, color: i === 0 ? CTok.ink0 : CTok.ink3, background: i === 0 ? CTok.ink7 : 'transparent', fontWeight: i===0?600:400 }}>{o}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: CTok.surface1, border: `1px solid ${CTok.ink5}`, padding: '18px 18px' }}>
          <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.2em', color: CTok.ink3 }}>WHAT WILL BE CHECKED</div>
          <div style={{ marginTop: 8, fontFamily: CTok.mono, fontSize: 11, color: CTok.ink1, lineHeight: 1.85 }}>
            {CATEGORIES.slice(0, 12).map(([n, t]) => (
              <div key={n} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{n}</span><span style={{ color: CTok.ink3 }}>{t}</span>
              </div>
            ))}
            <div style={{ color: CTok.ink3, marginTop: 4 }}>+ 7 more</div>
          </div>
          <div style={{ marginTop: 14, padding: '10px 12px', background: CTok.ink7, fontFamily: CTok.mono, fontSize: 11, color: CTok.ink1, lineHeight: 1.55 }}>
            243 checks · ~28 s · all local
          </div>

          <div style={{ marginTop: 14, fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.2em', color: CTok.ink3 }}>PRE-FLIGHT</div>
          <div style={{ marginTop: 6, fontFamily: CTok.mono, fontSize: 11, color: CTok.ink2, lineHeight: 1.7 }}>
            <span style={{ color: CTok.green }}>● </span>handshake 12 ms<br />
            <span style={{ color: CTok.green }}>● </span>ping 4 ms<br />
            <span style={{ color: CTok.green }}>● </span>tools/list · 14 tools
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Test · Scanning ★ ────────────────────────────────────────
function C_Scanning() {
  // 107/243 complete — gradually fill the lattice
  const progress = (rowIdx, cellIdx, baseState) => {
    // Fill first 7 categories entirely, eighth at ~50%, rest pending
    if (rowIdx < 7) return baseState;
    if (rowIdx === 7) return cellIdx < 9 ? baseState : cellIdx === 9 ? 'run' : 'pending';
    return 'pending';
  };
  return (
    <div style={{ width: '100%', height: '100%', background: CTok.paper, display: 'flex', flexDirection: 'column' }}>
      <CTopBar tab="TEST" />
      <div style={{ padding: '14px 40px 10px', display: 'flex', alignItems: 'baseline', gap: 24, borderBottom: `1px solid ${CTok.ink5}` }}>
        <span style={{ fontFamily: CTok.mono, fontSize: 11, color: CTok.ink3 }}>SCN-0142 · localhost:3845/mcp · HTTP+SSE</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: CTok.mono, fontSize: 11, color: CTok.ink3 }}>elapsed 12.4s · eta 16s · 8.6 chk/s</span>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', minHeight: 0 }}>

        <div style={{ padding: '20px 40px 22px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Counters */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 32 }}>
            <div>
              <div style={{ fontFamily: CTok.mono, fontSize: 9.5, letterSpacing: '0.18em', color: CTok.ink3 }}>RUN</div>
              <div style={{ fontSize: 58, fontWeight: 800, color: CTok.ink0, letterSpacing: '-0.03em', lineHeight: 0.9, fontVariantNumeric: 'tabular-nums' }}>107<span style={{ color: CTok.ink4 }}>/243</span></div>
            </div>
            <div>
              <div style={{ fontFamily: CTok.mono, fontSize: 9.5, letterSpacing: '0.18em', color: CTok.ink3 }}>PASS</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: CTok.green, fontVariantNumeric: 'tabular-nums' }}>94</div>
            </div>
            <div>
              <div style={{ fontFamily: CTok.mono, fontSize: 9.5, letterSpacing: '0.18em', color: CTok.ink3 }}>FAIL</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: CTok.ink0, fontVariantNumeric: 'tabular-nums' }}>13</div>
            </div>
            <div>
              <div style={{ fontFamily: CTok.mono, fontSize: 9.5, letterSpacing: '0.18em', color: CTok.ink3 }}>CURRENT</div>
              <div style={{ fontFamily: CTok.mono, fontSize: 12, color: CTok.ink1, fontWeight: 600 }}>auth.session.rotation-on-privilege-change</div>
              <div style={{ fontFamily: CTok.mono, fontSize: 10, color: CTok.ink3 }}>§7.6.2 · waiting 1.8s</div>
            </div>
          </div>

          <div style={{ marginTop: 22, flex: 1, padding: '20px 22px', background: CTok.surface1, border: `1px solid ${CTok.ink5}`, overflow: 'auto' }}>
            <Lattice scanProgress={progress} cellSize={14} />
          </div>
        </div>

        {/* Right rail: log */}
        <div style={{ background: CTok.surface1, borderLeft: `1px solid ${CTok.ink5}`, padding: '18px 20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.2em', color: CTok.ink3 }}>STREAM</div>
          <div style={{ marginTop: 8, fontFamily: CTok.mono, fontSize: 10.5, color: CTok.ink2, flex: 1, overflow: 'hidden', lineHeight: 1.55 }}>
            {[
              ['11.391', 'auth.session.timeout', 'FAIL'],
              ['11.382', 'auth.oauth.state.csrf', 'FAIL'],
              ['11.373', 'auth.oauth.refresh-rotation', 'FAIL'],
              ['11.364', 'auth.oauth.pkce.s256-only', 'FAIL'],
              ['11.356', 'auth.bearer-token.expiry-check', 'FAIL'],
              ['11.348', 'auth.bearer-token.scope-validation', 'FAIL'],
              ['11.337', 'lifecycle.shutdown.in-flight-requests', 'FAIL'],
              ['11.326', 'lifecycle.shutdown.graceful', 'pass'],
              ['11.318', 'lifecycle.initialized.notification', 'pass'],
              ['11.310', 'lifecycle.initialize.capabilities.symmetric', 'pass'],
              ['11.298', 'lifecycle.initialize.protocol-version', 'pass'],
              ['11.289', 'jsonrpc.error.reserved-codes', 'pass'],
              ['11.281', 'jsonrpc.notification.no-response', 'pass'],
              ['11.274', 'jsonrpc.request.id.uniqueness', 'pass'],
              ['11.266', 'jsonrpc.batch.empty-array-rejected', 'pass'],
              ['11.257', 'jsonrpc.batch.partial-response', 'FAIL'],
            ].map((l, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 40px', gap: 6 }}>
                <span style={{ color: CTok.ink4 }}>{l[0]}</span>
                <span style={{ color: l[2]==='FAIL' ? CTok.ink0 : CTok.ink2, fontWeight: l[2]==='FAIL'?600:400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l[1]}</span>
                <span style={{ color: l[2]==='FAIL' ? CTok.ink0 : CTok.green, textAlign: 'right', fontWeight: 600 }}>{l[2]==='FAIL' ? 'FAIL' : '●'}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button style={{ flex: 1, fontFamily: CTok.sans, fontSize: 12.5, fontWeight: 600, padding: '8px 0', background: CTok.surface1, color: CTok.ink1, border: `1px solid ${CTok.ink3}` }}>Pause</button>
            <button style={{ flex: 1, fontFamily: CTok.sans, fontSize: 12.5, fontWeight: 600, padding: '8px 0', background: CTok.surface1, color: CTok.ink0, border: `1px solid ${CTok.ink0}` }}>Abort</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Results ★ ────────────────────────────────────────────────
function C_Results() {
  return (
    <div style={{ width: '100%', height: '100%', background: CTok.paper, display: 'flex', flexDirection: 'column' }}>
      <CTopBar tab="TEST" />
      <div style={{ padding: '14px 40px 10px', display: 'flex', alignItems: 'baseline', gap: 24, borderBottom: `1px solid ${CTok.ink5}` }}>
        <span style={{ fontFamily: CTok.mono, fontSize: 11, color: CTok.ink3 }}>SCN-0142 · 14:08:39 · localhost:3845/mcp · HTTP+SSE · 28.4s</span>
        <span style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ fontFamily: CTok.sans, fontSize: 12.5, padding: '6px 12px', background: CTok.surface1, color: CTok.ink1, border: `1px solid ${CTok.ink3}` }}>↓ html</button>
          <button style={{ fontFamily: CTok.sans, fontSize: 12.5, padding: '6px 12px', background: CTok.surface1, color: CTok.ink1, border: `1px solid ${CTok.ink3}` }}>↓ json</button>
          <button style={{ fontFamily: CTok.sans, fontSize: 12.5, padding: '6px 12px', background: CTok.surface1, color: CTok.ink1, border: `1px solid ${CTok.ink3}` }}>↓ md</button>
          <button style={{ fontFamily: CTok.sans, fontSize: 12.5, fontWeight: 600, padding: '6px 14px', background: CTok.green, color: CTok.surface1, border: 'none' }}>Re-scan ↵</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: 0 }}>
        {/* Grade panel */}
        <div style={{ padding: '28px 28px', borderRight: `1px solid ${CTok.ink5}`, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          {/* phosphor halo */}
          <div style={{
            position: 'absolute', top: 40, left: -50, width: 360, height: 360,
            background: `radial-gradient(circle, ${CTok.green}33 0%, transparent 58%)`,
            pointerEvents: 'none', animation: 'argus-breathe 4.5s ease-in-out infinite',
          }} />
          <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.2em', color: CTok.ink3, position: 'relative', zIndex: 1 }}>GRADE</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4, position: 'relative', zIndex: 1 }}>
            <div style={{
              fontFamily: CTok.sans, fontSize: 184, fontWeight: 800, color: CTok.green,
              letterSpacing: '-0.07em', lineHeight: 0.78,
              ['--g']: CTok.glow, animation: 'argus-glow 4.5s ease-in-out infinite',
            }}>B+</div>
          </div>
          <div style={{ fontFamily: CTok.sans, fontSize: 24, fontWeight: 700, color: CTok.ink0, marginTop: 4 }}>229<span style={{ color: CTok.ink4 }}>/243</span></div>
          <div style={{ fontSize: 12, color: CTok.ink2, marginTop: 4 }}>↑ <span style={{ color: CTok.green, fontWeight: 600 }}>+8 from SCN-0141 (B)</span></div>

          {/* Severity totals */}
          <div style={{ marginTop: 22, fontFamily: CTok.mono, fontSize: 11, color: CTok.ink1, borderTop: `1px solid ${CTok.ink5}`, paddingTop: 14, lineHeight: 1.95 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: CTok.green, fontWeight: 600 }}>● pass</span><span>229</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: CTok.ink3 }}>fail · critical</span><span>3</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: CTok.ink3 }}>fail · major</span><span>9</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: CTok.ink3 }}>fail · minor</span><span>2</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: CTok.ink3 }}>skip</span><span>0</span></div>
          </div>

          <div style={{ marginTop: 'auto', fontFamily: CTok.mono, fontSize: 10.5, color: CTok.ink3, lineHeight: 1.6 }}>
            click any failed cell in the lattice to drill in →
          </div>
        </div>

        {/* The lattice as the report itself */}
        <div style={{ padding: '20px 26px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.2em', color: CTok.ink3 }}>LATTICE · 19 × N</div>
            <div style={{ fontFamily: CTok.mono, fontSize: 11, color: CTok.ink3 }}>
              <Cell state="pass" size={10} /> <span style={{ verticalAlign: 'middle' }}> &nbsp;pass &nbsp;</span>
              <Cell state="fail" size={10} /> <span style={{ verticalAlign: 'middle' }}> &nbsp;fail</span>
            </div>
          </div>
          <div style={{ flex: 1, marginTop: 14, padding: '18px 22px', background: CTok.surface1, border: `1px solid ${CTok.ink5}`, overflow: 'auto' }}>
            <Lattice cellSize={16} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Drill-in ★ ───────────────────────────────────────────────
function C_Drill() {
  // single row: Auth, expanded
  const authStates = cellsFor('Authorization', 18, 8);
  return (
    <div style={{ width: '100%', height: '100%', background: CTok.paper, display: 'flex', flexDirection: 'column' }}>
      <CTopBar tab="TEST" />
      <div style={{ padding: '14px 40px 10px', display: 'flex', alignItems: 'baseline', gap: 24, borderBottom: `1px solid ${CTok.ink5}` }}>
        <span style={{ fontFamily: CTok.mono, fontSize: 11, color: CTok.ink3 }}>SCN-0142 · Authorization · 8 failures of 18</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: CTok.mono, fontSize: 11, color: CTok.ink3 }}>↑↓ row · ←→ cell · ⌘C copy fix</span>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 0 }}>
        {/* Left: row map + cell list */}
        <div style={{ padding: '22px 28px', borderRight: `1px solid ${CTok.ink5}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Row strip */}
          <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.2em', color: CTok.ink3 }}>CATEGORY · 04 AUTHORIZATION</div>
          <div style={{ marginTop: 12, padding: '20px 24px', background: CTok.surface1, border: `1px solid ${CTok.ink5}` }}>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {authStates.map((s, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <Cell state={s} size={28} gap={2} />
                  {i === 0 && (
                    <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', fontFamily: CTok.mono, fontSize: 9, color: CTok.ink2, whiteSpace: 'nowrap' }}>↓</div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontFamily: CTok.mono, fontSize: 10.5, color: CTok.ink3 }}>cell 01 of 18 · auth.bearer-token.scope-validation</div>
          </div>

          {/* Cell list */}
          <div style={{ marginTop: 18, fontFamily: CTok.mono, fontSize: 11, color: CTok.ink1, flex: 1, overflow: 'hidden' }}>
            <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.2em', color: CTok.ink3 }}>FAILED CELLS · 8</div>
            <div style={{ marginTop: 8, borderTop: `1px solid ${CTok.ink5}` }}>
              {CHECKS.Auth.filter(c => c[1] === 'fail').map((c, i) => (
                <div key={c[0]} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 70px', padding: '8px 0', borderBottom: `1px solid ${CTok.ink6}`, alignItems: 'center', background: i === 0 ? CTok.ink7 : 'transparent', borderLeft: i === 0 ? `3px solid ${CTok.ink0}` : '3px solid transparent', paddingLeft: i === 0 ? 8 : 0 }}>
                  <Cell state="fail" size={10} />
                  <span style={{ color: i===0 ? CTok.ink0 : CTok.ink1, fontWeight: i === 0 ? 600 : 400 }}>{c[0]}</span>
                  <span style={{ color: CTok.ink3, fontSize: 10, textAlign: 'right' }}>{c[3]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: cell detail */}
        <div style={{ padding: '24px 32px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.2em', color: CTok.ink3 }}>CELL · 04.01 · CRITICAL</div>
          <div style={{ fontFamily: CTok.sans, fontSize: 24, fontWeight: 700, color: CTok.ink0, letterSpacing: '-0.02em', marginTop: 4 }}>auth.bearer-token.scope-validation</div>
          <div style={{ fontFamily: CTok.mono, fontSize: 11, color: CTok.ink3 }}>spec §7.4 — accepted write on read-scoped token</div>

          <div style={{ marginTop: 14, fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.16em', color: CTok.ink3 }}>SPEC</div>
          <div style={{ marginTop: 4, padding: '12px 14px', background: CTok.surface1, borderLeft: `3px solid ${CTok.ink0}`, fontFamily: CTok.sans, fontSize: 13.5, color: CTok.ink1, lineHeight: 1.55 }}>
            A server <b>MUST</b> reject any tool invocation whose required scope is not present in the bearer token. The rejection <b>MUST</b> use error code <code style={{ fontFamily: CTok.mono }}>-32002</code> and <b>MUST NOT</b> execute the tool.
            <div style={{ fontFamily: CTok.mono, fontSize: 10, color: CTok.ink3, marginTop: 8 }}>§7.4 ¶ 3</div>
          </div>

          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.16em', color: CTok.ink3 }}>SENT</div>
              <pre style={{ margin: '4px 0 0', padding: '10px 12px', background: CTok.surface1, border: `1px solid ${CTok.ink5}`, fontFamily: CTok.mono, fontSize: 10.5, lineHeight: 1.5, color: CTok.ink1, overflow: 'hidden' }}>{`{ "method": "tools/call",
  "params": {
    "name": "repo.read_file" } }
// scope granted = ["read"]
// scope required = ["write"]`}</pre>
            </div>
            <div>
              <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.16em', color: CTok.ink3 }}>RECEIVED</div>
              <pre style={{ margin: '4px 0 0', padding: '10px 12px', background: CTok.surface1, border: `1px solid ${CTok.ink0}`, fontFamily: CTok.mono, fontSize: 10.5, lineHeight: 1.5, color: CTok.ink1, overflow: 'hidden' }}>{`HTTP/1.1 200 OK
{ "result": {
    "content": [{ "type": "text",
      "text": "wrote 3 lines" }] } }
// expected -32002`}</pre>
            </div>
          </div>

          <div style={{ marginTop: 12, fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.16em', color: CTok.ink3 }}>FIX</div>
          <pre style={{ marginTop: 4, padding: '12px 14px', background: CTok.green, color: '#e9e8df', fontFamily: CTok.mono, fontSize: 10.5, lineHeight: 1.55, flex: 1, overflow: 'hidden' }}>{`const required = tool.scopes ?? [];
const granted  = ctx.token.scopes;
if (!required.every(s => granted.includes(s))) {
  return rpc.error(-32002, 'insufficient_scope', {
    required, granted
  });
}`}</pre>

          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <button style={{ fontFamily: CTok.sans, fontSize: 12.5, fontWeight: 600, padding: '8px 14px', background: CTok.green, color: CTok.surface1, border: 'none' }}>Open §7.4 in Learn →</button>
            <button style={{ fontFamily: CTok.sans, fontSize: 12.5, padding: '8px 14px', background: CTok.surface1, color: CTok.ink1, border: `1px solid ${CTok.ink3}` }}>Copy fix</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Build · Canvas ★ ─────────────────────────────────────────
function C_BuildCanvas() {
  // Grid of slots: 3 columns (tools/prompts/resources), each slot is a cell
  const slot = (label, sub, filled, accent, k) => (
    <div key={k ?? label} style={{
      padding: 12, background: filled ? CTok.surface1 : CTok.ink7,
      border: filled ? `1px solid ${CTok.ink3}` : `1px dashed ${CTok.ink4}`,
      display: 'flex', flexDirection: 'column', gap: 4,
      minHeight: 70,
    }}>
      <div style={{ fontFamily: CTok.mono, fontSize: 10.5, color: filled ? CTok.ink0 : CTok.ink3, fontWeight: filled ? 600 : 400 }}>{label}</div>
      <div style={{ fontSize: 10.5, color: CTok.ink3, lineHeight: 1.4 }}>{sub}</div>
      {accent}
    </div>
  );
  return (
    <div style={{ width: '100%', height: '100%', background: CTok.paper, display: 'flex', flexDirection: 'column' }}>
      <CTopBar tab="BUILD" />
      <div style={{ padding: '14px 40px 10px', display: 'flex', alignItems: 'baseline', gap: 18, borderBottom: `1px solid ${CTok.ink5}` }}>
        <span style={{ fontFamily: CTok.sans, fontSize: 18, fontWeight: 700, color: CTok.ink0 }}>github-readonly</span>
        <span style={{ fontFamily: CTok.mono, fontSize: 11, color: CTok.ink3 }}>TypeScript · 8 tools · 2 prompts · 3 resources · 4 unsaved</span>
        <span style={{ flex: 1 }} />
        <button style={{ fontFamily: CTok.sans, fontSize: 12.5, fontWeight: 600, padding: '6px 14px', background: CTok.green, color: CTok.surface1, border: 'none' }}>Generate →</button>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 340px', minHeight: 0, gap: 1, background: CTok.ink5 }}>

        {[
          ['TOOLS · 8', TOOLS_FOR_BUILD, 'tool'],
          ['PROMPTS · 2', [
            ['summarize-pr', 'Produce a concise PR summary', 'pr: integer'],
            ['review-diff', 'Critique a unified diff', 'diff: string'],
          ], 'prompt'],
          ['RESOURCES · 3', [
            ['repo://*/README', 'Repo README at HEAD', 'subscribe'],
            ['repo://*/CHANGELOG', 'CHANGELOG.md', 'subscribe'],
            ['schema://github-v4', 'GitHub GraphQL schema', 'static'],
          ], 'resource'],
        ].map(([title, items, kind]) => (
          <div key={title} style={{ background: CTok.paper, padding: '18px 18px', overflow: 'hidden' }}>
            <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.2em', color: CTok.ink3 }}>{title}</div>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((it, i) => slot(it[0], it[1], true, kind==='tool' && i===1 ? (
                <div style={{ fontFamily: CTok.mono, fontSize: 9.5, color: CTok.green, marginTop: 'auto' }}>● editing</div>
              ) : null, it[0]))}
              {slot('+ add ' + kind, 'drag from spec', false, null, '__add__')}
            </div>
          </div>
        ))}

        {/* Inspector */}
        <div style={{ background: CTok.paper, padding: '18px 18px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.2em', color: CTok.ink3 }}>INSPECTOR</div>
          <div style={{ fontFamily: CTok.sans, fontSize: 16, fontWeight: 700, color: CTok.ink0, marginTop: 2 }}>repo.read_file</div>
          <div style={{ fontFamily: CTok.mono, fontSize: 10.5, color: CTok.ink3 }}>tool · scope=read</div>

          <div style={{ marginTop: 14, fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.14em', color: CTok.ink3 }}>DESCRIPTION</div>
          <textarea defaultValue="Read a single file from a GitHub repository at the given ref." style={{ marginTop: 4, padding: '7px 9px', fontFamily: CTok.sans, fontSize: 12, border: `1px solid ${CTok.ink4}`, background: CTok.surface1, resize: 'none', minHeight: 46, boxSizing: 'border-box' }} />

          <div style={{ marginTop: 12, fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.14em', color: CTok.ink3 }}>PARAMETERS</div>
          <div style={{ marginTop: 4, fontFamily: CTok.mono, fontSize: 11, color: CTok.ink1, lineHeight: 1.7 }}>
            <div>repo <span style={{ color: CTok.ink3 }}>· string · required</span></div>
            <div>path <span style={{ color: CTok.ink3 }}>· string · required</span></div>
            <div>ref  <span style={{ color: CTok.ink3 }}>· string · optional</span></div>
          </div>

          <div style={{ marginTop: 12, fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.14em', color: CTok.ink3 }}>INTEGRITY</div>
          <div style={{ marginTop: 4, fontFamily: CTok.mono, fontSize: 11, color: CTok.ink1, lineHeight: 1.7 }}>
            <span style={{ color: CTok.green }}>●</span> schema valid<br />
            <span style={{ color: CTok.green }}>●</span> description ok (62 / 1024)<br />
            <span style={{ color: CTok.ink3 }}>○</span> no examples (rec)
          </div>

          <div style={{ marginTop: 'auto', fontFamily: CTok.mono, fontSize: 10.5, color: CTok.ink3 }}>↑↓ navigate components</div>
        </div>
      </div>
    </div>
  );
}

// ─── Build · Generation ───────────────────────────────────────
function C_BuildGen() {
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
    <div style={{ width: '100%', height: '100%', background: CTok.paper, display: 'flex', flexDirection: 'column' }}>
      <CTopBar tab="BUILD" />
      <div style={{ flex: 1, padding: '24px 40px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, minHeight: 0 }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.2em', color: CTok.ink3 }}>GENERATION · REVIEW</div>
          <div style={{ fontFamily: CTok.sans, fontSize: 30, fontWeight: 700, color: CTok.ink0, letterSpacing: '-0.02em' }}>15 files · 11.7 kB</div>

          <div style={{ marginTop: 14, fontFamily: CTok.mono, fontSize: 11, background: CTok.surface1, border: `1px solid ${CTok.ink5}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 60px', padding: '8px 12px', borderBottom: `1px solid ${CTok.ink5}`, color: CTok.ink3, fontSize: 9.5, letterSpacing: '0.12em' }}>
              <span></span><span>FILE</span><span style={{ textAlign: 'right' }}>SIZE</span>
            </div>
            {files.map((f, i) => (
              <div key={f[0]} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 60px', padding: '6px 12px', borderBottom: i < files.length - 1 ? `1px solid ${CTok.ink6}` : 'none', alignItems: 'center', background: i % 2 ? CTok.ink7 : CTok.surface1 }}>
                <Cell state="pass" size={10} />
                <span style={{ color: CTok.ink0 }}>{f[0]}</span>
                <span style={{ color: CTok.ink3, textAlign: 'right' }}>{f[1]}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.2em', color: CTok.ink3 }}>SETTINGS</div>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: CTok.ink5, border: `1px solid ${CTok.ink5}` }}>
            {[
              ['LANGUAGE', 'TypeScript'],
              ['RUNTIME', 'Node 20 ESM'],
              ['TRANSPORT', 'HTTP · stdio'],
              ['AUTH', 'Bearer · OAuth'],
              ['LICENSE', 'MIT'],
              ['FORMATTER', 'prettier'],
            ].map(([k, v]) => (
              <div key={k} style={{ background: CTok.surface1, padding: '12px 14px' }}>
                <div style={{ fontFamily: CTok.mono, fontSize: 9.5, letterSpacing: '0.14em', color: CTok.ink3 }}>{k}</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: CTok.ink0, marginTop: 4 }}>{v}</div>
              </div>
            ))}
          </div>

          <button style={{ marginTop: 18, fontFamily: CTok.sans, fontSize: 15, fontWeight: 700, padding: '14px 18px', background: CTok.green, color: CTok.surface1, border: 'none', textAlign: 'left' }}>↓ &nbsp; Download .zip &nbsp; · &nbsp; 11.7 kB</button>
          <button style={{ marginTop: 8, fontFamily: CTok.sans, fontSize: 12.5, padding: '10px 14px', background: CTok.surface1, color: CTok.ink1, border: `1px solid ${CTok.ink3}`, textAlign: 'left' }}>Copy curl one-liner</button>
          <button style={{ marginTop: 8, fontFamily: CTok.sans, fontSize: 12.5, padding: '10px 14px', background: CTok.surface1, color: CTok.ink1, border: `1px solid ${CTok.ink3}`, textAlign: 'left' }}>Dockerfile</button>

          <div style={{ marginTop: 18, padding: 14, background: CTok.surface1, border: `1px solid ${CTok.ink5}`, fontFamily: CTok.mono, fontSize: 11, color: CTok.ink1, lineHeight: 1.7 }}>
            <span style={{ color: CTok.ink3 }}># next</span><br />
            cd github-readonly &amp;&amp; npm i<br />
            npm run dev:http <span style={{ color: CTok.ink3 }}># :3845</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Learn ────────────────────────────────────────────────────
function C_Learn() {
  return (
    <div style={{ width: '100%', height: '100%', background: CTok.paper, display: 'flex', flexDirection: 'column' }}>
      <CTopBar tab="LEARN" />
      <div style={{ padding: '14px 40px 10px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${CTok.ink5}` }}>
        <input placeholder="search · "  defaultValue="scope" style={{ flex: 1, padding: '10px 14px', fontFamily: CTok.mono, fontSize: 13, border: `1px solid ${CTok.ink3}`, background: CTok.surface1, boxSizing: 'border-box' }} />
        <span style={{ fontFamily: CTok.mono, fontSize: 11, color: CTok.ink3 }}>12 results · 4 sections · 8 checks</span>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr 280px', minHeight: 0 }}>

        <div style={{ padding: '18px 18px', borderRight: `1px solid ${CTok.ink5}`, overflow: 'hidden' }}>
          <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.2em', color: CTok.ink3 }}>RESULTS</div>
          <div style={{ marginTop: 10, fontFamily: CTok.mono, fontSize: 11.5, lineHeight: 1.7 }}>
            <div style={{ color: CTok.ink3, fontSize: 9.5, letterSpacing: '0.14em', marginTop: 8 }}>SECTIONS</div>
            <div style={{ color: CTok.ink0, fontWeight: 600, padding: '2px 0' }}>§7.4 Scopes</div>
            <div style={{ color: CTok.ink2, padding: '2px 0' }}>§7.2 Bearer Tokens</div>
            <div style={{ color: CTok.ink2, padding: '2px 0' }}>§7.3 OAuth 2.1</div>
            <div style={{ color: CTok.ink2, padding: '2px 0' }}>§7.5 PKCE Requirements</div>

            <div style={{ color: CTok.ink3, fontSize: 9.5, letterSpacing: '0.14em', marginTop: 14 }}>CHECKS</div>
            <div style={{ color: CTok.ink2, padding: '2px 0' }}>auth.bearer-token.scope-validation</div>
            <div style={{ color: CTok.ink2, padding: '2px 0' }}>auth.oauth.pkce.s256-only</div>
            <div style={{ color: CTok.ink2, padding: '2px 0' }}>auth.error.no-token-leak</div>
            <div style={{ color: CTok.ink2, padding: '2px 0' }}>auth.bearer-token.expiry-check</div>
          </div>
        </div>

        <div style={{ padding: '24px 32px', overflow: 'hidden' }}>
          <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.2em', color: CTok.ink3 }}>§7 AUTHORIZATION · §7.4</div>
          <div style={{ fontFamily: CTok.sans, fontSize: 56, fontWeight: 800, color: CTok.ink0, letterSpacing: '-0.04em', lineHeight: 0.95, marginTop: 4 }}>Scopes</div>

          <div style={{ marginTop: 16, fontFamily: CTok.sans, fontSize: 15, lineHeight: 1.65, color: CTok.ink1 }}>
            <p style={{ margin: '0 0 12px' }}>A scope is a string declared by a tool, prompt, or resource and granted to a token. A server <b>MUST</b> treat scopes as authoritative: an unscoped operation <b>MUST NOT</b> be permitted, regardless of the token's identity.</p>
            <p style={{ margin: '0 0 12px' }}>Scopes form a flat namespace. Wildcards (<code style={{ fontFamily: CTok.mono, fontSize: 13 }}>"repo.*"</code>) <b>MAY</b> be granted but <b>MUST NOT</b> be inferred.</p>
            <p style={{ margin: '0 0 12px' }}>A server <b>MUST</b> reject any tool invocation whose required scope is not present in the bearer token. The rejection <b>MUST</b> use error code <code style={{ fontFamily: CTok.mono, fontSize: 13 }}>-32002</code> and <b>MUST NOT</b> execute the tool.</p>
          </div>

          <div style={{ marginTop: 14, fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.18em', color: CTok.ink3 }}>EXAMPLE</div>
          <pre style={{ marginTop: 6, padding: '14px 16px', background: CTok.surface1, border: `1px solid ${CTok.ink5}`, fontFamily: CTok.mono, fontSize: 11.5, lineHeight: 1.55, color: CTok.ink1, overflow: 'hidden' }}>{`{
  "error": {
    "code": -32002,
    "message": "insufficient_scope",
    "data": { "required": ["write"], "granted": ["read"] }
  }
}`}</pre>
        </div>

        <div style={{ padding: '18px 18px', borderLeft: `1px solid ${CTok.ink5}`, overflow: 'hidden' }}>
          <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.2em', color: CTok.ink3 }}>CITED BY CHECKS</div>
          <div style={{ marginTop: 8, fontFamily: CTok.mono, fontSize: 11, color: CTok.ink1, lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Cell state="fail" size={10} /> auth.bearer-token.scope-validation</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Cell state="fail" size={10} /> auth.bearer-token.expiry-check</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Cell state="pass" size={10} /> auth.basic.tls-only</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Cell state="pass" size={10} /> auth.api-key.header-name</div>
          </div>

          <div style={{ marginTop: 22, padding: 14, background: CTok.surface1, border: `1px solid ${CTok.ink3}` }}>
            <div style={{ fontFamily: CTok.mono, fontSize: 9.5, letterSpacing: '0.16em', color: CTok.ink3 }}>FROM SCN-0142</div>
            <div style={{ fontFamily: CTok.sans, fontSize: 13.5, color: CTok.ink0, fontWeight: 600, marginTop: 4 }}>2 failures cite §7.4.</div>
            <button style={{ marginTop: 8, fontFamily: CTok.sans, fontSize: 12, fontWeight: 600, padding: '6px 10px', background: CTok.green, color: CTok.surface1, border: 'none' }}>← back to report</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── States ───────────────────────────────────────────────────
function C_States() {
  return (
    <div style={{ width: '100%', height: '100%', background: CTok.paper, display: 'flex', flexDirection: 'column' }}>
      <CTopBar tab="" />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 0, gap: 1, background: CTok.ink5 }}>

        <div style={{ background: CTok.paper, padding: '32px 36px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.2em', color: CTok.ink3 }}>EMPTY · FIRST RUN</div>

          <div style={{ marginTop: 32 }}>
            {/* Empty lattice */}
            <div style={{ padding: '18px 20px', background: CTok.surface1, border: `1px solid ${CTok.ink5}` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {CATEGORIES.map(([n, t]) => (
                  <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ width: 90, fontFamily: CTok.mono, fontSize: 10, color: CTok.ink4, textAlign: 'right' }}>{n}</span>
                    <span style={{ display: 'flex', gap: 2 }}>
                      {Array.from({length: t}).map((_, i) => <Cell key={i} state="pending" size={10} />)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18, fontSize: 28, fontWeight: 700, color: CTok.ink0, letterSpacing: '-0.02em' }}>243 checks, none yet run.</div>
          <div style={{ fontSize: 13.5, color: CTok.ink2, marginTop: 6 }}>Argus stays in this browser. Point it at a server to begin.</div>

          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <input placeholder="http://localhost:3845/mcp" style={{ flex: 1, padding: '11px 14px', fontFamily: CTok.mono, fontSize: 13, border: `1px solid ${CTok.ink3}`, background: CTok.surface1, boxSizing: 'border-box' }} />
            <button style={{ fontFamily: CTok.sans, fontSize: 13.5, fontWeight: 600, padding: '11px 18px', background: CTok.green, color: CTok.surface1, border: 'none' }}>Scan ↵</button>
          </div>
        </div>

        <div style={{ background: CTok.paper, padding: '32px 36px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: CTok.mono, fontSize: 10, letterSpacing: '0.2em', color: CTok.ink3 }}>ABORTED · UNREACHABLE</div>

          {/* The lattice gets one row of cross-hatch overlay */}
          <div style={{ marginTop: 22, padding: '18px 20px', background: CTok.surface1, border: `1px solid ${CTok.ink5}`, position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {CATEGORIES.slice(0, 8).map(([n, t]) => (
                <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ width: 90, fontFamily: CTok.mono, fontSize: 10, color: CTok.ink4, textAlign: 'right' }}>{n}</span>
                  <span style={{ display: 'flex', gap: 2 }}>
                    {Array.from({length: t}).map((_, i) => <Cell key={i} state="pending" size={12} />)}
                  </span>
                </div>
              ))}
            </div>
            <div style={{
              position: 'absolute', inset: 0,
              background: `repeating-linear-gradient(45deg, transparent 0 14px, rgba(0,0,0,0.04) 14px 16px)`,
              pointerEvents: 'none',
            }} />
          </div>

          <div style={{ marginTop: 22, fontSize: 30, fontWeight: 700, color: CTok.ink0, letterSpacing: '-0.02em' }}>Connection refused.</div>
          <div style={{ marginTop: 6, fontFamily: CTok.mono, fontSize: 12, color: CTok.ink2, lineHeight: 1.7 }}>
            <div><span style={{ color: CTok.ink3 }}>endpoint  </span>localhost:3845/mcp</div>
            <div><span style={{ color: CTok.ink3 }}>cause     </span>ECONNREFUSED</div>
            <div><span style={{ color: CTok.ink3 }}>attempts  </span>3 of 3 · back-off 100/400/1600 ms</div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <button style={{ fontFamily: CTok.sans, fontSize: 13.5, fontWeight: 600, padding: '10px 18px', background: CTok.green, color: CTok.surface1, border: 'none' }}>Retry ↵</button>
            <button style={{ fontFamily: CTok.sans, fontSize: 13.5, padding: '10px 18px', background: CTok.surface1, color: CTok.ink1, border: `1px solid ${CTok.ink3}` }}>Edit endpoint</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  C_Brand, C_Home, C_TestInput, C_Scanning, C_Results, C_Drill,
  C_BuildCanvas, C_BuildGen, C_Learn, C_States, C_Rationale,
});
