# 3. Functional Requirements

## 3.1 Core Features (Brownfield Extensions)

### 3.1.1 Multi-Schedule Dashboard (FR-1, US-001)

- New Dashboard component (`src/components/Dashboard.tsx`) replacing single-view entry.
- List all schedules as responsive cards/grid: Title, category badge, entry count, last updated, quick actions (view/edit/delete).
- Search: Global input for title/description (case-insensitive, debounce 300ms).
- Filters: Dropdowns for category (e.g., 'Morning Shift', 'Client X'), date range; pagination for >20 schedules.
- CRUD Integration: "Create New" loads schedule-form.tsx with pre-filled category; edit pre-loads data.
- Empty State: Illustrated card with "Add Your First Schedule" CTA.
- Implementation: Use shadcn/ui Card, Table for list; extend localStorage to array of Schedules.

**User Stories & Acceptance Criteria** (from Epic BE-001 US-001):
- As an Admin, I want a dashboard to list and manage multiple schedules so I can organize by client or shift.
- AC: Loads 50 schedules <1s; search updates live; delete confirms with toast; mobile stacks as list.

**Cross-reference**: Extends [v1/functional-requirements.md](../v1/functional-requirements.md#data-persistence) multi-schedule management.

### 3.1.2 Enhanced Schedule Viewing and Filtering (FR-2, US-002)

- Extend existing `src/components/schedule-table.tsx`: Add assignee filter dropdown (dynamic from entries or config).
- Bulk Actions: Checkbox selection for rows; apply status changes (Pending/Completed) or delete; "Apply to Selected" button.
- Sort/Filter Persistence: Save user preferences in localStorage per schedule.
- Visuals: Assignee badges in rows; filter chip with count (e.g., "John (3/10 tasks)"); highlight filtered.
- Edge Cases: No assignees filter shows all; bulk max 50 rows; undo last action via toast.

**User Stories & Acceptance Criteria** (US-002):
- As a Team Lead, I want to filter by assignee so I can review workloads.
- AC: Filter re-renders <100ms; bulk updates auto-save; validates no overlaps post-filter.

**Cross-reference**: Builds on [v1/functional-requirements.md](../v1/functional-requirements.md#schedule-viewing-and-editing) table functionality.

### 3.1.3 Multi-Assignee Form Updates (FR-3, US-003)

- Extend `src/components/schedule-form.tsx`: Replace single assignee input with multi-select dropdown (searchable, max 10).
- Predefined Assignees: Configurable list in localStorage (e.g., ["John Doe", "Jane Smith"]); allow add new.
- Validation: Min 1 assignee per entry; unique per time slot; total duration calculation (sum entry durations).
- Dynamic Rows: Add/remove preserves selections; live total footer.
- Save: Update Schedule.entries with assignees array.

**User Stories & Acceptance Criteria** (US-003):
- As an Admin, I want multi-assignee entries for team shifts.
- AC: Multi-select validates emails/names; duration updates on change; form submits only if valid.

**Cross-reference**: Extends [v1/functional-requirements.md](../v1/functional-requirements.md#schedule-creation) form capabilities.

### 3.1.4 Shareable Exports and Views (FR-4, US-004)

- Extend `src/components/print-schedule.tsx`: Add "Share Link" option generating unique URL (`/share/:shareId`) with optional 4-digit PIN.
- Read-Only Share View: New route/component (`ShareView.tsx`); loads Schedule by shareId, validates PIN/expiry (7 days default).
- Export Enhancements: PDF/CSV include category/assignees; iCal for events (basic: per entry as VEVENT).
- Tracking: Increment access count on view; log to console (future analytics).
- Security: Mock hash PIN (localStorage); expired links show "Access Expired".

**User Stories & Acceptance Criteria** (US-004):
- As an Event Coordinator, I want shareable links for distribution.
- AC: Link generates <500ms; read-only prevents edits; PIN mismatches prompt re-entry; offline fallback to JSON download.

**Cross-reference**: Extends [v1/functional-requirements.md](../v1/functional-requirements.md#printing-and-export) export capabilities.


### 3.1.5 Housekeeping Schedule Management (FR-5, US-003)

- Extend existing components for low-tech-savvy housekeeping managers: Simple housekeeper list management (`src/components/HousekeeperList.tsx`), basic schedule entry form with dropdowns, individual printable views.
- **Housekeeper Setup**: Add/remove housekeepers via simple form; store as global config in localStorage; integrate with assignee system.
- **Schedule Creation**: Extend `schedule-form.tsx` with simplified mode for housekeeping: Dropdowns for unit ID, housekeeper, time slot (Morning/Afternoon/Evening); manual entry support for predetermined assignments; no complex multi-select.
- **Individual Views**: New filter in dashboard/table for "Housekeeper Schedule" view; shows only entries for selected housekeeper; one-click print with checkboxes.
- **Edits & Validation**: Inline dropdown edits in table; auto-save; basic validation (no duplicate units, required fields); alert for conflicts.
- **Printing Enhancements**: Extend `print-schedule.tsx` for individual housekeeper PDFs: Simple table layout, large text, week header, unit/time/status columns, checkboxes; A4 optimized.

**User Stories & Acceptance Criteria** (US-003):
- As Rick (Housekeeping Manager), I want to set up my housekeepers simply so I can start scheduling without technical hurdles.
  - AC: Add housekeeper (name only) <10s; list persists; integrates with schedule forms as dropdown options.
- As Rick, I want to enter my predetermined weekly schedules easily so I can transfer from paper quickly.
  - AC: Form loads with dropdowns for unit/housekeeper/time; add entry <15s; supports 130+ units; saves as schedule with housekeeping category.
- As Rick, I want to view and print individual housekeeper schedules so I can distribute weekly assignments.
  - AC: Filter by housekeeper → Table shows only their entries → Print generates clean PDF <2s; includes checkboxes, week dates; mobile-friendly.
- As Rick, I want to make quick edits with dropdowns so I can adjust assignments without retyping.
  - AC: Click entry row → Inline dropdowns appear → Change and auto-save; confirmation toast; undo via browser back or button; <3 clicks per edit.

**Cross-reference**: Builds on FR-2 (filtering), FR-3 (assignees), FR-4 (printing); ensures compatibility with existing multi-schedule dashboard.

**Non-Functional Additions**:
- **Simplicity**: All interactions <3 steps; large touch targets (48x48px); guided onboarding for first housekeeping use.
- **Performance**: Handle 130+ entries without lag; print generation <3s on mid-range devices.
- **Accessibility**: WCAG 2.1 AA for dropdowns/forms; high-contrast print option; screen reader announces changes.
## 3.2 User Flows

1. **Multi-Schedule Onboarding**: App load → Dashboard (list or empty state) → Create (form) → Save → Back to dashboard with new card.
2. **Filter & Bulk Edit**: Dashboard → Select schedule → Table loads → Filter assignee → Select rows → Bulk status → Auto-save toast.
3. **Team Assignment**: Create → Form → Multi-select assignees → Add entries → Validate totals → Save.
4. **Sharing**: Table view → Export dropdown → Generate Share → Copy link/PIN → External: Paste link → Enter PIN → Read-only table → Print/Export.
5. **Error Handling**: Invalid share (alert); quota exceed (prompt export all); migration fail (fallback to v1 data).

**Flow Diagram**:
```
Dashboard (List/Search) → Create/Edit (Form w/ Multi-Select) → Table (Filter/Bulk)
                          ↓
                      Share (Generate Link/PIN) → External View (Read-Only + Export)
                          ↓
                      Error → Alert (Retry/Export)
```

**Cross-reference**: Builds on [v1/functional-requirements.md](../v1/functional-requirements.md#user-flows) v1 flows.

## 3.3 Non-Functional Requirements

- **Performance**: Dashboard <1s for 50 schedules; table filter <200ms; share load <2s (extend [v1 NFRs](../v1/functional-requirements.md#non-functional-requirements)).
- **Accessibility**: ARIA for multi-select (roles="listbox"); filter announcements; keyboard bulk select (Shift+click).
- **Security**: Sanitize PINs (no storage plain); share expiry prevents indefinite access; input validation (Zod).
- **Responsive**: Dashboard grid (1 col mobile, 3 desktop); touch multi-select; table horizontal scroll indicator.
- **Reliability**: Auto-migrate v1 data on first load; backup prompt on >80% quota; offline share via data URL.
- **Browser Support**: Same as [v1 NFRs](../v1/functional-requirements.md#non-functional-requirements); test share links cross-browser.
- **Scalability**: Virtualize table for 200+ entries (react-window); modular for future cloud.

**Cross-reference**: See [technical-requirements.md](./technical-requirements.md) for v2-specific implementation and [v1/functional-requirements.md](../v1/functional-requirements.md#non-functional-requirements) for baseline NFRs.