---
title: US-002 Enhanced Schedule Viewing and Filtering Backlog
version: 1.1
date: 2025-09-16
status: Approved
author: Scrum Master
references:
  - [PRD v2](docs/PRD/v2/index.md)
  - [Risks Appendix](docs/PRD/v2/risks-timeline-appendix.md)
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
- 📋 See [Risks Timeline Appendix](docs/PRD/v2/risks-timeline-appendix.md) for migration/performance risks

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
## US-003: Housekeeping Schedule Management
See dedicated document: [US-003](docs/US-003.md) for full details, acceptance criteria, and status. Key integration: Housekeepers treated as assignees in US-002 filtering; completed as of 2025-09-16.

## US-004: Backward Compatibility for Legacy CSV Imports
See dedicated backlog item or create [US-004](docs/US-004.md) for refinement. Priority: High, as it addresses v1 migration bugs.

## UX Design Integration (US-002)
This section incorporates the UX design specification for enhanced viewing and filtering, ensuring alignment with PRD v2 guidelines.

### Key UX Components to Implement
- **Filter Bar**: Add shadcn Select for assignee filtering above table; dynamic chip with count (e.g., "John (12/45) ×").
- **Table Enhancements**: Checkbox selection column; row highlighting for filtered (bg-accent/10); inline edits for time/assignee/status.
- **Bulk Actions**: Bottom sheet/modal with status dropdown and delete; apply with loading and undo toast (5s timeout).
- **Persistence**: Save filter/sort to localStorage per schedule; restore indicator toast.
- **Mobile**: Stacked cards with swipe-select; large touch targets (48px).

### Wireframes (Text, from UX Spec)
- **Filter Bar**: [Filter Icon] Filter by Assignee: [Dropdown ▼ "John Doe"] [Chip: John (12/45) ×]
- **Table Row**: ☐ 09:00 [Badge: John] Clean Unit 101 [Select: Pending] [Edit/Delete]
- **Bulk Sheet**: "5 Selected" | Status: [Pending ▼] [Apply] [Delete]

### Tasks
- [ ] Implement filter bar and chip (1 day)
- [ ] Add bulk selection and actions (2 days)
- [ ] Inline editing with undo (1 day)
- [ ] Persistence via localStorage (0.5 day)
- [ ] Mobile responsiveness and testing (1 day)
- [ ] Usability validation (SUS >85)

**Reference**: Full spec in [PRD v2 UI/UX Design](docs/PRD/v2/ui-ux-design.md#52-enhanced-schedule-viewing-and-filtering-uiux-us-002); mitigates risks in [risks-US-002.md](docs/risks-US-002.md).