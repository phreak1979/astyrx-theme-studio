import type { Page } from '@playwright/test';

export const DEV = 'http://localhost:5199';
export const PREVIEW = 'http://localhost:5198';
export const STORAGE_KEY = 'astryx-theme-studio:working-theme';

/** Load a dev route with a clean slate and open the panel. */
export async function openStudio(page: Page, route = '/') {
  await page.goto(DEV + '/');
  await page.evaluate(() => localStorage.clear());
  await page.goto(DEV + route);
  await page.locator('.launcher').waitFor();
  await page.locator('.launcher').click();
  await page.locator('.panel').waitFor();
}

export async function editToken(page: Page, token: string, label: string, value: string) {
  await page.locator('input[type=search]').fill(token);
  const row = page.locator(`.tok[data-token="${token}"]`);
  if (!(await row.locator('.editor').count())) await row.locator('.tok-row').click();
  await page.locator(`input[aria-label="${token} ${label}"]`).fill(value);
}

export const overrideCss = (page: Page) => page.evaluate(() => document.querySelector('style[data-astryx-theme-studio]')?.textContent ?? '');
export const cssVar = (page: Page, name: string, sel = 'main') =>
  page.evaluate(([n, s]) => getComputedStyle(document.querySelector(s!)!).getPropertyValue(n!).trim(), [name, sel]);
