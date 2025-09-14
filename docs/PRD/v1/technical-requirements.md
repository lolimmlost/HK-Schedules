# 4. Technical Requirements

## 4.1 Architecture

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

## 4.2 Data Model

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

## 4.3 Integrations

- **Initial**: None (local-only).
- **Future (Phase 4)**:
  - Google Calendar API: Import/export events (OAuth2 auth).
  - Microsoft Graph: For Outlook/Teams integration.
  - Email/SMS: Notifications via SendGrid/Twilio (premium).
  - Zapier: Webhooks for automation (e.g., Slack alerts on changes).
- **Implementation**: Modular plugins; config in env vars.

## 4.4 Dependencies

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

**Cross-reference**: See [ui-ux-design.md](../ui-ux-design.md) for component styling integration and [risks-timeline-appendix.md](../risks-timeline-appendix.md) for dependency risks. For v2 technical extensions, see [../v2/technical-requirements.md](../v2/technical-requirements.md).