# US-001 Test Plan: Multi-Schedule Dashboard

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Draft (Post-Implementation)  
**Author**: Test Architect & Quality Advisor  
**References**: 
- [PRD v2 Functional Requirements](docs/PRD/v2/functional-requirements.md)  
- [US-001 Review](docs/US-001-review.md)  
- [Technical Specification v2](docs/technical-specification-v2.md)  

## Executive Summary
This test plan validates US-001 (Multi-Schedule Dashboard) implementation, ensuring 100% AC coverage from PRD v2 FR-1. Focus: Dashboard rendering (empty/full), search/filtering (debounce/category/date), CRUD actions (view/edit/delete), empty state CTA, migration compatibility (v1→v2 UI). Post-refactor coverage for sub-components (ScheduleCard, DashboardControls, DashboardHeader). Target: 90%+ coverage; zero P0/P1 defects; Lighthouse >90 (performance/accessibility). Risks: Filter performance (>50 schedules), mobile responsiveness, integration with store/migration. Total TCs: 20 (8 unit, 6 integration, 4 E2E, 2 non-functional).

**Test Strategy**:
- **Unit**: Vitest for components/store (95%+ coverage; mock store for dashboard).
- **Integration**: Test store-dashboard interactions (filtering/CRUD updates).
- **E2E**: Playwright for workflows (render/search/action flows; mobile/desktop).
- **Non-Functional**: Lighthouse for performance (>90 score, FCP <2s, TTI <3s), axe-core for accessibility (0 violations, WCAG 2.1 AA), manual compatibility testing (browsers/v1 data).
- **Tools**: Vitest (unit), Playwright (E2E), React Testing Library (components), Lighthouse CI, axe-core.
- **Environment**: Chrome/Edge/Safari/Firefox (desktop), iPhone/Android (mobile); localStorage mocked for migration.
- **Exit Criteria**: All TCs pass; coverage >90%; Lighthouse >90; axe 0 violations; no regressions in housekeeping.spec.ts; QA sign-off.

**Risks & Mitigations**: 
| Risk | Probability | Impact | Mitigation |  
|------|-------------|--------|------------|  
| Filter lag (>50 schedules) | Medium | High | Load tests with 100 mocks; optimize useMemo. |  
| Mobile grid breakage | High | Medium | Device emulation in Playwright; Tailwind audit. |  
| Migration UI inconsistencies | Low | High | E2E with v1 data; fallback rendering. |  
| Sub-component isolation | Medium | Low | Unit tests per component; snapshot regression. |  

## Test Scope
- **In Scope**: Dashboard features (rendering, search, filters, actions, empty state); sub-components; store integration (getSchedules, CRUD); v1 migration UI.  
- **Out of Scope**: US-003 housekeeping specifics (covered in separate plan); cloud sync; advanced analytics.  

## Detailed Test Cases

### 1. Unit Tests (Vitest + React Testing Library) - Target: 8 TCs, 85% Coverage
1. **TC-001: Dashboard renders empty state**  
   - Setup: Mock empty store.  
   - Action: Render Dashboard.  
   - Expected: Calendar icon, "No Schedules Yet" heading, "Create First Schedule" button visible; onClick calls onAddSchedule.  
   - Priority: High.  

2. **TC-002: Dashboard renders full state with schedules**  
   - Setup: Mock store with 3 schedules.  
   - Action: Render Dashboard.  
   - Expected: Header with count "3 of 3", grid with ScheduleCards (title, badge, entry count, actions).  
   - Priority: High.  

3. **TC-003: ScheduleCard renders and handles actions**  
   - Setup: Mock single Schedule prop.  
   - Action: Render ScheduleCard; click Eye/Edit/Trash.  
   - Expected: Card displays title/badge/description/entries/date; onView/onEdit/onDelete called with correct props.  
   - Priority: High.  

4. **TC-004: DashboardControls handles search debouncing**  
   - Setup: Mock onSearchChange.  
   - Action: Type in search input.  
   - Expected: onSearchChange called after 300ms; value updates in input.  
   - Priority: Medium.  

5. **TC-005: DashboardControls category/date filters**  
   - Setup: Mock schedules/categories; onCategoryChange/onDateChange.  
   - Action: Select category/date.  
   - Expected: SelectValue updates; callbacks called with value; dropdown shows all options.  
   - Priority: Medium.  

6. **TC-006: DashboardHeader export and add actions**  
   - Setup: Mock schedules; onAddSchedule.  
   - Action: Click Export CSV/Add New.  
   - Expected: exportToCSV called with schedules; onAddSchedule called; count displays correctly.  
   - Priority: Medium.  

