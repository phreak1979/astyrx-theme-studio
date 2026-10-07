import { describe, expect, it } from 'vitest';
import { tokenDefaults, defineTheme } from '@astryxdesign/core/theme';
import { buildRegistry } from '../src/core/token-registry';
import { ThemeStore } from '../src/core/theme-state';
import { generateThemeTs, buildTokenMap, themeIdentifier, type ExportInput } from '../src/exporters/astryx';
import { buildThemeJson, parseThemeJson, stringifyThemeJson, diffImport } from '../src/exporters/json';
import { buildExportPackage } from '../src/exporters/package';
import { validateTheme, computeContrast } from '../src/core/validation';
import { parseColor, contrastRatio } from '../src/core/contrast';

const reg = buildRegistry(tokenDefaults as Record<string, string>, { astryxVersion: '0.6.5' });
function setup() {
  const s = new ThemeStore(reg);
  s.setMeta({ name: 'Dreamscore' });
  s.setValue('--color-accent', 'light', '#1663AA');
  s.setValue('--color-accent', 'dark', '#4D9CE6');
  s.setValue('--radius-element', 'both', '6px');
  const input = (scope: 'modified' | 'complete' = 'modified'): ExportInput => ({
    registry: reg,
    overrides: s.getSnapshot().overrides,
    getWorking: (t) => s.getWorking(t),
    meta: s.getSnapshot().meta,
    astryxVersion: '0.6.5',
    scope,
  });
  return { s, input };
}

describe('astryx export', () => {
  it('emits defineTheme with tuples and plain values', () => {
    const { input } = setup();
    const ts = generateThemeTs(input());
    expect(ts).toContain("import { defineTheme } from '@astryxdesign/core/theme';");
    expect(ts).toContain('export const dreamscoreTheme = defineTheme({');
    expect(ts).toContain("'--color-accent': ['#1663AA', '#4D9CE6'],");
    expect(ts).toContain("'--radius-element': '6px',");
    expect(ts).not.toContain('--color-background-surface');
  });
  it('complete scope includes every token', () => {
    const { input } = setup();
    expect(Object.keys(buildTokenMap(input('complete'))).length).toBe(reg.entries.length);
  });
  it('the generated token map is accepted by the real defineTheme', () => {
    const { input } = setup();
    const theme = defineTheme({ name: 'dreamscore', tokens: buildTokenMap(input('complete')) as never });
    expect(theme.name).toBe('dreamscore');
  });
  it('escapes quotes and builds identifiers', () => {
    expect(themeIdentifier('dream-score')).toBe('dreamScoreTheme');
    expect(themeIdentifier('my-theme')).toBe('myTheme');
    expect(themeIdentifier('9lives')).toBe('theme9livesTheme');
  });
  it('package has four files', () => {
    const { input } = setup();
    expect(buildExportPackage(input()).map((f) => f.name)).toEqual(['dreamscoreTheme.ts', 'dreamscore.theme.json', 'metadata.json', 'README.md']);
  });
});

describe('json export / import', () => {
  it('round trips', () => {
    const { s, input } = setup();
    const text = stringifyThemeJson(input());
    const parsed = parseThemeJson(text, reg);
    expect(parsed.ok, parsed.errors.join('; ')).toBe(true);
    const fresh = new ThemeStore(reg);
    fresh.replaceTheme(parsed.overrides, parsed.meta);
    expect(fresh.getSnapshot().overrides).toEqual(s.getSnapshot().overrides);
    expect(fresh.getSnapshot().meta.name).toBe('Dreamscore');
  });
  it('rejects unknown tokens, bad schema and bad values', () => {
    const { input } = setup();
    const j = buildThemeJson(input());
    j.light['--nope'] = '1px';
    j.dark['--nope'] = '1px';
    j.light['--radius-element'] = 'abc';
    const p = parseThemeJson(JSON.stringify(j), reg);
    expect(p.ok).toBe(false);
    expect(p.errors.join(' ')).toContain('Unknown token --nope');
    expect(p.errors.join(' ')).toContain('--radius-element (light)');
    expect(parseThemeJson('{"a":1}', reg).ok).toBe(false);
    expect(parseThemeJson('nope', reg).ok).toBe(false);
  });
  it('detects duplicate keys', () => {
    const { input } = setup();
    const text = stringifyThemeJson(input()).replace('"--radius-element": "6px"', '"--radius-element": "6px",\n    "--radius-element": "7px"');
    const p = parseThemeJson(text, reg);
    expect(p.duplicates).toContain('--radius-element');
    expect(p.ok).toBe(false);
  });
  it('diffs against the current working theme', () => {
    const { s } = setup();
    const next = { '--radius-element': { light: '4px', dark: '4px' }, '--radius-container': { light: '2px', dark: '2px' } };
    const rows = diffImport(s.getSnapshot().overrides, next, (t) => s.getOriginal(t));
    const by = Object.fromEntries(rows.map((r) => [r.token, r.status]));
    expect(by).toEqual({ '--color-accent': 'removed', '--radius-element': 'changed', '--radius-container': 'added' });
  });
});

