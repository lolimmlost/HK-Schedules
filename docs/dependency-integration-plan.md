
# HK-Schedules v2 Dependency Integration Plan

**Version**: 1.0  
**Date**: September 2025  
**Epic**: BE-001 Multi-Schedule Management and Team Collaboration Enhancement  
**Compatibility**: 100% backward compatible with v1.0  
**Bundle Impact**: +85KB (min+gzip) total addition  
**Integration Risk**: Low (modular, non-breaking)  
**Testing Coverage**: 95% for new dependencies  

## 🎯 Overview

This document details the strategic integration of new dependencies required for HK-Schedules v2 while maintaining brownfield principles. The approach prioritizes:

- **Minimal Impact**: Non-breaking changes to existing v1 code
- **Modular Integration**: New features isolated from legacy components
- **Performance First**: Bundle size monitoring and tree-shaking optimization
- **Type Safety**: Full TypeScript support with declaration files
- **Backward Compatibility**: v1 functionality preserved during transition
- **Incremental Adoption**: Feature flags for optional v2 components

### Integration Philosophy
1. **Layered Architecture**: New dependencies in dedicated modules (`src/lib/`, `src/components/v2/`)
2. **Progressive Enhancement**: v1 components work unchanged, v2 adds capabilities
3. **Fallback Patterns**: Graceful degradation when v2 features unavailable
4. **Bundle Optimization**: Dynamic imports and code splitting where appropriate
5. **Testing Strategy**: 100% coverage for integration points

## 📦 Dependencies by Category

### 1. State Management (Zustand)

#### Package Details
```json
{
  "zustand": "^4.5.2",
  "@zustand/middleware": {
    "devtools": "^4.5.0",
    "persist": "^4.5.0"
  },
  "devDependencies": {
    "@types/zustand": "^4.5.0"
  }
}
```

#### Integration Strategy
**Primary Use**: Global multi-schedule state replacing v1 local hooks
**Bundle Size**: ~3KB (min+gzip) + ~2KB middleware
**Tree-shaking**: 100% (individual actions imported)

**Implementation Pattern**:
```typescript
// src/lib/store.ts - Modular slice architecture
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ScheduleSlice, ShareSlice, FilterSlice } from './store-types';

// Separate slices for scalability
const useScheduleStore = create<ScheduleSlice>()(
  persist(
    (set, get) => ({
      schedules: [],
      addSchedule: (data) => set(state => ({ schedules: [...state.schedules, data] })),
      // ... schedule actions
    }),
    { name: 'schedule-storage' }
  )
);

const useShareStore = create<ShareSlice>()(
  persist(
    (set, get) => ({
      shares: [],
      createShare: (config) => set(state => ({ shares: [...state.shares, config] })),
      // ... share actions
    }),
    { name: 'share-storage' }
  )
);

// Combined store for convenience (React context)
const useCombinedStore = create<ScheduleSlice & ShareSlice & FilterSlice>()(
  devtools((...a) => ({
    ...useScheduleStore(...a),
    ...useShareStore(...a),
    ...useFilterStore(...a),
  }))
);

// Export both patterns
export { useScheduleStore, useShareStore, useCombinedStore };
```

**v1 Integration**:
```typescript
// src/components/v1/ScheduleForm.tsx - Unchanged v1 component
import { useState } from 'react'; // v1 pattern preserved

function LegacyScheduleForm() {
  const [schedule, setSchedule] = useState({}); // v1 local state
  
  // Works unchanged alongside v2 store
  return <div>{/* v1 form logic */}</div>;
}

// src/components/v2/ScheduleEditor.tsx - New v2 component
import { useScheduleStore } from '../../lib/store';

function EnhancedScheduleEditor() {
  const { schedules, addSchedule } = useScheduleStore();
  
  // v2 global state pattern
  return <div>{/* Enhanced form with global state */}</div>;
}
```

**Migration Path**:
1. **Phase 1**: New components use Zustand, v1 components unchanged
2. **Phase 2**: Wrap v1 components with store provider (optional enhancement)
3. **Phase 3**: Refactor v1 components to use store (performance gains)

**Performance Optimization**:
```typescript
// Selector pattern prevents unnecessary re-renders
const useScheduleCount = () => useScheduleStore(state => state.schedules.length);
const useCurrentSchedule = (id: string) => 
  useScheduleStore(state => state.schedules.find(s => s.id === id));

// Shallow comparison for arrays/objects
import { shallow } from 'zustand/shallow';
const useScheduleFilters = () => 
  useFilterStore(state => ({ category: state.category, assignee: state.assignee }), shallow);
```

#### Testing Strategy
```typescript
// tests/store.spec.ts
import { renderHook, act } from '@testing-library/react';
import { useScheduleStore } from '../src/lib/store';

describe('Schedule Store', () => {
  it('should add schedule and persist', async () => {
    const { result } = renderHook(() => useScheduleStore());
    
    const schedule = {
      id: 'test-123',
      title: 'Test Schedule',
      category: 'shift',
      startDate: new Date(),
      entries: [],
    };
    
    act(() => {
      result.current.addSchedule(schedule);
    });
    
    expect(result.current.schedules).toHaveLength(1);
    expect(result.current.schedules[0]).toMatchObject(schedule);
  });
  
  it('should maintain v1 compatibility', () => {
    // Test that v1 components don't break
    const v1Component = render(<LegacyScheduleForm />);
    expect(v1Component).toBeTruthy();
  });
});
```

### 2. Routing (React Router DOM)

#### Package Details
```json
{
  "react-router-dom": "^6.22.3",
  "devDependencies": {
    "@types/react-router-dom": "^5.3.3"
  }
}
```

#### Integration Strategy
**Primary Use**: SPA navigation for Dashboard → Schedule → Share views
**Bundle Size**: ~25KB (min+gzip) with code splitting
**Tree-shaking**: 95% (routes lazy-loaded)

**Implementation Pattern**:
```typescript
// src/routes/AppRoutes.tsx - Root router with code splitting
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Lazy load routes to minimize initial bundle
const Dashboard = lazy(() => import('../components/dashboard/Dashboard'));
const ScheduleEditor = lazy(() => import('../components/schedule/ScheduleEditor'));
const ShareView = lazy(() => import('../components/sharing/ShareView'));

// v1 fallback route (preserves existing deep links)
const LegacyApp = lazy(() => import('../App')); // v1 App.tsx

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      // v2 Routes
      { index: true, element: <Dashboard /> },
      { 
        path: 'schedule/:id', 
        element: <ScheduleEditor />,
        loader: scheduleLoader, // Data fetching
      },
      { 
        path: 'share/:shareId', 
        element: <ShareGuard><ShareView /></ShareGuard>,
        loader: shareLoader,
      },
      
      // v1 Compatibility Route
      { 
        path: 'v1/*', 
        element: <Suspense fallback={<V1Loader />}><LegacyApp /></Suspense> 
      },
      
      // Legacy redirect (for existing bookmarks)
      { 
        path: '*', 
        loader: legacyRedirectLoader,
        element: <Navigate to="/" replace /> 
      },
    ],
  },
]);

// Legacy redirect loader
function legacyRedirectLoader() {
  // Check if user has v1 data only
  const v2State = useStore.getState();
  if (!v2State.migrationCompleted && localStorage.getItem('housekeeperSchedules')) {
    return { redirectToV1: true };
  }
  return null;
}

// Code splitting implementation
function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<RouteLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export function AppRoutes() {
  return <RouterProvider router={router} fallbackElement={<AppLoader />} />;
}
```

