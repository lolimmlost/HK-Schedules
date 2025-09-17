---
title: UX Risks Assessment for US-003 - Housekeeping Schedule Management
version: 1.0
date: 2025-09-17
status: Draft
author: UX Expert
references:
  - [US-003 User Story](docs/US-003.md)
  - [PRD v2 UI/UX Design](docs/PRD/v2/ui-ux-design.md)
  - [Housekeeping Epic](EPICS/housekeeping-use-case-epic.md)
  - [Risks US-002](docs/risks-US-002.md)
---

# UX Risks Assessment: US-003 Housekeeping Schedule Management

## Executive Summary
This document assesses UX-specific risks for US-003, focusing on the simplified workflow for low-tech housekeeping managers handling 130+ units across multiple housekeepers. Key UX goals include intuitive dropdown-heavy interfaces, guided steps, inline edits, and printable individual schedules. Risks center on usability friction, accessibility for non-digital natives, performance in large-scale views, and integration with existing dashboard features from US-001 and US-002.

**Overall UX Risk Level**: Medium-High - Primarily due to the low-tech user persona (e.g., Rick) and scale of data entry/printing. Mitigation emphasizes iterative testing, prototypes, and adherence to WCAG AA.

**Estimated UX Review Effort**: 2-3 days (usability audits, persona mapping, wireframe reviews).
**Dependencies**: Completion of US-001 dashboard and US-002 filtering; access to low-tech user feedback loops.

## 1. UX Context & Assumptions
- **User Persona**: Housekeeping Manager (e.g., Rick, 50+, limited tech skills) managing weekly schedules for 5+ housekeepers and 130+ units. Prefers mobile/low-interaction tools; avoids complex navigation.
- **UX Principles** (from PRD v2 UI/UX Design):
  - Simplicity: Large touch targets (>44px), high-contrast colors, minimal cognitive load.
  - Guidance: Stepper flows, tooltips, error prevention (e.g., validation toasts).
  - Accessibility: ARIA labels for dropdowns, keyboard navigation, screen reader compatibility.
  - Performance: Sub-2s interactions for filtered views; responsive design for mobile printing.
- **Assumptions**:
  - Users have basic browser knowledge (e.g., print dialog).
  - LocalStorage persistence works across devices; no offline conflicts.
  - Housekeeping schedules integrate seamlessly as a "category" in the dashboard without overwhelming the UI.

## 2. Identified UX Risks
The following table outlines key UX risks, categorized by probability (Low/Medium/High) and impact (Low/Medium/High). Each includes UX-specific mitigations and testing recommendations. Risks are derived from US-003 requirements, focusing on form interactions, viewing/printing, and edits.

