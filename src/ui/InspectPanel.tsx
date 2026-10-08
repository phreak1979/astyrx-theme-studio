import { useState } from 'react';
import { CATEGORY_LABELS, CATEGORY_ORDER, type TokenCategory, type TokenEntry } from '../core/token-registry';
import { KIND_LABELS, type ElementReport, type PropertyKind } from '../inspector/token-detector';
import { describeElement } from './common';
import { useSession, useUi } from './hooks';
import { TokenRow } from './TokenEditor';

const KIND_ORDER: PropertyKind[] = ['theme-token', 'component-prop', 'astryx-internal', 'application-style', 'unattributed'];
const KIND_BADGE: Record<PropertyKind, string> = {
  'theme-token': 'token',
  'component-prop': '',
  'astryx-internal': 'internal',
  'application-style': 'app',
  unattributed: '',
};

export function InspectPanel() {
  const session = useSession();
  const ui = useUi();
  const { component, report, rootReport, selected } = ui;

  return (
    <div className="stack">
      <div className="row">
        <button className="primary" aria-pressed={ui.inspecting} onClick={() => session.toggleInspect()}>
          ◎ {ui.inspecting ? 'Inspecting… (Esc to exit)' : 'Inspect'}
        </button>
        {selected && (
          <button onClick={() => session.clearSelection()} title="Clear selection">
            Clear
          </button>
        )}
      </div>
      {!selected && <div className="muted">Turn on Inspect, then click any element in your app to see the Astryx tokens that style it.</div>}

      {selected && component && (
        <div className="card">
          <h4>{component.identified ? component.name : 'Not identified'}</h4>
          <div className="muted small">{component.note}</div>
          <dl className="kv" style={{ marginTop: 6 }}>
            <dt>Element</dt>
            <dd>{describeElement(selected)}</dd>
            {component.stableClass && (
              <>
                <dt>Class</dt>
                <dd>{component.stableClass}</dd>
              </>
            )}
            {Object.entries(component.props).map(([k, v]) => (
              <div key={k} style={{ display: 'contents' }}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {selected && report && (
        <>
          <ReportView report={report} heading={component?.isPart ? 'This element' : undefined} />
          {rootReport && component?.root && (
            <>
              <h4 style={{ margin: '14px 0 0' }}>Component: {component.name}</h4>
              <div className="muted small">{describeElement(component.root)}</div>
              <ReportView report={rootReport} />
            </>
          )}
          {report.unreadableSheets > 0 && <div className="banner warn">{report.unreadableSheets} stylesheet(s) could not be read (cross-origin). Results may be incomplete.</div>}
        </>
      )}
    </div>
  );
}

/** The theme tokens a report found, grouped by category, each editable in place. */
export function TokenGroups({ report }: { report: ElementReport }) {
  const session = useSession();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const byCat = new Map<TokenCategory, { entry: TokenEntry; props: string[] }[]>();
  for (const t of report.tokens) {
    const entry = session.registry.byName.get(t.token);
    if (!entry) continue;
    if (!byCat.has(entry.category)) byCat.set(entry.category, []);
    byCat.get(entry.category)!.push({ entry, props: t.properties });
  }
  return (
    <>
      {report.tokens.length === 0 && <div className="muted">No Astryx theme tokens were detected for this element.</div>}
      {CATEGORY_ORDER.filter((c) => byCat.has(c)).map((c) => (
        <section key={c}>
          <label>{CATEGORY_LABELS[c]}</label>
          {byCat.get(c)!.map(({ entry, props }) => (
            <TokenRow
              key={entry.name}
              entry={entry}
              hint={`Used by: ${props.join(', ')}`}
              open={open.has(entry.name)}
              onToggle={() =>
                setOpen((s) => {
                  const n = new Set(s);
                  if (n.has(entry.name)) n.delete(entry.name);
                  else n.add(entry.name);
                  return n;
                })
              }
            />
          ))}
        </section>
      ))}
    </>
  );
}

function ReportView({ report, heading }: { report: ElementReport; heading?: string }) {
  return (
    <>
      <h4 style={{ margin: '8px 0 0' }}>
        {heading ? `${heading}: ` : ''}Theme tokens ({report.tokens.length})
      </h4>
      <TokenGroups report={report} />

      <details>
        <summary>All properties ({report.properties.length})</summary>
        <div className="muted small">Only theme tokens are editable or exported. Everything else is shown for context.</div>
        {KIND_ORDER.map((kind) => {
          const list = report.properties.filter((p) => p.kind === kind);
          if (!list.length) return null;
          const label = KIND_LABELS[kind];
          return (
            <details key={kind}>
              <summary>
                {kind === 'astryx-internal' ? '🔒 ' : ''}
                {label.label} ({list.length}) <span className={`badge ${KIND_BADGE[kind]}`}>{label.note}</span>
              </summary>
              <table>
                <tbody>
                  {list.map((p, i) => (
                    <tr key={i}>
                      <td>{p.property}</td>
                      <td className="muted">{p.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          );
        })}
      </details>
    </>
  );
}