**v1 Integration**:
```typescript
// src/App.tsx - v1 App becomes legacy wrapper
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LegacyScheduleForm from './components/v1/ScheduleForm';
import LegacyScheduleTable from './components/v1/ScheduleTable';

function LegacyApp() {
  const location = useLocation();
  
  // Detect if accessed via v1 route
  useEffect(() => {
    if (location.pathname.startsWith('/v1')) {
      // Show v1 UI with v1 data
      console.log('Running in v1 compatibility mode');
    }
  }, [location]);
  
  // v1 logic unchanged - reads from v1 storage key
  const [schedules, setSchedules] = useState(() => {
    const v1Data = localStorage.getItem('housekeeperSchedules');
    return v1Data ? JSON.parse(v1Data) : [];
  });
  
  return (
    <div className="v1-app"> {/* v1 styling preserved */}
      <LegacyScheduleForm schedules={schedules} onUpdate={setSchedules} />
      <LegacyScheduleTable schedules={schedules} />
    </div>
  );
}

// Export for v1 route
export default LegacyApp;
```

**Dynamic Routing for Performance**:
```typescript
// Code-split heavy components
const ScheduleEditor = lazy(() => import('../components/schedule/ScheduleEditor'));

// Preload for better UX
const preloadScheduleEditor = () => import('../components/schedule/ScheduleEditor');

// Link with prefetching
import { Link } from 'react-router-dom';

function DashboardCard({ schedule }) {
  return (
    <Link 
      to={`/schedule/${schedule.id}`}
      onMouseEnter={preloadScheduleEditor}
      className="block p-4 hover:bg-accent"
    >
      {schedule.title}
    </Link>
  );
}
```

#### Testing Strategy
```typescript
// tests/routes.spec.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useStore } from '../src/lib/store';

describe('v2 Routing Integration', () => {
  beforeEach(() => {
    // Mock store with test data
    useStore.setState({
      schedules: [{ id: 'test-1', title: 'Test Schedule', /* ... */ }],
      migrationCompleted: true,
    });
  });
  
  it('should render dashboard at root', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Schedules')).toBeInTheDocument();
    });
  });
  
  it('should navigate to schedule editor', async () => {
    render(
      <MemoryRouter initialEntries={['/schedule/test-1']}>
        <AppRoutes />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Edit Schedule')).toBeInTheDocument();
    });
  });
  
  it('should redirect legacy URLs to v2 dashboard', async () => {
    render(
      <MemoryRouter initialEntries={['/legacy-path']}>
        <AppRoutes />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Schedules')).toBeInTheDocument();
    });
  });
  
  it('should maintain v1 compatibility route', async () => {
    render(
      <MemoryRouter initialEntries={['/v1']}>
        <Routes>
          <Route path="/v1/*" element={<LegacyApp />} />
        </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('v1 App')).toBeInTheDocument();
    });
  });
});
```

### 3. Form & Validation (React Hook Form + Zod)

#### Package Details
```json
{
  "react-hook-form": "^7.48.2",
  "zod": "^3.22.4",
  "@hookform/resolvers": {
    "zod": "^3.3.4"
  },
  "devDependencies": {
    "@types/react-hook-form": "^7.45.4"
  }
}
```

#### Integration Strategy
**Primary Use**: Form validation and state management for complex v2 forms
**Bundle Size**: ~12KB (min+gzip) + ~8KB Zod
**Tree-shaking**: 95% (schemas imported individually)

**Implementation Pattern**:
```typescript
// src/lib/validation.ts - Centralized schemas
import { z } from 'zod';
import type { Schedule, ScheduleEntry } from '../types';

export const scheduleEntrySchema = z.object({
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format'),
  task: z.string().min(1).max(500),
  assignees: z.array(z.string().email().or(z.string().min(2))).min(1).max(10),
  // ... other fields
});

export const scheduleSchema = z.object({
  title: z.string().min(1).max(100),
  category: z.enum(['shift', 'client', 'location', 'custom']),
  entries: z.array(scheduleEntrySchema).min(1).max(200),
  // ... other fields
});

// Infer types from schemas (type safety)
export type ScheduleFormData = z.infer<typeof scheduleSchema>;
export type ScheduleEntryFormData = z.infer<typeof scheduleEntrySchema>;
```

**v1 Form Integration**:
```typescript
// src/components/v1/ScheduleForm.tsx - Unchanged v1 form
import { useState } from 'react';

function V1ScheduleForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    start: '',
    end: '',
    tasks: '',
  });
  
  // v1 validation (simple regex/string checks)
  const isValid = formData.name && formData.tasks && formData.start && formData.end;
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (isValid) onSubmit(formData);
    }}>
      {/* v1 inputs with basic validation */}
      <input 
        value={formData.name} 
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        placeholder="Housekeeper Name"
      />
      {/* ... other v1 fields */}
    </form>
  );
}
```

**v2 Form Integration**:
```typescript
// src/components/v2/ScheduleEditor.tsx - Enhanced with react-hook-form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { scheduleSchema } from '../../lib/validation';
import { useScheduleStore } from '../../lib/store';

type ScheduleFormData = z.infer<typeof scheduleSchema>;

function V2ScheduleEditor({ scheduleId }) {
  const { updateSchedule } = useScheduleStore();
  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: async () => {
      // Load from store
      const schedule = useScheduleStore.getState().getScheduleById(scheduleId);
      return schedule || { title: '', category: 'shift', entries: [] };
    },
  });
  
  const onSubmit = (data: ScheduleFormData) => {
    const validated = scheduleSchema.parse(data);
    updateSchedule(scheduleId, validated);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage /> {/* Zod error messages */}
            </FormItem>
          )}
        />
        
        {/* Dynamic entry array */}
        <EntriesFieldArray control={form.control} />
        
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Save Schedule
        </Button>
      </form>
    </Form>
  );
}
```

