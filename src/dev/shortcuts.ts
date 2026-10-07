export type ShortcutAction = 'open' | 'inspect' | 'exit' | 'undo' | 'redo';
export type ShortcutMap = Record<ShortcutAction, string | false>;

export const DEFAULT_SHORTCUTS: ShortcutMap = {
  open: 'Mod+Shift+A',
  inspect: 'Mod+Shift+I',
  exit: 'Escape',
  undo: 'Mod+Z',
  redo: 'Mod+Shift+Z',
};

interface Parsed {
  mod: boolean;
  shift: boolean;
  alt: boolean;
  key: string;
}

export function parseShortcut(s: string): Parsed {
  const parts = s.split('+').map((p) => p.trim().toLowerCase());
  const key = parts.pop() ?? '';
  return { mod: parts.includes('mod') || parts.includes('ctrl') || parts.includes('cmd'), shift: parts.includes('shift'), alt: parts.includes('alt'), key };
}

export function matchesShortcut(e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>, spec: string): boolean {
  const p = parseShortcut(spec);
  const mod = e.ctrlKey || e.metaKey;
  return mod === p.mod && e.shiftKey === p.shift && e.altKey === p.alt && e.key.toLowerCase() === p.key;
}

export function resolveAction(e: KeyboardEvent, map: ShortcutMap): ShortcutAction | null {
  // Check the more specific (shift) combos first so redo wins over undo.
  const order: ShortcutAction[] = ['redo', 'undo', 'open', 'inspect', 'exit'];
  for (const a of order) {
    const spec = map[a];
    if (spec && matchesShortcut(e, spec)) return a;
  }
  return null;
}

export function isEditableTarget(t: EventTarget | null): boolean {
  const el = t instanceof Element ? t : null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el as HTMLElement).isContentEditable;
}
