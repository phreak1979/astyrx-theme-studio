import type { PersistedTheme, ThemeStore } from '../core/theme-state';

export const WORKING_THEME_KEY = 'astryx-theme-studio:working-theme';
export const UI_STATE_KEY = 'astryx-theme-studio:ui';
const SCHEMA = 1;

export interface SavedWorkingTheme {
  v: number;
  astryxVersion: string | null;
  savedAt: string;
  theme: PersistedTheme;
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadSaved(key = WORKING_THEME_KEY): SavedWorkingTheme | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedWorkingTheme;
    if (!parsed || parsed.v !== SCHEMA || !parsed.theme || typeof parsed.theme.overrides !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSaved(key = WORKING_THEME_KEY): void {
  try {
    storage()?.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function saveNow(store: ThemeStore, astryxVersion: string | null, key = WORKING_THEME_KEY): void {
  const s = storage();
  if (!s) return;
  const payload: SavedWorkingTheme = {
    v: SCHEMA,
    astryxVersion,
    savedAt: new Date().toISOString(),
    theme: store.serialize(),
  };
  try {
    if (Object.keys(payload.theme.overrides).length === 0) s.removeItem(key);
    else s.setItem(key, JSON.stringify(payload));
  } catch {
    /* quota or privacy mode: persistence is a convenience only */
  }
}

/** Debounced autosave. Returns a disposer that also flushes any pending write. */
export function startAutosave(
  store: ThemeStore,
  astryxVersion: string | null,
  opts: { debounceMs?: number; key?: string } = {},
): () => void {
  const { debounceMs = 250, key = WORKING_THEME_KEY } = opts;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const flush = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    saveNow(store, astryxVersion, key);
  };
  const unsub = store.subscribe(() => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(flush, debounceMs);
  });
  return () => {
    unsub();
    if (timer !== undefined) flush();
  };
}

// ---- small UI-state helpers (panel geometry, launcher position) ----
export function loadUiState<T extends object>(fallback: T): T {
  const s = storage();
  if (!s) return fallback;
  try {
    const raw = s.getItem(UI_STATE_KEY);
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<T>) } : fallback;
  } catch {
    return fallback;
  }
}

export function saveUiState(state: object): void {
  try {
    storage()?.setItem(UI_STATE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}
