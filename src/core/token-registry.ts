import { parseLightDark } from './css-value';
import { checkCompat, type CompatInfo } from './version';
import type { TokenType } from './validators';

export type TokenCategory =
  | 'colors'
  | 'typography'
  | 'spacing'
  | 'sizing'
  | 'borders'
  | 'radius'
  | 'shadows'
  | 'motion'
  | 'focus'
  | 'data'
  | 'syntax'
  | 'other';

export const CATEGORY_LABELS: Record<TokenCategory, string> = {
  colors: 'Colours',
  typography: 'Typography',
  spacing: 'Spacing',
  sizing: 'Sizing',
  borders: 'Borders',
  radius: 'Radius',
  shadows: 'Shadows',
  motion: 'Motion',
  focus: 'Focus',
  data: 'Data visualisation',
  syntax: 'Syntax highlighting',
  other: 'Other',
};

export const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS) as TokenCategory[];

export interface TokenEntry {
  name: string;
  category: TokenCategory;
  type: TokenType;
  /** Astryx default (or host value when seeded). */
  light: string;
  dark: string;
  /** True when light and dark values may differ (only colour tokens). */
  modeSpecific: boolean;
  description?: string;
  enumValues?: readonly string[];
  deprecated?: boolean;
  source: 'astryx';
}

export interface TokenRegistry {
  entries: TokenEntry[];
  byName: Map<string, TokenEntry>;
  counts: Record<TokenCategory, number>;
  astryxVersion: string | null;
  compat: CompatInfo;
}

const FOCUS_STYLES = ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset', 'auto'];

export function categorise(name: string): TokenCategory {
  if (name.startsWith('--color-data-')) return 'data';
  if (name.startsWith('--color-syntax-')) return 'syntax';
  if (name.startsWith('--color-')) return 'colors';
  if (name.startsWith('--spacing-')) return 'spacing';
  if (name.startsWith('--size-')) return 'sizing';
  if (name.startsWith('--border-')) return 'borders';
  if (name.startsWith('--focus-')) return 'focus';
  if (name.startsWith('--radius-')) return 'radius';
  if (name.startsWith('--shadow-')) return 'shadows';
  if (name.startsWith('--duration-') || name.startsWith('--ease-')) return 'motion';
  if (name.startsWith('--font-') || name.startsWith('--text-')) return 'typography';
  return 'other';
}

