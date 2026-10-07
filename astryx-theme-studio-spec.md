# Astryx Theme Studio — Specification

## 1. Overview

Astryx Theme Studio is a development-only visual theming and inspection tool for applications using Astryx.

It allows a developer to work directly inside the real application to:

- inspect rendered controls and elements;
- identify the Astryx design tokens affecting them;
- expose **all officially supported/themeable Astryx tokens** available for the installed Astryx version;
- edit supported tokens safely;
- preview changes immediately;
- see where a token has impact;
- keep a working theme while navigating between application pages;
- edit light and dark modes;
- validate the resulting theme; and
- export a production-ready Astryx theme.

The tool MUST be non-invasive and MUST NOT be present in a normal production bundle by default.

---

## 2. Core Principles

### 2.1 Astryx-aware, not a generic CSS editor

Theme Studio MUST distinguish between:

1. public Astryx theme tokens;
2. Astryx component properties;
3. application-specific CSS;
4. computed browser CSS; and
5. private/internal Astryx implementation styles.

Only properties that can legitimately be changed through the supported Astryx theming system may be presented as editable theme properties or exported as theme overrides.

Private implementation details MUST NOT be exported as theme overrides.

### 2.2 Complete token exposure

The editor MUST expose every officially supported/themeable token available for the detected Astryx version.

It MUST NOT intentionally expose only a curated subset.

### 2.3 Non-invasive operation

Theme Studio may observe the application and temporarily override public theme tokens, but it MUST NOT restructure or permanently mutate the application's rendered UI.

### 2.4 Development-only runtime

The Theme Studio runtime MUST NOT be present in standard production bundles by default.

Production should contain only the theme generated/exported by Theme Studio.

---

# 3. Recommended Package Model

Install as a development dependency:

```bash
npm install -D @project/astryx-theme-studio
```

The package should expose a development entry point that can be dynamically imported:

```ts
@project/astryx-theme-studio
```

or, preferably if the package design permits:

```ts
@project/astryx-theme-studio/dev
```

The package SHOULD be designed so production applications never need to statically import the Theme Studio runtime.

---

# 4. Recommended Vite Integration

This section MUST also be included in the package README.

## 4.1 Where the integration goes

For a typical Vite + React application, create:

```text
src/
├── main.tsx
├── App.tsx
└── dev/
    └── mountAstryxThemeStudio.tsx
```

The normal production application remains in `App.tsx`.

Theme Studio-specific imports live in `src/dev/mountAstryxThemeStudio.tsx`.

The development loader is invoked from `src/main.tsx` only when:

```ts
import.meta.env.DEV
```

is true.

## 4.2 `src/dev/mountAstryxThemeStudio.tsx`

Example:

```tsx
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AstryxThemeStudio } from '@project/astryx-theme-studio/dev';

let root: Root | undefined;

export function mountAstryxThemeStudio() {
  if (root) return;

  const host = document.createElement('div');
  host.id = 'astryx-theme-studio-root';
  document.body.appendChild(host);

  root = createRoot(host);

  root.render(
    <React.StrictMode>
      <AstryxThemeStudio />
    </React.StrictMode>
  );
}
```

Theme Studio MUST render independently of the application root wherever possible.

It MUST NOT require wrapping, reparenting, or restructuring the existing application DOM merely to provide inspection.

## 4.3 `src/main.tsx`

The normal application should be mounted first.

Example:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (import.meta.env.DEV) {
  void import('./dev/mountAstryxThemeStudio').then(
    ({ mountAstryxThemeStudio }) => {
      mountAstryxThemeStudio();
    }
  );
}
```

The important requirement is the combination of:

```ts
import.meta.env.DEV
```

and:

```ts
import()
```

Theme Studio MUST NOT be statically imported at the top of `main.tsx`.

Avoid:

```tsx
import { AstryxThemeStudio } from '@project/astryx-theme-studio';

<AstryxThemeStudio enabled={import.meta.env.DEV}>
  <App />
