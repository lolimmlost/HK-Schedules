
# HK-Schedules v2 Technical Specification
**Version**: 2.0.0  
**Date**: September 2025  
**Epic**: BE-001 Multi-Schedule Management and Team Collaboration Enhancement
**PRD Reference**: [docs/PRD/v2/](../PRD/v2/) (Brownfield extension of [v1 PRD](../PRD/v1/))
**Compatibility**: 100% backward compatible with v1.0  
**Implementation Effort**: 4-6 weeks (2 sprints)  
**Team**: 1 Full-Stack Developer (80%), QA (20%)  

## 🎯 Implementation Overview

This technical specification provides detailed implementation guidance for extending the existing HK-Schedules v1.0 application to support multi-schedule management, team collaboration, and shareable exports. The approach follows brownfield principles: 80% code reuse, incremental layering, automatic v1→v2 migration, and local-first architecture.

### Key Implementation Phases
1. **Sprint 1 (Weeks 1-2)**: Core infrastructure (store, routing, data model, migration)
2. **Sprint 2 (Weeks 3-4)**: UI components (dashboard, extended form/table, sharing)
3. **Week 5**: Integration testing, performance optimization, documentation
4. **Week 6**: E2E testing, bug fixes, deployment preparation

### Success Criteria
- [ ] 95% test coverage for new code
- [ ] <1s dashboard load time for 50 schedules
- [ ] 100% v1 data migration success rate
- [ ] Share links functional across all modern browsers
- [ ] Mobile-responsive dashboard and filtering
- [ ] WCAG AA compliance for all new components

## 📁 File Structure & Organization

### New Directory Structure
```
src/
├── components/                  # UI Components (feature-based)
│   ├── dashboard/              # NEW: Multi-schedule management
│   │   ├── Dashboard.tsx       # Main dashboard component
│   │   ├── DashboardCard.tsx   # Individual schedule cards
│   │   ├── FilterBar.tsx       # Search and filter controls
│   │   └── EmptyState.tsx      # No schedules placeholder
│   ├── sharing/                # NEW: Share functionality
│   │   ├── ShareModal.tsx      # Generate share links
│   │   ├── ShareView.tsx       # Read-only shared schedule view
│   │   └── PinValidation.tsx   # PIN entry modal
│   ├── schedule/               # Extended schedule components
│   │   ├── ScheduleEditor.tsx  # NEW: Wrapper for form + table
│   │   ├── MultiSelect.tsx     # NEW: Assignee selection component
│   │   └── BulkActions.tsx     # NEW: Bulk operation toolbar
│   ├── ui/                     # shadcn/ui components (existing + new)
│   │   ├── multi-select.tsx    # NEW: Custom shadcn component
│   │   └── filter-chip.tsx     # NEW: Removable filter tags
│   └── v1-components/          # Legacy components (preserved)
│       ├── ScheduleForm.tsx    # Extended for v2
│       └── ScheduleTable.tsx   # Extended for v2
├── lib/                        # Business logic and utilities
│   ├── store.ts                # NEW: Zustand global store
│   ├── api.ts                  # NEW: Client-side API layer
│   ├── storage.ts              # NEW: Persistence abstraction
│   ├── validation.ts           # NEW: Zod schemas
│   ├── csv.ts                  # NEW: Extended CSV parsing
│   └── utils.ts                # Existing utilities (extended)
├── types/                      # TypeScript definitions (new)
│   ├── schedule.ts             # v2 data models
│   ├── share.ts                # Share configuration types
│   ├── store.ts                # Zustand store types
│   └── index.ts                # Type exports
├── hooks/                      # Custom React hooks (new)
│   ├── useSchedule.ts          # Schedule CRUD operations
│   ├── useShare.ts             # Share link management
│   ├── useFilters.ts           # Filter state and debouncing
│   └── useMigration.ts         # v1→v2 migration logic
├── routes/                     # Routing configuration (new)
│   ├── AppRoutes.tsx           # Route definitions
│   ├── guards/                 # Route protection
│   │   └── ShareGuard.tsx      # PIN validation guard
│   └── layout/                 # Layout components
│       └── MainLayout.tsx      # Header, footer, toasts
└── App.tsx                     # Root component (refactored)
```

### Root-Level Changes
```
docs/                           # NEW: Technical documentation
├── technical-specification-v2.md # This document
├── migration-guide-v1-v2.md    # User/developer migration guide
└── api-reference-v2.md         # Client/server API documentation

.bmad-core/                    # Existing BMAD configuration (unchanged)
EPICS/                         # Existing (reference BE-001)
PRD/                           # Sharded PRD structure
├── v1/                        # [HK-Schedules-PRD.md](../v1/) sections
└── v2/                        # [brownfield-multi-user-prd.md](../v2/) sections
```

## 🔧 Core Implementation Details

### 1. Dependency Management

#### Required Dependencies (add to package.json)
```json
{
  "dependencies": {
    "zustand": "^4.5.0",
    "react-router-dom": "^6.22.0",
    "uuid": "^9.0.1",
    "react-select": "^5.8.0",
    "zod": "^3.22.4",
    "date-fns": "^3.6.0",
    "react-hook-form": "^7.48.2"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.8",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.3",
    "cypress": "^13.6.0",
    "ts-jest": "^29.1.1"
  }
}
```

#### Installation Command
```bash
npm install zustand react-router-dom uuid react-select zod date-fns react-hook-form
npm install --save-dev @types/uuid jest @testing-library/react @testing-library/jest-dom cypress ts-jest
```

#### Bundle Size Impact
- Zustand: ~3KB (min+gzip)
- React Router: ~25KB (min+gzip)  
- React Select: ~45KB (min+gzip)
- Zod: ~8KB (min+gzip)
- **Total Addition**: ~85KB (within 500KB budget)

### 2. Global Store Implementation (src/lib/store.ts)

