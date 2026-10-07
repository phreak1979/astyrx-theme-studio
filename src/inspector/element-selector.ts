import { isStudioNode } from './ids';

export interface InspectHandlers {
  onHover: (el: Element | null) => void;
  onSelect: (el: Element) => void;
}

const SUPPRESS = ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'dblclick', 'auxclick', 'contextmenu', 'touchstart', 'touchend'] as const;

function targetOf(e: Event): Element | null {
  const t = (e.composedPath?.()[0] ?? e.target) as Node | null;
  return t instanceof Element ? t : (t as Node | null)?.parentElement ?? null;
}

/**
 * Start hover/click selection. All listeners are attached here and only here,
 * so while Inspect is off the studio intercepts nothing. Returns the disposer.
 */
export function startInspect(handlers: InspectHandlers, win: Window = window): () => void {
  const doc = win.document;
  let raf = 0;
  let pending: Element | null = null;
  let last: Element | null = null;

  const onMove = (e: Event) => {
    if (isStudioNode(e.target as Node)) return;
    pending = targetOf(e);
    if (raf) return;
    raf = win.requestAnimationFrame(() => {
      raf = 0;
      if (pending !== last) {
        last = pending;
        handlers.onHover(pending);
      }
    });
  };

  const onSuppress = (e: Event) => {
    if (e.composedPath().some((n) => n instanceof Node && isStudioNode(n))) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.type === 'click') {
      const el = targetOf(e);
      if (el) handlers.onSelect(el);
    }
  };

  const onLeave = (e: Event) => {
    if ((e as MouseEvent).relatedTarget === null) {
      last = pending = null;
      handlers.onHover(null);
    }
  };

  win.addEventListener('pointermove', onMove, true);
  doc.addEventListener('mouseout', onLeave, true);
  for (const t of SUPPRESS) win.addEventListener(t, onSuppress, true);
  const prevCursor = doc.documentElement.style.cursor;

  return () => {
    win.removeEventListener('pointermove', onMove, true);
    doc.removeEventListener('mouseout', onLeave, true);
    for (const t of SUPPRESS) win.removeEventListener(t, onSuppress, true);
    if (raf) win.cancelAnimationFrame(raf);
    doc.documentElement.style.cursor = prevCursor;
    handlers.onHover(null);
  };
}
