// Direction D — Workbench
// POV: ARGUS is a workbench. Things have positions in space; what
// connects to what matters. Build is a node graph. Results are a diff
// against your last run. Cobalt accent. Modern, flat — no skeuomorphic
// terminal nostalgia. Type: Inter + JetBrains Mono.

const DTok = {
  sans: '"Inter", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
  cobalt: '#5e8cff',          // electric cobalt — selection, change, the +
  cobaltSoft: '#16223f',
  paper: '#0d0f13',           // charcoal
  surface: '#13161c',         // pane bg
  ink0: '#eef1f8',
  ink1: '#c8cdd8',
  ink2: '#8c93a0',
  ink3: '#5b626e',
  ink4: '#3d434e',
  ink5: '#22262e',            // hairline
  ink6: '#171a21',
  ink7: '#13161c',
  surface1: '#171b22',        // raised
  rule: '#1f242c',
  glow: 'rgba(94,140,255,0.5)',
};

// ─── Shell: title bar + tab strip ────────────────────────────
function DChrome({ tabs = ['scn-0142.report', 'scn-0141.report', 'github-readonly.build', 'spec://7.4'], active = 0 }) {
  return (
    <>
      {/* Title bar */}
      <div style={{
        height: 30, background: DTok.surface, borderBottom: `1px solid ${DTok.rule}`,
        display: 'flex', alignItems: 'center', padding: '0 14px', gap: 14,
        flexShrink: 0, fontFamily: DTok.sans,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Bracket mark */}
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M5 2 L2 2 L2 12 L5 12" stroke={DTok.ink0} strokeWidth="1.5" fill="none" />
            <path d="M9 2 L12 2 L12 12 L9 12" stroke={DTok.ink0} strokeWidth="1.5" fill="none" />
            <rect x="6.5" y="6" width="1" height="2" fill={DTok.cobalt} />
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: DTok.ink0, letterSpacing: '-0.005em' }}>argus</span>
          <span style={{ fontFamily: DTok.mono, fontSize: 10, color: DTok.ink3 }}>workbench · v0.4.1</span>
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: DTok.mono, fontSize: 10, color: DTok.ink2 }}>
          <LiveDot color={DTok.cobalt} size={5} dur="1.6s" />
          connected
        </span>
        <span style={{ fontFamily: DTok.mono, fontSize: 10, color: DTok.ink3 }}>localStorage · 4.8/10 MB</span>
        <span style={{ display: 'flex', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: DTok.ink5 }} />
          <span style={{ width: 8, height: 8, borderRadius: 4, background: DTok.ink5 }} />
          <span style={{ width: 8, height: 8, borderRadius: 4, background: DTok.ink5 }} />
        </span>
      </div>

      {/* Tab strip */}
      <div style={{
        height: 32, background: DTok.paper, borderBottom: `1px solid ${DTok.rule}`,
        display: 'flex', alignItems: 'stretch', fontFamily: DTok.mono, flexShrink: 0,
      }}>
        {tabs.map((t, i) => (
          <div key={t} style={{
            padding: '0 14px', display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 11, color: i === active ? DTok.ink0 : DTok.ink3,
            background: i === active ? DTok.surface : 'transparent',
            borderRight: `1px solid ${DTok.rule}`,
            borderTop: i === active ? `2px solid ${DTok.cobalt}` : '2px solid transparent',
            fontWeight: i === active ? 600 : 400,
          }}>
            {t}
            <span style={{ color: DTok.ink4, fontSize: 12, marginLeft: 4 }}>×</span>
          </div>
        ))}
        <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', color: DTok.ink3, fontSize: 14 }}>+</div>
        <div style={{ flex: 1 }} />
        <div style={{ padding: '0 14px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 10.5, color: DTok.ink3 }}>
          <span>⌘P  files</span>
          <span>⌘⇧P  cmd</span>
        </div>
      </div>
    </>
  );
}

