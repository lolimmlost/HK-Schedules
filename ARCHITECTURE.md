# Housekeeper Schedule Manager - System Architecture (v2 Multi-Schedule Brownfield Extension)

**Architecture Version**: 2.0 (Brownfield extension for Epic BE-001: Multi-Schedule Management and Team Collaboration Enhancement)
**Date**: September 2025
**Compatibility**: 100% backward compatible with v1.0; auto-migration on first load
**Core Principles Extension**: Incremental layering (80% code reuse), local-first persistence, modular state management, mock security for sharing

## 🏗️ Overview

The Housekeeper Schedule Manager v2 extends the v1.0 single-schedule application to support multi-schedule management, team collaboration features, and shareable exports while maintaining the existing React/TypeScript frontend, Express.js backend, and local-first architecture. This brownfield evolution introduces Zustand for global state, react-router-dom for navigation, and extended data models without requiring backend database changes or breaking existing functionality.

### v2 Key Enhancements
- **Multi-Schedule Support**: Dashboard for managing multiple schedules by category/shift
- **Team Collaboration**: Assignee filtering, multi-assignee entries, bulk actions
- **Shareable Exports**: Read-only links with mock PIN security and expiry
- **State Management**: Zustand store replacing local hooks for global schedules array
- **Routing**: SPA navigation with protected share views
- **Persistence**: localStorage v2 with auto-migration from v1 data
- **Performance**: Virtualized tables, debounced filters, partial re-renders via selectors

The architecture maintains single responsibility, type safety, accessibility, and performance while scaling from individual to team-based scheduling workflows.

The Housekeeper Schedule Manager is a full-stack web application designed for managing housekeeper schedules with CSV import/export capabilities and professional print views. It follows a client-server architecture with a React/TypeScript frontend and Express.js backend, optimized for both local development and Cloudflare Tunnel deployment.

### Key Design Principles
- **Single Responsibility**: Components handle specific UI concerns; business logic is contained within custom hooks or utilities
- **Type Safety**: Full TypeScript coverage across frontend and backend
- **Accessibility**: shadcn/ui components with proper ARIA labels and keyboard navigation
- **Performance**: Vite for fast builds, localStorage for offline persistence, optimized print CSS
- **Maintainability**: Modular component structure, clear separation of concerns, comprehensive error handling

## 🗂️ System Components

### 1. Frontend (React + TypeScript + Vite + v2 Extensions)

**v1 Core** (unchanged):
- Build Tool: Vite 4.4.5 with React plugin
- UI Framework: shadcn/ui with Tailwind CSS 3.3.6
- Icons: Lucide React
- Form Handling: Custom validation with real-time feedback
- Data Persistence: Browser localStorage (v1 key: `housekeeperSchedules`)

**v2 Extensions**:
- **State Management**: Zustand 4.5.0 for global multi-schedule store (`src/lib/store.ts`)
- **Routing**: react-router-dom 6.22.0 for dashboard, schedule editing, and share views
- **Multi-Select**: react-select 5.8.0 for assignee dropdowns
- **UUID Generation**: uuid 9.0.1 for schedule and share IDs
- **Virtualization**: react-window (future, for large tables >100 entries)
- **Form Library**: react-hook-form integration for extended ScheduleForm validation
- **Security**: crypto.subtle for mock PIN hashing in share links

**Component Structure Evolution**:
```
App.tsx (v2 Router Wrapper)
├── Routes:
│   ├── / (Dashboard.tsx - Multi-schedule list)
│   ├── /schedule/:id (ScheduleForm.tsx + ScheduleTable.tsx - Edit/View)
│   └── /share/:shareId (ShareView.tsx - Read-only with PIN validation)
├── Global Store: Zustand (schedules array, filters, shares)
└── Existing Components: Extended for multi-assignee support
```
- **Build Tool**: Vite 4.4.5 with React plugin for fast HMR and production builds
- **UI Framework**: shadcn/ui with Tailwind CSS 3.3.6 for accessible, customizable components
- **Icons**: Lucide React for consistent iconography
- **State Management**: React hooks (useState, useEffect) with localStorage persistence
- **Routing**: No external router; single-page application with conditional rendering
- **Form Handling**: Custom form validation with real-time feedback
- **Data Persistence**: Browser localStorage for offline capability

### 2. Backend (Express.js - v2 Minimal Extensions)

**v1 Core** (unchanged):
- Framework: Express 4.18.2 with JSON parsing
- API Endpoints: POST `/export-csv` for schedule downloads
- Environment Handling: Dual-mode (dev/prod)
- Static Serving: Production serves Vite-built assets from `/dist`

**v2 Extensions** (local-first focus, minimal backend changes):
- **Share Validation** (optional): Future endpoint `GET /api/share/validate/:shareId` for PIN checking (localStorage fallback)
- **Extended CSV Export**: Support for multi-schedule arrays with category/assignee columns
- **Mock Analytics**: Console logging for share access counts (future cloud integration)
- **CORS Extensions**: Allow share link origins if implementing server-side validation
- **Rate Limiting**: None required for local-first; future: 50 shares/day for premium

**Backward Compatibility**: All v1 API calls continue to work; new endpoints prefixed `/api/v2/`
- **Framework**: Express 4.18.2 with JSON parsing middleware
- **API Endpoints**: Single POST endpoint `/export-csv` for CSV generation
- **Environment Handling**: Dual-mode architecture (development/production)
- **Static Serving**: Production mode serves Vite-built assets from `/dist`
- **CORS**: Implicit handling through Vite proxy in development

### 3. Data Flow

```
User Actions → React Components → State Management → localStorage
    ↓
API Requests → Vite Proxy (dev) / Express (prod) → CSV Generation → Download
    ↓
Print Actions → PrintSchedule Component → window.print() → Browser Print Dialog
```

#### v2 Detailed Data Flow:
1. **App Initialization**: `main.tsx` → Zustand store init → localStorage v2 load/migration → Router setup
2. **Multi-Schedule Management**: Dashboard → Filter/Search (Zustand selectors) → CRUD actions → Store update → localStorage sync
3. **Form Operations**: ScheduleForm (multi-assignee) → react-hook-form validation → Store dispatch → Optimistic UI updates
4. **Table Interactions**: ScheduleTable (filtered view) → Bulk actions → Batch store updates → Auto-save
5. **Sharing Workflow**: Export button → UUID generation → PIN hash (crypto.subtle) → Store share config → Generate `/share/:id` URL
6. **Share Access**: ShareView route → Store lookup by shareId → PIN validation → Read-only render → Access count increment
7. **CSV Export**: Extended POST `/export-csv` → Backend handles schedule array with new fields → Download with category/assignee columns
8. **Print Operations**: PrintSchedule (extended) → Include assignees/categories → window.print() with enhanced CSS

**Error Boundaries**: Global error handling for migration failures, invalid shares, quota exceeded; fallback to v1 mode if critical errors.
1. **Schedule Creation/Editing**: User interacts with `ScheduleForm` → Form validation → State update → localStorage sync
2. **CSV Export**: `handleExport()` → POST `/export-csv` → Express CSV generation → Browser download
3. **CSV Import**: File input → CSV parsing in browser → State update → localStorage sync
4. **Printing**: `handlePrint()` → `PrintSchedule` component render → CSS media queries → `window.print()`

## 📦 Component Architecture

