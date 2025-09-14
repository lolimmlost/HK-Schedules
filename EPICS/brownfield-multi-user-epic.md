# Brownfield Epic: Multi-Schedule Management and Team Collaboration Enhancement

## Epic Summary
**Epic ID**: BE-001  
**Title**: Multi-Schedule Management and Team Collaboration Enhancement  
**Version**: 1.0  
**Created**: 2025-09-14  
**Owner**: Product Manager (Sonoma)  
**Status**: Planned  
**Priority**: High  

### Description
This brownfield epic extends the existing HK-Schedules housekeeper management application to support multiple schedules, improved team assignment filtering, and shareable exports. Building on the current single-schedule focus (as per README.md), it enables admins and team leads to manage separate schedules for different shifts, clients, or locations while leveraging existing components like `schedule-form.tsx`, `schedule-table.tsx`, and `print-schedule.tsx`. The enhancements align with PRD sections 3.1.4 (Data Persistence) and 3.1.3 (Printing and Export), introducing multi-schedule CRUD, assignee-based filtering, and basic sharing via export links. No major architectural changes; use localStorage for persistence and extend Zustand for state if needed (future-proof for cloud sync).

### Business Value
- **Primary Goal**: Reduce planning time by 30% for multi-location/team admins by enabling quick switching between schedules and assignee-specific views (targets Admin persona in PRD 1.2).
- **KPIs**: Increase feature usage (multi-schedule creation > 40%); improve NPS by addressing version conflicts in shared docs (PRD 2).
- **ROI**: Low-risk brownfield integration (reuse 70% existing code); enables premium features like shared links for monetization (PRD 1.3).
- **User Impact**: Housekeepers (Team Member persona) get filtered views of their assignments; event coordinators (primary users) manage complex schedules without spreadsheets.

### Scope
- **In Scope**:
  - Dashboard for listing/managing multiple schedules (search, filter by date/category).
  - Enhanced table with assignee filtering and bulk actions.
  - Form updates for schedule metadata (e.g., category for grouping).
  - Shareable exports (CSV/PDF with unique links; mock auth for access).
  - LocalStorage migration to support array of schedules (add ID/versioning per PRD 4.2).
- **Out of Scope**: Full user authentication (mock with local IDs); real-time collaboration; cloud sync (phase 2); advanced analytics.
- **Dependencies**:
  - Existing: `src/components/schedule-form.tsx`, `src/components/schedule-table.tsx`, `src/components/print-schedule.tsx`, localStorage hooks.
  - New: Zustand for global store (`src/lib/store.ts`); react-router for dashboard routing; uuid for IDs.
- **Technical Constraints**: Maintain local-first architecture; ensure <2s load for 100+ entries (PRD 3.3); WCAG AA compliance.
- **Effort Estimate**: 4-6 weeks (2 sprints): Week 1-2: Multi-schedule CRUD; Week 3: Filtering/UI; Week 4: Exports/testing. Resources: 1 Full-Stack Dev (80%), QA (20%).

### User Stories
#### US-001: As an Admin, I want a dashboard to list and manage multiple schedules so I can organize by client or shift.
- **Details**: Replace single-schedule view with a card/grid list of saved schedules; include search by title, filter by category/date, and actions (view/edit/delete/archive).
- **Acceptance Criteria**:
  - Dashboard loads all schedules from localStorage on app init; empty state shows "Create First Schedule" with form link.
  - Search matches title/description case-insensitively; filters update in <500ms.
  - CRUD: Create redirects to form pre-filled with metadata; edit loads current schedule; delete confirms with undo toast (using `src/components/ui/alert.tsx`).
  - Responsive: Grid on desktop (3 cols), list on mobile; persists filters in localStorage.
  - Edge Cases: Handle 50+ schedules with pagination; quota warning if >5MB.
- **Effort**: 1 sprint (leverage existing form/table; add `Dashboard.tsx`).