function inferFromValue(value: string): TokenType {
  const v = value.trim();
  if (/^(#[0-9a-f]{3,8}|rgba?\(|hsla?\(|oklch\(|oklab\()/i.test(v)) return 'color';
  if (/^-?(\d+\.?\d*|\.\d+)(px|rem|em|%)$/.test(v)) return 'length';
  if (/^(\d+\.?\d*|\.\d+)m?s$/.test(v)) return 'duration';
  if (/^(cubic-bezier|steps|linear)\(/.test(v) || v === 'ease') return 'easing';
  if (/^-?(\d+\.?\d*|\.\d+)$/.test(v)) return 'number';
  return 'other';
}

export function inferType(name: string, category: TokenCategory, value: string): { type: TokenType; enumValues?: readonly string[] } {
  switch (category) {
    case 'colors':
    case 'data':
    case 'syntax':
      return { type: 'color' };
    case 'spacing':
    case 'sizing':
    case 'radius':
      return { type: 'length' };
    case 'shadows':
      return { type: inferFromValue(value) === 'color' ? 'color' : 'shadow' };
    case 'motion':
      return { type: name.startsWith('--ease-') ? 'easing' : 'duration' };
    case 'borders':
      return { type: /color/.test(name) ? 'color' : /width|offset/.test(name) ? 'length' : inferFromValue(value) };
    case 'focus':
      if (/color/.test(name)) return { type: 'color' };
      if (/style/.test(name)) return { type: 'enum', enumValues: FOCUS_STYLES };
      if (/width|offset/.test(name)) return { type: 'length' };
      return { type: inferFromValue(value) };
    case 'typography':
      if (/^--font-family/.test(name)) return { type: 'font-family' };
      if (/weight/.test(name)) return { type: 'font-weight' };
      if (/size|height|spacing|tracking/.test(name)) {
        const t = inferFromValue(value);
        return { type: t === 'other' ? 'length' : t };
      }
      if (/line-height|leading/.test(name)) return { type: 'number' };
      return { type: inferFromValue(value) };
    default:
      return { type: inferFromValue(value) };
  }
}

/** Light descriptions for the tokens people reach for most. Missing entries are fine. */
export const TOKEN_DESCRIPTIONS: Record<string, string> = {
  '--color-accent': 'Primary accent colour',
  '--color-accent-muted': 'Subtle accent background',
  '--color-on-accent': 'Content colour on top of accent',
  '--color-background-body': 'Page background',
  '--color-background-surface': 'Cards, panels and other raised surfaces',
  '--color-background-muted': 'Muted background areas',
  '--color-text-primary': 'Primary text colour',
  '--color-text-secondary': 'Secondary text colour',
  '--color-border-primary': 'Default border colour',
  '--color-overlay': 'Scrim behind modals and drawers',
  '--color-error': 'Error / destructive colour',
  '--color-success': 'Success colour',
  '--color-warning': 'Warning colour',
  '--radius-element': 'Corner radius for controls',
  '--radius-container': 'Corner radius for containers',
  '--radius-page': 'Corner radius for page-level surfaces',
  '--shadow-low': 'Low elevation shadow',
  '--shadow-med': 'Medium elevation shadow',
  '--shadow-high': 'High elevation shadow',
  '--border-width': 'Default border width',
  '--font-family-body': 'Body font stack',
  '--font-family-heading': 'Heading font stack',
  '--font-family-code': 'Monospace font stack',
  '--ease-standard': 'Standard easing curve',
};

export interface BuildRegistryOptions {
  astryxVersion?: string | null;
  descriptions?: Record<string, string>;
}

/** Build the registry from Astryx's `tokenDefaults` map. Every key becomes an entry. */
export function buildRegistry(
  defaults: Record<string, string>,
  options: BuildRegistryOptions = {},
): TokenRegistry {
  const descriptions = { ...TOKEN_DESCRIPTIONS, ...options.descriptions };
  const entries: TokenEntry[] = [];
  const counts = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, 0])) as Record<TokenCategory, number>;

  for (const [name, raw] of Object.entries(defaults)) {
    const category = categorise(name);
    const { light, dark, modeSpecific } = parseLightDark(raw);
    const { type, enumValues } = inferType(name, category, light);
    entries.push({
      name,
      category,
      type,
      light,
      dark,
      modeSpecific: modeSpecific && type === 'color',
      description: descriptions[name],
      enumValues,
      source: 'astryx',
    });
    counts[category]++;
  }

  const rank = (c: TokenCategory) => CATEGORY_ORDER.indexOf(c);
  entries.sort((a, b) => rank(a.category) - rank(b.category) || 0);

  const astryxVersion = options.astryxVersion ?? null;
  return {
    entries,
    byName: new Map(entries.map((e) => [e.name, e])),
    counts,
    astryxVersion,
    compat: checkCompat(astryxVersion),
  };
}

/**
 * Read the host's effective values so "original" reflects the host's active theme
 * rather than Astryx defaults. Must run while no studio overrides are applied.
 */
export function readHostValues(
  registry: TokenRegistry,
  root: HTMLElement = document.documentElement,
): Record<string, { light: string; dark: string }> {
  const out: Record<string, { light: string; dark: string }> = {};
  let cs: CSSStyleDeclaration;
  try {
    cs = getComputedStyle(root);
  } catch {
    return out;
  }
  for (const e of registry.entries) {
    const raw = cs.getPropertyValue(e.name).trim();
    if (!raw) continue;
    const p = parseLightDark(raw);
    out[e.name] = e.modeSpecific ? { light: p.light, dark: p.dark } : { light: p.light, dark: p.light };
  }
  return out;
}
