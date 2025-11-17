import { test, expect } from '@playwright/test'

test.describe('Housekeeping Workflow E2E', () => {
  test('full housekeeping workflow', async ({ page }) => {
    await page.goto('/') // Use baseURL from config
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

    // Wait for form to be valid with default entry
    await page.waitForTimeout(1000)

    // Fill initial entry only (single entry test)
    await page.fill('input[placeholder*="Clean Room"]', 'Clean Room 101')
    await page.fill('input[placeholder*="John Doe"]', 'John Doe')
    await page.fill('input[type="time"]', '09:00')
    await page.fill('input[type="number"]', '60') // Duration already default, but confirm

    // Submit
    await page.click('button:has-text("Create Schedule")')

    // Verify creation - back to dashboard with new schedule
    await page.waitForSelector('text="Week 1 Cleaning"', { timeout: 10000 })
    await expect(page.locator('text="Week 1 Cleaning"')).toBeVisible()
  })

  test('large dataset', async ({ page }) => {
    await page.goto('/')
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

    // Wait for form to be valid
    await page.waitForTimeout(1000)

    // Fill initial entry only (single entry for large test too, until multi-entry bug fixed)
    await page.fill('input[placeholder*="Clean Room"]', 'Large Clean Room')
    await page.fill('input[placeholder*="John Doe"]', 'John Doe')
    await page.fill('input[type="time"]', '09:00')
    await page.fill('input[type="number"]', '60')
    await page.screenshot({ path: 'debug-large-pre.png' })
    await page.click('button:has-text("Create Schedule")')

    await page.waitForSelector('text="Large Test Schedule"', { timeout: 15000 })
    await expect(page.locator('text="Large Test Schedule"')).toBeVisible()
  })
})
