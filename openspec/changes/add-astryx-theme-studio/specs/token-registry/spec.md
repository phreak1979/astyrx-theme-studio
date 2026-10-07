## ADDED Requirements

### Requirement: Registry derived from installed Astryx
The studio SHALL build its token registry at runtime from the `tokenDefaults` exported by the installed `@astryxdesign/core`, and SHALL expose every token in it without a curated subset.

#### Scenario: Complete exposure
- **WHEN** the registry is built
- **THEN** its token count equals the number of keys in `tokenDefaults`

### Requirement: Light/dark default parsing
The registry SHALL parse `light-dark(a, b)` defaults into separate light and dark values, correctly handling commas and parentheses inside values such as `rgba()`, and SHALL treat other values as identical in both modes.

#### Scenario: Colour with rgba
- **WHEN** a default is `light-dark(rgba(5, 54, 89, 0.1), rgba(223, 226, 229, 0.2))`
- **THEN** light is `rgba(5, 54, 89, 0.1)` and dark is `rgba(223, 226, 229, 0.2)`

#### Scenario: Single value
- **WHEN** a default has no `light-dark()` wrapper
- **THEN** light and dark are the same value and the token is marked as not mode-specific

### Requirement: Categories and value types
Each registry entry SHALL carry a category (colour, typography, spacing, sizing, borders, radius, shadows, motion, focus, other) derived from its name, and a value type (colour, length, number, shadow, duration, easing, font-family, other) used to pick an editor. Categories SHALL NOT remove tokens from availability.

#### Scenario: Uncategorised token
- **WHEN** a token matches no known category prefix
- **THEN** it appears under "Other" and is still editable

### Requirement: Private variables excluded
CSS custom properties not present in the registry SHALL NOT be offered as editable theme tokens or exported.

#### Scenario: Unknown variable
- **WHEN** an element references `--astryx-card-padding` or an app-defined variable
- **THEN** it is shown as informational only and is not editable

### Requirement: Version detection and compatibility warning
The studio SHALL detect the installed `@astryxdesign/core` version and display it, and SHALL show an explicit compatibility warning when the version is outside the range the studio supports.

#### Scenario: Unsupported version
- **WHEN** the installed version is outside the supported range
- **THEN** the panel displays a warning naming the installed and supported versions
