## Why

The Inspect tab answers "what styles this one element", but a developer theming a page has no way to see which Astryx components that page actually uses. They have to click element by element and hope they found them all. A page-wide component inventory shows what is in play, which variants and sizes are used, and which theme tokens each component consumes, so the right tokens can be tuned without hunting.

## What Changes

- Add a **Components** tab to the studio panel, between Inspect and Impact.
- Scan the current page for Astryx components, identified only by their stable `astryx-*` class (same no-guessing rule as Inspect), and list them grouped by component name with an instance count.
- For each component, aggregate the `data-*` props in use (variant, size, states) as value counts, e.g. `variant: primary×3, secondary×9`.
- List a component's instances; clicking one scrolls to it and highlights it via the existing overlay.
- Show the theme tokens a component uses (from its first instance) with the existing inline token editor, so edits update the global working theme exactly as in Inspect.
- Rescan on demand (Rescan button), when the tab opens, and when the route changes.
- Tell the developer that elements without a stable `astryx-*` class are not listed.
- Not changed: the exporter, the token registry, and Inspect/Impact behaviour. Component-scoped tokens (`--astryx-<component>-padding*`) and theme `components.*` rules are explicitly out of scope and left for a follow-up change.

## Capabilities

### New Capabilities
- `component-inventory`: Page-wide scan and listing of Astryx components with instance counts, aggregated props, instance highlighting, and the theme tokens each component uses.

### Modified Capabilities
- `studio-ui`: The panel gains a Components tab and its tab-switching, persistence and rescan-on-route behaviour.

## Impact

- New code: `src/inspector/component-scan.ts` (pure scanner), `src/ui/ComponentsPanel.tsx`.
- Modified code: `src/dev/session.ts` (`Tab` type, scan state and `scanComponents()`, route-watch reuse), `src/ui/Panel.tsx` (`TABS`), `src/ui/styles.ts` if new styles are needed.
- Reuses without change: `detectComponent`, `readDataProps`, `inspectElement`, `TokenRow`, `focusElement`, `OverlayLayer`.
- Tests: unit tests for the scanner; one e2e case in `e2e/studio.spec.ts` against the example app.
- No new dependencies, no exporter or registry changes, no effect on production builds (the studio stays dev-only).
