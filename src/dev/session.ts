import { tokenDefaults } from '@astryxdesign/core/theme';
import { ImpactEngine, type ImpactResult } from '../core/impact-engine';
import { ImpactIndex, currentRoute } from '../core/impact-index';
import { createMiniStore, type MiniStore } from '../core/mini-store';
import { startOverrideInjector, type OverrideInjector } from '../core/override-injector';
import { ThemeStore, type Mode } from '../core/theme-state';
import { buildRegistry, readHostValues, type TokenRegistry } from '../core/token-registry';
import { injectedAstryxVersion } from '../core/version';
import { detectComponent, type ComponentInfo } from '../inspector/component-detector';
import { startInspect } from '../inspector/element-selector';
import { isStudioNode, STYLE_MARKER } from '../inspector/ids';
import { OverlayLayer, type OverlayBox } from '../inspector/overlay';
import { inspectElement, type ElementReport } from '../inspector/token-detector';
import { clearSaved, loadSaved, loadUiState, saveUiState, startAutosave, WORKING_THEME_KEY, type SavedWorkingTheme } from '../persistence/local-storage';
import { isDevEnvironment } from './env';
import { DEFAULT_SHORTCUTS, isEditableTarget, resolveAction, type ShortcutMap } from './shortcuts';

export interface StudioOptions {
  /** Installed `@astryxdesign/core` version. Defaults to the value injected by the Vite plugin. */
  astryxVersion?: string;
  /** Persist the working theme to localStorage (development only). Default true. */
  persist?: boolean;
  /** localStorage key for the working theme. */
  storageKey?: string;
  /** Override or disable (`false`) individual shortcuts. */
  shortcuts?: Partial<ShortcutMap>;
  /** Start with the panel open. Default false (launcher only). */
  defaultOpen?: boolean;
  /** Log a profiling message when an impact scan takes longer than this many ms. Default 50. */
  profileThresholdMs?: number;
}

export type Tab = 'theme' | 'inspect' | 'impact' | 'export';
export type Dock = 'left' | 'right' | 'float';

export interface UiState {
  open: boolean;
  collapsed: boolean;
  dock: Dock;
  width: number;
  height: number;
  x: number;
  y: number;
  launcher: { x: number; y: number } | null;
  launcherMini: boolean;
  tab: Tab;
  inspecting: boolean;
  selected: Element | null;
  component: ComponentInfo | null;
  report: ElementReport | null;
  /** Report for the Astryx component root when the selection is an inner part of it. */
  rootReport: ElementReport | null;
  impactToken: string | null;
  impact: ImpactResult | null;
  /** Result of the slower sentinel-diff check against the stylesheet scan. */
  verify: { changing: number; stateOnly: number; extra: Element[] } | null;
  dimOthers: boolean;
  restorePrompt: SavedWorkingTheme | null;
  /** Token the Theme tab should reveal and expand. */
  focusToken: string | null;
  /** Shown after the app switched themes underneath the developer's edits. */
  themeNotice: string | null;
}

const PERSISTED: (keyof UiState)[] = ['open', 'collapsed', 'dock', 'width', 'height', 'x', 'y', 'launcher', 'launcherMini', 'dimOthers'];

export class StudioSession {
  readonly registry: TokenRegistry;
  readonly store: ThemeStore;
  readonly impact: ImpactEngine;
  readonly impactIndex = new ImpactIndex();
  readonly overlay = new OverlayLayer();
  readonly ui: MiniStore<UiState>;
  readonly astryxVersion: string | null;
  readonly shortcuts: ShortcutMap;
  private refs = 0;
  private disposers: (() => void)[] = [];
  private stopInspectFn: (() => void) | null = null;
  private stopRouteWatch: (() => void) | null = null;
  private hover: Element | null = null;
  private focusEl: Element | null = null;
  private focusTimer: ReturnType<typeof setTimeout> | undefined;
  private autosaveStop: (() => void) | null = null;
  private injector: OverrideInjector | null = null;

