import { detectComponent, readDataProps } from './component-detector';
import { isStudioNode } from './ids';

const PREFIX = 'astryx-';
/** Values shown per prop before the rest collapse into "+N more". */
export const MAX_PROP_VALUES = 6;

export interface PropSummary {
  prop: string;
  /** Most common values first. */
  values: { value: string; count: number }[];
  /** Number of further distinct values not listed in `values`. */
  more: number;
}

export interface ComponentGroup {
  /** PascalCase display name, e.g. "TextInput". */
  name: string;
  /** The stable class, e.g. "astryx-text-input". */
  stableClass: string;
  count: number;
  elements: Element[];
  props: PropSummary[];
  /** Inner part names seen inside instances, e.g. ["header", "footer"]. */
  parts: string[];
}

export interface ComponentScan {
  groups: ComponentGroup[];
  /** Total component roots found. */
  total: number;
}

function stableClasses(el: Element): string[] {
  return Array.from(el.classList).filter((c) => c.startsWith(PREFIX) && c.length > PREFIX.length);
}

/**
 * If `el` is an inner part of an Astryx component, return that component's root element and the part
 * name. A part is an element one of whose stable classes extends a stable class of any Astryx ancestor
 * (`astryx-table-row` inside `astryx-table`, even when a `astryx-table-header` sits in between).
 */
function partOf(el: Element, mine: string[]): { owner: Element; part: string } | null {
  for (let a = el.parentElement; a && a !== el.ownerDocument.documentElement; a = a.parentElement) {
    for (const ac of stableClasses(a)) {
      for (const c of mine) {
        if (c.startsWith(ac + '-')) return { owner: a, part: c.slice(ac.length + 1) };
      }
    }
  }
  return null;
}

function summariseProps(counts: Map<string, Map<string, number>>): PropSummary[] {
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([prop, values]) => {
      const sorted = [...values.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
      return {
        prop,
        values: sorted.slice(0, MAX_PROP_VALUES).map(([value, count]) => ({ value, count })),
        more: Math.max(0, sorted.length - MAX_PROP_VALUES),
      };
    });
}

/**
 * Find the Astryx components under `root`, identified only by their stable `astryx-*` class (the same
 * rule Inspect uses). Counts component roots only; inner parts are noted on their owner instead.
 * Read-only: never touches the nodes it scans.
 */
export function scanComponents(root: ParentNode = document): ComponentScan {
  type Acc = { group: ComponentGroup; props: Map<string, Map<string, number>>; parts: Set<string> };
  const byClass = new Map<string, Acc>();
  const pendingParts: { owner: Element; part: string }[] = [];
  const roots = new Set<Element>();

  for (const el of Array.from(root.querySelectorAll(`[class*="${PREFIX}"]`))) {
    if (isStudioNode(el)) continue;
    const mine = stableClasses(el);
    if (!mine.length) continue;
    const owned = partOf(el, mine);
    if (owned) {
      pendingParts.push(owned);
      continue;
    }
    const info = detectComponent(el);
    if (!info.identified || !info.stableClass || !info.name) continue;
    let acc = byClass.get(info.stableClass);
    if (!acc) {
      acc = { group: { name: info.name, stableClass: info.stableClass, count: 0, elements: [], props: [], parts: [] }, props: new Map(), parts: new Set() };
      byClass.set(info.stableClass, acc);
    }
    acc.group.count++;
    acc.group.elements.push(el);
    roots.add(el);
    for (const [k, v] of Object.entries(readDataProps(el))) {
      let values = acc.props.get(k);
      if (!values) acc.props.set(k, (values = new Map()));
      values.set(v, (values.get(v) ?? 0) + 1);
    }
  }

  for (const { owner, part } of pendingParts) {
    if (!roots.has(owner)) continue;
    const ownerClass = detectComponent(owner).stableClass;
    if (ownerClass) byClass.get(ownerClass)?.parts.add(part);
  }

  const groups = [...byClass.values()]
    .map(({ group, props, parts }) => ({ ...group, props: summariseProps(props), parts: [...parts].sort() }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return { groups, total: groups.reduce((n, g) => n + g.count, 0) };
}
