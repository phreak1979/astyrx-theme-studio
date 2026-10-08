## ADDED Requirements

### Requirement: DCP Studio dashboard
With DCP Ocean Blue active, the demo Dashboard SHALL render the mockup's layout: a sidebar (brand, Dashboard, Programmes, Blueprinting, Content Production, Scheduling, Validation, Reports, Settings) that is dark in both light and dark mode; a header with search, notification bell and user chip; a title with date-range control; four KPI cards (Programmes, Courses, Modules and Lessons, the last two with donut rings); a production-progress bar chart with legend; a recent-activity list; and a programmes table with progress bars, status pills and row menus.

#### Scenario: Light mode matches mockup
- **WHEN** the demo runs in light mode with DCP Ocean Blue and is compared with the mockup's light dashboard
- **THEN** layout, colours, and component styling match with only unavoidable differences recorded in the README

#### Scenario: Dark mode matches mockup
- **WHEN** the demo runs in dark mode with DCP Ocean Blue and is compared with the mockup's dark dashboard
- **THEN** layout, colours, and component styling match with only unavoidable differences recorded in the README

#### Scenario: Sidebar stays dark
- **WHEN** mode is light
- **THEN** the sidebar remains dark navy

### Requirement: Alert and form-element showcase
The demo SHALL provide a page showing the four alert types in light and dark mode side by side, and the buttons and form elements panel (buttons, input, select, switch off/on, checkbox, radio).

#### Scenario: Showcase visible
- **WHEN** a developer opens the showcase route
- **THEN** all four alerts and all listed controls render in both modes

### Requirement: Theme switch
The demo SHALL offer a "DCP Ocean Blue" switch that swaps the app `<Theme>` at runtime, with Neutral remaining the default.

#### Scenario: Toggle theme
- **WHEN** the user turns on the DCP Ocean Blue switch
- **THEN** the whole app re-themes and Theme Studio reflects the new theme's values
