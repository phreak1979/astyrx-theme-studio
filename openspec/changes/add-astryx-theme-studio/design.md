## Context

`astryx-theme-studio-spec.md` describes a dev-only visual theming tool for Astryx apps. Verified against `@astryxdesign/core` 0.6.5 (source ships in the npm package):

- `@astryxdesign/core/theme` exports `tokenDefaults` (flat map of every public core + domain token, values like `light-dark(#0064E0, #2694FE)`), `defineTheme({name, tokens})` where a token value is `string | [light, dark]`, and `<Theme theme mode>`.
- Tokens are CSS custom properties declared in `@layer astryx-base`; theme CSS goes in `@layer astryx-theme`. `<Theme>` syncs `data-theme` and `data-astryx-theme` onto `<html>` and wraps children in a `display: contents` element that sets `color-scheme`.
- Components expose stable `astryx-*` classes and `data-astryx-*` state attributes (`naming.ts`).
- Generator helpers exist (`expandColorScale`, `expandTypeScale`, `expandRadiusScale`, `expandMotionScale`, `typography.scale`) that derive many tokens from a few inputs.

Production app and example app are both Vite + React 19. The repo starts empty (spec, openspec, git remote only).

## Goals / Non-Goals

**Goals:**
- Installable from GitHub with `npm install -D github:phreak1979/astyrx-theme-studio`, working in a Vite + Astryx app.
- Token set always matches the installed Astryx; no hand-maintained token list.
- Zero Theme Studio code in production bundles; safe no-op if mistakenly invoked.
- A real example app in the same repo to test every slice before production use.
- Core logic (registry, state, validation, export, impact) separate from UI so a future extension can reuse it.

**Non-Goals:**
- Browser extension, route crawler, AI features, source-file writing (spec phases 2–3 and §53).
- Editing Astryx component overrides (`components` in `defineTheme`); tokens only in this change.
- Non-Vite bundlers as a supported target (kept working where cheap, not tested).
- Publishing to the npm registry.

## Decisions

**D1. Repo layout: npm workspaces, library at root.**
Root `package.json` is the library (`name: astryx-theme-studio`, unscoped; `@project/` in the spec was a placeholder). `examples/vite-app` is a workspace that depends on the root via `"astryx-theme-studio": "file:../.."` (the root cannot be a member of its own `workspaces`, so a plain `*` range 404s against the registry). It therefore consumes the built `dist/` through the same `exports` map a real consumer uses. Alternative: library in `packages/studio` — rejected, since a git install of a repo installs the *root* package.

**D2. Build and git install: tsup in `prepare`.**
npm runs `prepare` for git dependencies, so `dist/` is built on the consumer's install and never committed. `tsup` builds ESM + `.d.ts` for entries `./dev` (and an optional tiny `./core`). Needs `tsup`/`typescript` in `devDependencies` (npm installs them for git deps before `prepare`). Alternative: commit `dist/` — rejected (noisy diffs, stale builds). Fallback if `prepare` proves flaky: a `postinstall`-free committed build on a `release` branch.

