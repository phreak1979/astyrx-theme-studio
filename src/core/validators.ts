import { isSafeCssValue, splitTopLevel } from './css-value';

export type TokenType =
  | 'color'
  | 'length'
  | 'number'
  | 'shadow'
  | 'duration'
  | 'easing'
  | 'font-family'
  | 'font-weight'
  | 'enum'
  | 'other';

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

const OK: ValidationResult = { ok: true };
const fail = (error: string): ValidationResult => ({ ok: false, error });

const FN_REF = /^(var|calc|min|max|clamp|env)\(/i;
const COLOR_FN = /^(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\(.+\)$/i;
const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const NAMED = new Set(
  (
    'transparent currentcolor inherit initial unset black white red green blue yellow orange purple pink gray grey ' +
    'silver maroon olive lime aqua teal navy fuchsia cyan magenta brown gold indigo violet coral crimson ' +
    'tomato salmon khaki beige ivory lavender plum orchid tan turquoise azure'
  ).split(' '),
);
const LENGTH =
  /^-?(\d+\.?\d*|\.\d+)(px|rem|em|%|vh|vw|vmin|vmax|svh|dvh|lvh|ch|ex|pt|pc|cm|mm|in|cqw|cqh)?$/i;
const NUMBER = /^-?(\d+\.?\d*|\.\d+)$/;
const DURATION = /^(\d+\.?\d*|\.\d+)(ms|s)$/i;
const EASING_KW = new Set(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end']);
const WEIGHT_KW = new Set(['normal', 'bold', 'bolder', 'lighter']);
const GLOBAL_KW = new Set(['inherit', 'initial', 'unset', 'revert', 'revert-layer']);

export function isColor(v: string): boolean {
  const s = v.trim();
  if (HEX.test(s)) return true;
  if (COLOR_FN.test(s)) return true;
  if (NAMED.has(s.toLowerCase())) return true;
  if (/^var\(/i.test(s)) return true;
  if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
    try {
      return CSS.supports('color', s);
    } catch {
      return false;
    }
  }
  return false;
}

export function validateValue(
  type: TokenType,
  value: string,
  enumValues?: readonly string[],
): ValidationResult {
  const v = value.trim();
  if (!v) return fail('Value is empty');
  if (!isSafeCssValue(v)) return fail('Value contains characters that are not allowed');
  if (GLOBAL_KW.has(v.toLowerCase())) return OK;
  switch (type) {
    case 'color':
      return isColor(v) ? OK : fail('Not a valid colour');
    case 'length':
      return LENGTH.test(v) || FN_REF.test(v) ? OK : fail('Not a valid length (e.g. 8px, 0.5rem)');
    case 'number':
      return NUMBER.test(v) || FN_REF.test(v) ? OK : fail('Not a valid number');
    case 'duration':
      return DURATION.test(v) || v === '0' || FN_REF.test(v) ? OK : fail('Not a valid duration (e.g. 200ms, 0.2s)');
    case 'easing': {
      const l = v.toLowerCase();
      if (EASING_KW.has(l) || /^(cubic-bezier|steps|linear)\(.+\)$/.test(l) || /^var\(/.test(l)) {
        if (l.startsWith('cubic-bezier(')) {
          const parts = splitTopLevel(l.slice(13, -1));
          if (parts.length !== 4 || parts.some((p) => !NUMBER.test(p))) return fail('cubic-bezier needs four numbers');
        }
        return OK;
      }
      return fail('Not a valid easing function');
    }
    case 'font-weight': {
      const n = Number(v);
      if (WEIGHT_KW.has(v.toLowerCase()) || FN_REF.test(v)) return OK;
      return Number.isFinite(n) && n >= 1 && n <= 1000 ? OK : fail('Weight must be 1–1000 or a keyword');
    }
    case 'enum':
      if (/^var\(/i.test(v)) return OK;
      return enumValues && !enumValues.includes(v) ? fail(`Must be one of: ${enumValues.join(', ')}`) : OK;
    case 'font-family':
    case 'shadow':
    case 'other':
      return OK;
  }
}