### v2 Root Component Hierarchy
```
App.tsx (Router + Store Provider)
├── BrowserRouter (react-router-dom)
├── Zustand Provider (global store)
├── Routes:
│   ├── Dashboard (default route)
│   │   ├── Search/Filter Bar (Zustand filters)
│   │   ├── Schedule Cards Grid (virtualized if >20)
│   │   └── Pagination/Empty State
│   ├── Schedule Editor (/schedule/:id)
│   │   ├── ScheduleForm (extended: multi-assignee)
│   │   └── ScheduleTable (extended: assignee filter, bulk actions)
│   └── Share View (/share/:shareId)
│       ├── PIN Validation Modal
│       ├── Read-Only ScheduleTable
│       └── Limited Export Options
├── Header (enhanced: schedule count, user menu placeholder)
├── Global Toasts (for CRUD confirmations, errors)
└── PrintSchedule (unchanged, called from table/share views)
```
```
App.tsx (Root)
├── Header (Static navigation + schedule count)
├── ScheduleForm (Conditional - Add/Edit)
├── Action Buttons (Add, Export, Print, Import)
├── Import Section (File input + CSV parsing)
├── ScheduleTable (Data display + CRUD actions)
└── PrintSchedule (Conditional - Print view)
```

### Core Components

#### `App.tsx` - v2 Router & Store Orchestrator
- **Responsibilities** (extended):
  - Initialize Zustand store with v1 migration
  - Setup react-router-dom with route protection (share PIN guard)
  - Global error boundaries and loading states
  - Coordinate between dashboard, editor, and share views
  - Handle app-wide persistence sync and quota monitoring
  - Theme provider and accessibility context

- **v2 State Management** (Zustand integration):
  - `useStore` hook access throughout components
  - Automatic subscription to store changes for UI updates
  - Migration flag to prevent repeated v1→v2 conversions
  - Share expiry cleanup (cron-like: check on app load)

- **Routing Configuration**:
  ```typescript
  // src/App.tsx routing setup
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/schedule/:id" element={<ScheduleEditor />} />
    <Route
      path="/share/:shareId"
      element={
        <ShareGuard>
          <ShareView />
        </ShareGuard>
      }
    />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
  ```
- **Responsibilities**: 
  - Initialize state from localStorage
  - Handle CRUD operations
  - Manage form visibility and editing state
  - Coordinate import/export/print actions
  - Layout orchestration
- **State Management**:
  - `schedules: Schedule[]` - Array of schedule objects
  - `editingSchedule: Schedule | null` - Currently editing schedule
  - `showForm: boolean` - Form visibility toggle
  - `isPrinting: boolean` - Print state flag

#### `ScheduleForm.tsx` - v2 Multi-Assignee Data Entry
- **v1 Responsibilities** (preserved):
  - Form validation and error handling
  - Time range validation (end > start)
  - Character counting for tasks (max 500)
  - Real-time validation feedback

- **v2 Extensions**:
  - **Multi-Assignee Support**: react-select dropdown (searchable, max 10 assignees)
  - **Schedule Metadata**: Category dropdown (Shift, Client, Location, Custom)
  - **Dynamic Entry Management**: Add/remove schedule entries with preserved state
  - **Total Duration Calculation**: Live footer showing sum across all entries
  - **react-hook-form Integration**: Full form state management with Zod validation
  - **Pre-population**: Load from store by ID; preserve assignees from previous schedules
  - **Validation Enhancements**:
    - Min 1 assignee per entry
    - No overlapping time slots for same assignees
    - Category required for new schedules
    - Total duration < 24 hours per schedule

- **Data Flow**:
  ```
  Form Input → react-hook-form → Zod Validation →
  Store Dispatch (addSchedule/updateSchedule) →
  localStorage Sync → Success Toast
  ```
- **Responsibilities**:
  - Form validation and error handling
  - Time range validation (end > start)
  - Character counting for tasks (max 500)
  - Real-time validation feedback
  - Icon integration for UX
- **Validation Rules**:
  - Name: Required, min 2 characters
  - Start/End: Required, valid time format, end > start
  - Tasks: Optional, max 500 characters
  - Date: Optional, ISO date format

#### `ScheduleTable.tsx` - v2 Enhanced Data Display & Filtering
- **v1 Responsibilities** (preserved):
  - Responsive table rendering
  - Duration calculation and display
  - Date formatting with weekday names
  - Action buttons (Edit/Delete)
  - Empty state handling

- **v2 Extensions**:
  - **Assignee Filtering**: Dropdown populated from unique assignees in current schedule
  - **Bulk Actions**: Checkbox selection (up to 50 rows) for status updates/deletes
  - **Category Display**: Badge showing schedule category in header
  - **Advanced Sorting**: Multi-column sort (time, assignee, status)
  - **Filter Persistence**: Save user preferences per schedule in localStorage
  - **Performance Optimizations**:
    - Virtual scrolling for >50 entries (react-window)
    - Debounced filtering (<100ms response)
    - Memoized row rendering
  - **Visual Enhancements**:
    - Assignee badges with initials avatars
    - Status badges (Pending/Completed) with color coding
    - Filter chips showing active criteria (e.g., "John Doe (5/12 tasks)")
    - Row highlighting for filtered results
    - Bulk selection counter in header

- **Bulk Action Workflow**:
  ```
  Checkbox Selection → "Apply to Selected" →
  Confirmation Modal → Batch Store Update →
  Auto-Save + Undo Toast → Re-render Filtered View
  ```
- **Responsibilities**:
  - Render schedules in responsive table format
  - Duration calculation and display
  - Date formatting with weekday names
  - Action buttons (Edit/Delete) with loading states
  - Empty state handling
  - Mobile optimization
- **Features**:
  - Hover effects and alternating row colors
  - Truncated task descriptions with ellipsis
  - Avatar-style housekeeper display
  - Compact time display

#### `PrintSchedule.tsx` - v2 Enhanced Print Component
- **v1 Responsibilities** (preserved):
  - Professional letterhead generation
  - Clean table layout without UI elements
  - Print-specific CSS with `color-adjust: exact`
  - Page break optimization
  - Total duration calculation

- **v2 Extensions**:
  - **Multi-Assignee Display**: Show all assignees as comma-separated list or badges
  - **Category Headers**: Include schedule category in document header
  - **Share Watermark**: Subtle "Shared View" text for exported prints
  - **Enhanced Summary**: Include assignee workload breakdown and total entries
  - **Export Formats**:
    - PDF generation (jsPDF integration for share links)
    - Extended CSV with category and assignee columns
    - iCal events (future: per entry as VEVENT for calendar import)
  - **Print Layout Improvements**:
    - Landscape option for wide assignee tables
    - Multi-page support with consistent headers/footers
    - QR code for share links (future enhancement)

- **Print Data Flow**:
  ```
  Print Button → Filter Current View →
  Generate Print-Friendly Data →
  window.print() or PDF Download →
  Browser Print Dialog
  ```
- **Responsibilities**:
  - Generate professional letterhead
  - Clean table layout without UI elements
  - Print-specific CSS with `color-adjust: exact`
  - Page break optimization
  - Total duration calculation