| Risk | Category | Probability | Impact | Description | Mitigation Strategies | UX Testing Approach |
|------|----------|-------------|--------|-------------|-----------------------|---------------------|
| Usability Friction for Low-Tech Users | Interface Design | High | High | Low-tech users (e.g., Rick) may struggle with dropdown navigation, bulk entry for 130+ units, or understanding guided steps, leading to abandonment or errors. | Implement a multi-step wizard (Housekeepers → Assign Units → Review/Print) with progress indicators and one-button-back navigation. Use plain-language labels (e.g., "Pick Cleaner" instead of "Select Housekeeper"). Add onboarding tooltips and a 1-min demo video link. Ensure all actions <3 clicks. | Usability Testing: 5 sessions with low-tech personas (SUS score target >75); task completion time <5 min for full workflow (setup → create → print → edit). Heatmap analysis for drop-off points. |
| Overwhelming Data Density in Views | Information Architecture | Medium | High | Dashboard filtered by housekeeper may show dense tables (26+ units/week), causing visual overload on mobile or small screens, especially with inline edits. | Virtualize long lists (e.g., react-window for tables); collapsible sections per day/time slot. Prioritize key info (unit, time, status checkbox) with secondary details hidden. Mobile: Switch to card view (as in ScheduleMobileCards.tsx). | A/B Testing: Compare table vs. card layouts; eye-tracking for scan patterns. Performance metrics: Load time <1s for 130-unit filtered view. Accessibility audit for zoom/readability. |
| Inline Edit Discoverability & Errors | Interaction Design | High | Medium | Users may not notice inline dropdowns for quick edits or accidentally trigger saves, leading to unintended changes without clear undo feedback. | Highlight editable fields with subtle hover states and icons (e.g., pencil). Auto-save with immediate toast ("Saved! Undo?") and 5s undo buffer. Prevent overlaps via real-time validation (e.g., color-code conflicts). Keyboard shortcuts for power users. | Heuristic Evaluation: Follow Nielsen's principles for error prevention. User Testing: Error rate <5% in edit tasks; confirmation dialogs for bulk changes. Integration tests with US-002 undo logic. |
| Print Layout Inconsistencies | Output Design | Medium | High | Browser variations (Chrome vs. Safari) or mobile printing may distort individual schedules (e.g., checkboxes misalign, week headers cut off), frustrating printable workflows. | Use CSS @media print with fixed A4 layout, absolute positioning for elements, and fallback to client-side PDF generation (e.g., extend print-schedule.tsx with html2pdf.js). Include housekeeper name and date prominently; test black/white printing. | Cross-Device Testing: Print previews in 3 browsers + mobile; verify scannability (e.g., QR code for digital backup?). User validation: 80% satisfaction in print accuracy surveys. |
| Accessibility Gaps for Diverse Users | Inclusive Design | Medium | Medium | Dropdowns and forms may lack ARIA labels, keyboard traps, or sufficient contrast, excluding users with disabilities (e.g., screen readers for visually impaired managers). | Adhere to WCAG 2.1 AA: Add aria-labels to selects (e.g., "Choose time slot"), focus indicators >2px, and alt text for icons. Ensure color-blind friendly status indicators (e.g., patterns + colors). | Automated Audits: Axe or Lighthouse for WCAG compliance (>90% score). Manual Testing: Screen reader walkthrough (NVDA/VoiceOver) for full workflow; color contrast checker. |
| Onboarding & Guidance Overload | User Guidance | Low | Medium | Excessive tooltips or steppers might confuse users who prefer minimal interference, or insufficient guidance could leave new users lost in housekeeper setup. | Optional guided tour (e.g., react-joyride) dismissible after first use; contextual help icons linking to simple FAQs. Balance with "Quick Start" button for experienced users. | Persona-Based Feedback: Survey low-tech vs. tech-savvy users on guidance preferences. Completion rates with/without tour; aim for <10% help-seeking incidents. |
| Mobile Responsiveness Issues | Responsive Design | Medium | Medium | Schedule creation or printing on mobile may suffer from cramped dropdowns or swipe conflicts, given the housekeeping team's field usage. | Leverage shadcn/ui responsive components; test touch targets on iOS/Android. Stack forms vertically; gesture-friendly edits (e.g., long-press for options). | Device Lab Testing: Real devices for touch interactions; browser dev tools insufficient. Metrics: Tap accuracy >95%; no horizontal scroll in views. |
| Integration UX with Existing Features | Consistency | Low | Low | Housekeeping schedules in the dashboard may feel disjointed from US-001/002 views (e.g., mismatched filtering behaviors), breaking mental models. | Unified design system: Consistent assignee dropdowns (housekeepers as options); shared toasts/undo patterns. Tag housekeeping schedules visually (e.g., icon badge). | Consistency Audit: Compare UX flows across stories. User Testing: Time to switch between general and housekeeping views <2s; no confusion in filtering. |

## 3. Prioritized Mitigations & Recommendations
- **Immediate (Pre-Implementation)**: Create low-fidelity wireframes for form/stepper and print layout; conduct expert review against Material Design/Apple HIG for simplicity.
- **During Development**: Embed UX checkpoints in sprints (e.g., Day 2: Usability prototype demo). Use Figma for collaborative reviews.
- **Post-Implementation**: Beta testing with 3-5 real housekeeping users; iterate based on feedback. Track metrics via analytics (e.g., time-on-task, bounce rates in forms).
- **Tools & Resources**: Figma for prototypes; Hotjar for session replays; Google Analytics for UX events (if integrated later).
- **Non-UX Considerations**: Coordinate with QA for usability test plans (see docs/US-003-test-plan.md); ensure dev team prioritizes UX stories in backlog.

## 4. Monitoring & Success Metrics
- **KPIs**: SUS Score >75; Task Success Rate >90%; Error Rate <5%; Print Satisfaction >80%.
- **Ongoing**: Post-release surveys; A/B tests for UI variants; monitor support tickets for UX-related issues.
- **Escalation**: If usability risks manifest (e.g., high abandonment), pause release and loop in PO for scope adjustments.

This assessment ensures US-003 delivers an empathetic, efficient UX for housekeeping workflows. Review with team; update post-prototype testing.