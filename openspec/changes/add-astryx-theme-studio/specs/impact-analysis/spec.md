## ADDED Requirements

### Requirement: Show Impact for the current page
For any registry token the studio SHALL provide Show Impact, which identifies visible elements on the current page that consume the token, directly or through variable aliases, and highlights them via the overlay layer.

#### Scenario: Surface token impact
- **WHEN** Show Impact is activated for `--color-background-surface`
- **THEN** the visible elements whose matching rules reference it are highlighted and the count is displayed

#### Scenario: Alias consumers
- **WHEN** a token is consumed only through another variable that references it
- **THEN** those elements are included

### Requirement: Impact summary
Where components are identifiable, the summary SHALL group affected elements by Astryx component with counts, and selecting a result SHALL scroll to and highlight that element when possible.

#### Scenario: Select a result
- **WHEN** the developer selects "Card 6" then one entry
- **THEN** the page scrolls that element into view and highlights it

### Requirement: Honest scope of knowledge
The studio SHALL distinguish Visible Impact (current page) from Known Application Impact (routes observed during the session) and SHALL NOT claim impact on routes that have not been observed.

#### Scenario: Unvisited route
- **WHEN** the developer has not visited Reports
- **THEN** Reports does not appear in Known Application Impact

### Requirement: Observed impact index
While navigating, the studio SHALL record per-token, per-route consumer counts in a development-only index that persists across routes and SHALL NOT include it in any exported theme.

#### Scenario: Index across routes
- **WHEN** the developer visits Dashboard then Customers with Impact active for one token
- **THEN** both routes' counts are listed and none appear in export output

### Requirement: Unreadable styles reported
When stylesheets cannot be read, the studio SHALL report the number of unreadable sheets and label results as observed rather than complete.

#### Scenario: Cross-origin stylesheet
- **WHEN** a cross-origin stylesheet blocks `cssRules` access
- **THEN** the impact panel notes it as unreadable

### Requirement: Cross-check against computed styles
The studio SHALL provide an on-demand verification that temporarily changes the token, with transitions frozen, and reports how many listed elements currently change, how many are state-only (hover, focus, pressed), and how many additional elements change through inheritance or unreadable styles, then removes every temporary style.

#### Scenario: Non-state token
- **WHEN** Verify runs for a token used only in resting styles
- **THEN** every listed element is reported as changing and no temporary style remains in the document

### Requirement: Performance and lifecycle
Impact analysis SHALL be computed lazily, cached, invalidated by targeted observation, and SHALL stop all observers and animation frames when Impact mode exits or the studio unmounts; it SHALL log a development warning when a scan exceeds a configured threshold.

#### Scenario: Slow scan
- **WHEN** a scan exceeds the threshold
- **THEN** a development profiling message is logged with the duration and token
