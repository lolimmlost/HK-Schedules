# 2. Problem Statement

The current v1.0 app (per [v1 README](../v1/) and [v1/problem-statement.md](../v1/problem-statement.md)) excels at single-schedule housekeeper management but limits scalability for teams with multiple shifts/locations:

- **Single-Schedule Limitation**: Users must manually switch apps/files for different clients, causing version conflicts (see [v1/problem-statement.md](../v1/problem-statement.md)).
- **No Assignee Filtering**: Admins can't quickly view workloads by housekeeper, leading to oversight errors.
- **Limited Sharing**: Exports require full app access; no secure, temporary links for externals.
- **Data Silos**: localStorage treats all as one schedule; no categorization or bulk management.

This brownfield enhancement addresses these by extending existing components (e.g., schedule-table.tsx for filters) and storage, enabling seamless multi-management without backend changes.

## 2.1 Competitive Analysis Update

- **Existing Competitors** ([v1/problem-statement.md](../v1/problem-statement.md)): Still relevant; this adds differentiation via local-first multi-schedule sharing.
- **New**: When I Work (team scheduling) lacks offline/print focus; Google Sheets sharing is insecure for temporaries. HK-Schedules now offers hybrid: local power + simple shares.

**Cross-reference**: See [functional-requirements.md](./functional-requirements.md) for v2 solutions to these problems and [v1/problem-statement.md](../v1/problem-statement.md) for original v1 challenges.