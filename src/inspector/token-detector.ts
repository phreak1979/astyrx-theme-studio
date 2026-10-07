import { extractVarRefs } from '../core/css-value';
import type { TokenRegistry } from '../core/token-registry';
import { detectComponent, readDataProps } from './component-detector';
import { matchesLoose, upstreamClosure, type StyleIndex } from './css-scan';

export type PropertyKind = 'theme-token' | 'component-prop' | 'astryx-internal' | 'application-style' | 'unattributed';

export interface ClassifiedProperty {
  kind: PropertyKind;
  property: string;
  value: string;
  /** Registry tokens this declaration ultimately depends on. */
  tokens: string[];
}

export interface DetectedToken {
  token: string;
  /** Properties on this element that consume it. */
  properties: string[];
  /** Referenced directly in a declaration (true) or only through an alias variable (false). */
  direct: boolean;
}

export interface ElementReport {
  tokens: DetectedToken[];
  properties: ClassifiedProperty[];
  unreadableSheets: number;
}

function inlineDecls(el: Element): { prop: string; value: string }[] {
  const style = (el as HTMLElement).style;
  if (!style) return [];
  const out: { prop: string; value: string }[] = [];
  for (let i = 0; i < style.length; i++) {
    const prop = style[i]!;
    out.push({ prop, value: style.getPropertyValue(prop) });
  }
  return out;
}

/** Which registry tokens does the element's styling depend on, and what kind of style is each property? */
export function inspectElement(el: Element, index: StyleIndex, registry: TokenRegistry): ElementReport {
  const tokens = new Map<string, DetectedToken>();
  const properties: ClassifiedProperty[] = [];
  const component = detectComponent(el);

  const tokensFor = (value: string): { tokens: string[]; direct: Set<string> } => {
    const found = new Set<string>();
    const direct = new Set<string>();
    for (const ref of extractVarRefs(value)) {
      if (registry.byName.has(ref)) direct.add(ref);
      for (const up of upstreamClosure(index, ref)) if (registry.byName.has(up)) found.add(up);
    }
    for (const d of direct) found.add(d);
    return { tokens: [...found], direct };
  };

  const record = (prop: string, found: ReturnType<typeof tokensFor>) => {
    for (const t of found.tokens) {
      const cur = tokens.get(t) ?? { token: t, properties: [], direct: false };
      if (!cur.properties.includes(prop)) cur.properties.push(prop);
      if (found.direct.has(t)) cur.direct = true;
      tokens.set(t, cur);
    }
  };

  for (const rule of index.scan.rules) {
    if (!matchesLoose(el, rule.selector)) continue;
    const astryxRule = /\.astryx-|\[data-astryx/.test(rule.selector);
    for (const d of rule.decls) {
      if (d.prop.startsWith('--')) continue; // custom property definitions are not consumption
      const found = tokensFor(d.value);
      let kind: PropertyKind;
      if (found.tokens.length) kind = 'theme-token';
      else if (/var\(\s*--astryx-/.test(d.value) || astryxRule) kind = 'astryx-internal';
      else if (!component.identified) kind = 'application-style';
      else kind = 'unattributed';
      if (kind === 'theme-token') record(d.prop, found);
      properties.push({ kind, property: d.prop, value: d.value, tokens: found.tokens });
    }
  }

  for (const d of inlineDecls(el)) {
    const found = tokensFor(d.value);
    if (found.tokens.length) record(d.prop, found);
    properties.push({ kind: 'application-style', property: d.prop, value: d.value, tokens: found.tokens });
  }

  for (const [k, v] of Object.entries(readDataProps(el))) {
    properties.push({ kind: 'component-prop', property: `data-${k}`, value: v, tokens: [] });
  }

  return {
    tokens: [...tokens.values()].sort((a, b) => a.token.localeCompare(b.token)),
    properties,
    unreadableSheets: index.scan.unreadable,
  };
}

export const KIND_LABELS: Record<PropertyKind, { label: string; note: string }> = {
  'theme-token': { label: 'Theme token', note: 'Editable' },
  'component-prop': { label: 'Component property', note: 'Not part of theme' },
  'astryx-internal': { label: 'Astryx internal', note: 'Controlled by Astryx' },
  'application-style': { label: 'Application style', note: 'Not part of Astryx theme' },
  unattributed: { label: 'Other style', note: 'Origin not determined; not a theme token' },
};