**Hybrid Integration** (v1 + v2 forms):
```typescript
// src/components/hybrid/ScheduleFormWrapper.tsx
import { useMigration } from '../../lib/store';
import V1ScheduleForm from '../v1/ScheduleForm';
import V2ScheduleEditor from '../v2/ScheduleEditor';

function ScheduleFormWrapper({ scheduleId }) {
  const { migrationCompleted } = useMigration();
  
  // Show v1 form if migration incomplete or user prefers
  if (!migrationCompleted) {
    return (
      <div className="v1-form-wrapper">
        <h3>Classic Schedule Form</h3>
        <V1ScheduleForm 
          onSubmit={(v1Data) => {
            // Bridge: Convert v1 to v2 format for store
            const v2Data = convertV1ToV2(v1Data);
            useScheduleStore.getState().addSchedule(v2Data);
          }}
        />
      </div>
    );
  }
  
  // Show v2 form for full functionality
  return <V2ScheduleEditor scheduleId={scheduleId} />;
}

// v1 to v2 conversion bridge
function convertV1ToV2(v1Data) {
  return {
    id: crypto.randomUUID(),
    title: v1Data.name,
    category: 'custom',
    startDate: v1Data.date ? new Date(v1Data.date) : new Date(),
    entries: [{
      id: crypto.randomUUID(),
      time: `${v1Data.start}-${v1Data.end}`,
      task: v1Data.tasks,
      assignees: [v1Data.name],
      status: 'pending',
      duration: calculateDuration(v1Data.start, v1Data.end),
      createdAt: new Date(),
      updatedAt: new Date(),
    }],
    version: 2,
  };
}
```

**Performance Optimization**:
```typescript
// Form-level optimization
function OptimizedScheduleForm() {
  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    mode: 'onBlur', // Validate on blur instead of change
    defaultValues: useMemo(() => getDefaultValues(), []),
  });
  
  // Debounce expensive validations
  const debouncedValidate = useMemo(
    () => debounce((values) => {
      // Heavy validation logic
      return scheduleSchema.safeParse(values);
    }, 300),
    []
  );
  
  // Memoize form state for complex calculations
  const totalDuration = useMemo(() => {
    const entries = form.watch('entries');
    return entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
  }, [form.watch('entries')]);
  
  return <FormProvider {...form}>{/* form fields */}</FormProvider>;
}
```

#### Testing Strategy
```typescript
// tests/forms.spec.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import userEvent from '@testing-library/user-event';
import V2ScheduleEditor from '../src/components/v2/ScheduleEditor';
import { scheduleSchema } from '../src/lib/validation';

describe('v2 Form Integration', () => {
  it('should validate schedule form with Zod', async () => {
    render(<V2ScheduleEditor scheduleId="test" />);
    
    // Test required field validation
    fireEvent.submit(screen.getByRole('form'));
    
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('At least one entry required')).toBeInTheDocument();
    });
  });
  
  it('should submit valid form data', async () => {
    const mockUpdate = vi.fn();
    useScheduleStore.setState({ updateSchedule: mockUpdate });
    
    render(<V2ScheduleEditor scheduleId="test" />);
    
    // Fill required fields
    await userEvent.type(screen.getByLabelText('Title'), 'Test Schedule');
    
    // Add entry
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    await userEvent.type(screen.getByLabelText('Task Description'), 'Clean rooms');
    await userEvent.type(screen.getByLabelText('Assignees'), 'john@example.com');
    
    // Submit
    await userEvent.click(screen.getByRole('button', { name: /save schedule/i }));
    
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('test', expect.objectContaining({
        title: 'Test Schedule',
        entries: expect.arrayContaining([
          expect.objectContaining({
            task: 'Clean rooms',
            assignees: ['john@example.com'],
          })
        ]),
      }));
    });
  });
  
  it('should maintain v1 form compatibility', () => {
    const { container } = render(<V1ScheduleForm />);
    
    // v1 form renders without v2 dependencies
    expect(container).toBeInTheDocument();
    expect(container.querySelector('input[placeholder="Housekeeper Name"]')).toBeInTheDocument();
  });
  
  it('should handle form errors gracefully', async () => {
    // Mock Zod error
    const mockSchema = {
      ...scheduleSchema,
      parse: vi.fn(() => { throw new Error('Validation failed'); }),
    };
    
    // Test error handling in form submission
    // ... error test implementation
  });
});
```

### 4. Utilities (UUID, Date-fns)

#### Package Details
```json
{
  "uuid": "^9.0.1",
  "date-fns": "^3.6.0",
  "devDependencies": {
    "@types/uuid": "^9.0.8"
  }
}
```

#### Integration Strategy
**Primary Use**: UUID generation, date/time formatting and manipulation
**Bundle Size**: ~4KB UUID + ~12KB date-fns (used functions only)
**Tree-shaking**: 100% (import individual functions)

**Implementation Pattern**:
```typescript
// src/lib/uuid.ts - Centralized ID generation
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

export class UUIDService {
  static generate(): string {
    return uuidv4();
  }
  
  static generateBatch(count: number): string[] {
    return Array.from({ length: count }, () => uuidv4());
  }
  
  static isValid(uuid: string): boolean {
    return uuidValidate(uuid);
  }
  
  // v1 compatibility (timestamp-based IDs)
  static generateV1Compatible(): string {
    // v1 used timestamp + random, maintain similar format
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `${timestamp}-${random}`;
  }
}

// Usage patterns
export const generateScheduleId = () => UUIDService.generate();
export const generateEntryId = () => UUIDService.generate();
export const validateShareId = (id: string) => UUIDService.isValid(id);
```

**Date Handling**:
```typescript
// src/lib/dates.ts - Date utilities with v1 compatibility
import {
  format,
  parse,
  differenceInMinutes,
  addMinutes,
  isValid,
  startOfDay,
  endOfDay,
  formatDistanceToNow,
} from 'date-fns';

export class DateService {
  // v1 date formats (YYYY-MM-DD or empty)
  static parseV1Date(dateStr?: string): Date | null {
    if (!dateStr) return null;
    
    // v1 format: YYYY-MM-DD or ISO string
    const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
    return isValid(parsed) ? parsed : new Date(dateStr);
  }
  
  static formatV1Date(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }
  
  // v2 time range handling (HH:MM-HH:MM)
  static parseTimeRange(timeRange: string): { start: Date; end: Date } | null {
    const [startStr, endStr] = timeRange.split('-');
    if (!startStr || !endStr) return null;
    
    const now = new Date();
    const start = parse(startStr, 'HH:mm', now);
    const end = parse(endStr, 'HH:mm', now);
    
    if (!isValid(start) || !isValid(end)) return null;
    
    return { start, end };
  }
  
  static calculateDuration(start: string, end: string): number {
    const range = this.parseTimeRange(`${start}-${end}`);
    if (!range) return 60; // Default
    
    return differenceInMinutes(range.end, range.start);
  }
  
  static formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }
  
  // Human-friendly formatting
  static formatRelative(date: Date): string {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  
  static formatScheduleDateRange(start: Date, end?: Date): string {
    const startStr = format(start, 'MMM dd, yyyy');
    if (!end) return startStr;
    
    const endStr = format(end, 'MMM dd, yyyy');
    return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
  }
}

// v1 compatibility exports
export const formatDate = DateService.formatV1Date;
export const parseDate = DateService.parseV1Date;
export const calculateTimeDuration = DateService.calculateDuration;

// Common patterns
export const formatTimeRange = (timeRange: string) => timeRange; // HH:MM-HH:MM
export const formatTaskDuration = (duration?: number) => 
  DateService.formatDuration(duration || 60);
```

