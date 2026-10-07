import { extractVarRefs, splitTopLevel } from '../core/css-value';
import { STYLE_MARKER } from './ids';

export interface ScannedDecl {
  prop: string;
  value: string;
}

export interface ScannedRule {
  /** Selector with `&`/`@scope` already resolved to something `matches()` understands. */
  selector: string;
  decls: ScannedDecl[];
  /** Where the rule came from, for the "unreadable / origin" reporting. */
  origin: 'style' | 'link' | 'adopted';
}

export interface ScanResult {
  rules: ScannedRule[];
  unreadable: number;
  sheets: number;
  signature: string;
}

const DYNAMIC_PSEUDO = /:(hover|active|focus-visible|focus-within|focus|visited|target)(?![\w-])/g;
const PSEUDO_ELEMENT = /::?(before|after|first-line|first-letter)(?![\w-])|::[\w-]+(\([^)]*\))?/g;

/** Remove user-action pseudo-classes and pseudo-elements so the host element can be matched. */
export function stripDynamicSelector(selector: string): string[] {
  return splitTopLevel(selector, ',')
    .map((s) => s.replace(PSEUDO_ELEMENT, '').replace(DYNAMIC_PSEUDO, '').trim())
    .filter((s) => s && !/^[>+~]/.test(s) && !/[>+~]$/.test(s));
}

function parseDecls(cssText: string): ScannedDecl[] {
  const out: ScannedDecl[] = [];
  for (const part of splitTopLevel(cssText, ';')) {
    const i = part.indexOf(':');
    if (i < 1) continue;
    const prop = part.slice(0, i).trim();
    const value = part.slice(i + 1).replace(/!\s*important\s*$/i, '').trim();
    if (prop && value) out.push({ prop, value });
  }
  return out;
}

function isOurSheet(sheet: CSSStyleSheet): boolean {
  const owner = sheet.ownerNode as Element | null;
  return !!owner && typeof owner.hasAttribute === 'function' && owner.hasAttribute(STYLE_MARKER);
}

function safeRules(sheet: { cssRules: CSSRuleList }): CSSRuleList | null {
  try {
    return sheet.cssRules;
  } catch {
    return null; // cross-origin
  }
}

export function sheetSignature(doc: Document): string {
  let total = 0;
  let n = 0;
  const all: CSSStyleSheet[] = [...Array.from(doc.styleSheets), ...(doc.adoptedStyleSheets ?? [])];
  for (const s of all) {
    if (isOurSheet(s)) continue;
    n++;
    const r = safeRules(s);
    total += r ? r.length : -1;
  }
  return `${n}:${total}`;
}

function resolveNested(child: string, parent: string): string {
  const list = splitTopLevel(child, ',');
  return list
    .map((c) => (c.includes('&') ? c.replace(/&/g, `:is(${parent})`) : `:is(${parent}) ${c}`))
    .join(', ');
}

function resolveScoped(sel: string, scope: string | null): string {
  if (!scope) return sel;
  return splitTopLevel(sel, ',')
    .map((c) => (c.includes(':scope') ? c.replace(/:scope/g, `:is(${scope})`) : `:is(${scope}) ${c}`))
    .join(', ');
}

