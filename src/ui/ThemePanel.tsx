import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_LABELS, CATEGORY_ORDER, type TokenCategory, type TokenEntry } from '../core/token-registry';
import { Confirm } from './common';
import { useSession, useTheme, useUi } from './hooks';
import { TokenRow } from './TokenEditor';

const SEARCH_CAP = 150;

// Astryx can generate these from scale settings (typography.scale, radius/motion/colour scales).
const GENERATED_NOTE: Partial<Record<TokenCategory, string>> = {
  colors: 'May be generated from a colour scale in your theme. Values set here are exported as explicit tokens and take precedence.',
  typography: 'May be generated from the theme\'s type scale. Values set here are exported as explicit tokens and take precedence.',
  radius: 'May be generated from a radius scale. Values set here are exported as explicit tokens and take precedence.',
  motion: 'May be generated from a motion scale. Values set here are exported as explicit tokens and take precedence.',
};

export function ThemePanel() {
  const session = useSession();
  const { registry, store } = session;
  const theme = useTheme();
  const ui = useUi();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<TokenCategory | 'all'>('all');
  const [onlyModified, setOnlyModified] = useState(false);
  const [openCats, setOpenCats] = useState<Set<TokenCategory>>(new Set(['colors']));
  const [openTokens, setOpenTokens] = useState<Set<string>>(new Set());
  const [confirmCat, setConfirmCat] = useState<TokenCategory | null>(null);
  const [showAll, setShowAll] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Reveal a token requested from elsewhere (e.g. Inspect or Impact).
  useEffect(() => {
    const t = ui.focusToken;
    if (!t) return;
    const entry = registry.byName.get(t);
    if (!entry) return;
    setQuery('');
    setCategory('all');
    setOnlyModified(false);
    setOpenCats((s) => new Set(s).add(entry.category));
    setOpenTokens((s) => new Set(s).add(t));
    session.ui.set({ focusToken: null });
    requestAnimationFrame(() => listRef.current?.querySelector(`[data-token="${CSS.escape(t)}"]`)?.scrollIntoView({ block: 'center' }));
  }, [ui.focusToken, registry, session]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    return registry.entries.filter((e) => {
      if (category !== 'all' && e.category !== category) return false;
      if (onlyModified && !(e.name in theme.overrides)) return false;
      if (!q) return true;
      const w = store.getWorking(e.name);
      return (
        e.name.toLowerCase().includes(q) ||
        CATEGORY_LABELS[e.category].toLowerCase().includes(q) ||
        (e.description ?? '').toLowerCase().includes(q) ||
        (w ? `${w.light} ${w.dark}`.toLowerCase().includes(q) : false)
      );
    });
    // theme.rev ensures value-based search stays current after edits.
  }, [registry, category, onlyModified, q, store, theme.rev, theme.overrides]);

  const grouped = useMemo(() => {
    const m = new Map<TokenCategory, TokenEntry[]>();
    for (const e of filtered) {
      if (!m.has(e.category)) m.set(e.category, []);
      m.get(e.category)!.push(e);
    }
    return CATEGORY_ORDER.filter((c) => m.has(c)).map((c) => [c, m.get(c)!] as const);
  }, [filtered]);

  const searching = !!q || onlyModified || category !== 'all';
  const modifiedByCat = store.modifiedByCategory();
  const toggleToken = (t: string) =>
    setOpenTokens((s) => {
      const n = new Set(s);
      if (n.has(t)) n.delete(t);
      else n.add(t);
      return n;
    });

  let rendered = 0;
  return (
    <div className="stack" ref={listRef}>
      <input type="search" placeholder="Search tokens, categories, values…" aria-label="Search tokens" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="chips" role="group" aria-label="Filter by category">
        <button aria-pressed={category === 'all' && !onlyModified} onClick={() => { setCategory('all'); setOnlyModified(false); }}>
          All {registry.entries.length}
        </button>
        <button aria-pressed={onlyModified} onClick={() => setOnlyModified((v) => !v)}>
          Modified ({theme.modified.length})
        </button>
        {CATEGORY_ORDER.filter((c) => registry.counts[c] > 0).map((c) => (
          <button key={c} aria-pressed={category === c} onClick={() => setCategory(category === c ? 'all' : c)}>
            {CATEGORY_LABELS[c]} {registry.counts[c]}
          </button>
        ))}
      </div>
      <label className="row" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 12 }} title="Also write overrides onto nested <Theme> regions, which otherwise keep their own values">
        <input type="checkbox" checked={theme.applyToNested} onChange={(e) => store.setApplyToNested(e.target.checked)} />
        Also override nested Theme regions
      </label>

      {grouped.length === 0 && <div className="muted">No tokens match.</div>}
      {grouped.map(([cat, entries]) => {
        const open = searching || openCats.has(cat);
        const modCount = modifiedByCat[cat] ?? 0;
        return (
          <section className="cat" key={cat}>
            <div className="row">
              <button
                className="cat-head"
                aria-expanded={open}
                onClick={() =>
                  setOpenCats((s) => {
                    const n = new Set(s);
                    if (n.has(cat)) n.delete(cat);
                    else n.add(cat);
                    return n;
                  })
                }
              >
                <span>{open ? '▾' : '▸'}</span>
                <span>{CATEGORY_LABELS[cat]}</span>
                <span className="count">
                  {entries.length}
                  {modCount ? ` · ${modCount} modified` : ''}
                </span>
              </button>
              {modCount > 0 && (
                <button className="ghost small" onClick={() => (modCount > 1 ? setConfirmCat(cat) : store.resetCategory(cat))}>
                  Reset category
                </button>
              )}
            </div>
            {confirmCat === cat && (
              <Confirm
                message={`Reset ${modCount} ${CATEGORY_LABELS[cat].toLowerCase()} tokens to their original values?`}
                onConfirm={() => {
                  store.resetCategory(cat);
                  setConfirmCat(null);
                }}
                onCancel={() => setConfirmCat(null)}
              />
            )}
            {open && GENERATED_NOTE[cat] && <div className="muted small" style={{ margin: '0 0 4px 18px' }}>{GENERATED_NOTE[cat]}</div>}
            {open &&
              entries.map((e) => {
                if (!showAll && searching && rendered >= SEARCH_CAP) return null;
                rendered++;
                return <TokenRow key={e.name} entry={e} open={openTokens.has(e.name)} onToggle={() => toggleToken(e.name)} />;
              })}
          </section>
        );
      })}
      {!showAll && searching && filtered.length > SEARCH_CAP && (
        <button onClick={() => setShowAll(true)}>Show all {filtered.length} results</button>
      )}
    </div>
  );
}