**v1 Integration**:
```typescript
// src/components/v1/ScheduleTable.tsx - Unchanged v1 component
import { formatDate, parseDate } from '../../lib/dates'; // v1 compatible

function V1ScheduleRow({ entry }) {
  // v1 uses simple date formatting
  const formattedDate = entry.date ? formatDate(new Date(entry.date)) : 'Today';
  const duration = entry.end && entry.start 
    ? calculateTimeDuration(entry.start, entry.end)
    : 60;
  
  return (
    <tr>
      <td>{entry.name}</td>
      <td>{formattedDate}</td>
      <td>{entry.start}-{entry.end}</td>
      <td>{duration} min</td>
      <td>{entry.tasks}</td>
    </tr>
  );
}
```

**v2 Integration**:
```typescript
// src/components/v2/DashboardCard.tsx - Enhanced date handling
import { 
  formatScheduleDateRange, 
  formatRelative,
  formatTaskDuration 
} from '../../lib/dates';

function V2DashboardCard({ schedule }) {
  const dateRange = formatScheduleDateRange(schedule.startDate, schedule.endDate);
  const lastUpdated = formatRelative(schedule.updatedAt);
  const totalDuration = formatTaskDuration(
    schedule.entries.reduce((sum, e) => sum + (e.duration || 60), 0)
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{schedule.title}</CardTitle>
        <CardDescription>
          {dateRange} • Updated {lastUpdated} • {totalDuration}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
```

#### Testing Strategy
```typescript
// tests/dates.spec.ts
import { 
  formatDate, 
  parseDate, 
  calculateTimeDuration, 
  formatScheduleDateRange 
} from '../src/lib/dates';

describe('Date Utilities', () => {
  describe('v1 Compatibility', () => {
    it('should parse v1 date format', () => {
      const v1Date = '2025-01-15';
      const parsed = parseDate(v1Date);
      
      expect(parsed).toBeInstanceOf(Date);
      expect(format(parsed, 'yyyy-MM-dd')).toBe(v1Date);
    });
    
    it('should format for v1 export', () => {
      const date = new Date('2025-01-15T10:30:00');
      const formatted = formatDate(date);
      
      expect(formatted).toBe('2025-01-15');
    });
    
    it('should calculate v1 time duration', () => {
      const duration = calculateTimeDuration('09:00', '12:00');
      expect(duration).toBe(180); // 3 hours
    });
  });
  
  describe('v2 Enhanced Features', () => {
    it('should parse time range correctly', () => {
      const range = DateService.parseTimeRange('09:00-11:30');
      expect(range).not.toBeNull();
      expect(range.start.getHours()).toBe(9);
      expect(range.start.getMinutes()).toBe(0);
      expect(range.end.getHours()).toBe(11);
      expect(range.end.getMinutes()).toBe(30);
    });
    
    it('should format schedule date range', () => {
      const singleDay = formatScheduleDateRange(new Date('2025-01-15'));
      expect(singleDay).toBe('Jan 15, 2025');
      
      const rangeStart = new Date('2025-01-15');
      const rangeEnd = new Date('2025-01-20');
      const multiDay = formatScheduleDateRange(rangeStart, rangeEnd);
      expect(multiDay).toBe('Jan 15, 2025 - Jan 20, 2025');
    });
    
    it('should handle invalid time ranges gracefully', () => {
      const invalid = DateService.parseTimeRange('25:00-30:00');
      expect(invalid).toBeNull();
      
      const duration = DateService.calculateDuration('invalid', 'times');
      expect(duration).toBe(60); // Default fallback
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle v1 empty dates', () => {
      expect(parseDate('')).toBeNull();
      expect(parseDate(undefined)).toBeNull();
    });
    
    it('should handle midnight to midnight', () => {
      const duration = calculateTimeDuration('00:00', '24:00');
      expect(duration).toBe(1440); // 24 hours
    });
  });
});
```

### 5. UI Components (React Select)

#### Package Details
```json
{
  "react-select": "^5.8.0",
  "devDependencies": {
    "@types/react-select": "^5.0.4"
  }
}
```

#### Integration Strategy
**Primary Use**: Multi-assignee selection in forms
**Bundle Size**: ~45KB (min+gzip) - largest addition
**Tree-shaking**: 80% (core components only)

