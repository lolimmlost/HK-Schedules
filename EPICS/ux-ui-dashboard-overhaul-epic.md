# UX/UI Dashboard Overhaul Epic

## Epic Summary
**Epic ID**: UX-DASH-001  
**Title**: Streamline HK-Schedules Dashboard - Reduce Repetitions and Overcrowding  
**Status**: Planned  
**Priority**: High  
**Estimated Effort**: 2-4 weeks (1-2 sprints)  
**Business Value**: Improve user satisfaction (SUS score >80), reduce bounce rate by 40%, enable scalability for 50+ schedules and multi-user (from brownfield-multi-user-epic).  
**Acceptance Criteria**:
- Dashboard scroll depth <300px for core tasks (add/view/print).
- Visual repetitions reduced by 70% (icons/badges consolidated).
- Filter/search handles 100+ schedules with <1s response.
- Full WCAG 2.1 AA compliance; Lighthouse score >90.
- No regressions in existing flows (add/edit/delete/export/print).

## Background & Context
From UX assessment: Current dashboard suffers from repeated icons/labels (~15 User/Clock instances), redundant badges (4+ counts), linear stacking causing overcrowding (800-1000px scroll), and lack of filtering (PRD v2 gap). Risks include usability regression and data integrity breaks. This epic implements the 4-phase roadmap and UX designs to create a modular, intuitive interface aligned with PRD v2 wireframes (grid layout, filter bar, share modal).

**Related Artifacts**:
- [PRD v2 UI/UX Design](docs/PRD/v2/ui-ux-design.md)
- [UX Assessment](docs/ux-assessment.md) (to be created)
- [Test Strategy](docs/test-strategy.md) (to be created)

## User Stories & Phases
This epic breaks into 4 phases, each with stories, tasks, and criteria. Use Scrum: Sprint 1 (Phases 1-2), Sprint 2 (Phases 3-4).

### Phase 1: Foundation - Refactor for Modularity
**Objective**: Eliminate code/visual duplications; extract shared components.  
**Stories**:
- **US-001**: As a developer, I want unified utilities and badges so maintenance is easier and UI consistent.
  - Tasks:
    - Extract `getDuration`, `formatDate` to [`src/lib/utils.ts`](src/lib/utils.ts).
    - Create `CountBadge` component (single header usage; remove duplicates).
    - Implement `IconLabel` wrapper (limit to 1 icon per group; replace ~10 inline uses).
  - Acceptance: 100% test coverage (Jest); ESLint DRY passes; no visual diffs in Percy.
  - Effort: 2-3 days.

### Phase 2: Streamline Dashboard Layout
**Objective**: Implement grid/progressive disclosure to reduce overcrowding.  
**Stories**:
- **US-002**: As a user, I want a responsive grid layout so I can access actions/form/table without excessive scrolling.
  - Tasks:
    - Refactor App.tsx to `grid-cols-1 lg:grid-cols-3` (toolbar/form/table).
    - Add `StickyToolbar` (bottom mobile, top-right desktop; purple #8B5CF6 hovers).
    - Use Accordion for form toggle; react-window for table virtualization (>10 rows).
    - Integrate shadcn skeletons for loading.
  - Acceptance: Mobile fits 5 cards in viewport; E2E tests pass (Cypress); Lighthouse mobile >85.
  - Effort: 4-5 days.
- **US-003**: As a user on mobile, I want swipe gestures and bottom nav for quick actions.
  - Tasks: Add swipe-to-edit/delete in card view; bottom fixed toolbar.
  - Acceptance: Usability session: Task completion <10s; no overflow issues.

### Phase 3: Add Interaction & Filtering
**Objective**: Enable search/bulk actions per PRD filter bar.  
**Stories**:
- **US-004**: As a user, I want a filter bar with chips so I can quickly find schedules.
  - Tasks:
    - Build `FilterBar` (search + MultiSelect cascade: category/assignee/date; blue outline chips #3B82F6, active purple #8B5CF6).
    - Integrate with table via useMemo filtering; debounce search (300ms).
  - Acceptance: Filter accuracy 100%; <1s re-render for 100 items; axe-core passes.
  - Effort: 3 days.
- **US-005**: As a manager, I want bulk actions so I can edit/delete/export multiple schedules.
  - Tasks: Add checkboxes + dropdown (Edit/Delete/Export Selected); toast notifications (replace alerts).
  - Acceptance: Bulk flows E2E tested; undo functionality (5s timeout).
  - Effort: 1 day.

### Phase 4: Advanced Features & Polish
**Objective**: Add sharing and themes for collaboration/polish.  
**Stories**:
- **US-006**: As a user, I want a share modal so I can generate secure links for schedules.
  - Tasks:
    - Create `ShareModal` (link copy, PIN, QR via qrcode.react, expiry selector).
    - Integrate server.js for token/PIN generation.
  - Acceptance: Secure sharing E2E (no data leaks); QR scans correctly.
  - Effort: 2 days.
- **US-007**: As a shared user, I want read-only view with print/export so I can review without editing.
  - Tasks: Add `isReadOnly` prop to table (muted actions, watermark "Shared View"); prominent Print header.
  - Acceptance: Print PDF matches wireframes; no edit buttons visible.
  - Effort: 1 day.
- **US-008**: As a user, I want theme polish so the app feels professional in dark/light modes.
  - Tasks: Extend Tailwind dark mode (cards/muteds); apply PRD colors/typography.
  - Acceptance: Cross-browser consistent (Chrome/Firefox/Safari); dark mode toggle works.

## Technical Specifications
- **Components**: New: CountBadge, IconLabel, StickyToolbar, FilterBar, ShareModal. Updates: App.tsx (layout), schedule-table.tsx (bulk/read-only), utils.ts.
- **Design Guidelines**: Mobile-first; Tailwind grid (gap-6); Inter font; purple accent #8B5CF6 for interactions; skeletons for async.
- **Dependencies**: shadcn/ui (MultiSelect extension), react-window (virtualization), qrcode.react (QR), lucide-react (icons).
- **Testing**: Per QA strategy—unit (Jest 80%+), E2E (Playwright), visual (Percy), accessibility (axe-core), performance (Lighthouse).
- **Risks & Mitigations**:
  - Layout shifts: Visual regression tests.
  - Perf degradation: Virtualization + bundle analysis (<10% increase).
  - Data loss: E2E for all flows; localStorage sanitization.

## Milestones & Timeline
- **Sprint 1 (Week 1)**: Phase 1-2 complete; prototype review.
- **Sprint 2 (Week 2)**: Phase 3-4; user testing (5-10 sessions).
- **Demo**: End of Sprint 2; A/B test vs. current dashboard.
- **Done Definition**: All stories AC met; docs updated; merged to main.

## Success Metrics
- **Quantitative**: Scroll depth <300px; task time <15s; error rate <5%; Lighthouse >90.
- **Qualitative**: SUS >80; user feedback NPS >8; zero critical bugs post-deploy.
- **Business**: 30% faster schedule management; supports multi-user expansion.

This epic transforms the dashboard into a scalable, user-friendly tool. Track in GitHub Projects; assign to fullstack team.