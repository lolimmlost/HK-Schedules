# Product Requirements Document (PRD) for HK-Schedules

## 1. Introduction

### 1.1 Product Overview
HK-Schedules is a web-based application designed to streamline schedule management for users such as event organizers, teams, or individuals. It allows users to create, edit, view, and print schedules in a tabular format. Built with modern web technologies (React, TypeScript, Tailwind CSS, and shadcn/ui), the app provides an intuitive interface for handling recurring or one-time events, assignments, and timelines.

The core value proposition is simplicity and efficiency: users can quickly input schedule details via forms, visualize them in interactive tables, and generate printable outputs without needing complex software.

### 1.2 Target Audience
- **Primary Users**: Event planners, team leads, educators, or personal users managing daily/weekly schedules.
- **Secondary Users**: Administrators who may need to export or share schedules.
- **User Personas**:
  - **Event Coordinator (Alex, 35, Marketing Manager)**: Manages team events and deadlines for a 20-person agency. Goals: Quickly assign tasks and print agendas. Pain Points: Manual Excel updates lead to errors; needs visual timelines. Tech Savvy: Medium (uses Google Workspace).
  - **Team Member (Jordan, 28, Freelancer)**: Views assigned shifts for client projects. Goals: Mobile access to updates without emails. Pain Points: Outdated shared docs; needs notifications. Tech Savvy: High (mobile-first user).
  - **Admin (Taylor, 42, Operations Lead)**: Oversees department schedules for 50+ employees. Goals: Bulk exports and compliance reporting. Pain Points: Version control in spreadsheets; integration with HR tools. Tech Savvy: Low-Medium (prefers simple UIs).
  - **Educator (Sam, 50, Teacher)**: Creates class timetables and homework schedules. Goals: Recurring events, parent sharing. Pain Points: Paper-based planning; digital transition barriers. Tech Savvy: Low.

### 1.3 Business Goals
- Enable efficient schedule creation and management to reduce planning time by 50% compared to manual tools.
- Provide printable and shareable outputs to improve collaboration, targeting 30% increase in team productivity.
- Ensure cross-device compatibility (desktop, tablet, mobile) for 95% user coverage.
- Future scalability for integrations (e.g., calendar APIs, notifications) to support enterprise users.
- Achieve monetization through premium features (e.g., cloud sync) within 6 months post-launch.

### 1.4 Success Metrics
- **User Adoption**: 80% task completion rate without support; 50% conversion from free to registered users (if auth added).
- **Engagement**: Average session time > 5 minutes; DAU/MAU ratio > 20%; retention > 70% weekly active users.
- **Performance**: Page load < 2 seconds (Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1); 99% uptime SLA.
- **Business KPIs**: NPS > 40; feature usage (e.g., 60% users print schedules); error rate < 1%.
- **Technical KPIs**: Bundle size < 500KB; 100% test coverage for core features.

## 2. Problem Statement
Users currently rely on spreadsheets (e.g., Google Sheets, Excel) or disparate tools (e.g., Trello for tasks, Google Calendar for events) for scheduling, leading to:
- **Errors and Inconsistencies**: Manual data entry causes duplicates or missed updates.
- **Version Conflicts**: Shared files result in overwrite issues and confusion over "latest" version.
- **Poor Printability and Sharing**: Formatting breaks on print; no native mobile optimization.
- **Lack of Integration**: No seamless workflow between creation, viewing, and export.

HK-Schedules addresses this by offering a dedicated, user-friendly platform with built-in validation, visualization, search/filtering, and multi-format export capabilities, reducing setup time from hours to minutes.

### 2.1 Competitive Analysis
- **Google Calendar**: Strong for events but weak on tabular schedules and team assignments; no offline editing.
- **Microsoft Outlook/Teams**: Enterprise-focused, overkill for small teams; high cost.
- **Asana/Trello**: Task management with calendars, but not specialized for printable schedules.
- **Doodle/SkedPal**: Meeting scheduling, lacks custom entry fields.
- **Differentiation**: HK-Schedules focuses on simple, printable tabular schedules with local-first persistence, ideal for non-tech users.

## 3. Functional Requirements

