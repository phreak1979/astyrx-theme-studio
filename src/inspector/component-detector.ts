export interface ComponentInfo {
  identified: boolean;
  /** PascalCase display name, e.g. "TextInput". */
  name?: string;
  /** The stable class, e.g. "astryx-text-input". */
  stableClass?: string;
  /** The element carrying the stable class (may be an ancestor of the selection). */
  root?: Element;
  /** True when the selection is inside the component rather than the component root. */
  isPart: boolean;
  /** Reflected `data-*` props (variant, size, states). */
  props: Record<string, string>;
  note: string;
}

const PREFIX = 'astryx-';

export function toPascal(kebab: string): string {
  return kebab
    .split('-')
    .filter(Boolean)
    .map((p) => p[0]!.toUpperCase() + p.slice(1))
    .join('');
}

function stableClassOf(el: Element): string | undefined {
  for (const c of Array.from(el.classList)) {
    if (c.startsWith(PREFIX) && c.length > PREFIX.length) return c;
  }
  return undefined;
}

export function readDataProps(el: Element): Record<string, string> {
  const props: Record<string, string> = {};
  for (const a of Array.from(el.attributes)) {
    if (a.name.startsWith('data-') && !a.name.startsWith('data-astryx-')) {
      props[a.name.slice(5)] = a.value;
    }
  }
  return props;
}

/**
 * Identify the Astryx component from its stable `astryx-*` class only.
 * Anything else is reported as not identified; we never guess from tag names or text.
 */
export function detectComponent(el: Element): ComponentInfo {
  let cur: Element | null = el;
  while (cur && cur !== cur.ownerDocument.documentElement) {
    const cls = stableClassOf(cur);
    if (cls) {
      const isPart = cur !== el;
      return {
        identified: true,
        name: toPascal(cls.slice(PREFIX.length)),
        stableClass: cls,
        root: cur,
        isPart,
        props: readDataProps(cur),
        note: isPart ? `Inside ${toPascal(cls.slice(PREFIX.length))}` : 'Identified from its stable astryx-* class',
      };
    }
    cur = cur.parentElement;
  }
  return { identified: false, isPart: false, props: {}, note: 'Not identified as an Astryx component' };
}