/** Read every readable stylesheet, flattening grouping rules whose conditions currently hold. */
export function scanStyleSheets(doc: Document = document): ScanResult {
  const rules: ScannedRule[] = [];
  let unreadable = 0;
  let sheets = 0;
  const view = doc.defaultView;

  const conditionHolds = (rule: CSSRule): boolean => {
    const r = rule as CSSMediaRule & CSSSupportsRule;
    if ('media' in r && r.media && typeof r.media.mediaText === 'string' && rule.constructor.name === 'CSSMediaRule') {
      try {
        return view?.matchMedia(r.media.mediaText).matches ?? true;
      } catch {
        return true;
      }
    }
    if (rule.constructor.name === 'CSSSupportsRule' && typeof r.conditionText === 'string') {
      try {
        return view?.CSS?.supports(r.conditionText) ?? true;
      } catch {
        return true;
      }
    }
    return true;
  };

  const walk = (list: CSSRuleList, origin: ScannedRule['origin'], scope: string | null, parent: string | null) => {
    for (const rule of Array.from(list)) {
      const sr = rule as CSSStyleRule;
      if (typeof sr.selectorText === 'string' && sr.style) {
        let selector = sr.selectorText;
        if (parent) selector = resolveNested(selector, parent);
        selector = resolveScoped(selector, scope);
        const decls = parseDecls(sr.style.cssText);
        if (decls.length) rules.push({ selector, decls, origin });
        if (sr.cssRules && sr.cssRules.length) walk(sr.cssRules, origin, scope, selector);
        continue;
      }
      if (rule.constructor.name === 'CSSImportRule') {
        const imp = rule as CSSImportRule;
        if (imp.styleSheet) {
          const inner = safeRules(imp.styleSheet);
          if (inner) walk(inner, origin, scope, parent);
          else unreadable++;
        }
        continue;
      }
      const grouping = rule as CSSGroupingRule;
      if (grouping.cssRules) {
        if (!conditionHolds(rule)) continue;
        let nextScope = scope;
        if (rule.constructor.name === 'CSSScopeRule') {
          const start = (rule as unknown as { start: string | null }).start;
          if (start) nextScope = scope ? `${scope} ${start}` : start;
        }
        walk(grouping.cssRules, origin, nextScope, parent);
      }
    }
  };

  const visit = (sheet: CSSStyleSheet, origin: ScannedRule['origin']) => {
    if (isOurSheet(sheet) || sheet.disabled) return;
    sheets++;
    const list = safeRules(sheet);
    if (!list) {
      unreadable++;
      return;
    }
    walk(list, origin, null, null);
  };

  for (const s of Array.from(doc.styleSheets)) {
    visit(s, s.ownerNode && (s.ownerNode as Element).tagName === 'LINK' ? 'link' : 'style');
  }
  for (const s of doc.adoptedStyleSheets ?? []) visit(s, 'adopted');

  return { rules, unreadable, sheets, signature: sheetSignature(doc) };
}

export interface StyleIndex {
  scan: ScanResult;
  /** var -> custom properties whose value references it (downstream). */
  dependents: Map<string, Set<string>>;
  /** custom property -> vars its value references (upstream). */
  deps: Map<string, Set<string>>;
  /** var -> rules with a non-custom declaration that references it directly. */
  usesByVar: Map<string, { rule: ScannedRule; prop: string }[]>;
}

export function buildStyleIndex(scan: ScanResult): StyleIndex {
  const dependents = new Map<string, Set<string>>();
  const deps = new Map<string, Set<string>>();
  const usesByVar = new Map<string, { rule: ScannedRule; prop: string }[]>();
  for (const rule of scan.rules) {
    for (const d of rule.decls) {
      const refs = extractVarRefs(d.value);
      if (!refs.length) continue;
      if (d.prop.startsWith('--')) {
        for (const r of refs) {
          if (!dependents.has(r)) dependents.set(r, new Set());
          dependents.get(r)!.add(d.prop);
          if (!deps.has(d.prop)) deps.set(d.prop, new Set());
          deps.get(d.prop)!.add(r);
        }
      } else {
        for (const r of refs) {
          if (!usesByVar.has(r)) usesByVar.set(r, []);
          usesByVar.get(r)!.push({ rule, prop: d.prop });
        }
      }
    }
  }
  return { scan, dependents, deps, usesByVar };
}

/** All variables that (transitively) take their value from `start`, including `start`. */
export function downstreamClosure(index: StyleIndex, start: string): Set<string> {
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const v = queue.shift()!;
    for (const d of index.dependents.get(v) ?? []) {
      if (!seen.has(d)) {
        seen.add(d);
        queue.push(d);
      }
    }
  }
  return seen;
}

/** All variables a value ultimately depends on, including `start`. */
export function upstreamClosure(index: StyleIndex, start: string): Set<string> {
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const v = queue.shift()!;
    for (const d of index.deps.get(v) ?? []) {
      if (!seen.has(d)) {
        seen.add(d);
        queue.push(d);
      }
    }
  }
  return seen;
}

/** True if the element matches any alternative of `selector`, ignoring hover/focus/pseudo-elements. */
export function matchesLoose(el: Element, selector: string): boolean {
  for (const alt of stripDynamicSelector(selector)) {
    try {
      if (el.matches(alt)) return true;
    } catch {
      /* unsupported selector */
    }
  }
  return false;
}
