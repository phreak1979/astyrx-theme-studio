import { useMemo, useRef, useState } from 'react';
import { validateTheme } from '../core/validation';
import { generateThemeTs, buildTokenMap, type ExportInput, type ExportScope } from '../exporters/astryx';
import { diffImport, parseThemeJson, stringifyThemeJson, type DiffRow, type ParsedImport } from '../exporters/json';
import { buildExportPackage, type ExportFile } from '../exporters/package';
import { CATEGORY_LABELS } from '../core/token-registry';
import { plural } from './common';
import { useSession, useTheme } from './hooks';

function download(file: ExportFile): void {
  const url = URL.createObjectURL(new Blob([file.content], { type: file.mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export function ExportPanel() {
  const session = useSession();
  const { store, registry } = session;
  const theme = useTheme();
  const [scope, setScope] = useState<ExportScope>('modified');
  const [strictA11y, setStrictA11y] = useState(false);
  const [notice, setNotice] = useState('');
  const [importText, setImportText] = useState('');
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [diff, setDiff] = useState<DiffRow[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const input: ExportInput = useMemo(
    () => ({ registry, overrides: theme.overrides, getWorking: (t) => store.getWorking(t), meta: theme.meta, astryxVersion: session.astryxVersion, scope }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registry, theme.overrides, theme.meta, scope, session.astryxVersion],
  );
  const health = useMemo(
    () => validateTheme({ registry, overrides: theme.overrides, getWorking: (t) => store.getWorking(t), meta: theme.meta, astryxVersion: session.astryxVersion, strictA11y }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registry, theme.overrides, theme.meta, session.astryxVersion, strictA11y],
  );
  const code = useMemo(() => (health.ready ? generateThemeTs(input) : ''), [health.ready, input]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of Object.keys(buildTokenMap(input))) {
      const cat = registry.byName.get(t)?.category ?? 'other';
      c[cat] = (c[cat] ?? 0) + 1;
    }
    return c;
  }, [input, registry]);
  const tokenCount = Object.keys(buildTokenMap(input)).length;
  const flash = (m: string) => {
    setNotice(m);
    setTimeout(() => setNotice(''), 2500);
  };

  const runImport = (text: string) => {
    setImportText(text);
    const p = parseThemeJson(text, registry);
    setParsed(p);
    setDiff(p.ok ? diffImport(theme.overrides, p.overrides, (t) => store.getOriginal(t)) : []);
  };

  const keyDiff = (a: string, b: string) => (a === b ? a : `${a} / ${b}`);
  const lightOk = !health.issues.some((i) => i.severity === 'error' && /light/.test(i.message));
  const darkOk = !health.issues.some((i) => i.severity === 'error' && /dark/.test(i.message));

  return (
    <div className="stack">
      <section className="card">
        <h4>Theme</h4>
        <label htmlFor="ats-name">Theme name</label>
        <input id="ats-name" type="text" value={theme.meta.name} onChange={(e) => store.setMeta({ name: e.target.value })} />
        <label htmlFor="ats-id" style={{ marginTop: 6 }}>Theme ID</label>
        <input id="ats-id" type="text" value={theme.meta.id} onChange={(e) => store.setMeta({ id: e.target.value })} />
        <label htmlFor="ats-desc" style={{ marginTop: 6 }}>Description (optional)</label>
        <input id="ats-desc" type="text" value={theme.meta.description} onChange={(e) => store.setMeta({ description: e.target.value })} />
        <label htmlFor="ats-author" style={{ marginTop: 6 }}>Author (optional)</label>
        <input id="ats-author" type="text" value={theme.meta.author} onChange={(e) => store.setMeta({ author: e.target.value })} />
      </section>

      <section className="card">
        <h4>Theme health</h4>
        <dl className="kv">
          <dt>Astryx compatibility</dt>
          <dd>{health.compat.status === 'compatible' ? '✓' : health.compat.status === 'unknown' ? '? unknown version' : '⚠ unsupported'}</dd>
          <dt>Token values</dt>
          <dd>{health.issues.some((i) => i.code === 'invalid-value' || i.code === 'invalid-pair') ? '✗' : '✓'}</dd>
          <dt>Light theme</dt>
          <dd>{lightOk ? '✓' : '✗'}</dd>
          <dt>Dark theme</dt>
          <dd>{darkOk ? '✓' : '✗'}</dd>
          <dt>Unknown tokens</dt>
          <dd>{health.unknownTokens}</dd>
          <dt>Accessibility warnings</dt>
          <dd>{health.a11yWarnings}</dd>
        </dl>
        {health.issues.map((i, n) => (
          <div key={n} className={`issue ${i.severity}`}>
            <span>{i.severity === 'error' ? '✗' : '⚠'}</span>
            <span>{i.message}</span>
          </div>
        ))}
        <div className="chip" style={{ marginTop: 6 }} data-testid="ready">
          {health.ready ? 'Ready to export' : 'Fix errors to export'}
        </div>
        <label style={{ display: 'flex', gap: 6, marginTop: 8, textTransform: 'none', letterSpacing: 0, fontSize: 12 }}>
          <input type="checkbox" checked={strictA11y} onChange={(e) => setStrictA11y(e.target.checked)} /> Treat contrast failures as errors
        </label>
        <details style={{ marginTop: 6 }}>
          <summary>Contrast checks</summary>
          <table>
            <thead>
              <tr>
                <th>Pair</th>
                <th>Mode</th>
                <th>Ratio</th>
                <th>AA</th>
                <th>AAA</th>
              </tr>
            </thead>
            <tbody>
              {health.contrast.map((r, i) => (
                <tr key={i}>
                  <td>{r.label}</td>
                  <td>{r.mode}</td>
                  <td>{r.ratio === null ? 'n/a' : `${r.ratio.toFixed(1)}:1`}</td>
                  <td>{r.ratio === null ? '' : r.passes ? '✓' : '✗'}</td>
                  <td>{r.aaa === null ? '' : r.aaa ? '✓' : '✗'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <section className="card">
        <h4>Export</h4>
        <div className="muted small">
          {theme.meta.name} · Astryx {session.astryxVersion ?? 'version unknown'} · {plural(tokenCount, 'token')}
        </div>
        <div className="chips" style={{ margin: '6px 0' }}>
          {Object.entries(counts).map(([c, n]) => (
            <span key={c} className="chip">
              {CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS]} {n}
            </span>
          ))}
        </div>
        <div className="row" role="radiogroup" aria-label="Export scope">
          <label style={{ display: 'flex', gap: 4, margin: 0, textTransform: 'none', letterSpacing: 0, fontSize: 12 }}>
            <input type="radio" name="scope" checked={scope === 'modified'} onChange={() => setScope('modified')} /> Modified tokens only
          </label>
          <label style={{ display: 'flex', gap: 4, margin: 0, textTransform: 'none', letterSpacing: 0, fontSize: 12 }}>
            <input type="radio" name="scope" checked={scope === 'complete'} onChange={() => setScope('complete')} /> Complete resolved theme
          </label>
        </div>
        <div className="row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
          <button className="primary" disabled={!health.ready} onClick={async () => flash((await copy(code)) ? 'Theme code copied' : 'Copy failed')}>
            Copy Theme Code
          </button>
          <button disabled={!health.ready} onClick={() => buildExportPackage(input).slice(0, 1).forEach(download)}>
            Download .ts
          </button>
          <button disabled={!health.ready} onClick={() => download({ name: `${theme.meta.id}.theme.json`, content: stringifyThemeJson(input), mime: 'application/json' })}>
            Download JSON
          </button>
          <button disabled={!health.ready} onClick={() => buildExportPackage(input).forEach((f, i) => setTimeout(() => download(f), i * 150))}>
            Export package
          </button>
        </div>
        {notice && <div className="chip ok" role="status" style={{ marginTop: 6 }}>{notice}</div>}
        {health.ready && (
          <details style={{ marginTop: 8 }} open>
            <summary>Preview</summary>
            <pre className="code" data-testid="code">{code}</pre>
          </details>
        )}
      </section>

      <section className="card">
        <h4>Import theme</h4>
        <div className="row">
          <button onClick={() => fileRef.current?.click()}>Choose JSON file…</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) runImport(await f.text());
              e.target.value = '';
            }}
          />
        </div>
        <textarea rows={3} placeholder="…or paste Theme Studio JSON" style={{ marginTop: 6 }} aria-label="Theme JSON" value={importText} onChange={(e) => runImport(e.target.value)} />
        {parsed && !parsed.ok && (
          <div className="stack" style={{ marginTop: 6 }}>
            {parsed.errors.slice(0, 8).map((e, i) => (
              <div key={i} className="issue error">✗ {e}</div>
            ))}
          </div>
        )}
        {parsed?.ok && (
          <div className="stack" style={{ marginTop: 6 }}>
            {parsed.warnings.map((w, i) => (
              <div key={i} className="issue warning">⚠ {w}</div>
            ))}
            <strong>{plural(diff.length, 'token')} changed</strong>
            <table>
              <tbody>
                {diff.slice(0, 60).map((r) => (
                  <tr key={r.token}>
                    <td>{r.token}</td>
                    <td className="muted">{keyDiff(r.current.light, r.current.dark)}</td>
                    <td>→</td>
                    <td>{keyDiff(r.next.light, r.next.dark)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="row">
              <button
                className="primary"
                disabled={diff.length === 0}
                onClick={() => {
                  store.replaceTheme(parsed.overrides, parsed.meta ? { name: parsed.meta.name ?? theme.meta.name, id: parsed.meta.id ?? theme.meta.id, description: parsed.meta.description ?? '', author: parsed.meta.author ?? '' } : undefined);
                  setParsed(null);
                  setImportText('');
                  flash('Imported (undo available)');
                }}
              >
                Apply
              </button>
              <button onClick={() => { setParsed(null); setImportText(''); }}>Discard</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
