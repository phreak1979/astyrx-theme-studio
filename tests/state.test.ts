import { beforeEach, describe, expect, it } from 'vitest';
import { buildRegistry } from '../src/core/token-registry';
import { ThemeStore, slugify } from '../src/core/theme-state';
import { buildOverrideCss, startOverrideInjector } from '../src/core/override-injector';
import { loadSaved, startAutosave, saveNow, WORKING_THEME_KEY } from '../src/persistence/local-storage';

const defaults = {
  '--color-accent': 'light-dark(#0064E0, #2694FE)',
  '--color-background-surface': 'light-dark(#FFFFFF, #1F1F22)',
  '--radius-element': '8px',
  '--radius-container': '12px',
  '--duration-fast': '120ms',
};
const mk = () => new ThemeStore(buildRegistry(defaults, { astryxVersion: '0.6.5' }));

describe('ThemeStore', () => {
  it('tracks modified and originals, and reset restores', () => {
    const s = mk();
    expect(s.setValue('--color-accent', 'both', '#1663AA').ok).toBe(true);
    expect(s.isModified('--color-accent')).toBe(true);
    expect(s.getOriginal('--color-accent')).toEqual({ light: '#0064E0', dark: '#2694FE' });
    s.resetToken('--color-accent');
    expect(s.isModified('--color-accent')).toBe(false);
  });
  it('editing only dark keeps light original but stores both', () => {
    const s = mk();
    s.setValue('--color-accent', 'dark', '#4D9CE6');
    expect(s.getSnapshot().overrides['--color-accent']).toEqual({ light: '#0064E0', dark: '#4D9CE6' });
  });
  it('setting back to the original removes the override', () => {
    const s = mk();
    s.setValue('--color-accent', 'both', '#111111');
    s.setValue('--color-accent', 'light', '#0064e0');
    s.setValue('--color-accent', 'dark', '#2694fe');
    expect(s.isModified('--color-accent')).toBe(false);
  });
  it('rejects invalid values and keeps the previous one', () => {
    const s = mk();
    s.setValue('--color-accent', 'both', '#111111');
    const r = s.setValue('--color-accent', 'both', '#12');
    expect(r.ok).toBe(false);
    expect(s.getWorking('--color-accent')!.light).toBe('#111111');
  });
  it('rejects unknown tokens', () => {
    expect(mk().setValue('--nope', 'both', '1px').ok).toBe(false);
  });
  it('non-colour tokens are mode neutral', () => {
    const s = mk();
    s.setValue('--radius-element', 'dark', '4px');
    expect(s.getWorking('--radius-element')).toEqual({ light: '4px', dark: '4px' });
  });
  it('undo/redo', () => {
    const s = mk();
    s.setValue('--radius-element', 'both', '4px');
    s.setValue('--radius-container', 'both', '2px');
    s.undo();
    expect(s.getWorking('--radius-container')!.light).toBe('12px');
    expect(s.getWorking('--radius-element')!.light).toBe('4px');
    s.redo();
    expect(s.getWorking('--radius-container')!.light).toBe('2px');
    expect(s.getSnapshot().canRedo).toBe(false);
  });
  it('coalesces rapid edits with the same key', () => {
    let t = 1000;
    const s = new ThemeStore(buildRegistry(defaults), {}, () => t);
    for (const c of ['#111111', '#222222', '#333333']) {
      s.setValue('--color-accent', 'both', c, 'k');
      t += 50;
    }
    s.undo();
    expect(s.isModified('--color-accent')).toBe(false);
    expect(s.getSnapshot().canUndo).toBe(false);
  });
  it('new edit clears redo', () => {
    const s = mk();
    s.setValue('--radius-element', 'both', '4px');
    s.undo();
    s.setValue('--radius-element', 'both', '6px');
    expect(s.getSnapshot().canRedo).toBe(false);
  });
  it('category / mode / all resets', () => {
    const s = mk();
    s.setValue('--radius-element', 'both', '4px');
    s.setValue('--color-accent', 'both', '#101010');
    s.setValue('--color-background-surface', 'both', '#202020');
    expect(s.countForReset('category', 'radius')).toBe(1);
    expect(s.resetCategory('radius')).toBe(1);
    s.resetMode('light');
    expect(s.getWorking('--color-accent')).toEqual({ light: '#0064E0', dark: '#101010' });
    expect(s.resetAll()).toBe(2);
    expect(s.getSnapshot().modified).toHaveLength(0);
    s.undo();
    expect(s.getSnapshot().modified).toHaveLength(2);
  });
  it('seeds originals from host values', () => {
    const reg = buildRegistry(defaults);
    const s = new ThemeStore(reg, { '--color-accent': { light: '#6750A4', dark: '#D0BCFF' } });
    expect(s.getOriginal('--color-accent')!.light).toBe('#6750A4');
    s.setValue('--color-accent', 'both', '#6750A4');
    expect(s.isModified('--color-accent')).toBe(true); // dark differs from the host dark
  });
  it('derives id from name until edited', () => {
    const s = mk();
    s.setMeta({ name: 'Dream Score' });
    expect(s.getSnapshot().meta.id).toBe('dream-score');
    s.setMeta({ id: 'custom' });
    s.setMeta({ name: 'Other' });
    expect(s.getSnapshot().meta.id).toBe('custom');
    expect(slugify('  ')).toBe('theme');
  });
  it('replaceTheme is undoable', () => {
    const s = mk();
    s.setValue('--radius-element', 'both', '4px');
    s.replaceTheme({ '--radius-container': { light: '1px', dark: '1px' } });
    expect(s.getSnapshot().modified).toEqual(['--radius-container']);
    s.undo();
    expect(s.getSnapshot().modified).toEqual(['--radius-element']);
  });
  it('hydrate drops unknown and invalid tokens', () => {
    const s = mk();
    const { dropped } = s.hydrate({
      meta: s.getSnapshot().meta,
      overrides: { '--nope': { light: '1', dark: '1' }, '--color-accent': { light: '#12', dark: '#fff' }, '--radius-element': { light: '2px', dark: '2px' } },
      previewMode: 'dark',
      applyToNested: false,
    });
    expect(dropped.sort()).toEqual(['--color-accent', '--nope']);
    expect(s.getSnapshot().previewMode).toBe('dark');
  });
  it('notifies subscribers and snapshots are stable between changes', () => {
    const s = mk();
    let n = 0;
    s.subscribe(() => n++);
    const a = s.getSnapshot();
    expect(s.getSnapshot()).toBe(a);
    s.setValue('--radius-element', 'both', '4px');
    expect(n).toBe(1);
    expect(s.getSnapshot()).not.toBe(a);
  });
});

