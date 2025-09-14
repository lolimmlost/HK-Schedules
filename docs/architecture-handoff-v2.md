
# HK-Schedules v2 Architecture Handoff Document

**Version**: 2.0.0  
**Date**: September 2025  
**Epic**: BE-001 Multi-Schedule Management and Team Collaboration Enhancement  
**Status**: Ready for Implementation  
**Lead Architect**: Sonoma (Architect Mode)  
**Implementation Timeline**: 4-6 weeks (2 sprints)  
**Success Criteria**: 95% test coverage, <1s dashboard load, 100% v1 data migration  

## 🎯 Executive Summary

The HK-Schedules v2 architecture transforms the existing v1.0 single-schedule housekeeper management application into a scalable multi-schedule team collaboration platform while maintaining 100% backward compatibility. This brownfield evolution follows these core principles (per [v1 PRD](../PRD/v1/) and [v2 Brownfield PRD](../PRD/v2/)):

- **Incremental Enhancement**: 80% v1 code reuse, no breaking changes
- **Local-First Architecture**: Enhanced localStorage with v1→v2 migration
- **Modular State Management**: Zustand global store with granular selectors
- **Progressive Web Experience**: SPA routing with v1 compatibility mode
- **Performance-First**: <500KB bundle, <1s interactive, mobile-optimized
- **Zero Data Loss**: Automatic migration with rollback capabilities
- **Team Collaboration Ready**: Multi-assignee, sharing, filtering, bulk actions

### Key Architectural Decisions

1. **State Management**: Zustand replaces local hooks for global multi-schedule state
2. **Data Model**: v1 flat structure → v2 nested Schedule/Entry model with UUIDs
3. **Routing**: React Router DOM for SPA navigation with v1 fallback routes
4. **Forms**: React Hook Form + Zod for complex validation and multi-select
5. **Persistence**: Enhanced localStorage with quota management and backups
6. **Sharing**: Secure share links with PIN protection and expiry tracking
7. **Performance**: Code splitting, virtualization, memoization, bundle monitoring

### Implementation Impact
- **Bundle Size**: +124KB (85KB → 209KB, 58% headroom to 500KB budget)
- **Codebase Growth**: +60% (new v2 features, v1 preserved unchanged)
- **Performance**: Dashboard <1s (50 schedules), forms <100ms validation
- **Compatibility**: v1 users see unchanged experience until migration opt-in
- **Migration**: Automatic v1→v2 with 98% success rate target

## 🗺️ Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1-2)
**Focus**: Foundation for v2 architecture  
**Dependencies**: Zustand, UUID, date-fns  
**Deliverables**:
- [ ] Global store implementation (`src/lib/store.ts`)
- [ ] Enhanced data models and validation (`src/types/`, `src/lib/validation.ts`)
- [ ] Storage layer with quota management (`src/lib/storage.ts`)
- [ ] v1→v2 migration service (`src/lib/migration.ts`)
- [ ] Basic type definitions and utilities
- [ ] Unit tests (95% coverage for new code)

**Success Criteria**:
- Store persists/restores correctly
- Migration handles sample v1 data without loss
- localStorage quota warnings functional
- No TypeScript errors in new modules
- Bundle size increase <15KB

### Phase 2: Routing & Navigation (Week 2-3)
**Focus**: SPA structure and v1 compatibility  
**Dependencies**: React Router DOM  
**Deliverables**:
- [ ] Route configuration (`src/routes/AppRoutes.tsx`)
- [ ] Dashboard component (`src/components/dashboard/Dashboard.tsx`)
- [ ] v1 compatibility wrapper (`src/v1/LegacyApp.tsx`)
- [ ] Share route protection (`src/routes/guards/ShareGuard.tsx`)
- [ ] Code splitting and lazy loading
- [ ] Integration tests for navigation flows

**Success Criteria**:
- Dashboard accessible at root path
- Schedule editing at `/schedule/:id`
- v1 route at `/v1/*` works unchanged
- Lazy loading reduces initial bundle <100KB
- Navigation works without page refresh
- 90% route test coverage

### Phase 3: Core Features (Week 3-4)
**Focus**: Multi-schedule functionality  
**Dependencies**: React Hook Form, Zod  
**Deliverables**:
- [ ] Enhanced ScheduleForm with multi-assignee (`src/components/v2/ScheduleEditor.tsx`)
- [ ] ScheduleTable with filtering/bulk actions (`src/components/v2/ScheduleTable.tsx`)
- [ ] FilterBar component (`src/components/dashboard/FilterBar.tsx`)
- [ ] Form validation integration
- [ ] Bulk operation workflows
- [ ] Component integration tests

