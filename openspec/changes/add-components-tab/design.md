## Context

The studio already identifies one component at a time (`detectComponent`, from the stable `astryx-*` class), reports its tokens (`inspectElement`), edits tokens in place (`TokenRow`), and highlights elements (`OverlayLayer`, `focusElement`). `ImpactPanel` already has a grouped, expandable element list and `session.startRouteWatch()` already reruns work on navigation. The Components tab composes these over the whole page; it adds a scanner and a panel, not a new mechanism.

Astryx has no per-component token namespace for most components. Component-scoped public tokens (`--astryx-<component>-padding*`) exist only for a few containers, and `components.*` theme rules are a separate mechanism. Both are out of scope here (see Non-Goals).

## Goals / Non-Goals

**Goals:**
- List Astryx components on the current page with counts and aggregated props.
- Navigate to instances and edit the theme tokens a component uses, using existing editors.
- Keep the same no-guessing and non-invasive guarantees as Inspect.

**Non-Goals:**
- Component-scoped padding tokens, `components.*` rules, or any exporter or registry change (follow-up change).
- Live observation of DOM changes (`MutationObserver`); v1 uses manual and route-triggered rescans.
- Aggregating tokens across all instances of a component.
- An allow-list of "real" components; every stable `astryx-*` root is listed.

## Decisions

**1. Pure scanner in `src/inspector/component-scan.ts`.**
`scanComponents(root: ParentNode, isStudio)` returns `{ groups: { name, stableClass, count, elements, props: Record<string, Record<string, number>>, parts: string[] }[], total }`. It is DOM-in, data-out so it is unit-testable like the registry, and has no session dependency. Alternative: scan inside the session. Rejected: harder to test and mixes concerns.

**2. Reuse `detectComponent`, keep roots only.**
Each candidate from `querySelectorAll('[class*="astryx-"]')` goes through `detectComponent`. A node is a **part** of an ancestor root when any of its stable classes extends the class of *any* Astryx ancestor (`astryx-table-row` under `astryx-table-header` under `astryx-table`; `astryx-switch-thumb` under `astryx-switch`); otherwise it is its own root. Checking every ancestor, not just the nearest, was confirmed necessary against the example app's DOM. Nested real components (a Button inside a Card) share no prefix, so they stay roots. Known limit: wrappers that are ancestors of their own component (`astryx-table-scroll-wrapper` around `astryx-table`) and cross-owner classes (`astryx-field-label` inside `astryx-switch-field`) are listed as roots. Alternative: count every `astryx-*` element. Rejected: inflates counts with parts.

**2b. Cap noisy props.**
Real DOM carries high-cardinality `data-*` values (`data-column-key` per table header cell). Each prop shows its top values by count and collapses the rest into "+N more".

**3. Tokens from the first instance, lazily.**
The token section runs `inspectElement(firstRoot, index, registry)` only when the component row is expanded, and labels it "from first instance". Alternative: aggregate over all instances. Rejected for v1: one scan per element against a stylesheet index, costly on large pages; the impact engine already treats scan time as something to profile.

**4. Session state, not component state.**
`session.ui.scan` holds the last result and `session.scanComponents()` produces it, so the tab, route watch and tests share one source. `Tab` gains `'components'`. Scan elements are not persisted (the `PERSISTED` list is unchanged).

**5. Reuse the route watch.**
`startRouteWatch` is currently tied to Impact. It is refactored to take a callback so Components and Impact each register their own handler; the watcher runs while either is active. Alternative: a second watcher. Rejected: duplicate listeners and interval fallback.

**6. Scan only when visible.**
Scans run on tab open, Rescan, and route change while the tab is open, never in the background, so a closed studio costs nothing.

## Risks / Trade-offs

- [Not every Astryx component emits a stable `astryx-*` class] → The scan is only as complete as the DOM. Checked against all three example-app pages: every Astryx component there carries one. The UI states what is not listed.
- [Utility or layout classes appear as "components"] → Listed as-is in v1 (no allow-list); revisit with a deny-list if noisy.
- [Part-versus-root heuristic misclassifies a nested root] → The rule in Decision 2 only treats class-name extensions as parts; covered by unit tests with a Card containing a Button.
- [Large pages make the scan slow] → One `querySelectorAll` plus per-match `detectComponent` (cheap ancestor walk); token analysis is lazy and per component.
- [Stale inventory after in-page changes] → Rescan button and route-change rescan; observer deferred.
- [Refactoring `startRouteWatch` could regress Impact] → Existing Impact e2e coverage must still pass.

## Open Questions

- Should instance counts include hidden elements (`display: none`)? v1 counts them; may want a "visible only" toggle.
