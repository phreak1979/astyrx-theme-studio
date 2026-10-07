/** Split a string on a separator, ignoring separators inside parentheses or quotes. */
export function splitTopLevel(input: string, sep = ','): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  let quote: string | null = null;
  for (const ch of input) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
      continue;
    }
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === sep && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

export interface LightDark {
  light: string;
  dark: string;
  /** True when the source was a `light-dark(a, b)` expression. */
  modeSpecific: boolean;
}

/** True when `v` is exactly one `fn(...)` call whose first paren closes at the end. */
function isWholeCall(v: string, fn: string): boolean {
  if (!v.startsWith(fn + '(') || !v.endsWith(')')) return false;
  let depth = 0;
  for (let i = fn.length; i < v.length; i++) {
    const ch = v[i];
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0 && i !== v.length - 1) return false;
    }
  }
  return depth === 0;
}

export function parseLightDark(raw: string): LightDark {
  const v = raw.trim();
  if (isWholeCall(v, 'light-dark')) {
    const parts = splitTopLevel(v.slice('light-dark('.length, -1));
    if (parts.length === 2 && parts[0] && parts[1]) {
      return { light: parts[0], dark: parts[1], modeSpecific: true };
    }
  }
  return { light: v, dark: v, modeSpecific: false };
}

/** Normalise for equality checks (whitespace and case insensitive). */
export function normaliseValue(v: string): string {
  return v.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function sameValue(a: string, b: string): boolean {
  return normaliseValue(a) === normaliseValue(b);
}

/** Produce the CSS value for a light/dark pair. */
export function formatLightDark(light: string, dark: string): string {
  return sameValue(light, dark) ? light : `light-dark(${light}, ${dark})`;
}

/** Extract every `var(--name)` reference from a CSS value. */
export function extractVarRefs(value: string): string[] {
  const out: string[] = [];
  const re = /var\(\s*(--[A-Za-z0-9_-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value))) out.push(m[1]!);
  return out;
}

/**
 * Values are written into a `<style>` element, so reject anything that could
 * terminate the declaration or the element.
 */
export function isSafeCssValue(v: string): boolean {
  if (!v.trim()) return false;
  if (/[;{}]|\/\*|\*\/|<\/?style|<!--|\\0/i.test(v)) return false;
  let depth = 0;
  for (const ch of v) {
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth < 0) return false;
    }
  }
  return depth === 0;
}