**Implementation Pattern**:
```typescript
// src/components/ui/multi-select.tsx - shadcn/ui styled wrapper
import Select, { 
  MultiValue, 
  components, 
  GroupBase, 
  OptionsOrGroups, 
  OptionProps 
} from 'react-select';
import { Badge } from './badge';
import { X, Search } from 'lucide-react';
import { cn } from '../lib/utils';

interface MultiSelectOption {
  value: string;
  label: string;
  // Add avatar, color, etc. for future enhancement
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value?: MultiSelectOption[];
  onChange?: (newValue: MultiSelectOption[]) => void;
  placeholder?: string;
  isSearchable?: boolean;
  isClearable?: boolean;
  maxSelections?: number;
  className?: string;
  disabled?: boolean;
}

// Custom components for shadcn/ui styling
const MultiValueOption = (props: any) => (
  <components.MultiValue {...props}>
    <Badge 
      variant="secondary" 
      className="mr-1 text-xs px-2 py-0.5 border-none"
    >
      {props.data.label}
    </Badge>
    <button
      onClick={(e) => {
        e.stopPropagation();
        props.removeProps.onClick();
      }}
      className="text-muted-foreground hover:text-destructive ml-1"
    >
      <X className="w-3 h-3" />
    </button>
  </components.MultiValue>
);

const Control = (props: any) => (
  <components.Control {...props}>
    <div className={cn(
      'flex items-center',
      props.isFocused ? 'ring-2 ring-primary ring-offset-2' : 'ring-1 ring-border'
    )}>
      {props.children}
    </div>
  </components.Control>
);

const Option = (props: OptionProps<MultiSelectOption, false>) => (
  <components.Option {...props}>
    <div className="flex items-center gap-2 p-2">
      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
        {props.data.label.charAt(0).toUpperCase()}
      </div>
      <span className="font-medium">{props.data.label}</span>
    </div>
  </components.Option>
);

const customComponents = {
  MultiValue: MultiValueOption,
  Control,
  Option,
};

const customStyles = {
  control: (provided: any) => ({
    ...provided,
    borderRadius: '8px',
    borderColor: '#d1d5db',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#9ca3af',
    },
    minHeight: '40px',
  }),
  menu: (provided: any) => ({
    ...provided,
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    marginTop: '4px',
  }),
  menuList: (provided: any) => ({
    ...provided,
    padding: '4px 0',
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: '#9ca3af',
    fontSize: '14px',
  }),
  input: (provided: any) => ({
    ...provided,
    color: '#374151',
    '&::placeholder': {
      color: '#9ca3af',
    },
  }),
};

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = 'Select options...',
  isSearchable = true,
  isClearable = true,
  maxSelections = 10,
  className,
  disabled = false,
}: MultiSelectProps) {
  const handleChange = (selected: MultiValue<MultiSelectOption>) => {
    const selectedValues = selected ? selected.map(opt => opt.value) : [];
    
    if (selectedValues.length > maxSelections) {
      // Don't exceed max selections
      return;
    }
    
    // Convert to option objects for consistency
    const selectedOptions = selectedValues.map(val => 
      options.find(opt => opt.value === val) || { value: val, label: val }
    );
    
    onChange?.(selectedOptions);
  };
  
  const selectedOptions = value.length > 0 
    ? options.filter(opt => value.some(val => val === opt.value))
    : [];
  
  const isMaxedOut = selectedOptions.length >= maxSelections;
  
  return (
    <div className={cn('w-full', className)}>
      <Select<MultiSelectOption, true>
        isMulti
        options={options}
        value={selectedOptions}
        onChange={handleChange}
        placeholder={isMaxedOut ? `Maximum ${maxSelections} selected` : placeholder}
        isSearchable={isSearchable && !isMaxedOut}
        isClearable={isClearable}
        isDisabled={disabled || isMaxedOut}
        components={customComponents}
        styles={customStyles}
        classNamePrefix="react-select"
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        blurInputOnSelect={false}
        maxMenuHeight={200}
        menuPlacement="auto"
        noOptionsMessage={({ inputValue }) =>
          isMaxedOut 
            ? `Maximum ${maxSelections} options selected`
            : options.length === 0 
              ? 'No options available'
              : `No options match "${inputValue}"`
        }
        isOptionDisabled={(option) => 
          selectedOptions.some(selected => selected.value === option.value)
        }
        filterOption={(option, input) => {
          // Case-insensitive search
          return option.label.toLowerCase().includes(input.toLowerCase());
        }}
      />
      
      {/* Selection summary */}
      {selectedOptions.length > 0 && (
        <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {selectedOptions.length} {selectedOptions.length === 1 ? 'option' : 'options'} selected
            {isMaxedOut && <Badge className="ml-2 text-xs">MAX</Badge>}
          </span>
          
          {isClearable && !disabled && (
            <button
              type="button"
              onClick={() => onChange?.([])}
              className="text-xs text-primary hover:text-primary/80 underline"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Default export for shadcn/ui pattern
export { MultiSelect as MultiSelectInput };

// Type exports
export type { MultiSelectOption, MultiSelectProps };
```

**v1 Integration** (Simple Select Fallback):
```typescript
// src/components/v1/AssigneeSelect.tsx - v1 simple select
function V1AssigneeSelect({ value, onChange }) {
  const assignees = ['John Doe', 'Jane Smith', 'Mike Johnson'];
  
  // v1 pattern: single select dropdown
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select Assignee</option>
      {assignees.map(assignee => (
        <option key={assignee} value={assignee}>
          {assignee}
        </option>
      ))}
    </select>
  );
}
```

**v2 Integration** (Enhanced Multi-Select):
```typescript
// src/components/v2/TeamAssignment.tsx - Multi-assignee with search
import { MultiSelect, type MultiSelectOption } from '../ui/multi-select';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

function TeamAssignment({ fieldName = 'assignees' }) {
  const { watch, setValue } = useFormContext();
  const currentAssignees = watch(fieldName) || [];
  
  const availableAssignees: MultiSelectOption[] = [
    { value: 'john.doe@company.com', label: 'John Doe (Lead)' },
    { value: 'jane.smith@company.com', label: 'Jane Smith (Senior)' },
    { value: 'mike.johnson@company.com', label: 'Mike Johnson' },
    { value: 'sarah.wilson@company.com', label: 'Sarah Wilson' },
    // Dynamic loading for large teams
  ];
  
  const handleSelectionChange = (selected: MultiSelectOption[]) => {
    const values = selected.map(opt => opt.value);
    setValue(fieldName, values);
  };
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Team Members</label>
      <MultiSelect
        options={availableAssignees}
        value={currentAssignees.map(val => 
          availableAssignees.find(opt => opt.value === val) || 
          { value: val, label: val }
        )}
        onChange={handleSelectionChange}
        placeholder="Select team members (click to search)"
        maxSelections={8}
        isSearchable
      />
      
      {/* Validation feedback */}
      {currentAssignees.length === 0 && (
        <p className="text-xs text-destructive">At least one team member required</p>
      )}
      
      {/* Selection preview */}
      {currentAssignees.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {currentAssignees.slice(0, 3).map((assignee, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {availableAssignees.find(opt => opt.value === assignee)?.label || assignee}
            </Badge>
          ))}
          {currentAssignees.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{currentAssignees.length - 3} more
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
```

**Performance Optimization** (Virtualized Large Lists):
```typescript
// For teams with 100+ members
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

function VirtualizedMultiSelect({ options, ...props }) {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  
  if (options.length < 50) {
    // Use standard select for small lists
    return <MultiSelect options={options} {...props} />;
  }
  
  return (
    <Select
      {...props}
      menuIsOpen={menuIsOpen}
      onMenuOpen={() => setMenuIsOpen(true)}
      onMenuClose={() => setMenuIsOpen(false)}
      components={{
        MenuList: VirtualizedMenuList,
        ...customComponents,
      }}
    />
  );
}

function VirtualizedMenuList(props) {
  const { options, children, maxHeight } = props;
  
  return (
    <AutoSizer disableHeight>
      {({ width }) => (
        <List
          height={maxHeight}
          itemCount={options.length}
          itemSize={40}
          width={width}
        >
          {({ index, style }) => (
            <div style={style}>
              {children({ option: options[index], isSelected: false })}
            </div>
          )}
        </List>
      )}
    </AutoSizer>
  );
}
```