7. **TC-007: useScheduleStore getSchedules returns copy**  
   - Setup: Add schedules to store.  
   - Action: Call getSchedules.  
   - Expected: Returns array copy (mutations don't affect store).  
   - Priority: High (existing coverage).  

8. **TC-008: useScheduleStore CRUD validation**  
   - Setup: Invalid schedule (duplicates/overlaps).  
   - Action: addSchedule/updateSchedule.  
   - Expected: Throws error for invalid; succeeds for valid; Zod validation logs errors.  
   - Priority: High (existing coverage).  

### 2. Integration Tests - Target: 6 TCs
9. **TC-009: Dashboard filtering integrates with store**  
   - Setup: Mock store with mixed schedules.  
   - Action: Render Dashboard; apply category/date filter.  
   - Expected: filteredSchedules updates correctly; grid shows matching only; count in header reflects.  
   - Priority: High.  

10. **TC-010: Dashboard CRUD updates store**  
    - Setup: Render Dashboard with store.  
    - Action: Click Edit/Delete on ScheduleCard.  
    - Expected: Store updateSchedule/deleteSchedule called; UI re-renders with changes.  
    - Priority: High.  

11. **TC-011: Search debouncing filters store data**  
    - Setup: Store with 10 schedules.  
    - Action: Type partial title in search.  
    - Expected: After debounce, filteredSchedules shows matches; no matches → empty grid.  
    - Priority: Medium.  

12. **TC-012: Empty state to full via add**  
    - Setup: Empty store.  
    - Action: Click CTA → mock form add → re-render Dashboard.  
    - Expected: Transitions from empty state to full grid with new schedule.  
    - Priority: Medium.  

13. **TC-013: Export CSV from dashboard**  
    - Setup: Store with schedules.  
    - Action: Click Export in header.  
    - Expected: useCSVExport called; download triggers (mock blob).  
    - Priority: Low.  

14. **TC-014: Migration compatibility in dashboard**  
    - Setup: Mock v1 migrated data in store.  
    - Action: Render Dashboard.  
    - Expected: Migrated schedules render as v2 (title from name, single entry); no errors.  
    - Priority: Medium.  

### 3. E2E Tests (Playwright) - Target: 4 TCs
15. **TC-015: Dashboard workflow (empty to full)**  
    - Setup: Fresh localStorage.  
    - Action: Load app → click Add → fill form → save → verify grid.  
    - Expected: Empty state → full grid; search finds new schedule.  
    - Priority: High.  

16. **TC-016: Search and filter interactions**  
    - Setup: Pre-populate 5 schedules.  
    - Action: Search title; select category; date "This Week".  
    - Expected: Results update live; chips show active filters; clear resets.  
    - Priority: High.  

17. **TC-017: CRUD actions end-to-end**  
    - Setup: Dashboard with schedules.  
    - Action: View (opens form), Edit (updates title), Delete (confirms toast).  
    - Expected: Navigation/form pre-fill; updates persist; delete removes from grid.  
    - Priority: High.  

18. **TC-018: Mobile responsiveness**  
    - Setup: iPhone viewport.  
    - Action: Load dashboard; scroll grid; tap actions.  
    - Expected: 1-col grid; touch targets >48px; no overflow/horizontal scroll.  
    - Priority: Medium.  

### 4. Non-Functional Tests - Target: 2 TCs
19. **TC-019: Performance (load/filter 50 schedules)**  
    - Setup: Mock 50 schedules; Lighthouse.  
    - Action: Load dashboard; apply filter.  
    - Expected: FCP <2s; TTI <3s; no JS errors; Lighthouse Performance >90.  
    - Priority: High.  

20. **TC-020: Accessibility (WCAG 2.1 AA)**  
    - Setup: axe-core scan.  
    - Action: Render dashboard; navigate keyboard.  
    - Expected: No violations; ARIA labels for actions/grid; contrast >4.5:1; screen reader announces filters/changes.  
    - Priority: High.  

## Execution Schedule
- **Week 1**: Unit/integration TCs (Dev).  
- **Week 2**: E2E/non-functional (QA); coverage report.  
- **Regression**: Run housekeeping.spec.ts post-refactor; zero breaks.  

## Defect Tracking
- **Severity**: P0 (crash), P1 (feature break), P2 (UX), P3 (minor).  
- **Tools**: GitHub Issues (label: US-001-test); test results in CI.  

**Approval**: [ ] Dev Complete | [ ] QA Sign-off | [ ] Product Review  

This plan addresses identified gaps from traceability (no prior dashboard TCs); ensures refactor maintainability.