**Success Criteria**:
- Multi-assignee selection works (up to 10)
- Real-time form validation feedback
- Filter performance <100ms for 50 schedules
- Bulk actions update multiple entries
- 92% component test coverage
- Mobile-responsive forms

### Phase 4: Sharing & Polish (Week 4-5)
**Focus**: Collaboration features and UX refinement  
**Dependencies**: React Select  
**Deliverables**:
- [ ] ShareModal for link generation (`src/components/sharing/ShareModal.tsx`)
- [ ] ShareView read-only component (`src/components/sharing/ShareView.tsx`)
- [ ] PIN validation workflow
- [ ] MultiSelect component (`src/components/ui/multi-select.tsx`)
- [ ] Accessibility implementation (ARIA, keyboard nav)
- [ ] Performance optimization (virtualization, memoization)

**Success Criteria**:
- Share links generate/validate correctly
- PIN protection prevents unauthorized access
- MultiSelect searchable with 100+ options
- WCAG AA compliance (axe-core 100%)
- Dashboard virtualization for 50+ schedules
- 95% total test coverage

### Phase 5: Testing & Deployment (Week 5-6)
**Focus**: Quality assurance and production readiness  
**Deliverables**:
- [ ] E2E test suite (Cypress/Playwright)
- [ ] Performance testing and optimization
- [ ] Security audit and hardening
- [ ] Deployment configuration (Vercel/Cloudflare)
- [ ] Documentation completion
- [ ] Developer handoff and training

**Success Criteria**:
- 95% test coverage (new code), 80% overall
- Lighthouse Performance score >90
- Migration success rate >98% (test dataset)
- Security audit passes (no critical issues)
- Production deployment verified
- Developer documentation complete

## 📋 Developer Onboarding Guide

### Prerequisites
- **Node.js**: v18.17+ (LTS recommended)
- **npm**: v9+ or yarn/pnpm
- **VS Code**: With TypeScript, ESLint, Prettier extensions
- **Browser**: Chrome 100+ for development (multi-browser testing required)
- **Git**: Latest version for version control

### Setup Instructions
```bash
# 1. Clone and install
git clone <repository>
cd hk-schedules
npm install

# 2. Verify setup
npm run type-check      # Should pass with no errors
npm run lint            # Should pass or show fixable issues
npm test                # Should run basic tests

# 3. Start development
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend (if needed)
npm run start

# Terminal 3: API server (for CSV export)
npm run api:dev
```

### Development Workflow
```bash
# Daily development
npm run dev              # Hot reload frontend
npm run type-check       # Type checking
npm run lint             # Code quality
npm test                 # Run tests
npm run test:watch       # Watch mode for TDD

# Before commits
npm run lint -- --fix    # Auto-fix issues
npm run type-check       # Verify types
npm test -- --coverage   # Coverage report

# Before PRs
npm run build            # Production build
npm run preview          # Local production test
npm run analyze          # Bundle size analysis
npm run e2e              # End-to-end tests
```

### Code Structure Overview
```
src/
├── App.tsx                 # v1 App (legacy wrapper)
├── main.tsx                # Entry point with v2 routing
├── v1/                     # Legacy v1 components (unchanged)
│   ├── ScheduleForm.tsx
│   └── ScheduleTable.tsx
├── v2/                     # New v2 components
│   ├── Dashboard.tsx
│   ├── ScheduleEditor.tsx
│   └── ShareView.tsx
├── lib/                    # Business logic
│   ├── store.ts           # Zustand global store
│   ├── validation.ts      # Zod schemas
│   ├── storage.ts         # Persistence layer
│   └── migration.ts       # v1→v2 migration
├── types/                  # TypeScript definitions
├── hooks/                  # Custom React hooks
└── routes/                 # React Router configuration
```

### Key Architectural Patterns

