import { sameValue } from './css-value';
import { validateValue, type ValidationResult } from './validators';
import type { TokenCategory, TokenRegistry } from './token-registry';

export type Mode = 'light' | 'dark';
export type PreviewMode = 'auto' | Mode;
export type Side = Mode | 'both';

export interface Pair {
  light: string;
  dark: string;
}

export interface ThemeMeta {
  name: string;
  id: string;
  description: string;
  author: string;
  /** True once the developer edited the id by hand; stops auto-derivation from the name. */
  idTouched: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Change {
  token: string;
  before: Pair | undefined;
  after: Pair | undefined;
}

interface HistoryEntry {
  changes: Change[];
  key?: string;
  at: number;
}

export interface StoreSnapshot {
  rev: number;
  overrides: Readonly<Record<string, Pair>>;
  modified: readonly string[];
  meta: ThemeMeta;
  previewMode: PreviewMode;
  appMode: Mode;
  /** The side currently being edited / previewed. */
  mode: Mode;
  applyToNested: boolean;
  /** Name of the app's root `<Theme>` (from `<html data-astryx-theme>`), if any. */
  rootThemeName: string | null;
  canUndo: boolean;
  canRedo: boolean;
}

export interface PersistedTheme {
  meta: ThemeMeta;
  overrides: Record<string, Pair>;
  previewMode: PreviewMode;
  applyToNested: boolean;
}

export const HISTORY_LIMIT = 200;
export const COALESCE_MS = 1000;

export function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'theme'
  );
}

function defaultMeta(): ThemeMeta {
  const now = new Date().toISOString();
  return { name: 'My Theme', id: 'my-theme', description: '', author: '', idTouched: false, createdAt: now, updatedAt: now };
}

function pairsEqual(a: Pair | undefined, b: Pair | undefined): boolean {
  if (!a || !b) return a === b;
  return sameValue(a.light, b.light) && sameValue(a.dark, b.dark);
}

export class ThemeStore {
  private overrides: Record<string, Pair> = {};
  private meta: ThemeMeta = defaultMeta();
  private previewMode: PreviewMode = 'auto';
  private appMode: Mode = 'light';
  private applyToNested = false;
  private rootThemeName: string | null = null;
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private listeners = new Set<() => void>();
  private snap: StoreSnapshot;
  private rev = 0;
  /** Effective original values per token (host values over Astryx defaults). */
  private originals: Record<string, Pair>;

  constructor(
    readonly registry: TokenRegistry,
    hostValues: Record<string, Pair> = {},
    private now: () => number = Date.now,
  ) {
    this.originals = {};
    for (const e of registry.entries) {
      this.originals[e.name] = hostValues[e.name] ?? { light: e.light, dark: e.dark };
    }
    this.snap = this.buildSnapshot();
  }

  // ---- subscription (compatible with useSyncExternalStore) ----
  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getSnapshot = (): StoreSnapshot => this.snap;

  private commit(): void {
    this.rev++;
    this.snap = this.buildSnapshot();
    for (const l of [...this.listeners]) l();
  }

  private buildSnapshot(): StoreSnapshot {
    const mode: Mode = this.previewMode === 'auto' ? this.appMode : this.previewMode;
    return {
      rev: this.rev,
      overrides: { ...this.overrides },
      modified: Object.keys(this.overrides),
      meta: this.meta,
      previewMode: this.previewMode,
      appMode: this.appMode,
      mode,
      applyToNested: this.applyToNested,
      rootThemeName: this.rootThemeName,
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0,
    };
  }

  // ---- reads ----
  getOriginal(token: string): Pair | undefined {
    return this.originals[token];
  }

  getWorking(token: string): Pair | undefined {
    return this.overrides[token] ?? this.originals[token];
  }

  isModified(token: string): boolean {
    return token in this.overrides;
  }