- **Print Features**:
  - Company branding and timestamp
  - Bullet-point task formatting
  - Summary statistics (total schedules, total duration)
  - Letter-size optimization (8.5x11")

### UI Components (shadcn/ui + v2 Custom)

**v1 Components** (preserved):
- Button, Input, Card, Table, Badge, Label, Alert

**v2 Additions & Extensions**:
- **MultiSelect.tsx**: Custom wrapper around react-select with shadcn/ui styling
  - Searchable dropdown for assignees
  - Tag display for selections
  - Validation integration with react-hook-form
  - Keyboard navigation and ARIA labels

- **FilterBar.tsx**: New component for dashboard filtering
  - Category dropdown
  - Assignee multi-select
  - Date range picker
  - Active filter chips with remove functionality
  - Debounced search input

- **ShareModal.tsx**: Modal for generating share links
  - PIN input (4 digits, masked)
  - Expiry selector (7/30/90 days)
  - Copy link button with success feedback
  - QR code generation (future)

- **DashboardCard.tsx**: Schedule listing cards
  - Schedule preview (title, category badge, entry count)
  - Last updated timestamp
  - Quick actions (view/edit/delete/archive)
  - Hover animations and loading skeletons

**Accessibility Enhancements**:
- ARIA roles for filter states and bulk selections
- Screen reader announcements for filter changes
- Keyboard navigation for multi-select (arrow keys, enter to select)
- Focus management in modals and filter bars
- **Button**: Primary/secondary actions with loading states
- **Input**: Form inputs with validation styling
- **Card**: Container components for sections
- **Table**: Data display with proper headers and rows
- **Badge**: Status indicators and counters
- **Label**: Form field labels with association
- **Alert**: Error/success notifications (not currently used)

## 🔌 API Architecture (v2 Local-First Extensions)

### Express Server (`server.js` - Extended)

**v1 Endpoints** (preserved):
- `POST /export-csv`: Generate CSV from schedule array

**v2 API Design** (localStorage wrappers + minimal backend):
The primary data operations occur client-side via Zustand/localStorage. Backend extensions are minimal and optional for advanced features.

#### Client-Side API (`src/lib/api.ts` - New)
```typescript
// Local-first API layer
export const schedulesApi = {
  // Multi-Schedule Operations
  getAll: (filters?: Filters) => useStore.getState().filteredSchedules,
  create: (schedule: Omit<Schedule, 'id'|'createdAt'|'updatedAt'>) =>
    useStore.getState().addSchedule({ ...schedule, id: uuidv4() }),
  update: (id: string, updates: Partial<Schedule>) =>
    useStore.getState().updateSchedule(id, updates),
  delete: (id: string) => useStore.getState().archiveSchedule(id),
  search: (term: string) => useStore.getState().searchSchedules(term),
  
  // Sharing Operations
  generateShare: (scheduleId: string, pin?: string, expiresDays = 7) => {
    const shareId = uuidv4();
    const pinHash = pin ? hashPin(pin) : null;
    return useStore.getState().createShare({
      id: shareId,
      scheduleId,
      pinHash,
      expiresAt: new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000),
      accessCount: 0
    });
  },
  
  validateShare: (shareId: string, pin?: string) => {
    const share = useStore.getState().getShare(shareId);
    if (!share || new Date() > share.expiresAt) return null;
    if (share.pinHash && pin && !verifyPin(pin, share.pinHash)) return null;
    return share;
  }
};

// Utility functions
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

#### Backend Extensions (`server.js` - Optional)
```javascript
// v2 Extended CSV export with new fields
app.post('/export-csv', (req, res) => {
  const { schedules, format = 'csv' } = req.body;
  
  if (format === 'csv') {
    // Extended headers: Name,Date,Start,End,Tasks,Category,Assignees
    const headers = ['Name', 'Date', 'Start', 'End', 'Tasks', 'Category', 'Assignees'];
    const csvRows = [
      headers.join(','),
      ...schedules.flatMap(schedule =>
        schedule.entries.map(entry => [
          entry.name,
          entry.date || '',
          entry.start,
          entry.end,
          entry.tasks.replace(/,/g, ';'),
          schedule.category || '',
          entry.assignees?.join(';') || ''
        ].join(','))
      )
    ];
    // ... CSV generation (extended)
  } else if (format === 'ical') {
    // Future: Generate iCal events from schedule entries
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename="schedule.ics"');
    // iCal generation logic
  }
});

// Optional: Share validation endpoint (future cloud sync)
app.get('/api/v2/share/:shareId', (req, res) => {
  const { shareId } = req.params;
  const { pin } = req.query;
  // Validate against server storage (future) or return 404 for local-only
  res.status(404).json({ error: 'Share validation requires cloud sync' });
});
```

**API Error Format** (consistent):
```json
{
  "error": "Descriptive message",
  "code": 400,
  "details": { "field": "assignees", "issue": "minimum 1 required" }
}
```

### Express Server (`server.js`)

#### Development Mode (NODE_ENV !== 'production')
- **Port**: 4000
- **Behavior**:
  - Handles `/export-csv` POST requests as fallback
  - Redirects all other requests to Vite dev server (port 3001)
  - Logs API requests for debugging
- **Proxy Setup**: Vite dev server proxies `/export-csv` to Express automatically

#### Production Mode (NODE_ENV = 'production')
- **Port**: 4000 (configurable via PORT env)
- **Behavior**:
  - Serves static files from `/dist` directory
  - Handles all routes with `index.html` SPA fallback
  - Primary handler for `/export-csv` endpoint
- **Static Serving**: Express static middleware for Vite build output

### v2 API Endpoints Summary

| Method | Endpoint | Description | v1/v2 | Client/Server |
|--------|----------|-------------|-------|---------------|
| POST | `/export-csv` | Generate CSV/PDF/iCal from schedules | Extended | Server |
| GET | `/schedules` | Get filtered schedules array | v2 | Client (localStorage) |
| POST | `/schedules` | Create new schedule | v2 | Client (store) |
| PATCH | `/schedules/:id` | Update schedule | v2 | Client (store) |
| DELETE | `/schedules/:id` | Archive schedule | v2 | Client (store) |
| POST | `/schedules/:id/share` | Generate share link | v2 | Client (store) |
| GET | `/share/:shareId` | Validate and load shared schedule | v2 | Client (store + route) |
| PATCH | `/share/:shareId/log` | Increment access count | v2 | Client (store) |

**Rate Limiting**: None for local-first; future cloud: 50 shares/day (free), unlimited (premium)
**Versioning**: v1 endpoints unchanged; v2 prefixed or client-side only

#### `POST /export-csv`
- **Purpose**: Generate and download CSV file of schedules
- **Request Body**:
  ```json
  {
    "schedules": [
      {
        "id": "string",
        "name": "string",
        "date": "string|optional",
        "start": "string",
        "end": "string",
        "tasks": "string"
      }
    ]
  }
  ```
- **Response**:
  - **200**: CSV file download (`Content-Type: text/csv`)
  - **400**: JSON error `{ error: "No schedules provided" }`
- **CSV Format**:
  ```
  Name,Date,Start,End,Tasks
  John Doe,2025-09-15,09:00,12:00,"Clean kitchen; vacuum living room; dust surfaces"
  ```
- **Processing**:
  - Validates schedules array is non-empty
  - Escapes quotes in fields
  - Replaces commas in tasks with semicolons to avoid CSV parsing issues
  - Sets proper headers for file download

## 💾 Data Model (v2 Extensions)

### v1 Schedule Interface (Preserved)
```typescript
interface ScheduleEntry {
  id: string;
  name: string;        // Housekeeper name
  date?: string;       // ISO date (optional)
  start: string;       // HH:MM format
  end: string;         // HH:MM format (> start)
  tasks: string;       // Max 500 characters
}
```

### v2 Extended Interfaces (`src/types/schedule.ts` - New)
```typescript
// Enums (new)
enum Status { Pending = 'pending', Completed = 'completed' }
enum Recurrence { None = 'none', Daily = 'daily', Weekly = 'weekly' }
enum ScheduleCategory {
  Shift = 'shift',
  Client = 'client',
  Location = 'location',
  Custom = 'custom'
}

// Extended Entry (backward compatible)
interface ScheduleEntry {
  id: string;
  time: string;        // HH:MM (replaces separate start/end for simplicity)
  task: string;        // Max 500 chars
  assignees: string[]; // NEW: Multi-assignee array (min 1, max 10)
  duration?: number;   // Minutes, auto-calculated
  status: Status;      // NEW: Pending/Completed
  notes?: string;      // NEW: Additional details
  recurrence?: Recurrence; // NEW: Repeat pattern
  createdAt: Date;
  updatedAt: Date;
  shareId?: string;    // NEW: For shareable exports
  sharePin?: string;   // NEW: Hashed PIN (mock security)
}

// Extended Schedule (array-based storage)
interface Schedule {
  id: string;          // UUID
  title: string;       // NEW: Human-readable title (replaces name)
  description?: string;// NEW: Schedule details
  category: ScheduleCategory; // NEW: Grouping (required)
  startDate: Date;     // NEW: Schedule period start
  endDate?: Date;      // NEW: Schedule period end
  entries: ScheduleEntry[]; // Extended entries
  version: number;     // NEW: Schema version (2)
  createdAt: Date;
  updatedAt: Date;
  isArchived?: boolean;// NEW: Soft delete
  assignees?: string[]; // NEW: Schedule-level team (defaults to entry assignees)
}

// Share Configuration (new)
interface ShareConfig {
  id: string;          // UUID share token
  scheduleId: string;  // References Schedule.id
  pinHash?: string;    // Hashed 4-digit PIN
  expiresAt: Date;     // 7 days default
  accessCount: number; // Usage tracking
  createdAt: Date;
  creator?: string;    // Future: User attribution
}

// Global Store Interface (Zustand)
interface MultiScheduleStore {
  schedules: Schedule[];
  shares: ShareConfig[];
  filters: {
    searchTerm: string;
    category?: ScheduleCategory;
    assignee?: string;
    dateRange?: [Date, Date];
    status?: Status;
  };
  currentScheduleId?: string;
  
  // Actions
  addSchedule: (schedule: Omit<Schedule, 'id'|'createdAt'|'updatedAt'>) => void;
  updateSchedule: (id: string, updates: Partial<Schedule>) => void;
  archiveSchedule: (id: string) => void;
  setFilters: (filters: Partial<MultiScheduleStore['filters']>) => void;
  createShare: (config: Omit<ShareConfig, 'id'|'createdAt'>) => ShareConfig;
  getShare: (shareId: string) => ShareConfig | null;
  validateShare: (shareId: string, pin?: string) => Schedule | null;
  searchSchedules: (term: string) => Schedule[];
  migrateV1Data: () => boolean; // Returns success
  cleanupExpiredShares: () => void;
}

// Validation Schemas (Zod - src/lib/validation.ts)
import { z } from 'zod';

const entrySchema = z.object({
  id: z.string().uuid(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM
  task: z.string().min(1).max(500),
  assignees: z.array(z.string().min(1).max(100)).min(1).max(10), // Names/emails
  duration: z.number().min(15).max(1440).optional(), // 15min - 24hr
  status: z.nativeEnum(Status),
  notes: z.string().max(1000).optional(),
  recurrence: z.nativeEnum(Recurrence).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  shareId: z.string().uuid().optional(),
  sharePin: z.string().optional(), // Hashed
});

const scheduleSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.nativeEnum(ScheduleCategory),
  startDate: z.date(),
  endDate: z.date().optional(),
  entries: z.array(entrySchema).min(1),
  version: z.number().min(2),
  createdAt: z.date(),
  updatedAt: z.date(),
  isArchived: z.boolean().optional(),
  assignees: z.array(z.string()).optional(),
});

