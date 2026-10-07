export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const NAMED: Record<string, Rgba> = {
  black: { r: 0, g: 0, b: 0, a: 1 },
  white: { r: 255, g: 255, b: 255, a: 1 },
  transparent: { r: 0, g: 0, b: 0, a: 0 },
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function num(s: string, pctScale = 1): number {
  const t = s.trim();
  return t.endsWith('%') ? (parseFloat(t) / 100) * pctScale : parseFloat(t);
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

/** Parse the colour syntaxes we can evaluate reliably. Returns null for anything else. */
export function parseColor(input: string): Rgba | null {
  const v = input.trim().toLowerCase();
  if (NAMED[v]) return NAMED[v]!;
  let m = /^#([0-9a-f]{3,8})$/.exec(v);
  if (m) {
    let h = m[1]!;
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
    };
  }
  m = /^(rgba?|hsla?)\(([^)]*)\)$/.exec(v);
  if (!m) return null;
  const parts = m[2]!.split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const alpha = parts[3] !== undefined ? clamp(num(parts[3]!), 0, 1) : 1;
  if (m[1]!.startsWith('rgb')) {
    const ch = parts.slice(0, 3).map((p) => clamp(num(p, 255), 0, 255));
    return ch.some(Number.isNaN) ? null : { r: ch[0]!, g: ch[1]!, b: ch[2]!, a: alpha };
  }
  const h = parseFloat(parts[0]!);
  const s = clamp(num(parts[1]!), 0, 1);
  const l = clamp(num(parts[2]!), 0, 1);
  if ([h, s, l].some(Number.isNaN)) return null;
  const [r, g, b] = hslToRgb(h, s > 1 ? s / 100 : s, l > 1 ? l / 100 : l);
  return { r, g, b, a: alpha };
}

export function composite(fg: Rgba, bg: Rgba): Rgba {
  const a = fg.a + bg.a * (1 - fg.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const mix = (f: number, b: number) => (f * fg.a + b * bg.a * (1 - fg.a)) / a;
  return { r: mix(fg.r, bg.r), g: mix(fg.g, bg.g), b: mix(fg.b, bg.b), a };
}

function lin(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(c: Rgba): number {
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}

export function contrastRatio(fg: Rgba, bg: Rgba): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export interface WcagResult {
  ratio: number;
  aa: boolean;
  aaa: boolean;
  aaLarge: boolean;
}

export function wcag(ratio: number): WcagResult {
  return { ratio, aa: ratio >= 4.5, aaa: ratio >= 7, aaLarge: ratio >= 3 };
}
