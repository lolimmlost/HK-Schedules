# 6. Assumptions, Constraints, Risks, Timeline, and Appendix

## 6.1 Assumptions and Constraints

- **Assumptions**: Users have stable internet for initial load (offline after); basic web literacy (mouse/keyboard/touch); English primary language.
- **Constraints**: Browser-only (no native/hybrid app); localStorage quota ~5MB (fallback to IndexedDB); no server-side rendering initially (CSR only).
- **Out of Scope** (v1.0): Multi-user auth/collaboration, real-time sync, advanced analytics (e.g., Gantt charts), mobile app, AI suggestions, payment processing.
- **Dependencies**: Relies on third-party libs (e.g., Tailwind); browser permissions for print/export.

## 6.2 Risks and Mitigations

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

## 6.3 Timeline and Milestones

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

## 6.4 Appendix

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

## 6.5 Requirements Traceability Matrix

| Req ID | Requirement | User Story | Test Case | Status |
|--------|-------------|------------|-----------|--------|
| FR-1.1 | Schedule Creation Form | US-001: Add entries | TC-001: Validate required fields | Planned |
| FR-1.2 | Inline Editing | US-002: Edit task | TC-002: Auto-save on blur | Planned |
| NFR-1 | Performance <1s | N/A | TC-003: Load 100 entries | Planned |
| ... | ... | ... | ... | ... |

**Change Log Template**:
- v1.0 (2025-09-14): Initial PRD.
- v1.1: [Date] - Added [Changes].

This PRD serves as a living document and will be updated based on feedback and iterations. Review quarterly or pre-sprint.

**Cross-reference**: See [introduction.md](../introduction.md) for business context and [functional-requirements.md](../functional-requirements.md) for implementation details. For v2 risks and timeline, see [../v2/risks-timeline.md](../v2/risks-timeline.md).