</AstryxThemeStudio>
```

This may visually disable Theme Studio in production, but depending on packaging/build behaviour it can still cause Theme Studio code to participate in the production module graph.

The recommended implementation uses a development-only dynamic import instead.

## 4.4 Production behaviour

Running:

```bash
npm run build
```

with the standard Vite production environment MUST result in the Theme Studio development branch being unreachable.

A normal production deployment must contain:

```text
Application
+
Exported Astryx theme
```

and NOT:

```text
Theme Studio UI
Inspector
Impact engine
DOM observers
Theme editor
Development event listeners
Working-theme persistence runtime
```

## 4.5 Production verification

The README should instruct developers to verify the build:

```bash
npm run build
npm run preview
```

Then confirm:

- no Theme Studio launcher appears;
- Theme Studio keyboard shortcuts do nothing;
- no Theme Studio overlay root is created;
- no working-theme overrides are applied;
- the application uses only its committed/exported Astryx theme.

Projects may additionally inspect `dist/` or use a bundle analyser to confirm that the Theme Studio runtime is not included.

## 4.6 Optional safety guard

The package SHOULD contain its own secondary production guard.

Conceptually:

```ts
if (!import.meta.env.DEV) {
  return;
}
```

This is defence in depth only.

The primary protection remains the host application's development-only dynamic import.

---

# 5. Developer Launcher

When loaded in development, display a small floating launcher.

Example:

```text
🎨
```

Hover:

```text
Astryx Theme Studio
```

The launcher should be:

- movable;
- unobtrusive;
- collapsible;
- position-persistent; and
- isolated from the application's working theme.

---

# 6. Main Modes

Theme Studio should provide four primary modes:

```text
Theme | Inspect | Impact | Export
```

---

# 7. Central Working Theme

Theme Studio maintains a central working theme independent of the current application route.

Conceptually:

```ts
interface WorkingTheme {
  name: string;
  astryxVersion: string;
  mode: 'light' | 'dark';

  light: Record<string, TokenValue>;
  dark: Record<string, TokenValue>;

  modifiedTokens: Set<string>;

  metadata: {
    createdAt: string;
    updatedAt: string;
  };
}
```

Token modifications MUST apply at the appropriate global Astryx theme boundary rather than directly modifying individual controls.

---

# 8. Cross-Page Persistence

Theme changes MUST remain active while navigating between application pages.

Example:

```text
Dashboard

--color-background-surface
#FFFFFF → #F8FAFC

        ↓

Customers
uses #F8FAFC

        ↓

Settings
uses #F8FAFC
```

A route change MUST NOT reset:

- token changes;
- selected light/dark mode;
- working theme;
- undo/redo history;
- Theme Studio panel state; or
- observed impact information.

Theme Studio should support common SPA routing approaches without depending on a specific router where possible.

---

# 9. Refresh Persistence

Working state SHOULD automatically persist to local storage in development.

Example key:

```text
astryx-theme-studio:working-theme
```

On reload:

```text
Working theme found

Dreamscore
27 modified tokens

[Continue Editing]
[Discard]
```

Persistence MUST be configurable.

Production code MUST NOT restore development working-theme state.

---

# 10. Astryx Token Registry

Theme Studio must maintain or dynamically construct an authoritative Astryx Token Registry.

Conceptual entry:

```ts
{
  token: '--color-accent',
  category: 'color',
  type: 'color',
  themeable: true,
  description: 'Primary accent colour',
  supportsLightDark: true,
  source: 'astryx'
}
```

The registry should include, where available:

- token name;
- category;
- value type;
- default value;
- light default;
- dark default;
- description;
- valid units/value constraints;
- deprecation information;
- Astryx version information; and
- whether the token is officially themeable.

Unknown/private variables MUST NOT automatically become editable theme tokens simply because they are CSS custom properties.

---

# 11. Astryx Version Detection

Theme Studio should detect the Astryx version used by the host application.

Display:

```text
ASTRYX

Installed version
0.x.x

