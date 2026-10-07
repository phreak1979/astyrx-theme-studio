import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { CSS } from '../src/ui/styles';
import { tokenDefaults } from '@astryxdesign/core/theme';
import { DEFAULT_SHORTCUTS, matchesShortcut, resolveAction } from '../src/dev/shortcuts';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  vi.doUnmock('../src/dev/env');
  vi.resetModules();
  document.body.innerHTML = '';
  localStorage.clear();
});

describe('production fail-safe', () => {
  it('getSession returns null and creates nothing when not in development', async () => {
    vi.resetModules();
    vi.doMock('../src/dev/env', () => ({ isDevEnvironment: () => false }));
    const { getSession } = await import('../src/dev/session');
    expect(getSession()).toBeNull();
    expect((globalThis as { __ASTRYX_THEME_STUDIO__?: unknown }).__ASTRYX_THEME_STUDIO__).toBeUndefined();
  });

  it('renders nothing, adds no listeners, reads no storage and applies no overrides', async () => {
    vi.resetModules();
    vi.doMock('../src/dev/env', () => ({ isDevEnvironment: () => false }));
    localStorage.setItem(
      'astryx-theme-studio:working-theme',
      JSON.stringify({ v: 1, astryxVersion: '0.6.5', savedAt: '', theme: { meta: {}, overrides: { '--radius-element': { light: '1px', dark: '1px' } } } }),
    );
    const { AstryxThemeStudio, mountAstryxThemeStudio } = await import('../src/dev/entry');

    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host); // React's own root registers listeners; spy only after it exists
    const add = vi.spyOn(window, 'addEventListener');
    const docAdd = vi.spyOn(document, 'addEventListener');
    const get = vi.spyOn(Storage.prototype, 'getItem');
    const mo = vi.spyOn(MutationObserver.prototype, 'observe');
    await act(async () => root.render(createElement(AstryxThemeStudio)));
    mountAstryxThemeStudio()();

    expect(host.innerHTML).toBe('');
    expect(document.getElementById('astryx-theme-studio-root')).toBeNull();
    expect(document.querySelector('style[data-astryx-theme-studio]')).toBeNull();
    expect(document.querySelector('[data-ats-host]')).toBeNull();
    expect(add).not.toHaveBeenCalledWith('keydown', expect.anything(), expect.anything());
    // (React itself registers document listeners when it commits; only studio-specific ones matter.)
    expect(docAdd.mock.calls.map((c) => c[0])).not.toContain('keydown');
    expect(get).not.toHaveBeenCalled();
    expect(mo).not.toHaveBeenCalled();
    await act(async () => root.unmount());
    for (const s of [add, docAdd, get, mo]) s.mockRestore();
  });

  it('the real guard reads import.meta.env.DEV without throwing', async () => {
    const { isDevEnvironment } = await import('../src/dev/env');
    expect(() => isDevEnvironment()).not.toThrow();
    expect(isDevEnvironment()).toBe(true); // Vitest runs with DEV=true
  });
});

describe('UI isolation lint', () => {
  it('studio CSS never reads Astryx tokens and only uses its own --ats-* variables', () => {
    const used = [...CSS.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]!);
    expect(used.length).toBeGreaterThan(0);
    for (const v of used) expect(v.startsWith('--ats-'), v).toBe(true);
    for (const token of Object.keys(tokenDefaults)) expect(CSS.includes(`var(${token}`), token).toBe(false);
  });
});

describe('shortcuts', () => {
  const ev = (key: string, o: Partial<KeyboardEvent> = {}) => ({ key, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...o }) as KeyboardEvent;
  it('matches defaults, with Cmd or Ctrl', () => {
    expect(resolveAction(ev('A', { ctrlKey: true, shiftKey: true }), DEFAULT_SHORTCUTS)).toBe('open');
    expect(resolveAction(ev('i', { metaKey: true, shiftKey: true }), DEFAULT_SHORTCUTS)).toBe('inspect');
    expect(resolveAction(ev('z', { ctrlKey: true }), DEFAULT_SHORTCUTS)).toBe('undo');
    expect(resolveAction(ev('z', { ctrlKey: true, shiftKey: true }), DEFAULT_SHORTCUTS)).toBe('redo');
    expect(resolveAction(ev('Escape'), DEFAULT_SHORTCUTS)).toBe('exit');
    expect(resolveAction(ev('a'), DEFAULT_SHORTCUTS)).toBeNull();
  });
  it('can be reconfigured or disabled', () => {
    const map = { ...DEFAULT_SHORTCUTS, open: 'Mod+Shift+K', inspect: false as const };
    expect(resolveAction(ev('k', { ctrlKey: true, shiftKey: true }), map)).toBe('open');
    expect(resolveAction(ev('a', { ctrlKey: true, shiftKey: true }), map)).toBeNull();
    expect(resolveAction(ev('i', { ctrlKey: true, shiftKey: true }), map)).toBeNull();
    expect(matchesShortcut(ev('x', { altKey: true }), 'Alt+X')).toBe(true);
  });
});
