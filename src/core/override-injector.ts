import { formatLightDark, isSafeCssValue } from './css-value';
import type { StoreSnapshot, ThemeStore } from './theme-state';

export const STYLE_ATTR = 'data-astryx-theme-studio';

/** Build the CSS text for the current snapshot. Pure, so it is easy to test. */
export function buildOverrideCss(snap: StoreSnapshot, registryHas: (t: string) => boolean): string {
  const decls: string[] = [];
  for (const [token, pair] of Object.entries(snap.overrides)) {
    if (!registryHas(token)) continue;
    const value = formatLightDark(pair.light, pair.dark);
    if (!isSafeCssValue(value)) continue;
    // `light-dark()` is only valid for colours; mode-neutral tokens hold equal values so this is a plain value.
    decls.push(`  ${token}: ${value};`);
  }
  // The app's own <Theme> wrapper declares tokens on itself, below <html>, so a plain `:root`
  // override is shadowed. Target the root theme by name; nested themes keep their own values
  // unless the developer opts in.
  const selector = snap.applyToNested
    ? ':root, [data-astryx-theme]'
    : snap.rootThemeName
      ? `:root, [data-astryx-theme="${snap.rootThemeName.replace(/["\\]/g, '\\$&')}"]`
      : ':root';
  const parts: string[] = [];
  if (decls.length) parts.push(`${selector} {\n${decls.join('\n')}\n}`);
  if (snap.previewMode !== 'auto') {
    // Unlayered, so it beats the layered colour-scheme set by <Theme> and reset.css.
    parts.push(`:root, [data-astryx-theme] { color-scheme: ${snap.previewMode}; }`);
  }
  return parts.join('\n');
}

/**
 * Keep a single unlayered <style> element in <head> in sync with the store.
 * Unlayered declarations beat every `@layer`, so no !important or component CSS is needed.
 */
export function startOverrideInjector(store: ThemeStore, doc: Document = document): () => void {
  let el: HTMLStyleElement | null = null;
  const apply = () => {
    const css = buildOverrideCss(store.getSnapshot(), (t) => store.registry.byName.has(t));
    if (!css) {
      el?.remove();
      el = null;
      return;
    }
    if (!el) {
      el = doc.createElement('style');
      el.setAttribute(STYLE_ATTR, 'overrides');
      doc.head.appendChild(el);
    }
    if (el.textContent !== css) el.textContent = css;
  };
  apply();
  const unsub = store.subscribe(apply);
  return () => {
    unsub();
    el?.remove();
    el = null;
  };
}
