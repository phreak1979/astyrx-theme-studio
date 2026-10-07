import { OVERLAY_ID } from './ids';

export type BoxKind = 'hover' | 'selected' | 'impact' | 'focus';

export interface OverlayBox {
  el: Element;
  kind: BoxKind;
  label?: string;
}

const CSS = `
:host { all: initial; }
.layer { position: fixed; inset: 0; pointer-events: none; z-index: 2147483646; }
.box { position: fixed; box-sizing: border-box; pointer-events: none; border-radius: 2px; }
.box.hover { border: 1.5px solid #4da3ff; background: rgba(77,163,255,.14); }
.box.selected { border: 2px solid #ff8a3d; background: rgba(255,138,61,.12); }
.box.impact { border: 1.5px solid #ff3d9a; background: rgba(255,61,154,.16); }
.box.focus { border: 3px solid #ffd23d; background: rgba(255,210,61,.25); box-shadow: 0 0 0 4px rgba(255,210,61,.35); }
.tag { position: absolute; left: -1.5px; top: -20px; font: 600 11px/18px system-ui, sans-serif; color: #fff; background: #1b1b1f; padding: 0 6px; border-radius: 3px; white-space: nowrap; }
.dim { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; }
`;

/**
 * Independent overlay layer. It lives in its own shadow-rooted host appended to <body>,
 * never touches application nodes, and positions boxes from getBoundingClientRect().
 * The rAF loop runs only while there is something to draw.
 */
export class OverlayLayer {
  private host: HTMLElement | null = null;
  private layer: HTMLElement | null = null;
  private dimSvg: SVGSVGElement | null = null;
  private boxes: OverlayBox[] = [];
  private dim = false;
  private raf = 0;
  private lastSig = '';
  private pool: HTMLElement[] = [];

  constructor(private doc: Document = document) {}

  get mounted(): boolean {
    return !!this.host;
  }

  mount(): void {
    if (this.host) return;
    const host = this.doc.createElement('div');
    host.id = OVERLAY_ID;
    const shadow = host.attachShadow({ mode: 'open' });
    const style = this.doc.createElement('style');
    style.textContent = CSS;
    const layer = this.doc.createElement('div');
    layer.className = 'layer';
    shadow.append(style, layer);
    this.doc.body.appendChild(host);
    this.host = host;
    this.layer = layer;
    this.lastSig = '';
    this.schedule();
  }

  unmount(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.host?.remove();
    this.host = null;
    this.layer = null;
    this.dimSvg = null;
    this.pool = [];
    this.boxes = [];
  }

  setBoxes(boxes: OverlayBox[]): void {
    this.boxes = boxes;
    this.lastSig = '';
    if (this.host) this.schedule();
  }

  setDim(dim: boolean): void {
    this.dim = dim;
    this.lastSig = '';
  }

  private schedule(): void {
    if (this.raf || !this.host) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.render();
      // Keep following layout only while there is something to draw.
      if (this.host && this.boxes.length) this.schedule();
    });
  }

  private render(): void {
    if (!this.layer) return;
    const rects = this.boxes.map((b) => {
      const r = b.el.isConnected ? b.el.getBoundingClientRect() : null;
      return r && (r.width > 0 || r.height > 0) ? r : null;
    });
    const sig = rects.map((r, i) => (r ? `${this.boxes[i]!.kind}:${r.left | 0},${r.top | 0},${r.width | 0},${r.height | 0}` : 'x')).join(';') + (this.dim ? '|d' : '');
    if (sig === this.lastSig) return;
    this.lastSig = sig;

    let used = 0;
    this.boxes.forEach((b, i) => {
      const r = rects[i];
      if (!r) return;
      let node = this.pool[used];
      if (!node) {
        node = this.doc.createElement('div');
        this.layer!.appendChild(node);
        this.pool[used] = node;
      }
      used++;
      node.className = `box ${b.kind}`;
      node.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;`;
      node.replaceChildren();
      if (b.label) {
        const tag = this.doc.createElement('span');
        tag.className = 'tag';
        tag.textContent = b.label;
        node.appendChild(tag);
      }
    });
    for (let i = used; i < this.pool.length; i++) this.pool[i]!.remove();
    this.pool.length = used;

    this.renderDim(rects.filter((r, i): r is DOMRect => !!r && this.boxes[i]!.kind === 'impact'));
  }

  private renderDim(holes: DOMRect[]): void {
    if (!this.layer) return;
    if (!this.dim || !holes.length) {
      this.dimSvg?.remove();
      this.dimSvg = null;
      return;
    }
    const ns = 'http://www.w3.org/2000/svg';
    if (!this.dimSvg) {
      this.dimSvg = this.doc.createElementNS(ns, 'svg');
      this.dimSvg.setAttribute('class', 'dim');
      this.layer.insertBefore(this.dimSvg, this.layer.firstChild);
    }
    const svg = this.dimSvg;
    svg.replaceChildren();
    const mask = this.doc.createElementNS(ns, 'mask');
    mask.setAttribute('id', 'ats-dim');
    const white = this.doc.createElementNS(ns, 'rect');
    white.setAttribute('width', '100%');
    white.setAttribute('height', '100%');
    white.setAttribute('fill', '#fff');
    mask.appendChild(white);
    for (const r of holes) {
      const hole = this.doc.createElementNS(ns, 'rect');
      hole.setAttribute('x', String(r.left));
      hole.setAttribute('y', String(r.top));
      hole.setAttribute('width', String(r.width));
      hole.setAttribute('height', String(r.height));
      hole.setAttribute('fill', '#000');
      mask.appendChild(hole);
    }
    const cover = this.doc.createElementNS(ns, 'rect');
    cover.setAttribute('width', '100%');
    cover.setAttribute('height', '100%');
    cover.setAttribute('fill', 'rgba(0,0,0,.45)');
    cover.setAttribute('mask', 'url(#ats-dim)');
    svg.append(mask, cover);
  }
}
