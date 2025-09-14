# UX/UI Dashboard Overhaul - Detailed User Stories

## Overview
This document shards the [UX/UI Dashboard Overhaul Epic](ux-ui-dashboard-overhaul-epic.md) into granular user stories with sub-tasks, acceptance criteria, and implementation details. Stories are organized by epic phase and follow INVEST principles (Independent, Negotiable, Valuable, Estimable, Small, Testable). Each story includes:

- **Story Points**: Fibonacci estimate (1-13)
- **Dependencies**: Related stories/components
- **Design References**: Links to UX specs
- **Testing Requirements**: Specific test types/coverage

Total: 28 stories, ~60-80 story points across 2 sprints.

---

## Phase 1: Foundation - Refactor for Modularity (15 points)

### Story US-001.1: Extract Shared Schedule Utilities
**As a developer**, I want unified utility functions for date/time formatting so I can maintain consistent behavior across components without duplication.

**Story Points**: 3  
**Dependencies**: None  
**Design References**: Phase 1 utils specs  

**Sub-tasks**:
1. Create `formatDate(date?: string): string` in `src/lib/utils.ts` (handles "No date" fallback, locale formatting)
2. Create `getDuration(start: string, end: string): string` (handles hours/minutes, edge cases like same time)
3. Update `schedule-form.tsx` to use utils (lines 63-67 time validation)
4. Update `schedule-table.tsx` to use utils (lines 54-65 duration calc)
5. Update `print-schedule.tsx` to use utils (lines 23-34 duration calc)
6. Add unit tests for both functions (edge cases: invalid times, empty strings, cross-day schedules)

**Acceptance Criteria**:
- All 3 files import/use utils instead of inline logic
- Tests pass: 100% coverage, handles invalid inputs gracefully
- No visual/functional changes to existing UI
- ESLint shows no duplication warnings

**Testing Requirements**:
- Unit: Jest tests for utils (5+ cases each)
- Integration: RTL tests for form/table rendering with utils

### Story US-001.2: Create CountBadge Component
**As a developer**, I want a reusable CountBadge component so I can display schedule counts consistently without duplicating badge markup.

**Story Points**: 2  
**Dependencies**: US-001.1  
**Design References**: Phase 1 CountBadge specs  