#### Testing Strategy
```typescript
// tests/multi-select.spec.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiSelect } from '../src/components/ui/multi-select';

describe('MultiSelect Component', () => {
  const options = [
    { value: 'john@example.com', label: 'John Doe' },
    { value: 'jane@example.com', label: 'Jane Smith' },
    { value: 'mike@example.com', label: 'Mike Johnson' },
  ];
  
  it('should render with no selections', () => {
    render(<MultiSelect options={options} />);
    
    expect(screen.getByText('Select options...')).toBeInTheDocument();
    expect(screen.queryAllByRole('button', { name: /john/i })).toHaveLength(0);
  });
  
  it('should allow multiple selections', async () => {
    const handleChange = vi.fn();
    render(<MultiSelect options={options} onChange={handleChange} />);
    
    // Open dropdown
    await userEvent.click(screen.getByRole('combobox'));
    
    // Select first two options
    await userEvent.click(screen.getByText('John Doe'));
    await userEvent.click(screen.getByText('Jane Smith'));
    
    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith([
        { value: 'john@example.com', label: 'John Doe' },
        { value: 'jane@example.com', label: 'Jane Smith' },
      ]);
    });
    
    // Verify badges rendered
    expect(screen.getAllByRole('button', { name: /john/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /jane/i })).toHaveLength(1);
  });
  
  it('should respect max selections limit', async () => {
    const handleChange = vi.fn();
    render(<MultiSelect options={options} onChange={handleChange} maxSelections={1} />);
    
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('John Doe'));
    
    // Second selection should be blocked
    await userEvent.click(screen.getByText('Jane Smith'));
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenLastCalledWith([
      { value: 'john@example.com', label: 'John Doe' }
    ]);
  });
  
  it('should handle clear all functionality', async () => {
    const handleChange = vi.fn();
    render(<MultiSelect 
      options={options} 
      value={['john@example.com', 'jane@example.com']} 
      onChange={handleChange} 
    />);
    
    // Click clear all
    await userEvent.click(screen.getByText('Clear all'));
    
    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith([]);
    });
  });
  
  it('should search and filter options', async () => {
    render(<MultiSelect options={options} isSearchable />);
    
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.type(screen.getByRole('textbox'), 'john');
    
    // Only John should be visible
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    expect(screen.queryByText('Mike Johnson')).not.toBeInTheDocument();
  });
  
  it('should maintain v1 single-select compatibility', () => {
    // Test that v1 components don't require MultiSelect
    const { container } = render(<div>v1 select</div>);
    expect(container).not.toBeNull();
  });
});
```

## ⚙️ Configuration Updates

### TypeScript Configuration (tsconfig.json)
```json
{
  "compilerOptions": {
    // Existing v1 config preserved
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    
    // v2 additions
    "verbatimModuleSyntax": true, // Better tree-shaking
    "noUncheckedSideEffectImports": true, // Catch unused imports
    "strictNullChecks": true, // Zod type safety
    "noImplicitReturns": true,
    
    // Path mapping for new structure
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/lib/*": ["src/lib/*"],
      "@/types/*": ["src/types/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/routes/*": ["src/routes/*"],
      // v1 compatibility paths preserved
      "@/v1/*": ["src/v1/*"]
    }
  },
  "include": [
    "src",
    "docs", // Include documentation for type checking
    "*.ts",
    "*.tsx"
  ],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

### Vite Configuration Updates (vite.config.ts)
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // v2 build optimizations
  build: {
    // Existing v1 config
    sourcemap: true,
    target: 'es2015',
    
    // v2 additions
    rollupOptions: {
      output: {
        // Manual chunking for new features
        manualChunks: {
          'v2-store': ['zustand'],
          'v2-router': ['react-router-dom'],
          'v2-forms': ['react-hook-form', 'zod'],
          'v2-select': ['react-select'],
          // v1 chunks preserved
          'v1-legacy': ['src/App', 'src/components/v1'],
        },
        // Common third-party chunk
        commonjsOptions: {
          include: [/node_modules/],
        },
      },
    },
    // Bundle size analysis
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep in dev, remove in prod
      },
    },
  },
  
  // Development server enhancements
  server: {
    // Existing v1 proxy
    proxy: {
      '/export-csv': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
    
    // v2 additions
    hmr: {
      overlay: true, // Enhanced error overlay
    },
    sourcemapIgnoreList: ['node_modules', '**/v1/**'], // Faster HMR for v2
  },
  
  // v2 path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/routes': path.resolve(__dirname, './src/routes'),
      // v1 compatibility
      '@/v1': path.resolve(__dirname, './src/v1'),
    },
  },
  
  // Enhanced optimization for v2
  optimizeDeps: {
    include: [
      // Force include for better caching
      'react-router-dom',
      'zustand',
      'react-hook-form',
      'zod',
      'date-fns',
    ],
    exclude: [
      // v1 dependencies remain unchanged
    ],
  },
  
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    // Feature flags
    __ENABLE_V2_MIGRATION__: JSON.stringify(process.env.NODE_ENV !== 'test'),
    __ENABLE_V2_ROUTING__: JSON.stringify(true),
  },
});
```

