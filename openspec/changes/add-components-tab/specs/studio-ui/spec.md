## ADDED Requirements

### Requirement: Components tab
The panel SHALL provide a Components tab between Inspect and Impact. Selecting it SHALL show the component inventory, and the selected tab SHALL follow the same switching and visibility rules as the other tabs. Opening the tab SHALL NOT enter Inspect or Impact mode.

#### Scenario: Open the tab
- **WHEN** the developer selects Components
- **THEN** the panel shows the page's component inventory and no Inspect or Impact overlay is started

#### Scenario: Tab order
- **WHEN** the panel is open
- **THEN** the tabs read Theme, Inspect, Components, Impact, Export
