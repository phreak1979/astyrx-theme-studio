import { useMemo, useState } from 'react';
import { UNGROUPED } from '../core/impact-engine';
import { currentRoute } from '../core/impact-index';
import { describeElement, plural } from './common';
import { useImpactIndex, useSession, useUi } from './hooks';

export function ImpactPanel() {
  const session = useSession();
  const ui = useUi();
  const index = useImpactIndex();
  const [pick, setPick] = useState('');
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const tokens = useMemo(() => session.registry.entries.map((e) => e.name), [session.registry]);
  const { impact, impactToken } = ui;
  const known = impactToken ? session.impactIndex.routesFor(impactToken) : [];
  void index; // re-render when the observed index changes
  const total = known.reduce((n, r) => n + r.count, 0);

  return (
    <div className="stack">
      <div className="row">
        <input list="ats-token-list" placeholder="Token, e.g. --color-background-surface" aria-label="Token to analyse" value={pick} onChange={(e) => setPick(e.target.value)} />
        <datalist id="ats-token-list">
          {tokens.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        <button className="primary" disabled={!session.registry.byName.has(pick)} onClick={() => session.showImpact(pick)}>
          Show
        </button>
      </div>
      {!impactToken && <div className="muted">Pick a token, or press “Show Impact” on any token, to highlight the elements that use it on this page.</div>}

      {impactToken && impact && (
        <>
          <div className="card">
            <h4 style={{ fontFamily: 'ui-monospace, monospace' }}>{impactToken}</h4>
            <div>
              <strong>Visible impact</strong> <span className="muted">(current page)</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{plural(impact.total, 'element')} affected</div>
            <div className="muted small">
              Counted via {impact.variables.length > 1 ? `${impact.variables.length} variables (incl. aliases)` : 'direct references'} in {impact.durationMs.toFixed(0)}ms.
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <label style={{ display: 'flex', gap: 6, margin: 0, textTransform: 'none', letterSpacing: 0, fontSize: 12 }}>
                <input type="checkbox" checked={ui.dimOthers} onChange={(e) => session.setDim(e.target.checked)} /> Dim others
              </label>
              <span className="grow" />
              <button onClick={() => session.runImpact(true)}>Refresh</button>
              <button onClick={() => session.stopImpact()}>Stop</button>
            </div>
          </div>

          <div className="row">
            <button onClick={() => session.verifyImpact()} title="Slower cross-check: changes the token temporarily and compares computed styles">
              Verify
            </button>
            {ui.verify && (
              <span className="muted small" data-testid="verify">
                Cross-check: {ui.verify.changing} of {impact.total} listed elements change right now; the other {ui.verify.stateOnly} use it only in hover, focus, pressed or similar states.
                {ui.verify.extra.length > 0 && ` ${ui.verify.extra.length} more change through inheritance or styles the scan could not read (blue).`}
              </span>
            )}
          </div>

          {impact.unreadableSheets > 0 && (
            <div className="banner warn">
              {plural(impact.unreadableSheets, 'stylesheet')} could not be read. Counts are what was observed, not a complete list.
            </div>
          )}

          <div>
            {impact.groups.map((g) => (
              <div key={g.name}>
                <button className="group-btn" aria-expanded={openGroup === g.name} onClick={() => setOpenGroup(openGroup === g.name ? null : g.name)}>
                  <span>{g.name === UNGROUPED ? g.name : g.name}</span>
                  <strong>{g.count}</strong>
                </button>
                {openGroup === g.name &&
                  g.elements.slice(0, 100).map((el, i) => (
                    <button key={i} className="el-btn" onClick={() => session.focusElement(el)} title="Scroll to and highlight">
                      {describeElement(el)}
                    </button>
                  ))}
                {openGroup === g.name && g.elements.length > 100 && <div className="muted small">+{g.elements.length - 100} more</div>}
              </div>
            ))}
          </div>

          <div className="card">
            <h4>Known application impact</h4>
            <div className="muted small">Only routes you have visited while this token was analysed. Routes not listed are unknown, not unaffected.</div>
            <table style={{ marginTop: 6 }}>
              <tbody>
                {known.map((r) => (
                  <tr key={r.route}>
                    <td>
                      {r.route} {r.route === currentRoute() && <span className="chip">here</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="muted small">{total} observed uses</div>
          </div>
        </>
      )}
      <button className="ghost small" onClick={() => session.impactIndex.clear()}>
        Clear observed routes
      </button>
    </div>
  );
}