#### Complete Store Definition
```typescript
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import type { Schedule, ScheduleEntry, ShareConfig, ScheduleCategory, Status } from '../types';

// Import validation schemas
import { scheduleSchema, entrySchema, shareSchema } from './validation';
import { storage } from './storage';
import { migrateV1Data } from './migration';
import { searchSchedules, filterSchedules } from './utils';

// Store state and actions
interface MultiScheduleStore {
  // State
  version: number;
  schedules: Schedule[];
  shares: ShareConfig[];
  filters: {
    searchTerm: string;
    category?: ScheduleCategory;
    assignee?: string;
    dateRange?: [Date, Date];
    status?: Status;
    currentScheduleId?: string;
  };
  migrationCompleted: boolean;
  lastBackup: string;
  
  // Actions
  initializeStore: () => void;
  addSchedule: (scheduleData: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => Schedule;
  updateSchedule: (id: string, updates: Partial<Schedule>) => Schedule | null;
  archiveSchedule: (id: string) => boolean;
  deleteSchedule: (id: string) => boolean;
  setFilters: (newFilters: Partial<MultiScheduleStore['filters']>) => void;
  clearFilters: () => void;
  createShare: (scheduleId: string, pin?: string, expiresDays?: number) => ShareConfig | null;
  validateShare: (shareId: string, providedPin?: string) => Schedule | null;
  incrementShareAccess: (shareId: string) => void;
  cleanupExpiredShares: () => number;
  exportAllData: () => string; // JSON backup
  importData: (data: any) => boolean;
  
  // Selectors (computed)
  getFilteredSchedules: () => Schedule[];
  getScheduleById: (id: string) => Schedule | null;
  getShareById: (id: string) => ShareConfig | null;
  getTotalDuration: (scheduleId?: string) => number;
  getAssigneeWorkload: (assignee: string, scheduleId?: string) => number;
}

// Store creation with middleware
export const useStore = create<MultiScheduleStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        version: 2,
        schedules: [],
        shares: [],
        filters: {
          searchTerm: '',
          category: undefined,
          assignee: undefined,
          dateRange: undefined,
          status: undefined,
          currentScheduleId: undefined,
        },
        migrationCompleted: false,
        lastBackup: '',
        
        // Action implementations
        initializeStore: () => {
          const state = get();
          if (!state.migrationCompleted) {
            const migrated = migrateV1Data();
            if (migrated) {
              set({ migrationCompleted: true });
              // Show migration success toast
              console.log('✅ v1 to v2 migration completed successfully');
            } else {
              console.warn('⚠️ Migration failed, running in v1 compatibility mode');
            }
          }
          
          // Cleanup expired shares on init
          get().cleanupExpiredShares();
        },
        
        addSchedule: (scheduleData) => {
          const validated = scheduleSchema.parse({
            ...scheduleData,
            id: uuidv4(),
            version: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
            isArchived: false,
          });
          
          const newSchedule: Schedule = validated;
          set((state) => ({
            schedules: [...state.schedules, newSchedule],
            filters: { ...state.filters, currentScheduleId: newSchedule.id },
          }));
          
          // Auto-save to storage
          storage.setSchedules([...get().schedules, newSchedule]);
          
          return newSchedule;
        },
        
        updateSchedule: (id, updates) => {
          const state = get();
          const scheduleIndex = state.schedules.findIndex(s => s.id === id);
          
          if (scheduleIndex === -1) return null;
          
          // Validate updates
          const currentSchedule = state.schedules[scheduleIndex];
          const updatedSchedule = { ...currentSchedule, ...updates, updatedAt: new Date() };
          scheduleSchema.parse(updatedSchedule);
          
          const newSchedules = [...state.schedules];
          newSchedules[scheduleIndex] = updatedSchedule;
          
          set({ schedules: newSchedules });
          storage.setSchedules(newSchedules);
          
          return updatedSchedule;
        },
        
        archiveSchedule: (id) => {
          const success = get().updateSchedule(id, { isArchived: true }) !== null;
          if (success) {
            // Update current schedule if archived
            const state = get();
            if (state.filters.currentScheduleId === id) {
              set({ filters: { ...state.filters, currentScheduleId: undefined } });
            }
          }
          return success;
        },
        
        deleteSchedule: (id) => {
          set((state) => ({
            schedules: state.schedules.filter(s => s.id !== id),
          }));
          storage.setSchedules(get().schedules.filter(s => s.id !== id));
          
          // Clean up associated shares
          const remainingShares = get().shares.filter(s => s.scheduleId !== id);
          set({ shares: remainingShares });
          storage.setShares(remainingShares);
          
          return true;
        },
        
        setFilters: (newFilters) => {
          set((state) => ({
            filters: { ...state.filters, ...newFilters },
          }));
        },
        
        clearFilters: () => {
          set({
            filters: {
              searchTerm: '',
              category: undefined,
              assignee: undefined,
              dateRange: undefined,
              status: undefined,
              currentScheduleId: undefined,
            },
          });
        },
        
        createShare: async (scheduleId, pin, expiresDays = 7) => {
          const state = get();
          const schedule = state.schedules.find(s => s.id === scheduleId);
          
          if (!schedule) return null;
          
          const shareId = uuidv4();
          const pinHash = pin ? await hashPin(pin) : undefined;
          const expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);
          
          const shareConfig: ShareConfig = {
            id: shareId,
            scheduleId,
            pinHash,
            expiresAt,
            accessCount: 0,
            createdAt: new Date(),
          };
          
          shareSchema.parse(shareConfig);
          
          const newShares = [...state.shares, shareConfig];
          set({ shares: newShares });
          storage.setShares(newShares);
          
          return shareConfig;
        },
        
        validateShare: (shareId, providedPin) => {
          const state = get();
          const share = state.shares.find(s => s.id === shareId);
          
          if (!share) return null;
          if (new Date() > share.expiresAt) return null;
          
          if (share.pinHash && providedPin) {
            // Verify PIN hash (client-side validation)
            const pinHash = hashPinSync(providedPin);
            if (pinHash !== share.pinHash) return null;
          } else if (share.pinHash) {
            return null; // PIN required but not provided
          }
          
          // Valid share - increment access count
          get().incrementShareAccess(shareId);
          
          // Return associated schedule
          return state.schedules.find(s => s.id === share.scheduleId) || null;
        },
        
        incrementShareAccess: (shareId) => {
          set((state) => ({
            shares: state.shares.map(share => 
              share.id === shareId 
                ? { ...share, accessCount: share.accessCount + 1 }
                : share
            ),
          }));
        },
        
        cleanupExpiredShares: () => {
          const now = new Date();
          const expiredShares = get().shares.filter(s => now > s.expiresAt);
          const remainingShares = get().shares.filter(s => now <= s.expiresAt);
          
          if (expiredShares.length > 0) {
            set({ shares: remainingShares });
            storage.setShares(remainingShares);
            console.log(`🧹 Cleaned up ${expiredShares.length} expired shares`);
          }
          
          return expiredShares.length;
        },
        
        // Computed selectors
        getFilteredSchedules: () => {
          const state = get();
          let filtered = [...state.schedules];
          
          // Apply filters
          if (state.filters.category) {
            filtered = filtered.filter(s => s.category === state.filters.category);
          }
          
          if (state.filters.assignee) {
            filtered = filtered.filter(s => 
              s.entries.some(e => e.assignees.includes(state.filters.assignee!))
            );
          }
          
          if (state.filters.status) {
            filtered = filtered.filter(s => 
              s.entries.some(e => e.status === state.filters.status)
            );
          }
          
          if (state.filters.searchTerm) {
            filtered = searchSchedules(filtered, state.filters.searchTerm);
          }
          
          // Sort by updatedAt (most recent first)
          return filtered.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        },
        
        getScheduleById: (id) => {
          return get().schedules.find(s => s.id === id) || null;
        },
        
        getShareById: (id) => {
          return get().shares.find(s => s.id === id) || null;
        },
        
        getTotalDuration: (scheduleId) => {
          const schedule = scheduleId 
            ? get().getScheduleById(scheduleId)
            : get().schedules.find(s => s.id === get().filters.currentScheduleId);
          
          if (!schedule) return 0;
          
          return schedule.entries.reduce((total, entry) => {
            return total + (entry.duration || 0);
          }, 0);
        },
        
        getAssigneeWorkload: (assignee, scheduleId) => {
          const schedule = scheduleId 
            ? get().getScheduleById(scheduleId)
            : get().schedules.find(s => s.id === get().filters.currentScheduleId);
          
          if (!schedule) return 0;
          
          return schedule.entries
            .filter(entry => entry.assignees.includes(assignee))
            .reduce((total, entry) => total + (entry.duration || 60), 0); // Default 1hr
        },
        
        exportAllData: () => {
          const state = get();
          const backupData = {
            version: state.version,
            schedules: state.schedules,
            shares: state.shares,
            filters: state.filters,
            migrationCompleted: state.migrationCompleted,
            lastBackup: new Date().toISOString(),
            exportDate: new Date().toISOString(),
          };
          
          return JSON.stringify(backupData, null, 2);
        },
        
        importData: (data) => {
          try {
            const parsed = JSON.parse(data);
            
            // Validate structure
            if (parsed.version !== 2) {
              throw new Error('Unsupported data version');
            }
            
            // Validate schedules and shares
            scheduleSchema.array().parse(parsed.schedules || []);
            shareSchema.array().parse(parsed.shares || []);
            
            set({
              schedules: parsed.schedules || [],
              shares: parsed.shares || [],
              filters: parsed.filters || get().filters,
              migrationCompleted: parsed.migrationCompleted !== false,
              lastBackup: parsed.lastBackup || '',
            });
            
            // Update storage
            storage.setSchedules(parsed.schedules || []);
            storage.setShares(parsed.shares || []);
            
            return true;
          } catch (error) {
            console.error('Import failed:', error);
            return false;
          }
        },
      }),
      {
        name: 'hk-schedules-v2-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          version: state.version,
          schedules: state.schedules,
          shares: state.shares,
          filters: state.filters,
          migrationCompleted: state.migrationCompleted,
          lastBackup: state.lastBackup,
        }),
        migrate: (persistedState, version) => {
          if (version === 0) {
            // Initial migration from empty state
            return { ...persistedState, version: 2 };
          }
          return persistedState;
        },
      }
    ),
    { 
      name: 'hk-schedules-v2',
      // Enable Redux DevTools in development
      enabled: import.meta.env.DEV,
    }
  )
);

// Utility functions (internal)
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function hashPinSync(pin: string): string {
  // Simplified sync version for validation (use real hash for comparison)
  return btoa(pin).slice(0, 64); // Mock - replace with actual sync hash if needed
}

// Export typed hooks for components
export const useSchedules = () => {
  const { schedules, getFilteredSchedules, addSchedule, updateSchedule } = useStore();
  return { schedules, filteredSchedules: getFilteredSchedules(), addSchedule, updateSchedule };
};

export const useFilters = () => {
  const { filters, setFilters, clearFilters } = useStore();
  return { filters, setFilters, clearFilters };
};

export const useShares = () => {
  const { shares, createShare, validateShare } = useStore();
  return { shares, createShare, validateShare };
};

export const useMigration = () => {
  const { initializeStore, migrationCompleted } = useStore();
  return { initializeStore, migrationCompleted };
};

// Initialize store on app load
if (import.meta.env.DEV) {
  console.log('🛠️ HK-Schedules v2 Store initialized');
  console.log('📊 Store actions:', Object.keys(useStore.getState()));
}
```

#### Store Usage Patterns
```typescript
// In components
function Dashboard() {
  const { filteredSchedules, setFilters } = useSchedules();
  const { filters } = useFilters();
  
  // Component logic...
}

// Optimized selector usage (prevents unnecessary re-renders)
function ScheduleStats({ scheduleId }: { scheduleId: string }) {
  const totalDuration = useStore((state) => state.getTotalDuration(scheduleId));
  const workload = useStore((state) => state.getAssigneeWorkload('John Doe', scheduleId));
  
  return <div>Total: {totalDuration}min, John: {workload}min</div>;
}
```

