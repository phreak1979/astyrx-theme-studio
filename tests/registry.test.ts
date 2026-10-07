import { describe, expect, it } from 'vitest';
import { tokenDefaults } from '@astryxdesign/core/theme';
import { parseLightDark, splitTopLevel, formatLightDark, extractVarRefs, isSafeCssValue } from '../src/core/css-value';
import { buildRegistry, categorise } from '../src/core/token-registry';
import { checkCompat } from '../src/core/version';
import { validateValue } from '../src/core/validators';

describe('light-dark parsing', () => {
  it('splits rgba without breaking on inner commas', () => {
    const p = parseLightDark('light-dark(rgba(5, 54, 89, 0.1), rgba(223, 226, 229, 0.2))');
    expect(p).toEqual({ light: 'rgba(5, 54, 89, 0.1)', dark: 'rgba(223, 226, 229, 0.2)', modeSpecific: true });
  });
  it('treats plain values as identical', () => {
    expect(parseLightDark('8px')).toEqual({ light: '8px', dark: '8px', modeSpecific: false });
  });
  it('does not treat trailing content after a call as a pair', () => {
    expect(parseLightDark('light-dark(a, b) c(d)').modeSpecific).toBe(false);
  });
  it('splitTopLevel respects quotes', () => {
    expect(splitTopLevel('"a,b", c')).toEqual(['"a,b"', 'c']);
  });
  it('formats pairs', () => {
    expect(formatLightDark('#fff', '#000')).toBe('light-dark(#fff, #000)');
    expect(formatLightDark('#FFF', '#fff')).toBe('#FFF');
  });
  it('extracts var refs', () => {
    expect(extractVarRefs('1px solid var(--a, var(--b))')).toEqual(['--a', '--b']);
  });
  it('rejects unsafe css', () => {
    expect(isSafeCssValue('red; } body { display:none')).toBe(false);
    expect(isSafeCssValue('</style><script>')).toBe(false);
    expect(isSafeCssValue('rgb(1, 2, 3)')).toBe(true);
  });
});

describe('registry from real tokenDefaults', () => {
  const reg = buildRegistry(tokenDefaults as Record<string, string>, { astryxVersion: '0.6.5' });
  it('exposes every token', () => {
    expect(reg.entries.length).toBe(Object.keys(tokenDefaults).length);
    expect(reg.entries.length).toBeGreaterThan(200);
  });
  it('categorises every token (fallback other)', () => {
    for (const e of reg.entries) expect(e.category).toBeTruthy();
    expect(categorise('--mystery')).toBe('other');
  });
  it('parses accent into light and dark', () => {
    const a = reg.byName.get('--color-accent')!;
    expect(a.light).toBe('#0064E0');
    expect(a.dark).toBe('#2694FE');
    expect(a.modeSpecific).toBe(true);
  });
  it('only colour tokens are mode specific', () => {
    for (const e of reg.entries) if (e.modeSpecific) expect(e.type).toBe('color');
  });
  it('default values validate against their own type', () => {
    for (const e of reg.entries) {
      expect(validateValue(e.type, e.light, e.enumValues).ok, `${e.name}=${e.light}`).toBe(true);
      expect(validateValue(e.type, e.dark, e.enumValues).ok, `${e.name}=${e.dark}`).toBe(true);
    }
  });
  it('counts sum to total', () => {
    expect(Object.values(reg.counts).reduce((a, b) => a + b, 0)).toBe(reg.entries.length);
  });
});

describe('compat', () => {
  it('flags versions', () => {
    expect(checkCompat('0.6.5').status).toBe('compatible');
    expect(checkCompat('0.6.9').status).toBe('compatible');
    expect(checkCompat('0.7.0').status).toBe('unsupported');
    expect(checkCompat('0.6.4').status).toBe('unsupported');
    expect(checkCompat(null).status).toBe('unknown');
  });
});

describe('validators', () => {
  it('colour', () => {
    expect(validateValue('color', '#12').ok).toBe(false);
    expect(validateValue('color', '#1663AA').ok).toBe(true);
    expect(validateValue('color', 'var(--color-text-green)').ok).toBe(true);
  });
  it('length / duration / easing', () => {
    expect(validateValue('length', '8px').ok).toBe(true);
    expect(validateValue('length', 'abc').ok).toBe(false);
    expect(validateValue('duration', '200ms').ok).toBe(true);
    expect(validateValue('easing', 'cubic-bezier(0.24, 1, 0.4, 1)').ok).toBe(true);
    expect(validateValue('easing', 'cubic-bezier(1,2)').ok).toBe(false);
  });
});
