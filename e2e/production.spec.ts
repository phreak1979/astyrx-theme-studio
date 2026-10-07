import { expect, test } from '@playwright/test';
import { PREVIEW, STORAGE_KEY } from './helpers';

test.describe('production build (vite preview)', () => {
  test('contains no studio: no launcher, overlay root, debug handle, or overrides', async ({ page }) => {
    const reads: string[] = [];
    await page.addInitScript((key) => {
      const get = Storage.prototype.getItem;
      Storage.prototype.getItem = function (k: string) {
        if (k.startsWith('astryx-theme-studio')) (window as unknown as { __reads: string[] }).__reads = [...((window as unknown as { __reads?: string[] }).__reads ?? []), k];
        return get.call(this, k);
      };
      localStorage.setItem(key, JSON.stringify({ v: 1, astryxVersion: '0.6.5', savedAt: '', theme: { meta: {}, overrides: { '--color-accent': { light: '#ff0000', dark: '#ff0000' } } } }));
    }, STORAGE_KEY);
    await page.goto(PREVIEW + '/');
    await expect(page.locator('main h1')).toHaveText('Dashboard');
    await page.waitForTimeout(800);

    expect(await page.locator('[data-ats-host]').count()).toBe(0);
    expect(await page.locator('#astryx-theme-studio-root').count()).toBe(0);
    expect(await page.locator('#astryx-theme-studio-overlay').count()).toBe(0);
    expect(await page.locator('style[data-astryx-theme-studio]').count()).toBe(0);
    expect(await page.evaluate(() => '__ASTRYX_THEME_STUDIO__' in globalThis)).toBe(false);
    reads.push(...(await page.evaluate(() => (window as unknown as { __reads?: string[] }).__reads ?? [])));
    expect(reads).toEqual([]);

    // A saved development theme is never restored in production.
    await expect(page.locator('main button').first()).not.toHaveCSS('background-color', 'rgb(255, 0, 0)');

    // Shortcuts do nothing.
    await page.keyboard.press('Control+Shift+A');
    await page.keyboard.press('Control+Shift+I');
    await page.waitForTimeout(200);
    expect(await page.locator('[data-ats-host]').count()).toBe(0);
    expect(await page.locator('#astryx-theme-studio-overlay').count()).toBe(0);
  });

  test('requests no studio chunk', async ({ page }) => {
    const urls: string[] = [];
    page.on('request', (r) => urls.push(r.url()));
    await page.goto(PREVIEW + '/');
    await page.waitForLoadState('networkidle');
    expect(urls.filter((u) => /theme-studio|mountAstryx/i.test(u))).toEqual([]);
  });
});
