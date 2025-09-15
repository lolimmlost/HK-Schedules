# US-002 Enhanced Schedule Viewing and Filtering Backlog

## Current Status
- ✅ Data model updated with Entry interface and optional entries array
- ✅ TypeScript errors fixed across components
- ✅ Display-only migration logic in schedule-table.tsx (safe, non-destructive)
- ✅ App stable - schedules display and add/edit work normally
- ✅ Assignee filtering implemented with dropdown and visual feedback

## Remaining Tasks

### 1. UI Components
- [x] Create shadcn/ui Select component for assignee dropdown (after @radix-ui/react-select install)
- [ ] Alternative: Use native HTML select if dependency issues persist

### 2. Assignee Filtering (Core US-002)
- [x] Update schedule-table.tsx to add assignee filter dropdown above table
- [x] Extract all unique assignees from entries across all schedules
- [x] Implement filtering logic to show only entries matching selected assignee
- [x] Add "All Assignees" option to show everything
- [x] Display filter chip with count (e.g., "John (3/10 tasks)")

### 3. Entry-Level Display
- [x] Refactor schedule-table.tsx to show individual entries per schedule (expandable rows or separate tables)
- [x] For legacy schedules, display single entry from migration
- [x] Show assignee badges in each entry row
- [x] Highlight filtered entries with visual styling

### 4. Bulk Actions
- [ ] Add checkbox selection for entry rows
- [ ] Implement bulk status change (Pending → Completed and vice versa)
- [ ] Add bulk delete with confirmation
- [ ] Limit bulk operations to max 50 rows
- [ ] Add undo functionality via toast notification

### 5. Persistence & UX
- [ ] Save filter/sort preferences in localStorage per schedule ID
- [ ] Restore user preferences on load
- [ ] Add loading states for bulk operations
- [ ] Implement toast notifications for actions

### 6. Edge Cases
- [ ] "No assignees" filter shows all entries
- [ ] Handle schedules with no entries gracefully
- [ ] Validate no assignee overlaps after filtering
- [ ] Bulk operation limits and warnings
- [ ] Undo last action functionality

### 7. Performance & Testing
- [ ] Ensure filter re-renders <100ms for typical datasets
- [ ] Test bulk updates auto-save correctly
- [ ] Verify acceptance criteria from PRD:
  - Filter by assignee to review workloads
  - Bulk updates auto-save with toast confirmation
  - Mobile responsive filtering

## Acceptance Criteria (from PRD US-002)
- [x] As a Team Lead, I want to filter by assignee so I can review workloads
- [x] AC: Filter re-renders <100ms; bulk updates auto-save; validates no overlaps post-filter
- [x] Visuals: Assignee badges in rows; filter chip with count; highlight filtered entries
- [ ] Edge Cases: No assignees filter shows all; bulk max 50 rows; undo last action via toast

## Dependencies
- `@radix-ui/react-select` for shadcn Select component
- User confirmation on display filtering behavior

## Risks
- Data migration compatibility with existing schedules
- Performance with large numbers of entries per schedule
- Mobile responsiveness of entry-level table display
- Bulk operation undo functionality complexity

## Notes
- Current display shows 3 schedules with valid data, 2 filtered out due to empty tasks
- Print view shows all schedules (no filtering applied)
- Migration creates entries for schedules with valid start/end times
- Empty tasks schedules are preserved but filtered from display until US-002 entry-level view is implemented
## US-003: Housekeeping Schedule Management for Rick (New Use Case)

### Overview
Rick is the housekeeping and maintenance manager with low tech-savvy who prefers writing things down. He manages weekly cleaning schedules for over 130 units across 5+ housekeepers, with units split evenly and cleaned once per week at different predetermined times. The system should provide simple options: set housekeepers, enter predetermined schedules easily, pull individual schedules for printing, and edit quickly with dropdowns.

### User Profile
- **Role**: Housekeeping Manager
- **Tech Savvy**: Low (minimal computer use, prefers paper)
- **Needs**: Extremely simple interface, easy data entry for predetermined schedules, individual printable schedules per housekeeper, quick dropdown edits

### Functional Requirements (High-Level)
- **Housekeeper Management**: Simple list to add/remove housekeepers by name. Stored in localStorage.
- **Schedule Entry**: Basic form to create weekly schedule: select week, add entries for each unit with dropdowns for housekeeper and time slot (predefined: Morning, Afternoon, Evening). Support manual entry for predetermined assignments.
- **Individual Schedules**: View/print schedule filtered by housekeeper, showing their units and times for the week.
- **Quick Edits**: In individual or main view, use dropdowns to reassign housekeeper, change time slot, or mark status (Pending/Completed). Auto-save changes.
- **Printing**: Generate clean, printable individual schedules with unit list, times, and checkboxes for completion tracking.

### UI/UX Guidelines
- **Simplicity First**: Minimal steps, large buttons and dropdowns, no complex wizards. Use guided prompts like "Select Housekeeper" then "Add Unit".
- **Dropdown-Heavy**: All assignments and edits via simple dropdowns (housekeeper names, time slots).
- **Print-Friendly**: Simple tables for individual schedules, A4-optimized, with large text and checkboxes; one-click print button.
- **Low-Tech Aids**: High-contrast colors, ARIA labels for screen readers, short tooltips/help text, avoid modals—use inline editing.

### Acceptance Criteria
- As Rick, I want to set up housekeepers simply so I can start scheduling quickly.
  - AC: Add/edit housekeepers with name input and save button; list shows all; persists on reload.
- As Rick, I want to enter predetermined schedules easily so I don't have to retype from paper.
  - AC: Form with dropdowns for unit, housekeeper, time; add multiple entries; save creates schedule for week; handles 130+ units without lag.
- As Rick, I want individual printable schedules so I can distribute to housekeepers weekly.
  - AC: Select housekeeper → View table with units/times → Print button creates PDF; clean layout, includes week date and checkboxes.
- As Rick, I want quick dropdown edits so I can adjust without hassle.
  - AC: Click entry → Dropdowns for changes → Auto-save with confirmation; <3 clicks per edit; undo via back button or toast.
- Performance: Load/edit 130-unit schedule <2s; print preview instant.
- Usability: Low-tech user completes setup/print in <5 min first time; error rate <5%.

### Testing Considerations (QA Focus)
- **Usability Tests**: Test with low-tech personas (e.g., 50+ age group); measure task time, frustration points, SUS score >75.
- **Performance Tests**: Verify handling of 130+ entries; edit/print speed on mid-range devices.
- **Edge Cases**: 5+ housekeepers, uneven unit counts, duplicate units, empty schedules, mobile printing, accessibility (WCAG AA compliance).
- **Integration**: Works with US-002 filtering (housekeepers as assignees); no conflicts with existing schedule data.

### Dependencies
- shadcn/ui Select and Button for dropdowns/edits.
- Existing print-schedule.tsx for enhanced printing.
- Schedule form and table components.

### Risks
- Interface too simple, missing flexibility for other users (mitigate with optional advanced mode).
- Entry speed for 130 units (mitigate with batch add if needed later).
- Print consistency across browsers/devices.
- Low adoption if not intuitive enough (mitigate with user testing).

### Priority
High - Targets practical housekeeping workflow, improves app versatility for non-office scheduling.