Theme Studio schema
Compatible ✓
```

The token registry should correspond to the installed version wherever technically possible.

Unknown versions should produce an explicit compatibility warning.

---

# 12. Token Categories

Tokens should be grouped using Astryx's official model wherever possible.

Possible groups include:

```text
Colours
Typography
Spacing
Sizing
Borders
Radius
Shadows
Motion
Focus
Surfaces
Text
Interactive
States
Other
```

Categories must not limit token availability.

---

# 13. Complete Theme Editor

The Theme tab exposes the complete supported token registry.

Example:

```text
THEME

Search tokens...
────────────────────────

Colours                 42
Typography              18
Spacing                 16
Radius                    6
Shadows                   8
Sizing                   14
Motion                    5

Modified                12
```

---

# 14. Token Search

Search should match:

- token name;
- category;
- description; and
- current value.

Example:

```text
Search: surface
```

may return:

```text
--color-background-surface
--color-background-surface-hover
--color-background-surface-active
```

---

# 15. Token Editors

The editor should choose controls appropriate to token type.

## Colour

Provide:

- colour picker;
- HEX;
- optional RGB/HSL representation.

## Numeric and size values

Provide value and valid unit controls.

## Enumerated values

Use constrained selectors when Astryx defines a known value set.

## Shadows

Provide a structured editor where practical.

## Typography

Support relevant public typography tokens such as:

- font family;
- font size;
- line height;
- font weight; and
- letter spacing.

## Motion

Support:

- duration;
- easing; and
- other officially themeable motion values.

An advanced raw-value editor may be available but MUST still validate against the token schema.

---

# 16. Light and Dark Modes

Theme Studio MUST support independent light and dark values.

Example:

```text
--color-accent

LIGHT
#1663AA

DARK
#4D9CE6
```

Provide an immediate preview switch:

```text
☀ Light     🌙 Dark
```

---

# 17. Inspect Mode

Inspect Mode allows selection directly from the running application.

Activate:

```text
◎ Inspect
```

While active:

- hovering highlights selectable elements;
- clicking selects the element;
- normal click behaviour is suppressed only for the active inspection interaction;
- Escape exits Inspect Mode.

The overlay must not alter layout.

---

# 18. Non-Invasive Selection Overlay

Theme Studio MUST NOT wrap selected application elements.

Do NOT do this:

```html
<div class="theme-studio-highlight">
  <!-- existing application element moved here -->
</div>
```

Instead use an independent overlay layer.

Conceptually:

```html
<body>
  <div id="root">
    <!-- untouched application -->
  </div>

  <div id="astryx-theme-studio-root">
    <!-- studio UI -->
  </div>

  <div id="astryx-theme-studio-overlay">
    <!-- visual overlays only -->
  </div>
</body>
```

Selection rectangles should be positioned using element geometry such as `getBoundingClientRect()`.

Theme Studio MUST NOT:

- reparent application nodes;
- insert wrappers around application controls;
- change application layout;
- permanently add classes to inspected controls;
- modify application component props;
- rewrite host markup.

---

# 19. Component Identification

Where technically possible, identify the corresponding Astryx component.

Example:

```text
SELECTED

Button

Astryx component
Variant: primary
Size: md
State: default
```

If identification is uncertain, display that uncertainty.

Theme Studio MUST NOT claim positive component identification based only on an unreliable heuristic.

---

# 20. Selected Component Token View

Display all relevant public Astryx theme tokens affecting the selected element.

Example:

```text
BUTTON

Colours
────────────────

--color-accent
#1663AA

--color-on-accent
#FFFFFF

Focus
────────────────

--focus-outline-color
#1663AA

Radius
────────────────

--radius-element
8px
```

Editing these values updates the global working theme.

---

# 21. Editable vs Informational Properties

## Theme Token

```text
✓ THEME TOKEN

--color-accent
#1663AA

Editable
```

## Component Property

```text
COMPONENT PROPERTY

size="md"

Not part of theme
```

## Astryx Internal

```text
ASTRYX INTERNAL

padding-inline