describe('override injector', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '<div id="app"><button>x</button></div>';
  });
  it('emits light-dark for colours and plain values otherwise', () => {
    const s = mk();
    s.setValue('--color-accent', 'both', '#111111');
    s.setValue('--color-accent', 'dark', '#eeeeee');
    s.setValue('--radius-element', 'both', '2px');
    const css = buildOverrideCss(s.getSnapshot(), (t) => s.registry.byName.has(t));
    expect(css).toContain('--color-accent: light-dark(#111111, #eeeeee);');
    expect(css).toContain('--radius-element: 2px;');
  });
  it('injects, updates and fully removes without touching the app DOM', () => {
    const s = mk();
    const before = document.body.innerHTML;
    const stop = startOverrideInjector(s);
    expect(document.querySelector('style[data-astryx-theme-studio]')).toBeNull();
    s.setValue('--radius-element', 'both', '2px');
    const el = document.querySelector('style[data-astryx-theme-studio]')!;
    expect(el.textContent).toContain('2px');
    expect(document.body.innerHTML).toBe(before);
    s.resetAll();
    expect(document.querySelector('style[data-astryx-theme-studio]')).toBeNull();
    s.setValue('--radius-element', 'both', '3px');
    stop.dispose();
    expect(document.querySelector('style[data-astryx-theme-studio]')).toBeNull();
  });
  it('suspend removes the style while reading and restores it after', () => {
    const s = mk();
    const inj = startOverrideInjector(s);
    s.setValue('--radius-element', 'both', '2px');
    let during = true;
    inj.suspend(() => {
      during = !!document.querySelector('style[data-astryx-theme-studio]');
    });
    expect(during).toBe(false);
    expect(document.querySelector('style[data-astryx-theme-studio]')).not.toBeNull();
    inj.dispose();
  });
  it('targets the root theme wrapper by name so the app Theme cannot shadow the override', () => {
    const s = mk();
    s.setRootThemeName('neutral');
    s.setValue('--radius-element', 'both', '2px');
    const css = buildOverrideCss(s.getSnapshot(), () => true);
    expect(css).toContain(':root, [data-astryx-theme="neutral"] {');
    expect(css).not.toContain('[data-astryx-theme] {');
  });
  it('escapes theme names used in selectors', () => {
    const s = mk();
    s.setRootThemeName('a"b');
    s.setValue('--radius-element', 'both', '2px');
    expect(buildOverrideCss(s.getSnapshot(), () => true)).toContain('[data-astryx-theme="a\\"b"]');
  });
  it('forces colour-scheme unlayered when previewing a mode and widens to nested themes on request', () => {
    const s = mk();
    s.setPreviewMode('dark');
    s.setApplyToNested(true);
    s.setValue('--radius-element', 'both', '2px');
    const css = buildOverrideCss(s.getSnapshot(), () => true);
    expect(css).toContain('color-scheme: dark');
    expect(css).toContain(':root, [data-astryx-theme] {\n  --radius-element');
    expect(css).not.toContain('@layer');
  });
});

describe('persistence', () => {
  beforeEach(() => localStorage.clear());
  it('round-trips and removes the key when empty', async () => {
    const s = mk();
    s.setValue('--radius-element', 'both', '4px');
    saveNow(s, '0.6.5');
    const saved = loadSaved()!;
    expect(saved.astryxVersion).toBe('0.6.5');
    expect(saved.theme.overrides['--radius-element']).toBeTruthy();
    s.resetAll();
    saveNow(s, '0.6.5');
    expect(localStorage.getItem(WORKING_THEME_KEY)).toBeNull();
  });
  it('debounces autosave and flushes on dispose', async () => {
    const s = mk();
    const stop = startAutosave(s, '0.6.5', { debounceMs: 20 });
    s.setValue('--radius-element', 'both', '4px');
    expect(loadSaved()).toBeNull();
    await new Promise((r) => setTimeout(r, 40));
    expect(loadSaved()).not.toBeNull();
    s.setValue('--radius-element', 'both', '5px');
    stop();
    expect(loadSaved()!.theme.overrides['--radius-element']!.light).toBe('5px');
  });
  it('ignores corrupt payloads', () => {
    localStorage.setItem(WORKING_THEME_KEY, '{nope');
    expect(loadSaved()).toBeNull();
  });
});
