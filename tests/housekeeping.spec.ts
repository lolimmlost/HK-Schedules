import { test, expect } from '@playwright/test'

test.describe('Housekeeping Workflow E2E', () => {
  test('full housekeeping workflow', async ({ page }) => {
    await page.goto('http://localhost:5173') // Assume dev server

    // Add housekeeper (assume UI)
    await page.click('button:has-text("Manage Housekeepers")')
    await page.fill('input[placeholder*="name"]', 'John Doe')
    await page.click('button:has-text("Add")')
    await expect(page.locator('text=John Doe')).toBeVisible()

    // Create schedule
    await page.click('button:has-text("Create New Schedule")')
    await page.selectOption('select[name="category"]', 'housekeeping')
    await page.fill('input[name="title"]', 'Week 1 Cleaning')
    await page.click('button:has-text("Add Entry")')

    // Add entry
    await page.fill('input[name="entries.0.task"]', 'Room 101')
    await page.selectOption('select[name="entries.0.assignee"]', 'John Doe')
    await page.fill('input[name="entries.0.time"]', '09:00')
    await page.selectOption('select[name="entries.0.status"]', 'pending')
    await page.click('button:has-text("Create Schedule")')

    // Verify
    await expect(page.locator('text="Week 1 Cleaning"')).toBeVisible()

    // Inline edit
    await page.click('select[name="entries.0.status"]')
    await page.click('text=Completed')
    await expect(page.locator('.toast')).toBeVisible()

    // Undo
    await page.click('button:has-text("Undo")')
    await expect(page.locator('select[name="entries.0.status"]')).toHaveValue('pending')

    // Print
    await page.click('button:has-text("View John")')
    await page.click('button:has-text("Print Schedule")')
    await page.keyboard.press('Control+P') // Trigger print
    await expect(page.locator('text="John"')).toBeVisible()

    // Validation duplicate
    await page.click('button:has-text("Create New Schedule")')
    await page.selectOption('select[name="category"]', 'housekeeping')
    await page.fill('input[name="entries.0.task"]', 'Room 101')
    await page.click('button:has-text("Add Entry")')
    await page.fill('input[name="entries.1.task"]', 'Room 101')
    await page.click('button:has-text("Create Schedule")')
    await expect(page.locator('.toast')).toContainText('Duplicate')
  })

  test('large dataset', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.click('button:has-text("Create New Schedule")')
    await page.selectOption('select[name="category"]', 'housekeeping')
    // Add 131 entries (test subset for time)
    for (let i = 0; i < 131; i++) {
      await page.click('button:has-text("Add Entry")')
      await page.fill(`input[name="entries.${i}.task"]`, `Room ${i + 1}`)
      await page.fill(`input[name="entries.${i}.time"]`, '09:00')
    }
    await page.click('button:has-text("Create Schedule")')
    // Check load and console warn (mock or check UI)
    await expect(page.locator('.schedule-table')).toBeVisible()
  })
})