import { useMemo, useState } from 'react';
import type { ComponentGroup } from '../inspector/component-scan';
import { inspectElement } from '../inspector/token-detector';
import { describeElement, plural } from './common';
import { useSession, useUi } from './hooks';
import { TokenGroups } from './InspectPanel';

const MAX_INSTANCES = 100;

export function ComponentsPanel() {
  const session = useSession();
  const { scan } = useUi();
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  return (
    <div className="stack">
      <div className="row">
        <span className="muted small" data-testid="components-total">
          {scan ? `${plural(scan.groups.length, 'component')} · ${plural(scan.total, 'instance')}` : 'Not scanned yet'}
        </span>
        <span className="grow" />
        <button onClick={() => session.scanComponents()} title="Scan the current page again">
          Rescan
        </button>
      </div>

      {scan && scan.groups.length === 0 && <div className="muted">No Astryx components were found on this page.</div>}

      <div>
        {scan?.groups.map((g) => (
          <ComponentRow key={g.stableClass} group={g} open={openGroup === g.stableClass} onToggle={() => setOpenGroup(openGroup === g.stableClass ? null : g.stableClass)} />
        ))}
      </div>

      <div className="muted small">Only elements with a stable astryx-* class are listed. Anything else on the page is not an identified Astryx component.</div>
    </div>
  );
}

function ComponentRow({ group, open, onToggle }: { group: ComponentGroup; open: boolean; onToggle: () => void }) {
  return (
    <div data-component={group.stableClass}>
      <button className="group-btn" aria-expanded={open} onClick={onToggle}>
        <span>{group.name}</span>
        <strong>{group.count}</strong>
      </button>
      {open && <ComponentDetail group={group} />}
    </div>
  );
}

function ComponentDetail({ group }: { group: ComponentGroup }) {
  const session = useSession();
  const [showInstances, setShowInstances] = useState(false);
  const [showTokens, setShowTokens] = useState(false);

  const focus = (el: Element) => {
    // The page may have re-rendered since the last scan; refresh rather than point at a detached node.
    if (!el.isConnected) session.scanComponents();
    else session.focusElement(el);
  };

  return (
    <div className="card" style={{ marginTop: 4 }}>
      <div className="muted small">{group.stableClass}</div>
      {group.props.length > 0 && (
        <dl className="kv" style={{ marginTop: 6 }}>
          {group.props.map((p) => (
            <div key={p.prop} style={{ display: 'contents' }}>
              <dt>{p.prop}</dt>
              <dd>
                {p.values.map((v) => `${v.value}×${v.count}`).join(', ')}
                {p.more > 0 ? `, +${p.more} more` : ''}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {group.parts.length > 0 && <div className="muted small" style={{ marginTop: 6 }}>Parts seen: {group.parts.join(', ')}</div>}

      <div className="row" style={{ marginTop: 8 }}>
        <button aria-expanded={showInstances} onClick={() => setShowInstances(!showInstances)}>
          Instances ({group.count})
        </button>
        <button aria-expanded={showTokens} onClick={() => setShowTokens(!showTokens)}>
          Theme tokens
        </button>
        <button onClick={() => session.selectElement(group.elements[0]!)} title="Open the first instance in the Inspect tab">
          Inspect
        </button>
      </div>

      {showInstances && (
        <div>
          {group.elements.slice(0, MAX_INSTANCES).map((el, i) => (
            <button key={i} className="el-btn" onClick={() => focus(el)} title="Scroll to and highlight">
              {describeElement(el)}
            </button>
          ))}
          {group.elements.length > MAX_INSTANCES && <div className="muted small">+{group.elements.length - MAX_INSTANCES} more</div>}
        </div>
      )}

      {showTokens && <ComponentTokens group={group} />}
    </div>
  );
}

/** Computed only when expanded: it scans stylesheets, which is too costly to do for every row up front. */
function ComponentTokens({ group }: { group: ComponentGroup }) {
  const session = useSession();
  const first = group.elements[0]!;
  const report = useMemo(() => inspectElement(first, session.impact.getIndex(), session.registry), [first, session]);
  return (
    <div style={{ marginTop: 8 }}>
      <h4 style={{ margin: '0 0 4px' }}>Theme tokens used ({report.tokens.length})</h4>
      <div className="muted small">From the first instance. Edits change the global theme.</div>
      <TokenGroups report={report} />
      {report.unreadableSheets > 0 && <div className="banner warn">{plural(report.unreadableSheets, 'stylesheet')} could not be read (cross-origin). Results may be incomplete.</div>}
    </div>
  );
}
