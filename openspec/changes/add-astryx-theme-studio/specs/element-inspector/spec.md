## ADDED Requirements

### Requirement: Inspect mode
While Inspect mode is active, hovering SHALL highlight the element under the pointer and clicking SHALL select it, suppressing the application's click behaviour only for that interaction. Escape SHALL exit Inspect mode. While inactive, the studio SHALL NOT intercept application events.

#### Scenario: Select a button
- **WHEN** Inspect is active and the developer clicks an application button
- **THEN** the button is selected, its own click handler does not fire, and Inspect state remains consistent

#### Scenario: Inactive
- **WHEN** Inspect is inactive
- **THEN** no capture-phase pointer listener from the studio is attached

### Requirement: Non-invasive overlay
Highlights SHALL be drawn in an independent overlay layer positioned from `getBoundingClientRect()`. The studio SHALL NOT wrap, reparent or replace application nodes, and SHALL NOT add classes or attributes to inspected elements.

#### Scenario: DOM untouched
- **WHEN** an element is hovered and selected
- **THEN** the application DOM subtree is identical before and after

### Requirement: Component identification without guessing
The studio SHALL identify an Astryx component only from stable `astryx-*` classes and reflect `data-astryx-*` attributes as variant/state, and SHALL report "not identified as an Astryx component" otherwise.

#### Scenario: Astryx Button
- **WHEN** an element carries the `astryx-button` class
- **THEN** the studio reports Button with any readable variant, size and state

#### Scenario: Application element
- **WHEN** an element has no `astryx-*` class
- **THEN** it is reported as not an Astryx component

### Requirement: Relevant token view
For the selected element the studio SHALL list the registry tokens referenced by rules matching the element (following variable aliases), grouped by category, with current values editable in place; edits update the global working theme.

#### Scenario: Selection inside a component
- **WHEN** the developer clicks an inner part of an Astryx component, such as a button's label
- **THEN** the tokens of the component root are shown as well, since colours and radii are declared there

#### Scenario: Edit from selection
- **WHEN** the developer changes `--radius-element` from the selected Button's token list
- **THEN** the working theme updates and all consumers re-render with the new value

### Requirement: Property classification
Properties shown for a selection SHALL be classified as Theme Token (editable), Component Property (informational), Astryx Internal (locked), or Application Style (informational), and only Theme Tokens SHALL be exportable.

#### Scenario: Application margin
- **WHEN** the selected element has an application-authored `margin-top`
- **THEN** it is labelled Application Style and has no editor

### Requirement: Observer and listener lifecycle
Observers, scroll/resize listeners and animation-frame callbacks used by Inspect SHALL be created only while the mode requires them and SHALL be removed on exit and on unmount.

#### Scenario: Exit cleans up
- **WHEN** Inspect mode is exited
- **THEN** its listeners, observers and rAF loop are all disposed
