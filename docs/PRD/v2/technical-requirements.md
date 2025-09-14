# 4. Technical Requirements

## 4.1 Architecture (Brownfield)

- **Frontend Extensions**: Add Dashboard.tsx, ShareView.tsx; extend App.tsx for routing (react-router-dom).
- **State Management**: Introduce Zustand store (`src/lib/store.ts`) for global schedules array, filters, currentId; local state unchanged.
- **Routing**: /dashboard (default), /schedule/:id (edit/view), /share/:shareId (read-only).
- **Build/Deployment**: No changes; Vite handles new deps; deploy maintains localStorage compatibility.
- **Component Integration**: Reuse 80% existing (form/table/print); add <MultiSelect /> wrapper for assignees.
- **Error Handling**: Extend existing boundaries; share-specific errors (404 for invalid ID).

**Cross-reference**: Extends [v1/technical-requirements.md](../v1/technical-requirements.md#architecture) with v2 routing and state management.

## 4.2 Data Model Updates

Extend [v1/technical-requirements.md](../v1/technical-requirements.md#data-model) interfaces in `src/types/schedule.ts`:

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

**Cross-reference**: Builds on [v1/technical-requirements.md](../v1/technical-requirements.md#data-model) with multi-assignee and sharing extensions.

## 4.3 API Design (Local-First Extensions)

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

**Cross-reference**: Extends [v1/technical-requirements.md](../v1/technical-requirements.md#api-design-local-first) with multi-schedule and sharing endpoints.

## 4.4 Dependencies (Updates)

- **Existing**: Unchanged (React, Tailwind, shadcn/ui).
- **Additions**:
  - zustand@^4.5.0 (state).
  - react-router-dom@^6.22.0 (routing).
  - uuid@^9.0.1 (IDs/shares).
  - react-select@^5.8.0 (multi-assignee dropdown).
  - @types/uuid (TS).
- **Dev**: No changes; audit new deps.
- **Version Policy**: Pin minors; update quarterly.

**Cross-reference**: Builds on [v1/technical-requirements.md](../v1/technical-requirements.md#dependencies) with v2-specific additions.

## 4.5 Integrations

- **Internal**: Extend CSV export for multi (add category column); PDF with assignees badges.
- **Future**: iCal via ical.js; Zapier webhook for share notifications (post-v1.1).

**Cross-reference**: Extends [v1/technical-requirements.md](../v1/technical-requirements.md#integrations) with v2 export enhancements.