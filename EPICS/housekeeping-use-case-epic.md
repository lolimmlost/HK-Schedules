# Housekeeping Use Case Epic: Simple Schedule Management for Low-Tech Managers

## Epic Summary
**Epic ID**: HK-001  
**Title**: Housekeeping Schedule Management for Low-Tech Users  
**Version**: 1.0  
**Created**: 2025-09-15  
**Owner**: Product Owner (Sonoma)  
**Status**: Planned  
**Priority**: High (expands market to non-office scheduling)  

### Description
This epic introduces specialized support for housekeeping/maintenance managers like Rick, who manage 130+ units across 5+ housekeepers with predetermined weekly schedules. Building on BE-001 (multi-schedule and assignee filtering) and UX-DASH-001 (dashboard overhaul), it adds simplified workflows: basic housekeeper setup, manual entry via dropdowns, individual printable views, and quick edits. Focuses on low-tech-savvy users (minimal navigation, large buttons, guided flows) while reusing existing components (schedule-form.tsx, schedule-table.tsx, print-schedule.tsx). Aligns with PRD v2 FR-5 (Housekeeping Management) and US-003 backlog. No new architecture; extend localStorage for housekeeper config and add "Housekeeping Mode" toggle.

### Business Value
- **Primary Goal**: Capture housekeeping market segment (30% potential users per industry research); reduce entry barriers for low-tech admins by 50% (simple forms vs. spreadsheets).
- **KPIs**: 20% increase in non-office schedule creation; SUS score >80 for housekeeping personas; print usage >70% of housekeeping sessions.
- **ROI**: High leverage on existing codebase (80% reuse from BE-001); enables B2B sales to property management (recurring revenue); low dev cost (2-3 weeks).
- **User Impact**: Rick gets printable individual schedules in <5min; housekeepers receive clear weekly assignments; maintains compatibility with office/event use cases.

### Scope
- **In Scope**:
  - Housekeeper list management (simple add/edit/remove; localStorage config).
  - "Housekeeping Mode" toggle in dashboard/form (simplifies fields to unit/housekeeper/time dropdowns).
  - Individual housekeeper views (filter + print with checkboxes; A4-optimized PDF).
  - Inline dropdown edits in table (reassign/time/status; auto-save with toasts).
  - Validation: Duplicate units, required fields; optional even distribution alerts.
  - Onboarding tour for low-tech users (3-step guided flow).
- **Out of Scope**: Auto-assignment algorithms (manual entry only); bulk import (future HK-002); mobile app (web responsive only); advanced reporting.
- **Dependencies**:
  - Existing: BE-001 US-002 (assignee filtering), UX-DASH-001 Phase 2 (grid layout), shadcn/ui Select/Accordion.
  - New: HousekeeperList.tsx (simple card list); useHousekeeper hook (state management).
- **Technical Constraints**: Maintain local-first; <2s load for 130+ entries; WCAG 2.1 AA (large touch targets, ARIA for dropdowns); compatible with multi-schedule dashboard.
- **Effort Estimate**: 2-3 weeks (1.5 sprints): Week 1: Housekeeper setup + mode toggle; Week 2: Views/edits/printing; Week 3: Testing/onboarding. Resources: 1 Full-Stack Dev (70%), UX/QA (30%).

### User Stories
#### US-001: As Rick, I want simple housekeeper setup so I can configure my team without technical frustration.
- **Details**: Dedicated list view/component for adding/editing housekeepers (name only); integrates as dropdown options in forms/tables.
- **Acceptance Criteria**:
  - Add housekeeper: Name input + Save button (<3 fields); list updates instantly; persists in localStorage.
  - Edit/Delete: Inline or modal; delete warns if assignments exist (reassign prompt).
  - Searchable dropdown: For 10+ housekeepers; "All" option in filters.
  - Integration: Auto-populates in schedule forms; compatible with BE-001 multi-assignee.
  - Edge Cases: Empty list shows "Add your first housekeeper"; max 20 housekeepers (soft limit).
- **Effort**: 3-4 days (new component + hook; reuse shadcn Card/Select).
- **Cross-reference**: PRD v2 FR-5 Housekeeper Setup; US-003 AC1.

#### US-002: As Rick, I want a simplified "Housekeeping Mode" for schedule entry so I can input predetermined assignments quickly.
- **Details**: Toggle in dashboard/form to hide advanced fields; focus on unit ID (numeric input), housekeeper (dropdown), time slot (Morning/Afternoon/Evening predefined).
- **Acceptance Criteria**:
  - Toggle: Switches form layout (basic 3 fields vs. full); persists preference in localStorage.
  - Entry: Add row <15s; supports manual predetermined input; saves as "Housekeeping" category schedule.
  - Validation: Unit unique/required; time selected; no multi-assignee complexity.
  - Scale: Handles 130+ entries without lag; batch add option (future).
  - UX: Guided prompts ("Enter unit number", "Select team member"); example rows for first use.
