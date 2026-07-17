import { test, expect } from '@playwright/test'

const BRIDGE_URL = process.env.ARGUS_E2E_BRIDGE_URL ?? 'ws://127.0.0.1:7889/bridge'

test('home → test → run scan via stdio bridge → grade reveal', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-argus="empty-state"]').first()).toBeVisible()

  // Navigate via the `g t` shortcut.
  await page.keyboard.press('g')
  await page.keyboard.press('t')
  await expect(page).toHaveURL(/\/test\b/)

  // Compose a stdio scan.
  await page.getByLabel('endpoint').fill('stdio://stub')
  await page.getByLabel('transport').selectOption('stdio-ws')
  await page.getByLabel('bridge url').fill(BRIDGE_URL)
  await page.getByLabel('exec command').fill('node tests/e2e/fixtures/stub-mcp-server.mjs')

  await page.getByRole('button', { name: /run scan/i }).click()

  // Wait for navigation to the scan detail page.
  await page.waitForURL(/\/test\/scan\?id=SCN-/, { timeout: 45_000 })

  // Grade reveal is the gigantic letter glyph.
  await expect(page.locator('[data-argus="grade-reveal"]')).toBeVisible({ timeout: 30_000 })
})