const shareSchema = z.object({
  id: z.string().uuid(),
  scheduleId: z.string().uuid(),
  pinHash: z.string().optional(),
  expiresAt: z.date().min(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days min
  accessCount: z.number().min(0),
  createdAt: z.date(),
});
```

### Schedule Interface (TypeScript)
```typescript
interface Schedule {
  id: string          // Unique identifier (timestamp-based)
  name: string        // Housekeeper name (required, min 2 chars)
  date?: string       // Optional date (ISO format: YYYY-MM-DD)
  start: string       // Start time (HH:MM format)
  end: string         // End time (HH:MM format, must be > start)
  tasks: string       // Task description (max 500 chars)
}
```

### v2 Persistence Strategy

**v1 Storage** (preserved for migration):
- Key: `housekeeperSchedules`
- Format: JSON array of v1 Schedule objects
- Size: ~1-5MB typical

**v2 Storage** (new primary):
- **Key**: `hk-schedules-v2`
- **Format**: Single JSON object containing:
  ```json
  {
    "version": 2,
    "schedules": Schedule[], // Array of v2 Schedules
    "shares": ShareConfig[], // Share configurations
    "filters": { /* User preferences */ },
    "migrationCompleted": true,
    "lastBackup": "ISO timestamp"
  }
  ```
- **Size Management**: Monitor quota (5-10MB); prompt export when >80%
- **Backup Strategy**: Auto-export to downloadable JSON on quota warning
- **Future**: IndexedDB migration for >10MB datasets

**Schema Evolution**:
- v1 → v2 migration preserves all data
- Version field enables future schema changes
- Soft deletes (isArchived) prevent data loss
- Share cleanup removes expired entries weekly

**Storage API** (`src/lib/storage.ts` - New):
```typescript
// Type-safe storage wrapper
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) as T : defaultValue;
    } catch {
      console.warn(`Failed to read ${key} from localStorage`);
      return defaultValue;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Quota monitoring
      if (localStorage.length > 50) {
        console.warn('Storage quota approaching limit');
      }
    } catch (error) {
      if (error instanceof QuotaExceededError) {
        promptStorageExport();
      }
      console.error(`Failed to write ${key} to localStorage`, error);
    }
  },
  
  migrateV1: (): boolean => {
    const v1Data = storage.get<Schedule[]>('housekeeperSchedules', []);
    if (v1Data.length === 0 || storage.get<boolean>('migrationCompleted', false)) {
      return true;
    }
    
    try {
      const v2Schedules: Schedule[] = v1Data.map(entry => ({
        id: uuidv4(),
        title: entry.name || 'Migrated Schedule',
        category: ScheduleCategory.Custom,
        startDate: new Date(),
        entries: [{
          id: uuidv4(),
          time: `${entry.start}-${entry.end}`, // Combined time range
          task: entry.tasks,
          assignees: [entry.name], // Single assignee migration
          status: Status.Pending,
          createdAt: new Date(entry.createdAt || Date.now()),
          updatedAt: new Date()
        }],
        version: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      const v2Store = {
        version: 2,
        schedules: v2Schedules,
        shares: [],
        filters: {},
        migrationCompleted: true,
        lastBackup: new Date().toISOString()
      };
      
      storage.set('hk-schedules-v2', v2Store);
      localStorage.removeItem('housekeeperSchedules'); // Cleanup
      return true;
    } catch (error) {
      console.error('Migration failed:', error);
      // Fallback: Preserve v1 data, show warning
      return false;
    }
  }
};

function promptStorageExport(): void {
  // Show modal with "Export All Data" button
  // Generate full backup JSON for download
  const backup = storage.get<any>('hk-schedules-v2', {});
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hk-schedules-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```
- **Key**: `housekeeperSchedules`
- **Format**: JSON array of Schedule objects
- **Persistence**: Automatic on every state change via useEffect
- **Initialization**: Loads on app startup, defaults to empty array

### v2 CSV Import/Export Format (Extended)

**v1 Format** (backward compatible):
- Headers: `Name,Date,Start,End,Tasks`
- Single schedule export

**v2 Extended Format**:
```
Name,Date,Time,Tasks,Assignees,Category,Status,Notes,Duration
John Doe,2025-09-15,09:00-12:00,"Clean kitchen; vacuum","John Doe,Jane Smith",Client Shift,Pending,"Priority areas",180
```

**Import Validation**:
- Supports both v1 and v2 formats (auto-detect headers)
- v1 imports migrate to v2 structure during parsing
- Duplicate detection (time + assignees combination)
- Batch import with progress indicator
- Error reporting for invalid rows

**Export Options**:
- **CSV**: Full schedule export with all fields
- **PDF**: Print-optimized document with branding
- **iCal**: Calendar events (future: one event per entry)
- **JSON**: Complete data backup for migration
- **Share-Ready**: Filtered view export (current filters applied)

**Format-Specific Handling**:
```typescript
// CSV Parser (src/lib/csv.ts)
export function parseCSV(content: string, format: 'v1' | 'v2' = 'v2'): ScheduleEntry[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const isV1 = headers.includes('name') && headers.includes('start') && headers.includes('end');
  const isV2 = headers.includes('assignees') || headers.includes('category');
  
  return lines.slice(1).map((line, index) => {
    const values = parseCSVLine(line);
    try {
      if (isV1) {
        return migrateV1Entry(values, index + 2);
      } else if (isV2) {
        return parseV2Entry(values, headers, index + 2);
      }
      throw new Error('Unknown CSV format');
    } catch (error) {
      console.warn(`Row ${index + 2}: Parse error - ${error.message}`);
      return null;
    }
  }).filter(Boolean) as ScheduleEntry[];
}
```
- **Headers**: `Name,Date,Start,End,Tasks`
- **Date Format**: ISO (YYYY-MM-DD) or empty string
- **Time Format**: 24-hour (HH:MM)
- **Tasks**: Comma-separated values with semicolon escaping
- **Validation**: Skips header row automatically, ignores empty lines

## 🛠️ Build & Deployment Architecture

### Development Environment
```
Terminal 1: Vite Dev Server (port 3001)
├── Hot Module Replacement (HMR)
├── Proxy: /export-csv → Express (port 4000)
├── Network accessible (HOST=0.0.0.0)
└── Serves React app with development tools

Terminal 2: Express API Server (port 4000)
├── CSV export endpoint
├── Redirects UI requests to Vite
└── Development logging

Terminal 3: Cloudflare Tunnel
└── External access via cloudflared tunnel --url http://localhost:3001
```

### Production Environment
```
Single Server (port 4000)
├── Serves static files from /dist
├── Handles /export-csv API requests
├── SPA routing with index.html fallback
└── Optimized for Cloudflare Tunnel deployment
```

### Build Process
1. **TypeScript Compilation**: `tsc` for type checking
2. **Vite Build**: Bundles React app with code splitting
3. **Asset Optimization**: CSS minification, image optimization
4. **Output**: `/dist` directory with `index.html`, `assets/`, and JS chunks

### v2 Environment Variables (Extended)
- **PORT**: Server port (default: 4000)
- **HOST**: Server host binding (default: 0.0.0.0)
- **NODE_ENV**: Environment mode (development/production)
- **STORAGE_LIMIT_MB**: localStorage quota warning threshold (default: 8)
- **SHARE_DEFAULT_EXPIRY**: Days until share links expire (default: 7)
- **ENABLE_MIGRATION**: Allow v1→v2 data migration (default: true)
- **MOCK_PIN_HASHING**: Use crypto.subtle for PIN security (default: true)

**Feature Flags** (future cloud):
- `ENABLE_CLOUD_SYNC`: Enable server-side persistence
- `ENABLE_ANALYTICS`: Track share usage and errors
- `ENABLE_RATE_LIMITING`: Limit API calls per session
- **PORT**: Server port (default: 4000)
- **HOST**: Server host binding (default: 0.0.0.0)
- **NODE_ENV**: Environment mode (development/production)

## 🎨 Styling Architecture

### v2 Styling Architecture (Extended)

**v1 Core** (preserved):
- Design System: shadcn/ui CSS variables
- Dark Mode: Class-based implementation
- Print Styles: Media queries with `color-adjust: exact`

**v2 Color Extensions**:
```css
/* tailwind.config.js - Extended palette */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Share features
        share: {
          primary: '#8B5CF6', // Purple for share links
          background: '#F3E8FF', // Light purple
        },
        // Filter states
        filter: {
          active: '#3B82F6', // Blue for active filters
          chip: '#DBEAFE', // Light blue background
        },
        // Status colors
        status: {
          pending: '#F59E0B', // Amber
          completed: '#10B981', // Emerald
          archived: '#6B7280', // Gray
        }
      }
    }
  }
}
```

**v2 Component-Specific Styles**:
- **Dashboard Grid**: CSS Grid (3 columns desktop, 1 mobile) with card hover effects
- **Filter Chips**: Removable tags with animated removal
- **Multi-Select**: Custom scrollbar, tag-style selections, search highlight
- **Share Modal**: Backdrop blur, centered layout, copy animation
- **Loading States**: Skeleton screens for cards and table rows
- **Print Enhancements**: Landscape option, multi-page headers, QR code styling

**Responsive Breakpoints** (extended):
- `xs`: 475px (enhanced mobile)
- `sm`: 640px (table adjustments)
- `md`: 768px (filter bar layout)
- `lg`: 1024px (dashboard grid)
- `xl`: 1280px (wide table layouts)
- `2xl`: 1536px (max content width)
- **Design System**: shadcn/ui CSS variables for consistent theming
- **Dark Mode**: Class-based (`darkMode: ["class"]`)
- **Container**: Centered layout with responsive padding
- **Custom Animations**: tailwindcss-animate plugin
- **Content Scanning**: Scans `.tsx`, `.ts`, and `.html` files

### v2 Print Styles (Enhanced)
- **Media Queries**: `@media print` with v2-specific layouts
- **Multi-Assignee Layout**: Compact list or initials grid
- **Category Headers**: Prominent section dividers
- **Share Watermark**: 50% opacity "Shared Document" text
- **Page Sizing**: Letter (8.5x11") portrait, A4 support
- **Landscape Option**: `@media print and (orientation: landscape)`
- **QR Codes**: 1.5cm square for share link scanning
- **Multi-Page Support**: Running headers with page numbers
- **Color Printing**: Status badges retain colors (`color-adjust: exact`)

**Print CSS Extensions** (`src/index.css`):
```css
@media print {
  .no-print { display: none !important; }
  .print-landscape {
    width: 100%;
    height: 100%;
    writing-mode: tb-rl;
  }
  .share-watermark {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    opacity: 0.1;
    font-size: 4rem;
    color: #6b7280;
    z-index: -1;
  }
  .category-header {
    break-before: page;
    border-top: 3px solid #3b82f6;
    padding-top: 1rem;
    font-weight: bold;
    font-size: 1.2rem;
  }
  .assignee-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    font-size: 0.875rem;
  }
  .assignee-badge {
    background: #f3f4f6;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    color-adjust: exact;
  }
}
```
- **Media Queries**: `@media print` for print-specific layouts
- **Color Management**: `color-adjust: exact` for consistent printing
- **Page Layout**: Optimized for letter-size paper
- **No UI Elements**: Hides buttons, forms, and navigation in print view

### Responsive Design
- **Breakpoints**: Tailwind default (sm, md, lg, xl, 2xl)
- **Mobile First**: Base styles for mobile, progressive enhancement
- **Flexible Layouts**: CSS Grid and Flexbox for adaptive layouts
- **Touch Targets**: Minimum 44px touch targets for mobile

## 🔒 Security Considerations

### Frontend Security
- **Input Validation**: Client-side validation with server fallback
- **XSS Prevention**: React automatic escaping, no `dangerouslySetInnerHTML`
- **CORS**: Handled by Vite proxy in development
- **File Upload**: CSV import with content-type validation

### Backend Security
- **Request Validation**: JSON body parsing with schedule array validation
- **No Database**: Stateless API, no persistent storage
- **Rate Limiting**: Not implemented (low-risk use case)
- **Headers**: Proper Content-Type and Content-Disposition for downloads

### Data Privacy
- **Local Storage**: Client-side only, no server persistence
- **No Tracking**: No analytics or user tracking
- **Export Security**: CSV contains only schedule data, no sensitive information

## 🧪 Testing Strategy

### Current Testing (Implicit)
- **Unit Tests**: None implemented (future: React Testing Library)
- **Integration Tests**: Manual testing of full workflows
- **E2E Tests**: None implemented (future: Playwright/Cypress)
- **Visual Testing**: Manual browser testing across devices

### v2 Testing Strategy (Comprehensive)

**Current Testing** (v1 - minimal):
- Manual testing of core workflows
- No automated tests implemented

**v2 Testing Requirements** (95% coverage target):

#### Unit Tests (Jest + React Testing Library)
1. **Store Tests** (`src/lib/store.test.ts`):
   - Zustand actions (CRUD, filtering, sharing)
   - Migration logic (v1→v2 data transformation)
   - Share validation (PIN matching, expiry handling)
   - Selector performance (no unnecessary re-renders)

2. **Component Tests**:
   - **ScheduleForm**: Multi-assignee validation, dynamic entry management
   - **ScheduleTable**: Filtering, bulk actions, virtualization
   - **Dashboard**: Search debouncing, pagination, empty states
   - **ShareView**: PIN modal, read-only enforcement, expiry handling

3. **Utility Tests**:
   - CSV parsing (v1/v2 formats, error cases)
   - Storage API (quota handling, migration)
   - Validation schemas (Zod edge cases)
   - PIN hashing (crypto.subtle integration)

#### Integration Tests
1. **End-to-End Workflows**:
   - Create schedule → Add entries → Filter by assignee → Bulk update → Share → Access shared view
   - v1 Migration: Load v1 data → Auto-migrate → Verify data integrity
   - Export flows: CSV/PDF with extended fields, format validation
   - Print preview: Layout consistency across browsers

2. **State Synchronization**:
   - Store updates trigger correct localStorage writes
   - Filter changes update UI without full re-renders
   - Share creation updates both store and URL

#### E2E Tests (Cypress/Playwright)
1. **User Journeys**:
   - Admin: Dashboard → Create multi-schedule → Assign team → Export
   - Team Lead: Filter by assignee → Bulk status update → Print
   - Share Recipient: Access link → Enter PIN → View only → Export options

2. **Edge Cases**:
   - Storage quota exceeded → Export prompt → Continue workflow
   - Invalid share link → 404 page → Navigation options
   - Large dataset (100+ entries) → Performance thresholds
   - Offline mode → localStorage operations → Sync on reconnect

#### Performance Testing
- **Bundle Analysis**: Webpack Bundle Analyzer for new dependencies
- **Render Performance**: React DevTools Profiler for filter updates
- **Load Testing**: 50 schedules with 10 entries each → <1s dashboard load
- **Memory Usage**: Monitor localStorage growth patterns

#### Accessibility Testing
- **Automated**: axe-core integration in CI
- **Manual**: Screen reader testing (NVDA/VoiceOver)
- **Keyboard**: Full navigation without mouse
- **Contrast**: WCAG AA compliance for new colors

#### Security Testing
- **PIN Hashing**: Verify crypto.subtle usage, no plain-text storage
- **XSS Prevention**: Sanitize all user inputs (tasks, assignees)
- **Share Expiry**: Test cleanup and access prevention
- **Quota Handling**: Prevent localStorage DoS via excessive writes

**Test Configuration** (`package.json` scripts):
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "cypress run",
    "test:perf": "jest --projects perf",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.3",
    "@testing-library/react": "^14.0.0",
    "@types/jest": "^29.5.5",
    "cypress": "^13.6.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "ts-jest": "^29.1.1",
    "axe-core": "^4.8.2"
  }
}
```

