import { useEffect, useState, type ReactNode } from 'react';
import { parseColor } from '../core/contrast';
import { validateValue } from '../core/validators';
import type { Side } from '../core/theme-state';
import type { TokenEntry } from '../core/token-registry';
import { useSession, useTheme } from './hooks';

function toHex(value: string): string | null {
  const c = parseColor(value);
  if (!c) return null;
  const h = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

function alphaSuffix(value: string): string {
  const c = parseColor(value);
  return c && c.a < 1 ? Math.round(c.a * 255).toString(16).padStart(2, '0') : '';
}

export function Swatch({ value }: { value: string }) {
  return (
    <span className="swatch" aria-hidden="true">
      <i style={{ background: value }} />
    </span>
  );
}

const UNITS = ['px', 'rem', 'em', '%', 'vh', 'vw'];
const DURATION_UNITS = ['ms', 's'];
const EASINGS = ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'cubic-bezier(0.24, 1, 0.4, 1)'];
const WEIGHTS = ['100', '200', '300', '400', '500', '600', '700', '800', '900', 'normal', 'bold'];

function splitUnit(v: string): { n: string; unit: string } | null {
  const m = /^(-?(?:\d+\.?\d*|\.\d+))([a-z%]*)$/i.exec(v.trim());
  return m ? { n: m[1]!, unit: m[2]! } : null;
}

interface ValueEditorProps {
  entry: TokenEntry;
  side: Side;
  value: string;
  original: string;
  label?: string;
}

/** One editable value. Valid drafts apply live; invalid drafts show an error and leave the app untouched. */
export function ValueEditor({ entry, side, value, original, label }: ValueEditorProps) {
  const { store } = useSession();
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setDraft(value);
    setError(null);
  }, [value]);

  const commit = (v: string) => {
    setDraft(v);
    const res = store.setValue(entry.name, side, v, `${entry.name}:${side}`);
    setError(res.ok ? null : res.error ?? 'Invalid value');
  };

  const helper = (): ReactNode => {
    switch (entry.type) {
      case 'color': {
        const hex = toHex(value);
        return (
          <input
            type="color"
            aria-label={`${entry.name} ${label ?? ''} colour picker`}
            value={hex ?? '#000000'}
            disabled={!hex}
            title={hex ? 'Pick a colour' : 'Value is not a plain colour; edit as text'}
            onChange={(e) => commit(e.target.value.toUpperCase() + alphaSuffix(value).toUpperCase())}
          />
        );
      }
      case 'length':
      case 'duration': {
        const parts = splitUnit(value);
        if (!parts) return null;
        const units = entry.type === 'duration' ? DURATION_UNITS : UNITS;
        return (
          <>
            <input
              type="number"
              style={{ width: 70 }}
              aria-label={`${entry.name} number`}
              step={parts.unit === 'rem' || parts.unit === 'em' || parts.unit === 's' ? 0.05 : 1}
              value={parts.n}
              onChange={(e) => e.target.value !== '' && commit(`${e.target.value}${parts.unit}`)}
            />
            <select style={{ width: 62 }} aria-label={`${entry.name} unit`} value={parts.unit} onChange={(e) => commit(`${parts.n}${e.target.value}`)}>
              {!units.includes(parts.unit) && <option value={parts.unit}>{parts.unit || '—'}</option>}
              {units.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </>
        );
      }
      case 'font-weight':
        return (
          <select style={{ width: 84 }} aria-label={`${entry.name} weight`} value={WEIGHTS.includes(value) ? value : ''} onChange={(e) => e.target.value && commit(e.target.value)}>
            <option value="">custom</option>
            {WEIGHTS.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
        );
      case 'easing':
        return (
          <select style={{ width: 110 }} aria-label={`${entry.name} preset`} value={EASINGS.includes(value) ? value : ''} onChange={(e) => e.target.value && commit(e.target.value)}>
            <option value="">custom</option>
            {EASINGS.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
        );
      case 'enum':
        return (
          <select style={{ width: 110 }} aria-label={`${entry.name} options`} value={entry.enumValues?.includes(value) ? value : ''} onChange={(e) => e.target.value && commit(e.target.value)}>
            <option value="">custom</option>
            {entry.enumValues?.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  const check = validateValue(entry.type, draft, entry.enumValues);
  const invalid = !!error || !check.ok;
  const multiline = entry.type === 'shadow' && draft.length > 40;

  return (
    <div className="side">
      {label && <label>{label}</label>}
      <div className="row">
        {entry.type === 'color' && <Swatch value={draft} />}
        {helper()}
        {multiline ? (
          <textarea className={invalid ? 'invalid' : ''} rows={2} value={draft} aria-label={`${entry.name} ${label ?? 'value'}`} onChange={(e) => commit(e.target.value)} />
        ) : (
          <input
            type="text"
            spellCheck={false}
            className={invalid ? 'invalid' : ''}
            value={draft}
            aria-label={`${entry.name} ${label ?? 'value'}`}
            aria-invalid={invalid}
            onChange={(e) => commit(e.target.value)}
          />
        )}
      </div>
      {invalid && <div className="err">{error ?? check.error}</div>}
      {value !== original && <div className="muted small">Original: {original}</div>}
    </div>
  );
}

export function TokenEditor({ entry }: { entry: TokenEntry }) {
  const session = useSession();
  const { store } = session;
  const theme = useTheme();
  const orig = store.getOriginal(entry.name)!;
  const work = store.getWorking(entry.name)!;
  const modified = entry.name in theme.overrides;

  return (
    <div className="editor">
      {entry.description && <div className="muted small" style={{ marginBottom: 6 }}>{entry.description}</div>}
      {entry.modeSpecific ? (
        <>
          <ValueEditor entry={entry} side="light" label="Light" value={work.light} original={orig.light} />
          <ValueEditor entry={entry} side="dark" label="Dark" value={work.dark} original={orig.dark} />
        </>
      ) : (
        <ValueEditor entry={entry} side="both" value={work.light} original={orig.light} />
      )}
      <div className="row">
        <button onClick={() => session.showImpact(entry.name)}>Show Impact</button>
        <button disabled={!modified} onClick={() => store.resetToken(entry.name)}>
          Reset
        </button>
        <span className="grow" />
        <span className="chip">{entry.type}</span>
      </div>
    </div>
  );
}

export function TokenRow({
  entry,
  open,
  onToggle,
  hint,
}: {
  entry: TokenEntry;
  open: boolean;
  onToggle: () => void;
  hint?: string;
}) {
  const { store } = useSession();
  const theme = useTheme();
  const modified = entry.name in theme.overrides;
  const work = store.getWorking(entry.name)!;
  const shown = work[theme.mode];
  return (
    <div className={`tok${open ? ' open' : ''}`} data-token={entry.name}>
      <button className="tok-row" onClick={onToggle} aria-expanded={open} title={hint}>
        <span className={`dot${modified ? ' on' : ''}`} title={modified ? 'Modified' : undefined} />
        {entry.type === 'color' && <Swatch value={shown} />}
        <span className="tok-name">{entry.name}</span>
        <span className="tok-val">{shown}</span>
      </button>
      {open && <TokenEditor entry={entry} />}
    </div>
  );
}