### 3. Routing Implementation (src/routes/AppRoutes.tsx)

#### Route Configuration
```typescript
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import MainLayout from './layout/MainLayout';
import Dashboard from '../components/dashboard/Dashboard';
import ScheduleEditor from '../components/schedule/ScheduleEditor';
import { ShareGuard } from './guards/ShareGuard';
import ShareView from '../components/sharing/ShareView';
import { store, useStore } from '../lib/store';

// Query client for future API caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Initialize store on router creation
const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Dashboard />,
        loader: () => {
          // Initialize store on app load
          useStore.getState().initializeStore();
          return null;
        },
      },
      {
        path: 'schedule/:scheduleId',
        element: <ScheduleEditor />,
        loader: ({ params }) => {
          const schedule = useStore.getState().getScheduleById(params.scheduleId!);
          if (!schedule) {
            throw new Response('Not Found', { status: 404 });
          }
          return { schedule };
        },
      },
      {
        path: 'share/:shareId',
        element: (
          <ShareGuard>
            <ShareView />
          </ShareGuard>
        ),
        loader: ({ params }) => {
          const share = useStore.getState().getShareById(params.shareId!);
          if (!share) {
            throw new Response('Share not found', { status: 404 });
          }
          return { shareId: params.shareId };
        },
      },
    ],
  },
]);

// Error boundary component
function ErrorBoundary() {
  const navigate = useNavigate();
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    // Reset error on navigation
    return () => setError(null);
  }, [navigate]);
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
        <p className="mt-2">{error.message}</p>
        <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
      </div>
    );
  }
  
  return <div>Error boundary active</div>;
}

// Root App component
export function AppRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
}
```

#### Share Guard Implementation (src/routes/guards/ShareGuard.tsx)
```typescript
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../lib/store';
import PinValidation from '../../components/sharing/PinValidation';

interface ShareGuardProps {
  children: React.ReactNode;
}

export function ShareGuard({ children }: ShareGuardProps) {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const { validateShare } = useStore();
  
  useEffect(() => {
    if (!shareId) {
      navigate('/', { replace: true });
      return;
    }
    
    // Check if share requires PIN
    const share = useStore.getState().getShareById(shareId);
    if (!share) {
      navigate('/', { replace: true });
      return;
    }
    
    if (share.pinHash) {
      // PIN required - show modal
      setShowPinModal(true);
    } else {
      // No PIN - validate immediately
      const schedule = validateShare(shareId, undefined);
      setIsValid(!!schedule);
    }
  }, [shareId, navigate, validateShare]);
  
  if (isValid === null) {
    return <div>Loading share...</div>;
  }
  
  if (!isValid) {
    return <div>Invalid or expired share link</div>;
  }
  
  if (showPinModal) {
    return (
      <PinValidation 
        onValidate={(pin) => {
          const schedule = validateShare(shareId!, pin);
          if (schedule) {
            setIsValid(true);
            setShowPinModal(false);
          } else {
            // Show error - invalid PIN
            console.log('Invalid PIN');
          }
        }}
        onCancel={() => navigate('/', { replace: true })}
      />
    );
  }
  
  return <>{children}</>;
}
```

### 4. Data Model Implementation (src/types/schedule.ts)

#### Complete Type Definitions
```typescript
import { z } from 'zod';
import type { ScheduleCategory, Status, Recurrence } from './enums';

// Enums
export enum ScheduleCategory {
  SHIFT = 'shift',
  CLIENT = 'client',
  LOCATION = 'location',
  CUSTOM = 'custom',
}

export enum Status {
  PENDING = 'pending',
  COMPLETED = 'completed',
}

export enum Recurrence {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

// Core Interfaces
export interface ScheduleEntry {
  id: string;
  time: string; // "09:00-12:00" format
  task: string;
  assignees: string[]; // Array of names/emails
  duration?: number; // Minutes, auto-calculated
  status: Status;
  notes?: string;
  recurrence?: Recurrence;
  createdAt: Date;
  updatedAt: Date;
  shareId?: string;
  sharePin?: string; // Hashed PIN
}

export interface Schedule {
  id: string;
  title: string;
  description?: string;
  category: ScheduleCategory;
  startDate: Date;
  endDate?: Date;
  entries: ScheduleEntry[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
  isArchived?: boolean;
  assignees?: string[]; // Schedule-level team
}

export interface ShareConfig {
  id: string;
  scheduleId: string;
  pinHash?: string;
  expiresAt: Date;
  accessCount: number;
  createdAt: Date;
  creator?: string;
}

// Filter types
export interface Filters {
  searchTerm: string;
  category?: ScheduleCategory;
  assignee?: string;
  dateRange?: [Date, Date];
  status?: Status;
  currentScheduleId?: string;
}

// Store state type
export interface StoreState {
  version: number;
  schedules: Schedule[];
  shares: ShareConfig[];
  filters: Filters;
  migrationCompleted: boolean;
  lastBackup: string;
}

// Utility types
export type ScheduleEntryInput = Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>;
export type ScheduleInput = Omit<Schedule, 'id' | 'createdAt' | 'updatedAt' | 'version'>;
export type PartialSchedule = Partial<Schedule>;
export type ScheduleOrNull = Schedule | null;

// Validation result types
export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Export everything for barrel
export * from './enums';
```

#### Validation Schemas (src/lib/validation.ts)
```typescript
import { z } from 'zod';
import type { ScheduleCategory, Status, Recurrence, Schedule, ScheduleEntry } from '../types';

// Entry validation
export const entrySchema = z.object({
  id: z.string().uuid('Invalid ID format'),
  time: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      'Time must be in HH:MM-HH:MM format (24hr)'
    ),
  task: z
    .string()
    .min(1, 'Task cannot be empty')
    .max(500, 'Task description cannot exceed 500 characters'),
  assignees: z
    .array(
      z
        .string()
        .min(1, 'Assignee name cannot be empty')
        .max(100, 'Assignee name too long')
        .email('Must be valid email') // Or just name validation
        .or(z.string().min(2)) // Allow names without @ for simple validation
    )
    .min(1, 'At least one assignee required')
    .max(10, 'Maximum 10 assignees per task'),
  duration: z.number().min(15, 'Minimum 15 minutes').max(1440, 'Maximum 24 hours').optional(),
  status: z.nativeEnum(Status),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  recurrence: z.nativeEnum(Recurrence).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  shareId: z.string().uuid().optional(),
  sharePin: z.string().optional(), // Hashed PIN
});

// Schedule validation
export const scheduleSchema = z.object({
  id: z.string().uuid('Invalid schedule ID'),
  title: z
    .string()
    .min(1, 'Schedule title required')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  category: z.nativeEnum(ScheduleCategory, {
    errorMap: () => ({ message: 'Valid category required' }),
  }),
  startDate: z.coerce.date('Invalid start date'),
  endDate: z.coerce.date('Invalid end date').optional(),
  entries: z
    .array(entrySchema)
    .min(1, 'Schedule must contain at least one entry')
    .max(200, 'Maximum 200 entries per schedule'),
  version: z.number().min(2, 'Invalid schema version'),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  isArchived: z.boolean().optional(),
  assignees: z.array(z.string().min(1)).optional(),
});

// Share validation
export const shareSchema = z.object({
  id: z.string().uuid('Invalid share ID'),
  scheduleId: z.string().uuid('Invalid schedule ID'),
  pinHash: z.string().optional(),
  expiresAt: z.coerce.date().refine(
    (date) => date > new Date(),
    'Share must expire in the future'
  ),
  accessCount: z.number().min(0, 'Access count cannot be negative'),
  createdAt: z.coerce.date(),
  creator: z.string().optional(),
});

// Filter validation
export const filtersSchema = z.object({
  searchTerm: z.string().max(100, 'Search term too long'),
  category: z.nativeEnum(ScheduleCategory).optional(),
  assignee: z.string().optional(),
  dateRange: z.tuple([z.coerce.date(), z.coerce.date()]).optional(),
  status: z.nativeEnum(Status).optional(),
  currentScheduleId: z.string().uuid().optional(),
});

// Infer TypeScript types from schemas
export type ValidatedScheduleEntry = z.infer<typeof entrySchema>;
export type ValidatedSchedule = z.infer<typeof scheduleSchema>;
export type ValidatedShareConfig = z.infer<typeof shareSchema>;
export type ValidatedFilters = z.infer<typeof filtersSchema>;

// Validation utilities
export const validateScheduleEntry = (data: unknown): ValidationResult<ScheduleEntry> => {
  try {
    const validated = entrySchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Validation failed' };
  }
};

export const validateSchedule = (data: unknown): ValidationResult<Schedule> => {
  try {
    const validated = scheduleSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Validation failed' };
  }
};

export const validateAndSanitizeAssignees = (assignees: string[]): string[] => {
  return z
    .array(z.string().min(1).max(100))
    .min(1)
    .max(10)
    .parse(assignees)
    .map(assignee => assignee.trim().toLowerCase());
};

// Batch validation for arrays
export const validateScheduleEntries = (entries: unknown[]): ValidationResult<ScheduleEntry[]> => {
  try {
    const validated = z.array(entrySchema).parse(entries);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Validation failed: ${error.errors.map(e => e.message).join(', ')}` 
      };
    }
    return { success: false, error: 'Batch validation failed' };
  }
};
```

### 5. Component Implementation Guide

#### Dashboard Component (src/components/dashboard/Dashboard.tsx)
```typescript
import { useState, useMemo, useCallback } from 'react';
import { useSchedules, useFilters } from '../../lib/store';
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  Users, 
  Archive 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, addDays } from 'date-fns';
