---
title: US-002 Risks: Enhanced Schedule Viewing and Filtering
version: 1.0
date: 2025-09-17
status: Draft
author: Test Architect & Quality Advisor
references:
  - [US-002 Review](US-002-review.md)
  - [US-002 Backlog](US-002-backlog.md)
  - [PRD v2 Risks Appendix](PRD/v2/risks-timeline-appendix.md)
---

# US-002 Risks Assessment

## Executive Summary
This document details quality risks for US-002, focusing on enhanced viewing and filtering features. Based on current implementation (core filtering complete, bulk actions pending), the primary risk is bulk action failures due to race conditions in auto-save operations. This could lead to data inconsistencies or lost updates in multi-user or high-frequency scenarios. Overall risk level: Medium-High. Recommendations include atomic store updates and comprehensive integration testing.

## Risk Identification
The following table summarizes key risks, prioritized by probability and impact. Focus is on non-functional (performance, reliability) and functional (bulk operations) aspects.

| Risk | Description | Probability | Impact | Mitigation Strategy | Test Coverage |
|------|-------------|-------------|--------|---------------------|---------------|
| Bulk Action Failures (Race Conditions on Auto-Save) | During bulk status changes or deletes (up to 50 rows), concurrent operations (e.g., multi-tab editing or rapid applies) may cause Zustand store overwrites, leading to partial updates, lost selections, or duplicate entries. Exacerbated by auto-save without transactions. | High (70%) | High (Data loss affects workload reviews; user frustration) | Implement Zustand middleware for optimistic updates with rollback; use transactions or locks for bulk ops; debounce applies (300ms). Add conflict detection (e.g., version stamps on entries). | Integration Tests: 10 TCs covering multi-tab scenarios, undo flows, conflict resolution (Vitest + Playwright). E2E: Simulate 3 tabs with overlapping bulk edits. Target 100% coverage for bulk utils. |
| Filter Persistence Loss (localStorage Sync Issues) | Preferences (filters/sorts) saved per schedule may not restore correctly across sessions or devices, due to invalid stored data or quota limits, causing users to reapply filters repeatedly. | Medium (40%) | Medium (UX degradation; minor productivity loss) | Validate data on read/write (e.g., schema checks); fallback to defaults; migrate old formats. Monitor localStorage usage (<80% quota). | Unit Tests: 6 TCs for persistence hooks (useScheduleStore). Manual: Cross-session validation on 5 schedules. |
| Performance Degradation on Large Tables (200+ Entries) | Filtering/sorting on datasets exceeding typical size (e.g., post-US-003 integration with 130+ units) may exceed 100ms re-render threshold, causing UI lag on low-end devices. | Medium (50%) | High (Impacts team leads reviewing full workloads; abandonment risk) | Memoize filtered results; virtualize table (react-window); profile with React DevTools. Limit initial load to paginated views. | Performance Tests: Benchmark 200-entry filters (<100ms); load tests with 500 simulated entries. Tools: Lighthouse, Web Vitals monitoring. |
| UX Inconsistencies in Bulk Selection (Mobile) | Checkbox selection and "Apply to Selected" may be error-prone on touch devices due to small targets or gesture conflicts, leading to accidental bulk applies. | Low (20%) | Medium (Reduced mobile adoption for field managers) | Enlarge touch targets (48px min); add swipe-to-select; test with device emulators. Include haptic feedback if supported. | Usability Tests: 5 TCs on iOS/Android (Chrome DevTools); manual sessions with touch gestures. Metrics: Selection accuracy >95%. |
| Migration Conflicts with Filtering (Legacy v1 Data) | Legacy schedules migrated to v2 (single entry) may lack assignee fields, causing filters to fail silently or show incomplete results. | Low (30%) | Low (Affects few users; workaround via manual edit) | Auto-populate missing assignees during migration; skip filter if field absent with warning toast. Update migration logic in useScheduleStore. | Regression Tests: 8 TCs for v1 data import → filter application. Verify with sample legacy CSVs. |

## Risk Analysis
- **Root Causes**: Incomplete bulk implementation (per backlog); reliance on localStorage without robust syncing; unoptimized rendering for scale.
- **Triggers**: High-volume usage (e.g., 130+ housekeeping units); concurrent access (team collaboration); device variability.
- **Business Impact**: Delays in workload reviews; potential data errors propagating to prints/exports; erosion of trust in v2 features.
- **Likelihood Factors**: Current stability is good, but pending bulk/persistence tasks amplify risks if rushed.

## Mitigation Recommendations
1. **Immediate (Pre-Implementation)**:
   - Prioritize bulk logic with atomic updates in next sprint (2-3 days).
   - Add unit tests for race condition simulations (e.g., mock concurrent store sets).

2. **Development Phase**:
   - Integrate Zustand persist middleware for safer localStorage handling.
   - Conduct code review focused on performance hotspots (e.g., filter loops).

3. **Testing Phase**:
   - Expand test plan: Add 15+ TCs for risks above, emphasizing integration/E2E.
   - Run exploratory tests for multi-tab (open 3+ browser tabs, perform bulk ops).
   - Performance baseline: Measure on mid-range hardware (e.g., 4GB RAM Android).

4. **Post-Release Monitoring**:
   - Embed error tracking (console logs + optional Sentry); track bulk failure rates.
   - User feedback loop: In-app survey on filtering/bulk satisfaction.
   - Hotfix protocol: If race conditions reported, deploy patched store utils.

### UX Mitigations (From US-002 Design Spec)
- **Bulk Action Failures**: Optimistic updates with undo toasts (5s) and visual progress bars reduce perceived errors; inline overlap highlights prevent invalid applies.
- **Filter Persistence Loss**: Restore toast and fallback defaults improve UX; validate stored data on load to avoid silent failures.
- **Performance Degradation**: Loading skeletons and memoized filters ensure <100ms perceived speed; virtualize table for >50 rows.
- **UX Inconsistencies (Mobile)**: 48px touch targets and swipe-select; haptic feedback on selection for better mobile adoption.
- **Migration Conflicts**: Warning toasts for missing assignees; graceful fallback to "All" filter.

**Reference**: UX spec in [PRD v2 UI/UX](docs/PRD/v2/ui-ux-design.md#52-enhanced-schedule-viewing-and-filtering-uiux-us-002); usability tests to validate mitigations.

## Dependencies & Assumptions
- Dependencies: Completion of US-001 dynamic entries for full testing context; @radix-ui/react-select for UI stability.
- Assumptions: Typical usage <200 entries; single-device access (multi-user via shared exports, not real-time collab).
- Escalation: If bulk risks unmitigated by beta, delay US-003 integration.

## Approval & Next Steps
- **QA Sign-off**: [ ] Pending review.
- **Actions**:
  1. Share with Dev/Scrum Master for backlog prioritization.
  2. Update US-002 test plan with risk-specific TCs.
  3. Schedule risk validation session post-bulk implementation.

This assessment ensures US-002 delivers reliable, performant features. For questions, reference the review or contact QA.