### 3.1 Core Features
#### 3.1.1 Schedule Creation
- Users can create new schedules via a multi-step or single-page form interface.
- Form fields:
  - Title (required, string, max 100 chars).
  - Description (optional, textarea, max 500 chars).
  - Start/End Dates (date inputs, with time picker for granularity).
  - Category/Tag (optional, dropdown: e.g., Work, Personal, Event).
  - Entries: Dynamic array (add/remove rows) with fields:
    - Time (required, time input or datetime-local).
    - Task (required, string, max 200 chars).
    - Assignee (optional, string or multi-select from predefined list).
    - Duration (optional, number in minutes).
    - Status (default: Pending, select: Pending/Completed/In Progress).
    - Notes (optional, textarea, max 300 chars).
    - Recurrence (optional, select: None/Daily/Weekly/Monthly).
- Validation: Required fields marked with *, date ranges (start <= end), unique time slots per day, assignee email format if provided, no overlapping times.
- Edge Cases: Handle empty entries array (min 1 entry), invalid dates (e.g., end before start), large inputs (truncate with warning).
- Implementation: Use `src/components/schedule-form.tsx` with shadcn/ui inputs, labels, buttons, and dynamic form arrays (e.g., via react-hook-form).

**User Stories**:
- As an Event Coordinator, I want to add multiple entries at once so I can build a full day's schedule efficiently.
- As a Team Member, I want to set recurrence for tasks so repeating assignments are auto-populated.
- Acceptance Criteria: Form submits only if valid; shows inline errors; persists draft on blur.

#### 3.1.2 Schedule Viewing and Editing
- Display schedules in a responsive, interactive table.
- Table columns: Checkbox (select), Time, Task, Assignee, Duration, Status (badge), Notes (expandable), Actions (edit/delete).
- Features:
  - Inline editing: Click cell to edit (e.g., double-click task to update).
  - Bulk actions: Select multiple rows for status update or delete.
  - Sort by any column (ascending/descending).
  - Filter: By status, assignee, date range; global search on task/notes.
  - Pagination: For schedules > 50 entries (10 per page).
  - Visual Indicators: Color-coded status badges, overdue highlights (red if past due).
- Implementation: Leverage `src/components/schedule-table.tsx` with shadcn/ui table, sortable headers, and badges.

**User Stories**:
- As an Admin, I want to filter by assignee so I can review individual workloads.
- As a User, I want inline editing with undo so I can correct typos without losing work.
- Acceptance Criteria: Changes auto-save after 3s idle or on blur; confirm deletes; search matches partial text case-insensitively.

#### 3.1.2 Schedule Viewing and Editing
- Display schedules in a responsive table.
- Table columns: Time, Task, Assignee, Status (e.g., Pending/Completed), Notes.
- Editable inline cells for quick updates.
- Sort/filter by columns (e.g., date, assignee).
- Implementation: Leverage `src/components/schedule-table.tsx` with shadcn/ui table component.

#### 3.1.3 Printing and Export
- Generate printable views in PDF (via jsPDF or html2pdf) or HTML (print-optimized CSS).
- Print Options: Landscape/portrait, include totals/summaries, custom headers (title, date, logo placeholder), footers (page numbers, generated by).
  - Filters: Print selected entries only; date range.
- Export Formats:
  - CSV: For Excel import (columns match table).
  - JSON: Full data dump for backups.
  - iCal (.ics): For calendar import (future).
  - PDF: With styling matching app theme.
- Implementation: Extend `src/components/print-schedule.tsx` using browser print API for HTML, jsPDF for PDF; add export buttons in table header.

**User Stories**:
- As a Teacher, I want to print a weekly overview with assignee columns so I can post it in class.
- As an Admin, I want CSV export with filters so I can analyze in external tools.
- Acceptance Criteria: Exports preserve data integrity; PDF < 1MB for 100 entries; print preview shows exact output.

#### 3.1.4 Data Persistence
- Local storage for offline use (via browser localStorage or IndexedDB for larger datasets).
- Multi-schedule Management: List view of all saved schedules; rename/delete/archive.
- CRUD Operations:
  - Create: Save new schedule with auto-generated ID (UUID).
  - Read: Load by ID or list all; search schedules by title.
  - Update: Patch individual entries or full schedule.
  - Delete: Soft delete (archive) or hard delete with confirmation.