**Sub-tasks**:
1. Create `src/components/ui/count-badge.tsx` with props: `count: number`, `variant?: 'default' | 'secondary'`
2. Implement variants: default (blue bg #3B82F6), secondary (gray outline)
3. Add accessibility: `aria-label="${count} schedules"`
4. Replace header badge in `App.tsx` line 162 with `<CountBadge count={schedules.length} />`
5. Remove duplicate badges from: table title (line 260), import card (implied), print summary
6. Add Storybook story for component variants
7. Write unit tests for rendering, prop updates, accessibility

**Acceptance Criteria**:
- Only one badge instance in header; others removed
- Component renders correctly in light/dark mode
- Screen reader announces count properly
- Percy visual tests pass (no regressions)

**Testing Requirements**:
- Unit: RTL snapshot tests for variants
- Accessibility: axe-core integration test
- Visual: Percy baseline for badge rendering

### Story US-001.3: Implement IconLabel Wrapper
**As a developer**, I want an IconLabel wrapper component so I can standardize icon+label patterns and reduce ~10 inline repetitions.

**Story Points**: 5  
**Dependencies**: US-001.2  
**Design References**: Phase 1 IconLabel specs  

**Sub-tasks**:
1. Create `src/components/ui/icon-label.tsx` with props: `icon: React.ComponentType`, `label: string`, `required?: boolean`
2. Implement styling: `flex items-center gap-2 text-sm font-medium` with red asterisk for required
3. Replace form labels in `schedule-form.tsx`:
   - Line 167: `<IconLabel icon={User} label="Housekeeper Name" required />`
   - Line 186: `<IconLabel icon={Calendar} label="Date" />`
   - Lines 202,220: `<IconLabel icon={Clock} label="Start/End Time" required />`
   - Line 240: `<IconLabel icon={List} label="Tasks" />`
4. Replace table headers in `schedule-table.tsx`:
   - Line 156: Housekeeper header
   - Line 162: Date header  
   - Lines 202,220: Time headers
5. Update print headers in `print-schedule.tsx` lines 121-135
6. Add Tailwind classes for consistent spacing: `text-muted-foreground` for icons
7. Create icon constants in `utils.ts`: `export const ICONS = { USER: User, CALENDAR: Calendar, ... }`
8. Write comprehensive tests: rendering, required state, dark mode

**Acceptance Criteria**:
- Zero inline `<Icon /> + <Label>` patterns remain
- All icons use ICONS constants (no direct imports)
- Visual consistency across form/table/print
- Component is DRY (no repeated Tailwind strings)

**Testing Requirements**:
- Unit: 8+ test cases (variants, required, dark mode)
- Integration: Form rendering test with all IconLabel instances
- Code Quality: ESLint custom rule for icon patterns

### Story US-001.4: Form/Table Validation Standardization
**As a developer**, I want shared validation logic so form and table handle data consistently (e.g., 500-char tasks limit).

**Story Points**: 5  
**Dependencies**: US-001.1, US-001.3  
**Design References**: Phase 1 validation sync  

**Sub-tasks**:
1. Create `useScheduleValidation` hook in `src/hooks/use-schedule-validation.ts`
2. Extract form validation from `schedule-form.tsx` lines 44-77 into hook
3. Add shared rules: name (2+ chars), time (end > start), tasks (<500 chars)
4. Update `schedule-table.tsx` to validate imported CSV data using same hook
5. Standardize error display: consistent `border-destructive` + error messages
6. Add validation for duration calculation edge cases (e.g., overnight shifts)
7. Update tests to cover shared validation across contexts

**Acceptance Criteria**:
- Single source of truth for validation rules
- Form and import use identical validation
- Error states render consistently across components
- Tests cover all validation scenarios

**Testing Requirements**:
- Unit: Hook tests with mock data (valid/invalid cases)
- Integration: E2E for form submission with errors
- Edge Cases: Overnight times, special characters in names/tasks

---

## Phase 2: Streamline Dashboard Layout (25 points)

### Story US-002.1: Implement Dashboard Grid Layout
**As a user**, I want a responsive grid layout so I can access actions, form, and table simultaneously without excessive scrolling.

**Story Points**: 8  
**Dependencies**: Phase 1 complete  
**Design References**: Phase 2 grid wireframe  

**Sub-tasks**:
1. Update `App.tsx` container: replace `space-y-6` with `grid grid-cols-1 lg:grid-cols-3 gap-6`
2. Create grid areas: Col1 (actions 20%), Col2 (form modal 40%), Col3 (table 60%)
3. Implement responsive breakpoints: xs (stack), sm (2-col), lg (3-col)
4. Add `min-h-screen` and proper spacing: `p-4 md:p-6 lg:p-8`
5. Update form card: `col-span-1 lg:col-span-2` for wider layout
6. Update table card: `col-span-full lg:col-span-1` with `overflow-x-auto`
7. Add CSS Grid debug classes temporarily: `bg-red-100/20` for areas
8. Test layout on all breakpoints (Tailwind Play CDN for verification)
9. Remove debug classes; add Storybook layout story

**Acceptance Criteria**:
- Desktop: 3-column grid with proper proportions
- Tablet: 2-column responsive layout
- Mobile: Single column stack (no horizontal scroll)
- All components remain accessible in new layout
- Lighthouse layout shift score <0.1

**Testing Requirements**:
- Visual: Percy tests for all breakpoints
- Responsive: BrowserStack testing (Chrome/Firefox/Safari mobile)
- Performance: Lighthouse CLS (Cumulative Layout Shift) <0.1

### Story US-002.2: Create StickyToolbar Component
**As a user**, I want a persistent toolbar so I can access core actions (Add/Print/Export) from anywhere in the dashboard.

**Story Points**: 5  
**Dependencies**: US-002.1  
**Design References**: Phase 2 StickyToolbar specs  

**Sub-tasks**:
1. Create `src/components/sticky-toolbar.tsx` with props: `onAdd, onPrint, onExport, onImport`
2. Desktop variant: `fixed top-4 right-4 z-40` with fade-in animation
3. Mobile variant: `fixed bottom-4 left-4 right-4 z-40` rounded-full
4. Implement purple accent hover: `#8B5CF6` with 150ms transition
5. Add icons: Plus (Add), Printer (Print), Download (Export), Upload (Import)
6. Create button variants: primary (Add), outline (others)
7. Add responsive button sizing: `h-10 px-4` desktop, `h-12 w-12` mobile
8. Implement accessibility: `role="navigation" aria-label="Dashboard actions"`
9. Add keyboard shortcuts: Cmd+K for actions menu
10. Write tests: rendering, click handlers, responsive behavior

**Acceptance Criteria**:
- Toolbar persists during scroll/form interactions
- Mobile bottom positioning doesn't overlap content
- All buttons trigger correct handlers
- Purple hover states work in light/dark mode
- Keyboard navigation works (Tab order correct)

**Testing Requirements**:
- Unit: RTL tests for button clicks and responsive rendering
- Integration: Test toolbar visibility during form open/close
- Accessibility: Keyboard-only navigation test

### Story US-002.3: Implement Form Accordion
**As a user**, I want collapsible form sections so I can focus on table view when not editing schedules.

**Story Points**: 5  
**Dependencies**: US-002.1, shadcn/ui Accordion  
**Design References**: Phase 2 accordion wireframe  

**Sub-tasks**:
1. Install/update shadcn Accordion component
2. Wrap ScheduleForm in `AccordionItem` with type="single" collapsible
3. Add trigger: "Add New Schedule" button that toggles accordion
4. Implement smooth height animation: `max-h-0 overflow-hidden` to `max-h-[60vh]`
5. Update App.tsx state: `showForm` controls accordion open state
6. Add focus management: trap focus in form when open
7. Implement escape key to close form
8. Add ARIA attributes: `aria-expanded`, `aria-controls`
9. Test form submission closes accordion automatically
10. Add loading skeleton while form animates

**Acceptance Criteria**:
- Form collapses/expands smoothly without layout jump
- Table remains visible (partially) when form open
- Keyboard users can Tab through form, Escape to close
- Screen reader announces state changes
- Animation completes in <300ms

**Testing Requirements**:
- E2E: Cypress test for form open/close flow
- Accessibility: axe-core test for accordion patterns
- Performance: Test animation performance on low-end devices

### Story US-002.4: Add Table Virtualization
**As a user**, I want smooth scrolling performance so the schedule table handles 50+ items without lag.

**Story Points**: 5  
**Dependencies**: US-002.1, react-window  
**Design References**: Phase 2 table enhancements  

**Sub-tasks**:
1. Install `react-window` and `react-window-infinite-loader` (if needed)
2. Replace `TableBody` in `schedule-table.tsx` with `FixedSizeList`
3. Configure list: itemSize=72px (row height), height="60vh"
4. Create `Row` component that renders single `TableRow` with virtualization props
5. Preserve sorting/filtering: pass `sortedSchedules` to virtual list
6. Handle scroll position restoration on filter changes
7. Add loading state for initial render (skeleton rows)
8. Test performance with 100 mock schedule items
9. Add `overscanCount={5}` for smooth scrolling
10. Document virtualization setup in component comments

**Acceptance Criteria**:
- Table renders 100+ rows without performance degradation
- Scroll position maintained during sort/filter
- Visual appearance identical to non-virtualized version
- Initial render shows skeleton rows <500ms
- Memory usage stable with large datasets

**Testing Requirements**:
- Performance: React Profiler test (<16ms per row render)
- Integration: Test sorting/filtering with virtualized rows
- Stress: Load test with 500 synthetic schedules

### Story US-002.5: Mobile Card View Enhancements
**As a mobile user**, I want optimized card interactions so I can manage schedules with touch gestures.

**Story Points**: 2  
**Dependencies**: US-002.4  
**Design References**: Phase 2 mobile wireframe  

**Sub-tasks**:
1. Enhance mobile card view in `schedule-table.tsx` (lines 239-315)
2. Add swipe gestures: left-swipe → edit, right-swipe → delete (use `react-swipeable`)
3. Implement haptic feedback on swipe (navigator.vibrate if supported)
4. Add long-press context menu for actions (edit/delete/export)
5. Improve card spacing: `space-y-3` instead of `space-y-4` for density
6. Add skeleton cards for loading state (3-5 placeholders)
7. Test touch targets: minimum 44px height per card
8. Add ARIA roles for swipeable elements
9. Implement pull-to-refresh for schedule list

**Acceptance Criteria**:
- Swipe gestures work smoothly on touch devices
- Long-press shows contextual menu within 200ms
- Cards meet mobile accessibility guidelines (44px touch targets)
- Pull-to-refresh updates schedules from localStorage

**Testing Requirements**:
- Device: BrowserStack mobile testing (iOS Safari, Android Chrome)
- Interaction: Test swipe accuracy and haptic feedback
- Accessibility: VoiceOver/TalkBack support for gestures

---

## Phase 3: Add Interaction & Filtering (20 points)

### Story US-004.1: Build FilterBar Component
**As a user**, I want a comprehensive filter bar so I can quickly find specific schedules without scrolling through all items.

**Story Points**: 8  
**Dependencies**: Phase 2 complete, shadcn MultiSelect  
**Design References**: Phase 3 FilterBar wireframe  

**Sub-tasks**:
1. Create `src/components/filter-bar.tsx` with search + cascade dropdowns
2. Implement search input with debounce (300ms) using `useDebounce` hook
3. Add MultiSelect for Category (Clean, Laundry, Kitchen, etc.) - shadcn extension
4. Add MultiSelect for Assignee (housekeeper names from schedules)
5. Add Date picker cascade: Today, This Week, Custom Range (use shadcn DatePicker)
6. Create Chip component for active filters (removable with X button)
7. Implement chip styling: blue outline (#3B82F6), active purple fill (#8B5CF6)
8. Add "Clear All Filters" button when filters active
9. Create filter state management: `useFilterState` hook with localStorage persistence
10. Add accessibility: ARIA live region for filter results count
11. Write comprehensive tests: search, multi-select, chip removal, date ranges

**Acceptance Criteria**:
- Search filters in real-time (<300ms debounce)
- Cascade logic: Category filters available assignees
- Chips display all active filters and allow removal
- Date picker handles ranges correctly (Today, This Week, Custom)
- Filter state persists across page reloads
- Screen reader announces "X of Y schedules match filters"

**Testing Requirements**:
- Unit: Test each filter type independently
- Integration: End-to-end filter combinations (category + date + search)
- Performance: Measure filter re-render time (<100ms for 100 items)

### Story US-004.2: Integrate Filtering with Schedule Table
**As a user**, I want table results to update automatically so I see only relevant schedules after applying filters.

**Story Points**: 5  
**Dependencies**: US-004.1  
**Design References**: Phase 3 filter integration  

**Sub-tasks**:
1. Update `App.tsx` to pass `filters` state to `ScheduleTable`
2. Create `useFilteredSchedules` hook that combines all filter logic
3. Implement search filtering: fuzzy match on name, tasks (use `fuse.js` or simple regex)
4. Implement category filtering: match against tasks/content
5. Implement assignee filtering: exact match on housekeeper name
6. Implement date filtering: range comparison with proper timezone handling
7. Add "No results found" state with search suggestions
8. Preserve sort order within filtered results
9. Add filter count badge: "Showing 12 of 45 schedules"
10. Optimize with `useMemo` to prevent unnecessary re-renders

**Acceptance Criteria**:
- All filter combinations work correctly (AND logic)
- Search finds partial matches in names/tasks
- Date filtering handles edge cases (no date, future dates)
- Performance: <100ms re-render for 100+ items
- "No results" state shows helpful messaging

**Testing Requirements**:
- Unit: Test filter combinations with mock data sets
- Integration: E2E tests for complex filter scenarios
- Performance: Benchmark filtering speed with large datasets

### Story US-005.1: Implement Bulk Selection
**As a manager**, I want to select multiple schedules so I can perform batch operations efficiently.

**Story Points**: 3  
**Dependencies**: US-004.2  
**Design References**: Phase 3 bulk actions wireframe  

**Sub-tasks**:
1. Add checkbox column to `schedule-table.tsx` header and rows
2. Implement header checkbox: select all/none, partial selection state
3. Add `selectedSchedules` state management in App.tsx
4. Enable Shift+Click for range selection
5. Add keyboard support: Space to toggle, Cmd+A for select all
6. Implement row highlighting for selected items (`bg-accent/50`)
7. Add selection count display: "3 items selected"
8. Persist selection during sort/filter operations
9. Add ARIA attributes for screen readers
10. Test selection with virtualized rows (react-window compatibility)

**Acceptance Criteria**:
- Users can select individual, range, or all schedules
- Selection state persists through sort/filter
- Keyboard users can select/deselect efficiently
- Screen reader announces selection count and state
- Performance maintains with 100+ items

**Testing Requirements**:
- Unit: Test selection state logic and keyboard interactions
- Integration: Verify selection works with virtualized table
- Accessibility: NVDA/VoiceOver testing for checkbox navigation

### Story US-005.2: Create Bulk Actions Dropdown
**As a manager**, I want bulk action options so I can edit, delete, or export multiple selected schedules at once.

**Story Points**: 4  
**Dependencies**: US-005.1  
**Design References**: Phase 3 bulk dropdown  

**Sub-tasks**:
1. Create bulk actions bar: appears when items selected, positioned above table
2. Implement dropdown menu: Edit Selected, Delete Selected, Export Selected
3. Add confirmation dialogs for destructive actions (delete)
4. Implement bulk edit: open modal with common fields pre-filled
5. Implement bulk delete: batch localStorage updates with undo toast
6. Implement bulk export: generate CSV with selected schedules only
7. Add loading states for bulk operations (spinner on buttons)
8. Create success/error toasts for bulk operations
9. Add keyboard shortcuts: Cmd+E (edit), Cmd+Del (delete)
10. Test edge cases: mixed valid/invalid selections

**Acceptance Criteria**:
- Bulk actions only available when items selected
- Delete confirmation prevents accidental data loss
- Bulk edit pre-fills common values (dates, categories)
- Export generates correct CSV format for selected items
- Undo functionality works for bulk delete (5s timeout)
- Operations complete without UI blocking

**Testing Requirements**:
- E2E: Complete bulk workflows (select → action → verify)
- Integration: Test localStorage batch operations
- Error Handling: Test partial failures in bulk operations

---

## Phase 4: Advanced Features & Polish (20 points)

### Story US-006.1: Create ShareModal Component
**As a user**, I want a share modal so I can generate secure links and PINs for individual schedules.

**Story Points**: 8  
**Dependencies**: Phase 3 complete, server.js integration  
**Design References**: Phase 4 ShareModal wireframe  

**Sub-tasks**:
1. Create `src/components/share-modal.tsx` with shadcn Dialog base
2. Add schedule selection: dropdown or click-to-share from table row
3. Implement link generation: `app.com/share/{token}` (integrate server.js)
4. Add copy-to-clipboard functionality for share link (navigator.clipboard)
5. Create PIN generation: 4-digit random number, display prominently
6. Add QR code generation using `qrcode.react` library
7. Implement expiry selector: Never, 1 day, 7 days, Custom date
8. Add share settings: read-only vs. edit permissions (future-proof)
9. Create modal styling: centered, max-w-md, purple accent buttons
10. Add analytics tracking for share events
11. Implement error handling: failed token generation, copy errors
12. Write comprehensive tests: modal open/close, copy functionality, QR rendering

**Acceptance Criteria**:
- Modal opens from table row context menu or bulk action
- Share links work and include proper tokens
- PIN displays clearly and copies easily
- QR codes scan correctly on mobile devices
- Expiry dates apply correctly to shared links
- Modal is accessible (keyboard navigation, screen reader)
- Error states handled gracefully (network failures)

**Testing Requirements**:
- E2E: Complete share workflow (generate → copy → verify)
- Integration: Mock server.js endpoints for token generation
- Device: Test QR scanning on iOS/Android
- Security: Verify tokens can't be guessed or bypassed

### Story US-006.2: Implement Server-Side Sharing Infrastructure
**As a developer**, I want secure server endpoints so share links and PINs work reliably without exposing data.

**Story Points**: 5  
**Dependencies**: US-006.1  
**Design References**: Epic technical specs  

**Sub-tasks**:
1. Add `/api/generate-share-token` POST endpoint in `server.js`
2. Implement token generation: UUID v4 + schedule ID + timestamp
3. Create token storage: in-memory map or simple database (future-proof)
4. Add PIN validation endpoint: `/api/validate-pin/{token}`
5. Implement share link validation: `/api/share/{token}` GET
6. Add expiry checking: tokens auto-expire based on settings
7. Create rate limiting: 10 shares per hour per user
8. Add CORS headers for frontend requests
9. Implement error responses: 404 for invalid tokens, 429 for rate limits
10. Add logging for share events (security audit trail)
11. Write API tests using Jest supertest
12. Document API endpoints in README

**Acceptance Criteria**:
- Tokens generate and validate correctly
- Expiry logic works (tokens become invalid after set time)
- Rate limiting prevents abuse
- Error responses follow REST conventions
- API documentation complete and accurate

**Testing Requirements**:
- API: Supertest integration tests for all endpoints
- Security: Test for common vulnerabilities (token guessing, race conditions)
- Performance: Handle 100 concurrent share requests

### Story US-007.1: Create Read-Only Table Variant
**As a shared user**, I want a read-only schedule view so I can review schedules without edit capabilities.

**Story Points**: 3  
**Dependencies**: US-006.1  
**Design References**: Phase 4 read-only wireframe  

**Sub-tasks**:
1. Add `isReadOnly?: boolean` prop to `ScheduleTable` component
2. Hide Edit/Delete buttons when `isReadOnly=true`
3. Mute action column: grayed out appearance, no hover states
4. Add prominent Print/Export header for read-only mode
5. Implement watermark overlay: "Shared View" diagonal text (opacity 0.1)
6. Disable row interactions: no selection, no sorting in read-only
7. Add share metadata: "Shared by [User] on [Date]" header
8. Update styling: remove hover effects, add `cursor-not-allowed`
9. Add ARIA attributes: `aria-disabled="true"` for muted elements
10. Test read-only mode with shared token validation

**Acceptance Criteria**:
- No edit/delete functionality available in read-only
- Print/Export buttons remain prominent and functional
- Watermark visible but doesn't interfere with content
- Share metadata displays correctly
- Performance identical to normal table

**Testing Requirements**:
- Integration: Test read-only mode with mocked share token
- Visual: Percy tests confirm muted styling
- Accessibility: Verify disabled states announced properly

### Story US-008.1: Extend Dark Mode Implementation
**As a user**, I want consistent dark mode support so I can use the app in low-light environments comfortably.

**Story Points**: 3  
**Dependencies**: All previous stories  
**Design References**: PRD v2 theme extensions  

**Sub-tasks**:
1. Audit current dark mode implementation in Tailwind config
2. Add dark mode variants to all new components (CountBadge, FilterBar, etc.)
3. Update grid layout colors: `dark:bg-muted dark:border-border`
4. Ensure purple accent (#8B5CF6) has proper dark mode contrast
5. Add dark mode toggle to StickyToolbar (system/prefer dark)
6. Implement smooth theme transition (300ms CSS transition)
7. Test all components in dark mode: readability, focus states
8. Update print styles for dark mode compatibility
9. Add dark mode screenshots to Storybook
10. Verify accessibility: WCAG contrast ratios in both themes

**Acceptance Criteria**:
- All components render correctly in dark mode
- Theme toggle works and persists in localStorage
- Smooth transition between themes (<500ms)
- Print styles work correctly regardless of theme
- Contrast ratios meet WCAG 2.1 AA (4.5:1)

**Testing Requirements**:
- Visual: Percy tests for light/dark variants
- Accessibility: Automated contrast checking
- Cross-browser: Test theme toggle in Chrome/Firefox/Safari

### Story US-008.2: Polish Typography and Colors
**As a user**, I want professional typography and consistent colors so the app feels polished and trustworthy.

**Story Points**: 3  
**Dependencies**: US-008.1  
**Design References**: PRD v2 color/typography guidelines  

**Sub-tasks**:
1. Implement Inter font family across all components
2. Standardize heading hierarchy: h1 (32px), h2 (24px), h3 (20px), body (14px)
3. Update color usage: Primary (#3B82F6), Accent (#8B5CF6), Muted (#6B7280)
4. Apply consistent line-height: 1.5 for body, 1.3 for headings
5. Add letter-spacing to buttons: `tracking-sm` (0.025em)
6. Implement proper text truncation: `truncate` for long names, `line-clamp-2` for tasks
7. Update focus states: consistent `ring-2 ring-primary ring-offset-2`
8. Add loading states with skeleton text patterns
9. Create design system documentation in Storybook
10. Audit and fix any remaining color/typography inconsistencies

**Acceptance Criteria**:
- Consistent typography across all components
- Color usage follows established palette
- Focus indicators visible and consistent
- Text truncation prevents layout breaks
- Design system docs complete and accurate

**Testing Requirements**:
- Visual: Percy baseline for typography updates
- Browser: Test font loading and fallbacks
- Accessibility: Verify focus order and visibility

---

## Sprint Planning Guidance

**Sprint 1 (30 points)**: US-001.1-4, US-002.1-3 (Foundation + Layout)
**Sprint 2 (30 points)**: US-002.4-5, US-004.1-2, US-005.1-2 (Filtering + Interactions)  
**Sprint 3 (20 points)**: US-006.1-2, US-007.1, US-008.1-2 (Sharing + Polish)

**Velocity Target**: 25-30 points per sprint  
**Daily Standup Focus**: Component integration, visual regression testing  
**Sprint Review**: User testing sessions, A/B comparison with current dashboard

## Implementation Notes
- Use feature branches: `feature/us-001-1-utils-extraction`
- PRs require: tests passing, Percy approval, UX design review
- Storybook updates mandatory for new components
- Cross-reference epic acceptance criteria in each PR

This sharding provides actionable, testable stories that can be implemented independently while contributing to the overall epic goals.