**D3. Dev-only loading and fail-safe.**
Host: `if (import.meta.env.DEV) void import('./dev/mountAstryxThemeStudio')`. Package: the mount function returns early unless `import.meta.env?.DEV === true` (optional chaining so non-Vite bundlers don't throw). The package's only public export is `./dev`; `sideEffects: false`. A build-verification script in the example app greps `dist/` for a studio marker string and fails if found.

**D4. Token registry derived at runtime.**
Import `tokenDefaults` from `@astryxdesign/core/theme`; parse `light-dark(a, b)` (balanced-paren split, since values contain commas inside `rgba()`) into `{light, dark}`, otherwise same-for-both. Category from name prefix (`--color-`, `--radius-`, `--font-`, `--duration-`, …); type inferred from category plus value shape. Astryx exports neither its `package.json` nor a version constant, so the version comes from the `astryxVersion` option or the optional `astryx-theme-studio/vite` plugin (which locates the installed package on disk and `define`s `__ATS_ASTRYX_VERSION__`); when neither is present the studio reports "version unknown" and warns. The compatibility range (`^0.6.5`) is checked against it. "Original" values are seeded from the host's *computed* custom properties on `<html>` at startup (before any override exists), so original means what the app does today, falling back to Astryx defaults. Descriptions come from an optional small static metadata map; absence is fine. Alternative: static JSON snapshot per version — rejected (drifts; the spec wants version accuracy).

**D5. Live preview via one unlayered `<style>`.**
Studio owns a single `<style data-astryx-theme-studio>` appended to `<head>`. Unlayered declarations beat `@layer` rules regardless of specificity, so no `!important` and no component CSS touched. Removing the element restores the app exactly. Colour tokens are emitted as `light-dark(L, D)` (the form Astryx itself generates); every other token is mode-neutral and emitted as a plain value, because `light-dark()` only accepts colours. The selector is `:root, [data-astryx-theme="<root theme name>"]` (see S2). Light/dark preview forces `color-scheme` with an unlayered `:root, [data-astryx-theme] { color-scheme: … }` rule (see S1).

**D6. State: framework-agnostic store, thin React bindings.**
`core/theme-state` is a plain subscribable store (working theme, modified set, history stack, mode). React UI uses `useSyncExternalStore`. Persistence subscribes to the store and writes `astryx-theme-studio:working-theme` (versioned payload) debounced; restore prompts "Continue / Discard". Route independence is automatic because state lives outside React Router; no router integration is needed. Undo/redo is a command stack of `{token, mode, before, after}` entries with coalescing for continuous picker drags.

**D7. UI isolation: separate React root inside a Shadow DOM.**
Host element `#astryx-theme-studio-root` gets an open shadow root; styles are a string adopted via `adoptedStyleSheets` (fallback `<style>`). The UI uses only its own `--ats-*` custom properties and never `var(--color-*)`. Because custom properties inherit across shadow boundaries, isolation depends on this naming discipline, enforced by a lint-style test that greps UI CSS for Astryx token names. No Astryx components in the UI. Alternative: iframe — rejected (can't inspect host DOM cleanly, focus/keyboard friction).

**D8. Overlay layer.**
A second fixed, `pointer-events: none` shadow-hosted layer draws highlight rectangles from `getBoundingClientRect()`, repositioned in one `requestAnimationFrame` loop that runs only while Inspect/Impact is active, plus `ResizeObserver`/scroll listeners with explicit teardown. Inspect click-capture uses a capture-phase listener attached only while Inspect mode is on.

**D9. Inspect: CSSOM-based token detection, class-based component detection.**
Component: nearest ancestor-or-self with an `astryx-*` stable class → named component, plus the reflected `data-*` attributes (`data-variant`, `data-size`, …) as variant/state; otherwise reported as "not an Astryx component" (no heuristics). When the click lands on an inner part (e.g. a button's label `<span>`), the report is produced for both the clicked element and the component root, because colours and radii live on the root. Tokens: collect `document.styleSheets` rules (recursing into `@layer`/`@media`/`@supports`/`@scope`), keep those where `el.matches(selector)`, extract `var(--name)` references from declarations, resolve transitively through variable aliases, intersect with the registry. Properties are classified per spec §21 as theme token / component prop / Astryx internal / application style. Cross-origin sheets that throw on `cssRules` are skipped and reported as "unreadable".

**D10. Impact: CSSOM scan first.**
Build, per token, the set of selectors whose declarations reference it (directly or via aliases); query visible candidates with `document.querySelectorAll`, filter by `matches` and visibility. Cache per sheet-set signature, invalidate by a `MutationObserver` on `<head>` only. Component grouping uses D9's component detection. Per-route counts recorded in a dev-only index in the store, not exported. Selectors are matched with user-action pseudo-classes (`:hover`, `:focus-visible`, …) and pseudo-elements stripped, so the scan is a superset that includes state-only consumers; the UI says so. The on-demand sentinel-diff verifier (Verify button) applies a temporary `!important` rule on every theme boundary with transitions frozen, and reports how many listed elements change right now, how many are state-only, and how many extra elements change through inheritance or unreadable styles.

**D11. Export.**
Emit `defineTheme({ name, tokens: { '--x': ['L','D'] | 'v' } })` with the import path taken from the Astryx version table (initially `@astryxdesign/core/theme`), plus `*.theme.json` (studio schema with `schemaVersion`, `astryxVersion`, light/dark maps, metadata), `metadata.json`, and a README. Default is modified-tokens-only. The studio provides *Copy code* and *Download*; nothing writes into the host's source (spec §53). Validation runs against the registry (unknown token, malformed colour/unit, light/dark pair completeness, version mismatch, deprecated).

**D12. Example app.**
`examples/vite-app`: Vite + React 19 + `@astryxdesign/core` + StyleX Vite plugin, `react-router` routes Dashboard / Customers / Settings using Card, Button, Input, Table, Modal, Popover and a nested `<Theme>` region, and a light/dark toggle. It mounts the studio exactly as the README tells consumers (`src/dev/mountAstryxThemeStudio.tsx` + dynamic import in `main.tsx`). Scripts: `dev`, `build`, `preview`, `verify-prod`.

**D13. Testing.**
Vitest for core (registry parsing against the real `tokenDefaults`, store/history, validation, export snapshots, CSSOM impact on fixture DOM). Playwright smoke tests against the example app for: launcher appears in dev, absent in preview build, override survives route change, refresh restore, Shadow DOM isolation (change surface token, panel unchanged).

## Spikes (resolve before the dependent slice)

- **S1 — Dark-mode preview vs. `<Theme>` colour-scheme.** `<Theme mode>` and its wrapper own `data-theme`/`color-scheme`. Candidates: (a) set `data-theme` on `<html>` and accept the Theme effect may overwrite it; (b) an unlayered `color-scheme` rule targeting the wrapper (`[data-astryx-theme] *`-free selector via the wrapper's class); (c) don't force scheme at all — edit both values, preview the *app's* current mode, and offer a "show other mode" best-effort toggle. Gate: Slice 1 ships (c) if (a)/(b) are unreliable.
- **S2 — Nested `<Theme>`/`MediaTheme` shadowing.** Verify whether tokens set on the root `html` reach elements inside a nested Theme region. If shadowed, overrides must also target `[data-astryx-theme]` scopes (inject a second selector) or the studio must warn per region.
- **S3 — Generated scale tokens.** Determine which tokens are outputs of `expand*Scale`/`typography.scale`. Likely resolution: edit tokens individually, export as explicit `tokens` (always valid), and flag in the UI that the app's theme may regenerate them.

## Spike outcomes

- **S1 — Dark-mode preview: solved with (b).** An unlayered `color-scheme` rule on `:root, [data-astryx-theme]` flips the whole app (including portals and nested themes) and does not fight `<Theme>`, which keeps writing its own `data-theme`. The panel has three states: Auto (follow the app, no forcing), Light, Dark. Verified in the browser.
- **S2 — Nested/root theme shadowing: a plain `:root` override does not work.** The app's own `<Theme>` wrapper (a `display: contents` element carrying `data-astryx-theme`) declares tokens on itself, so a value set on `<html>` is shadowed (observed: accent edit left buttons unchanged). Overrides therefore target `[data-astryx-theme="<root name>"]` as well as `:root`. Astryx's own generated CSS is `@scope ([data-astryx-theme="x"]) to ([data-astryx-theme]) { :scope { --token: … } }`, i.e. nested themes are deliberately out of scope, so by default nested `<Theme>` regions keep their own values; an opt-in checkbox widens the selector to every `[data-astryx-theme]`. A unit test compares our emitted declarations to the real `generateThemeCSS` output.
- **S3 — Generated scale tokens: explicit tokens always win.** Astryx documents that explicit `tokens` take precedence over values generated by `typography.scale` and the radius/motion/colour scale helpers, so exporting explicit tokens is always valid. The UI shows a note on those categories.

## Implementation notes that changed the plan

- The Theme tab uses collapsible categories with lazily rendered editors rather than a virtualised list: ~258 lightweight rows render without measurable cost, and inline editors make fixed row heights impractical.
- `Auto/Light/Dark` replaces a plain light/dark switch so the studio never has to fight the app's own mode control.
- Verifying exported output uses the real `defineTheme` in unit tests (the exported token map is accepted and yields identical declarations), instead of a manual paste into the example app.
- A development-only handle `globalThis.__ASTRYX_THEME_STUDIO__` exposes the session for debugging and e2e tests; it is created only when `import.meta.env.DEV` is true.

## Risks / Trade-offs

- **Astryx 0.x API churn** → pin peer range `^0.6.5`, version-compat warning in UI, export path table per version, contract tests that import real `tokenDefaults`/`defineTheme`.
- **Custom properties leak into the shadow root** → `--ats-*` naming rule plus test; never read Astryx tokens in studio CSS.
- **CSSOM scan misses styles** (cross-origin sheets, JS-set inline vars, constructable sheets) → surface "unreadable sheets" count, scan `adoptedStyleSheets`, show Impact as "observed" not "complete" (spec §26).
- **Performance on large DOMs** → lazy, cached, debounced scans; rAF only while overlay active; profiling log when a scan exceeds a threshold.
- **`prepare` build on git install** may fail on locked-down CI → documented fallback (committed `dist` on a release branch).
- **Undo history growth** → cap stack length, coalesce drags.
- **Persisted stale state after Astryx upgrade** → payload carries `astryxVersion`; mismatch prompts instead of silently applying.

## Migration Plan

Greenfield; nothing to migrate. Rollout: build slice 1, install into the example app via workspace, then into the production app by git URL. Rollback is removing the dev dependency and the two dev-only files; production is unaffected because it never imported the studio.

## Open Questions

- Final package name/scope (default `astryx-theme-studio`, unscoped).
- Whether `astryx theme build` ("built" themes) needs a dedicated export variant in a later slice.
- (Resolved) Original values are seeded from the host's computed custom properties; see D4.
