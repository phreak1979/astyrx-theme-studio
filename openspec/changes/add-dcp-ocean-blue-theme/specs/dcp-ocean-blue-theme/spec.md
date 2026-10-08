## ADDED Requirements

### Requirement: DCP Ocean Blue theme definition
The repo SHALL provide `dcpOceanBlueTheme`, created with `defineTheme`, with light and dark values for the Astryx colour tokens, using Deep Space Blue `#0E354F`, Air Force Blue `#5490B8` and Charcoal Blue `#323949` as the brand palette, Inter as the body and heading font, and radii and shadows matching the mockup.

#### Scenario: Palette applied
- **WHEN** the demo app renders with `dcpOceanBlueTheme` in light mode
- **THEN** primary buttons, active navigation, links and progress bars use the Air Force Blue / Deep Space Blue palette and surfaces use the mockup's light surface colours

#### Scenario: Dark mode applied
- **WHEN** the demo app switches to dark mode
- **THEN** the page, cards and panels use the mockup's dark navy and Charcoal Blue surfaces with light text

### Requirement: Alert and status styling
The theme SHALL style info, warning, success and error alerts so each has a distinct tinted background, border, icon and text colour in both light and dark modes, as shown in the mockup's "Alert / Notification components" panel, and SHALL style the status pills (On track, In progress, Needs attention, At risk) accordingly.

#### Scenario: Four alert statuses
- **WHEN** a Banner of each status (info, warning, success, error) is rendered in light and in dark mode
- **THEN** each is visibly distinct and matches the corresponding mockup alert colours

### Requirement: Form element styling
The theme SHALL style primary, secondary and ghost buttons, text input, select, switch (off and on), checkbox and radio to match the mockup's "Buttons & form elements" panel in both modes.

#### Scenario: Controls match mockup
- **WHEN** the showcase renders each control in its default and active state
- **THEN** each uses the mockup's fill, border, radius and accent colours

### Requirement: Copy-paste packaging
The theme SHALL be delivered as one self-contained `dcpOceanBlueTheme.ts` that imports only `defineTheme` from `@astryxdesign/core/theme`, exported from Theme Studio, and the README SHALL document how to copy it into another app, pass it to `<Theme>`, install Inter, and optionally pre-build CSS with `npx @astryxdesign/cli theme build`.

#### Scenario: Consumer follows the README
- **WHEN** a developer copies the file into a new Astryx app and wraps the app in `<Theme theme={dcpOceanBlueTheme}>`
- **THEN** the app renders with the DCP Ocean Blue theme without further code changes besides loading Inter

#### Scenario: Exported file is the source
- **WHEN** the theme is re-exported from Theme Studio after tuning
- **THEN** the committed file matches the export (no hand edits outside the generated token map and component overrides)
