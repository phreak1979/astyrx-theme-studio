## ADDED Requirements

### Requirement: Workspace example app
The repo SHALL contain `examples/vite-app`, an npm workspace using Vite, React 19 and `@astryxdesign/core` with its StyleX integration, consuming the studio's built output through the same `exports` map a real consumer uses (linked with `file:../..`).

#### Scenario: Run the example
- **WHEN** a developer runs `npm install` at the repo root then the example's `dev` script
- **THEN** the example app renders with Astryx styling and the studio launcher appears

### Requirement: Representative test surface
The example SHALL provide at least three routes (Dashboard, Customers, Settings) using a variety of Astryx components (including Card, Button, Input, Table), at least one portal-rendered component (Modal or Popover), a nested `<Theme>` region, and a light/dark mode control.

#### Scenario: Cross-route persistence can be tested
- **WHEN** a token is edited and the developer navigates between all three routes
- **THEN** each route displays the edited value

### Requirement: Production verification script
The example SHALL provide a `verify-prod` script that builds the app and fails if studio code is present in `dist/`.

#### Scenario: Clean production build
- **WHEN** `verify-prod` runs against a correctly integrated example
- **THEN** it exits successfully

#### Scenario: Leaked studio import
- **WHEN** the studio is statically imported in the example entry
- **THEN** `verify-prod` exits with a failure naming the detected marker
