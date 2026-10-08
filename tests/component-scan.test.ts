import { afterEach, describe, expect, it } from 'vitest';
import { MAX_PROP_VALUES, scanComponents } from '../src/inspector/component-scan';
import { OVERLAY_ID, ROOT_ID } from '../src/inspector/ids';

function mount(html: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('scanComponents', () => {
  it('groups roots by stable class with counts', () => {
    mount(`
      <div class="astryx-card"></div><div class="astryx-card"></div><div class="astryx-card"></div>
      <button class="astryx-button"></button><button class="astryx-button"></button>`);
    const scan = scanComponents();
    expect(scan.total).toBe(5);
    expect(scan.groups.map((g) => [g.name, g.count])).toEqual([
      ['Card', 3],
      ['Button', 2],
    ]);
  });

  it('ignores elements without a stable astryx class', () => {
    mount(`<div class="card"></div><div class="my-astryx-thing"></div><div class="astryx-"></div>`);
    expect(scanComponents().total).toBe(0);
  });

  it('keeps a nested component (Button in Card) as its own root', () => {
    mount(`<div class="astryx-card"><button class="astryx-button"></button></div>`);
    expect(scanComponents().groups.map((g) => g.name).sort()).toEqual(['Button', 'Card']);
  });

  it('treats inner parts as parts of the owner, not as components', () => {
    mount(`<div class="astryx-card"><div class="astryx-card-header"></div><div class="astryx-card-footer"></div></div>`);
    const scan = scanComponents();
    expect(scan.groups).toHaveLength(1);
    expect(scan.groups[0]!.name).toBe('Card');
    expect(scan.groups[0]!.count).toBe(1);
    expect(scan.groups[0]!.parts).toEqual(['footer', 'header']);
  });

  it('finds the owner past an intermediate part (table row under table header)', () => {
    mount(`<table class="astryx-table astryx-base-table"><thead class="astryx-table-header"><tr class="astryx-table-row"></tr></thead></table>`);
    const scan = scanComponents();
    expect(scan.groups.map((g) => g.name)).toEqual(['Table']);
    expect(scan.groups[0]!.parts).toEqual(['header', 'row']);
  });

  it('uses the first stable class for the name, like Inspect', () => {
    mount(`<div class="astryx-popover astryx-popover-surface"></div>`);
    expect(scanComponents().groups[0]!.name).toBe('Popover');
  });

  it('aggregates data props as value counts, excluding data-astryx-*', () => {
    mount(`
      <button class="astryx-button" data-variant="secondary" data-astryx-edge-comp=""></button>
      <button class="astryx-button" data-variant="secondary"></button>
      <button class="astryx-button" data-variant="primary"></button>`);
    const g = scanComponents().groups[0]!;
    expect(g.props).toEqual([{ prop: 'variant', values: [{ value: 'secondary', count: 2 }, { value: 'primary', count: 1 }], more: 0 }]);
  });

  it('caps noisy props and reports how many were left out', () => {
    const n = MAX_PROP_VALUES + 3;
    mount(Array.from({ length: n }, (_, i) => `<div class="astryx-chip" data-key="c${i}"></div>`).join(''));
    const p = scanComponents().groups[0]!.props[0]!;
    expect(p.values).toHaveLength(MAX_PROP_VALUES);
    expect(p.more).toBe(3);
  });

  it('ignores the studio root and overlay', () => {
    mount(`<div id="${ROOT_ID}"><div class="astryx-button"></div></div><div id="${OVERLAY_ID}"><div class="astryx-card"></div></div>
      <div data-ats-host=""><div class="astryx-badge"></div></div><div class="astryx-text"></div>`);
    expect(scanComponents().groups.map((g) => g.name)).toEqual(['Text']);
  });

  it('does not modify the DOM', () => {
    const host = mount(`<div class="astryx-card" data-variant="default"><button class="astryx-button"></button></div>`);
    const before = host.innerHTML;
    scanComponents();
    expect(host.innerHTML).toBe(before);
  });

  it('lists the instance elements', () => {
    const host = mount(`<button class="astryx-button" id="a"></button><button class="astryx-button" id="b"></button>`);
    const g = scanComponents().groups[0]!;
    expect(g.elements).toEqual([host.querySelector('#a'), host.querySelector('#b')]);
  });
});
