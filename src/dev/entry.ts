import { createElement, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AstryxThemeStudio } from '../ui/ThemeStudio';
import { isDevEnvironment } from './env';
import type { StudioOptions } from './session';

export { AstryxThemeStudio };
export type { StudioOptions };
export { DEFAULT_SHORTCUTS } from './shortcuts';
export type { ShortcutMap, ShortcutAction } from './shortcuts';

let root: Root | undefined;
let hostEl: HTMLElement | undefined;

/**
 * Convenience mount: creates `#astryx-theme-studio-root` beside the app and renders the studio into it.
 * Safe to call more than once. A no-op outside development.
 */
export function mountAstryxThemeStudio(options: StudioOptions = {}): () => void {
  if (!isDevEnvironment() || typeof document === 'undefined') return () => {};
  if (!root) {
    hostEl = document.createElement('div');
    hostEl.id = 'astryx-theme-studio-root';
    document.body.appendChild(hostEl);
    root = createRoot(hostEl);
    root.render(createElement(StrictMode, null, createElement(AstryxThemeStudio, options)));
  }
  return () => {
    root?.unmount();
    hostEl?.remove();
    root = undefined;
    hostEl = undefined;
  };
}
