# v2.0 Brownfield PRD - Multi-Schedule Enhancement

This directory contains the sharded Product Requirements Document for the HK-Schedules v2 brownfield enhancement, extending the v1.0 core application with multi-schedule management, team collaboration features, and shareable exports (Epic BE-001).

**Relationship to v1**: This is an incremental extension of the [v1 PRD](../v1/), maintaining 100% backward compatibility while adding capabilities for team-based workflows. v1 users see no changes until they opt into v2 features.

## Sharded Sections

- [`introduction.md`](./introduction.md) - Product overview, target audience updates, business goals, success metrics
- [`problem-statement.md`](./problem-statement.md) - v1 limitations, new problems addressed, competitive analysis update
- [`functional-requirements.md`](./functional-requirements.md) - Core v2 features (dashboard, filtering, multi-assignee, sharing)
- [`technical-requirements.md`](./technical-requirements.md) - Architecture extensions, data model updates, API enhancements
- [`ui-ux-design.md`](./ui-ux-design.md) - v2 UI components (dashboard, multi-select, share modal)
- [`risks-timeline-appendix.md`](./risks-timeline-appendix.md) - Migration risks, v2 timeline, assumptions, appendix

## Key Differences from v1

- **Scope**: Brownfield (extends existing v1.0) vs v1 greenfield
- **Focus**: Multi-schedule/team collaboration vs single-schedule management
- **Architecture**: Enhanced localStorage with migration vs basic persistence
- **Timeline**: 4 weeks (2 sprints) vs 8 weeks
- **Compatibility**: 100% v1 backward compatible with opt-in migration

## Usage Guidelines

- **Implementation**: Follow v2 sections for new features; preserve v1 components unchanged
- **Migration**: Automatic v1→v2 data migration on first load
- **Testing**: Test both v1 compatibility mode and v2 features separately
- **References**: Cross-reference [v1 PRD](../v1/) for unchanged requirements

## Change Log

- **2025-09-14**: Initial v2 PRD sharding structure created
- **TBD**: Complete v2 section sharding

**Contact**: Product Owner for requirements clarification or scope changes.