  constructor(readonly options: StudioOptions = {}) {
    this.astryxVersion = options.astryxVersion ?? injectedAstryxVersion();
    this.registry = buildRegistry(tokenDefaults as Record<string, string>, { astryxVersion: this.astryxVersion });
    this.store = new ThemeStore(this.registry, readHostValues(this.registry));
    this.shortcuts = { ...DEFAULT_SHORTCUTS, ...options.shortcuts };
    this.impact = new ImpactEngine({
      thresholdMs: options.profileThresholdMs ?? 50,
      log: (m) => console.info(m),
    });

    const persist = options.persist !== false;
    const saved = persist ? loadUiState<Partial<UiState>>({}) : {};
    const restore = persist ? loadSaved(options.storageKey ?? WORKING_THEME_KEY) : null;
    this.ui = createMiniStore<UiState>({
      open: options.defaultOpen ?? false,
      collapsed: false,
      dock: 'right',
      width: 380,
      height: 560,
      x: 24,
      y: 24,
      launcher: null,
      launcherMini: false,
      tab: 'theme',
      dimOthers: false,
      ...saved,
      inspecting: false,
      selected: null,
      component: null,
      report: null,
      rootReport: null,
      impactToken: null,
      impact: null,
      verify: null,
      restorePrompt: restore && Object.keys(restore.theme.overrides).length ? restore : null,
      focusToken: null,
      themeNotice: null,
    });
  }

  get persist(): boolean {
    return this.options.persist !== false;
  }

  /** Ref-counted so React StrictMode's mount/unmount/mount leaves exactly one set of listeners. */
  start(): void {
    if (this.refs++ > 0) return;
    const d = this.disposers;
    this.injector = startOverrideInjector(this.store);
    d.push(() => {
      this.injector?.dispose();
      this.injector = null;
    });
    d.push(this.watchAppTheme());
    d.push(this.watchAppMode());
    d.push(this.listenShortcuts());
    if (this.persist) {
      d.push(
        this.ui.subscribe(() => {
          const s = this.ui.get();
          saveUiState(Object.fromEntries(PERSISTED.map((k) => [k, s[k]])));
        }),
      );
      const maybeAutosave = () => {
        if (!this.autosaveStop && !this.ui.get().restorePrompt) {
          this.autosaveStop = startAutosave(this.store, this.astryxVersion, { key: this.options.storageKey });
        }
      };
      maybeAutosave();
      d.push(this.ui.subscribe(maybeAutosave));
      d.push(() => {
        this.autosaveStop?.();
        this.autosaveStop = null;
      });
    }
  }

  stop(): void {
    if (--this.refs > 0) return;
    this.refs = 0;
    this.exitModes();
    this.overlay.unmount();
    this.impact.dispose();
    for (const dispose of this.disposers.splice(0).reverse()) dispose();
  }

  // ---- app theme changes ----
  /**
   * Re-read the app's real theme values. Overrides are lifted for the read (synchronously, so nothing
   * paints in between), then restored. Call after the app switches themes.
   */
  refreshOriginals(): { changed: number } {
    const read = () => readHostValues(this.registry);
    const host = this.injector ? this.injector.suspend(read) : read();
    const res = this.store.rebase(host);
    this.impact.invalidate();
    if (this.ui.get().impactToken) this.runImpact(true);
    return res;
  }

  dismissThemeNotice(): void {
    this.ui.set({ themeNotice: null });
  }

