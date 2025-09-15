# US-003 Housekeeping Schedule Management Test Plan

## Overview
This test plan covers the new housekeeping use case for Rick, focusing on simplicity, reliability, and scalability for low-tech-savvy users managing 130+ units across 5+ housekeepers. Tests validate functional requirements from [PRD v2 FR-5](PRD/v2/functional-requirements.md#315-housekeeping-schedule-management-fr-5-us-003), UI/UX guidelines from [UI/UX v2 5.2](PRD/v2/ui-ux-design.md#52-housekeeping-specific-uiux-us-003-extensions), and acceptance criteria from [US-002-backlog.md US-003 section](US-002-backlog.md#us-003-housekeeping-schedule-management-for-rick-new-use-case).

**Test Scope**: Unit/integration tests for components; usability testing with personas; performance benchmarks; edge case validation; accessibility audits.
**Out of Scope**: Full end-to-end automation (manual for usability); security testing (localStorage only); cross-browser beyond Chrome/Firefox/Safari.

## Test Strategy
- **Environments**: Local development (Chrome 120+, Firefox 115+, Safari 17+); mid-range devices (iPhone 12, Android Pixel 5 equivalent).
- **Data Setup**: Test data includes 130 units, 6 housekeepers (John, Jane, Mike, Sarah, Tom, Lisa); sample weekly schedule with even distribution (e.g., 22 units each).
- **Tools**: Jest/Vitest for unit tests; Cypress/Playwright for E2E; Lighthouse for accessibility/performance; SUS questionnaire for usability.
- **Entry/Exit Criteria**: 90% test coverage; all AC pass; SUS >75; no critical bugs (P0/P1); performance <2s for key actions.
- **Risk-Based Prioritization**: High risk areas (large datasets, low-tech usability) tested first; manual exploratory testing for intuitive flows.

## Test Cases

### 1. Functional Tests (Core Features)

#### 1.1 Housekeeper Management
- **TC-001**: Add new housekeeper
  - Preconditions: Empty housekeeper list
  - Steps: Click "Add Housekeeper" → Enter "John Doe" → Click Save
  - Expected: List shows "John Doe"; persists after reload; available in dropdowns
  - Priority: High | Type: Manual/Automated
- **TC-002**: Edit existing housekeeper
  - Steps: Click edit icon → Change name to "John Smith" → Save
  - Expected: Name updates in list and all schedules; no data loss
- **TC-003**: Delete housekeeper
  - Steps: Select housekeeper with assignments → Confirm delete
  - Expected: Housekeeper removed; assigned units unassigned (alert shown); no crash
- **TC-004**: Bulk add housekeepers (future batch if implemented)
  - Expected: Add 10 housekeepers <30s; searchable list

#### 1.2 Schedule Entry
- **TC-005**: Create basic weekly schedule in housekeeping mode
  - Preconditions: 3 housekeepers added
  - Steps: Toggle "Housekeeping Mode" → Select week → Add entry: Unit 101, John, Morning → Save
  - Expected: Schedule created with category "Housekeeping"; entry visible in table
- **TC-006**: Add multiple entries (scale test)
  - Steps: Add 50 entries with varying units/housekeepers/times
  - Expected: No lag (>500ms); saves correctly; no duplicates
- **TC-007**: Validation - Duplicate unit
  - Steps: Add Unit 101 twice
  - Expected: Error message "Unit already assigned"; prevents save

#### 1.3 Individual Schedules & Filtering
- **TC-008**: Filter by housekeeper
  - Steps: In dashboard/table → Select "John's Schedule"
  - Expected: Shows only John's entries; count badge (e.g., "26 units"); hides others
- **TC-009**: Generate printable view
  - Steps: Filter to John → Click "Print This Schedule"
  - Expected: Opens print preview; clean layout with header, table, checkboxes; A4 formatted

#### 1.4 Quick Edits
- **TC-010**: Inline edit via dropdown
  - Steps: In table → Click entry row → Change housekeeper to Jane → Auto-save
  - Expected: Dropdown appears; change applies <1s; toast "Updated"; original entry updated
- **TC-011**: Edit status
  - Steps: Change status to Completed
  - Expected: Status updates; visual change (e.g., green badge); persists
- **TC-012**: Undo edit
  - Steps: Edit → Use back button or undo toast
  - Expected: Reverts change; no data loss

### 2. Usability Tests (Low-Tech Focus)
- **TC-013**: First-time setup workflow (SUS measurement)
  - Preconditions: New user, low-tech persona (e.g., 55-year-old non-tech worker)
  - Steps: Guided tour → Add 3 housekeepers → Enter 5 units → Print one schedule
  - Expected: Completion <5min; no more than 2 errors; SUS score >75; think-aloud feedback on simplicity
  - Type: Manual | Participants: 5 users
- **TC-014**: Mobile usability
  - Steps: On mobile → Full workflow (add/edit/print)
  - Expected: Touch-friendly; no zoom needed for dropdowns; vertical scrolling; print works via share sheet
- **TC-015**: Error recovery
  - Steps: Enter invalid unit (e.g., letters) → See message → Correct
  - Expected: Clear, non-technical error ("Please use numbers for unit ID"); easy fix without restart

### 3. Performance Tests
- **TC-016**: Load large schedule (130 units)
  - Steps: Create/load schedule with 130 entries
  - Expected: Load time <2s; scroll smooth (60fps); no memory leaks
  - Metrics: Chrome DevTools performance profile
- **TC-017**: Edit performance
  - Steps: Edit 20 entries in sequence
  - Expected: Each edit <500ms; cumulative <10s; auto-save doesn't block UI
- **TC-018**: Print generation
  - Steps: Print 130-unit schedule
  - Expected: PDF ready <3s; file size <500KB; renders correctly in preview

### 4. Edge Cases
- **TC-019**: Uneven distribution
  - Steps: Assign 131 units to 5 housekeepers (some get 27, others 26)
  - Expected: Allows save; no forced even split; optional alert "Distribution uneven"
- **TC-020**: Empty schedule
  - Steps: Create schedule with no entries → Filter by housekeeper
  - Expected: Shows "No assignments this week"; print generates empty template
- **TC-021**: Max housekeepers (10+)
  - Steps: Add 12 housekeepers → Create schedule
  - Expected: Dropdown searchable; no overflow; performance stable
- **TC-022**: Conflict resolution
  - Steps: Reassign unit already in another schedule
  - Expected: Alert "Unit in use—reassign from original?"; option to move or cancel

### 5. Accessibility Tests
- **TC-023**: Screen reader compatibility
  - Steps: Use NVDA/VoiceOver → Navigate form/table/dropdowns
  - Expected: All elements announced (e.g., "Housekeeper dropdown, 3 options"); live updates read ("Entry saved")
  - Tools: WAVE, axe-core; Target: WCAG 2.1 AA
- **TC-024**: Keyboard navigation
  - Steps: Tab through all elements; Enter/Esc actions
  - Expected: Full navigation; focus visible (outline); no keyboard traps
- **TC-025**: High-contrast mode
  - Steps: Enable OS high-contrast → Verify UI
  - Expected: Text readable (4.5:1 ratio); buttons distinguishable; print option available

### 6. Integration Tests
- **TC-026**: Compatibility with US-002 filtering
  - Steps: Create housekeeping schedule → Use assignee filter
  - Expected: Housekeepers appear in dropdown; filters work identically
- **TC-027**: Persistence across sessions
  - Steps: Create/edit schedule → Reload page → Reopen
  - Expected: All data intact; housekeeper list persists; edits saved
- **TC-028**: Print integration
  - Steps: Print individual vs. full schedule
  - Expected: Uses enhanced print-schedule.tsx; housekeeping mode optimizes layout

## Test Data
- **Sample Housekeepers**: John Doe, Jane Smith, Mike Johnson, Sarah Lee, Tom Brown, Lisa Garcia
- **Sample Units**: 101-130 (rooms), times: Morning (9-12), Afternoon (1-4), Evening (5-8)
- **Test Schedules**: Week1-Housekeeping (130 entries, even split), Week2-Partial (50 units, uneven), Empty-Week

## Reporting & Metrics
- **Bug Severity**: P0 (crash), P1 (blocks AC), P2 (usability), P3 (minor)
- **Coverage Goals**: 85% unit tests; 100% AC coverage; Lighthouse score >90 (accessibility/performance)
- **Success Metrics**: 95% test pass rate; usability tasks 90% success; performance benchmarks met
- **Defect Tracking**: Log in issues.md or GitHub; prioritize by risk (large data + low-tech impact highest)

## Next Steps
- Implement test cases in src/lib/__tests__/
- Conduct usability sessions with target personas
- Performance optimization based on benchmarks
- Accessibility audit before release
- Update test plan based on implementation feedback