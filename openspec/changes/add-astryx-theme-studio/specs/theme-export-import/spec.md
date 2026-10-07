## ADDED Requirements

### Requirement: Pre-export validation
Before export the studio SHALL validate for unsupported tokens, malformed values, invalid colours and units, incomplete or invalid light/dark values, duplicate definitions, deprecated tokens, and Astryx version incompatibility, and SHALL display a theme health summary.

#### Scenario: Unknown token blocks export
- **WHEN** the working theme contains a token not in the registry
- **THEN** export is blocked and the token is listed

#### Scenario: Healthy theme
- **WHEN** all checks pass
- **THEN** the summary shows "Ready to export"

### Requirement: Astryx theme export
The studio SHALL generate TypeScript calling `defineTheme({ name, tokens })` with `[light, dark]` tuples for mode-specific tokens and plain strings otherwise, using the import path for the detected Astryx version, and SHALL provide Copy Theme Code and file download.

#### Scenario: Modified tokens only by default
- **WHEN** the developer exports with defaults
- **THEN** the output contains only modified tokens

#### Scenario: Complete resolved export
- **WHEN** "Complete resolved theme" is selected
- **THEN** the output contains every registry token with its working value

### Requirement: JSON export
The studio SHALL export a Theme Studio JSON file containing a schema version, Astryx version, name, metadata, and light and dark token maps, suitable for backup and re-import.

#### Scenario: Round trip
- **WHEN** exported JSON is imported into a fresh studio session
- **THEN** the working theme equals the exported one

### Requirement: Export package
The studio SHALL offer an export package containing `<id>Theme.ts`, `<id>.theme.json`, `metadata.json`, and a README explaining how to add the theme to an Astryx app.

#### Scenario: Package contents
- **WHEN** the developer chooses Export Package for theme id `dreamscore`
- **THEN** the four files are produced with consistent contents

### Requirement: Safe JSON import
Import SHALL validate the file, show a difference against the current working theme, and apply only after explicit confirmation; it SHALL NOT silently overwrite the working theme.

#### Scenario: Invalid file
- **WHEN** a JSON file with unknown tokens or a malformed schema is imported
- **THEN** errors are shown and the working theme is unchanged

#### Scenario: Diff before apply
- **WHEN** a valid file is imported
- **THEN** the studio lists changed tokens (current → imported) and waits for Apply

### Requirement: No source modification
The studio SHALL NOT write to the host application's source files; output only leaves the studio through copy or download.

#### Scenario: Export action
- **WHEN** the developer exports
- **THEN** no file in the host project is modified by the studio
