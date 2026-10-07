## ADDED Requirements

### Requirement: Working theme state
The studio SHALL maintain one central working theme holding independent light and dark values, the modified token set, and the original value for each modified token, independent of the current route.

#### Scenario: Original preserved
- **WHEN** a token is changed
- **THEN** its original value remains available and a Reset restores it

### Requirement: Live preview by token override
Every valid token change SHALL be applied immediately by writing temporary overrides for modified tokens into a single unlayered `<style>` element in `<head>`. Preview SHALL NOT rewrite component CSS, reparent or wrap application nodes, or modify application props.

#### Scenario: Override takes effect
- **WHEN** `--color-accent` is changed to `#1663AA`
- **THEN** all elements consuming it update without reload and no application DOM node was added, moved or re-classed

#### Scenario: Reaches the app's own Theme wrapper
- **WHEN** the app renders a root `<Theme>` whose wrapper declares the token itself
- **THEN** the override still takes effect, because it targets the root theme boundary and not only `<html>`

#### Scenario: Nested themes keep their own values
- **WHEN** a nested `<Theme>` region defines its own value for an edited token and the "override nested themes" option is off
- **THEN** that region keeps its own value, and turning the option on applies the edit there too

#### Scenario: Studio closed
- **WHEN** the override element is removed or the studio is unmounted
- **THEN** the application renders with its original theme

### Requirement: Light and dark editing
The studio SHALL allow editing light and dark values independently and SHALL emit overrides as `light-dark(light, dark)` so both modes are preserved.

#### Scenario: Edit only dark
- **WHEN** only the dark value of a token is edited
- **THEN** the light value remains the original and the override contains both

### Requirement: Mode preview
The studio SHALL offer Auto (follow the app), Light and Dark preview. Forcing a mode SHALL be done with an unlayered `color-scheme` rule and SHALL NOT modify the app's own theme attributes or mode controls.

#### Scenario: Force dark
- **WHEN** the app is in light mode and the developer chooses Dark
- **THEN** the whole app, including portals and nested themes, renders with dark values, and choosing Auto restores the app's own mode

### Requirement: Invalid values rejected
Values that fail validation against the token's type SHALL NOT be applied; the previous valid value SHALL remain active.

#### Scenario: Malformed colour
- **WHEN** a colour token is set to `#12`
- **THEN** the application keeps the prior value and the editor shows an error

### Requirement: Cross-route persistence
Route changes SHALL NOT reset the working theme, mode, undo history, panel state or observed impact data.

#### Scenario: Navigate in SPA
- **WHEN** the developer moves from Dashboard to Customers to Settings
- **THEN** the override remains in force on each route

### Requirement: Refresh persistence (development only)
The working theme SHALL be persisted to `localStorage` key `astryx-theme-studio:working-theme` in development, with the Astryx version recorded, and on reload the studio SHALL ask whether to continue editing or discard. Persistence SHALL be configurable and SHALL NOT run in production.

#### Scenario: Reload with saved theme
- **WHEN** the page reloads and a saved theme with 27 modified tokens exists
- **THEN** the studio offers Continue Editing or Discard and applies nothing until Continue is chosen

#### Scenario: Version mismatch
- **WHEN** the saved Astryx version differs from the installed one
- **THEN** the prompt warns of the mismatch before applying

### Requirement: Undo and redo
The studio SHALL keep token-level undo/redo history, coalescing continuous picker changes into one entry, bound to Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z while the studio has focus or is open.

#### Scenario: Undo a change
- **WHEN** a token is edited then Undo is triggered
- **THEN** the previous value is restored in state and in the live preview

### Requirement: Reset
The studio SHALL support resetting a token, a category, the light theme, the dark theme, and the entire theme, and SHALL require confirmation for resets affecting multiple tokens.

#### Scenario: Reset category
- **WHEN** the developer confirms Reset on the Radius category
- **THEN** all radius tokens return to original values and are no longer marked modified
