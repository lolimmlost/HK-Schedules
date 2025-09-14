# 1. Introduction

## 1.1 Product Overview

This brownfield PRD extends the existing HK-Schedules housekeeper management application (v1.0) to support multi-schedule management, team collaboration features, and shareable exports, as defined in Epic BE-001. The enhancements build on the current React/TypeScript codebase with localStorage persistence, shadcn/ui components, and Tailwind CSS styling. Core functionality remains intact (single-schedule CRUD, CSV import/export, print views per [v1 PRD](../v1/)), while adding capabilities for managing multiple schedules (e.g., by shift/client), assignee filtering, and basic sharing. This enables admins to handle complex team workflows without disrupting existing users.

The value proposition evolves from simple housekeeper scheduling to scalable team coordination, reducing manual tracking errors by 40% and supporting premium sharing features for monetization.

**Cross-reference**: See [v1/introduction.md](../v1/introduction.md) for core product foundation.

## 1.2 Target Audience and Personas

- **Primary Users**: Team leads/admins managing multiple housekeeper shifts (extension of Admin persona in [v1 PRD](../v1/introduction.md)).
- **Secondary Users**: Housekeepers accessing filtered views; external stakeholders via share links (new: Share Recipient persona).
- **Updated Personas**:
  - **Admin (Taylor, 42, Operations Lead)**: Now manages 5+ schedules across locations; needs quick filtering by housekeeper and shareable reports for clients.
  - **Team Lead (Alex, 35, Supervisor)**: Creates schedules for different teams; uses bulk actions and exports to distribute weekly plans.
  - **Share Recipient (Client Pat, 50, Facility Manager)**: Receives read-only links to view schedules without app access; focuses on print/export.

## 1.3 Business Goals

- Enable multi-schedule workflows to support 50% more users (from single to team-based).
- Improve collaboration via share links, targeting 25% increase in external sharing.
- Maintain 95% compatibility with existing features; achieve <1s load for multi-views.
- Prepare for v1.1 cloud sync; monetize sharing as premium (e.g., unlimited links).
- Align with [v1 PRD](../v1/introduction.md) goals: 30% productivity gain, NPS >45.

## 1.4 Success Metrics

- **Adoption**: 60% of admins create >3 schedules; 40% usage of share features.
- **Engagement**: Dashboard sessions >7 minutes; share link open rate >70%.
- **Performance**: Multi-table render <1s (extend [v1 PRD](../v1/introduction.md) metrics); bundle size increase <10%.
- **Business**: 20% conversion to premium sharing; error rate <0.5% on exports.
- **Technical**: 95% test coverage for new features; migration success 100%.

**Cross-reference**: See [functional-requirements.md](./functional-requirements.md) for v2-specific metrics and [v1/functional-requirements.md](../v1/functional-requirements.md) for baseline measurements.