describe('validation and contrast', () => {
  it('healthy theme is ready', () => {
    const { s } = setup();
    const r = validateTheme({ registry: reg, overrides: s.getSnapshot().overrides, getWorking: (t) => s.getWorking(t), meta: s.getSnapshot().meta, astryxVersion: '0.6.5' });
    expect(r.ready).toBe(true);
    expect(r.unknownTokens).toBe(0);
  });
  it('unknown token blocks, compat warns, bad id errors', () => {
    const { s } = setup();
    const r = validateTheme({
      registry: reg,
      overrides: { ...s.getSnapshot().overrides, '--mystery': { light: '1', dark: '1' } },
      getWorking: (t) => s.getWorking(t),
      meta: { ...s.getSnapshot().meta, id: 'Bad Id' },
      astryxVersion: '0.9.0',
    });
    expect(r.ready).toBe(false);
    expect(r.unknownTokens).toBe(1);
    expect(r.issues.some((i) => i.code === 'compat')).toBe(true);
    expect(r.issues.some((i) => i.code === 'meta')).toBe(true);
  });
  it('flags low contrast for modified pairs only; strict makes it an error', () => {
    const s = new ThemeStore(reg);
    s.setValue('--color-text-primary', 'both', '#cccccc');
    s.setValue('--color-background-surface', 'both', '#ffffff');
    const base = { registry: reg, overrides: s.getSnapshot().overrides, getWorking: (t: string) => s.getWorking(t), meta: s.getSnapshot().meta, astryxVersion: '0.6.5' };
    const r = validateTheme(base);
    expect(r.a11yWarnings).toBeGreaterThan(0);
    expect(r.ready).toBe(true);
    expect(validateTheme({ ...base, strictA11y: true }).ready).toBe(false);
  });
  it('computes known ratios', () => {
    expect(contrastRatio(parseColor('#000')!, parseColor('#fff')!)).toBeCloseTo(21, 0);
    expect(parseColor('rgb(255 0 0 / 50%)')!.a).toBeCloseTo(0.5);
    expect(parseColor('hsl(0, 100%, 50%)')!.r).toBeCloseTo(255, 0);
    expect(parseColor('oklch(0.5 0.1 100)')).toBeNull();
  });
  it('default Astryx text pairs pass AA', () => {
    const s = new ThemeStore(reg);
    const rows = computeContrast({ registry: reg, getWorking: (t) => s.getWorking(t), overrides: {} });
    const textRow = rows.find((r) => r.label === 'Text / Surface' && r.mode === 'light')!;
    expect(textRow.aa).toBe(true);
  });
});

describe('parity with the real Astryx theme output', () => {
  it('our preview declarations equal what defineTheme generates for the same tokens', async () => {
    const { generateThemeCSS } = await import('@astryxdesign/core/theme');
    const { buildOverrideCss } = await import('../src/core/override-injector');
    const { s, input } = setup();
    s.setValue('--color-background-surface', 'light', '#F8FAFC');
    const tokens = buildTokenMap(input('modified'));
    const theme = defineTheme({ name: 'dreamscore', tokens: tokens as never });
    const real = generateThemeCSS(theme).component;
    const decls = (css: string) =>
      new Map(
        [...css.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()] as const),
      );
    const realDecls = decls(real.slice(0, real.indexOf('}')));
    const ours = decls(buildOverrideCss(s.getSnapshot(), () => true));
    for (const [name] of Object.entries(tokens)) {
      expect(ours.get(name), name).toBe(realDecls.get(name));
    }
    expect(ours.size).toBe(Object.keys(tokens).length);
  });
});