import { ScheduleCategory, Status } from '../../types';
import DashboardCard from './DashboardCard';
import FilterBar from './FilterBar';
import EmptyState from './EmptyState';
import { useVirtualizer } from '@tanstack/react-virtual'; // For large lists

interface DashboardProps {}

export default function Dashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { filteredSchedules, addSchedule } = useSchedules();
  const { filters, setFilters, clearFilters } = useFilters();
  
  // Virtualizer for performance (if >20 schedules)
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredSchedules.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Card height
    overscan: 5,
  });
  
  // Memoized filtered data
  const displaySchedules = useMemo(() => {
    return filteredSchedules.slice(0, 50); // Pagination limit
  }, [filteredSchedules]);
  
  const handleSearchChange = useCallback((value: string) => {
    setFilters({ searchTerm: value });
  }, [setFilters]);
  
  const handleCategoryChange = useCallback((value: ScheduleCategory | undefined) => {
    setFilters({ category: value });
  }, [setFilters]);
  
  const handleDateRangeChange = useCallback((range: Date[] | undefined) => {
    setFilters({ dateRange: range as [Date, Date] });
  }, [setFilters]);
  
  const handleClearFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);
  
  // Statistics
  const stats = useMemo(() => {
    const totalSchedules = filteredSchedules.length;
    const activeSchedules = filteredSchedules.filter(s => !s.isArchived).length;
    const totalEntries = filteredSchedules.reduce((sum, s) => sum + s.entries.length, 0);
    const avgDuration = filteredSchedules.length > 0 
      ? filteredSchedules.reduce((sum, s) => sum + s.entries.reduce((eSum, e) => eSum + (e.duration || 60), 0), 0) / totalSchedules 
      : 0;
    
    return { totalSchedules, activeSchedules, totalEntries, avgDuration };
  }, [filteredSchedules]);
  
  if (filteredSchedules.length === 0 && Object.values(filters).every(v => !v)) {
    return <EmptyState onCreate={() => setShowCreateModal(true)} />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Schedules</h1>
          <Badge variant="secondary" className="text-sm">
            {stats.activeSchedules} active
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearFilters}
            className="hidden md:flex"
          >
            Clear Filters
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Schedule
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSchedules}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeSchedules} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEntries}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(stats.avgDuration)} min avg
            </p>
          </CardContent>
        </Card>
        
        {/* Add more stats cards */}
      </div>
      
      {/* Filter Bar */}
      <FilterBar 
        filters={filters}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
        onDateRangeChange={handleDateRangeChange}
        onClear={handleClearFilters}
      />
      
      {/* Schedules Grid */}
      <div className="space-y-4">
        <div 
          ref={parentRef}
          className="h-[calc(100vh-300px)] overflow-auto rounded-lg border"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const schedule = displaySchedules[virtualRow.index];
            return (
              <div
                key={schedule.id}
                data-index={virtualRow.index}
                ref={virtualRow.measureElement}
                className={cn(
                  'p-4 border-b',
                  virtualRow.index % 2 === 0 ? 'bg-background' : 'bg-muted/50'
                )}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <DashboardCard schedule={schedule} />
              </div>
            );
          })}
        </div>
        
        {/* Pagination */}
        {filteredSchedules.length > 50 && (
          <div className="flex items-center justify-between px-4 py-2">
            <div className="text-sm text-muted-foreground">
              Showing 1-50 of {filteredSchedules.length} schedules
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Previous</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Create Modal */}
      {showCreateModal && (
        <CreateScheduleModal 
          onClose={() => setShowCreateModal(false)}
          onCreate={(scheduleData) => {
            addSchedule(scheduleData);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}
```

#### Dashboard Card Component (src/components/dashboard/DashboardCard.tsx)
```typescript
import { Link } from 'react-router-dom';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Archive, 
  Calendar, 
  Clock,
  Users 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow, format } from 'date-fns';
import { ScheduleCategory } from '../../types';
import { useStore } from '../../lib/store';
import { useToast } from '@/components/ui/use-toast';

interface DashboardCardProps {
  schedule: Schedule;
}

const categoryColors: Record<ScheduleCategory, string> = {
  shift: 'bg-blue-100 text-blue-800',
  client: 'bg-green-100 text-green-800',
  location: 'bg-purple-100 text-purple-800',
  custom: 'bg-gray-100 text-gray-800',
};

export default function DashboardCard({ schedule }: DashboardCardProps) {
  const { archiveSchedule, deleteSchedule } = useStore();
  const { toast } = useToast();
  
  const entryCount = schedule.entries.length;
  const activeEntries = schedule.entries.filter(e => e.status === 'pending').length;
  const totalDuration = schedule.entries.reduce((sum, e) => sum + (e.duration || 60), 0);
  
  const handleArchive = () => {
    const success = archiveSchedule(schedule.id);
    if (success) {
      toast({
        title: 'Schedule archived',
        description: `${schedule.title} has been archived.`,
      });
    }
  };
  
  const handleDelete = () => {
    if (window.confirm(`Delete "${schedule.title}"? This cannot be undone.`)) {
      const success = deleteSchedule(schedule.id);
      if (success) {
        toast({
          title: 'Schedule deleted',
          description: `${schedule.title} has been permanently deleted.`,
          variant: 'destructive',
        });
      }
    }
  };
  
  const handleShare = async () => {
    // Generate share link logic
    const shareConfig = await useStore.getState().createShare(schedule.id, undefined, 7);
    if (shareConfig) {
      const shareUrl = `${window.location.origin}/share/${shareConfig.id}`;
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Share link copied',
        description: `Link for "${schedule.title}" copied to clipboard.`,
      });
    }
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold line-clamp-1">
              <Link 
                to={`/schedule/${schedule.id}`}
                className="hover:text-primary hover:underline"
              >
                {schedule.title}
              </Link>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Badge className={cn('text-xs', categoryColors[schedule.category])}>
                {schedule.category.replace('_', ' ').toUpperCase()}
              </Badge>
              
              {schedule.entries.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeEntries}/{entryCount} active
                </Badge>
              )}
            </div>
            
            <CardDescription className="text-xs line-clamp-2">
              {schedule.description || 'No description'}
            </CardDescription>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to={`/schedule/${schedule.id}`} className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Schedule
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleShare} className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Share Schedule
              </DropdownMenuItem>
              
              {!schedule.isArchived ? (
                <DropdownMenuItem 
                  onClick={handleArchive} 
                  className="flex items-center gap-2 text-amber-600"
                >
                  <Archive className="h-4 w-4" />
                  Archive Schedule
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem 
                  onClick={() => archiveSchedule(schedule.id)} 
                  className="flex items-center gap-2 text-green-600"
                >
                  <Edit className="h-4 w-4" />
                  Unarchive
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem 
                onClick={handleDelete} 
                className="flex items-center gap-2 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete Permanently
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Schedule metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {format(schedule.startDate, 'MMM dd, yyyy')}
                {schedule.endDate && ` - ${format(schedule.endDate, 'MMM dd, yyyy')}`}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{Math.round(totalDuration / 60)}h total</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>
                {new Set(schedule.entries.flatMap(e => e.assignees)).size} team members
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="font-medium">
              {formatDistanceToNow(schedule.updatedAt, { addSuffix: true })}
            </div>
            <div className="text-muted-foreground">Last updated</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 pb-4">
        {schedule.entries.length > 0 && (
          <div className="space-y-1">
            {schedule.entries.slice(0, 3).map((entry) => (
              <div key={entry.id} className="flex items-center gap-2 text-xs">
                <div className="font-mono text-muted-foreground min-w-[80px]">
                  {entry.time}
                </div>
                <div className="flex-1 line-clamp-1">{entry.task}</div>
                <Badge 
                  variant={entry.status === 'completed' ? 'default' : 'secondary'}
                  className="text-xs px-2 py-0.5"
                >
                  {entry.status}
                </Badge>
              </div>
            ))}
            
            {schedule.entries.length > 3 && (
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                +{schedule.entries.length - 3} more tasks
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

#### Extended Schedule Form (src/components/schedule/ScheduleForm.tsx)
```typescript
import { useForm, useFieldArray, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useMemo } from 'react';
import { format, parse, differenceInMinutes, addMinutes } from 'date-fns';
import { 
  Button, 
  buttonVariants 
} from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Clock, Users, Save, Calendar } from 'lucide-react';
import { MultiSelect } from './MultiSelect';
import { useToast } from '@/components/ui/use-toast';
import type { Schedule, ScheduleEntry, ScheduleCategory, Status } from '../../types';
import { scheduleSchema, entrySchema } from '../../lib/validation';
import { useSchedules } from '../../lib/store';
import { cn } from '../../lib/utils';

interface ScheduleFormProps {
  schedule?: Schedule | null;
  onSubmit: (data: Schedule) => void;
  onCancel: () => void;
  className?: string;
}

type ScheduleFormData = z.infer<typeof scheduleSchema>;

export default function ScheduleForm({ 
  schedule, 
  onSubmit, 
  onCancel, 
  className 
}: ScheduleFormProps) {
  const { toast } = useToast();
  const predefinedAssignees = useMemo(() => [
    'John Doe',
    'Jane Smith', 
    'Mike Johnson',
    'Sarah Wilson',
    'David Brown',
  ], []);
  
  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: useMemo(() => ({
      title: schedule?.title || '',
      description: schedule?.description || '',
      category: schedule?.category || ScheduleCategory.SHIFT,
      startDate: schedule?.startDate || new Date(),
      endDate: schedule?.endDate || undefined,
      entries: schedule?.entries || [{
        time: '09:00-12:00',
        task: '',
        assignees: [predefinedAssignees[0]],
        status: Status.PENDING,
        duration: 180, // 3 hours
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      }],
      version: 2,
      createdAt: schedule?.createdAt || new Date(),
      updatedAt: schedule?.updatedAt || new Date(),
    }), [schedule, predefinedAssignees]),
    mode: 'onChange',
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'entries',
  });
  
  // Calculate totals
  const totalDuration = useMemo(() => {
    return fields.reduce((sum, fieldName, index) => {
      const entry = form.watch(`entries.${index}`);
      return sum + (entry?.duration || 0);
    }, 0);
  }, [fields, form.watch]);
  
  const handleSubmit = (data: ScheduleFormData) => {
    try {
      // Final validation
      const validatedData = scheduleSchema.parse({
        ...data,
        id: schedule?.id || crypto.randomUUID(),
        version: 2,
        createdAt: schedule?.createdAt || new Date(),
        updatedAt: new Date(),
        isArchived: false,
      });
      
      onSubmit(validatedData);
      toast({
        title: schedule ? 'Schedule updated' : 'Schedule created',
        description: `${data.title} has been ${schedule ? 'updated' : 'created'} successfully.`,
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form.',
        variant: 'destructive',
      });
    }
  };
  
  const addEntry = () => {
    const lastEntryIndex = fields.length - 1;
    const lastEntry = form.getValues(`entries.${lastEntryIndex}`);
    
    // Auto-populate next entry with end time of previous
    const [start, end] = lastEntry?.time?.split('-') || ['09:00', '12:00'];
    const startTime = parse(start, 'HH:mm', new Date());
    const endTime = parse(end, 'HH:mm', new Date());
    const nextStart = addMinutes(endTime, 15); // 15 min break
    
    append({
      time: `${format(nextStart, 'HH:mm')}-12:00`,
      task: '',
      assignees: lastEntry?.assignees || [predefinedAssignees[0]],
      status: Status.PENDING,
      duration: 180,
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };
  
  const updateDuration = (index: number, time: string) => {
    const [startStr, endStr] = time.split('-');
    if (!startStr || !endStr) return;
    
    const start = parse(startStr, 'HH:mm', new Date());
    const end = parse(endStr, 'HH:mm', new Date());
    
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return; // Invalid time
    }
    
    const duration = differenceInMinutes(end, start);
    
    form.setValue(`entries.${index}.duration`, duration, { shouldValidate: true });
    form.setValue(`entries.${index}.time`, time, { shouldValidate: true });
  };
  
  const EntryRow = ({ 
    field, 
    index, 
    control 
  }: { 
    field: any; 
    index: number; 
    control: Control<ScheduleFormData>; 
  }) => (
    <Card className="mb-4 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Task {index + 1}</h3>
        {fields.length > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(index)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Time Input */}
        <FormField
          control={control}
          name={`entries.${index}.time`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time Range</FormLabel>
              <FormControl>
                <Input
                  placeholder="09:00-12:00"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    updateDuration(index, e.target.value);
                  }}
                  className="w-full"
                />
              </FormControl>
              <FormDescription>Format: HH:MM-HH:MM (24 hour)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Task Input */}
        <FormField
          control={control}
          name={`entries.${index}.task`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the task..."
                  className="min-h-[80px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>Max 500 characters</FormDescription>
              <FormMessage />
              <div className="text-xs text-muted-foreground mt-1">
                {field.value?.length || 0}/500
              </div>
            </FormItem>
          )}
        />
        
        {/* Assignee Multi-Select */}
        <FormField
          control={control}
          name={`entries.${index}.assignees`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assignees</FormLabel>
              <FormControl>
                <MultiSelect
                  options={predefinedAssignees}
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Select team members..."
                  className="w-full"
                />
              </FormControl>
              <FormDescription>Select one or more team members</FormDescription>
              <FormMessage />
              <div className="flex flex-wrap gap-1 mt-2">
                {(field.value || []).map((assignee, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {assignee}
                  </Badge>
                ))}
              </div>
            </FormItem>
          )}
        />
      </div>
      
      {/* Additional fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
        <FormField
          control={control}
          name={`entries.${index}.status`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name={`entries.${index}.notes`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input placeholder="Additional notes..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      {/* Duration display */}
      <div className="mt-3 pt-3 border-t text-sm text-muted-foreground flex items-center gap-2">
        <Clock className="w-3 h-3" />
        <span>
          Duration: {form.watch(`entries.${index}.duration`)} minutes
        </span>
      </div>
    </Card>
  );
  
  return (
    <div className={cn('space-y-6', className)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Schedule Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {schedule ? 'Edit Schedule' : 'Create New Schedule'}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  className="ml-auto"
                >
                  Cancel
                </Button>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Morning Shift - Downtown" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional details about this schedule..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Schedule Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ScheduleCategory.SHIFT}>Shift</SelectItem>
                        <SelectItem value={ScheduleCategory.CLIENT}>Client</SelectItem>
                        <SelectItem value={ScheduleCategory.LOCATION}>Location</SelectItem>
                        <SelectItem value={ScheduleCategory.CUSTOM}>Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Entries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Schedule Entries
                <Button 
                  type="button" 
                  onClick={addEntry}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Add individual tasks with time ranges and team assignments
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <EntryRow
                  key={field.id}
                  field={field}
                  index={index}
                  control={form.control}
                />
              ))}
            </CardContent>
          </Card>
          
          {/* Summary & Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Summary</h3>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{fields.length} tasks</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{Math.round(totalDuration / 60)}h {totalDuration % 60}m total</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(form.watch('startDate'), 'MMM dd')} -{' '}
                        {form.watch('endDate') ? format(form.watch('endDate'), 'MMM dd') : 'Ongoing'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-0">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onCancel}
                    className={buttonVariants({ variant: 'outline' })}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={form.formState.isSubmitting}
                    className={buttonVariants({ variant: 'default' })}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {schedule ? 'Update Schedule' : 'Create Schedule'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
```

#### MultiSelect Component (src/components/schedule/MultiSelect.tsx)
```typescript
import { useState, useRef, useEffect } from 'react';
import Select, { components, MultiValue } from 'react-select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { MultiValueGeneric } from 'react-select/dist/declarations/src/types';

const customStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#9ca3af',
    },
    minHeight: '40px',
  }),
  multiValue: (provided: any) => ({
    ...provided,
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    padding: '2px 8px',
  }),
  multiValueLabel: (provided: any) => ({
    ...provided,
    color: '#374151',
    fontSize: '14px',
    fontWeight: '500',
  }),
  multiValueRemove: (provided: any) => ({
    ...provided,
    color: '#9ca3af',
    '&:hover': {
      color: '#dc2626',
      backgroundColor: 'transparent',
    },
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
  menu: (provided: any) => ({
    ...provided,
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected 
      ? '#3b82f6' 
      : state.isFocused 
        ? '#f8fafc' 
        : 'white',
    color: state.isSelected ? 'white' : '#374151',
    '&:hover': {
      backgroundColor: state.isSelected ? '#3b82f6' : '#f1f5f9',
    },
  }),
};

const MultiValueContainer = (props: any) => {
  return (
    <components.MultiValueContainer {...props}>
      <Badge 
        className={cn(
          'border-none bg-primary/10 text-primary border-primary/20',
          'px-2 py-0.5 text-xs font-medium'
        )}
      >
        {props.children}
      </Badge>
    </components.MultiValueContainer>
  );
};

const MultiValueRemove = (props: any) => {
  return (
    <components.MultiValueRemove {...props}>
      <X className="w-3 h-3 text-destructive hover:text-destructive/80" />
    </components.MultiValueRemove>
  );
};

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: string[];
  value?: string[];
  onChange?: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  isSearchable?: boolean;
  maxSelections?: number;
}

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = 'Select options...',
  className,
  isSearchable = true,
  maxSelections = 10,
}: MultiSelectProps) {
  const [inputValue, setInputValue] = useState('');
  const selectRef = useRef<any>(null);
  
  const optionList: Option[] = useMemo(() => {
    return options.map(option => ({
      value: option,
      label: option,
    }));
  }, [options]);
  
  const selectedOptions: Option[] = useMemo(() => {
    return value.map(val => ({
      value: val,
      label: val,
    }));
  }, [value]);
  
  const handleChange = (selected: MultiValue<Option> | null) => {
    const selectedValues = selected ? selected.map(opt => opt.value) : [];
    
    if (selectedValues.length > maxSelections) {
      // Don't allow more than max selections
      return;
    }
    
    onChange?.(selectedValues);
  };
  
  const handleInputChange = (input: string, action: { action: string }) => {
    if (action.action === 'set-value' || action.action === 'input-change') {
      setInputValue(input);
    }
    
    // Auto-select if user types exact match
    if (action.action === 'input-change' && input) {
      const exactMatch = options.find(opt => 
        opt.toLowerCase() === input.toLowerCase()
      );
      
      if (exactMatch && !value.includes(exactMatch)) {
        const newValue = [...value, exactMatch];
        onChange?.(newValue.slice(0, maxSelections));
        setInputValue('');
        selectRef.current?.blur();
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue && !value.includes(inputValue)) {
      e.preventDefault();
      const newValue = [...value, inputValue];
      onChange?.(newValue.slice(0, maxSelections));
      setInputValue('');
    }
  };
  
  const isMaxSelections = value.length >= maxSelections;
  
  return (
    <div className={cn('w-full', className)}>
      <Select
        ref={selectRef}
        isMulti
        options={optionList}
        value={selectedOptions}
        onChange={handleChange}
        onInputChange={handleInputChange}
        inputValue={inputValue}
        placeholder={isMaxSelections ? `Max ${maxSelections} selected` : placeholder}
        isSearchable={isSearchable}
        isClearable
        isDisabled={isMaxSelections}
        styles={customStyles}
        components={{
          MultiValueContainer,
          MultiValueRemove,
        }}
        classNamePrefix="react-select"
        className={cn(
          'react-select-container',
          isMaxSelections && 'opacity-75 cursor-not-allowed'
        )}
        onKeyDown={handleKeyDown}
        noOptionsMessage={({ inputValue }) => 
          options.length === value.length 
            ? `Max ${maxSelections} selections reached` 
            : `No options match "${inputValue}"`
        }
        filterOption={(option, input) => {
          // Custom filtering to include exact matches
          return option.label.toLowerCase().includes(input.toLowerCase());
        }}
        maxMenuHeight={200}
        menuPlacement="auto"
        closeMenuOnSelect={false}
      />
      
      {/* Selection count badge */}
      {value.length > 0 && (
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            {value.length} {value.length === 1 ? 'selection' : 'selections'}
            {isMaxSelections && (
              <Badge variant="secondary" className="text-xs">
                MAX
              </Badge>
            )}
          </div>
          
          {/* Clear all button */}
          {!isMaxSelections && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange?.([])}
              className="h-6 px-2 text-xs"
            >
              Clear all
            </Button>
          )}
        </div>
      )}
      
      {/* Custom input for quick entry */}
      {isSearchable && !isMaxSelections && (
        <div className="mt-2">
          <Input
            placeholder="Type to add new option..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-sm"
          />
        </div>
      )}
    </div>
  );
}
```

### 6. Storage & Migration Implementation

#### Storage Layer (src/lib/storage.ts)
```typescript
import type { Schedule, ShareConfig, StoreState } from '../types';
import { scheduleSchema, shareSchema } from './validation';
import { toast } from 'sonner'; // Or your toast library

const STORAGE_KEY = 'hk-schedules-v2';
const V1_STORAGE_KEY = 'housekeeperSchedules';
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB

export class StorageManager {
  private storage: Storage;
  
  constructor(storage: Storage = localStorage) {
    this.storage = storage;
  }
  
  // Get full store state
  getStoreState(defaultState?: Partial<StoreState>): StoreState {
    try {
      const stored = this.storage.getItem(STORAGE_KEY);
      if (!stored) return this.getDefaultState(defaultState);
      
      const parsed = JSON.parse(stored);
      
      // Validate structure
      if (parsed.version !== 2) {
        console.warn('Invalid store version, resetting to defaults');
        return this.getDefaultState(defaultState);
      }
      
      // Validate critical data
      try {
        scheduleSchema.array().parse(parsed.schedules || []);
        shareSchema.array().parse(parsed.shares || []);
      } catch (error) {
        console.error('Store validation failed:', error);
        toast.error('Data validation failed, using backup');
        return this.getDefaultState({ ...defaultState, ...parsed });
      }
      
      return parsed as StoreState;
    } catch (error) {
      console.error('Failed to read store:', error);
      return this.getDefaultState(defaultState);
    }
  }
  
  // Set full store state
  setStoreState(state: StoreState): boolean {
    try {
      // Validate before writing
      scheduleSchema.array().parse(state.schedules);
      shareSchema.array().parse(state.shares);
      
      // Check storage quota
      if (this.getStorageUsage() > MAX_STORAGE_SIZE * 0.8) {
        this.warnStorageQuota();
      }
      
      this.storage.setItem(STORAGE_KEY, JSON.stringify(state));
      
      // Update last backup timestamp
      const updatedState = { ...state, lastBackup: new Date().toISOString() };
      this.storage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
      
      return true;
    } catch (error) {
      console.error('Failed to write store:', error);
      if (error instanceof QuotaExceededError) {
        this.handleQuotaExceeded();
      }
      return false;
    }
  }
  
  // Specific getters/setters
  getSchedules(): Schedule[] {
    return this.getStoreState().schedules;
  }
  
  setSchedules(schedules: Schedule[]): boolean {
    const state = this.getStoreState();
    const newState = { ...state, schedules };
    return this.setStoreState(newState);
  }
  
  getShares(): ShareConfig[] {
    return this.getStoreState().shares;
  }
  
  setShares(shares: ShareConfig[]): boolean {
    const state = this.getStoreState();
    const newState = { ...state, shares };
    return this.setStoreState(newState);
  }
  
  // Migration from v1
  migrateFromV1(): boolean {
    try {
      const v1Data = this.storage.getItem(V1_STORAGE_KEY);
      if (!v1Data) return false;
      
      const v1Schedules: any[] = JSON.parse(v1Data);
      if (!Array.isArray(v1Schedules) || v1Schedules.length === 0) {
        this.storage.removeItem(V1_STORAGE_KEY);
        return false;
      }
      
      console.log(`Migrating ${v1Schedules.length} v1 schedules...`);
      
      // Transform v1 data to v2 format
      const migratedSchedules: Schedule[] = v1Schedules.map((v1Entry, index) => {
        // Parse v1 entry structure (adjust based on actual v1 format)
        const { name, date, start, end, tasks, ...rest } = v1Entry;
        
        // Create single entry from v1 data
        const entry: ScheduleEntry = {
          id: crypto.randomUUID(),
          time: `${start}-${end}`,
          task: tasks || '',
          assignees: [name], // Single assignee in v1
          status: Status.PENDING,
          duration: this.calculateDuration(start, end),
          notes: rest.notes || '',
          createdAt: date ? new Date(date) : new Date(),
          updatedAt: new Date(),
        };
        
        return {
          id: crypto.randomUUID(),
          title: name || `Migrated Schedule ${index + 1}`,
          description: `Migrated from v1 on ${new Date().toLocaleDateString()}`,
          category: ScheduleCategory.CUSTOM,
          startDate: date ? new Date(date) : new Date(),
          endDate: undefined,
          entries: [entry],
          version: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          isArchived: false,
        } as Schedule;
      });
      
      // Get current v2 state and merge
      const currentState = this.getStoreState();
      const mergedSchedules = [...currentState.schedules, ...migratedSchedules];
      
      // Update store with migration flag
      const migratedState: StoreState = {
        ...currentState,
        schedules: mergedSchedules,
        migrationCompleted: true,
        lastBackup: new Date().toISOString(),
      };
      
      this.setStoreState(migratedState);
      
      // Clean up v1 data
      this.storage.removeItem(V1_STORAGE_KEY);
      
      console.log(`✅ Successfully migrated ${migratedSchedules.length} schedules`);
      toast.success(`Migrated ${migratedSchedules.length} schedules from v1`);
      
      return true;
    } catch (error) {
      console.error('Migration failed:', error);
      toast.error('Migration failed - v1 data preserved');
      return false;
    }
  }
  
  // Export functions
  exportAllData(): string {
    const state = this.getStoreState();
    const exportData = {
      ...state,
      exportDate: new Date().toISOString(),
      exportFormat: 'hk-schedules-v2',
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  exportBackup(): Blob {
    const json = this.exportAllData();
    return new Blob([json], { type: 'application/json' });
  }
  
  // Import function
  importData(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      
      // Verify format
      if (parsed.exportFormat !== 'hk-schedules-v2') {
        throw new Error('Invalid export format');
      }
      
      // Validate data
      scheduleSchema.array().parse(parsed.schedules || []);
      shareSchema.array().parse(parsed.shares || []);
      
      // Merge with existing data (don't overwrite everything)
      const currentState = this.getStoreState();
      const mergedState: StoreState = {
        ...currentState,
        schedules: [...currentState.schedules, ...(parsed.schedules || [])],
        shares: [...currentState.shares, ...(parsed.shares || [])],
        lastBackup: new Date().toISOString(),
      };
      
      return this.setStoreState(mergedState);
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import data');
      return false;
    }
  }
  
  // Utility methods
  private getDefaultState(defaults?: Partial<StoreState>): StoreState {
    return {
      version: 2,
      schedules: [],
      shares: [],
      filters: {
        searchTerm: '',
        category: undefined,
        assignee: undefined,
        dateRange: undefined,
        status: undefined,
        currentScheduleId: undefined,
      },
      migrationCompleted: false,
      lastBackup: '',
      ...defaults,
    };
  }
  
  private calculateDuration(start: string, end: string): number {
    try {
      const [startHour, startMin] = start.split(':').map(Number);
      const [endHour, endMin] = end.split(':').map(Number);
      
      const startDate = new Date();
      startDate.setHours(startHour, startMin, 0, 0);
      
      const endDate = new Date();
      endDate.setHours(endHour, endMin, 0, 0);
      
      return (endDate.getTime() - startDate.getTime()) / (1000 * 60);
    } catch {
      return 60; // Default 1 hour
    }
  }
  
  getStorageUsage(): number {
    let total = 0;
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)!;
      const value = this.storage.getItem(key);
      if (value) {
        total += value.length;
      }
    }
    return total;
  }
  
  private warnStorageQuota(): void {
    const usage = this.getStorageUsage();
    const percentage = (usage / MAX_STORAGE_SIZE) * 100;
    
    console.warn(`Storage usage: ${(percentage).toFixed(1)}% (${usage} bytes)`);
    toast.warning(
      `Storage almost full (${percentage.toFixed(0)}%)`,
      'Consider exporting your data or deleting old schedules.'
    );
  }
  
  private handleQuotaExceeded(): void {
    console.error('Storage quota exceeded');
    toast.error(
      'Storage limit reached',
      'Please export your data and clear space, or use the desktop app for larger datasets.'
    );
    
    // Auto-export as fallback
    const backup = this.exportBackup();
    const url = URL.createObjectURL(backup);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hk-schedules-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  // Cleanup methods
  cleanupExpiredShares(): number {
    const state = this.getStoreState();
    const now = new Date();
    const expiredShares = state.shares.filter(s => now > s.expiresAt);
    const validShares = state.shares.filter(s => now <= s.expiresAt);
    
    if (expiredShares.length > 0) {
      const newState = { ...state, shares: validShares };
      this.setStoreState(newState);
      console.log(`Cleaned up ${expiredShares.length} expired shares`);
    }
    
    return expiredShares.length;
  }
  
  // Reset everything (emergency only)
  resetStore(): boolean {
    try {
      this.storage.removeItem(STORAGE_KEY);
      console.log('Store reset to defaults');
      toast.info('Data cleared', 'All schedules and shares have been deleted.');
      return true;
    } catch (error) {
      console.error('Failed to reset store:', error);
      return false;
    }
  }
}

// Singleton instance
export const storage = new StorageManager();

// Export types for store usage
export type { StoreState } from '../types';
```

### 7. Migration Implementation (src/lib/migration.ts)

#### Complete Migration Logic
```typescript
import type { Schedule, ScheduleEntry } from '../types';
import { storage } from './storage';
import { scheduleSchema } from './validation';
import { toast } from 'sonner';

interface V1ScheduleEntry {
  id?: string;
  name: string;
  date?: string;
  start: string;
  end: string;
  tasks: string;
  [key: string]: any;
}

interface V1Store {
  schedules: V1ScheduleEntry[];
}

/**
 * Complete v1 to v2 migration logic
 * Handles data transformation, validation, and error recovery
 */
export function migrateV1Data(): boolean {
  try {
    // Check if migration already completed
    const currentState = storage.getStoreState();
    if (currentState.migrationCompleted) {
      console.log('Migration already completed');
      return true;
    }
    
    // Check for v1 data
    const v1DataRaw = localStorage.getItem('housekeeperSchedules');
    if (!v1DataRaw) {
      console.log('No v1 data found, marking migration as complete');
      storage.setStoreState({ ...currentState, migrationCompleted: true });
      return true;
    }
    
    console.log('🔄 Starting v1 to v2 migration...');
    
    // Parse v1 data
    let v1Data: V1Store;
    try {
      v1Data = JSON.parse(v1DataRaw);
      if (!Array.isArray(v1Data.schedules)) {
        throw new Error('Invalid v1 data structure');
      }
    } catch (parseError) {
      console.error('Failed to parse v1 data:', parseError);
      localStorage.removeItem('housekeeperSchedules'); // Clean up invalid data
      return false;
    }
    
    if (v1Data.schedules.length === 0) {
      console.log('No v1 schedules to migrate');
      localStorage.removeItem('housekeeperSchedules');
      storage.setStoreState({ ...currentState, migrationCompleted: true });
      return true;
    }
    
    console.log(`Migrating ${v1Data.schedules.length} v1 schedules...`);
    
    // Transform each v1 entry to v2 format
    const migratedSchedules: Schedule[] = [];
    
    for (let i = 0; i < v1Data.schedules.length; i++) {
      const v1Entry = v1Data.schedules[i];
      try {
        const migrated = migrateSingleEntry(v1Entry, i);
        if (migrated) {
          migratedSchedules.push(migrated);
        }
      } catch (entryError) {
        console.warn(`Failed to migrate entry ${i + 1}:`, entryError);
        // Continue with other entries
      }
    }
    
    if (migratedSchedules.length === 0) {
      console.error('No schedules could be migrated');
      return false;
    }
    
    // Validate migrated data
    try {
      scheduleSchema.array().parse(migratedSchedules);
    } catch (validationError) {
      console.error('Migrated data validation failed:', validationError);
      return false;
    }
    
    // Merge with existing v2 data (if any)
    const existingSchedules = currentState.schedules || [];
    const allSchedules = [...existingSchedules, ...migratedSchedules];
    
    // Create migration metadata
    const migrationInfo = {
      migratedCount: migratedSchedules.length,
      totalCount: v1Data.schedules.length,
      failedCount: v1Data.schedules.length - migratedSchedules.length,
      migrationDate: new Date().toISOString(),
      originalDataSize: v1DataRaw.length,
    };
    
    // Update store with migrated data
    const newState = {
      ...currentState,
      schedules: allSchedules,
      migrationCompleted: true,
      lastBackup: new Date().toISOString(),
      migrationInfo, // Store migration metadata
    };
    
    const saveSuccess = storage.setStoreState(newState);
    
    if (saveSuccess) {
      // Clean up v1 data
      localStorage.removeItem('housekeeperSchedules');
      
      console.log(`✅ Migration completed: ${migrationInfo.migratedCount}/${migrationInfo.totalCount} schedules`);
      console.log('Migration metadata:', migrationInfo);
      
      // Show user-friendly notification
      toast.success(
        `Migration Complete!`,
        `${migrationInfo.migratedCount} schedules successfully migrated from v1. Your data is now in the new multi-schedule format.`
      );
      
      // Log detailed migration report
      console.table(migrationInfo);
      
      return true;
    } else {
      console.error('Failed to save migrated data');
      return false;
    }
    
  } catch (error) {
    console.error('Migration process failed:', error);
    
    // Preserve v1 data on failure
    toast.error(
      'Migration Failed',
      'We encountered an error during migration. Your original data is preserved. Please try again or contact support.'
    );
    
    return false;
  }
}

/**
 * Transform single v1 entry to v2 schedule format
 */
function migrateSingleEntry(v1Entry: V1ScheduleEntry, index: number): Schedule | null {
  try {
    // Validate v1 entry structure
    if (!v1Entry.name || !v1Entry.tasks) {
      throw new Error('Missing required fields: name or tasks');
    }
    
    if (!v1Entry.start || !v1Entry.end) {
      throw new Error('Missing time information');
    }
    
    // Parse times and calculate duration
    const [startHour, startMin] = v1Entry.start.split(':').map(Number);
    const [endHour, endMin] = v1Entry.end.split(':').map(Number);
    
    if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
      throw new Error('Invalid time format');
    }
    
    const startDate = new Date();
    startDate.setHours(startHour, startMin, 0, 0);
    
    const endDate = new Date();
    endDate.setHours(endHour, endMin, 0, 0);
    
    if (endDate <= startDate) {
      throw new Error('End time must be after start time');
    }
    
    const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
    
    // Create v2 entry from v1 data
    const v2Entry: ScheduleEntry = {
      id: crypto.randomUUID(),
      time: `${v1Entry.start}-${v1Entry.end}`,
      task: v1Entry.tasks,
      assignees: [v1Entry.name], // v1 was single assignee
      status: 'pending' as const,
      duration: Math.round(duration),
      notes: v1Entry.notes || '',
      recurrence: undefined,
      createdAt: v1Entry.date ? new Date(v1Entry.date) : new Date(),
      updatedAt: new Date(),
    };
    
    // Create v2 schedule wrapper
    const v2Schedule: Schedule = {
      id: crypto.randomUUID(),
      title: v1Entry.name || `Schedule ${index + 1}`,
      description: `Migrated from v1 application on ${new Date().toLocaleDateString()}. Original entry: ${v1Entry.tasks.substring(0, 100)}${v1Entry.tasks.length > 100 ? '...' : ''}`,
      category: 'custom' as const,
      startDate: v1Entry.date ? new Date(v1Entry.date) : new Date(),
      endDate: undefined, // v1 was single day
      entries: [v2Entry],
      version: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
    };
    
    // Validate the transformed data
    scheduleSchema.parse(v2Schedule);
    
    console.log(`Migrated entry ${index + 1}: "${v1Entry.name}" -> "${v2Schedule.title}"`);
    
    return v2Schedule;
    
  } catch (error) {
    console.error(`Migration failed for entry ${index + 1}:`, error);
    return null;
  }
}

/**
 * Check if v1 data exists and needs migration
 */
export function needsMigration(): boolean {
  const v1Data = localStorage.getItem('housekeeperSchedules');
  const v2State = storage.getStoreState();
  
  if (!v1Data) return false;
  
  try {
    const v1Parsed = JSON.parse(v1Data);
    return Array.isArray(v1Parsed.schedules) && v1Parsed.schedules.length > 0 && !v2State.migrationCompleted;
  } catch {
    return false;
  }
}

/**
 * Get migration status with details
 */
export function getMigrationStatus(): {
  needsMigration: boolean;
  isComplete: boolean;
  v1Count: number;
  v2Count: number;
  hasErrors: boolean;
} {
  const v1Data = localStorage.getItem('housekeeperSchedules');
  const v2State = storage.getStoreState();
  
  let v1Count = 0;
  let hasErrors = false;
  
  if (v1Data) {
    try {
      const v1Parsed = JSON.parse(v1Data);
      v1Count = Array.isArray(v1Parsed.schedules) ? v1Parsed.schedules.length : 0;
    } catch {
      hasErrors = true;
    }
  }
  
  const needsMigration = v1Count > 0 && !v2State.migrationCompleted;
  const isComplete = v2State.migrationCompleted;
  
  return {
    needsMigration,
    isComplete,
    v1Count,
    v2Count: v2State.schedules.length,
    hasErrors,
  };
}

/**
 * Emergency migration recovery
 * Attempts to recover from failed migration by preserving v1 data
 */
export function recoverFromMigrationFailure(): boolean {
  try {
    // Check if we have corrupted v2 data but intact v1 data
    const v2State = storage.getStoreState();
    const v1Data = localStorage.getItem('housekeeperSchedules');
    
    if (!v1Data) {
      console.warn('No v1 data available for recovery');
      return false;
    }
    
    // If v2 data is empty or migration flag is false but v1 exists
    if (v2State.schedules.length === 0 || !v2State.migrationCompleted) {
      console.log('Attempting migration recovery...');
      
      const success = migrateV1Data();
      
      if (success) {
        console.log('Recovery migration completed');
        return true;
      }
    }
    
    // Fallback: restore v1 data as read-only
    localStorage.setItem('housekeeperSchedules-backup', v1Data);
    console.log('v1 data preserved as backup');
    
    return true;
  } catch (error) {
    console.error('Recovery failed:', error);
    return false;
  }
}

/**
 * Manual migration trigger (for testing/admin)
 */
export function triggerManualMigration(): boolean {
  if (!needsMigration()) {
    console.log('No migration needed');
    return false;
  }
  
  console.log('Manual migration triggered');
  return migrateV1Data();
}

// Export for store initialization
export { migrateV1Data as performMigration };
```

### 8. Testing Implementation

#### Unit Tests Setup (tests/store.test.ts)
```typescript
import { renderHook, act } from '@testing-library/react';
import { useStore } from '../src/lib/store';
import { 
  ScheduleCategory, 
  Status, 
  type Schedule, 
  type ScheduleEntry 
} from '../src/types';
import { storage } from '../src/lib/storage';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('HK-Schedules v2 Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });
  
  describe('Initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useStore());
      
      expect(result.current.schedules).toEqual([]);
      expect(result.current.shares).toEqual([]);
      expect(result.current.version).toBe(2);
      expect(result.current.migrationCompleted).toBe(false);
    });
    
    it('should persist state to localStorage', () => {
      const { result } = renderHook(() => useStore());
      
      act(() => {
        result.current.addSchedule({
          title: 'Test Schedule',
          category: ScheduleCategory.SHIFT,
          startDate: new Date(),
          entries: [],
        });
      });
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'hk-schedules-v2-storage',
        expect.stringContaining('"schedules"')
      );
    });
  });
  
  describe('Schedule Operations', () => {
    it('should add a new schedule with validation', () => {
      const { result } = renderHook(() => useStore());
      
      const scheduleData = {
        title: 'Morning Shift',
        category: ScheduleCategory.SHIFT,
        startDate: new Date('2025-01-15'),
        entries: [{
          time: '09:00-12:00',
          task: 'Clean rooms',
          assignees: ['John Doe'],
          status: Status.PENDING,
          duration: 180,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as ScheduleEntry],
      };
      
      act(() => {
        const newSchedule = result.current.addSchedule(scheduleData);
        expect(newSchedule).toMatchObject({
          ...scheduleData,
          id: expect.any(String),
          version: 2,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          isArchived: false,
        });
        expect(newSchedule.entries).toHaveLength(1);
        expect(newSchedule.entries[0].assignees).toEqual(['John Doe']);
      });
      
      expect(result.current.schedules).toHaveLength(1);
      expect(result.current.schedules[0].title).toBe('Morning Shift');
    });
    
    it('should reject invalid schedule data', () => {
      const { result } = renderHook(() => useStore());
      
      const invalidData = {
        title: '', // Required field missing
        category: ScheduleCategory.SHIFT,
        startDate: new Date(),
        entries: [],
      } as any;
      
      expect(() => {
        act(() => {
          result.current.addSchedule(invalidData);
        });
      }).toThrow('Schedule title required');
    });
    
    it('should update existing schedule', () => {
      const { result } = renderHook(() => useStore());
      
      // Create initial schedule
      let scheduleId: string;
      act(() => {
        const schedule = result.current.addSchedule({
          title: 'Original',
          category: ScheduleCategory.SHIFT,
          startDate: new Date(),
          entries: [],
        });
        scheduleId = schedule.id;
      });
      
      // Update schedule
      act(() => {
        const updated = result.current.updateSchedule(scheduleId!, {
          title: 'Updated Title',
          description: 'Updated description',
        });
        
        expect(updated).not.toBeNull();
        expect(updated!.title).toBe('Updated Title');
        expect(updated!.description).toBe('Updated description');
        expect(updated!.updatedAt).toBeGreaterThan(result.current.schedules[0].updatedAt);
      });
      
      expect(result.current.schedules[0].title).toBe('Updated Title');
    });
    
    it('should archive schedule (soft delete)', () => {
      const { result } = renderHook(() => useStore());
      
      let scheduleId: string;
      act(() => {
        const schedule = result.current.addSchedule({
          title: 'To Archive',
          category: ScheduleCategory.SHIFT,
          startDate: new Date(),
          entries: [],
        });
        scheduleId = schedule.id;
      });
      
      act(() => {
        const success = result.current.archiveSchedule(scheduleId!);
        expect(success).toBe(true);
      });
      
      const archivedSchedule = result.current.schedules.find(s => s.id === scheduleId);
      expect(archivedSchedule).not.toBeUndefined();
      expect(archivedSchedule!.isArchived).toBe(true);
      expect(archivedSchedule!.title).toBe('To Archive');
    });
    
    it('should permanently delete schedule', () => {
      const