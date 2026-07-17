// App: hosts the canvas with 4 directions. Each section contains
// one rationale card + ~9 surface artboards.

const W = 1280, H = 800;          // hero dense screens
const SMALL = { w: 720, h: 520 }; // brand + rationale
const MID = { w: 1100, h: 700 };  // input + generation

function Placeholder({ label }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"JetBrains Mono", monospace', fontSize: 13,
      color: '#a09a8e', background: 'repeating-linear-gradient(135deg, #f4efe2 0 12px, #efeadc 12px 13px)',
    }}>{label}</div>
  );
}

function App() {
  return (
    <DesignCanvas>

      {/* ════════════════ DIRECTION A · TELEMETRY ════════════════ */}
      <DCSection id="A" title="A · Telemetry"
        subtitle="Instrument-panel chrome · IBM Plex Mono · amber accent reserved for live state">
        <DCArtboard id="a-rationale" label="Rationale" width={SMALL.w} height={SMALL.h}><A_Rationale /></DCArtboard>
        <DCArtboard id="a-brand"     label="Brand"     width={SMALL.w} height={SMALL.h}><A_Brand /></DCArtboard>
        <DCArtboard id="a-home"      label="Home"      width={W} height={H}><A_Home /></DCArtboard>
        <DCArtboard id="a-test-in"   label="Test · Input"     width={MID.w} height={MID.h}><A_TestInput /></DCArtboard>
        <DCArtboard id="a-scan"      label="Test · Scanning ★" width={W} height={H}><A_Scanning /></DCArtboard>
        <DCArtboard id="a-results"   label="Test · Results ★"  width={W} height={H}><A_Results /></DCArtboard>
        <DCArtboard id="a-drill"     label="Test · Drill-in ★" width={W} height={H}><A_Drill /></DCArtboard>
        <DCArtboard id="a-build"     label="Build · Canvas ★"  width={W} height={H}><A_BuildCanvas /></DCArtboard>
        <DCArtboard id="a-gen"       label="Build · Generation" width={MID.w} height={MID.h}><A_BuildGen /></DCArtboard>
        <DCArtboard id="a-learn"     label="Learn"     width={W} height={H}><A_Learn /></DCArtboard>
        <DCArtboard id="a-states"    label="Empty + Error" width={W} height={H}><A_States /></DCArtboard>
      </DCSection>

      {/* ════════════════ DIRECTION B · CODEX ════════════════ */}
      <DCSection id="B" title="B · Codex"
        subtitle="Forensic ledger · Newsreader serif + JetBrains Mono · oxblood reserved for failure">
        <DCArtboard id="b-rationale" label="Rationale" width={SMALL.w} height={SMALL.h}>
          {typeof B_Rationale !== 'undefined' ? <B_Rationale /> : <Placeholder label="B · Rationale" />}
        </DCArtboard>
        <DCArtboard id="b-brand"     label="Brand"     width={SMALL.w} height={SMALL.h}>
          {typeof B_Brand !== 'undefined' ? <B_Brand /> : <Placeholder label="B · Brand" />}
        </DCArtboard>
        <DCArtboard id="b-home"      label="Home"      width={W} height={H}>
          {typeof B_Home !== 'undefined' ? <B_Home /> : <Placeholder label="B · Home" />}
        </DCArtboard>
        <DCArtboard id="b-test-in"   label="Test · Input"     width={MID.w} height={MID.h}>
          {typeof B_TestInput !== 'undefined' ? <B_TestInput /> : <Placeholder label="B · Test Input" />}
        </DCArtboard>
        <DCArtboard id="b-scan"      label="Test · Scanning ★" width={W} height={H}>
          {typeof B_Scanning !== 'undefined' ? <B_Scanning /> : <Placeholder label="B · Scanning" />}
        </DCArtboard>
        <DCArtboard id="b-results"   label="Test · Results ★"  width={W} height={H}>
          {typeof B_Results !== 'undefined' ? <B_Results /> : <Placeholder label="B · Results" />}
        </DCArtboard>
        <DCArtboard id="b-drill"     label="Test · Drill-in ★" width={W} height={H}>
          {typeof B_Drill !== 'undefined' ? <B_Drill /> : <Placeholder label="B · Drill-in" />}
        </DCArtboard>
        <DCArtboard id="b-build"     label="Build · Canvas ★"  width={W} height={H}>
          {typeof B_BuildCanvas !== 'undefined' ? <B_BuildCanvas /> : <Placeholder label="B · Build Canvas" />}
        </DCArtboard>
        <DCArtboard id="b-gen"       label="Build · Generation" width={MID.w} height={MID.h}>
          {typeof B_BuildGen !== 'undefined' ? <B_BuildGen /> : <Placeholder label="B · Build Gen" />}
        </DCArtboard>
        <DCArtboard id="b-learn"     label="Learn"     width={W} height={H}>
          {typeof B_Learn !== 'undefined' ? <B_Learn /> : <Placeholder label="B · Learn" />}
        </DCArtboard>
        <DCArtboard id="b-states"    label="Empty + Error" width={W} height={H}>
          {typeof B_States !== 'undefined' ? <B_States /> : <Placeholder label="B · States" />}
        </DCArtboard>
      </DCSection>

      {/* ════════════════ DIRECTION C · LATTICE ════════════════ */}
      <DCSection id="C" title="C · Lattice"
        subtitle="Matrix-first · all 243 checks visible at once · signal green for pass">
        <DCArtboard id="c-rationale" label="Rationale" width={SMALL.w} height={SMALL.h}>
          {typeof C_Rationale !== 'undefined' ? <C_Rationale /> : <Placeholder label="C · Rationale" />}
        </DCArtboard>
        <DCArtboard id="c-brand"     label="Brand"     width={SMALL.w} height={SMALL.h}>
          {typeof C_Brand !== 'undefined' ? <C_Brand /> : <Placeholder label="C · Brand" />}
        </DCArtboard>
        <DCArtboard id="c-home"      label="Home"      width={W} height={H}>
          {typeof C_Home !== 'undefined' ? <C_Home /> : <Placeholder label="C · Home" />}
        </DCArtboard>
        <DCArtboard id="c-test-in"   label="Test · Input"     width={MID.w} height={MID.h}>
          {typeof C_TestInput !== 'undefined' ? <C_TestInput /> : <Placeholder label="C · Test Input" />}
        </DCArtboard>
        <DCArtboard id="c-scan"      label="Test · Scanning ★" width={W} height={H}>
          {typeof C_Scanning !== 'undefined' ? <C_Scanning /> : <Placeholder label="C · Scanning" />}
        </DCArtboard>
        <DCArtboard id="c-results"   label="Test · Results ★"  width={W} height={H}>
          {typeof C_Results !== 'undefined' ? <C_Results /> : <Placeholder label="C · Results" />}
        </DCArtboard>
        <DCArtboard id="c-drill"     label="Test · Drill-in ★" width={W} height={H}>
          {typeof C_Drill !== 'undefined' ? <C_Drill /> : <Placeholder label="C · Drill-in" />}
        </DCArtboard>
        <DCArtboard id="c-build"     label="Build · Canvas ★"  width={W} height={H}>
          {typeof C_BuildCanvas !== 'undefined' ? <C_BuildCanvas /> : <Placeholder label="C · Build Canvas" />}
        </DCArtboard>
        <DCArtboard id="c-gen"       label="Build · Generation" width={MID.w} height={MID.h}>
          {typeof C_BuildGen !== 'undefined' ? <C_BuildGen /> : <Placeholder label="C · Build Gen" />}
        </DCArtboard>
        <DCArtboard id="c-learn"     label="Learn"     width={W} height={H}>
          {typeof C_Learn !== 'undefined' ? <C_Learn /> : <Placeholder label="C · Learn" />}
        </DCArtboard>
        <DCArtboard id="c-states"    label="Empty + Error" width={W} height={H}>
          {typeof C_States !== 'undefined' ? <C_States /> : <Placeholder label="C · States" />}
        </DCArtboard>
      </DCSection>

      {/* ════════════════ DIRECTION D · WORKBENCH ════════════════ */}
      <DCSection id="D" title="D · Workbench"
        subtitle="Spatial node-graph for Build · diff-style grade reveal · cobalt accent">
        <DCArtboard id="d-rationale" label="Rationale" width={SMALL.w} height={SMALL.h}>
          {typeof D_Rationale !== 'undefined' ? <D_Rationale /> : <Placeholder label="D · Rationale" />}
        </DCArtboard>
        <DCArtboard id="d-brand"     label="Brand"     width={SMALL.w} height={SMALL.h}>
          {typeof D_Brand !== 'undefined' ? <D_Brand /> : <Placeholder label="D · Brand" />}
        </DCArtboard>
        <DCArtboard id="d-home"      label="Home"      width={W} height={H}>
          {typeof D_Home !== 'undefined' ? <D_Home /> : <Placeholder label="D · Home" />}
        </DCArtboard>
        <DCArtboard id="d-test-in"   label="Test · Input"     width={MID.w} height={MID.h}>
          {typeof D_TestInput !== 'undefined' ? <D_TestInput /> : <Placeholder label="D · Test Input" />}
        </DCArtboard>
        <DCArtboard id="d-scan"      label="Test · Scanning ★" width={W} height={H}>
          {typeof D_Scanning !== 'undefined' ? <D_Scanning /> : <Placeholder label="D · Scanning" />}
        </DCArtboard>
        <DCArtboard id="d-results"   label="Test · Results ★"  width={W} height={H}>
          {typeof D_Results !== 'undefined' ? <D_Results /> : <Placeholder label="D · Results" />}
        </DCArtboard>
        <DCArtboard id="d-drill"     label="Test · Drill-in ★" width={W} height={H}>
          {typeof D_Drill !== 'undefined' ? <D_Drill /> : <Placeholder label="D · Drill-in" />}
        </DCArtboard>
        <DCArtboard id="d-build"     label="Build · Canvas ★"  width={W} height={H}>
          {typeof D_BuildCanvas !== 'undefined' ? <D_BuildCanvas /> : <Placeholder label="D · Build Canvas" />}
        </DCArtboard>
        <DCArtboard id="d-gen"       label="Build · Generation" width={MID.w} height={MID.h}>
          {typeof D_BuildGen !== 'undefined' ? <D_BuildGen /> : <Placeholder label="D · Build Gen" />}
        </DCArtboard>
        <DCArtboard id="d-learn"     label="Learn"     width={W} height={H}>
          {typeof D_Learn !== 'undefined' ? <D_Learn /> : <Placeholder label="D · Learn" />}
        </DCArtboard>
        <DCArtboard id="d-states"    label="Empty + Error" width={W} height={H}>
          {typeof D_States !== 'undefined' ? <D_States /> : <Placeholder label="D · States" />}
        </DCArtboard>
      </DCSection>

    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
