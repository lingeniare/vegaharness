/** Japanese package resources reach the real plugin manager through Host metadata and Client locale resolution. */
import { fileURLToPath } from 'node:url'
import { chromium, type Browser } from 'playwright'
import { expect, it, onTestFailed, onTestFinished } from 'vitest'
import { captureStableAria, compareOrRefreshGolden, launchWebScaffold, watchConsole, webSnapshotMode, type WebScaffold } from './scaffold.ts'
import { experimentalBundleDescription, saveFailureShot } from './support.ts'

it('displays Japanese plugin titles and descriptions from package metadata', async () => {
  const resources: { scaffold?: WebScaffold; browser?: Browser } = {}
  onTestFinished(async () => {
    try { await resources.browser?.close() } finally { await resources.scaffold?.close() }
  })
  const scaffold = await launchWebScaffold()
  resources.scaffold = scaffold
  const browser = await chromium.launch()
  resources.browser = browser
  const page = await browser.newPage({ locale: 'ru-RU', viewport: { width: 1440, height: 960 } })
  const tripwire = watchConsole(page)
  onTestFailed(() => saveFailureShot(page, 'japanese-plugin-metadata'))
  await page.goto(scaffold.authenticatedUrl)
  await page.getByRole('button', { name: 'Плагин', exact: true }).click()
  const panel = page.locator('[data-plugin-panel]')
  const title = panel.getByRole('button', { name: '自動認可レビューを表示', exact: true })
  await title.waitFor()
  const card = title.locator('xpath=ancestor::li')
  await card.getByText(experimentalBundleDescription('auto-review', 'ru'), { exact: true }).waitFor()
  const expected = fileURLToPath(new URL('./expected/japanese-plugin-metadata/card.expected.md', import.meta.url))
  await compareOrRefreshGolden(expected,
    await captureStableAria(page, 'panel] li:has(button[aria-label="自動認可レビューを表示"]).plugin.[data', scaffold.workspaceCwd), webSnapshotMode())
  expect(tripwire.warnings).toEqual([])
  expect(tripwire.pageErrors).toEqual([])
})
