## ADDED Requirements

### Requirement: Isolated rendering
The studio UI SHALL render in its own React root inside a Shadow DOM host appended to `body`, SHALL use its own CSS custom property namespace, and SHALL NOT use Astryx tokens or components, so that edited tokens never restyle the studio and studio CSS never leaks into the host.

#### Scenario: Surface token edit
- **WHEN** `--color-background-surface` is changed to a conspicuous colour
- **THEN** the studio panel's appearance is unchanged

#### Scenario: Host CSS does not leak in
- **WHEN** the host defines a global `button { … }` rule
- **THEN** studio buttons are unaffected

### Requirement: Launcher
In development the studio SHALL show a small, movable, collapsible floating launcher with the tooltip "Astryx Theme Studio" whose position persists across reloads.

#### Scenario: Drag and reload
- **WHEN** the launcher is dragged to a new position and the page reloads
- **THEN** it reappears at that position

### Requirement: Panel behaviour
The panel SHALL support left or right docking, floating, resizing, collapse and close, and SHALL remember its position and size.

#### Scenario: Dock left
- **WHEN** the developer docks the panel left
- **THEN** it renders on the left edge and the choice persists

### Requirement: Token browser with search and filters
The Theme tab SHALL list every registry token grouped by category with counts, SHALL search by token name, category, description and current value, and SHALL offer a Modified filter with count.

#### Scenario: Search
- **WHEN** the developer searches "surface"
- **THEN** all tokens whose name, category or value match are listed

#### Scenario: Modified filter
- **WHEN** the Modified filter is active
- **THEN** only tokens differing from original are listed, each marked with a modified indicator

### Requirement: Type-appropriate editors
The studio SHALL provide a colour picker with HEX input, numeric/length inputs with units, enumerated selectors where Astryx defines a value set, and a validated raw-value fallback for any token.

#### Scenario: Raw fallback validated
- **WHEN** a raw value is entered for a length token that is not a valid length
- **THEN** it is rejected with an error

### Requirement: Mode switch and metadata
The panel SHALL provide a Light/Dark switch and fields for theme name, theme ID (derived from the name and editable), description and author.

#### Scenario: ID generation
- **WHEN** the name "Dream Score" is entered and the ID has not been edited
- **THEN** the ID shows `dream-score`

### Requirement: Keyboard shortcuts
The studio SHALL provide configurable shortcuts defaulting to Ctrl/Cmd+Shift+A (open), Ctrl/Cmd+Shift+I (Inspect), Escape (exit Inspect/Impact), and undo/redo, and SHALL register no shortcut listeners while unmounted.

#### Scenario: Unmount removes listeners
- **WHEN** the studio is unmounted
- **THEN** no studio keyboard listener remains on `window` or `document`