- Backup: Auto-save drafts; manual export all schedules as ZIP of JSONs.
- Future: Cloud sync with user auth (Firebase Realtime DB); conflict resolution on merge.
- Implementation: Custom hooks (useLocalStorage) wrapping localStorage; migrate to IndexedDB if >5MB.

**User Stories**:
- As a User, I want to manage multiple schedules so I can separate work/personal.
- As an Admin, I want auto-backup so data isn't lost on browser clear.
- Acceptance Criteria: Data persists across sessions; quota exceeded shows warning; sync conflicts prompt user choice.

### 3.2 User Flows
1. **Onboarding**:
   - User loads app → Dashboard shows welcome message, sample schedule, "Create New" button, or "Load Existing" dropdown.
   - Optional tour: Stepper highlighting key features (dismissible).

2. **Create Schedule**:
   - Click "Create New" → Form loads (pre-filled with today's date) → Add entries dynamically → Validate on submit → Success: Save and redirect to view → Error: Highlight issues.

3. **View/Edit**:
   - Dashboard → Select schedule from list/card → Load table view → Inline edit or bulk actions → Auto-save indicator → Manual "Save" for explicit commits.

4. **Print/Export**:
   - In table view → Click "Print" or "Export" dropdown → Select format/options → Preview modal → Confirm → Download/print.

5. **Search and Manage**:
   - Dashboard → Search bar for schedules → Filter by date/tag → Archive/delete with confirmation.

6. **Error Handling**: Display toast/alerts for validation (inline + summary), network/offline warnings, quota issues (using `src/components/ui/alert.tsx` and sonner for toasts).

**Detailed Flow Diagram** (Text-based):
```
Dashboard → Create → Form Validation → Save → Table View
          ↓
        Load → Table → Edit/Filter → Export/Print → Success Modal
          ↓
        Error → Alert → Retry
```

### 3.3 Non-Functional Requirements
- **Performance**: Render tables with up to 100 entries < 1 second; lazy-load large datasets; optimize images/icons < 50KB total.
- **Accessibility**: WCAG 2.1 AA compliant – ARIA labels on all interactive elements, keyboard navigation (tabindex, Enter to edit), screen reader support (semantic HTML), color contrast > 4.5:1, alt text for icons.
- **Security**: Sanitize all inputs (DOMPurify for notes); no sensitive data (e.g., no passwords); CSP headers in build; HTTPS enforcement on deploy.
- **Responsive Design**: Mobile-first with Tailwind CSS breakpoints (sm: 640px, md: 768px, lg: 1024px); touch-friendly buttons (>44px); horizontal scroll for tables on small screens.
- **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+; polyfill for older via Vite.
- **Reliability**: Offline functionality (Service Worker for PWA); error boundaries in React; logging to console for dev.
- **Scalability**: Handle 1000+ entries via virtualization (react-window); modular code for future backend swap.
- **Internationalization (i18n)**: English default; RTL support; date/time formats via Intl API; future: react-i18next for multi-lang.

### 3.4 API Design (Local-First)
Although local-first, design with REST-like patterns for future backend:
- **Endpoints** (via custom hooks):
  - POST /schedules: Create new schedule (body: Schedule object).
  - GET /schedules: List all (query: ?search=term&filter=status).
  - GET /schedules/:id: Retrieve by ID.
  - PATCH /schedules/:id: Update (body: partial Schedule).
  - DELETE /schedules/:id: Delete.
  - POST /schedules/:id/export: Generate export (query: format=pdf/csv).
- Implementation: Abstract in `src/lib/api.ts` using localStorage wrappers; error responses { error: string, code: number }.
- Rate Limiting: None initially; add for cloud (e.g., 100 req/min).
- Versioning: API v1; schema changes via migration scripts.

## 4. Technical Requirements

### 4.1 Architecture
- **Overall**: Client-side Single Page Application (SPA) with local persistence; PWA-capable for offline.
- **Frontend**: React 18+ with TypeScript strict mode; Hooks for state/logic; Vite 5+ for fast HMR/build.
- **Styling**: Tailwind CSS v3+ for utility classes; shadcn/ui v0.8+ for accessible components (button, input, table, card, alert, badge, etc.); CSS-in-JS minimal.
- **State Management**: Zustand for global store (schedules, UI state); local component state via useState/useReducer.
- **Routing**: React Router v6 for dashboard/form/table routes (e.g., /schedules/:id); protected routes if auth added.
- **Build/Deployment**: Vite for dev/prod builds; ESLint/Prettier for linting; deploy to Vercel/Netlify (auto-deploys from Git); Docker for self-host if needed.
- **Existing Components**: Integrate `src/lib/utils.ts` (cn for classNames); UI from `src/components/ui/`; extend schedule-specific in `src/components/`.
- **Error Handling**: React ErrorBoundary for crashes; Sentry integration for prod logging; user-friendly fallbacks.
- **Component Breakdown**:
  - App.tsx: Root with providers (Zustand, Router).
  - Dashboard.tsx: Schedule list with search/create.
  - ScheduleForm.tsx: Dynamic form with validation.
  - ScheduleTable.tsx: Virtualized table with actions.
  - PrintSchedule.tsx: Export utilities.

### 4.2 Data Model
- **Core Interfaces** (TypeScript in `src/types/schedule.ts`):
  ```typescript
  type Status = 'pending' | 'in_progress' | 'completed' | 'cancelled';

  type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

  interface ScheduleEntry {
    id: string; // UUID v4
    time: string; // ISO datetime or 'HH:MM'
    task: string;
    assignee?: string; // Email or name
    duration?: number; // Minutes
    status: Status;
    notes?: string;
    recurrence?: Recurrence;
    createdAt: Date;
    updatedAt: Date;
  }

  interface Schedule {
    id: string; // UUID v4
    title: string;
    description?: string;
    category?: string; // e.g., 'work', 'personal'
    startDate: Date;
    endDate?: Date;
    entries: ScheduleEntry[];
    version: number; // For optimistic locking
    createdAt: Date;
    updatedAt: Date;
    isArchived?: boolean;
  }

  interface ScheduleStore {
    schedules: Schedule[];
    currentScheduleId?: string;
    addSchedule: (schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateSchedule: (id: string, updates: Partial<Schedule>) => void;
    deleteSchedule: (id: string) => void;
    setCurrent: (id: string) => void;
  }
  ```

- **Validation Schemas** (using Zod in `src/lib/validation.ts`):
  ```typescript
  import { z } from 'zod';

  const entrySchema = z.object({
    id: z.string().uuid(),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    task: z.string().min(1).max(200),
    assignee: z.string().email().optional(),
    duration: z.number().min(1).max(1440).optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
    notes: z.string().max(300).optional(),
    recurrence: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
  });

  const scheduleSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    category: z.string().optional(),
    startDate: z.date(),
    endDate: z.date().optional(),
    entries: z.array(entrySchema).min(1),
    version: z.number().min(0),
    createdAt: z.date(),
    updatedAt: z.date(),
    isArchived: z.boolean().optional(),
  });

  export type ValidSchedule = z.infer<typeof scheduleSchema>;
  ```

- **Storage**: JSON serialized in localStorage (key: 'hk-schedules-v1'); IndexedDB for >5MB; compression with lz-string if needed.
- **Data Migration**: Versioned storage; on load, migrate old formats (e.g., add version field).

### 4.3 Integrations
- **Initial**: None (local-only).
- **Future (Phase 4)**:
  - Google Calendar API: Import/export events (OAuth2 auth).
  - Microsoft Graph: For Outlook/Teams integration.
  - Email/SMS: Notifications via SendGrid/Twilio (premium).
  - Zapier: Webhooks for automation (e.g., Slack alerts on changes).
- **Implementation**: Modular plugins; config in env vars.

### 4.4 Dependencies
- **Existing** (from package.json): React@^18, @types/react, tailwindcss, autoprefixer, postcss, typescript, vite, @vitejs/plugin-react.
- **UI**: class-variance-authority, clsx, tailwind-merge (for shadcn/ui); lucide-react for icons.
- **Suggested Additions**:
  - date-fns@^3 for date utilities.
  - react-router-dom@^6 for routing.
  - zustand@^4 for state management.
  - zod@^3 for validation.
  - react-hook-form@^7 for forms.
  - react-window@^1 for table virtualization.
  - jspdf@^2, html2pdf.js for exports.
  - sonner@^1 for toasts.
  - uuid@^9 for IDs.
  - lz-string@^1 for compression.
- **Dev Dependencies**: vitest for testing, @testing-library/react, cypress for E2E.
- **Version Policy**: Semantic versioning; audit weekly.

## 5. UI/UX Design Guidelines
- **Design System**: shadcn/ui as base; custom tokens for HK-Schedules (e.g., primary blue #3B82F6).
- **Color Scheme**: Primary: Blue (#3B82F6), Secondary: Gray (#6B7280), Success: Green (#10B981), Error: Red (#EF4444), Background: White/Off-white (#F9FAFB), Text: Dark Gray (#111827).
- **Typography**: Inter font (sans-serif); H1: 32px bold, Body: 16px regular.
- **Interactions**: Hover: Scale 1.02/opacity 0.9; Focus: Outline blue; Loading: Spinners (shadcn); Animations: Framer Motion for modals/transitions (subtle, <300ms).
- **Icons**: Lucide-react; 24px default.
- **Themes**: Light/dark mode toggle (Tailwind dark: class).
- **Accessibility**: High contrast mode; reduced motion support (@media prefers-reduced-motion).

**Detailed Wireframes** (Text Descriptions; Recommend Figma for visuals):
- **Dashboard** (Full-width, responsive grid):
  - Header: Logo left, Search bar center, User menu (export all, settings) right.
  - Main: Cards grid (md: 3 cols) – Each card: Title, Entry count badge, Last updated, Quick actions (view/edit/delete). Empty state: Illustrated + "Create First Schedule".
  - Footer: Pagination if >12 schedules.

- **Schedule Form** (Modal or full page; vertical scroll):
  - Top: Title input, Description textarea in card.
  - Middle: Date pickers (start/end), Category select.
  - Entries Section: Add button → Dynamic rows (Time input, Task textarea, Assignee input, Status select, Notes textarea, Delete icon). Validation indicators (red border on error).
  - Bottom: Cancel/Save buttons; Progress bar for multi-step.

- **Schedule Table** (Full width, sticky header):
  - Header: Breadcrumbs (Dashboard > Schedule Title), Search input, Filter dropdown (status/assignee), Export button group (Print/CSV/PDF), Add Entry button.
  - Table: Responsive (stack on mobile); Columns as defined; Sortable arrows; Row hover highlight; Checkbox for bulk; Expandable notes row.
  - Footer: Pagination (showing 10/50/All), Summary (e.g., 5 pending tasks).

- **Print View** (Dedicated route/modal; @media print):
  - Header: Title, Date range, Generated by/timestamp, Optional logo.
  - Body: Table without interactive elements; Landscape orientation; Page breaks after sections.
  - Footer: Page X of Y, Confidentiality note if needed.
  - Preview: Side-by-side with options (include notes?).

- **Error/Alert Modals**: Centered overlay; Icon + message + actions (Retry/Cancel).

## 6. Assumptions and Constraints
- **Assumptions**: Users have stable internet for initial load (offline after); basic web literacy (mouse/keyboard/touch); English primary language.
- **Constraints**: Browser-only (no native/hybrid app); localStorage quota ~5MB (fallback to IndexedDB); no server-side rendering initially (CSR only).
- **Out of Scope** (v1.0): Multi-user auth/collaboration, real-time sync, advanced analytics (e.g., Gantt charts), mobile app, AI suggestions, payment processing.
- **Dependencies**: Relies on third-party libs (e.g., Tailwind); browser permissions for print/export.

## 7. Risks and Mitigations
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data loss on localStorage clear or quota exceed | Medium | High | Auto-backup to JSON download on save; prompt for export; migrate to IndexedDB; user education via tooltips. |
| Poor mobile UX (touch issues, scrolling) | High | Medium | Responsive testing with BrowserStack/Chrome DevTools; prioritize touch targets; horizontal table scroll with indicators. |
| Scalability for large schedules (>500 entries) | Low | High | Implement virtualization (react-window); pagination; lazy loading; performance profiling with React DevTools. |
| Browser compatibility bugs | Medium | Medium | Cross-browser testing matrix; polyfills via core-js; fallback UIs (e.g., basic table if JS disabled). |
| Third-party dep vulnerabilities | Medium | Medium | Dependabot alerts; weekly npm audit; pin versions; alternatives (e.g., switch from jsPDF if issues). |
| User adoption resistance (prefer spreadsheets) | High | High | Onboarding tour; import from CSV; familiarity in UI (Excel-like table); A/B test features. |
| Future cloud integration complexity | Low | High | Design modular (local API abstraction); start with Firebase mock; phased rollout. |

**Dependency Risks**: Monitor shadcn/ui updates; have fallback CSS if Tailwind fails.

## 8. Timeline and Milestones
**Overall Timeline**: 8 weeks for v1.0 (MVP + Polish); Agile sprints (2-week).

- **Phase 1: Foundation (Weeks 1-2)**:
  - Implement core form (ScheduleForm.tsx) and table (ScheduleTable.tsx).
  - Basic state management (Zustand store).
  - LocalStorage CRUD.
  - Milestone: Create/view simple schedule.

- **Phase 2: Features (Weeks 3-4)**:
  - Inline editing, sort/filter, bulk actions.
  - Validation (Zod + react-hook-form).
  - Dashboard with multi-schedule list.
  - Milestone: Full edit flow with persistence.

- **Phase 3: Export & UX (Weeks 5-6)**:
  - Printing/PDF/CSV export.
  - Responsive design, accessibility fixes.
  - Error handling, toasts.
  - Milestone: End-to-end user flows.

- **Phase 4: Testing & Deploy (Weeks 7-8)**:
  - Unit/integration tests (Vitest).
  - E2E tests (Cypress).
  - Performance optimization, docs.
  - Deploy to Vercel; beta user feedback.
  - Milestone: Production-ready v1.0.

**Resource Allocation**: 1 Full-Stack Dev (80%), 1 Designer (20% for wireframes), QA (Phase 4).
**Gantt Overview** (Text): Week1: Form/Table | Week2: State/Storage | Week3: Edit/Validate | Week4: Dashboard | Week5: Export | Week6: UX | Week7: Test | Week8: Deploy.
**Post-v1.0**: v1.1 (Cloud Sync, 4 weeks); v2.0 (Auth/Collab, 12 weeks).

## 9. Appendix
- **Glossary**:
  - Schedule: A collection of timed entries with metadata.
  - Entry: Individual task/item in a schedule.
  - CRUD: Create, Read, Update, Delete operations.
  - PWA: Progressive Web App for offline/installable experience.
  - WCAG: Web Content Accessibility Guidelines.

- **References**:
  - Existing codebase: `/src` directory; Tailwind CSS docs (https://tailwindcss.com).
  - Tools: shadcn/ui (https://ui.shadcn.com), Vite (https://vitejs.dev).
  - Standards: WCAG 2.1 (https://www.w3.org/WAI/standards-guidelines/wcag/).

## 10. Requirements Traceability Matrix
| Req ID | Requirement | User Story | Test Case | Status |
|--------|-------------|------------|-----------|--------|
| FR-1.1 | Schedule Creation Form | US-001: Add entries | TC-001: Validate required fields | Planned |
| FR-1.2 | Inline Editing | US-002: Edit task | TC-002: Auto-save on blur | Planned |
| NFR-1 | Performance <1s | N/A | TC-003: Load 100 entries | Planned |
| ... | ... | ... | ... | ... |

**Change Log Template**:
- v1.0 (2025-09-14): Initial PRD.
- v1.1 (2025-09-15): CSV Export Chrome Compatibility Fix - Resolved download issues with robust Blob-based implementation, proper CSV escaping using processRow function, cross-browser support including IE11 fallback, and defensive data format handling for legacy and multi-entry schedules.

This PRD serves as a living document and will be updated based on feedback and iterations. Review quarterly or pre-sprint.