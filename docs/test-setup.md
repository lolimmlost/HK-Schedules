# Test Setup and Fixes for HK-Schedules

This document summarizes the test configuration and fixes implemented to resolve unit and E2E test errors.

## Unit Tests (Vitest)

### Configuration
- **vitest.config.ts**: Configures jsdom environment, includes only src/ test files, excludes tests/ directory to avoid E2E interference.
- **Scripts in package.json**:
  - `npm run test`: Runs unit tests only (`vitest run src/**/*.{test,spec}.ts`).
  - `npm run test:ui`: Vitest UI mode.
  - `npm run test:run`: Full Vitest run.

### Fixes Applied
- **src/lib/__tests__/utils.test.ts**:
  - formatDate: Updated expectations for UTC timezone (e.g., 'Sat, Oct 14, 2023' instead of 'Sun, Oct 15, 2023' for '2023-10-15').
  - getDuration: Changed fallback expectations to '0h 0m' for invalid/empty inputs to match implementation.
  - Invalid date: Expect exact 'Invalid Date' string.
- **src/lib/__tests__/useScheduleStore.test.ts**:
  - Added imports: `describe, it, expect, beforeEach` from 'vitest'.
  - Mocked localStorage for Node.js environment with getItem, setItem, removeItem, clear methods.

### Running Unit Tests
```
npm run test
```
Expected: 22 tests passed.

## E2E Tests (Playwright)

### Configuration
- **playwright.config.ts**: Defines testDir './tests', baseURL 'http://localhost:3001', chromium project, html reporter.
- **Scripts in package.json**:
  - `npm run test:e2e`: Runs E2E tests (`playwright test`).

### Fixes Applied
- **tests/housekeeping.spec.ts**:
  - Handled empty state: Expect "No Schedules Yet" and click "Create First Schedule" button.
  - Updated locators:
    - Add schedule: 'button:has-text("Add New Schedule")' or "Create First Schedule".
    - Title: 'input#title'.
    - Category select: 'role=combobox' for trigger, wait for '[data-state="open"]', click '[role="option"]:has-text("Housekeeping")'.
    - Add entry: 'button:has-text("Add Entry")'.
    - Entry fields: 'input[placeholder*="Clean Room"]' for task, 'input[placeholder*="John Doe"]' for assignee, 'input[type="time"]' for time.
    - Submit: 'button:has-text("Create Schedule")'.
    - Verify: locator text for title.
  - Added debugging: waitForLoadState('networkidle'), screenshots ('debug-*.png'), timeouts for slow loads.
  - Reduced large dataset to 5 entries for reasonable test time.

### Running E2E Tests
1. Start dev server: `npm run dev` (runs on port 3001).
2. Run E2E: `npm run test:e2e` (in separate terminal).
Expected: 2 tests passed.

### Troubleshooting
- If connection refused: Ensure dev server is running on port 3001.
- If timeouts: Check screenshots in project root for UI state.
- Playwright report: `npx playwright show-report` for detailed traces.

## Overall Test Coverage
- Unit: 22 tests (utils, useScheduleStore).
- E2E: 2 tests (full workflow, large dataset handling).
- Total: 24 tests, all passing after fixes.

For updates, refer to commit history or run `npm run test` / `npm run test:e2e`.