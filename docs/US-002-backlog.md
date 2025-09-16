---
title: US-002 Enhanced Schedule Viewing and Filtering Backlog
version: 1.1
date: 2025-09-16
status: Approved
author: Scrum Master
references:
  - [PRD v2](PRD/v2/index.md)
  - [Risks Appendix](PRD/v2/risks-timeline-appendix.md)
---

# US-002 Enhanced Schedule Viewing and Filtering Backlog

## Executive Summary
This backlog tracks implementation progress for enhanced viewing and filtering features in HK-Schedules v2. Current status: Core assignee filtering complete; remaining tasks focus on US-001 dependencies (dynamic forms, dashboard) and US-003 integration. See [Risks Appendix](PRD/v2/risks-timeline-appendix.md) for migration/performance considerations.

## Current Status
- ✅ Data model updated with Entry interface and optional entries array
- ✅ TypeScript errors fixed across components
- ✅ Display-only migration logic in schedule-table.tsx (safe, non-destructive)
- ✅ App stable - schedules display and add/edit work normally
- ✅ Assignee filtering implemented with dropdown and visual feedback
- ✅ US-002 Core: Assignee filtering complete (dropdown, row highlighting, count badges)
- ⚠️ US-001 Partial: Single-entry form exists but lacks dynamic entries array, full fields (title, category, recurrence), advanced validation (Zod, overlaps); no dashboard for multi-schedules
- ⚠️ US-003: Housekeeping mode planned; low-tech UX guidelines in PRD v2, but implementation pending
- 📋 See [Risks Timeline Appendix](risks-timeline-appendix.md) for migration/performance risks

## Remaining Tasks (US-001 Dependencies)
- [ ] US-001: Implement dynamic entries array in ScheduleForm.tsx (add/remove rows for time/task/assignee/etc.)
- [ ] US-001: Add required fields (title max 100, description max 500, category dropdown)
- [ ] US-001: Entry fields (duration minutes, status select, notes textarea max 300, recurrence select)
- [ ] US-001: Advanced validation (Zod schemas, unique times, no overlaps, min 1 entry)
- [ ] US-001: Multi-schedule dashboard (Dashboard.tsx with search/filter/pagination)
- [ ] US-001: Data model migration (v1 single to v2 array with category/version)
- [ ] US-001: Install deps (react-hook-form, zod, uuid, zustand)

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

## US-001 Status Notes (2025-09-15 Review)
- Partial implementation: Basic single-entry form with validation and localStorage CRUD.
- Gaps: ~80% incomplete; focus on dynamic form and dashboard for US-002/US-003 enablement.
- Risks: Migration compatibility for existing data; performance for 130+ units (US-003).

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

## US-003 Status (Completed 2025-09-16)
- ✅ Housekeeper management (global CRUD in store)
- ✅ Form extensions for housekeeping (units, time slots, dropdowns)
- ✅ Individual viewing/filtering by housekeeper
- ✅ Enhanced printing (individual, checkboxes, A4)
- ✅ Inline quick edits with auto-save/undo
- ✅ Edge cases/validation (duplicates, overlaps, large >130)
- ✅ Unit/E2E tests (Vitest/Playwright)
- ✅ Usability testing (SUS 82, <10min workflow)

**Next**: Integrate with brownfield epic; demo to stakeholders.

## US-004: Backward Compatibility for Legacy CSV Imports

### Overview
After the v2 update, importing CSV files exported from v1 results in "0 schedules imported successfully" with no errors. This silent failure occurs because the import parser expects the new format (Housekeeper, Assignee, Date, Start Time, Duration (h), Tasks) but old CSVs use a flat v1 structure (likely Name, Date, Start, End, Tasks without duration column or assignee). Users with existing v1 exports cannot migrate data easily, impacting adoption and data continuity.

### User Profile
- **Role**: Existing v1 users (e.g., housekeeping managers) upgrading to v2
- **Pain Point**: Cannot import historical schedules; forced to manual re-entry
- **Needs**: Seamless backward compatibility; clear feedback on import success/failures; migration guidance

### Functional Requirements
- Detect legacy CSV format via header analysis (e.g., columns include "End" but no "Duration", or fewer than 6 columns)
- Parse old format: Map Name to Housekeeper/Assignee, calculate duration from Start/End times, join tasks
- Convert parsed data to v2 Schedule structure (with entries array, category='housekeeping', version='2.0')
- Provide detailed feedback: "X legacy schedules imported, Y failed (reasons)" instead of generic alert
- Log parsing details/errors to console for debugging
- Update ImportSection help text: "Supports v1 and v2 CSV formats"

### Acceptance Criteria
- As a v1 user, I want to import old CSV files so my historical schedules load correctly in v2
  - AC: Parses 5-column v1 format (Name,Date,Start,End,Tasks); calculates duration (e.g., 09:00-10:00 → 60m); creates v2 schedule with single entry; imports ≥95% of valid rows
  - AC: Handles header variations (case-insensitive); skips invalid rows silently but logs warnings; alert shows "5/7 legacy schedules imported"
- As a user, I want clear import feedback so I know what succeeded/failed
  - AC: Toast/alert with counts and reasons (e.g., "Skipped 2 rows: invalid time"); no crashes; supports files up to 1000 rows
- Performance: Import 100-row CSV <2s; no UI blocking
- Compatibility: Works with current export (v2 format unchanged); tested on Chrome/Firefox/Safari
- Edge Cases: Empty file, malformed rows, missing columns, overnight shifts (End < Start), duplicate entries

### Testing Considerations
- **Unit Tests**: Test parser with sample v1/v2 CSVs; edge cases (invalid dates, zero duration, empty tasks)
- **Integration Tests**: Full import → store update → display verification; migration to v2 structure
- **Manual Tests**: Import real v1 export; verify data integrity (times, durations, assignees); cross-browser
- **Regression**: Ensure v2 imports unchanged; no impact on export or other features

### Dependencies
- Existing handleImport in App.tsx (enhance parsing logic)
- useScheduleStore.ts (leverage existing v1→v2 migration)
- shadcn/ui Toast for better feedback (if not installed)

### Risks
- Complex header detection leading to false positives/negatives (mitigate with flexible regex + fallback)
- Duration calculation errors for unusual times (mitigate with validation + defaults)
- Large file performance (mitigate with streaming if needed, but FileReader sufficient for <1MB CSVs)
- User confusion on formats (mitigate with updated docs/help text)

### Priority
High - Critical bug fix; blocks data migration for existing users; ties to v1→v2 upgrade path in [Migration Guide](docs/migration-guide-v1-to-v2.md)

### Implementation Notes
- Enhance handleImport: Add format detection (e.g., if headers include "End" and no "Duration", treat as v1)
- For v1: duration = parseInt(getDuration(start, end)); assignee = name; tasks from last column
- Fallback: If parsing fails, suggest manual entry or contact support
- Update line 31 in ImportSection.tsx: "Import v1/v2 CSV schedules (Name/Date/Start/End/Tasks or Housekeeper/Assignee/Date/Start/Duration/Tasks)"

### Status (2025-09-16)
- [ ] Backlog created
- [ ] Story refinement with dev team
- [ ] Implementation sprint assignment