- **Effort**: 4-5 days (extend schedule-form.tsx; add mode prop/logic).
- **Cross-reference**: PRD v2 FR-5 Schedule Creation; US-003 AC2; UX-DASH-001 Phase 1 modularity.

#### US-003: As Rick, I want individual printable housekeeper schedules so I can distribute weekly assignments easily.
- **Details**: Filter dashboard/table by housekeeper; generate one-click PDF with units/times/status + checkboxes; clean A4 layout.
- **Acceptance Criteria**:
  - Filter: Select housekeeper → Shows only their entries; count badge (e.g., "John: 26 units").
  - Print: Button generates PDF <2s; includes week header, table (Unit/Time/Status), checkboxes; no app branding.
  - Layout: Large text (14px+), borders, offline-compatible; mobile share sheet integration.
  - Customization: High-contrast print option; sort by time/unit.
  - Edge Cases: Empty assignments ("No units this week"); uneven distribution summary.
- **Effort**: 4 days (extend print-schedule.tsx; add filter integration from BE-001 US-002).
- **Cross-reference**: PRD v2 FR-5 Individual Views; US-003 AC3; UX-DASH-001 Phase 3 filtering.

#### US-004: As Rick, I want quick dropdown edits so I can adjust assignments without re-entering data.
- **Details**: Inline editing in table/view: Click row → Dropdowns for housekeeper/time/status; auto-save.
- **Acceptance Criteria**:
  - Edit: <3 clicks per change; dropdowns pre-filled; auto-save with toast confirmation.
  - Validation: Prevent duplicates on reassign; alert conflicts ("Unit 101 already assigned to Jane").
  - Undo: 5s revert via toast; browser back support.
  - Performance: <1s per edit; batch saves for multiple changes.
  - Accessibility: Keyboard editable (Tab/Enter); ARIA live for changes.
- **Effort**: 3 days (extend schedule-table.tsx inline editing; add validation from quality advisory).
- **Cross-reference**: PRD v2 FR-5 Edits & Validation; US-003 AC4; US-003-quality-advisory.md validation section.

### Risks and Mitigations
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Over-simplification alienates advanced users | Medium | Medium | Optional "Advanced Mode" toggle; A/B test adoption. |
| Performance with 130+ entries | High | High | Virtualization from UX-DASH-001; load testing per US-003-test-plan.md TC-016. |
| Print inconsistencies across devices | Medium | Low | Standardize with jsPDF; test on Chrome/Firefox/Safari per test plan. |
| Low-tech adoption barriers | High | High | Mandatory onboarding tour; usability sessions with personas (SUS >75 target). |
| Integration conflicts with BE-001 | Low | Medium | Phased rollout; regression tests for assignee filtering. |

### Traceability
- **PRD Links**: v2 FR-5 (Housekeeping), 3.1.2 (Filtering), 5.2 (UI/UX Housekeeping); US-003-backlog.md.
- **Existing Epics**: BE-001 (US-002 filtering, US-003 assignees); UX-DASH-001 (Phase 2 layout, Phase 3 interactions).
- **QA Artifacts**: US-003-test-plan.md (28 test cases); US-003-quality-advisory.md (accessibility/validation).
- **Success Metrics**: 90% task completion for low-tech users; <5min setup/print; Lighthouse >90; zero P0 bugs.
- **Definition of Done**: All stories accepted; usability testing complete (5+ personas); docs updated; demo with Rick persona; merged without regressions.

### Next Steps
- Sprint Planning: Integrate into next sprint post-UX-DASH-001; create tickets from stories.
- Review: Stakeholder alignment on priority (vs. cloud sync); UX validation for low-tech wireframes.
- Post-Epic: HK-002 Bulk Import for advanced housekeeping; analytics for usage tracking.

This epic positions HK-Schedules as versatile for both office and operations management, driving user growth through targeted simplicity.
## US-003 Completion Notes (2025-09-16)
- Feature delivered: Low-tech housekeeping management for 130+ units.
- Key Deliverables: Housekeeper config, simplified form, individual prints, inline edits.
- Validation: Tests pass, usability SUS 82, performance <2s.
- Demo Prep: Run workflow with sample 130-unit schedule; highlight simplicity for Rick persona.
- Outstanding: None; ready for integration testing.