#### 1. Store Access Patterns
```typescript
// Pattern 1: Direct store access (simple components)
function SimpleCounter() {
  const count = useScheduleStore(state => state.schedules.length);
  return <div>{count} schedules</div>;
}

// Pattern 2: Granular selectors (complex components)
function DashboardStats() {
  const stats = useScheduleStore(state => ({
    total: state.schedules.length,
    active: state.schedules.filter(s => !s.isArchived).length,
    recent: state.schedules.slice(0, 5),
  }), shallow);
  
  return (
    <div>
      Total: {stats.total} | Active: {stats.active}
      <RecentSchedules schedules={stats.recent} />
    </div>
  );
}

// Pattern 3: Custom hooks (reusable logic)
function useScheduleActions(scheduleId: string) {
  const updateSchedule = useScheduleStore(state => state.updateSchedule);
  const archiveSchedule = useScheduleStore(state => state.archiveSchedule);
  const schedule = useScheduleStore(state => state.getScheduleById(scheduleId));
  
  const saveSchedule = useCallback((updates) => {
    if (schedule) {
      updateSchedule(scheduleId, updates);
    }
  }, [scheduleId, updateSchedule, schedule]);
  
  return {
    schedule,
    saveSchedule,
    archive: () => archiveSchedule(scheduleId),
  };
}
```

#### 2. Component Integration Patterns
```typescript
// Pattern 1: Pure v1 component (unchanged)
function V1ScheduleForm({ onSubmit }) {
  // v1 local state and logic
  const [formData, setFormData] = useState({});
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit(formData);
    }}>
      {/* v1 inputs */}
    </form>
  );
}

// Pattern 2: v2 component with store integration
function V2ScheduleEditor({ scheduleId }) {
  const { schedule, saveSchedule } = useScheduleActions(scheduleId);
  const form = useForm({
    defaultValues: schedule,
    resolver: zodResolver(scheduleSchema),
  });
  
  const onSubmit = (data) => {
    saveSchedule(data);
    // Navigation or toast
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField name="title">
          <Input {...form.register('title')} />
        </FormField>
        {/* Enhanced v2 fields */}
        <Button type="submit">Save Schedule</Button>
      </form>
    </Form>
  );
}

// Pattern 3: Hybrid component (v1 + v2 features)
function HybridScheduleView({ scheduleId, legacyMode = false }) {
  if (legacyMode) {
    return <V1ScheduleForm scheduleId={scheduleId} />;
  }
  
  return <V2ScheduleEditor scheduleId={scheduleId} />;
}

// Pattern 4: Feature-flagged component
function FeatureFlagScheduleEditor({ scheduleId }) {
  const enableV2Forms = featureFlags.enableV2Forms;
  
  if (enableV2Forms) {
    return <V2ScheduleEditor scheduleId={scheduleId} />;
  }
  
  // Fallback to v1 with v2 data
  return <V1ScheduleForm 
    scheduleId={scheduleId} 
    data={useScheduleStore(state => state.getScheduleById(scheduleId))}
  />;
}
```

#### 3. Error Handling Patterns
```typescript
// Pattern 1: Store-level error boundaries
const useStore = create((set, get) => ({
  // ... state
  
  safeAddSchedule: async (data) => {
    try {
      // Validate
      const validated = scheduleSchema.parse(data);
      
      // Business logic
      const newSchedule = { ...validated, id: uuidv4() };
      
      set(state => ({ schedules: [...state.schedules, newSchedule] }));
      
      // Persistence
      await storage.setSchedules(get().schedules);
      
      return { success: true, schedule: newSchedule };
    } catch (error) {
      if (error instanceof ZodError) {
        return { 
          success: false, 
          error: 'VALIDATION_ERROR',
          details: error.errors.map(e => e.message),
        };
      }
      
      if (error instanceof QuotaExceededError) {
        return { 
          success: false, 
          error: 'STORAGE_QUOTA',
          details: 'Storage limit exceeded',
        };
      }
      
      console.error('Unexpected error adding schedule:', error);
      return { 
        success: false, 
        error: 'UNKNOWN',
        details: 'An unexpected error occurred',
      };
    }
  },
  
  // Error recovery
  recoverFromError: (errorType: string) => {
    switch (errorType) {
      case 'STORAGE_QUOTA':
        storage.triggerAutoExport();
        set({ readOnlyMode: true });
        break;
        
      case 'VALIDATION_ERROR':
        // Reset form to last valid state
        set({ lastValidState: get().previousState });
        break;
        
      case 'NETWORK_ERROR':
        // Retry logic for future cloud sync
        break;
    }
  },
}));

// Pattern 2: Component error boundaries
class StoreErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state