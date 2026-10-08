# Astryx Theme Studio

A development-only visual theming tool for apps built with [Astryx](https://github.com/facebook/astryx) (`@astryxdesign/core`).

Open your real app, click a control, see every Astryx design token that styles it, edit the tokens, watch the app update, see where a token is used, and export a ready-to-commit `defineTheme()` file.

> **Production guarantee.** Astryx Theme Studio is development tooling. The Theme Studio runtime should not be loaded in standard production builds. Only the exported Astryx theme is intended for production use.

- Works with Astryx `^0.6.5` (React 19, Vite).
- The token list comes from the Astryx you have installed, so it is always complete and version-accurate.
- Never modifies your source files and never wraps, moves or re-classes your DOM. Changes live in one temporary `<style>` element until you export.

## Installation

```bash
npm install -D github:phreak1979/astyrx-theme-studio
```

npm runs the package's `prepare` script on install, which builds `dist/`. This needs the dev dependencies of the package (npm installs them for git dependencies automatically). Peer dependencies: `react` and `react-dom` >= 19, `@astryxdesign/core` ^0.6.5.

## Vite setup

Theme Studio is loaded through a **development-only dynamic import**. Two small additions to your app:

```text
src/
├── main.tsx
├── App.tsx
└── dev/
    └── mountAstryxThemeStudio.tsx     ← new
```

### `src/dev/mountAstryxThemeStudio.tsx`

```tsx
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { AstryxThemeStudio } from "astryx-theme-studio/dev";

let root: Root | undefined;

export function mountAstryxThemeStudio() {
  if (root) return;

  const host = document.createElement("div");
  host.id = "astryx-theme-studio-root";
  document.body.appendChild(host);

  root = createRoot(host);

  root.render(
    <React.StrictMode>
      <AstryxThemeStudio />
    </React.StrictMode>,
  );
}
```

The studio renders in its own React root beside your app. It does not wrap or restructure your application.

### `src/main.tsx`

Mount your app as usual, then add the dev-only branch:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if (import.meta.env.DEV && import.meta.env.VITE_THEME_DEV === "true") {
  void import("./dev/mountAstryxThemeStudio").then(
    ({ mountAstryxThemeStudio }) => {
      mountAstryxThemeStudio();
    },
  );
}
```

### Turn it on with an environment variable

The condition above means the studio loads only when you ask for it. Add the flag to a local, uncommitted env file:

```bash
# .env.development.local  (or .env.local)
VITE_THEME_DEV=true
```

Set it to `false` (or remove it) to develop without the studio. Notes:

- Vite only exposes variables that start with `VITE_` to client code, so a bare `THEME_DEV` would be invisible to your app. If you prefer that name, add `envPrefix: ['VITE_', 'THEME_']` to `vite.config.ts` and test `import.meta.env.THEME_DEV`.
- Restart `npm run dev` after changing an env file.
- This is a convenience switch, not a security control. Production safety comes from `import.meta.env.DEV` being statically `false` in a build, so the whole branch (and the studio) is removed no matter what the variable says.
- For TypeScript, add `readonly VITE_THEME_DEV?: string` to `ImportMetaEnv` in your `vite-env.d.ts`.

### Tell the studio your Astryx version (recommended)

Astryx does not export its `package.json`, so the studio cannot read its own peer's version. Add the tiny Vite plugin and it will:

```ts
// vite.config.ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Loaded defensively so a build where this dev dependency is not installed still works.
async function studioVersionPlugin() {
  try {
    const { astryxThemeStudio } = await import("astryx-theme-studio/vite");
    return astryxThemeStudio();
  } catch {
    return null;
  }
}

export default defineConfig(async () => ({
  plugins: [react(), await studioVersionPlugin()],
}));
```

Or pass it directly: `<AstryxThemeStudio astryxVersion="0.6.5" />`. Without either, the studio still works but shows a "version unknown" compatibility warning.

## Installing as a dev dependency

`-D` is correct: this is development tooling, so it must not be a runtime dependency. Build machines normally install dev dependencies anyway (Vite and TypeScript are dev dependencies too). If you ever build with `npm ci --omit=dev` or `NODE_ENV=production`, the package is simply absent, and that is safe:

- the dev-only `import()` in `main.tsx` is statically unreachable, so the build does not need the package (verified);
- the `vite.config.ts` snippet above tolerates a missing package;
- one thing to watch: if your build script runs `tsc` over `src/`, the file `src/dev/mountAstryxThemeStudio.tsx` imports the package's types and would fail to compile without it. Either install dev dependencies for the build (the usual case) or exclude `src/dev` in your build tsconfig.

## Why dynamic import is required

You might be tempted to write:

```tsx
import { AstryxThemeStudio } from "astryx-theme-studio/dev";

<AstryxThemeStudio enabled={import.meta.env.DEV}>
  <App />
</AstryxThemeStudio>;
```

Avoid it. That hides the studio at runtime, but a static import still puts the studio's module in your production module graph (`npm run example:verify-prod` fails if you try it in the example app). The dev-only `import()` is statically unreachable in production, so the bundler drops the whole studio.

The package also has a second guard: if its entry points are ever called when `import.meta.env.DEV` is not `true`, they render nothing, register no listeners or observers, apply no overrides and never read saved state. That is defence in depth; the dynamic import is the primary protection.

## Starting development

```bash
npm run dev
```

A small 🎨 launcher appears bottom-right (drag it anywhere; hover it and press – to minimise it to an edge tab). Click it, or press **Ctrl/Cmd + Shift + A**, to open the panel. The panel can be docked left or right, floated, resized, collapsed and closed, and it remembers where you left it.

## Using it

| Tab         | What it does                                                                                                                                                                                                                                                                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Theme**   | Every Astryx token, grouped by category, with search (name, category, description, value) and a _Modified_ filter. Colour picker + hex, number + unit, enum selectors, and a validated raw field for everything. Light and dark values are edited independently.                                                                                                              |
| **Inspect** | Turn on ◎ Inspect and click anything. You see the Astryx component (identified only from its stable `astryx-*` class, never guessed), its variant/size/state, and every theme token styling it, editable in place. Properties are labelled **theme token**, **component property**, **Astryx internal** or **application style**. Only theme tokens are editable or exported. |
| **Components** | Lists the Astryx components on the current page with instance counts, identified only from their stable `astryx-*` class (anything without one is not listed). Each component shows the variants, sizes and states in use (e.g. `variant: secondary×9, primary×3`), its instances (click one to scroll to and highlight it), and the theme tokens its first instance uses, editable in place. Edits change the global theme, exactly as in Inspect. It rescans when you open the tab, press **Rescan**, or navigate; it does nothing while the tab is hidden. |
| **Impact**  | _Show Impact_ on any token highlights the visible elements using it on the current page, grouped by component. Click a result to scroll to it. As you navigate, the studio builds a per-route index of routes it has actually observed. It never claims impact on routes you have not visited.                                                                                |
| **Export**  | Theme name/ID, theme health (validation + contrast), and export: **Copy Theme Code**, download `.ts`, download JSON, or an export package (`<id>Theme.ts`, `<id>.theme.json`, `metadata.json`, `README.md`). JSON import shows a diff and applies only when you press **Apply**.                                                                                              |

Footer: **Auto / ☀ Light / 🌙 Dark** preview (Auto follows your app), undo/redo, reset (token, category, light, dark, or everything; multi-token resets ask first).

### Shortcuts

| Keys                     | Action                                                                  |
| ------------------------ | ----------------------------------------------------------------------- |
| Ctrl/Cmd + Shift + A     | Open / close the studio                                                 |
| Ctrl/Cmd + Shift + I     | Toggle Inspect                                                          |
| Esc                      | Leave Inspect / Impact                                                  |
| Ctrl/Cmd + Z / Shift + Z | Undo / redo (when the studio is open and you are not typing in a field) |

Change or disable any of them: `<AstryxThemeStudio shortcuts={{ open: 'Mod+Shift+K', inspect: false }} />`.

### Options

```tsx
<AstryxThemeStudio
  astryxVersion="0.6.5" // default: injected by the Vite plugin
  persist // save the working theme to localStorage (default true)
  storageKey="my-key" // default: astryx-theme-studio:working-theme
  defaultOpen={false}
  profileThresholdMs={50} // log a dev warning when an impact scan is slower than this
/>
```

### Things worth knowing

- **Refresh persistence.** After a reload the studio offers _Continue editing_ / _Discard_ and applies nothing until you choose. The Astryx version is stored with it; a mismatch is flagged.
- **Original values** are read from your app's actual theme, not Astryx's defaults, so "original" means what your app does today.
- **Nested `<Theme>` regions** keep their own values by default (this mirrors how Astryx scopes themes). Tick _Also override nested Theme regions_ to flatten them too.
- **Generated tokens.** Astryx can generate some tokens from scales (typography, radius, motion, colour). Values you set are exported as explicit `tokens`, which always take precedence.
- **Impact accuracy.** Impact reads your stylesheets. Cross-origin stylesheets cannot be read; the studio says so and labels results as observed rather than complete.
- **Contrast checks** cover a fixed set of text/surface/accent pairs and are shown before export; you can make failures block export.

## DCP Ocean Blue theme (example app)

The example app ships a theme built from the `dcp-ocean-blue.png` mockup: Deep Space Blue `#0E354F`, Air Force Blue `#5490B8`, Charcoal Blue `#323949`, Inter, light and dark. Turn on **DCP Ocean Blue** in the example's top bar to see the DCP Studio dashboard (Dashboard route) and alerts / form elements (Showcase route) with it.

Files: `examples/vite-app/src/theme/dcpOceanBlueTheme.ts` (the theme), `src/components/dcp/` and `src/pages/Showcase.tsx` (the demo layout).

### Use it in another app

1. Copy `dcpOceanBlueTheme.ts` into your app (for example `src/theme/`). It only imports `defineTheme` from `@astryxdesign/core/theme`.
2. Install the font and import it once in your entry file:

   ```bash
   npm install @fontsource-variable/inter
   ```

   ```tsx
   import '@fontsource-variable/inter';
   ```

3. Pass the theme to Astryx's `Theme` provider:

   ```tsx
   import { Theme } from '@astryxdesign/core/theme';
   import { dcpOceanBlueTheme } from './theme/dcpOceanBlueTheme';

   <Theme theme={dcpOceanBlueTheme} mode="light">
     <App />
   </Theme>
   ```

4. Optional, for production: pre-build the CSS so no styles are injected at runtime:

   ```bash
   npx @astryxdesign/cli theme build src/theme/dcpOceanBlueTheme.ts
   ```

Keep editing it with Theme Studio like any other theme: tune tokens, then **Export** and merge the token map back into the file (Theme Studio exports tokens only; the `typography` and `components` blocks in the file are maintained by hand).

### Known differences from the mockup

- Nested `<Theme>` regions (the sidebar, the Showcase panels) use `dcpOceanBlueRegionTheme`, a separately named copy: Astryx injects unbuilt themes by name, and a nested region sharing the app theme's name removes the app's styles when it unmounts. Pre-building the theme (step 4) avoids this.
- Astryx defines `--color-background-body` but does not paint it on `<body>`; add `body { background: var(--color-background-body); }` in your app CSS (the example scopes it to the DCP theme).
- The sidebar and the example's top bar share the theme's `--dcp-chrome-background` token (Deep Space Blue in light mode, darker navy in dark mode). The token travels with the theme file, but using it is app code: put `background: var(--dcp-chrome-background)` on an element outside any forced-dark nested `<Theme>`, then wrap the content in `<Theme theme={dcpOceanBlueRegionTheme} mode="dark">` for light text. `--dcp-chrome-shadow` is the matching shadow (dark in light mode, soft white glow in dark mode): `box-shadow: var(--dcp-chrome-shadow)`.
- The bar chart and donut rings are small SVG components (Astryx has no chart component).
- Header search, date range and row menus are visual only.
- Palette colours use the printed hex values; the mockup's rendered pixels differ slightly (for example its primary button is closer to `#468EBA`).
- Banner "View details" actions are ghost buttons passed as `endContent`; spacing differs by a few pixels.

## Production build

```bash
npm run build
npm run preview
```

Then confirm in the preview:

- no Theme Studio launcher appears;
- the keyboard shortcuts do nothing;
- no `#astryx-theme-studio-root` or `#astryx-theme-studio-overlay` element is created;
- no `<style data-astryx-theme-studio>` exists and no working-theme override is applied;
- the app uses only its committed, exported Astryx theme.

You can also search `dist/` for the marker strings `astryx-theme-studio-root` and `ASTRYX THEME STUDIO`. The example app ships a script that does exactly this:

```bash
npm run example:verify-prod
```

## Workflow

```text
Run app in development
        ↓
Open Theme Studio
        ↓
Inspect controls
        ↓
Edit supported Astryx tokens
        ↓
Use Show Impact
        ↓
Navigate through application
        ↓
Validate light/dark theme
        ↓
Export Astryx theme
        ↓
Add/commit exported theme
        ↓
Build production application
```

The exported file is a normal Astryx theme:

```ts
import { defineTheme } from "@astryxdesign/core/theme";

export const dreamscoreTheme = defineTheme({
  name: "dreamscore",
  tokens: {
    "--color-accent": ["#1663AA", "#4D9CE6"],
    "--radius-element": "6px",
  },
});
```

Pass it to Astryx's `<Theme theme={dreamscoreTheme}>`. For production you can pre-build the CSS with `npx @astryxdesign/cli theme build`. The studio never writes into your source tree.

## Developing this repo

```text
src/
├── core/          registry, store, validation, contrast, export-agnostic logic, impact engine
├── inspector/     style scanner, component/token detectors, overlay, element selector
├── ui/            Shadow DOM panel (own CSS, no Astryx components)
├── persistence/   localStorage
├── exporters/     defineTheme code, JSON, export package
├── dev/           public entry, session wiring, env guard, shortcuts
└── vite.ts        optional version plugin
examples/vite-app/ Astryx + Vite app used to test the studio
tests/             unit tests (Vitest)
e2e/               browser tests against the example app (Playwright)
```

```bash
npm install                 # installs the library and the example (the example links to the library with file:../..)
npm run dev                 # rebuild the library on change (tsup --watch)
npm run example:dev         # example app at http://localhost:5199
npm test                    # unit tests
npx playwright install chromium   # once
npx playwright test         # end-to-end tests (starts the example dev server and a production preview)
npm run example:verify-prod # builds the example and fails if studio code is in dist/
```

The example consumes the library's built `dist/`, so keep `npm run dev` running (or run `npm run build`) after changing library code.

## Not in this version

Browser extension, route crawler, automatic source-file writing, ZIP packaging, advanced shadow/typography editors. The core (`src/core`, `src/exporters`) is kept free of UI so an extension can reuse it later.