**Testing Pyramid**:
- 70% Unit Tests (store, utilities, components)
- 20% Integration Tests (component interactions, API flows)
- 10% E2E Tests (critical user journeys)

**CI/CD Integration**:
- Run tests on every PR
- Coverage threshold: 95% for new code
- Performance budget: Bundle size < 500KB gzipped
- Accessibility score: 100% with axe-core
1. **Component Tests**: Test ScheduleForm validation, ScheduleTable rendering
2. **API Tests**: Test /export-csv endpoint with various inputs
3. **CSV Parsing**: Test import functionality with edge cases
4. **Print Testing**: Automated screenshot testing for print layouts

## 🚀 Deployment Architecture

### Cloudflare Tunnel (Recommended)
```
Cloudflare Tunnel → Express Server (port 4000) → Static Files + API
    ↓
    External Access: https://your-subdomain.trycloudflare.com
```

#### Setup Steps:
1. **Build Production**: `npm run build`
2. **Start Server**: `npm start`
3. **Create Tunnel**: `cloudflared tunnel --url http://localhost:4000`
4. **Named Tunnel**: Configure `~/.cloudflared/config.yml` with custom domain

### v2 Deployment Architecture (Cloud-Ready)

**v1 Deployment** (preserved):
- Cloudflare Tunnel (primary)
- Static hosting (Vercel/Netlify - frontend only)
- Node.js platforms (Heroku, DigitalOcean)

