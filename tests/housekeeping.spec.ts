import { test, expect } from '@playwright/test'

test.describe('Housekeeping Workflow E2E', () => {
  test('full housekeeping workflow', async ({ page }) => {
    await page.goto('http://10.0.0.30:3001') // Assume dev server
    await page.waitForLoadState('networkidle') // Wait for app to load

    // Debug: Screenshot initial load
    await page.screenshot({ path: 'debug-initial-load.png' })

    // Handle empty state - click create first schedule
    await expect(page.locator('text="No Schedules Yet"')).toBeVisible({ timeout: 5000 })
    await page.click('button:has-text("Create First Schedule")')

    // Wait for form to appear
    await expect(page.locator('h3:has-text("Add New Schedule")')).toBeVisible({ timeout: 5000 })

    // Fill title
    await page.fill('input#title', 'Week 1 Cleaning')

    // Select category housekeeping
    await page.click('role=combobox') // Select trigger
    await page.waitForSelector('[data-state="open"]', { timeout: 2000 })
    await page.waitForSelector('[role="option"]:has-text("Housekeeping")', { timeout: 2000 })
    await page.click('[role="option"]:has-text("Housekeeping")')

    // Add entry
    await page.click('button:has-text("Add Entry")')

    // Fill entry fields
    await page.fill('input[placeholder*="Clean Room"]', 'Room 101')
    await page.fill('input[placeholder*="John Doe"]', 'John Doe')
    await page.fill('input[type="time"]', '09:00')

    // Submit
    await page.click('button:has-text("Create Schedule")')

    // Verify creation - back to dashboard with new schedule
    await page.waitForSelector('text="Week 1 Cleaning"', { timeout: 10000 })
    await expect(page.locator('text="Week 1 Cleaning"')).toBeVisible()
  })

  test('large dataset', async ({ page }) => {
    await page.goto('http://10.0.0.30:3001')
    await page.waitForLoadState('networkidle')

    // Debug: Screenshot initial load
    await page.screenshot({ path: 'debug-large-initial.png' })

    // Handle empty state - click create first schedule
    await expect(page.locator('text="No Schedules Yet"')).toBeVisible({ timeout: 5000 })
    await page.click('button:has-text("Create First Schedule")')

    await page.fill('input#title', 'Large Test Schedule')
    await page.click('role=combobox') // Select trigger
    await page.waitForSelector('[data-state="open"]', { timeout: 2000 })
    await page.waitForSelector('[role="option"]:has-text("Housekeeping")', { timeout: 2000 })
    await page.click('[role="option"]:has-text("Housekeeping")')

    // Add 5 entries for test
    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("Add Entry")')
      await page.fill('input[placeholder*="Clean Room"]', `Room ${i + 1}`)
      await page.fill('input[type="time"]', '09:00')
      await page.fill('input[placeholder*="John Doe"]', 'John Doe')
    }

    await page.click('button:has-text("Create Schedule")')

    await page.waitForSelector('text="Large Test Schedule"', { timeout: 15000 })
    await expect(page.locator('text="Large Test Schedule"')).toBeVisible()
  })
})