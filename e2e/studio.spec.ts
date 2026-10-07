import { expect, test } from '@playwright/test';
import { cssVar, DEV, editToken, openStudio, overrideCss, STORAGE_KEY } from './helpers';

test.describe('theme editing', () => {
  test('launcher appears in development and opens the panel', async ({ page }) => {
    await page.goto(DEV + '/');
    await expect(page.locator('.launcher')).toBeVisible();
    await expect(page.locator('#astryx-theme-studio-root')).toHaveCount(1);
    await page.locator('.launcher').click();
    await expect(page.locator('.panel')).toBeVisible();
    await expect(page.locator('.chip', { hasText: 'Astryx 0.6.5' })).toBeVisible();
  });

  test('exposes the complete registry and searches by name, category and value', async ({ page }) => {
    await openStudio(page);
    await expect(page.locator('.chips button', { hasText: /^All 258$/ })).toBeVisible();
    await page.locator('input[type=search]').fill('surface');
    await expect(page.locator('.tok[data-token="--color-background-surface"]')).toBeVisible();
    await page.locator('input[type=search]').fill('Shadows');
    await expect(page.locator('.tok[data-token="--shadow-low"]')).toBeVisible();
    await page.locator('input[type=search]').fill('1b1b1b');
    await expect(page.locator('.tok[data-token="--color-accent"]')).toBeVisible();
  });

  test('a valid edit updates the app live; an invalid one is rejected', async ({ page }) => {
    await openStudio(page);
    await editToken(page, '--color-accent', 'Light', '#ff0000');
    await expect(page.locator('main button').first()).toHaveCSS('background-color', 'rgb(255, 0, 0)');
    await page.locator('input[aria-label="--color-accent Light"]').fill('#12');
    await expect(page.locator('.err')).toBeVisible();
    await expect(page.locator('main button').first()).toHaveCSS('background-color', 'rgb(255, 0, 0)');
  });

  test('modified tracking, original value and reset', async ({ page }) => {
    await openStudio(page);
    await editToken(page, '--radius-element', 'value', '2px');
    await expect(page.locator('.chip', { hasText: '1 modified' })).toBeVisible();
    await expect(page.locator('.tok[data-token="--radius-element"] .dot.on')).toBeVisible();
    await expect(page.locator('.editor .muted', { hasText: /^Original:/ }).first()).toBeVisible();
    await page.locator('.editor button', { hasText: 'Reset' }).click();
    await expect(page.locator('.chip', { hasText: '0 modified' })).toBeVisible();
    expect(await overrideCss(page)).toBe('');
  });

  test('the working theme survives route changes', async ({ page }) => {
    await openStudio(page);
    await editToken(page, '--color-accent', 'Light', '#0a8f3c');
    for (const name of ['Customers', 'Settings', 'Dashboard']) {
      await page.locator('nav button', { hasText: name }).click();
      expect(await cssVar(page, '--color-accent')).toContain('#0a8f3c');
    }
    await expect(page.locator('.chip', { hasText: '1 modified' })).toBeVisible();
  });

  test('light and dark are independent and preview switches instantly', async ({ page }) => {
    await openStudio(page);
    await editToken(page, '--color-background-body', 'Dark', '#101820');
    expect(await overrideCss(page)).toContain('light-dark(');
    await page.locator('.seg button', { hasText: 'Dark' }).click();
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-background-body').trim())).toContain('#101820');
    await page.locator('.seg button', { hasText: 'Light' }).click();
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
    await page.locator('.seg button', { hasText: 'Auto' }).click();
  });

  test('nested Theme regions keep their own values unless opted in', async ({ page }) => {
    await openStudio(page, '/settings');
    await editToken(page, '--color-accent', 'Light', '#ff0000');
    await expect(page.locator('main button').first()).toHaveCSS('background-color', 'rgb(255, 0, 0)');
    await expect(page.locator('[data-testid=nested-region] button')).toHaveCSS('background-color', 'rgb(192, 38, 211)');
    await page.locator('label', { hasText: 'Also override nested' }).locator('input').check();
    await expect(page.locator('[data-testid=nested-region] button')).toHaveCSS('background-color', 'rgb(255, 0, 0)');
  });

  test('undo / redo via buttons and keyboard', async ({ page }) => {
    await openStudio(page);
    await editToken(page, '--radius-element', 'value', '2px');
    await page.locator('button[aria-label=Undo]').click();
    await expect(page.locator('.chip', { hasText: '0 modified' })).toBeVisible();
    await page.locator('button[aria-label=Redo]').click();
    await expect(page.locator('.chip', { hasText: '1 modified' })).toBeVisible();
    await page.locator('body').click({ position: { x: 5, y: 300 } });
    await page.keyboard.press('Control+z');
    await expect(page.locator('.chip', { hasText: '0 modified' })).toBeVisible();
    await page.keyboard.press('Control+Shift+z');
    await expect(page.locator('.chip', { hasText: '1 modified' })).toBeVisible();
  });

  test('multi-token resets ask for confirmation', async ({ page }) => {
    await openStudio(page);
    await editToken(page, '--radius-element', 'value', '2px');
    await editToken(page, '--radius-container', 'value', '3px');
    await page.locator('.foot button', { hasText: 'Reset ▾' }).click();
    await page.locator('[role=menuitem]', { hasText: 'entire theme' }).click();
    await expect(page.locator('[role=alertdialog]')).toBeVisible();
    await expect(page.locator('.chip', { hasText: '2 modified' })).toBeVisible();
    await page.locator('[role=alertdialog] button', { hasText: 'Reset' }).click();
    await expect(page.locator('.chip', { hasText: '0 modified' })).toBeVisible();
  });
});

