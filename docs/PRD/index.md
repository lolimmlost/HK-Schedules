# HK-Schedules Product Requirements Documents (PRD)

This directory contains sharded Product Requirements Documents for HK-Schedules, organized by version and section for better maintainability, collaboration, and version control.

## Versions

### v1.0 - Core Application (Original PRD)
The foundational single-schedule management application.

- [`introduction.md`](./v1/introduction.md) - Product overview, target audience, business goals
- [`problem-statement.md`](./v1/problem-statement.md) - Problem analysis and competitive landscape
- [`functional-requirements.md`](./v1/functional-requirements.md) - Core features, user flows, non-functional requirements
- [`technical-requirements.md`](./v1/technical-requirements.md) - Architecture, data model, API design, dependencies
- [`ui-ux-design.md`](./v1/ui-ux-design.md) - Design system, wireframes, interaction guidelines
- [`risks-timeline-appendix.md`](./v1/risks-timeline-appendix.md) - Assumptions, risks, timeline, appendix, traceability

### v2.0 - Multi-Schedule Enhancement (Brownfield PRD)
Extension for team collaboration and multi-schedule management.

- [`introduction.md`](./v2/introduction.md) - Updated product overview, personas, business goals, success metrics
- [`problem-statement.md`](./v2/problem-statement.md) - v1 limitations, new problems, competitive analysis update
- [`functional-requirements.md`](./v2/functional-requirements.md) - Core v2 features (dashboard, filtering, multi-assignee, sharing)
- [`technical-requirements.md`](./v2/technical-requirements.md) - Architecture extensions, data model updates, API enhancements
- [`ui-ux-design.md`](./v2/ui-ux-design.md) - v2 UI components (dashboard, multi-select, share modal)
- [`risks-timeline-appendix.md`](./v2/risks-timeline-appendix.md) - Migration risks, v2 timeline, assumptions, appendix

## Usage Guidelines

- **Individual Sections**: Reference specific files for feature requirements during implementation
- **Full PRD**: Combine sections chronologically within each version for complete specification
- **Version Control**: Update individual sections as requirements evolve; use semantic versioning for major changes
- **Cross-References**: Use relative links between sections and versions; v2 references v1 for unchanged requirements
- **Migration**: v2 maintains 100% backward compatibility with v1; automatic data migration on upgrade

## Change Log

- **2025-09-14**: Complete sharding of v1 PRD (6 sections) and v2 Brownfield PRD (6 sections)
- **Future**: Add v3 PRD shards as new epics are defined

For questions or updates, contact the Product Owner.