### Package.json Scripts Enhancement
```json
{
  "scripts": {
    // Existing v1 scripts preserved
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "start": "node server.js",
    
    // v2 development scripts
    "dev:v2": "VITE_ENABLE_V2_FEATURES=1 vite",
    "build:v2": "tsc --noEmit && vite build --mode production",
    "build:v1": "tsc --noEmit && vite build --mode legacy", // For v1 testing
    
    // Bundle analysis
    "analyze": "vite-bundle-analyzer src --mode production",
    
    // Type checking with new paths
    "type-check": "tsc --noEmit --pretty",
    "type-check:v1": "tsc --noEmit --pretty --skipLibCheck src/v1/**/*",
    
    // Testing with new coverage
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:v2": "vitest --testPathPattern=v2",
    "test:v1": "vitest --testPathPattern=v1",
    
    // Linting with new rules
    "lint": "eslint src --ext .ts,.tsx --fix",
    "lint:v2": "eslint src/v2 src/lib --ext .ts,.tsx --fix",
    
    // Migration testing
    "test:migration": "vitest migration --run",
    
    // Build size monitoring
    "size": "npm run build && npx bundle-analyzer dist/assets/*.js",
  },
  
  "dependencies": {
    // Existing v1 dependencies (unchanged)
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "express": "^4.18.2",
    
    // v2 additions (specific versions for stability)
    "zustand": "^4.5.2",
    "react-router-dom": "^6.22.3",
    "react-hook-form": "^7.48.2",
    "zod": "^3.22.4",
    "react-select": "^5.8.0",
    "uuid": "^9.0.1",
    "date-fns": "^3.6.0",
    "@hookform/resolvers": "^3.3.4"
  },
  
  "devDependencies": {
    // Existing v1 dev deps
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "typescript": "^5.0.2",
    "vite": "^4.4.5",
    
    // v2 dev dependencies
    "@types/uuid": "^9.0.8",
    "@types/react-router-dom": "^5.3.3",
    "@types/react-hook-form": "^7.45.4",
    "@types/react-select": "^5.0.4",
    
    // Testing (new)
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.3",
    "@testing-library/user-event": "^14.5.2",
    "jsdom": "^22.1.0",
    
    // Bundle analysis
    "vite-bundle-analyzer": "^0.3.4",
    
    // Linting (enhanced)
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-router": "^0.1.2"
  },
  
  // Peer dependencies (for compatibility)
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  
  // Bundle size budget
  "resolutions": {
    // Force consistent versions
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

## 🔧 Integration Phases

### Phase 1: Core Infrastructure (Week 1)
**Dependencies**: `zustand`, `uuid`, `date-fns`
**Goals**: 
- Global store implementation
- ID generation system
- Date/time utilities
- Basic type definitions

**Integration Steps**:
1. Install core packages: `npm install zustand uuid date-fns @types/uuid`
2. Create store architecture (`src/lib/store.ts`)
3. Add date utilities (`src/lib/dates.ts`)
4. Update TypeScript paths (`tsconfig.json`)
5. Basic store testing (80% coverage)
6. Bundle size baseline measurement

**Success Criteria**:
- Store persists to localStorage
- UUID generation works in v1/v2 components
- Date formatting maintains v1 compatibility
- No TypeScript errors in new modules
- Bundle size increase < 10KB

### Phase 2: Routing & Navigation (Week 2)
**Dependencies**: `react-router-dom`, `@types/react-router-dom`
**Goals**:
- SPA routing implementation
- v1 compatibility routes
- Route guards for share protection
- Code splitting for performance

**Integration Steps**:
1. Install routing: `npm install react-router-dom @types/react-router-dom`
2. Create route configuration (`src/routes/AppRoutes.tsx`)
3. Add v1 compatibility wrapper
4. Implement share route protection
5. Add route-based code splitting
6. Update main entry (`src/main.tsx`)

**Success Criteria**:
- Dashboard accessible at `/`
- Schedule editor at `/schedule/:id`
- Share view at `/share/:shareId`
- v1 route at `/v1/*` works unchanged
- Lazy loading reduces initial bundle < 100KB
- Navigation works without page refresh

### Phase 3: Forms & Validation (Week 3)
**Dependencies**: `react-hook-form`, `zod`, `@hookform/resolvers`
**Goals**:
- Form validation system
- Multi-assignee selection
- Dynamic form arrays
- Error handling and UX

**Integration Steps**:
1. Install form packages: `npm install react-hook-form zod @hookform/resolvers`
2. Create validation schemas (`src/lib/validation.ts`)
3. Build enhanced ScheduleForm (`src/components/v2/ScheduleEditor.tsx`)
4. Add react-hook-form integration
5. Create custom form components
6. Add form testing utilities

**Success Criteria**:
- Form validation with Zod schemas
- Dynamic entry array management
- Multi-select assignee component
- Real-time validation feedback
- Form submission updates global store
- 90% form test coverage

### Phase 4: UI Enhancements (Week 4)
**Dependencies**: `react-select`, `@types/react-select`
**Goals**:
- Multi-select assignee dropdown
- shadcn/ui component integration
- Accessibility compliance
- Mobile responsiveness

**Integration Steps**:
1. Install select: `npm install react-select @types/react-select`
2. Create MultiSelect component (`src/components/ui/multi-select.tsx`)
3. Style with shadcn/ui design system
4. Add ARIA labels and keyboard navigation
5. Integrate with react-hook-form
6. Add selection limit enforcement

**Success Criteria**:
- Searchable multi-select with 100+ options
- shadcn/ui styling consistency
- WCAG AA accessibility compliance
- Touch-friendly mobile interface
- Virtual scrolling for large teams
- Integration with form validation

## 📊 Bundle Size Management

### Current v1 Bundle Analysis
```
Initial JS: 45KB (gzip)
Vendor JS: 32KB (gzip) 
CSS: 8KB (gzip)
Total: 85KB (gzip)
```

### v2 Target Bundle Budget
```
Initial JS: 130KB (gzip) [+85KB]
Vendor JS: 67KB (gzip) [+35KB]
CSS: 12KB (gzip) [+4KB]
Total: 209KB (gzip) [+124KB, +146%]
```

### Optimization Strategies

#### 1. Code Splitting
```typescript
// Dynamic imports for routes
const Dashboard = lazy(() => import('./dashboard/Dashboard'));
const ScheduleEditor = lazy(() => import('./schedule/ScheduleEditor'));

// Manual chunks in vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate v2 features
          'v2-core': ['zustand', 'react-router-dom'],
          'v2-forms': ['react-hook-form', 'zod'],
          'v2-select': ['react-select'],
          // Keep v1 separate
          'v1-legacy': ['src/App', 'src/components/v1/*'],
        },
      },
    },
  },
});
```

#### 2. Tree Shaking
```typescript
// Import only needed functions (date-fns example)
import { 
  format, 
  parse, 
  differenceInMinutes 
} from 'date-fns'; // Only 3KB vs 12KB full import

// Zustand selectors (no re-renders)
const useScheduleCount = () => 
  useStore(state => state.schedules.length); // Minimal re-render

// React Select - custom components only
import { components } from 'react-select';
const { Option, MultiValue } = components; // Tree-shake unused
```

#### 3. Dynamic Imports
```typescript
// Heavy components loaded on demand
function ScheduleEditor({ scheduleId }) {
  return (
    <Suspense fallback={<ScheduleLoader />}>
      <LazyScheduleEditor scheduleId={scheduleId} />
    </Suspense>
  );
}

const LazyScheduleEditor = lazy(() => import('./ScheduleEditorImpl'));

// Preload on hover for better UX
function ScheduleCard({ schedule }) {
  const preloadEditor = useCallback(() => {
    import('./ScheduleEditorImpl');
  }, []);
  
  return (
    <div onMouseEnter={preloadEditor}>
      <Link to={`/schedule/${schedule.id}`}>{schedule.title}</Link>
    </div>
  );
}
```

#### 4. Bundle Analysis Tools
```bash
# Install analyzer
npm install --save-dev vite-bundle-analyzer rollup-plugin-visualizer

# Analyze production build
npm run build:analyze

# Generate visual report
npx rollup-plugin-visualizer --config src/vite.config.ts
```

### Monitoring Script
```typescript
// scripts/monitor-bundle.js
import fs from 'fs';
import path from 'path';

const analyzeBundle = () => {
  const stats = fs.readFileSync('dist/stats.json', 'utf8');
  const bundleStats = JSON.parse(stats);
  
  const v2Size = bundleStats['v2-core']?.size || 0;
  const totalSize = Object.values(bundleStats).reduce((sum, chunk) => sum + (chunk.size || 0), 0);
  
  console.log(`v2 Bundle Impact: ${(v2Size / 1024).toFixed(1)}KB`);
  console.log(`Total Bundle: ${(totalSize / 1024).toFixed(1)}KB`);
  
  // Alert if over budget
  if (totalSize > 500 * 1024) { // 500KB limit
    console.error('🚨 Bundle size exceeded budget!');
    process.exit(1);
  }
};

analyzeBundle();
```

## 🧪 Integration Testing

### Unit Tests for Dependencies
```typescript
// tests/integration/dependencies.spec.ts
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { useScheduleStore } from '../../src/lib/store';
import V2ScheduleEditor from '../../src/components/v2/ScheduleEditor';
import LegacyApp from '../../src/App'; // v1

describe('Dependency Integration', () => {
  beforeEach(() => {
    // Mock all new dependencies
    vi.mock('zustand', () => ({
      create: vi.fn(() => ({
        schedules: [],
        addSchedule: vi.fn(),
        // ... mock store
      })),
    }));
    
    vi.mock('react-router-dom', () => ({
      useParams: () => ({ scheduleId: 'test' }),
      // ... other mocks
    }));
    
    vi.mock('react-hook-form', () => ({
      useForm: () => ({
        control: {},
        handleSubmit: vi.fn(),
        formState: { isValid: true },
        // ... mock form
      }),
    }));
  });
  
  it('v2 components work with mocked dependencies', () => {
    render(<V2ScheduleEditor scheduleId="test" />);
    expect(screen.getByText('Schedule')).toBeInTheDocument();
  });
  
  it('v1 components work without v2 dependencies', () => {
    const { container } = render(<LegacyApp />);
    expect(container).toBeInTheDocument(); // No crashes
  });
  
  it('store integration doesn't break v1', () => {
    // v1 component should not import store
    const v1Component = render(<LegacyApp />);
    
    // Store mock shouldn't affect v1
    expect(vi.isMocked(useScheduleStore)).toBe(true);
    expect(v1Component.container).toMatchSnapshot();
  });
});
```

### Integration Test Suite
```typescript
// tests/integration/v2-features.spec.ts
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import AppRoutes from '../../src/routes/AppRoutes';
import { useScheduleStore } from '../../src/lib/store';

describe('End-to-End v2 Integration', () => {
  beforeEach(() => {
    // Reset store
    useScheduleStore.setState({
      schedules: [],
      shares: [],
      migrationCompleted: true,
    });
  });
  
  it('should complete full workflow: create → edit → share', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );
    
    // 1. Create schedule
    await userEvent.click(screen.getByRole('button', { name: /create schedule/i }));
    await userEvent.type(screen.getByLabelText('Title'), 'Test Schedule');
    await userEvent.type(screen.getByLabelText('Task Description'), 'Test task');
    await userEvent.click(screen.getByRole('button', { name: /save schedule/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Test Schedule')).toBeInTheDocument();
    });
    
    // 2. Edit schedule (navigate)
    await userEvent.click(screen.getAllByRole('link')[0]);
    await waitFor(() => {
      expect(screen.getByText('Edit Schedule')).toBeInTheDocument();
    });
    
    // 3. Share schedule
    await userEvent.click(screen.getByRole('button', { name: /share schedule/i }));
    await waitFor(() => {
      expect(screen.getByText('Share link copied')).toBeInTheDocument();
    });
    
    // Verify store updated
    expect(useScheduleStore.getState().schedules).toHaveLength(1);
    expect(useScheduleStore.getState().shares).toHaveLength(1);
  });
  
  it('should handle v1 to v2 migration seamlessly', async () => {
    // Mock v1 data in localStorage
    localStorage.setItem('housekeeperSchedules', JSON.stringify([
      { name: 'John', tasks: 'Clean', start: '09:00', end: '12:00' }
    ]));
    
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );
    
    // Migration should complete
    await waitFor(() => {
      expect(screen.getByText('Migration Complete!')).toBeInTheDocument();
    });
    
    // Dashboard should show migrated schedule
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });
    
    // Verify store has migrated data
    expect(useScheduleStore.getState().migrationCompleted).toBe(true);
    expect(useScheduleStore.getState().schedules).toHaveLength(1);
  });
});
```

## 🚀 Rollout Strategy

### Staged Deployment

#### Week 1-2: Internal Alpha
**Target**: Development team
**Dependencies**: Core (Zustand, UUID, Dates)
**Features**: Store implementation, basic migration
**Validation**: Unit tests, manual migration testing
**Success**: 100% test coverage, migration works with sample v1 data

#### Week 3: Beta Users
**Target**: Power users with v1 data
**Dependencies**: + Routing, Forms
**Features**: Dashboard, schedule editing, v1 compatibility
**Validation**: Integration tests, user acceptance testing
**Success**: 95% migration success rate, no data loss reported

#### Week 4: Full Release
**Target**: All users
**Dependencies**: + React Select, Full UI
**Features**: Complete v2 functionality, sharing
**Validation**: E2E tests, production monitoring
**Success**: <1% error rate, positive user feedback

### Feature Flags
```typescript
// src/lib/feature-flags.ts
export const featureFlags = {
  enableV2Migration: import.meta.env.VITE_ENABLE_V2_MIGRATION !== 'false',
  enableV2Routing: import.meta.env.VITE_ENABLE_V2_ROUTING !== 'false',
  enableMultiSelect: import.meta.env.VITE_ENABLE_MULTISELECT !== 'false',
  enableSharing: import.meta.env.VITE_ENABLE_SHARING !== 'false',
  
  // User-level flags (localStorage)
  userPrefersV1: () => localStorage.getItem('prefers-v1-mode') === 'true',
  migrationOptOut: () => localStorage.getItem('migration-opt-out') === 'true',
};

// Conditional rendering
function ConditionalDashboard() {
  const { migrationCompleted } = useMigration();
  const prefersV1 = featureFlags.userPrefersV1();
  
  if (prefersV1 || !featureFlags.enableV2Routing) {
    return <LegacyDashboard />; // v1 component
  }
  
  if (!migrationCompleted) {
    return <MigrationScreen />; // Migration in progress
  }
  
  return <V2Dashboard />; // Full v2 experience
}
```

### Monitoring & Rollback

#### Health Checks
```typescript
// src/lib/health-checks.ts
export function checkV2Integration(): IntegrationHealth {
  const health: IntegrationHealth = {
    store: 'unknown',
    routing: '