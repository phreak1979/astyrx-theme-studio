## 1. Discovery

- [x] 1.1 Run the example app and dump the distinct stable `astryx-*` classes and `data-*` attributes present on each page; record which Astryx components emit no stable class
- [x] 1.2 Confirm the part-versus-root rule (class-name extension) against the real DOM and adjust design.md if it does not hold

## 2. Scanner

- [x] 2.1 Add `src/inspector/component-scan.ts` with `scanComponents` (grouping, roots only, parts note, props aggregation, studio-node exclusion)
- [x] 2.2 Add unit tests in `tests/` for grouping, nested roots (Button in Card), part exclusion, prop counts, studio nodes ignored, DOM unmodified

## 3. Session

- [x] 3.1 Add `'components'` to `Tab` and `scan` to `UiState` in `src/dev/session.ts`, plus `scanComponents()`
- [x] 3.2 Refactor `startRouteWatch` to take a handler so Components and Impact can both use it; keep Impact behaviour identical
- [x] 3.3 Scan on tab open and on route change while the Components tab is shown; do nothing while closed or on another tab

## 4. UI

- [x] 4.1 Add `src/ui/ComponentsPanel.tsx`: Rescan button, totals, grouped list, props counts, parts note, coverage notice, empty state
- [x] 4.2 Expandable instance list with `focusElement` and a "+N more" cap
- [x] 4.3 Lazy "Theme tokens used (from first instance)" section using `inspectElement` and `TokenRow`
- [x] 4.4 Register the tab in `Panel.tsx` between Inspect and Impact; add any styles to `src/ui/styles.ts`

## 5. Verification

- [x] 5.1 e2e case in `e2e/studio.spec.ts`: open Components on the example Dashboard, expect Button and Card rows, highlight an instance, edit a token and see it modified in the Theme tab
- [x] 5.2 e2e case: navigate routes with the tab open and see the inventory change
- [x] 5.3 Run `npm test`, the e2e suite and `tests/cleanup.test.ts`; confirm Impact and Inspect still pass and the production build is unchanged
- [x] 5.4 Update README to document the Components tab