  private watchAppTheme(): () => void {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastRoot = this.store.getSnapshot().rootThemeName;
    const schedule = (delay: number) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const { changed } = this.refreshOriginals();
        const snap = this.store.getSnapshot();
        const switched = snap.rootThemeName !== lastRoot;
        lastRoot = snap.rootThemeName;
        if (switched && changed > 0) {
          this.ui.set({
            themeNotice: snap.modified.length
              ? `The app switched to theme "${snap.rootThemeName ?? 'unknown'}". Originals were re-read; your ${snap.modified.length} edit(s) still apply on top.`
              : `The app switched to theme "${snap.rootThemeName ?? 'unknown'}". Originals were re-read.`,
          });
        }
      }, delay);
    };
    // A root <Theme> swap changes data-astryx-theme on <html>.
    const unsub = this.store.subscribe(() => {
      const root = this.store.getSnapshot().rootThemeName;
      if (root !== lastRoot) schedule(150);
    });
    // Built themes and runtime themes both add or remove <style>/<link> elements in <head>.
    const ours = (n: Node) => n instanceof Element && n.hasAttribute(STYLE_MARKER);
    const mo = new MutationObserver((records) => {
      const relevant = records.some((r) => {
        const touched = [...Array.from(r.addedNodes), ...Array.from(r.removedNodes)];
        if (touched.length) return touched.some((n) => !ours(n));
        const el = r.target instanceof Element ? r.target : r.target.parentElement;
        return !(el && ours(el));
      });
      if (relevant) schedule(300);
    });
    mo.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => {
      clearTimeout(timer);
      unsub();
      mo.disconnect();
    };
  }

  // ---- restore prompt ----
  acceptRestore(): { dropped: string[] } {
    const saved = this.ui.get().restorePrompt;
    if (!saved) return { dropped: [] };
    const res = this.store.hydrate(saved.theme);
    this.ui.set({ restorePrompt: null });
    return res;
  }

  discardRestore(): void {
    clearSaved(this.options.storageKey ?? WORKING_THEME_KEY);
    this.ui.set({ restorePrompt: null });
  }

  // ---- panel ----
  toggleOpen(): void {
    const s = this.ui.get();
    this.ui.set({ open: !s.open || s.collapsed, collapsed: false });
    if (!this.ui.get().open) this.exitModes();
  }

  setTab(tab: Tab): void {
    this.ui.set({ tab });
  }

  revealToken(token: string): void {
    this.ui.set({ open: true, collapsed: false, tab: 'theme', focusToken: token });
  }

  // ---- inspect ----
  toggleInspect(): void {
    if (this.ui.get().inspecting) this.stopInspecting();
    else this.startInspecting();
  }

  startInspecting(): void {
    if (this.stopInspectFn) return;
    this.stopImpact();
    this.overlay.mount();
    this.stopInspectFn = startInspect({
      onHover: (el) => {
        this.hover = el;
        this.syncOverlay();
      },
      onSelect: (el) => this.selectElement(el),
    });
    this.ui.set({ inspecting: true, open: true, collapsed: false, tab: 'inspect' });
  }

  stopInspecting(): void {
    this.stopInspectFn?.();
    this.stopInspectFn = null;
    this.hover = null;
    this.ui.set({ inspecting: false });
    this.syncOverlay();
  }

  selectElement(el: Element): void {
    if (isStudioNode(el)) return;
    const index = this.impact.getIndex();
    const component = detectComponent(el);
    this.ui.set({
      selected: el,
      component,
      report: inspectElement(el, index, this.registry),
      rootReport: component.identified && component.isPart && component.root ? inspectElement(component.root, index, this.registry) : null,
      tab: 'inspect',
      open: true,
      collapsed: false,
    });
    this.syncOverlay();
  }

  clearSelection(): void {
    this.ui.set({ selected: null, component: null, report: null, rootReport: null });
    this.syncOverlay();
  }

  // ---- impact ----
  showImpact(token: string): void {
    this.stopInspecting();
    this.overlay.mount();
    this.impact.activate();
    this.ui.set({ impactToken: token, open: true, collapsed: false, tab: 'impact' });
    this.runImpact(true);
    this.startRouteWatch();
  }

  /** Re-run the scan for the active token and record it against the current route. */
  runImpact(fresh = false): void {
    const token = this.ui.get().impactToken;
    if (!token) return;
    const result = this.impact.analyse(token, { fresh });
    this.impactIndex.record(token, currentRoute(), result.total);
    this.ui.set({ impact: result, verify: null });
    this.syncOverlay();
  }

  /**
   * Cross-check the scan: set the token to sentinel values and see which elements' computed styles
   * change. Extras are elements affected by inheritance or by styles the scan could not read.
   */
  verifyImpact(): void {
    const { impactToken, impact } = this.ui.get();
    if (!impactToken || !impact) return;
    const hit = this.impact.verifyBySentinel(impactToken);
    const scanned = new Set(impact.elements);
    const hitSet = new Set(hit);
    this.ui.set({
      verify: {
        changing: impact.elements.filter((el) => hitSet.has(el)).length,
        stateOnly: impact.elements.filter((el) => !hitSet.has(el)).length,
        extra: hit.filter((el) => !scanned.has(el)),
      },
    });
    this.syncOverlay();
  }

  stopImpact(): void {
    this.stopRouteWatch?.();
    this.stopRouteWatch = null;
    this.impact.deactivate();
    if (this.ui.get().impactToken) this.ui.set({ impactToken: null, impact: null, verify: null });
    this.syncOverlay();
  }

  setDim(dim: boolean): void {
    this.ui.set({ dimOthers: dim });
    this.overlay.setDim(dim);
    this.syncOverlay();
  }

  focusElement(el: Element): void {
    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
    this.focusEl = el;
    clearTimeout(this.focusTimer);
    this.focusTimer = setTimeout(() => {
      this.focusEl = null;
      this.syncOverlay();
    }, 1800);
    this.syncOverlay();
  }

  exitModes(): boolean {
    const s = this.ui.get();
    const active = s.inspecting || !!s.impactToken;
    this.stopInspecting();
    this.stopImpact();
    return active;
  }

  private syncOverlay(): void {
    const s = this.ui.get();
    const boxes: OverlayBox[] = [];
    if (s.impact) for (const el of s.impact.elements) boxes.push({ el, kind: 'impact' });
    if (s.verify) for (const el of s.verify.extra) boxes.push({ el, kind: 'hover' });
    if (s.selected) boxes.push({ el: s.selected, kind: 'selected', label: s.component?.identified ? s.component.name : undefined });
    if (this.hover && this.hover !== s.selected) boxes.push({ el: this.hover, kind: 'hover', label: detectComponent(this.hover).name });
    if (this.focusEl) boxes.push({ el: this.focusEl, kind: 'focus' });
    this.overlay.setDim(s.dimOthers);
    if (!boxes.length && !s.inspecting && !s.impactToken) {
      this.overlay.unmount();
      return;
    }
    if (!this.overlay.mounted) this.overlay.mount();
    this.overlay.setBoxes(boxes);
  }

  // ---- watchers ----
  private startRouteWatch(): void {
    if (this.stopRouteWatch) return;
    let last = currentRoute();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const changed = () => {
      const now = currentRoute();
      if (now === last) return;
      last = now;
      clearTimeout(timer);
      // Let the new route render before scanning it.
      timer = setTimeout(() => this.runImpact(true), 350);
    };
    const nav = (window as unknown as { navigation?: EventTarget }).navigation;
    let interval: ReturnType<typeof setInterval> | undefined;
    if (nav) nav.addEventListener('navigatesuccess', changed);
    else interval = setInterval(changed, 400);
    window.addEventListener('popstate', changed);
    window.addEventListener('hashchange', changed);
    this.stopRouteWatch = () => {
      clearTimeout(timer);
      if (nav) nav.removeEventListener('navigatesuccess', changed);
      if (interval) clearInterval(interval);
      window.removeEventListener('popstate', changed);
      window.removeEventListener('hashchange', changed);
    };
  }

  private watchAppMode(): () => void {
    const detect = (): Mode => {
      const cs = getComputedStyle(document.documentElement).colorScheme;
      if (cs === 'dark') return 'dark';
      if (cs === 'light') return 'light';
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };
    const updateRoot = () => this.store.setRootThemeName(document.documentElement.getAttribute('data-astryx-theme'));
    const update = () => {
      updateRoot();
      // While a mode is forced the computed value is ours, so only follow the app in auto.
      if (this.store.getSnapshot().previewMode === 'auto') this.store.setAppMode(detect());
    };
    update();
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-astryx-theme', 'class', 'style'] });
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    mq?.addEventListener('change', update);
    const unsub = this.store.subscribe(update);
    return () => {
      mo.disconnect();
      mq?.removeEventListener('change', update);
      unsub();
    };
  }

  private listenShortcuts(): () => void {
    const onKey = (e: KeyboardEvent) => {
      const action = resolveAction(e, this.shortcuts);
      if (!action) return;
      const target = (e.composedPath?.()[0] ?? e.target) as EventTarget | null;
      switch (action) {
        case 'open':
          e.preventDefault();
          this.toggleOpen();
          break;
        case 'inspect':
          e.preventDefault();
          this.toggleInspect();
          break;
        case 'exit':
          if (this.exitModes()) e.preventDefault();
          break;
        case 'undo':
        case 'redo':
          if (!this.ui.get().open || isEditableTarget(target)) return;
          e.preventDefault();
          if (action === 'undo') this.store.undo();
          else this.store.redo();
          break;
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }
}

let singleton: StudioSession | null = null;

/** Returns null outside development so callers render nothing and register nothing. */
export function getSession(options?: StudioOptions): StudioSession | null {
  if (!isDevEnvironment()) return null;
  if (typeof document === 'undefined') return null;
  if (!singleton) {
    singleton = new StudioSession(options);
    // Handle for debugging and end-to-end tests. Development only: getSession is a no-op in production.
    (globalThis as { __ASTRYX_THEME_STUDIO__?: StudioSession }).__ASTRYX_THEME_STUDIO__ = singleton;
  }
  return singleton;
}

/** Test helper. */
export function resetSessionForTests(): void {
  singleton?.stop();
  singleton = null;
}