**v2 Deployment Considerations**:
- **Bundle Size**: New dependencies add ~150KB (Zustand + Router + Select)
- **Server Requirements**: Minimal increase (optional share validation endpoint)
- **Environment**: localStorage compatibility across all browsers
- **CORS**: Extended origins for share link access

**Enhanced Cloudflare Tunnel Setup**:
```yaml
# ~/.cloudflared/config.yml
tunnel: hk-schedules-v2
credentials-file: /path/to/credentials.json

ingress:
  - hostname: schedules.yourdomain.com
    service: http://localhost:4000
  - service: http_status:404
```

**Docker Configuration** (updated):
```dockerfile
# Dockerfile (v2)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production && npm cache clean --force
EXPOSE 4000
ENV NODE_ENV=production
CMD ["node", "server.js"]
```

**Cloud Deployment Options**:

1. **Vercel (Recommended for v2)**:
   - Frontend: Automatic Vite optimization
   - Backend: Serverless functions for `/api/*` endpoints
   - localStorage: Client-side only (no server sync needed)
   - Custom domains and SSL included

2. **Netlify**:
   - Similar to Vercel, with Netlify Functions for API
   - Edge caching for static assets
   - Form handling for future feedback collection

3. **Railway/DigitalOcean App Platform**:
   - Full Node.js environment for Express server
   - Automatic scaling and health checks
   - Environment variables management
   - Database integration ready for future cloud sync

