# 6. Risks, Timeline & Appendix

## 6.1 Migration Risks
The v2 migration from v1 single-schedule to multi-schedule structure carries risks of data loss or corruption, particularly for users with large datasets (>50 schedules). Mitigation includes automatic backups, progressive validation, and fallback to v1 compatibility mode.

- **Risk: Data Loss During Migration** (High Impact, Medium Probability)
  - **Description**: v1 to v2 data transformation fails, resulting in lost schedules/tasks.
  - **Impact**: Critical - Business data destruction.
  - **Probability**: Medium (5-15%) - Depends on v1 data quality.
  - **Mitigation**: Pre-migration backup (`housekeeperSchedules-backup-*`), transactional approach, detailed error logging, 24-hour rollback window. See [Migration Guide](../migration-guide-v1-to-v2.md) for recovery procedures.
  - **Detection**: Post-migration integrity check verifies entry counts and sample data.

- **Risk: Migration Performance Degradation** (High Impact, Low Probability)
  - **Description**: Large v1 datasets (>100 schedules) cause browser freezing.
  - **Impact**: High - Poor user experience, potential crashes.
  - **Probability**: Low (2-5%) - Most users have <20 schedules.
  - **Mitigation**: Chunked processing (5 entries/frame), progress indicators, pause/resume, Web Workers for background transformation. Target <8s for 50 schedules.

## 6.2 Performance Risks
- **Risk: Bundle Size Explosion** (Medium Impact, High Probability): New dependencies add ~124KB; monitor with Vite analyzer. Mitigation: Code splitting (e.g., react-select in separate chunk), tree-shaking (import specific date-fns functions), lazy loading for routes. Budget: <500KB total.
- **Risk: Re-render Performance Issues** (High Impact, Medium Probability): Zustand updates cause excessive re-renders in Dashboard. Mitigation: Granular selectors, shallow comparison, virtualization (react-window for >20 schedules), React.memo for components.

## 6.3 Other Risks
- **Storage Quota Exceeded**: v2 metadata increases size; monitor with navigator.storage.estimate(); auto-export at 95% usage.
- **Mobile Performance**: Complex UI on low-end devices; use touch-optimized dropdowns, simplified views (stack cards on mobile).
- **Share Link Exposure**: Weak PIN (4-digit); mitigate with 7-day expiry, rate limiting (10 attempts/hour), access logging.
- **Accessibility**: Multi-select/dropdowns for low-tech users; ensure WCAG AA (ARIA labels, keyboard nav). Test with NVDA/VoiceOver.

## 6.4 Timeline
- **Sprint 1 (Weeks 1-2)**: Core infrastructure (store, routing, migration). Deliverables: Global Zustand store, v1→v2 migration (98% success), basic dashboard.
- **Sprint 2 (Weeks 3-4)**: UI/Features (forms, filtering, sharing). Deliverables: Multi-assignee form, assignee filtering, share links with PIN.
- **Week 5**: Integration testing, performance optimization (virtualization, bundle <500KB).
- **Week 6**: E2E testing, bug fixes, deployment (Vercel staging → prod).

**Total Effort**: 4-6 weeks; 1 Full-Stack Dev (80%), QA (20%). Dependencies: shadcn/ui Select for dropdowns.

## 6.5 Assumptions
- Browser localStorage quota ≥5MB (standard); fallback to IndexedDB for >10MB.
- Users have <50 schedules (typical); large datasets tested separately.
- No real-time collaboration; local-first with offline support.
- Mock security for shares (SHA-256 PIN hash, expiry); full auth in v2.1.
- v1 data quality: Assumes valid times/tasks; invalid entries skipped with logging.

## 6.6 Appendix: Glossary
- **Brownfield**: Incremental extension of existing v1.0 app (80% code reuse).
- **Local-First**: Primary data storage/operations in browser localStorage.
- **Multi-Schedule**: Array-based storage for multiple independent schedules.
- **ShareConfig**: Metadata for shareable exports (ID, PIN hash, expiry).
- **Zustand Store**: Global React state with persistence middleware.
- **SPA Routing**: Single-page navigation without full reloads.

*Cross-References*: See [Risks & Performance Testing](../risks-performance-testing.md) for detailed mitigation; [Migration Guide](../migration-guide-v1-to-v2.md) for recovery; [Technical Specification v2](../technical-specification-v2.md) for code-level details.