🔒 Controlled by Astryx
```

## Application Style

```text
APPLICATION STYLE

margin-top: 16px

Not part of Astryx theme
```

This distinction is mandatory.

---

# 22. Live Preview

Every valid token change MUST immediately update the running application.

The preview should use temporary public token overrides at the appropriate theme boundary.

It MUST NOT implement preview by rewriting individual component CSS.

Flow:

```text
Change token
     ↓
Global temporary token override
     ↓
Application updates
     ↓
Navigate
     ↓
Override remains active
```

Invalid values must be rejected or safely reverted.

---

# 23. Show Impact

Show Impact is a core feature.

For any supported token:

```text
--color-background-surface

[Show Impact]
```

activates Impact Mode.

---

# 24. Current-Page Impact Highlighting

Impact Mode identifies visible elements currently consuming the selected token.

Affected elements receive temporary overlay highlights.

Non-affected elements may optionally be visually dimmed through the independent overlay system.

Example:

```text
Changing:

--color-background-surface

Visible impact:
14 elements
```

---

# 25. Impact Summary

Where component identification is possible:

```text
IMPACT

--color-background-surface

Current page
────────────────

14 elements affected

Card                 6
Input                4
Popover              2
Modal                1
Table                 1
```

Selecting a result should scroll to and highlight the corresponding element when possible.

---

# 26. Cross-Page Impact Knowledge

Theme Studio should distinguish between:

```text
Visible Impact
```

and:

```text
Known Application Impact
```

It MUST NOT claim a token affects another route unless that route/component has been observed, registered, or reliably analysed.

As the developer navigates, Theme Studio may build an impact index:

```text
--color-background-surface

KNOWN IMPACT

Dashboard            14
Customers             9
Settings              7
Reports               4

36 observed uses
```

---

# 27. Impact History

Conceptually:

```ts
{
  token: '--color-background-surface',
  routes: {
    '/dashboard': 14,
    '/customers': 9,
    '/settings': 7
  }
}
```

Impact history is development metadata and MUST NOT become part of the exported production theme.

---

# 28. Modified Token Tracking

Modified tokens must be obvious:

```text
● --color-accent
● --radius-element
  --shadow-low
```

Provide:

```text
Modified (27)
```

to filter the token list.

---

# 29. Original vs Working Values

Every modification preserves its original value:

```text
--color-accent

Original
#6750A4

Working
#1663AA

[Reset]
```

---

# 30. Undo and Redo

Maintain token-level history.

```text
↶ Undo
↷ Redo
```

Suggested shortcuts:

```text
Ctrl/Cmd + Z
Ctrl/Cmd + Shift + Z
```

---

# 31. Reset

Support:

```text
Reset Token
Reset Category
Reset Light Theme
Reset Dark Theme
Reset Entire Theme
```

Multi-change destructive resets require confirmation.

---

# 32. Theme Metadata

Support:

```text
Theme Name
Dreamscore

Theme ID
dreamscore

Description
Optional

Author
Optional
```

Theme ID should be generated from the name but editable.

---

# 33. Validation

Before export validate:

- unsupported tokens;
- malformed values;
- invalid colours;
- invalid units;
- missing required values;
- incompatible Astryx version;
- duplicate definitions;
- invalid light/dark values; and
- deprecated tokens where applicable.

---

# 34. Accessibility Validation

Where reliable, calculate colour contrast.

Example:

```text
Text / Surface

Contrast
7.2 : 1

WCAG AA  ✓
WCAG AAA ✓
```

Accessibility warnings should be visible before export.

Strict failure behaviour should be configurable.

---

# 35. Theme Health

Example:

```text
THEME HEALTH

Astryx compatibility       ✓
Token values               ✓
Light theme                ✓
Dark theme                 ✓
Unknown tokens             0
Accessibility warnings     2

Ready to export
```

---

# 36. Export Theme

Theme Studio MUST export a usable Astryx theme.

The developer must not need to manually reconstruct changes.

Example summary:

```text
EXPORT THEME

Dreamscore

Astryx version
0.x.x

