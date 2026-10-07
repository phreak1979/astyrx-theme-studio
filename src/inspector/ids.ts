export const ROOT_ID = 'astryx-theme-studio-root';
export const OVERLAY_ID = 'astryx-theme-studio-overlay';
export const STUDIO_SELECTOR = `#${ROOT_ID}, #${OVERLAY_ID}`;
export const STYLE_MARKER = 'data-astryx-theme-studio';

export function isStudioNode(node: Node | null | undefined): boolean {
  let n: Node | null | undefined = node;
  while (n) {
    if (n instanceof Element && (n.id === ROOT_ID || n.id === OVERLAY_ID || n.hasAttribute('data-ats-host'))) return true;
    n = n.parentNode ?? (n as ShadowRoot).host ?? null;
  }
  return false;
}