// Side tool rail (activity bar)
function DRail({ active = 'Test' }) {
  const items = [
    ['Test',  'T'],
    ['Build', 'B'],
    ['Learn', 'L'],
    ['Diff',  'D'],
  ];
  return (
    <div style={{
      width: 40, background: DTok.paper, borderRight: `1px solid ${DTok.rule}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: 2,
      flexShrink: 0, fontFamily: DTok.mono,
    }}>
      {items.map(([n, k]) => (
        <div key={n} style={{
          width: 32, height: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 600,
          color: n === active ? DTok.ink0 : DTok.ink4,
          background: n === active ? DTok.surface : 'transparent',
          border: n === active ? `1px solid ${DTok.rule}` : '1px solid transparent',
          borderLeft: n === active ? `2px solid ${DTok.cobalt}` : '2px solid transparent',
        }}>{k}</div>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 9, color: DTok.ink4, padding: '8px 0', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>4 SCANS · 4 BUILDS</div>
    </div>
  );
}

// Status footer
function DFoot({ left = '● ready', right = 'draft-2026-v1 · UTF-8 · LF' }) {
  return (
    <div style={{ height: 22, background: DTok.surface, borderTop: `1px solid ${DTok.rule}`, display: 'flex', alignItems: 'center', padding: '0 12px', fontFamily: DTok.mono, fontSize: 10.5, color: DTok.ink2, flexShrink: 0 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: DTok.cobalt, fontWeight: 600 }}>
        <LiveDot color={DTok.cobalt} size={5} dur="1.6s" />
        {left.replace(/^●\s*/, '')}
      </span>
      <span style={{ flex: 1 }} />
      {/* subtle shimmering hairline */}
      <span style={{
        position: 'relative', width: 80, height: 1, background: DTok.ink5, overflow: 'hidden', marginRight: 14,
      }}>
        <span style={{
          position: 'absolute', inset: 0, width: '40%',
          background: `linear-gradient(90deg, transparent, ${DTok.cobalt}aa, transparent)`,
          animation: 'argus-sweep 2.8s linear infinite',
        }} />
      </span>
      <span style={{ color: DTok.ink3 }}>{right}</span>
    </div>
  );
}

// ─── Rationale ────────────────────────────────────────────────
function D_Rationale() {
  return (
    <Rationale
      accent={DTok.cobalt}
      title="A workbench, in the literal sense."
      body={
        <span>
          Argus has parts; the parts have positions; what connects to what is
          the point. So this direction borrows the workbench metaphor — tabs,
          a status footer, a node-graph for Build where transports, handlers,
          and tools sit in space and wire to each other. The Test report is
          treated as a <i>diff against your last scan</i>, because that's the
          question an engineer is actually asking: "did I make it worse?". One
          accent — <b>cobalt</b> — used for selection, change, and current
          position. Failures stay ink-black. Nothing is rounded, nothing is
          soft.
        </span>
      }
      optimized="The repeat-scan loop. Show change first, totals second. The grade reveal compares Tuesday to Wednesday before it says 'B+'."
      rejected="Skeuomorphic terminal chrome. Curved tab corners. Animated typing effects. 'Glassmorphism'."
    />
  );
}

// ─── Brand ────────────────────────────────────────────────────
function D_Brand() {
  return (
    <div style={{ width: '100%', height: '100%', background: DTok.surface, fontFamily: DTok.sans, color: DTok.ink0, padding: 40, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ fontFamily: DTok.mono, fontSize: 10, letterSpacing: '0.18em', color: DTok.ink3 }}>DIRECTION D · WORKBENCH · WORDMARK + SYMBOL</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <svg width="90" height="90" viewBox="0 0 90 90">
          <path d="M22 12 L12 12 L12 78 L22 78" stroke={DTok.ink0} strokeWidth="4" fill="none" />
          <path d="M68 12 L78 12 L78 78 L68 78" stroke={DTok.ink0} strokeWidth="4" fill="none" />
          <rect x="42" y="38" width="6" height="14" fill={DTok.cobalt} />
          <line x1="30" y1="45" x2="42" y2="45" stroke={DTok.ink0} strokeWidth="2" />
          <line x1="48" y1="45" x2="60" y2="45" stroke={DTok.ink0} strokeWidth="2" />
        </svg>
        <div>
          <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.9, color: DTok.ink0 }}>argus<span style={{ color: DTok.cobalt }}>.</span></div>
          <div style={{ fontFamily: DTok.mono, fontSize: 11, letterSpacing: '0.14em', color: DTok.ink3, marginTop: 6 }}>[ MCP · WORKBENCH ]</div>
        </div>
      </div>

      <div>
        <div style={{ fontFamily: DTok.mono, fontSize: 10, letterSpacing: '0.16em', color: DTok.ink3 }}>PALETTE</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 8 }}>
          {[
            ['INK',     DTok.ink0,    '#0f0f0d'],
            ['PAPER',   DTok.paper,   '#f3f3ef'],
            ['SURFACE', DTok.surface, '#fbfaf6'],
            ['RULE',    DTok.rule,    '#d9d9ca'],
            ['COBALT',  DTok.cobalt,  '#1d52d9'],
          ].map(([n, c, h]) => (
            <div key={n} style={{ height: 60, background: c, padding: '8px 10px', color: c === DTok.ink0 || c === DTok.cobalt ? DTok.surface1 : DTok.ink2, fontFamily: DTok.mono, fontSize: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: c === DTok.surface || c === DTok.paper ? `1px solid ${DTok.rule}` : 'none' }}>
              <span>{n}</span><span style={{ opacity: 0.7 }}>{h}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, fontFamily: DTok.mono, fontSize: 11, color: DTok.ink2 }}>
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: '0.18em', color: DTok.ink3 }}>TYPE</div>
          <div style={{ fontFamily: DTok.sans, fontWeight: 700, fontSize: 16, color: DTok.ink0, marginTop: 4 }}>Inter · Display 700</div>
          <div style={{ fontFamily: DTok.sans, color: DTok.ink2 }}>Inter · Body 400 / 600</div>
          <div>JetBrains Mono · 11px tab strip</div>
        </div>
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: '0.18em', color: DTok.ink3 }}>RULES</div>
          <div>1.5px lines · never softer</div>
          <div>0px radius · everywhere</div>
          <div>cobalt = selection &amp; change only</div>
        </div>
      </div>
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────
function D_Home() {
  return (
    <div style={{ width: '100%', height: '100%', background: DTok.paper, display: 'flex', flexDirection: 'column' }}>
      <DChrome tabs={['home']} active={0} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <DRail active="" />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 0 }}>
          {/* Explorer */}
          <div style={{ borderRight: `1px solid ${DTok.rule}`, padding: '14px 12px', overflow: 'hidden', fontFamily: DTok.mono, fontSize: 11, background: DTok.surface }}>
            <div style={{ color: DTok.ink3, fontSize: 9.5, letterSpacing: '0.16em' }}>WORKSPACE</div>
            <div style={{ marginTop: 6, color: DTok.ink1, lineHeight: 1.7 }}>
              <div style={{ color: DTok.ink2 }}>▾ scans/</div>
              {SCAN_HISTORY.map((s, i) => (
                <div key={s[0]} style={{ paddingLeft: 14, color: i === 0 ? DTok.ink0 : DTok.ink2, fontWeight: i === 0 ? 600 : 400, background: i === 0 ? DTok.cobaltSoft : 'transparent' }}>
                  {s[0].toLowerCase()}.report &nbsp;<span style={{ color: DTok.ink3 }}>{s[5]}</span>
                </div>
              ))}
              <div style={{ color: DTok.ink2, marginTop: 6 }}>▾ builds/</div>
              {BUILDS.map((b) => (
                <div key={b[0]} style={{ paddingLeft: 14, color: DTok.ink2 }}>{b[0]}.build</div>
              ))}
              <div style={{ color: DTok.ink2, marginTop: 6 }}>▾ spec/</div>
              <div style={{ paddingLeft: 14, color: DTok.ink2 }}>draft-2026-v1.spec</div>
            </div>
          </div>

          {/* Welcome canvas */}
          <div style={{ background: DTok.paper, padding: '32px 36px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: DTok.mono, fontSize: 11, color: DTok.ink3 }}>WELCOME · LAST SESSION 3 DAYS AGO</div>
            <div style={{ fontSize: 44, fontWeight: 700, color: DTok.ink0, letterSpacing: '-0.03em', marginTop: 4, lineHeight: 1 }}>
              Open something<span style={{ color: DTok.cobalt }}>.</span>
            </div>

            <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {[
                ['Start a scan', 'point at an mcp server',  'T', 'argus test'],
                ['Open last build', 'github-readonly',       'B', 'argus build github-readonly'],
                ['Open the spec',   '243 checks · 19 cats',  'L', 'argus learn'],
              ].map(([t, sub, k, cmd]) => (
                <div key={t} style={{ padding: '18px 18px', background: DTok.surface, border: `1px solid ${DTok.rule}` }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: DTok.ink0 }}>{t}</span>
                    <span style={{ fontFamily: DTok.mono, fontSize: 10, color: DTok.ink3, border: `1px solid ${DTok.rule}`, padding: '1px 6px' }}>⌘ {k}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: DTok.ink2, marginTop: 6 }}>{sub}</div>
                  <div style={{ marginTop: 14, fontFamily: DTok.mono, fontSize: 11, color: DTok.cobalt }}>{cmd}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, padding: 0, border: `1px solid ${DTok.rule}`, background: DTok.surface, fontFamily: DTok.mono, fontSize: 11 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 80px 50px 32px 50px', padding: '7px 14px', background: DTok.paper, color: DTok.ink3, fontSize: 9.5, letterSpacing: '0.12em', borderBottom: `1px solid ${DTok.rule}` }}>
                <span>SCAN</span><span>ENDPOINT</span><span>TRANSPORT</span><span>DUR</span><span>GR</span><span>PASS</span>
              </div>
              {SCAN_HISTORY.slice(0, 5).map((s, i) => (
                <div key={s[0]} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 80px 50px 32px 50px', padding: '7px 14px', borderBottom: i < 4 ? `1px solid ${DTok.ink6}` : 'none', color: DTok.ink1 }}>
                  <span>{s[0].toLowerCase()}</span>
                  <span>{s[2]}</span>
                  <span style={{ color: DTok.ink3 }}>{s[3].toLowerCase()}</span>
                  <span style={{ color: DTok.ink3 }}>{s[4]}</span>
                  <span style={{ color: DTok.ink0, fontWeight: 700 }}>{s[5]}</span>
                  <span style={{ color: DTok.ink3 }}>{s[6]}/243</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <DFoot left="● ready · localStorage" right="argus 0.4.1 · DRAFT-2026-V1" />
    </div>
  );
}

// ─── Test · Input ─────────────────────────────────────────────
function D_TestInput() {
  return (
    <div style={{ width: '100%', height: '100%', background: DTok.paper, display: 'flex', flexDirection: 'column' }}>
      <DChrome tabs={['scn-new.draft']} active={0} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <DRail active="Test" />
        <div style={{ flex: 1, padding: '24px 32px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: DTok.mono, fontSize: 10.5, color: DTok.ink3 }}>scn-new.draft · unsaved</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: DTok.ink0, letterSpacing: '-0.02em', marginTop: 2 }}>compose scan</div>

          {/* Form as a config doc */}
          <div style={{ marginTop: 22, padding: 18, background: DTok.surface, border: `1px solid ${DTok.rule}`, fontFamily: DTok.mono, fontSize: 12, color: DTok.ink1, lineHeight: 1.7 }}>
            <div><span style={{ color: DTok.ink3 }}>endpoint     </span>= <span style={{ background: DTok.cobaltSoft, color: DTok.ink0, padding: '0 4px' }}>"localhost:3845/mcp"</span></div>
            <div><span style={{ color: DTok.ink3 }}>transport    </span>= <span style={{ color: DTok.cobalt }}>"HTTP+SSE"</span>  <span style={{ color: DTok.ink4 }}>// stdio · ws</span></div>
            <div><span style={{ color: DTok.ink3 }}>auth         </span>= {`{ "Bearer": "•••2c8a" }`}</div>
            <div><span style={{ color: DTok.ink3 }}>profile      </span>= <span style={{ color: DTok.cobalt }}>"draft-2026-v1"</span></div>
            <div><span style={{ color: DTok.ink3 }}>categories   </span>= ["*"]  <span style={{ color: DTok.ink4 }}>// 19 / 19</span></div>
            <div><span style={{ color: DTok.ink3 }}>timeout_ms   </span>= 2000</div>
            <div><span style={{ color: DTok.ink3 }}>parallelism  </span>= 8</div>
            <div><span style={{ color: DTok.ink3 }}>compare_to   </span>= <span style={{ color: DTok.cobalt }}>"scn-0141"</span></div>
          </div>

          {/* Outputs preview */}
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ padding: 16, background: DTok.surface, border: `1px solid ${DTok.rule}` }}>
              <div style={{ fontFamily: DTok.mono, fontSize: 10, letterSpacing: '0.14em', color: DTok.ink3 }}>PRE-FLIGHT</div>
              <div style={{ marginTop: 6, fontFamily: DTok.mono, fontSize: 11.5, color: DTok.ink1, lineHeight: 1.7 }}>
                <span style={{ color: DTok.cobalt }}>●</span> handshake · 12 ms<br />
                <span style={{ color: DTok.cobalt }}>●</span> ping · 4 ms<br />
                <span style={{ color: DTok.cobalt }}>●</span> tools/list · 14 tools detected
              </div>
            </div>
            <div style={{ padding: 16, background: DTok.surface, border: `1px solid ${DTok.rule}` }}>
              <div style={{ fontFamily: DTok.mono, fontSize: 10, letterSpacing: '0.14em', color: DTok.ink3 }}>WILL PRODUCE</div>
              <div style={{ marginTop: 6, fontFamily: DTok.mono, fontSize: 11.5, color: DTok.ink1, lineHeight: 1.7 }}>
                scn-0143.report · ~32 kB<br />
                diff scn-0141 → scn-0143<br />
                ~28 seconds &nbsp; · &nbsp; all local
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <button style={{ fontFamily: DTok.sans, fontSize: 14, fontWeight: 700, padding: '12px 22px', background: DTok.cobalt, color: DTok.surface1, border: 'none' }}>Run scan ↵</button>
            <button style={{ fontFamily: DTok.sans, fontSize: 13, padding: '12px 18px', background: DTok.surface, color: DTok.ink1, border: `1px solid ${DTok.rule}` }}>Save as preset</button>
            <span style={{ flex: 1 }} />
            <span style={{ fontFamily: DTok.mono, fontSize: 11, color: DTok.ink3 }}>↵ run · ⌘S save · ⎋ cancel</span>
          </div>
        </div>
      </div>
      <DFoot left="● scn-new.draft · unsaved" right="ready to run" />
    </div>
  );
}

// ─── Test · Scanning ★ ────────────────────────────────────────
function D_Scanning() {
  return (
    <div style={{ width: '100%', height: '100%', background: DTok.paper, display: 'flex', flexDirection: 'column' }}>
      <DChrome tabs={['scn-0142.running', 'scn-0141.report', 'github-readonly.build']} active={0} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <DRail active="Test" />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr 360px', minHeight: 0 }}>
          {/* Tree — categories with status */}
          <div style={{ borderRight: `1px solid ${DTok.rule}`, padding: '14px 12px', overflow: 'hidden', fontFamily: DTok.mono, fontSize: 11, background: DTok.surface }}>
            <div style={{ color: DTok.ink3, fontSize: 9.5, letterSpacing: '0.16em' }}>SCN-0142 · CATEGORIES</div>
            <div style={{ marginTop: 6, color: DTok.ink1, lineHeight: 1.65 }}>
              {CATEGORIES.map(([n, t, f], i) => {
                const done = i < 7;
                const running = i === 7;
                return (
                  <div key={n} style={{
                    display: 'grid', gridTemplateColumns: '12px 1fr 50px', alignItems: 'center', gap: 8,
                    padding: '3px 4px',
                    color: done ? DTok.ink2 : running ? DTok.ink0 : DTok.ink4,
                    background: running ? DTok.cobaltSoft : 'transparent',
                    borderLeft: running ? `2px solid ${DTok.cobalt}` : '2px solid transparent',
                    fontWeight: running ? 600 : 400,
                  }}>
                    <span style={{ color: f > 0 ? DTok.ink0 : done ? DTok.cobalt : DTok.ink4 }}>{done ? (f > 0 ? '⚠' : '✓') : running ? '◐' : '○'}</span>
                    <span>{n}</span>
                    <span style={{ color: DTok.ink3, fontSize: 10, textAlign: 'right' }}>{done ? `${t-f}/${t}` : running ? '½' : t}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center: progress + stream */}
          <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${DTok.rule}`, background: DTok.surface }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: DTok.mono, fontSize: 10.5, color: DTok.ink3 }}>scn-0142 · localhost:3845/mcp · HTTP+SSE</div>
                  <div style={{ fontSize: 40, fontWeight: 700, color: DTok.ink0, letterSpacing: '-0.02em', lineHeight: 1, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                    107<span style={{ color: DTok.ink4 }}>/243</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontFamily: DTok.mono, fontSize: 12, color: DTok.ink2, lineHeight: 1.8 }}>
                  elapsed 00:12.4<br />
                  eta 00:16<br />
                  8.6 chk/s
                </div>
              </div>

              <div style={{ marginTop: 14, height: 4, background: DTok.ink6, position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, width: '44%', background: DTok.cobalt }} />
              </div>

              <div style={{ marginTop: 10, display: 'flex', gap: 16, fontFamily: DTok.mono, fontSize: 11 }}>
                <span><span style={{ color: DTok.ink3 }}>pass </span><b style={{ color: DTok.cobalt }}>94</b></span>
                <span><span style={{ color: DTok.ink3 }}>fail </span><b style={{ color: DTok.ink0 }}>13</b></span>
                <span><span style={{ color: DTok.ink3 }}>skip </span>0</span>
                <span style={{ color: DTok.ink3 }}> · compared against scn-0141 ·</span>
                <span><b style={{ color: DTok.cobalt }}>+5 net pass</b> <span style={{ color: DTok.ink3 }}>so far</span></span>
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'hidden', padding: '12px 18px', fontFamily: DTok.mono, fontSize: 11, color: DTok.ink2, lineHeight: 1.7 }}>
              {[
                ['11:08:11.391', 'auth.session.timeout', 'FAIL', 'expected exp at 30m, held 4h12m'],
                ['11:08:11.382', 'auth.oauth.state.csrf', 'FAIL', 'state not validated on callback'],
                ['11:08:11.373', 'auth.oauth.refresh-rotation', 'FAIL', 'old refresh accepted post-rotation'],
                ['11:08:11.364', 'auth.oauth.pkce.s256-only', 'FAIL', 'plain challenge accepted'],
                ['11:08:11.356', 'auth.bearer-token.expiry-check', 'FAIL', 'exp 2h past, accepted'],
                ['11:08:11.348', 'auth.bearer-token.scope-validation', 'FAIL', 'scope=read accepted on write'],
                ['11:08:11.337', 'lifecycle.shutdown.in-flight-requests', 'FAIL', 'shutdown returned ok with 2 in-flight'],
                ['11:08:11.326', 'lifecycle.shutdown.graceful', 'pass', null],
                ['11:08:11.318', 'lifecycle.initialized.notification', 'pass', null],
                ['11:08:11.310', 'lifecycle.initialize.capabilities.symmetric', 'pass', null],
              ].map((l, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 50px', gap: 10, padding: '2px 0', borderBottom: i < 9 ? `1px solid ${DTok.ink6}` : 'none' }}>
                  <span style={{ color: DTok.ink4 }}>{l[0]}</span>
                  <span>
                    <span style={{ color: l[2]==='FAIL' ? DTok.ink0 : DTok.ink1, fontWeight: l[2]==='FAIL'?600:400 }}>{l[1]}</span>
                    {l[3] && <span style={{ color: DTok.ink3, marginLeft: 8 }}>· {l[3]}</span>}
                  </span>
                  <span style={{ color: l[2]==='FAIL' ? DTok.ink0 : DTok.cobalt, textAlign: 'right', fontWeight: 600 }}>{l[2]==='FAIL' ? 'FAIL' : '✓'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right rail: current probe / control */}
          <div style={{ background: DTok.surface, borderLeft: `1px solid ${DTok.rule}`, padding: '16px 18px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ fontFamily: DTok.mono, fontSize: 10, letterSpacing: '0.16em', color: DTok.ink3 }}>NOW PROBING</div>
            <div style={{ fontFamily: DTok.mono, fontSize: 12, color: DTok.ink0, fontWeight: 600, marginTop: 4 }}>auth.session.rotation-on-privilege-change</div>
            <div style={{ fontFamily: DTok.mono, fontSize: 11, color: DTok.ink3, marginTop: 2 }}>spec §7.6.2 · awaiting · 1.8s</div>

            <div style={{ marginTop: 14, fontFamily: DTok.mono, fontSize: 10, letterSpacing: '0.16em', color: DTok.ink3 }}>SENT</div>
            <pre style={{ margin: '4px 0 0', padding: '10px 12px', background: DTok.paper, border: `1px solid ${DTok.rule}`, fontFamily: DTok.mono, fontSize: 10.5, lineHeight: 1.5, color: DTok.ink1, overflow: 'hidden' }}>{`POST /mcp · 02:14
authorization: Bearer …2c8a
{ "method": "session/rotate" }`}</pre>

            <div style={{ marginTop: 14, fontFamily: DTok.mono, fontSize: 10, letterSpacing: '0.16em', color: DTok.ink3 }}>DIFF VS SCN-0141</div>
            <div style={{ marginTop: 4, fontFamily: DTok.mono, fontSize: 11, color: DTok.ink1, lineHeight: 1.6 }}>
              <span style={{ color: DTok.cobalt }}>+5 </span>now passing<br />
              <span style={{ color: DTok.ink0 }}>−0 </span>regressions<br />
              <span style={{ color: DTok.ink3 }}>=8 </span>still failing
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, fontFamily: DTok.sans, fontSize: 12.5, padding: '8px 0', background: DTok.surface, color: DTok.ink1, border: `1px solid ${DTok.ink3}` }}>Pause</button>
              <button style={{ flex: 1, fontFamily: DTok.sans, fontSize: 12.5, padding: '8px 0', background: DTok.surface, color: DTok.ink0, border: `1px solid ${DTok.ink0}` }}>Abort</button>
            </div>
          </div>
        </div>
      </div>
      <DFoot left="● running · scn-0142 · 12.4s" right="44% · 8.6 chk/s · eta 16s" />
    </div>
  );
}

// ─── Test · Results ★ (diff against last) ─────────────────────
function D_Results() {
  // diff per category: previous fail vs new fail
  const diffCats = [
    ['Authorization', 12, 8, 'was 12 fail · now 8'],
    ['Caching',        7, 6, 'was  7 fail · now 6'],
    ['Security',       2, 1, 'was  2 fail · now 1'],
    ['Lifecycle',      2, 1, 'was  2 fail · now 1'],
    ['JSON-RPC',       1, 1, 'unchanged'],
    ['Transport',      1, 1, 'unchanged'],
  ];
  return (
    <div style={{ width: '100%', height: '100%', background: DTok.paper, display: 'flex', flexDirection: 'column' }}>
      <DChrome tabs={['scn-0142.report', 'scn-0141.report', 'github-readonly.build']} active={0} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <DRail active="Test" />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', minHeight: 0 }}>

          {/* Diff body */}
          <div style={{ padding: '22px 30px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Grade reveal as a diff */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 22 }}>
              <div>
                <div style={{ fontFamily: DTok.mono, fontSize: 10.5, color: DTok.ink3 }}>previous · scn-0141</div>
                <div style={{ fontSize: 80, fontWeight: 700, color: DTok.ink4, lineHeight: 0.9, letterSpacing: '-0.04em', fontFamily: DTok.sans }}>B</div>
                <div style={{ fontFamily: DTok.mono, fontSize: 11, color: DTok.ink3, marginTop: 2 }}>221/243</div>
              </div>
              <div style={{ fontSize: 56, color: DTok.ink4, padding: '0 10px 12px', fontWeight: 200 }}>→</div>
              <div style={{ position: 'relative' }}>
                {/* cobalt halo behind the current grade */}
                <div style={{
                  position: 'absolute', top: 0, left: -40, width: 320, height: 320,
                  background: `radial-gradient(circle, ${DTok.cobalt}33 0%, transparent 60%)`,
                  pointerEvents: 'none', animation: 'argus-breathe 5s ease-in-out infinite',
                }} />
                <div style={{ fontFamily: DTok.mono, fontSize: 10.5, color: DTok.cobalt, fontWeight: 600, position: 'relative', zIndex: 1 }}>current · scn-0142</div>
                <div style={{
                  fontSize: 120, fontWeight: 700, color: DTok.ink0, lineHeight: 0.85, letterSpacing: '-0.05em', fontFamily: DTok.sans,
                  position: 'relative', zIndex: 1,
                  ['--g']: DTok.glow, animation: 'argus-glow 5s ease-in-out infinite',
                }}>B<span style={{ color: DTok.cobalt }}>+</span></div>
                <div style={{ fontFamily: DTok.mono, fontSize: 12, color: DTok.ink2, marginTop: 2, position: 'relative', zIndex: 1 }}>229/243 &nbsp;<span style={{ color: DTok.cobalt, fontWeight: 600 }}>+8</span></div>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: DTok.mono, fontSize: 10.5, color: DTok.ink3 }}>localhost:3845/mcp · HTTP+SSE</div>
                <div style={{ fontFamily: DTok.mono, fontSize: 10.5, color: DTok.ink3 }}>2026-05-26 14:08 · 28.4s</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button style={{ fontFamily: DTok.sans, fontSize: 12, padding: '4px 10px', background: DTok.surface, border: `1px solid ${DTok.rule}`, color: DTok.ink1 }}>↓ html</button>
                  <button style={{ fontFamily: DTok.sans, fontSize: 12, padding: '4px 10px', background: DTok.surface, border: `1px solid ${DTok.rule}`, color: DTok.ink1 }}>↓ json</button>
                  <button style={{ fontFamily: DTok.sans, fontSize: 12, padding: '4px 10px', background: DTok.surface, border: `1px solid ${DTok.rule}`, color: DTok.ink1 }}>↓ md</button>
                  <button style={{ fontFamily: DTok.sans, fontSize: 12, fontWeight: 700, padding: '4px 12px', background: DTok.cobalt, color: DTok.surface1, border: 'none' }}>Re-scan ↵</button>
                </div>
              </div>
            </div>

            {/* What changed */}
            <div style={{ marginTop: 22, padding: '14px 18px', background: DTok.surface, border: `1px solid ${DTok.rule}` }}>
              <div style={{ fontFamily: DTok.mono, fontSize: 10, letterSpacing: '0.16em', color: DTok.ink3 }}>WHAT CHANGED · 8 RESOLVED · 0 REGRESSED · 14 STILL FAILING</div>
              <div style={{ marginTop: 8, fontFamily: DTok.mono, fontSize: 11.5, color: DTok.ink1, lineHeight: 1.7 }}>
                <div><span style={{ color: DTok.cobalt }}>+ </span>jsonrpc.batch.empty-array-rejected</div>
                <div><span style={{ color: DTok.cobalt }}>+ </span>lifecycle.initialize.capabilities.symmetric</div>
                <div><span style={{ color: DTok.cobalt }}>+ </span>auth.basic.tls-only</div>
                <div><span style={{ color: DTok.cobalt }}>+ </span>auth.api-key.header-name</div>
                <div><span style={{ color: DTok.cobalt }}>+ </span>discovery.tools.list.pagination</div>
                <div><span style={{ color: DTok.cobalt }}>+ </span>discovery.tools.schema.json-schema-draft</div>
                <div><span style={{ color: DTok.cobalt }}>+ </span>security.tls.min-version</div>
                <div><span style={{ color: DTok.cobalt }}>+ </span>caching.tools-list.weak-etag-allowed</div>
              </div>
            </div>

            {/* Per-category diff bars */}
            <div style={{ marginTop: 16, flex: 1, overflow: 'hidden' }}>
              <div style={{ fontFamily: DTok.mono, fontSize: 10, letterSpacing: '0.16em', color: DTok.ink3 }}>BY CATEGORY · IMPROVED FIRST</div>
              <div style={{ marginTop: 8, fontFamily: DTok.mono, fontSize: 11.5 }}>
                {diffCats.map(([n, prev, cur, note]) => {
                  const delta = prev - cur;
                  return (
                    <div key={n} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px', gap: 14, padding: '8px 0', borderBottom: `1px solid ${DTok.ink6}`, alignItems: 'center' }}>
                      <span style={{ color: DTok.ink0, fontWeight: 600 }}>{n}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 26, textAlign: 'right', color: DTok.ink4, fontVariantNumeric: 'tabular-nums' }}>{prev}</span>
                        <span style={{ flex: 1, height: 8, background: DTok.ink6, position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(prev / 12) * 100}%`, background: DTok.ink4 }} />
                          {delta > 0 && (
                            <span style={{ position: 'absolute', left: `${(cur / 12) * 100}%`, width: `${((prev - cur)/12) * 100}%`, top: 0, bottom: 0, background: `repeating-linear-gradient(45deg, ${DTok.cobalt} 0 4px, transparent 4px 8px)` }} />
                          )}
                          <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(cur / 12) * 100}%`, background: DTok.cobalt }} />
                        </span>
                        <span style={{ width: 26, color: DTok.ink0, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{cur}</span>
                      </span>
                      <span style={{ color: delta > 0 ? DTok.cobalt : DTok.ink3, fontWeight: delta > 0 ? 600 : 400, textAlign: 'right' }}>
                        {delta > 0 ? `−${delta} fail` : note}
                      </span>
                    </div>
                  );
                })}
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px', gap: 14, padding: '8px 0', color: DTok.ink3 }}>
                  <span>13 other categories</span>
                  <span></span>
                  <span style={{ textAlign: 'right' }}>0 fail, unchanged</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right rail: highlights */}
          <div style={{ background: DTok.surface, borderLeft: `1px solid ${DTok.rule}`, padding: '18px 18px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ fontFamily: DTok.mono, fontSize: 10, letterSpacing: '0.16em', color: DTok.ink3 }}>STILL FAILING · OPEN ORDER</div>
            <div style={{ marginTop: 8, fontFamily: DTok.mono, fontSize: 11, color: DTok.ink1, lineHeight: 1.7 }}>
              {CHECKS.Auth.filter(c => c[1] === 'fail').slice(0, 8).map((c, i) => (
                <div key={c[0]} style={{ display: 'grid', gridTemplateColumns: '1fr 60px', padding: '5px 0', borderBottom: i < 7 ? `1px solid ${DTok.ink6}` : 'none' }}>
                  <span>{c[0]}</span>
                  <span style={{ color: DTok.ink3, fontSize: 10, textAlign: 'right' }}>{c[3]}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, fontFamily: DTok.mono, fontSize: 10, letterSpacing: '0.16em', color: DTok.ink3 }}>NEXT GRADE TIER</div>
            <div style={{ marginTop: 4, fontFamily: DTok.sans, fontSize: 13, color: DTok.ink1, lineHeight: 1.55 }}>
              Resolving the 3 <b>critical</b> failures lifts you from <b>B+</b> to <b>A−</b>.
            </div>
            <button style={{ marginTop: 10, fontFamily: DTok.sans, fontSize: 12.5, fontWeight: 600, padding: '8px 14px', background: DTok.cobalt, color: DTok.surface1, border: 'none' }}>Open first critical →</button>

            <div style={{ marginTop: 'auto', fontFamily: DTok.mono, fontSize: 10.5, color: DTok.ink3 }}>↑↓ check · ⌘D diff · ⌘E export</div>
          </div>
        </div>
      </div>
      <DFoot left="● scn-0142.report" right="diff vs scn-0141 · +8 net pass" />
    </div>
  );
}

// ─── Test · Drill-in ★ ────────────────────────────────────────
function D_Drill() {
  return (
    <div style={{ width: '100%', height: '100%', background: DTok.paper, display: 'flex', flexDirection: 'column' }}>
      <DChrome tabs={['scn-0142.report', 'auth.bearer-token.scope-validation', 'spec://7.4']} active={1} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <DRail active="Test" />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 0 }}>

          {/* Tree */}
          <div style={{ borderRight: `1px solid ${DTok.rule}`, padding: '14px 12px', overflow: 'hidden', background: DTok.surface, fontFamily: DTok.mono, fontSize: 11 }}>
            <div style={{ color: DTok.ink3, fontSize: 9.5, letterSpacing: '0.16em' }}>SCN-0142 · FAILED CHECKS · 14</div>
            <div style={{ marginTop: 6, color: DTok.ink1, lineHeight: 1.7 }}>
              <div style={{ color: DTok.ink2, marginTop: 4 }}>▾ Authorization · 8</div>
              {CHECKS.Auth.filter(c => c[1]==='fail').map((c, i) => (
                <div key={c[0]} style={{
                  paddingLeft: 14, color: i === 0 ? DTok.ink0 : DTok.ink2,
                  background: i === 0 ? DTok.cobaltSoft : 'transparent',
                  borderLeft: i === 0 ? `2px solid ${DTok.cobalt}` : '2px solid transparent',
                  paddingTop: 1, paddingBottom: 1,
                  fontWeight: i === 0 ? 600 : 400,
                }}>{c[0].split('.').slice(-1)[0]}</div>
              ))}
              <div style={{ color: DTok.ink2, marginTop: 8 }}>▾ Caching · 6</div>
              <div style={{ paddingLeft: 14, color: DTok.ink3 }}>etag · if-modified-since · vary · …</div>
              <div style={{ color: DTok.ink2, marginTop: 8 }}>▸ Transport · 1</div>
              <div style={{ color: DTok.ink2, marginTop: 2 }}>▸ JSON-RPC · 1</div>
              <div style={{ color: DTok.ink2, marginTop: 2 }}>▸ Lifecycle · 1</div>
              <div style={{ color: DTok.ink2, marginTop: 2 }}>▸ Security · 1</div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 28px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontFamily: DTok.mono, fontSize: 10, padding: '3px 8px', background: DTok.cobalt, color: DTok.surface1, letterSpacing: '0.1em' }}>CRITICAL</span>
              <span style={{ fontFamily: DTok.mono, fontSize: 10.5, color: DTok.ink3 }}>checks/auth.bearer-token.scope-validation · spec §7.4</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: DTok.ink0, letterSpacing: '-0.02em', marginTop: 4 }}>
              Server accepted a write call on a read-scoped token.
            </div>

            {/* Diff view: expected vs actual response */}
            <div style={{ marginTop: 16, border: `1px solid ${DTok.rule}`, fontFamily: DTok.mono, fontSize: 11.5, background: DTok.surface }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${DTok.rule}`, fontSize: 10, color: DTok.ink3, letterSpacing: '0.12em' }}>
                <div style={{ padding: '6px 12px', borderRight: `1px solid ${DTok.rule}` }}>EXPECTED · per §7.4</div>
                <div style={{ padding: '6px 12px' }}>OBSERVED · localhost:3845/mcp</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <pre style={{ margin: 0, padding: '12px 12px', borderRight: `1px solid ${DTok.rule}`, fontSize: 11, lineHeight: 1.55, color: DTok.ink1, overflow: 'hidden' }}>
{`HTTP/1.1 200 OK
{
  "error": {
    "code": -32002,
    "message": "insufficient_scope",
    "data": {
      "required": ["write"],
      "granted":  ["read"]
    }
  }
}`}
                </pre>
                <pre style={{ margin: 0, padding: '12px 12px', fontSize: 11, lineHeight: 1.55, color: DTok.ink0, background: DTok.surface1, overflow: 'hidden' }}>
{`HTTP/1.1 200 OK
{
  "result": {
    "content": [
      {
        "type": "text",
        "text": "wrote 3 lines"
      }
    ]
  }
}`}
                </pre>
              </div>
            </div>

            {/* The spec quote */}
            <div style={{ marginTop: 14, padding: '12px 16px', background: DTok.surface, border: `1px solid ${DTok.rule}`, borderLeft: `3px solid ${DTok.cobalt}` }}>
              <div style={{ fontFamily: DTok.mono, fontSize: 10, letterSpacing: '0.16em', color: DTok.ink3 }}>§7.4 ¶ 3 · THE SPEC</div>
              <div style={{ fontSize: 13.5, color: DTok.ink1, lineHeight: 1.55, marginTop: 4 }}>
                A server <b>MUST</b> reject any tool invocation whose required scope is not present in the bearer token. The rejection <b>MUST</b> use error code <code style={{ fontFamily: DTok.mono }}>-32002</code> and <b>MUST NOT</b> execute the tool.
              </div>
            </div>

            {/* Suggested fix */}
            <div style={{ marginTop: 14, fontFamily: DTok.mono, fontSize: 10, letterSpacing: '0.16em', color: DTok.ink3 }}>SUGGESTED PATCH · src/dispatch.ts</div>
            <pre style={{ marginTop: 4, padding: '14px 16px', background: DTok.cobalt, color: '#dedacb', fontFamily: DTok.mono, fontSize: 11.5, lineHeight: 1.55, flex: 1, overflow: 'hidden' }}>
{`  function dispatch(tool, ctx, args) {
+   const required = tool.scopes ?? [];
+   const granted  = ctx.token.scopes;
+   if (!required.every(s => granted.includes(s))) {
+     return rpc.error(-32002, 'insufficient_scope', {
+       required, granted
+     });
+   }
    return tool.handler(args, ctx);
  }`}
            </pre>

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button style={{ fontFamily: DTok.sans, fontSize: 12.5, fontWeight: 600, padding: '8px 14px', background: DTok.cobalt, color: DTok.surface1, border: 'none' }}>Open §7.4 →</button>
              <button style={{ fontFamily: DTok.sans, fontSize: 12.5, padding: '8px 14px', background: DTok.surface, border: `1px solid ${DTok.rule}`, color: DTok.ink1 }}>Copy patch</button>
              <button style={{ fontFamily: DTok.sans, fontSize: 12.5, padding: '8px 14px', background: DTok.surface, border: `1px solid ${DTok.rule}`, color: DTok.ink1 }}>Mark as known-issue</button>
            </div>
          </div>
        </div>
      </div>
      <DFoot left="● auth.bearer-token.scope-validation · CRITICAL" right="check 1 of 8 · ⌘↓ next failure" />
    </div>
  );
}

// ─── Build · Canvas ★ (node graph) ────────────────────────────
function D_BuildCanvas() {
  // SVG node graph: transport → auth → router → handlers (8) → tools list
  // Place nodes manually.
  return (
    <div style={{ width: '100%', height: '100%', background: DTok.paper, display: 'flex', flexDirection: 'column' }}>
      <DChrome tabs={['github-readonly.build', 'scn-0142.report']} active={0} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <DRail active="Build" />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '220px 1fr 300px', minHeight: 0 }}>
          {/* Tree */}
          <div style={{ borderRight: `1px solid ${DTok.rule}`, padding: '14px 12px', overflow: 'hidden', background: DTok.surface, fontFamily: DTok.mono, fontSize: 11 }}>
            <div style={{ color: DTok.ink3, fontSize: 9.5, letterSpacing: '0.16em' }}>github-readonly</div>
            <div style={{ marginTop: 6, color: DTok.ink1, lineHeight: 1.75 }}>
              <div style={{ color: DTok.ink2 }}>▾ tools (8)</div>
              {TOOLS_FOR_BUILD.map((t, i) => (
                <div key={t[0]} style={{ paddingLeft: 14, color: i===1 ? DTok.ink0 : DTok.ink2, fontWeight: i===1?600:400, background: i===1?DTok.cobaltSoft:'transparent', borderLeft: i===1?`2px solid ${DTok.cobalt}`:'2px solid transparent' }}>{t[0]}</div>
              ))}
              <div style={{ color: DTok.ink2, marginTop: 6 }}>▾ prompts (2)</div>
              <div style={{ paddingLeft: 14, color: DTok.ink2 }}>summarize-pr</div>
              <div style={{ paddingLeft: 14, color: DTok.ink2 }}>review-diff</div>
              <div style={{ color: DTok.ink2, marginTop: 6 }}>▾ resources (3)</div>
              <div style={{ paddingLeft: 14, color: DTok.ink2 }}>repo://*/README</div>
              <div style={{ paddingLeft: 14, color: DTok.ink2 }}>repo://*/CHANGELOG</div>
              <div style={{ paddingLeft: 14, color: DTok.ink2 }}>schema://github-v4</div>
            </div>
          </div>

          {/* Canvas with node graph */}
          <div style={{ position: 'relative', overflow: 'hidden', background: `
              linear-gradient(${DTok.paper}, ${DTok.paper}),
              repeating-linear-gradient(0deg, transparent 0 23px, ${DTok.ink6} 23px 24px),
              repeating-linear-gradient(90deg, transparent 0 23px, ${DTok.ink6} 23px 24px)
            `, backgroundBlendMode: 'multiply' }}>
            <div style={{ position: 'absolute', top: 10, left: 14, fontFamily: DTok.mono, fontSize: 10, color: DTok.ink3, letterSpacing: '0.14em' }}>CANVAS · ZOOM 100% · 4 EDITS UNSAVED</div>
            <svg viewBox="0 0 700 530" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
              {/* Connections */}
              <g stroke={DTok.ink3} strokeWidth="1.2" fill="none">
                <path d="M150 90 L260 90" />
                <path d="M150 160 L260 160" />
                <path d="M260 90 Q 340 90 360 130" />
                <path d="M260 160 Q 340 160 360 130" />
                <path d="M460 130 L520 90" />
                <path d="M460 130 L520 130" />
                <path d="M460 130 L520 170" />
                <path d="M460 130 L520 210" />
                <path d="M460 130 L520 250" />
                <path d="M460 130 L520 290" />
                <path d="M460 130 L520 330" />
                <path d="M460 130 L520 370" />
              </g>
              {/* Highlighted connection — to the selected tool (repo.read_file) */}
              <path d="M460 130 L520 130" stroke={DTok.cobalt} strokeWidth="2.5" fill="none" />

              {/* Nodes — defined as little flat rects */}
              {/* Transport */}
              <g>
                <rect x="50" y="70" width="100" height="40" fill={DTok.surface} stroke={DTok.ink2} strokeWidth="1" />
                <text x="60" y="86" fontFamily={DTok.mono} fontSize="9" fill={DTok.ink3} letterSpacing="0.1em">TRANSPORT</text>
                <text x="60" y="102" fontFamily={DTok.sans} fontSize="12" fontWeight="600" fill={DTok.ink0}>HTTP + SSE</text>
              </g>
              <g>
                <rect x="50" y="140" width="100" height="40" fill={DTok.surface} stroke={DTok.ink2} strokeWidth="1" />
                <text x="60" y="156" fontFamily={DTok.mono} fontSize="9" fill={DTok.ink3} letterSpacing="0.1em">TRANSPORT</text>
                <text x="60" y="172" fontFamily={DTok.sans} fontSize="12" fontWeight="600" fill={DTok.ink0}>stdio</text>
              </g>
              {/* Auth */}
              <g>
                <rect x="260" y="105" width="100" height="50" fill={DTok.surface} stroke={DTok.ink2} strokeWidth="1" />
                <text x="270" y="121" fontFamily={DTok.mono} fontSize="9" fill={DTok.ink3} letterSpacing="0.1em">AUTH</text>
                <text x="270" y="137" fontFamily={DTok.sans} fontSize="12" fontWeight="600" fill={DTok.ink0}>Bearer · OAuth</text>
                <text x="270" y="150" fontFamily={DTok.mono} fontSize="10" fill={DTok.ink3}>scopes: read, write</text>
              </g>
              {/* Router */}
              <g>
                <rect x="360" y="105" width="100" height="50" fill={DTok.surface1} stroke={DTok.cobalt} strokeWidth="1.5" />
                <text x="370" y="121" fontFamily={DTok.mono} fontSize="9" fill={DTok.ink3} letterSpacing="0.1em">ROUTER</text>
                <text x="370" y="139" fontFamily={DTok.sans} fontSize="13" fontWeight="700" fill={DTok.cobalt}>tools/call</text>
              </g>
              {/* Handlers — 8 */}
              {TOOLS_FOR_BUILD.map((t, i) => {
                const y = 70 + i * 40;
                const sel = i === 1;
                return (
                  <g key={t[0]}>
                    <rect x="520" y={y} width="160" height="34"
                      fill={sel ? DTok.cobaltSoft : DTok.surface}
                      stroke={sel ? DTok.cobalt : DTok.ink2}
                      strokeWidth={sel ? '1.8' : '1'} />
                    <text x="530" y={y+14} fontFamily={DTok.mono} fontSize="8.5" fill={DTok.ink3} letterSpacing="0.1em">TOOL</text>
                    <text x="530" y={y+28} fontFamily={DTok.mono} fontSize="11.5" fontWeight={sel?'700':'500'} fill={DTok.ink0}>{t[0]}</text>
                  </g>
                );
              })}

              {/* unsaved indicator */}
              <circle cx="600" cy="125" r="4" fill={DTok.cobalt} />
            </svg>
          </div>

          {/* Inspector */}
          <div style={{ background: DTok.surface, borderLeft: `1px solid ${DTok.rule}`, padding: '16px 16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: DTok.mono, fontSize: 10, letterSpacing: '0.16em', color: DTok.ink3 }}>INSPECTOR · tool</div>
            <div style={{ fontFamily: DTok.sans, fontSize: 17, fontWeight: 700, color: DTok.ink0, marginTop: 2 }}>repo.read_file</div>

            <div style={{ marginTop: 14, fontFamily: DTok.mono, fontSize: 10, letterSpacing: '0.14em', color: DTok.ink3 }}>DESCRIPTION</div>
            <textarea defaultValue="Read a single file from a GitHub repository at the given ref." style={{ marginTop: 4, padding: '7px 9px', fontFamily: DTok.sans, fontSize: 12.5, border: `1px solid ${DTok.rule}`, background: DTok.surface1, resize: 'none', minHeight: 46, boxSizing: 'border-box' }} />

            <div style={{ marginTop: 12, fontFamily: DTok.mono, fontSize: 10, letterSpacing: '0.14em', color: DTok.ink3 }}>INPUT SCHEMA · JSON</div>
            <pre style={{ margin: '4px 0 0', padding: '10px 12px', background: DTok.surface1, border: `1px solid ${DTok.rule}`, fontFamily: DTok.mono, fontSize: 11, lineHeight: 1.55, color: DTok.ink1, overflow: 'hidden' }}>{`{
  "repo": "string",
  "path": "string",
  "ref?": "string"
}`}</pre>

            <div style={{ marginTop: 12, fontFamily: DTok.mono, fontSize: 10, letterSpacing: '0.14em', color: DTok.ink3 }}>WIRING</div>
            <div style={{ marginTop: 4, fontFamily: DTok.mono, fontSize: 11, color: DTok.ink1, lineHeight: 1.6 }}>
              router → <span style={{ color: DTok.cobalt }}>repo.read_file</span><br />
              auth → scope=read<br />
              handler → src/handlers/repo.read_file.ts
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, fontFamily: DTok.sans, fontSize: 12.5, padding: '8px 0', background: DTok.surface, color: DTok.ink1, border: `1px solid ${DTok.rule}` }}>Test call</button>
              <button style={{ flex: 1, fontFamily: DTok.sans, fontSize: 12.5, fontWeight: 600, padding: '8px 0', background: DTok.cobalt, color: DTok.surface1, border: 'none' }}>Generate →</button>
            </div>
          </div>
        </div>
      </div>
      <DFoot left="● github-readonly.build · 4 unsaved" right="8 tools · 2 prompts · 3 resources" />
    </div>
  );
}

// ─── Build · Generation ───────────────────────────────────────
function D_BuildGen() {
  return (
    <div style={{ width: '100%', height: '100%', background: DTok.paper, display: 'flex', flexDirection: 'column' }}>
      <DChrome tabs={['github-readonly.build', 'generate.preview']} active={1} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <DRail active="Build" />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: 0 }}>
          {/* File tree of what'll be emitted */}
          <div style={{ borderRight: `1px solid ${DTok.rule}`, padding: '14px 12px', overflow: 'hidden', background: DTok.surface, fontFamily: DTok.mono, fontSize: 11 }}>
            <div style={{ color: DTok.ink3, fontSize: 9.5, letterSpacing: '0.16em' }}>WILL EMIT</div>
            <div style={{ marginTop: 6, color: DTok.ink1, lineHeight: 1.75 }}>
              <div style={{ color: DTok.ink2 }}>▾ src/</div>
              <div style={{ paddingLeft: 14 }}>index.ts <span style={{ color: DTok.cobalt }}>+</span></div>
              <div style={{ color: DTok.ink2, paddingLeft: 14 }}>▾ handlers/</div>
              {TOOLS_FOR_BUILD.map((t) => (
                <div key={t[0]} style={{ paddingLeft: 28 }}>{t[0].replace('.','_')}.ts <span style={{ color: DTok.cobalt }}>+</span></div>
              ))}
              <div style={{ color: DTok.ink2, paddingLeft: 14 }}>▾ prompts/</div>
              <div style={{ paddingLeft: 28 }}>summarize-pr.ts <span style={{ color: DTok.cobalt }}>+</span></div>
              <div style={{ paddingLeft: 28 }}>review-diff.ts <span style={{ color: DTok.cobalt }}>+</span></div>
              <div style={{ color: DTok.ink2, paddingLeft: 14 }}>▾ resources/</div>
              <div style={{ paddingLeft: 28 }}>index.ts <span style={{ color: DTok.cobalt }}>+</span></div>
              <div style={{ marginTop: 6 }}>package.json <span style={{ color: DTok.cobalt }}>+</span></div>
              <div>tsconfig.json <span style={{ color: DTok.cobalt }}>+</span></div>
              <div>README.md <span style={{ color: DTok.cobalt }}>+</span></div>
            </div>
          </div>

          {/* Preview pane: src/index.ts content */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '12px 22px', borderBottom: `1px solid ${DTok.rule}`, display: 'flex', alignItems: 'baseline', gap: 14, fontFamily: DTok.mono, fontSize: 11, color: DTok.ink2, background: DTok.surface }}>
              <span style={{ color: DTok.ink3 }}>preview</span>
              <span style={{ color: DTok.ink0, fontWeight: 600 }}>src/index.ts</span>
              <span style={{ color: DTok.ink3 }}>· 342 B · auto-formatted</span>
              <span style={{ flex: 1 }} />
              <span>15 files · 11.7 kB total</span>
            </div>
            <pre style={{ margin: 0, padding: '14px 22px', fontFamily: DTok.mono, fontSize: 12, lineHeight: 1.6, color: DTok.ink1, overflow: 'auto', flex: 1, background: DTok.surface }}>
{`import { createServer } from "@mcp/runtime";
import * as tools     from "./handlers";
import * as prompts   from "./prompts";
import * as resources from "./resources";

export const server = createServer({
  name:    "github-readonly",
  version: "0.1.0",
  transports: ["http", "stdio"],
  auth: {
    schemes: ["bearer", "oauth2"],
    scopes:  ["read", "write"],
  },
  tools, prompts, resources,
});

if (import.meta.main) server.listen();`}
            </pre>

            {/* Bottom config strip + actions */}
            <div style={{ padding: '14px 22px', borderTop: `1px solid ${DTok.rule}`, background: DTok.paper, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 18, alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: DTok.mono, fontSize: 9.5, color: DTok.ink3, letterSpacing: '0.14em' }}>LANGUAGE</div>
                <div style={{ fontFamily: DTok.mono, fontSize: 13, color: DTok.ink0, marginTop: 2 }}><b>TypeScript</b> <span style={{ color: DTok.ink4 }}>· Python</span></div>
              </div>
              <div>
                <div style={{ fontFamily: DTok.mono, fontSize: 9.5, color: DTok.ink3, letterSpacing: '0.14em' }}>RUNTIME</div>
                <div style={{ fontFamily: DTok.mono, fontSize: 13, color: DTok.ink0, marginTop: 2 }}>Node 20 ESM</div>
              </div>
              <div>
                <div style={{ fontFamily: DTok.mono, fontSize: 9.5, color: DTok.ink3, letterSpacing: '0.14em' }}>LICENSE</div>
                <div style={{ fontFamily: DTok.mono, fontSize: 13, color: DTok.ink0, marginTop: 2 }}>MIT</div>
              </div>
              <button style={{ fontFamily: DTok.sans, fontSize: 14, fontWeight: 700, padding: '12px 22px', background: DTok.cobalt, color: DTok.surface1, border: 'none' }}>↓ Download .zip · 11.7 kB</button>
            </div>
          </div>
        </div>
      </div>
      <DFoot left="● ready to emit" right="github-readonly-2026-05-26.zip · 11.7 kB" />
    </div>
  );
}

// ─── Learn ────────────────────────────────────────────────────
function D_Learn() {
  return (
    <div style={{ width: '100%', height: '100%', background: DTok.paper, display: 'flex', flexDirection: 'column' }}>
      <DChrome tabs={['spec://7.4', 'scn-0142.report']} active={0} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <DRail active="Learn" />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '240px 1fr 280px', minHeight: 0 }}>

          {/* Tree */}
          <div style={{ borderRight: `1px solid ${DTok.rule}`, padding: '14px 12px', overflow: 'hidden', background: DTok.surface, fontFamily: DTok.mono, fontSize: 11 }}>
            <input placeholder="search spec…" style={{ width: '100%', padding: '6px 8px', fontFamily: DTok.mono, fontSize: 11, border: `1px solid ${DTok.rule}`, background: DTok.surface1, boxSizing: 'border-box' }} />
            <div style={{ marginTop: 12, color: DTok.ink3, fontSize: 9.5, letterSpacing: '0.16em' }}>draft-2026-v1</div>
            <div style={{ marginTop: 6, color: DTok.ink1, lineHeight: 1.7 }}>
              {SPEC_TREE.map((s) => {
                const depth = s[0].split('.').length;
                const active = s[0] === '7.4';
                return (
                  <div key={s[0]} style={{ paddingLeft: (depth-1)*10, color: active ? DTok.ink0 : DTok.ink2, fontWeight: active ? 700 : 400, background: active ? DTok.cobaltSoft : 'transparent', borderLeft: active ? `2px solid ${DTok.cobalt}` : '2px solid transparent', padding: '1px 4px' }}>
                    §{s[0]} {s[1]}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 24px', borderBottom: `1px solid ${DTok.rule}`, background: DTok.surface, fontFamily: DTok.mono, fontSize: 11, color: DTok.ink3 }}>
              authorization / scopes
            </div>
            <div style={{ padding: '22px 36px', overflow: 'hidden' }}>
              <div style={{ fontFamily: DTok.mono, fontSize: 11, color: DTok.cobalt }}>§7.4</div>
              <div style={{ fontFamily: DTok.sans, fontSize: 44, fontWeight: 700, color: DTok.ink0, letterSpacing: '-0.03em', lineHeight: 0.95, marginTop: 2 }}>Scopes</div>

              <div style={{ marginTop: 16, fontFamily: DTok.sans, fontSize: 14.5, lineHeight: 1.65, color: DTok.ink1 }}>
                <p style={{ margin: '0 0 12px' }}>A scope is a string declared by a tool, prompt, or resource and granted to a token. A server <b>MUST</b> treat scopes as authoritative: an unscoped operation <b>MUST NOT</b> be permitted, regardless of the token's identity.</p>
                <p style={{ margin: '0 0 12px' }}>Scopes form a flat namespace. Wildcards (<code style={{ fontFamily: DTok.mono, fontSize: 12 }}>"repo.*"</code>) <b>MAY</b> be granted but <b>MUST NOT</b> be inferred.</p>
                <p style={{ margin: '0 0 12px' }}>A server <b>MUST</b> reject any tool invocation whose required scope is not present in the bearer token. The rejection <b>MUST</b> use error code <code style={{ fontFamily: DTok.mono, fontSize: 12 }}>-32002</code> and <b>MUST NOT</b> execute the tool.</p>
              </div>

              <div style={{ marginTop: 14, fontFamily: DTok.mono, fontSize: 10, letterSpacing: '0.16em', color: DTok.ink3 }}>EXAMPLE · scope rejection</div>
              <pre style={{ marginTop: 6, padding: '14px 16px', background: DTok.surface, border: `1px solid ${DTok.rule}`, fontFamily: DTok.mono, fontSize: 11.5, lineHeight: 1.55, color: DTok.ink1, overflow: 'hidden' }}>{`{ "error": {
    "code": -32002,
    "message": "insufficient_scope",
    "data": { "required": ["write"], "granted": ["read"] }
  } }`}</pre>
            </div>
          </div>

          {/* Right rail */}
          <div style={{ background: DTok.surface, borderLeft: `1px solid ${DTok.rule}`, padding: '18px 16px', overflow: 'hidden', fontFamily: DTok.mono, fontSize: 11 }}>
            <div style={{ color: DTok.ink3, fontSize: 9.5, letterSpacing: '0.16em' }}>BACKLINKS · CHECKS</div>
            <div style={{ marginTop: 8, color: DTok.ink1, lineHeight: 1.7 }}>
              <div>auth.bearer-token.scope-validation</div>
              <div>auth.bearer-token.expiry-check</div>
              <div>auth.error.no-token-leak</div>
            </div>
            <div style={{ marginTop: 18, color: DTok.ink3, fontSize: 9.5, letterSpacing: '0.16em' }}>RELATED SECTIONS</div>
            <div style={{ marginTop: 6, color: DTok.ink2, lineHeight: 1.7 }}>
              §7.3 OAuth 2.1<br />
              §7.5 PKCE<br />
              §10 Error Codes
            </div>
            <div style={{ marginTop: 18, padding: 12, background: DTok.surface1, border: `1px solid ${DTok.cobalt}`, fontFamily: DTok.sans }}>
              <div style={{ fontFamily: DTok.mono, fontSize: 9.5, color: DTok.cobalt, letterSpacing: '0.14em' }}>FROM SCN-0142</div>
              <div style={{ fontSize: 13, color: DTok.ink1, marginTop: 4 }}>2 failures cite this section.</div>
              <button style={{ marginTop: 8, fontSize: 12, fontWeight: 600, padding: '6px 10px', background: DTok.cobalt, color: DTok.surface1, border: 'none' }}>← Back to report</button>
            </div>
          </div>
        </div>
      </div>
      <DFoot left="● spec://7.4" right="readonly · draft-2026-v1" />
    </div>
  );
}

// ─── States ───────────────────────────────────────────────────
function D_States() {
  return (
    <div style={{ width: '100%', height: '100%', background: DTok.paper, display: 'flex', flexDirection: 'column' }}>
      <DChrome tabs={['welcome', 'scn-0143.aborted']} active={0} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <DRail active="" />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 0 }}>

          <div style={{ padding: '36px 36px', borderRight: `1px solid ${DTok.rule}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: DTok.mono, fontSize: 10.5, color: DTok.ink3 }}>workspace · empty</div>
            <div style={{ fontSize: 40, fontWeight: 700, color: DTok.ink0, letterSpacing: '-0.02em', marginTop: 6, lineHeight: 1 }}>
              Nothing's open<span style={{ color: DTok.cobalt }}>.</span>
            </div>
            <div style={{ fontSize: 14, color: DTok.ink2, marginTop: 8 }}>Open the command palette, or paste an endpoint to start a scan.</div>

            <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr', gap: 6, fontFamily: DTok.mono, fontSize: 12 }}>
              {[
                ['⌘⇧P', 'open command palette'],
                ['⌘N',  'new scan'],
                ['⌘B',  'open last build'],
                ['⌘L',  'open the spec'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'grid', gridTemplateColumns: '70px 1fr', padding: '8px 12px', border: `1px solid ${DTok.rule}`, background: DTok.surface }}>
                  <span style={{ color: DTok.cobalt, fontWeight: 600 }}>{k}</span>
                  <span style={{ color: DTok.ink1 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 18, padding: '12px 14px', background: DTok.surface, border: `1px solid ${DTok.rule}`, fontFamily: DTok.mono, fontSize: 12, color: DTok.ink2 }}>
              <span style={{ color: DTok.ink3 }}>tip · </span>everything Argus knows lives in <span style={{ color: DTok.cobalt }}>localStorage</span>. Refresh-safe. Close-safe. Not synced.
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
              <input placeholder="paste an endpoint…" style={{ flex: 1, padding: '11px 14px', fontFamily: DTok.mono, fontSize: 13, border: `1px solid ${DTok.ink3}`, background: DTok.surface1, boxSizing: 'border-box' }} />
              <button style={{ fontFamily: DTok.sans, fontSize: 13.5, fontWeight: 700, padding: '11px 18px', background: DTok.cobalt, color: DTok.surface1, border: 'none' }}>Scan ↵</button>
            </div>
          </div>

          <div style={{ padding: '36px 36px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: DTok.mono, fontSize: 10.5, color: DTok.ink0, background: DTok.cobalt, padding: '3px 8px', alignSelf: 'flex-start', color: DTok.surface1, letterSpacing: '0.12em' }}>ABORTED · SCN-0143</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: DTok.ink0, letterSpacing: '-0.02em', marginTop: 12, lineHeight: 1 }}>
              Connection refused.
            </div>
            <div style={{ fontSize: 14, color: DTok.ink2, marginTop: 8 }}>Argus made three attempts. The endpoint did not respond.</div>

            <div style={{ marginTop: 18, padding: 16, background: DTok.surface, border: `1px solid ${DTok.rule}`, fontFamily: DTok.mono, fontSize: 12, color: DTok.ink1, lineHeight: 1.7 }}>
              <div><span style={{ color: DTok.ink3 }}>endpoint  </span>localhost:3845/mcp</div>
              <div><span style={{ color: DTok.ink3 }}>transport </span>HTTP+SSE</div>
              <div><span style={{ color: DTok.ink3 }}>cause     </span>ECONNREFUSED</div>
              <div><span style={{ color: DTok.ink3 }}>attempts  </span>3 of 3 · back-off 100/400/1600 ms</div>
              <div style={{ marginTop: 4, color: DTok.ink3 }}># initialize handshake never completed</div>
            </div>

            <div style={{ marginTop: 18, fontFamily: DTok.mono, fontSize: 10, letterSpacing: '0.16em', color: DTok.ink3 }}>TRY</div>
            <div style={{ marginTop: 4, fontFamily: DTok.mono, fontSize: 12, color: DTok.ink1, lineHeight: 1.8 }}>
              <span style={{ color: DTok.cobalt }}>▸</span> confirm the server is up on that port<br />
              <span style={{ color: DTok.cobalt }}>▸</span> check transport — your server may speak stdio only<br />
              <span style={{ color: DTok.cobalt }}>▸</span> re-scan with <span style={{ color: DTok.cobalt }}>--debug</span> to capture the handshake
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
              <button style={{ fontFamily: DTok.sans, fontSize: 13.5, fontWeight: 700, padding: '11px 18px', background: DTok.cobalt, color: DTok.surface1, border: 'none' }}>Retry ↵</button>
              <button style={{ fontFamily: DTok.sans, fontSize: 13.5, padding: '11px 18px', background: DTok.surface, color: DTok.ink1, border: `1px solid ${DTok.rule}` }}>Edit endpoint</button>
            </div>
          </div>
        </div>
      </div>
      <DFoot left="● ECONNREFUSED" right="3 attempts · last 14:31:08" />
    </div>
  );
}

Object.assign(window, {
  D_Brand, D_Home, D_TestInput, D_Scanning, D_Results, D_Drill,
  D_BuildCanvas, D_BuildGen, D_Learn, D_States, D_Rationale,
});
