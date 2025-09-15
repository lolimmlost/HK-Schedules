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
- [ ] Refactor schedule-table.tsx to show individual entries per schedule (expandable rows or separate tables)
- [ ] For legacy schedules, display single entry from migration
- [ ] Show assignee badges in each entry row
- [ ] Highlight filtered entries with visual styling

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
- [ ] AC: Filter re-renders <100ms; bulk updates auto-save; validates no overlaps post-filter
- [ ] Visuals: Assignee badges in rows; filter chip with count; highlight filtered entries
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