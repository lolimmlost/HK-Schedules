# Brownfield Product Requirements Document (PRD) for HK-Schedules Multi-Schedule Enhancement

## 1. Introduction

### 1.1 Product Overview
This brownfield PRD extends the existing HK-Schedules housekeeper management application (v1.0) to support multi-schedule management, team collaboration features, and shareable exports, as defined in Epic BE-001. The enhancements build on the current React/TypeScript codebase with localStorage persistence, shadcn/ui components, and Tailwind CSS styling. Core functionality remains intact (single-schedule CRUD, CSV import/export, print views per README.md), while adding capabilities for managing multiple schedules (e.g., by shift/client), assignee filtering, and basic sharing. This enables admins to handle complex team workflows without disrupting existing users.

The value proposition evolves from simple housekeeper scheduling to scalable team coordination, reducing manual tracking errors by 40% and supporting premium sharing features for monetization.

### 1.2 Target Audience and Personas
- **Primary Users**: Team leads/admins managing multiple housekeeper shifts (extension of Admin persona in HK-Schedules-PRD.md 1.2).
- **Secondary Users**: Housekeepers accessing filtered views; external stakeholders via share links (new: Share Recipient persona).
- **Updated Personas**:
  - **Admin (Taylor, 42, Operations Lead)**: Now manages 5+ schedules across locations; needs quick filtering by housekeeper and shareable reports for clients.
  - **Team Lead (Alex, 35, Supervisor)**: Creates schedules for different teams; uses bulk actions and exports to distribute weekly plans.
  - **Share Recipient (Client Pat, 50, Facility Manager)**: Receives read-only links to view schedules without app access; focuses on print/export.

### 1.3 Business Goals
- Enable multi-schedule workflows to support 50% more users (from single to team-based).
- Improve collaboration via share links, targeting 25% increase in external sharing.
- Maintain 95% compatibility with existing features; achieve <1s load for multi-views.
- Prepare for v1.1 cloud sync; monetize sharing as premium (e.g., unlimited links).
- Align with HK-Schedules-PRD.md goals: 30% productivity gain, NPS >45.

### 1.4 Success Metrics
- **Adoption**: 60% of admins create >3 schedules; 40% usage of share features.
- **Engagement**: Dashboard sessions >7 minutes; share link open rate >70%.
- **Performance**: Multi-table render <1s (extend PRD 1.4); bundle size increase <10%.
- **Business**: 20% conversion to premium sharing; error rate <0.5% on exports.
- **Technical**: 95% test coverage for new features; migration success 100%.

## 2. Problem Statement
The current v1.0 app (per README.md) excels at single-schedule housekeeper management but limits scalability for teams with multiple shifts/locations:
- **Single-Schedule Limitation**: Users must manually switch apps/files for different clients, causing version conflicts (PRD 2).
- **No Assignee Filtering**: Admins can't quickly view workloads by housekeeper, leading to oversight errors.
- **Limited Sharing**: Exports require full app access; no secure, temporary links for externals.
- **Data Silos**: LocalStorage treats all as one schedule; no categorization or bulk management.

This brownfield enhancement addresses these by extending existing components (e.g., schedule-table.tsx for filters) and storage, enabling seamless multi-management without backend changes.

### 2.1 Competitive Analysis Update
- **Existing Competitors** (PRD 2.1): Still relevant; this adds differentiation via local-first multi-schedule sharing.
- **New**: When I Work (team scheduling) lacks offline/print focus; Google Sheets sharing is insecure for temporaries. HK-Schedules now offers hybrid: local power + simple shares.

## 3. Functional Requirements

### 3.1 Core Features (Brownfield Extensions)
#### 3.1.1 Multi-Schedule Dashboard (FR-1, US-001)
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

#### 3.1.2 Enhanced Schedule Viewing and Filtering (FR-2, US-002)
- Extend existing `src/components/schedule-table.tsx`: Add assignee filter dropdown (dynamic from entries or config).
- Bulk Actions: Checkbox selection for rows; apply status changes (Pending/Completed) or delete; "Apply to Selected" button.
- Sort/Filter Persistence: Save user preferences in localStorage per schedule.
- Visuals: Assignee badges in rows; filter chip with count (e.g., "John (3/10 tasks)"); highlight filtered.
- Edge Cases: No assignees filter shows all; bulk max 50 rows; undo last action via toast.

**User Stories & Acceptance Criteria** (US-002):
- As a Team Lead, I want to filter by assignee so I can review workloads.
- AC: Filter re-renders <100ms; bulk updates auto-save; validates no overlaps post-filter.

#### 3.1.3 Multi-Assignee Form Updates (FR-3, US-003)
- Extend `src/components/schedule-form.tsx`: Replace single assignee input with multi-select dropdown (searchable, max 10).
- Predefined Assignees: Configurable list in localStorage (e.g., ["John Doe", "Jane Smith"]); allow add new.
- Validation: Min 1 assignee per entry; unique per time slot; total duration calculation (sum entry durations).
- Dynamic Rows: Add/remove preserves selections; live total footer.
- Save: Update Schedule.entries with assignees array.