  modifiedByCategory(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const t of Object.keys(this.overrides)) {
      const c = this.registry.byName.get(t)?.category ?? 'other';
      out[c] = (out[c] ?? 0) + 1;
    }
    return out;
  }

  // ---- mutations ----
  setValue(token: string, side: Side, value: string, key?: string): ValidationResult {
    const entry = this.registry.byName.get(token);
    if (!entry) return { ok: false, error: `Unknown token ${token}` };
    const v = value.trim();
    const res = validateValue(entry.type, v, entry.enumValues);
    if (!res.ok) return res;
    const base = this.getWorking(token)!;
    let next: Pair;
    if (!entry.modeSpecific || side === 'both') next = { light: v, dark: v };
    else next = { ...base, [side]: v } as Pair;
    this.applyChanges([{ token, before: this.overrides[token], after: this.normaliseAfter(token, next) }], key);
    return { ok: true };
  }

  private normaliseAfter(token: string, next: Pair): Pair | undefined {
    return pairsEqual(next, this.originals[token]) ? undefined : next;
  }

  private applyChanges(changes: Change[], key?: string): void {
    const real = changes.filter((c) => !pairsEqual(c.before, c.after));
    if (!real.length) return;
    for (const c of real) this.write(c.token, c.after);
    const at = this.now();
    const last = this.undoStack[this.undoStack.length - 1];
    if (key && last && last.key === key && at - last.at < COALESCE_MS && real.length === 1 && last.changes.length === 1 && last.changes[0]!.token === real[0]!.token) {
      last.changes[0]!.after = real[0]!.after;
      last.at = at;
      if (pairsEqual(last.changes[0]!.before, last.changes[0]!.after)) this.undoStack.pop();
    } else {
      this.undoStack.push({ changes: real, key, at });
      if (this.undoStack.length > HISTORY_LIMIT) this.undoStack.shift();
    }
    this.redoStack = [];
    this.touch();
    this.commit();
  }

  private write(token: string, after: Pair | undefined): void {
    if (after) this.overrides[token] = after;
    else delete this.overrides[token];
  }

  private touch(): void {
    this.meta = { ...this.meta, updatedAt: new Date(this.now()).toISOString() };
  }

  undo(): boolean {
    const e = this.undoStack.pop();
    if (!e) return false;
    for (let i = e.changes.length - 1; i >= 0; i--) this.write(e.changes[i]!.token, e.changes[i]!.before);
    this.redoStack.push(e);
    this.commit();
    return true;
  }

  redo(): boolean {
    const e = this.redoStack.pop();
    if (!e) return false;
    for (const c of e.changes) this.write(c.token, c.after);
    this.undoStack.push({ ...e, key: undefined });
    this.commit();
    return true;
  }

  /**
   * Re-read what "original" means after the app switched themes. Edits stay (they are the developer's
   * work) unless they now equal the new original.
   */
  rebase(hostValues: Record<string, Pair>): { changed: number } {
    let changed = 0;
    const next: Record<string, Pair> = {};
    for (const e of this.registry.entries) {
      next[e.name] = hostValues[e.name] ?? { light: e.light, dark: e.dark };
      if (!pairsEqual(next[e.name], this.originals[e.name])) changed++;
    }
    this.originals = next;
    for (const [t, p] of Object.entries(this.overrides)) if (pairsEqual(p, next[t])) delete this.overrides[t];
    this.commit();
    return { changed };
  }

  // ---- resets ----
  resetToken(token: string): void {
    if (!this.isModified(token)) return;
    this.applyChanges([{ token, before: this.overrides[token], after: undefined }]);
  }

  resetCategory(category: TokenCategory): number {
    const changes = Object.keys(this.overrides)
      .filter((t) => this.registry.byName.get(t)?.category === category)
      .map((t): Change => ({ token: t, before: this.overrides[t], after: undefined }));
    this.applyChanges(changes);
    return changes.length;
  }

  /** Reset one side of every mode-specific token. Mode-neutral tokens are left alone. */
  resetMode(side: Mode): number {
    const changes: Change[] = [];
    for (const [token, pair] of Object.entries(this.overrides)) {
      const entry = this.registry.byName.get(token);
      if (!entry?.modeSpecific) continue;
      const orig = this.originals[token]!;
      changes.push({ token, before: pair, after: this.normaliseAfter(token, { ...pair, [side]: orig[side] } as Pair) });
    }
    this.applyChanges(changes);
    return changes.length;
  }

  resetAll(): number {
    const changes = Object.keys(this.overrides).map((t): Change => ({ token: t, before: this.overrides[t], after: undefined }));
    this.applyChanges(changes);
    return changes.length;
  }

  /** Number of tokens a reset would touch, for confirmation prompts. */
  countForReset(kind: 'category' | 'light' | 'dark' | 'all', category?: TokenCategory): number {
    const toks = Object.keys(this.overrides);
    if (kind === 'all') return toks.length;
    if (kind === 'category') return toks.filter((t) => this.registry.byName.get(t)?.category === category).length;
    return toks.filter((t) => this.registry.byName.get(t)?.modeSpecific).length;
  }

  // ---- bulk replace (import) ----
  replaceTheme(next: Record<string, Pair>, meta?: Partial<ThemeMeta>): void {
    const tokens = new Set([...Object.keys(this.overrides), ...Object.keys(next)]);
    const changes: Change[] = [];
    for (const token of tokens) {
      if (!this.registry.byName.has(token)) continue;
      changes.push({ token, before: this.overrides[token], after: next[token] ? this.normaliseAfter(token, next[token]!) : undefined });
    }
    if (meta) this.meta = { ...this.meta, ...meta };
    this.applyChanges(changes);
    if (meta) this.commit();
  }

  // ---- meta & modes ----
  setMeta(patch: Partial<Pick<ThemeMeta, 'name' | 'id' | 'description' | 'author'>>): void {
    const m = { ...this.meta, ...patch };
    if (patch.id !== undefined) m.idTouched = true;
    else if (patch.name !== undefined && !m.idTouched) m.id = slugify(m.name);
    m.updatedAt = new Date(this.now()).toISOString();
    this.meta = m;
    this.commit();
  }

  setPreviewMode(mode: PreviewMode): void {
    if (mode === this.previewMode) return;
    this.previewMode = mode;
    this.commit();
  }

  setAppMode(mode: Mode): void {
    if (mode === this.appMode) return;
    this.appMode = mode;
    this.commit();
  }

  setRootThemeName(name: string | null): void {
    if (name === this.rootThemeName) return;
    this.rootThemeName = name;
    this.commit();
  }

  setApplyToNested(v: boolean): void {
    if (v === this.applyToNested) return;
    this.applyToNested = v;
    this.commit();
  }

  // ---- persistence ----
  serialize(): PersistedTheme {
    return {
      meta: this.meta,
      overrides: { ...this.overrides },
      previewMode: this.previewMode,
      applyToNested: this.applyToNested,
    };
  }

  /** Load a saved theme, dropping tokens that are not in the registry. Clears history. */
  hydrate(saved: PersistedTheme): { dropped: string[] } {
    const dropped: string[] = [];
    const next: Record<string, Pair> = {};
    for (const [t, p] of Object.entries(saved.overrides ?? {})) {
      const entry = this.registry.byName.get(t);
      if (!entry || !p || typeof p.light !== 'string' || typeof p.dark !== 'string') {
        dropped.push(t);
        continue;
      }
      if (!validateValue(entry.type, p.light, entry.enumValues).ok || !validateValue(entry.type, p.dark, entry.enumValues).ok) {
        dropped.push(t);
        continue;
      }
      const after = this.normaliseAfter(t, entry.modeSpecific ? p : { light: p.light, dark: p.light });
      if (after) next[t] = after;
    }
    this.overrides = next;
    this.meta = { ...defaultMeta(), ...saved.meta };
    this.previewMode = saved.previewMode ?? 'auto';
    this.applyToNested = !!saved.applyToNested;
    this.undoStack = [];
    this.redoStack = [];
    this.commit();
    return { dropped };
  }
}