**Production Checklist**:
- [ ] Build with `npm run build`
- [ ] Test production preview: `npm run preview`
- [ ] Verify localStorage migration works
- [ ] Test share links across domains
- [ ] Monitor bundle size and performance budget
- [ ] Set up error tracking (Sentry integration)
- [ ] Configure custom domain and SSL
- [ ] Document deployment URL for team
- **Vercel/Netlify**: Frontend-only (requires API rewrite)
- **Heroku/DigitalOcean**: Full-stack deployment with Node.js
- **Docker**: Containerized deployment for consistent environments

### Docker Configuration (Future)
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "start"]
```

## 📊 Performance Considerations

### Frontend Performance
- **Bundle Size**: Vite tree-shaking and code splitting
- **Loading States**: Skeleton screens and loading spinners
- **Lazy Loading**: Future: Dynamic imports for large components
- **Image Optimization**: No images currently, but ready for WebP/AVIF

### Backend Performance
- **Memory Usage**: Minimal - CSV generation in memory
- **CPU Usage**: Low - Simple string manipulation for CSV
- **Scalability**: Horizontal scaling via multiple Express instances

### Print Performance
- **DOM Size**: Optimized table rendering for large datasets
- **CSS Specificity**: Minimal selectors for fast print rendering
- **Page Breaks**: CSS `page-break-inside: avoid` for table rows

## 🔄 Maintenance & Extensibility

### v2 Maintenance & Extensibility (Enhanced)

**Core Principles** (extended):
- **Backward Compatibility**: All v1 features preserved and accessible
- **Incremental Development**: New features behind feature flags where possible
- **Migration Safety**: Automated data transformation with fallback options
- **Performance Budget**: Monitor bundle size and render performance
- **Accessibility First**: All new components WCAG AA compliant

### Adding v2+ Features

1. **New Components**:
   ```typescript
   // Feature-based organization
   src/
   ├── components/
   │   ├── dashboard/     # v2 Dashboard components
   │   │   ├── Card.tsx
   │   │   └── FilterBar.tsx
   │   ├── sharing/       # v2 Share components
   │   │   ├── ShareModal.tsx
   │   │   └── ShareView.tsx
   │   └── v1-components/ # Legacy components (preserved)
   ```

2. **Store Extensions** (Zustand slices):
   ```typescript
   // src/lib/store.ts - Modular slices
   import { create } from 'zustand';
   import { devtools, persist } from 'zustand/middleware';
   
   interface ScheduleSlice {
     schedules: Schedule[];
     addSchedule: (schedule: Schedule) => void;
     // ... schedule actions
   }
   
   interface ShareSlice {
     shares: ShareConfig[];
     createShare: (config: ShareConfig) => ShareConfig;
     // ... share actions
   }
   
   interface FilterSlice {
     filters: Filters;
     setFilters: (filters: Partial<Filters>) => void;
     // ... filter actions
   }
   
   const useStore = create<ScheduleSlice & ShareSlice & FilterSlice>()(
     devtools(
       persist(
         (set, get) => ({
           // Initial state and actions
           schedules: [],
           shares: [],
           filters: { searchTerm: '' },
           // ... all actions
         }),
         { name: 'hk-schedules-v2' }
       )
     )
   );
   ```

3. **API Extensions**:
   - Client-side APIs first (localStorage/Zustand)
   - Server endpoints only for cross-cutting concerns
   - Versioned endpoints (`/api/v2/*`)
   - Type-safe API clients with generated types

4. **Type Evolution**:
   ```typescript
   // src/types/index.ts - Central type registry
   export * from './schedule';
   export * from './share';
   export * from './validation';
   
   // Utility types for v2
   export type MigrateV1Entry = (v1Entry: any) => ScheduleEntry;
   export type FilterSchedules = (schedules: Schedule[], filters: Filters) => Schedule[];
   export type ShareValidator = (shareId: string, pin?: string) => Schedule | null;
   ```

### Code Organization Guidelines (v2)

**Feature Slices**:
```
src/
├── components/          # UI Components (feature folders)
│   ├── dashboard/
│   ├── schedule/
│   ├── sharing/
│   └── ui/             # shadcn/ui components
├── lib/                # Business logic and utilities
│   ├── store.ts        # Zustand global store
│   ├── api.ts          # Client-side API layer
│   ├── storage.ts      # Persistence abstraction
│   ├── validation.ts   # Zod schemas
│   └── utils.ts        # Shared utilities (preserved)
├── types/              # TypeScript definitions
│   ├── schedule.ts
│   ├── share.ts
│   └── index.ts
├── hooks/              # Custom React hooks
│   ├── useSchedule.ts
│   ├── useShare.ts
│   └── useFilters.ts
└── routes/             # Route configurations (future)
```

**Migration Safety**:
- Always preserve v1 data before transformation
- Provide fallback to v1 mode on migration failure
- Document schema changes in CHANGELOG.md
- Test migrations with real v1 datasets

**Performance Guidelines**:
- Use Zustand selectors for granular re-renders
- Virtualize lists with >20 items (react-window or TanStack Virtual)
- Debounce all search/filter inputs (300ms)
- Memoize expensive computations (duration totals, filtering)
- Monitor with React DevTools Profiler
1. **New Components**: Place in `src/components/` with TypeScript interfaces
2. **API Endpoints**: Add to `server.js` with proper error handling
3. **UI Components**: Add shadcn/ui components via CLI
4. **Styling**: Extend Tailwind config for custom utilities

### Code Organization Guidelines
- **Components**: Feature-based folders in `src/components/`
- **Utilities**: `src/lib/utils.ts` for shared functions
- **Types**: Inline interfaces with components or in `src/types/`
- **Constants**: Define in component files or shared config

### v2 Versioning Strategy (Enhanced)

**SemVer Implementation**:
- **Major** (2.x): Breaking changes to data model or core architecture
- **Minor** (2.x.y): New features (multi-schedule, sharing) without breaking changes
- **Patch** (2.x.y.z): Bug fixes, performance improvements

**Migration Strategy**:
```
v1.0 → v2.0 (Current)
├── Data: Single schedule → Array of schedules
├── State: useState → Zustand global store
├── Routing: None → react-router-dom SPA
├── Persistence: Simple localStorage → Structured v2 key
└── Features: Single-user → Team collaboration ready
```

**Future Evolution Path**:
```
v2.1: Cloud sync integration (optional backend)
v2.2: Real-time collaboration (WebSockets)
v3.0: Full authentication and user management
v3.1: Advanced analytics and reporting
```

**Changelog Structure**:
```markdown
## [2.0.0] - 2025-09-14
### Added
- Multi-schedule dashboard with search and filtering
- Team assignment with multi-assignee support
- Shareable export links with PIN protection
- Zustand global state management
- react-router-dom SPA navigation

### Changed
- Data model evolution (backward compatible)
- localStorage schema v2 with migration
- Extended CSV export format

### Migration
- Automatic v1→v2 data migration on first load
- Fallback to v1 mode if migration fails
- Backup export available for manual recovery
```

**Dependency Policy** (updated):
- **Pinned Versions**: All production dependencies
- **Quarterly Updates**: Security patches and minor releases
- **Deprecation Handling**: 6-month grace period for breaking changes
- **Audit Regularity**: `npm audit` weekly in CI
- **Bundle Monitoring**: Track size impact of new dependencies
- **SemVer**: Follow semantic versioning for releases
- **Changelog**: Maintain CHANGELOG.md for user-facing changes
- **Dependencies**: Regular updates via `npm outdated` and testing

## 🛠️ Development Workflow

### Local Development
```bash
# Terminal 1: Frontend
HOST=0.0.0.0 npm run dev

# Terminal 2: Backend  
npm start

# Terminal 3: Tunnel (optional)
cloudflared tunnel --url http://localhost:3001
```

### Component Development
1. **Add shadcn/ui Component**:
   ```bash
   npx shadcn-ui@latest add dialog
   ```
2. **Create Custom Component**:
   ```typescript
   // src/components/my-feature/MyComponent.tsx
   import * as React from "react"
   // Component implementation
   ```
3. **Update Types**: Add interfaces to relevant component files
4. **Test Integration**: Manual testing in development environment

### v2 Release Process (Streamlined)

1. **Preparation**:
   ```bash
   # Update version and changelog
   npm version minor  # or patch/major
   # Update CHANGELOG.md with release notes
   git add CHANGELOG.md
   git commit -m "docs: update changelog for v2.0.0"
   ```

2. **Testing**:
   ```bash
   # Full test suite
   npm run test
   npm run test:e2e
   npm run type-check
   npm run lint
   
   # Performance and bundle analysis
   npm run build
   npm run preview
   
   # Manual testing
   # - v1 migration with sample data
   # - Multi-schedule workflows
   # - Share link generation and access
   # - Print/export formats
   # - Mobile responsiveness
   # - Accessibility checks
   ```

3. **Build & Deploy**:
   ```bash
   # Production build
   npm run build
   
   # Deploy to hosting platform
   # Vercel: git push (automatic)
   # Cloudflare: Update tunnel configuration
   # Railway: Railway deploy
   
   # Verify deployment
   curl -I https://your-app-domain.com
   # Test critical paths in production
   ```

4. **Post-Release**:
   - Monitor error rates and performance metrics
   - Collect user feedback on new features
   - Document migration success rate
   - Plan v2.1 features based on usage data
   - Update user documentation and tutorials

**Release Checklist**:
- [ ] All tests passing (95%+ coverage)
- [ ] TypeScript compilation without errors
- [ ] Bundle size within budget (<500KB gzipped)
- [ ] v1 migration tested with real data
- [ ] Share security verified (PIN hashing, expiry)
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Mobile testing (iOS Safari, Android Chrome)
- [ ] Accessibility audit passed
- [ ] Production deployment verified
- [ ] Monitoring and error tracking configured
- [ ] User documentation updated
- [ ] Migration success metrics tracked
1. **Update Version**: `npm version patch/minor/major`
2. **Build Production**: `npm run build`
3. **Test Production**: `npm run preview`
4. **Deploy**: Update Cloudflare tunnel or push to hosting platform
5. **Document Changes**: Update README.md and CHANGELOG.md

---

## 📋 Glossary (v2 Updated)

**Core Terms**:
- **Brownfield Architecture**: Incremental enhancement of existing codebase (80% reuse)
- **Local-First**: Primary data storage and operations occur client-side (localStorage)
- **Multi-Schedule**: Array-based storage enabling multiple independent schedules
- **ShareConfig**: Security and expiry metadata for shareable export links
- **Zustand Store**: Global React state management with persistence middleware
- **SPA Routing**: Single-page application navigation without full page reloads

**Technical Terms**:
- **HMR**: Hot Module Replacement - Vite's fast development reload
- **SSR**: Server-Side Rendering (not implemented, CSR only)
- **CSR**: Client-Side Rendering - React hydration after initial HTML load
- **Zod**: TypeScript-first schema validation and form library
- **Crypto.subtle**: Web Crypto API for secure PIN hashing (mock auth)
- **react-window**: Virtualization library for large lists/tables

**Data Model Terms**:
- **ScheduleEntry**: Individual task with time, assignees, status
- **Schedule**: Container for multiple entries with metadata (title, category)
- **ShareId**: UUID token for accessing shared schedules
- **PinHash**: SHA-256 hash of 4-digit PIN for share protection
- **isArchived**: Soft delete flag (preserves data, hides from UI)

**User Experience Terms**:
- **Filter Chips**: Visual representation of active filters with remove functionality
- **Bulk Actions**: Multi-row operations (status updates, deletes)
- **Optimistic Updates**: UI changes before server/store confirmation
- **Undo Toast**: Temporary action reversal with 5-second window
- **Loading Skeleton**: Placeholder UI during data fetching/processing

**Deployment Terms**:
- **Cloudflare Tunnel**: Secure tunneling for local development exposure
- **Vite Proxy**: Development server proxying API calls to Express
- **SPA Fallback**: Serve index.html for all routes (client-side routing)
- **QuotaExceededError**: Browser localStorage capacity limit reached

- **HMR**: Hot Module Replacement - Vite's fast development reload
- **SPA**: Single Page Application - React app with client-side routing
- **shadcn/ui**: Component library built on Radix UI and Tailwind CSS
- **localStorage**: Browser API for persistent client-side storage
- **Cloudflare Tunnel**: Secure tunneling service for exposing local servers

## 🔗 Related Documentation (v2)

**Core Documents**:
- **[Product Requirements](PRD/brownfield-multi-user-prd.md)**: Detailed v2 feature specifications
- **[Epic Specification](EPICS/brownfield-multi-user-epic.md)**: High-level v2 implementation plan
- **[Migration Guide](docs/migration-v1-to-v2.md)**: Data transformation and compatibility details
- **[User Guide](README.md)**: End-user instructions (updated for v2 features)
- **[API Reference](docs/api-v2.md)**: Client and server endpoint documentation

**Technical References**:
- **[Store Implementation](src/lib/store.ts)**: Zustand configuration and slices
- **[Validation Schemas](src/lib/validation.ts)**: Zod schemas for data integrity
- **[Storage Layer](src/lib/storage.ts)**: localStorage abstraction and migration
- **[Component Architecture](src/components/)**: Feature-based component organization
- **[Testing Strategy](docs/testing-v2.md)**: Unit, integration, and E2E test plans

**External Resources**:
- **[Zustand Documentation](https://docs.pmnd.rs/zustand/)**: Global state management
- **[react-router-dom Guide](https://reactrouter.com/en/main)**: SPA routing patterns
- **[Zod Validation](https://zod.dev/)**: Type-safe schema declaration
- **[Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)**: Secure PIN hashing
- **[localStorage Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)**: Browser storage limits and patterns

**Deployment & Monitoring**:
- **[Vercel Deployment](https://vercel.com/docs)**: Frontend hosting and serverless functions
- **[Cloudflare Tunnel Setup](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)**: Secure local exposure
- **[Sentry Integration](https://docs.sentry.io/platforms/javascript/guides/react/)**: Error tracking (future)
- **[Bundle Analysis](https://www.npmjs.com/package/webpack-bundle-analyzer)**: Performance monitoring

*Architecture documentation updated for v2.0: September 2025*
*Next review scheduled: December 2025 (v2.1 planning)*

- [User Guide](README.md#usage-guide) - End-user instructions
- [Troubleshooting](README.md#troubleshooting) - Common issues and solutions
- [Deployment](README.md#cloudflare-tunnel-setup) - Production deployment steps
- [API Reference](server.js) - Backend endpoint implementation

*Architecture documentation last updated: September 2025*