**User Stories & Acceptance Criteria** (US-003):
- As an Admin, I want multi-assignee entries for team shifts.
- AC: Multi-select validates emails/names; duration updates on change; form submits only if valid.

#### 3.1.4 Shareable Exports and Views (FR-4, US-004)
- Extend `src/components/print-schedule.tsx`: Add "Share Link" option generating unique URL (`/share/:shareId`) with optional 4-digit PIN.
- Read-Only Share View: New route/component (`ShareView.tsx`); loads Schedule by shareId, validates PIN/expiry (7 days default).
- Export Enhancements: PDF/CSV include category/assignees; iCal for events (basic: per entry as VEVENT).
- Tracking: Increment access count on view; log to console (future analytics).
- Security: Mock hash PIN (localStorage); expired links show "Access Expired".

**User Stories & Acceptance Criteria** (US-004):
- As an Event Coordinator, I want shareable links for distribution.
- AC: Link generates <500ms; read-only prevents edits; PIN mismatches prompt re-entry; offline fallback to JSON download.

### 3.2 User Flows
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

### 3.3 Non-Functional Requirements
- **Performance**: Dashboard <1s for 50 schedules; table filter <200ms; share load <2s (extend PRD 3.3).
- **Accessibility**: ARIA for multi-select (roles="listbox"); filter announcements; keyboard bulk select (Shift+click).
- **Security**: Sanitize PINs (no storage plain); share expiry prevents indefinite access; input validation (Zod).
- **Responsive**: Dashboard grid (1 col mobile, 3 desktop); touch multi-select; table horizontal scroll indicator.
- **Reliability**: Auto-migrate v1 data on first load; backup prompt on >80% quota; offline share via data URL.
- **Browser Support**: Same as PRD 3.3; test share links cross-browser.
- **Scalability**: Virtualize table for 200+ entries (react-window); modular for future cloud.

## 4. Technical Requirements

### 4.1 Architecture (Brownfield)
- **Frontend Extensions**: Add Dashboard.tsx, ShareView.tsx; extend App.tsx for routing (react-router-dom).
- **State Management**: Introduce Zustand store (`src/lib/store.ts`) for global schedules array, filters, currentId; local state unchanged.
- **Routing**: /dashboard (default), /schedule/:id (edit/view), /share/:shareId (read-only).
- **Build/Deployment**: No changes; Vite handles new deps; deploy maintains localStorage compatibility.
- **Component Integration**: Reuse 80% existing (form/table/print); add <MultiSelect /> wrapper for assignees.
- **Error Handling**: Extend existing boundaries; share-specific errors (404 for invalid ID).

### 4.2 Data Model Updates
Extend HK-Schedules-PRD.md 4.2 interfaces in `src/types/schedule.ts`:

```typescript
// Existing Status/Recurrence unchanged

interface ScheduleEntry {
  id: string;
  time: string;
  task: string;
  assignees?: string[]; // Changed: array for multi
  duration?: number;
  status: Status;
  notes?: string;
  recurrence?: Recurrence;
  createdAt: Date;
  updatedAt: Date;
  shareId?: string; // New: for exports
  sharePin?: string; // Hashed mock
}

interface Schedule {
  id: string;
  title: string;
  description?: string;
  category?: string; // New: e.g., 'shift', 'client'
  startDate: Date;
  endDate?: Date;
  entries: ScheduleEntry[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
  isArchived?: boolean;
  assignees?: string[]; // New: schedule-level team
}

interface ShareConfig { // New
  id: string;
  scheduleId: string;
  pinHash: string;
  expiresAt: Date;
  accessCount: number;
  createdAt: Date;
}

interface MultiScheduleStore extends ScheduleStore { // Extend existing
  schedules: Schedule[]; // Array vs single
  searchTerm: string;
  filters: { category?: string; assignee?: string; dateRange?: [Date, Date] };
  shares: ShareConfig[];
  // Actions: addSchedule, updateFilter, generateShare, etc.
}
```

**Validation Schemas** (`src/lib/validation.ts`, extend Zod):
```typescript
const entrySchema = z.object({
  // Existing...
  assignees: z.array(z.string().min(2).or(z.string().email())).min(1).max(10).optional(),
  shareId: z.string().uuid().optional(),
  sharePin: z.string().length(4).optional(), // PIN
});

const scheduleSchema = z.object({
  // Existing...
  category: z.string().max(50).optional(),
  assignees: z.array(z.string()).optional(),
});

const shareSchema = z.object({
  id: z.string().uuid(),
  scheduleId: z.string().uuid(),
  pinHash: z.string(),
  expiresAt: z.date().min(new Date()), // Future
  accessCount: z.number().min(0),
});
```

- **Storage**: Key 'hk-schedules-v2'; migrate v1 on load (wrap single in array); IndexedDB if >5MB.
- **Migration**: Script in store init: if v1, create Schedule wrapper with default category.

### 4.3 API Design (Local-First Extensions)
Extend `src/lib/api.ts` with localStorage wrappers:

- **Multi-Schedule**:
  - GET /schedules: Return array; query ?search=term&category=shift&dateFrom=2025-01-01&dateTo=2025-12-31.
  - POST /schedules: Body Omit<Schedule, 'id'|'createdAt'|'updatedAt'>; return created.
  - PATCH /schedules/:id: Partial updates (e.g., {category: 'new'}); optimistic via version.
  - DELETE /schedules/:id: Soft archive (set isArchived: true).

- **Sharing**:
  - POST /schedules/:id/share: Body {pin?: string, expiresDays?: number=7}; return {shareId, pin}.
  - GET /share/:shareId: Validate expiry/PIN (compare hash); return read-only Schedule or {error: 'Invalid Access'}.
  - PATCH /share/:shareId/log: Increment accessCount.

- **Error Format**: {error: string, code: number} (e.g., 404 for invalid share).
- **Rate Limiting**: None; future cloud: 50 shares/day free.
- **Versioning**: v2 endpoints prefixed; backward compat for v1.

### 4.4 Dependencies (Updates)
- **Existing**: Unchanged (React, Tailwind, shadcn/ui).
- **Additions**:
  - zustand@^4.5.0 (state).
  - react-router-dom@^6.22.0 (routing).
  - uuid@^9.0.1 (IDs/shares).
  - react-select@^5.8.0 (multi-assignee dropdown).
  - @types/uuid (TS).
- **Dev**: No changes; audit new deps.
- **Version Policy**: Pin minors; update quarterly.

### 4.5 Integrations
- **Internal**: Extend CSV export for multi (add category column); PDF with assignees badges.
- **Future**: iCal via ical.js; Zapier webhook for share notifications (post-v1.1).

## 5. UI/UX Design Guidelines (Extensions)
- **Design System**: Reuse shadcn/ui; add MultiSelect variant (searchable combobox).
- **Color Updates**: Add Share accent (Purple #8B5CF6 for links); Filter chips (blue outline).
- **Typography/Interactions**: Same as PRD 5; add loading skeletons for dashboard cards.
- **Themes**: Extend dark mode for share view.

**Wireframes (Text)**:
- **Dashboard**: Header (search + filter bar), Grid (cards: title, badge, count, actions), Footer (pagination).
- **Filter Bar**: Dropdown cascade (category → assignee → date); chips for active.
- **Share Modal**: Generated link field (copy btn), PIN display, QR code placeholder, expiry selector.
- **Read-Only Table**: Muted actions; prominent "Print/Export" header; watermark "Shared View".

## 6. Assumptions and Constraints
- **Assumptions**: Users upgrade from v1.0; localStorage enabled; basic router support.
- **Constraints**: Local-only (no server auth); quota ~10MB post-multi; CSR performance limits.
- **Out of Scope**: Real auth (mock PIN); real-time collab; mobile PWA install.
- **Brownfield**: 100% backward compat; no refactor of core components.

## 7. Risks and Mitigations
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data migration fails (v1 to v2) | Medium | High | Fallback to v1 mode; console warn; auto-backup pre-migrate. |
| Performance hit from array state | Medium | Medium | Zustand selectors for partial loads; virtualize lists. |
| Share security vulnerabilities | Low | High | PIN hashing (crypto.subtle); expiry enforcement; doc limitations. |
| Dep conflicts (new vs existing) | Low | Low | npm audit; test build; fallback CSS for select. |
| User confusion on multi vs single | High | Low | Onboarding tour highlighting dashboard; migration notice. |

## 8. Timeline and Milestones
**Overall**: 4 weeks (2 sprints); post-v1.0.
- **Sprint 1 (Weeks 1-2)**: Dashboard + multi-CRUD; data migration; basic filters.
  - Milestone: Create/view multiple schedules.
- **Sprint 2 (Weeks 3-4)**: Form/table extensions; sharing; tests.
  - Milestone: End-to-end share flow; E2E coverage >90%.
- **Resources**: 1 Dev (full), PM (reviews), QA (Week 4).
- **Gantt**: W1: Dashboard/Model | W2: Filters/Form | W3: Sharing/API | W4: Test/Polish.
- **Post-Release**: Monitor metrics; v1.1 cloud (8 weeks).

## 9. Appendix
- **Glossary**: ShareId (unique export token); Multi-Assignee (array of names/emails).
- **References**: Epic BE-001; HK-Schedules-PRD.md; README.md; Zustand docs.
- **Standards**: Same as PRD 9.

## 10. Requirements Traceability Matrix
| Req ID | Requirement | User Story | Test Case | Status |
|--------|-------------|------------|-----------|--------|
| FR-1 | Multi-Dashboard | US-001 | TC-001: Load 20 schedules | Planned |
| FR-2 | Assignee Filter | US-002 | TC-002: Bulk update 10 rows | Planned |
| FR-3 | Multi-Select Form | US-003 | TC-003: Validate assignees array | Planned |
| FR-4 | Share Links | US-004 | TC-004: PIN validation flow | Planned |
| NFR-1 | <1s Load | N/A | TC-005: Performance profile | Planned |
| ... | ... | ... | ... | ... |

**Change Log**:
- v1.0 (2025-09-14): Initial brownfield PRD for BE-001.

This PRD is a living extension of HK-Schedules-PRD.md; review bi-weekly.