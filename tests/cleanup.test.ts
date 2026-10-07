import { afterEach, describe, expect, it, vi } from 'vitest';
import { startInspect } from '../src/inspector/element-selector';
import { OverlayLayer } from '../src/inspector/overlay';
import { StudioSession } from '../src/dev/session';
import { detectComponent } from '../src/inspector/component-detector';
import { ImpactEngine } from '../src/core/impact-engine';
import { ROOT_ID, OVERLAY_ID } from '../src/inspector/ids';

function spyListeners() {
  const live = new Map<string, number>();
  const key = (t: string, c: unknown) => `${t}:${typeof c === 'object' && c ? (c as { capture?: boolean }).capture : !!c}`;
  const add = vi.spyOn(window, 'addEventListener').mockImplementation(((t: string, _l: unknown, c?: unknown) => {
    live.set(key(t, c), (live.get(key(t, c)) ?? 0) + 1);
  }) as never);
  const rem = vi.spyOn(window, 'removeEventListener').mockImplementation(((t: string, _l: unknown, c?: unknown) => {
    live.set(key(t, c), (live.get(key(t, c)) ?? 0) - 1);
  }) as never);
  return { live, restore: () => (add.mockRestore(), rem.mockRestore()) };
}

afterEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  localStorage.clear();
});

describe('listener and observer lifecycle', () => {
  it('inspect mode removes every listener it added', () => {
    const spy = spyListeners();
    const stop = startInspect({ onHover: () => {}, onSelect: () => {} });
    expect([...spy.live.values()].some((n) => n > 0)).toBe(true);
    stop();
    expect([...spy.live.entries()].filter(([, n]) => n !== 0)).toEqual([]);
    spy.restore();
  });

  it('attaches nothing while inspect is inactive', () => {
    const spy = spyListeners();
    const s = new StudioSession({ persist: false });
    s.start();
    // Only the always-on shortcut listener may exist; no pointer/click capture.
    const live = [...spy.live.entries()].filter(([, n]) => n > 0).map(([k]) => k.split(':')[0]);
    expect(live).not.toContain('pointermove');
    expect(live).not.toContain('click');
    expect(live).not.toContain('pointerdown');
    s.stop();
    spy.restore();
  });

  it('session start/stop is balanced and removes the override style and overlay', () => {
    const spy = spyListeners();
    const s = new StudioSession({ persist: false });
    s.start();
    s.store.setValue('--radius-element', 'both', '3px');
    s.startInspecting();
    expect(document.getElementById(OVERLAY_ID)).not.toBeNull();
    expect(document.querySelector('style[data-astryx-theme-studio]')).not.toBeNull();
    s.stop();
    expect([...spy.live.entries()].filter(([, n]) => n !== 0)).toEqual([]);
    expect(document.getElementById(OVERLAY_ID)).toBeNull();
    expect(document.querySelector('style[data-astryx-theme-studio]')).toBeNull();
    spy.restore();
  });

  it('is ref-counted so StrictMode mount/unmount/mount leaves one set of listeners', () => {
    const spy = spyListeners();
    const s = new StudioSession({ persist: false });
    s.start();
    s.start();
    s.stop();
    const open = [...spy.live.values()].reduce((a, b) => a + b, 0);
    s.stop();
    expect([...spy.live.entries()].filter(([, n]) => n !== 0)).toEqual([]);
    expect(open).toBeGreaterThan(0);
    spy.restore();
  });

  it('does not touch localStorage when persistence is off', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem');
    const set = vi.spyOn(Storage.prototype, 'setItem');
    const s = new StudioSession({ persist: false });
    s.start();
    s.store.setValue('--radius-element', 'both', '3px');
    s.stop();
    expect(get).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
    get.mockRestore();
    set.mockRestore();
  });

  it('impact engine observer is only active between activate and deactivate', () => {
    const observe = vi.spyOn(MutationObserver.prototype, 'observe');
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const e = new ImpactEngine();
    e.activate();
    expect(observe).toHaveBeenCalledTimes(1);
    e.deactivate();
    expect(disconnect).toHaveBeenCalled();
    observe.mockRestore();
    disconnect.mockRestore();
  });

  it('overlay stops its animation-frame loop on unmount', () => {
    const cancel = vi.spyOn(window, 'cancelAnimationFrame');
    const o = new OverlayLayer();
    o.mount();
    o.setBoxes([{ el: document.body, kind: 'hover' }]);
    o.unmount();
    expect(cancel).toHaveBeenCalled();
    expect(document.getElementById(OVERLAY_ID)).toBeNull();
    cancel.mockRestore();
  });
});

describe('DOM safety', () => {
  it('overlay and selection never modify application nodes', () => {
    document.body.innerHTML = '<div id="app"><button class="astryx-button" data-variant="primary">Go</button></div>';
    const before = document.getElementById('app')!.outerHTML;
    const o = new OverlayLayer();
    o.mount();
    o.setBoxes([{ el: document.querySelector('button')!, kind: 'selected', label: 'Button' }]);
    detectComponent(document.querySelector('button')!);
    o.unmount();
    expect(document.getElementById('app')!.outerHTML).toBe(before);
    expect(document.getElementById(ROOT_ID)).toBeNull();
  });
});

describe('component detection', () => {
  it('uses stable astryx classes only', () => {
    document.body.innerHTML = '<div class="astryx-card default"><span><b id="x">t</b></span></div><div class="card"><i id="y"></i></div>';
    const c = detectComponent(document.getElementById('x')!);
    expect(c).toMatchObject({ identified: true, name: 'Card', isPart: true });
    expect(detectComponent(document.getElementById('y')!).identified).toBe(false);
  });
  it('turns kebab names into PascalCase and reads data props', () => {
    document.body.innerHTML = '<div class="astryx-text-input" data-size="md" data-astryx-id="q"></div>';
    const c = detectComponent(document.querySelector('div')!);
    expect(c.name).toBe('TextInput');
    expect(c.props).toEqual({ size: 'md' });
  });
});