test.describe('persistence', () => {
  test('refresh offers Continue / Discard and does not apply until chosen', async ({ page }) => {
    await openStudio(page);
    await editToken(page, '--color-accent', 'Light', '#ff0000');
    await page.waitForTimeout(500);
    await page.reload();
    // The panel's own open state is remembered across reloads.
    await expect(page.locator('.panel')).toBeVisible();
    await expect(page.locator('[role=alert]', { hasText: 'Working theme found' })).toBeVisible();
    expect(await overrideCss(page)).toBe('');
    await page.locator('button', { hasText: 'Continue Editing' }).click();
    await expect(page.locator('main button').first()).toHaveCSS('background-color', 'rgb(255, 0, 0)');
    await page.waitForTimeout(500);
    await page.reload();
    await expect(page.locator('.panel')).toBeVisible();
    await page.locator('button', { hasText: 'Discard' }).click();
    expect(await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY)).toBeNull();
    expect(await overrideCss(page)).toBe('');
  });
});

test.describe('isolation', () => {
  test('editing the surface token does not restyle the studio, and host CSS does not leak in', async ({ page }) => {
    await openStudio(page);
    const bg = () => page.locator('.panel').evaluate((e) => getComputedStyle(e).backgroundColor);
    const before = await bg();
    await page.addStyleTag({ content: 'button { background: red !important; color: lime !important; } * { font-family: monospace !important; }' });
    await editToken(page, '--color-background-surface', 'Light', '#ff0000');
    expect(await bg()).toBe(before);
    const btnBg = await page.locator('.foot button', { hasText: 'Export Theme' }).evaluate((e) => getComputedStyle(e).backgroundColor);
    expect(btnBg).not.toBe('rgb(255, 0, 0)');
  });
});