#### US-002: As a Team Lead, I want to filter the schedule table by assignee so I can review individual housekeeper workloads.
- **Details**: Extend existing `schedule-table.tsx` with dropdown filter for assignees (from predefined list or dynamic from entries); include bulk status updates for selected rows.
- **Acceptance Criteria**:
  - Filter dropdown populates from unique assignees in current schedule; "All" option shows full table.
  - Filtering re-renders table instantly (<100ms); preserves sort/pagination state.
  - Bulk actions: Select rows via checkboxes; update status (Pending/Completed) or delete with confirmation; auto-save changes.
  - Visual: Badge count in filter (e.g., "John Doe (5 tasks)"); highlight filtered rows.
  - Integration: Works with existing inline editing; validates no overlapping assignee times.
- **Effort**: 1 week (build on shadcn/ui table; add Zustand slice for filters).

#### US-003: As an Admin, I want to assign multiple housekeepers to schedule entries so teams can handle complex shifts.
- **Details**: Update `schedule-form.tsx` to support multi-select assignee field (dropdown with search); calculate total duration across entries.
- **Acceptance Criteria**:
  - Form adds multi-select input (using shadcn/ui or react-select); predefined assignees from local config (e.g., ["John Doe", "Jane Smith"]).
  - Validation: At least one assignee per entry; no duplicates; email format if using emails.
  - Dynamic entries: Add/remove rows preserves assignee selections; total duration footer updates live.
  - Save: Serializes assignees as array in ScheduleEntry (per PRD 4.2 interface).
  - UX: Pre-populate from previous schedules; character limits enforced (tasks max 500 chars per README).
- **Effort**: 1 week (extend react-hook-form; update data model minimally).

#### US-004: As an Event Coordinator, I want shareable export links for schedules so I can distribute to team without full app access.
- **Details**: Enhance `print-schedule.tsx` and CSV export to generate unique share links (local UUID); include password mock or expiration for basic security.
- **Acceptance Criteria**:
  - Export button dropdown: PDF/CSV/iCal; "Share Link" generates URL like `/view/:id` with optional PIN (stored in localStorage).
  - Shared view: Read-only table (no edits); auto-loads schedule by ID; expires after 7 days or PIN mismatch.
  - Formats: PDF preserves styling (jsPDF); CSV includes assignees/categories; iCal for calendar import (future PRD 3.1.3).
  - Tracking: Log shares in console (for analytics); download count badge.
  - Edge Cases: Invalid ID shows 404; offline shares prompt save-as-JSON.
- **Effort**: 1-2 weeks (extend existing exports; add simple router guard).

### Risks and Mitigations
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| localStorage quota exceeded with multi-schedules | Medium | High | Migrate to IndexedDB; add export prompt on save (PRD 3.1.4). |
| Assignee data inconsistencies in exports | Low | Medium | Zod validation on serialize (PRD 4.2); unit tests for formats. |
| UI performance with 100+ entries | Medium | Medium | Virtualize table (react-window); profile with React DevTools. |
| Sharing security (no auth) | High | Low | Mock PIN; document as v1 limitation; plan auth in next epic. |

### Traceability
- **PRD Links**: 3.1.1 (Form enhancements), 3.1.2 (Table features), 3.1.4 (Persistence), 4.2 (Data Model - extend Schedule interface with category).
- **Existing Codebase**: Builds on README features (CSV import/export, print view); no breaking changes to core components.
- **Success Metrics**: 80% user adoption for multi-schedule; <1% error rate on exports (PRD 1.4).
- **Definition of Done**: All stories accepted; E2E tests pass (Cypress); demo with 3 personas; deploy to Vercel staging.

### Next Steps
- Sprint Planning: Break into tickets; assign to Full-Stack Dev.
- Review: Architect validation for data model changes.
- Post-Epic: v1.1 Cloud Sync integration.

This epic maintains brownfield principles: incremental enhancements, 80% reuse of existing code, alignment with PRD roadmap.