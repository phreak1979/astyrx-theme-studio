import { buildStyleIndex, downstreamClosure, matchesLoose, scanStyleSheets, sheetSignature, stripDynamicSelector, type StyleIndex } from '../inspector/css-scan';
import { detectComponent } from '../inspector/component-detector';
import { isStudioNode, STYLE_MARKER } from '../inspector/ids';

export interface ImpactGroup {
  name: string;
  count: number;
  elements: Element[];
}

export interface ImpactResult {
  token: string;
  elements: Element[];
  groups: ImpactGroup[];
  total: number;
  /** Variables (token + aliases) whose consumers were counted. */
  variables: string[];
  unreadableSheets: number;
  durationMs: number;
}

export interface ImpactEngineOptions {
  doc?: Document;
  /** Warn (via `log`) when one analysis exceeds this many ms. */
  thresholdMs?: number;
  log?: (message: string) => void;
  now?: () => number;
}

export function isVisible(el: Element): boolean {
  if (!el.isConnected) return false;
  if (el.getClientRects().length === 0) return false;
  const view = el.ownerDocument.defaultView;
  const cs = view?.getComputedStyle(el);
  return !cs || (cs.visibility !== 'hidden' && cs.display !== 'none');
}

export const UNGROUPED = 'Other elements';

export class ImpactEngine {
  private doc: Document;
  private index: StyleIndex | null = null;
  private signature = '';
  private dirty = true;
  private observer: MutationObserver | null = null;
  private cache = new Map<string, ImpactResult>();
  private now: () => number;

  constructor(private opts: ImpactEngineOptions = {}) {
    this.doc = opts.doc ?? document;
    this.now = opts.now ?? (() => performance.now());
  }

  /** Start watching <head> for stylesheet changes (only while Impact mode needs it). */
  activate(): void {
    if (this.observer || typeof MutationObserver === 'undefined') return;
    this.observer = new MutationObserver((records) => {
      const relevant = records.some((r) => {
        const t = r.target as Node;
        const el = t instanceof Element ? t : t.parentElement;
        return !(el && el.hasAttribute?.(STYLE_MARKER));
      });
      if (relevant) this.invalidate();
    });
    this.observer.observe(this.doc.head, { childList: true, subtree: true, characterData: true });
  }

  deactivate(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  dispose(): void {
    this.deactivate();
    this.index = null;
    this.cache.clear();
  }

  invalidate(): void {
    this.dirty = true;
    this.cache.clear();
  }

  getIndex(): StyleIndex {
    // Without an observer, fall back to a cheap signature check.
    if (!this.observer && this.index && sheetSignature(this.doc) !== this.signature) this.dirty = true;
    if (!this.index || this.dirty) {
      const scan = scanStyleSheets(this.doc);
      this.index = buildStyleIndex(scan);
      this.signature = scan.signature;
      this.dirty = false;
      this.cache.clear();
    }
    return this.index;
  }

  /** Visible elements on the current page that consume `token`, directly or via alias variables. */
  analyse(token: string, opts: { fresh?: boolean } = {}): ImpactResult {
    const start = this.now();
    if (opts.fresh) this.invalidate();
    const index = this.getIndex();
    const cached = this.cache.get(token);
    if (cached) return cached;

    const variables = downstreamClosure(index, token);
    const found = new Set<Element>();
    const ruleSeen = new Set<unknown>();
    for (const v of variables) {
      for (const use of index.usesByVar.get(v) ?? []) {
        if (ruleSeen.has(use.rule)) continue;
        ruleSeen.add(use.rule);
        for (const alt of stripDynamicSelector(use.rule.selector)) {
          let list: NodeListOf<Element>;
          try {
            list = this.doc.querySelectorAll(alt);
          } catch {
            continue;
          }
          for (const el of Array.from(list)) {
            if (found.has(el) || isStudioNode(el)) continue;
            found.add(el);
          }
        }
      }
    }

    const elements = [...found].filter(isVisible);
    const byName = new Map<string, Element[]>();
    for (const el of elements) {
      const c = detectComponent(el);
      const key = c.identified ? c.name! : UNGROUPED;
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key)!.push(el);
    }
    const groups = [...byName.entries()]
      .map(([name, els]) => ({ name, count: els.length, elements: els }))
      .sort((a, b) => (a.name === UNGROUPED ? 1 : b.name === UNGROUPED ? -1 : b.count - a.count || a.name.localeCompare(b.name)));

    const durationMs = this.now() - start;
    const result: ImpactResult = {
      token,
      elements,
      groups,
      total: elements.length,
      variables: [...variables],
      unreadableSheets: index.scan.unreadable,
      durationMs,
    };
    this.cache.set(token, result);
    if (this.opts.thresholdMs && durationMs > this.opts.thresholdMs) {
      this.opts.log?.(`[astryx-theme-studio] impact scan for ${token} took ${durationMs.toFixed(1)}ms (${index.scan.rules.length} rules, ${elements.length} elements)`);
    }
    return result;
  }

  /**
   * Verifier for a single token: set it to a sentinel and diff computed styles.
   * Used when the CSSOM scan may under-report (e.g. variables consumed from script).
   */
  verifyBySentinel(token: string, candidates: Element[] = Array.from(this.doc.body.querySelectorAll('*'))): Element[] {
    const props = ['color', 'background-color', 'border-top-color', 'outline-color', 'fill', 'stroke', 'box-shadow', 'border-top-left-radius', 'padding-top', 'margin-top', 'width', 'height', 'font-size', 'font-family', 'font-weight', 'gap', 'line-height'];
    const view = this.doc.defaultView!;
    const snap = (el: Element) => {
      const cs = view.getComputedStyle(el);
      return props.map((p) => cs.getPropertyValue(p)).join('|');
    };
    const pool = candidates.filter((el) => !isStudioNode(el) && isVisible(el));
    // A temporary !important rule on every theme boundary: an app's <Theme> wrapper declares tokens
    // below <html>, so setting the property on <html> alone would be shadowed.
    const style = this.doc.createElement('style');
    style.setAttribute(STYLE_MARKER, 'sentinel');
    this.doc.head.appendChild(style);
    // Transitions would leave computed values at their start for a moment; freeze them for the check,
    // taking the baseline under the same rule so it is not itself a difference.
    const still = '*, *::before, *::after { transition: none !important; animation: none !important; }';
    style.textContent = still;
    const before = pool.map(snap);
    const sentinels = ['#ff00ff', '37px', '0.777s', '"__ats_sentinel__"'];
    const changed = new Set<Element>();
    try {
      for (const s of sentinels) {
        style.textContent = `${still}\n:root, [data-astryx-theme] { ${token}: ${s} !important; }`;
        pool.forEach((el, i) => {
          if (snap(el) !== before[i]) changed.add(el);
        });
      }
    } finally {
      style.remove();
    }
    return [...changed];
  }
}

export { matchesLoose };