Modified tokens
27

Colours          14
Typography        4
Radius            3
Spacing           3
Shadows           2
Motion            1

Light             ✓
Dark              ✓

[Export]
```

---

# 37. Astryx Theme Export

Generate production-ready code using the official Astryx theming API supported by the detected version.

Conceptual example only:

```ts
import { defineTheme } from '@astryxdesign/core/theme';

export const dreamscoreTheme = defineTheme({
  name: 'dreamscore',

  tokens: {
    '--color-accent': ['#1663AA', '#4D9CE6'],
    '--color-background-body': ['#F8FAFC', '#111827'],
    '--color-background-surface': ['#FFFFFF', '#1F2937'],
    '--color-text-primary': ['#111827', '#F9FAFB'],
  },
});
```

The exporter MUST follow the API of the detected Astryx version rather than assuming this conceptual syntax is permanently correct.

---

# 38. Export Formats

Initial implementation:

```text
Astryx Theme
JSON
```

JSON is used for:

- backup;
- re-import;
- version control;
- transfer between environments; and
- future tooling.

Possible future exports:

```text
CSS variables
Token diff
Theme package
```

---

# 39. Modified vs Complete Export

Provide:

```text
Export

● Modified tokens only
○ Complete resolved theme
```

Modified tokens only should be the default.

---

# 40. Export Package

Where appropriate:

```text
dreamscore-theme/
├── dreamscoreTheme.ts
├── dreamscore.theme.json
├── README.md
└── metadata.json
```

The generated README should explain how to add the exported theme to an Astryx application.

---

# 41. Import Theme

Support Theme Studio JSON import:

```text
Import Theme
     ↓
Validate
     ↓
Preview differences
     ↓
Apply
```

Never silently overwrite the current working theme.

---

# 42. Theme Comparison

Example:

```text
THEME DIFFERENCE

Current        Imported

#1663AA   →    #2563EB
8px       →    6px
16px      →    14px

23 tokens changed
```

---

# 43. Copy Theme Code

Provide:

```text
Copy Theme Code
```

to copy generated Astryx theme code directly.

---

# 44. Panel Layout

Recommended desktop layout:

```text
┌─────────────────────────────────────────────────────────────┐
│                        APPLICATION                          │
│                                                             │
│                                     ┌──────────────────────┐│
│                                     │ ASTRYX THEME STUDIO  ││
│                                     │──────────────────────││
│                                     │ Theme Inspect Impact ││
│                                     │                      ││
│                                     │ Search...            ││
│                                     │                      ││
│                                     │ Colours          42  ││
│                                     │ Typography       18  ││
│                                     │ Spacing          16  ││
│                                     │ Radius            6  ││
│                                     │ Shadows           8  ││
│                                     │                      ││
│                                     │ Modified         27  ││
│                                     │                      ││
│                                     │ ☀ Light  🌙 Dark     ││
│                                     │                      ││
│                                     │ ↶       ↷            ││
│                                     │                      ││
│                                     │ [ Export Theme ]     ││
│                                     └──────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

# 45. Panel Behaviour

Support:

- right docking;
- left docking;
- floating;
- resizing;
- collapse;
- close; and
- remembered position.

---

# 46. Keyboard Shortcuts

Suggested defaults:

```text
Ctrl/Cmd + Shift + A   Open Theme Studio
Ctrl/Cmd + Shift + I   Inspect Mode
Escape                 Exit Inspect/Impact Mode
Ctrl/Cmd + Z           Undo
Ctrl/Cmd + Shift + Z   Redo
```

Shortcuts must be configurable.

---

# 47. Theme Studio UI Isolation

Theme Studio MUST remain usable regardless of the theme being edited.

Changing:

```text
--color-background-surface
```

must not accidentally change the Theme Studio panel itself.

Use a robust isolation mechanism, preferably Shadow DOM where appropriate.

Theme Studio UI styling must not leak into the host application, and host application CSS should not unintentionally restyle Theme Studio.

---

# 48. DOM Safety Requirements

