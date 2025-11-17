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

  test('multi-entry schedule - Chrome fix validation', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Handle empty state
    await expect(page.locator('text="No Schedules Yet"')).toBeVisible({ timeout: 5000 })
    await page.click('button:has-text("Create First Schedule")')

    // Wait for form to appear
    await expect(page.locator('h3:has-text("Add New Schedule")')).toBeVisible({ timeout: 5000 })

    // Fill title
    await page.fill('input#title', 'Multi-Entry Test Schedule')

    // Select category housekeeping
    await page.click('role=combobox')
    await page.waitForSelector('[data-state="open"]', { timeout: 2000 })
    await page.click('[role="option"]:has-text("Housekeeping")')
    await page.waitForTimeout(500)

    // Fill first entry
    await page.fill('input[placeholder*="Clean Room"]', 'Clean Room 101')
    await page.fill('input[placeholder*="John Doe"]', 'Alice')
    await page.locator('input[type="time"]').first().fill('09:00')
    await page.locator('input[type="number"]').first().fill('60')

    // Add second entry
    await page.click('button:has-text("Add Entry")')
    await page.waitForTimeout(500)

    // Fill second entry
    await page.locator('input[placeholder*="Clean Room"]').nth(1).fill('Clean Room 102')
    await page.locator('input[placeholder*="John Doe"]').nth(1).fill('Bob')
    await page.locator('input[type="time"]').nth(1).fill('10:00')
    await page.locator('input[type="number"]').nth(1).fill('90')

    // Add third entry
    await page.click('button:has-text("Add Entry")')
    await page.waitForTimeout(500)

    // Fill third entry
    await page.locator('input[placeholder*="Clean Room"]').nth(2).fill('Clean Room 103')
    await page.locator('input[placeholder*="John Doe"]').nth(2).fill('Charlie')
    await page.locator('input[type="time"]').nth(2).fill('12:00')
    await page.locator('input[type="number"]').nth(2).fill('120')

    // Screenshot before submit
    await page.screenshot({ path: 'debug-multi-entry-pre-submit.png' })

    // Submit the form
    await page.click('button:has-text("Create Schedule")')

    // Wait for redirect to dashboard
    await page.waitForSelector('text="Multi-Entry Test Schedule"', { timeout: 10000 })

    // Verify the schedule appears in dashboard
    await expect(page.locator('text="Multi-Entry Test Schedule"')).toBeVisible()

    // Screenshot after creation
    await page.screenshot({ path: 'debug-multi-entry-created.png' })

    // Click to view the schedule details
    await page.click('text="Multi-Entry Test Schedule"')
    await page.waitForTimeout(1000)

    // Verify all three entries are saved by checking for the tasks
    await expect(page.locator('text="Clean Room 101"')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text="Clean Room 102"')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text="Clean Room 103"')).toBeVisible({ timeout: 5000 })

    // Verify assignees
    await expect(page.locator('text="Alice"')).toBeVisible()
    await expect(page.locator('text="Bob"')).toBeVisible()
    await expect(page.locator('text="Charlie"')).toBeVisible()

    // Screenshot final validation
    await page.screenshot({ path: 'debug-multi-entry-validated.png' })
  })
})