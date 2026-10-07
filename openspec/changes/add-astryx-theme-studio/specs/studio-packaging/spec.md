## ADDED Requirements

### Requirement: Installable from the GitHub repository
The package SHALL be installable with `npm install -D github:phreak1979/astyrx-theme-studio` and SHALL produce its built output (`dist/`) during installation via a `prepare` script, without `dist/` being committed.

#### Scenario: Git install in a Vite app
- **WHEN** a developer runs the git install command in a Vite + React + Astryx app
- **THEN** `node_modules/astryx-theme-studio/dist` exists and `import('astryx-theme-studio/dev')` resolves with type declarations

### Requirement: Dev-only public entry
The package SHALL expose `./dev` as its public entry exporting `AstryxThemeStudio` and a mount helper, SHALL declare `sideEffects: false`, and SHALL declare `react`, `react-dom` (>=19) and `@astryxdesign/core` (^0.6.5) as peer dependencies.

#### Scenario: Entry map
- **WHEN** a consumer inspects the package `exports`
- **THEN** `./dev` is exported and no entry loads studio code as a side effect of import

### Requirement: Astryx version supplied without importing Astryx internals
The package SHALL accept the installed Astryx version through an `astryxVersion` option or a build-time value injected by an optional `astryx-theme-studio/vite` plugin, and SHALL display "version unknown" with a compatibility warning when neither is provided.

#### Scenario: Plugin supplies the version
- **WHEN** the host adds `astryxThemeStudio()` to its Vite plugins
- **THEN** the panel shows the installed `@astryxdesign/core` version and a compatibility status

### Requirement: Dynamic dev-only loading
The documented integration SHALL load the studio only through `if (import.meta.env.DEV)` combined with a dynamic `import()` from `src/dev/mountAstryxThemeStudio.tsx`, and SHALL NOT statically import the studio from the application entry.

#### Scenario: Production build excludes the studio
- **WHEN** the host app runs `vite build` using the documented integration
- **THEN** the output in `dist/` contains no studio code, including no studio marker string, launcher, observers, or shortcut handlers

### Requirement: Production fail-safe
If the studio is invoked when `import.meta.env?.DEV` is not `true`, the package SHALL render nothing, register no listeners or observers, apply no overrides, and not read persisted working-theme state. Accessing `import.meta.env` SHALL NOT throw in bundlers that do not define it.

#### Scenario: Accidental production invocation
- **WHEN** the mount helper is called in a production build
- **THEN** no DOM nodes are created, no `localStorage` key is read, and no event listener is added

### Requirement: README setup guidance
The README SHALL document installation, the `mountAstryxThemeStudio.tsx` and `main.tsx` integration, why dynamic import is required rather than `enabled={import.meta.env.DEV}`, running development, production build verification (`build`, `preview`), the workflow, and the production guarantee statement.

#### Scenario: Verification steps present
- **WHEN** a developer reads the README production section
- **THEN** it lists how to confirm no launcher, shortcuts, overlay root or overrides exist in the preview build and how to grep `dist/`