Theme Studio MUST NOT:

- reparent application elements;
- replace application nodes;
- wrap controls;
- mutate React/Vue/etc. component props;
- permanently add inspection classes;
- modify router configuration;
- intercept application events while Inspect/Impact mode is inactive;
- rewrite host stylesheets;
- persist temporary preview CSS into application source.

Observation is preferred over mutation.

Temporary preview changes must be limited to supported theme token overrides and independent overlay UI.

---

# 49. Observer Lifecycle

Any observers/listeners used by Theme Studio MUST have explicit lifecycle management.

This includes:

- `MutationObserver`;
- resize observers;
- scroll listeners;
- pointer listeners;
- keyboard listeners;
- route listeners; and
- animation frame callbacks.

When Theme Studio closes or unmounts, listeners and observers MUST be cleaned up.

Inspect/Impact-specific listeners should only be active while those modes require them.

---

# 50. Performance Requirements

Theme Studio should avoid continuously scanning the complete DOM.

Preferred techniques include:

- lazy inspection;
- cached token usage;
- `MutationObserver` for targeted invalidation;
- `ResizeObserver` where appropriate;
- `requestAnimationFrame` for overlay positioning;
- route-based impact indexing;
- computed-style analysis only when required;
- debounced expensive operations.

The tool should include development profiling for unusually expensive inspections.

---

# 51. Production Isolation — Hard Requirement

This section is mandatory.

A normal production build MUST NOT include or execute:

- Theme Studio UI;
- component inspector;
- Impact engine;
- selection overlays;
- development DOM observers;
- Theme Studio event listeners;
- working-theme local-storage runtime;
- development token analysis; or
- Theme Studio keyboard shortcuts.

The exported/committed Astryx theme is production code.

Theme Studio itself is development tooling.

Conceptually:

```text
DEVELOPMENT

Application
    +
Astryx Theme Studio
    ↓
Inspect / Edit / Validate
    ↓
Export Theme
    ↓
Commit exported theme


PRODUCTION

Application
    +
Committed Astryx Theme

NO THEME STUDIO
```

---

# 52. Production Fail-Safe

Even though the Vite integration prevents production loading, the package SHOULD fail safely if accidentally invoked in production.

It should:

- render nothing;
- register no listeners;
- create no observers;
- apply no working-theme overrides; and
- avoid reading/restoring Theme Studio development state.

The host application's dynamic DEV import remains the primary safeguard.

---

# 53. No Automatic Source Modification

The initial implementation MUST NOT automatically modify application source files.

Theme changes exist in Theme Studio working state until explicitly exported.

This allows safe experimentation.

Future source-writing integrations must be explicit opt-in features.

---

# 54. Recommended Architecture

```text
astryx-theme-studio/
│
├── core/
│   ├── token-registry
│   ├── token-resolver
│   ├── token-validator
│   ├── theme-state
│   ├── impact-engine
│   ├── history
│   └── export-engine
│
├── inspector/
│   ├── element-selector
│   ├── component-detector
│   ├── token-detector
│   └── overlay
│
├── ui/
│   ├── ThemeStudio
│   ├── ThemePanel
│   ├── InspectPanel
│   ├── ImpactPanel
│   ├── ExportPanel
│   └── editors
│
├── persistence/
│   └── local-storage
│
├── exporters/
│   ├── astryx
│   └── json
│
└── dev/
    └── entry
```

---

# 55. Shared Core

Keep these reusable:

```text
Token Registry
Token Resolver
Theme State
Impact Engine
Theme Validator
Export Engine
```

This enables a future browser extension without rebuilding the core.

```text
                 Theme Studio Core
                        │
          ┌─────────────┴─────────────┐
          │                           │
   In-App DevTool              Future Extension
```

---

# 56. Future Browser Extension

The browser extension is NOT part of the MVP.

The architecture should permit a future extension to provide:

```text
Astryx detection
Version detection
Theme detection
Resolved token inspection
Component inspection
Impact analysis
Temporary token overrides
```