test.describe('inspect', () => {
  test('selects an Astryx component without firing its click or changing the DOM', async ({ page }) => {
    await openStudio(page);
    const before = await page.locator('#root').evaluate((e) => e.outerHTML);
    await page.locator('.tabs button', { hasText: 'Inspect' }).click();
    await page.locator('button', { hasText: '◎ Inspect' }).click();
    await page.locator('main button', { hasText: 'New order' }).click();
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(page.locator('.card h4', { hasText: 'Button' })).toBeVisible();
    await expect(page.locator('.card dd', { hasText: 'astryx-button' })).toBeVisible();
    await expect(page.locator('h4', { hasText: /Theme tokens \([1-9]/ }).first()).toBeVisible();
    const after = await page.locator('#root').evaluate((e) => e.outerHTML);
    expect(after).toBe(before);
    await page.keyboard.press('Escape');
    await expect(page.locator('button[aria-pressed=true]', { hasText: 'Inspecting' })).toHaveCount(0);
    // After exit the app handles clicks again.
    await page.locator('main button', { hasText: 'New order' }).click();
    await expect(page.locator('dialog[open]')).toHaveCount(1);
  });

  test('does not claim an application element is an Astryx component', async ({ page }) => {
    await openStudio(page);
    await page.locator('.tabs button', { hasText: 'Inspect' }).click();
    await page.locator('button', { hasText: '◎ Inspect' }).click();
    await page.locator('main').click({ position: { x: 2, y: 2 } });
    await expect(page.locator('.card h4', { hasText: 'Not identified' })).toBeVisible();
  });

  test('edits made from a selection update the global theme', async ({ page }) => {
    await openStudio(page);
    await page.locator('.tabs button', { hasText: 'Inspect' }).click();
    await page.locator('button', { hasText: '◎ Inspect' }).click();
    await page.locator('main button', { hasText: 'New order' }).click();
    await page.locator('.tok[data-token="--radius-element"] .tok-row').first().click();
    await page.locator('input[aria-label="--radius-element value"]').first().fill('0px');
    await expect(page.locator('main button', { hasText: 'New order' })).toHaveCSS('border-radius', '0px');
    await expect(page.locator('main button', { hasText: 'Filters' })).toHaveCSS('border-radius', '0px');
  });
});

test.describe('impact', () => {
  test('shows visible consumers, highlights them, and builds a per-route index', async ({ page }) => {
    await openStudio(page);
    await page.locator('.tabs button', { hasText: 'Impact' }).click();
    await page.locator('input[aria-label="Token to analyse"]').fill('--color-accent');
    await page.locator('button', { hasText: /^Show$/ }).click();
    const count = page.locator('.card div[style*="font-size: 18px"]');
    await expect(count).toContainText('elements affected');
    const n = Number((await count.innerText()).split(' ')[0]);
    expect(n).toBeGreaterThan(0);
    expect(await page.locator('#astryx-theme-studio-overlay').evaluate((h) => h.shadowRoot!.querySelectorAll('.box.impact').length)).toBeGreaterThan(0);
    await page.locator('nav button', { hasText: 'Customers' }).click();
    const known = page.locator('.card', { hasText: 'Known application impact' });
    await expect(known).toContainText('/customers', { timeout: 5000 });
    await expect(known.locator('tr').first()).toContainText('/');
    await expect(known.locator('tr')).toHaveCount(2);
    await expect(page.locator('.muted', { hasText: /observed uses/ })).toBeVisible();
    await page.locator('button', { hasText: 'Stop' }).click();
    await expect(page.locator('#astryx-theme-studio-overlay')).toHaveCount(0);
  });

  test('the sentinel cross-check agrees with the scan for a non-state token', async ({ page }) => {
    await openStudio(page);
    await page.locator('.tabs button', { hasText: 'Impact' }).click();
    await page.locator('input[aria-label="Token to analyse"]').fill('--radius-element');
    await page.locator('button', { hasText: /^Show$/ }).click();
    await page.locator('button', { hasText: 'Verify' }).click();
    await expect(page.getByTestId('verify')).toContainText(/5 of 5 listed elements change right now; the other 0/);
    expect(await page.locator('style[data-astryx-theme-studio=sentinel]').count()).toBe(0);
  });

  test('Show Impact from a token row, with grouping by component', async ({ page }) => {
    await openStudio(page);
    await page.locator('input[type=search]').fill('--color-on-accent');
    await page.locator('.tok[data-token="--color-on-accent"] .tok-row').click();
    await page.locator('.editor button', { hasText: 'Show Impact' }).click();
    await expect(page.locator('.group-btn', { hasText: 'Button' })).toBeVisible();
  });
});

test.describe('export / import', () => {
  test('valid theme is ready and exports defineTheme code and JSON', async ({ page }) => {
    await openStudio(page);
    await editToken(page, '--color-accent', 'Light', '#1663AA');
    await editToken(page, '--color-accent', 'Dark', '#4D9CE6');
    await page.locator('.tabs button', { hasText: 'Export' }).click();
    await page.locator('#ats-name').fill('Dream Score');
    await expect(page.locator('#ats-id')).toHaveValue('dream-score');
    await expect(page.getByTestId('ready')).toHaveText('Ready to export');
    const code = await page.getByTestId('code').innerText();
    expect(code).toContain("import { defineTheme } from '@astryxdesign/core/theme';");
    expect(code).toContain('export const dreamScoreTheme = defineTheme({');
    expect(code).toContain("'--color-accent': ['#1663AA', '#4D9CE6'],");
    const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('button', { hasText: 'Download JSON' }).click()]);
    expect(dl.suggestedFilename()).toBe('dream-score.theme.json');
  });

  test('round-trips through JSON import with a diff and explicit Apply', async ({ page }) => {
    await openStudio(page);
    await editToken(page, '--radius-element', 'value', '3px');
    await page.locator('.tabs button', { hasText: 'Export' }).click();
    const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('button', { hasText: 'Download JSON' }).click()]);
    const json = await (await import('node:fs/promises')).readFile((await dl.path())!, 'utf8');
    await page.locator('.tabs button', { hasText: 'Theme' }).click();
    await page.locator('.foot button', { hasText: 'Reset ▾' }).click();
    await page.locator('[role=menuitem]', { hasText: 'entire theme' }).click();
    await page.locator('.tabs button', { hasText: 'Export' }).click();
    await page.locator('textarea[aria-label="Theme JSON"]').fill(json);
    await expect(page.locator('strong', { hasText: '1 token changed' })).toBeVisible();
    expect(await overrideCss(page)).toBe('');
    await page.locator('button', { hasText: 'Apply' }).click();
    await expect(page.locator('main button').first()).toHaveCSS('border-radius', '3px');
  });

  test('bad JSON is rejected and does not change the theme', async ({ page }) => {
    await openStudio(page);
    await page.locator('.tabs button', { hasText: 'Export' }).click();
    await page.locator('textarea[aria-label="Theme JSON"]').fill('{"generator":"astryx-theme-studio","schemaVersion":1,"light":{"--nope":"1"},"dark":{"--nope":"1"}}');
    await expect(page.locator('.issue.error', { hasText: 'Unknown token --nope' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Apply' })).toHaveCount(0);
  });
});

test.describe('panel behaviour', () => {
  test('launcher can be dragged and its position is remembered', async ({ page }) => {
    await page.goto(DEV + '/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const launcher = page.locator('.launcher');
    await launcher.waitFor();
    const box = (await launcher.boundingBox())!;
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.down();
    await page.mouse.move(box.x - 300, box.y - 300, { steps: 6 });
    await page.mouse.up();
    await expect(page.locator('.panel')).toHaveCount(0);
    const moved = (await launcher.boundingBox())!;
    expect(Math.abs(moved.x - (box.x - 320))).toBeLessThan(30);
    await page.waitForTimeout(200);
    await page.reload();
    await launcher.waitFor();
    const again = (await launcher.boundingBox())!;
    expect(Math.round(again.x)).toBe(Math.round(moved.x));
    expect(Math.round(again.y)).toBe(Math.round(moved.y));
    // it can be minimised to an edge tab and expanded again
    await launcher.hover();
    await page.locator('.launcher-min').click();
    await expect(page.locator('.launcher.mini')).toBeVisible();
    await page.locator('.launcher.mini').click();
    await expect(page.locator('.launcher:not(.mini)')).toBeVisible();
  });

  test('docks, floats, collapses, closes and remembers position', async ({ page }) => {
    await openStudio(page);
    await page.locator('button[aria-label="Dock left"]').click();
    await expect(page.locator('.panel.dock-left')).toBeVisible();
    await page.locator('button[aria-label="Float"]').click();
    await expect(page.locator('.panel.float')).toBeVisible();
    await page.locator('button[aria-label=Collapse]').click();
    await expect(page.locator('.tabs')).toHaveCount(0);
    await page.locator('button[aria-label=Expand]').click();
    await page.waitForTimeout(300);
    await page.reload();
    await expect(page.locator('.panel.float')).toBeVisible();
    await page.locator('button[aria-label=Close]').click();
    await expect(page.locator('.launcher')).toBeVisible();
  });

  test('keyboard shortcut toggles the studio and Escape leaves inspect mode', async ({ page }) => {
    await page.goto(DEV + '/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.locator('.launcher').waitFor();
    await page.keyboard.press('Control+Shift+A');
    await expect(page.locator('.panel')).toBeVisible();
    await page.keyboard.press('Control+Shift+I');
    await expect(page.locator('button[aria-pressed=true]', { hasText: 'Inspecting' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('button[aria-pressed=true]', { hasText: 'Inspecting' })).toHaveCount(0);
  });
});
