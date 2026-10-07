import { extractVarRefs } from './css-value';
import { composite, contrastRatio, parseColor, wcag, type Rgba } from './contrast';
import type { Mode, Pair, ThemeMeta } from './theme-state';
import { checkCompat, type CompatInfo } from './version';
import { validateValue } from './validators';
import type { TokenRegistry } from './token-registry';

export type Severity = 'error' | 'warning';

export interface Issue {
  severity: Severity;
  code:
    | 'unknown-token'
    | 'invalid-value'
    | 'invalid-pair'
    | 'duplicate'
    | 'deprecated'
    | 'compat'
    | 'meta'
    | 'contrast';
  token?: string;
  message: string;
}

export interface ContrastRow {
  label: string;
  fg: string;
  bg: string;
  mode: Mode;
  ratio: number | null;
  aa: boolean | null;
  aaa: boolean | null;
  /** UI-component threshold (3:1) is used for pairs that are not body text. */
  threshold: number;
  passes: boolean | null;
  involvesModified: boolean;
}

export interface HealthReport {
  issues: Issue[];
  errors: number;
  warnings: number;
  unknownTokens: number;
  a11yWarnings: number;
  compat: CompatInfo;
  contrast: ContrastRow[];
  ready: boolean;
}

export const CONTRAST_PAIRS: { label: string; fg: string; bg: string; threshold: number }[] = [
  { label: 'Text / Surface', fg: '--color-text-primary', bg: '--color-background-surface', threshold: 4.5 },
  { label: 'Text / Body', fg: '--color-text-primary', bg: '--color-background-body', threshold: 4.5 },
  { label: 'Secondary text / Surface', fg: '--color-text-secondary', bg: '--color-background-surface', threshold: 4.5 },
  { label: 'On accent / Accent', fg: '--color-on-accent', bg: '--color-accent', threshold: 4.5 },
  { label: 'Accent / Surface (UI)', fg: '--color-accent', bg: '--color-background-surface', threshold: 3 },
];

export interface ValidateInput {
  registry: TokenRegistry;
  overrides: Readonly<Record<string, Pair>>;
  /** Effective working value lookup (override over original). */
  getWorking: (token: string) => Pair | undefined;
  meta: ThemeMeta;
  astryxVersion: string | null;
  /** Token names seen more than once in an imported file. */
  duplicates?: string[];
  strictA11y?: boolean;
}

function resolveColor(token: string, mode: Mode, getWorking: ValidateInput['getWorking'], registry: TokenRegistry, depth = 0): Rgba | null {
  if (depth > 6) return null;
  const raw = getWorking(token)?.[mode];
  if (!raw) return null;
  const ref = /^var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,[^)]*)?\)$/.exec(raw.trim());
  if (ref) return resolveColor(ref[1]!, mode, getWorking, registry, depth + 1);
  if (extractVarRefs(raw).length) return null;
  return parseColor(raw);
}

export function computeContrast(input: Pick<ValidateInput, 'registry' | 'getWorking' | 'overrides'>): ContrastRow[] {
  const rows: ContrastRow[] = [];
  for (const pair of CONTRAST_PAIRS) {
    if (!input.registry.byName.has(pair.fg) || !input.registry.byName.has(pair.bg)) continue;
    for (const mode of ['light', 'dark'] as Mode[]) {
      const fg = resolveColor(pair.fg, mode, input.getWorking, input.registry);
      let bg = resolveColor(pair.bg, mode, input.getWorking, input.registry);
      const involvesModified = pair.fg in input.overrides || pair.bg in input.overrides;
      if (!fg || !bg) {
        rows.push({ ...pair, mode, ratio: null, aa: null, aaa: null, passes: null, involvesModified });
        continue;
      }
      const page: Rgba = mode === 'light' ? { r: 255, g: 255, b: 255, a: 1 } : { r: 0, g: 0, b: 0, a: 1 };
      bg = composite(bg, page);
      const fgc = composite(fg, bg);
      const ratio = contrastRatio(fgc, bg);
      const w = wcag(ratio);
      rows.push({ ...pair, mode, ratio, aa: w.aa, aaa: w.aaa, passes: ratio >= pair.threshold, involvesModified });
    }
  }
  return rows;
}

export function validateTheme(input: ValidateInput): HealthReport {
  const issues: Issue[] = [];
  const { registry, overrides, meta } = input;

  for (const [token, pair] of Object.entries(overrides)) {
    const entry = registry.byName.get(token);
    if (!entry) {
      issues.push({ severity: 'error', code: 'unknown-token', token, message: `${token} is not a supported Astryx token and cannot be exported.` });
      continue;
    }
    if (typeof pair?.light !== 'string' || typeof pair?.dark !== 'string') {
      issues.push({ severity: 'error', code: 'invalid-pair', token, message: `${token} needs both a light and a dark value.` });
      continue;
    }
    for (const side of ['light', 'dark'] as const) {
      const r = validateValue(entry.type, pair[side], entry.enumValues);
      if (!r.ok) issues.push({ severity: 'error', code: 'invalid-value', token, message: `${token} (${side}): ${r.error}` });
    }
    if (!entry.modeSpecific && pair.light !== pair.dark) {
      issues.push({ severity: 'error', code: 'invalid-pair', token, message: `${token} does not support separate light and dark values.` });
    }
    if (entry.deprecated) issues.push({ severity: 'warning', code: 'deprecated', token, message: `${token} is deprecated in this Astryx version.` });
  }

  for (const token of input.duplicates ?? []) {
    issues.push({ severity: 'error', code: 'duplicate', token, message: `${token} is defined more than once.` });
  }

  const compat = checkCompat(input.astryxVersion);
  if (compat.status !== 'compatible') issues.push({ severity: 'warning', code: 'compat', message: compat.message });

  if (!meta.name.trim()) issues.push({ severity: 'error', code: 'meta', message: 'Theme name is required.' });
  if (!/^[a-z][a-z0-9-]*$/.test(meta.id)) {
    issues.push({ severity: 'error', code: 'meta', message: 'Theme ID must start with a letter and contain only lowercase letters, digits and hyphens.' });
  }

  const contrast = computeContrast(input);
  let a11y = 0;
  for (const row of contrast) {
    if (row.passes === false && row.involvesModified) {
      a11y++;
      issues.push({
        severity: input.strictA11y ? 'error' : 'warning',
        code: 'contrast',
        message: `${row.label} (${row.mode}): contrast ${row.ratio!.toFixed(2)}:1 is below ${row.threshold}:1.`,
      });
    }
  }

  const errors = issues.filter((i) => i.severity === 'error').length;
  return {
    issues,
    errors,
    warnings: issues.length - errors,
    unknownTokens: issues.filter((i) => i.code === 'unknown-token').length,
    a11yWarnings: a11y,
    compat,
    contrast,
    ready: errors === 0,
  };
}