The in-app Theme Studio remains the preferred full editing environment.

---

# 57. Future Route Crawler

A future optional feature may analyse registered development routes.

Example:

```text
Analyse Application

Routes discovered: 18

[Run Analysis]
```

Result:

```text
--color-background-surface

Dashboard             14
Customers              9
Customer Detail       11
Reports                 6
Settings                7

47 known usages
```

It must be explicitly development-only.

---

# 58. MVP Requirements

The first usable version MUST provide:

1. Development-only Theme Studio runtime.
2. Vite development-only dynamic-loading integration.
3. Production bundle isolation.
4. Independent Theme Studio root/UI.
5. Detection of installed Astryx version.
6. Registry of all officially supported Astryx theme tokens.
7. Complete searchable token editor.
8. Light and dark mode editing.
9. Live global application preview.
10. Cross-route working-theme persistence.
11. Browser-refresh development persistence.
12. Inspect Mode.
13. Non-invasive selection overlay.
14. Identification of relevant Astryx tokens.
15. Clear distinction between theme and non-theme properties.
16. Show Impact for the current page.
17. Highlighting of visible token consumers.
18. Modified-token tracking.
19. Original vs working values.
20. Undo/redo.
21. Token/category/theme reset.
22. Theme validation.
23. Export to valid Astryx theme.
24. JSON backup/export.
25. JSON import.
26. Isolated Theme Studio styling.
27. Explicit observer/listener cleanup.
28. Production fail-safe.

---

# 59. Phase 2

Potential Phase 2 features:

- route impact history;
- accessibility/contrast analysis improvements;
- advanced shadow editor;
- richer typography editor;
- theme comparison;
- complete resolved-theme export;
- theme package ZIP;
- automatic token-schema update tooling;
- route crawler;
- component usage analytics.

---

# 60. Phase 3

Potential future features:

- browser extension;
- visual theme comparison;
- side-by-side light/dark preview;
- viewport/device preview;
- theme snapshots;
- shareable theme files;
- CI theme validation;
- visual regression integration;
- AI-assisted theme generation;
- AI theme critique;
- theme generation from a screenshot/reference design;
- design-system compliance reports.

---

# 61. README Requirements

The package README MUST include at minimum:

## Installation

```bash
npm install -D @project/astryx-theme-studio
```

## Vite setup

Explain that Theme Studio should be loaded through a development-only dynamic import from `src/main.tsx`.

Include the recommended:

```text
src/dev/mountAstryxThemeStudio.tsx
```

structure and examples from Section 4.

## Why dynamic import is required

Explain that:

```tsx
enabled={import.meta.env.DEV}
```

alone is not the preferred production-isolation strategy.

The Theme Studio module should not enter the normal production module graph.

## Starting development

```bash
npm run dev
```

Explain where the Theme Studio launcher appears.

## Production build

```bash
npm run build
npm run preview
```

Explain how to verify Theme Studio is absent.

## Workflow

Document:

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

## Production guarantee

Clearly state:

> Astryx Theme Studio is development tooling. The Theme Studio runtime should not be loaded in standard production builds. Only the exported Astryx theme is intended for production use.

---

# 62. Definition of Success

A developer should be able to:

```text
Open the real application
        ↓
Run in Vite development mode
        ↓
Theme Studio loads dynamically
        ↓
Select Inspect
        ↓
Click an Astryx control
        ↓
See every relevant supported Astryx token
        ↓
Edit those tokens
        ↓
See the application update immediately
        ↓
Use Show Impact
        ↓
See visible consumers
        ↓
Navigate to another page
        ↓
Working theme remains active
        ↓
Continue editing
        ↓
Edit light and dark modes
        ↓
Validate
        ↓
Export
        ↓
Receive valid Astryx theme code
        ↓
Commit/use that theme
        ↓
Run Vite production build
        ↓
Production contains the theme but no Theme Studio runtime
```

Theme Studio should make Astryx's official theming boundaries visible, understandable, safe, directly editable, and exportable without compromising the host application's production runtime.
