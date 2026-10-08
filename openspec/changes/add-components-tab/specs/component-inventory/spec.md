## ADDED Requirements

### Requirement: Page component scan
The studio SHALL scan the current document for Astryx components and identify each only from its stable `astryx-*` class, using the same rule as Inspect. It SHALL NOT infer a component from tag names, text or any other heuristic. It SHALL ignore the studio's own nodes. It SHALL NOT add classes or attributes to, or otherwise modify, application nodes.

#### Scenario: Components on the page
- **WHEN** the page contains three `astryx-card` elements and fourteen `astryx-button` elements
- **THEN** the scan lists Card with 3 instances and Button with 14 instances

#### Scenario: Non-Astryx elements
- **WHEN** an element has no `astryx-*` class
- **THEN** it is not listed

#### Scenario: Studio nodes ignored
- **WHEN** the studio panel and overlay are mounted
- **THEN** none of their elements appear in the scan

#### Scenario: DOM untouched
- **WHEN** a scan runs
- **THEN** the application DOM is identical before and after

### Requirement: Component roots only
The inventory SHALL count and list only component roots. Elements that are inner parts of a component (an `astryx-*` descendant of another Astryx component root) SHALL NOT be counted as instances; their part names MAY be shown as a collapsed note on the owning component.

#### Scenario: Inner part
- **WHEN** a card contains a child with class `astryx-card-header`
- **THEN** Card still counts 1 instance and the header is not listed as a component

### Requirement: Aggregated props
For each listed component the inventory SHALL aggregate the reflected `data-*` props (excluding `data-astryx-*` and studio attributes) of its instances as value counts per prop.

#### Scenario: Variant counts
- **WHEN** nine Buttons have `data-variant="secondary"` and three have `data-variant="primary"`
- **THEN** the Button entry shows variant: secondary×9, primary×3

### Requirement: Instance navigation
Each listed component SHALL expand to its instances, and selecting an instance SHALL scroll it into view and highlight it through the overlay layer. Long instance lists SHALL be truncated with a "+N more" note.

#### Scenario: Highlight an instance
- **WHEN** the developer selects a Button instance in the list
- **THEN** the page scrolls to it and the overlay highlights it, without modifying the element

### Requirement: Theme tokens used by a component
For a listed component the inventory SHALL show the registry theme tokens used by its first instance, labelled as taken from the first instance, grouped by category with values editable in place via the existing token editor. Edits SHALL update the global working theme exactly as in Inspect, and SHALL NOT create component-scoped overrides.

#### Scenario: Edit from the inventory
- **WHEN** the developer edits a token shown under Button
- **THEN** the working theme changes globally, the token shows as modified in the Theme tab, and every consumer of that token on the page updates

### Requirement: Refreshing the scan
The inventory SHALL rescan when the Components tab is opened, when the developer presses Rescan, and when the route changes while the tab is open. It SHALL NOT scan while the studio is closed or the tab is not shown.

#### Scenario: Route change
- **WHEN** the developer navigates to another route while the Components tab is open
- **THEN** the inventory is rescanned for the new page after it renders

#### Scenario: Manual rescan
- **WHEN** a component is rendered after the last scan and the developer presses Rescan
- **THEN** it appears in the inventory

### Requirement: Honest coverage notice
The inventory SHALL state that elements without a stable `astryx-*` class are not listed, and SHALL show an empty state when no components are found.

#### Scenario: Empty page
- **WHEN** the page has no elements with a stable `astryx-*` class
- **THEN** the tab shows an empty state rather than a blank list
