# HK-Schedules Documentation Hub

## Overview
This is the central navigation for all HK-Schedules documentation. The project has evolved from v1 (legacy single-schedule) to v2 (multi-schedule, team collaboration). v1 docs are archived for reference; active development focuses on v2.

**Current Version**: v2.0 (Brownfield enhancement of v1.0)  
**Status**: Implementation in progress (see [backlogs/US-002-backlog.md](backlogs/US-002-backlog.md))  
**Key Artifacts**: [PRD v2](PRD/v2/index.md), [Architecture Handoff v2](specs/architecture-handoff-v2.md), [Technical Specification v2](specs/technical-specification-v2.md)

## Navigation

### Product Requirements (PRD)
- **[v2 Brownfield PRD](PRD/v2/index.md)**: Multi-schedule enhancement, team features, backward compatibility.  
  - [Introduction](PRD/v2/introduction.md)  
  - [Problem Statement](PRD/v2/problem-statement.md)  
  - [Functional Requirements](PRD/v2/functional-requirements.md)  
  - [Technical Requirements](PRD/v2/technical-requirements.md)  
  - [UI/UX Design](PRD/v2/ui-ux-design.md)  
  - [Risks & Timeline Appendix](PRD/v2/risks-timeline-appendix.md)  
- **[Archive: v1 PRD](archive/PRD/v1/)**: Legacy single-schedule requirements (reference only, not actively maintained).  
  - [Introduction](archive/PRD/v1/introduction.md)  
  - [Problem Statement](archive/PRD/v1/problem-statement.md)  
  - [Functional Requirements](archive/PRD/v1/functional-requirements.md)  
  - [Technical Requirements](archive/PRD/v1/technical-requirements.md)  
  - [UI/UX Design](archive/PRD/v1/ui-ux-design.md)  
  - [Risks & Timeline Appendix](archive/PRD/v1/risks-timeline-appendix.md)  

### Backlogs & User Stories
- **[US-002: Enhanced Schedule Viewing & Filtering](backlogs/US-002-backlog.md)**: Assignee filtering, bulk actions, entry-level display.  
- **[US-003: Housekeeping Schedule Management](backlogs/US-003-quality-advisory.md)**: Low-tech UX for Rick's use case (130+ units).  
  - [US-003 Test Plan](backlogs/US-003-test-plan.md)  

### Technical Specifications & Guides
- **[Architecture Handoff v2](specs/architecture-handoff-v2.md)**: Implementation roadmap, code patterns, developer onboarding.  
- **[Technical Specification v2](specs/technical-specification-v2.md)**: Detailed file structure, store implementation, routing, data models.  
- **[Dependency Integration Plan](specs/dependency-integration-plan.md)**: Zustand, React Router, forms, bundle optimization.  
- **[Risks, Performance & Testing Strategy](specs/risks-performance-testing.md)**: Migration risks, bundle management, accessibility.  
- **[Migration Guide v1 to v2](guides/migration-guide-v1-to-v2.md)**: Data transformation, rollback procedures.  
- **[Gitignore Recommendations](guides/gitignore-recommendations.md)**: Version control best practices.  

### Epics & High-Level Planning
- See [EPICS/](../EPICS/) directory for project epics:  
  - [Brownfield Multi-User Epic](../EPICS/brownfield-multi-user-epic.md)  
  - [Housekeeping Use Case Epic](../EPICS/housekeeping-use-case-epic.md)  
  - [UX/UI Dashboard Overhaul](../EPICS/ux-ui-dashboard-overhaul-epic.md)  

## Proposed Structure Changes
To align docs:
- **Archived**: v1 PRD moved to `docs/archive/PRD/v1/` (legacy reference).  
- **Organized**: Loose files grouped:  
  - `backlogs/` for US-00x stories and test plans.  
  - `specs/` for v2 technical docs (architecture, spec, integration, risks).  
  - `guides/` for migration and gitignore.  
- **Next Steps**: Manual move of files (e.g., `mv docs/US-002-backlog.md docs/backlogs/`); update links in existing docs to new paths. Create subdirs if needed.  

## Contribution Guidelines
- Use consistent Markdown format (H1 title, sections with H2-H3).  
- Reference PRD v2 for requirements; cross-link with `[text](relative/path.md)`.  
- For changes, update this index and submit PR with doc updates.  

**Last Updated**: 2025-09-16  
**Contact**: Product Owner for clarifications.