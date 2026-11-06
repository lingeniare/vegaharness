/** Schedule creation, prompt prefill, and editing through the shipped Web composition. */
import { chromium } from 'playwright'
import { expect, it } from 'vitest'
import type { ScheduleTiming } from '@deepseek-ai/dsh-schedule/client'
import { launchWebScaffold, watchConsole } from './scaffold.ts'
import { writeComposerDraft } from './support.ts'

it.each([
  { locale: 'en', panel: 'Automation tasks', create: 'New', menu: 'Choose a creation method', chat: 'Create in a session',
    prompt: 'Please create an automation task based on the requirements.' },
  { locale: 'zh', panel: '自动化任务', create: '新建', menu: '选择创建方式', chat: '在会话中创建',
    prompt: '请根据需求创建一个自动化任务。' },
])('prefills an unsent Schedule creation draft in $locale through both conversation entries', async (copy) => {
  const scaffold = await launchWebScaffold({ firstUse: true })
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined
  try {
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, locale: copy.locale })
    await page.addInitScript((locale) => { localStorage.setItem('dsh.locale', locale) }, copy.locale)
    const tripwire = watchConsole(page)
    await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
    const input = page.locator('[data-composer-input][contenteditable="true"]').first()
    for (const { entry, draft } of [
      { entry: 'primary', draft: '' },
      { entry: 'primary', draft: 'Existing unsent draft' },
      { entry: 'menu', draft: '' },
      { entry: 'menu', draft: 'Existing unsent draft' },
    ]) {
      await writeComposerDraft(page, input, draft)
      await page.getByRole('button', { name: copy.panel, exact: true }).click()
      const manager = page.getByTestId('task-manager-page')
      if (entry === 'primary') await manager.getByRole('button', { name: copy.create, exact: true }).click()
      else {
        await manager.getByRole('button', { name: copy.menu, exact: true }).click()
        await page.getByRole('menuitem', { name: copy.chat, exact: true }).click()
      }
      await manager.waitFor({ state: 'detached' })
      await input.getByText(copy.prompt, { exact: true }).waitFor()
      expect(await input.evaluate(element => [...element.children].map(paragraph => paragraph.textContent).join('\n')))
        .toBe(draft === '' ? copy.prompt : `${draft}\n${copy.prompt}`)
      const events = scaffold.ctx.agents.list().flatMap(agent => agent.session.snapshotEvents())
      expect(events.filter(event => event.type === 'user/message' || event.type === 'turn/start')).toEqual([])
      expect(await scaffold.ctx.schedule.catalog()).toEqual([])
    }
    expect(tripwire.pageErrors).toEqual([])
  } finally {
    try { await browser?.close() } finally { await scaffold.close() }
  }
})

it('opens stored timing fields immediately without selecting another repeat option', async () => {
  const scaffold = await launchWebScaffold({ firstUse: true })
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined
  try {
    const clock = new Date(Date.now() + 4 * 60 * 60_000).toISOString().slice(11, 16)
    const choices = [
      { timing: { kind: 'after', after_seconds: 3600 }, repeat: '仅一次', field: '日期' },
      { timing: { kind: 'at', at: '2099-01-05T09:00:00.000Z' }, repeat: '仅一次', field: '日期' },
      { timing: { kind: 'every', every_seconds: 300 }, repeat: '每 N 分钟', field: '重复间隔' },
      { timing: { kind: 'daily', daily: { time: `${clock}:00`, time_zone: 'UTC' } }, repeat: '每天', field: '时间' },
      { timing: { kind: 'weekly', weekly: { time: `${clock}:45`, time_zone: 'UTC', weekdays: [1, 5] } },
        repeat: '每周', field: '星期' },
    ] satisfies { timing: ScheduleTiming; repeat: string; field: string }[]
    const tasks = []
    for (const [index, choice] of choices.entries()) {
      const task = await scaffold.ctx.schedule.create({ title: `Stored task ${index}`, prompt: 'Review the project', timing: choice.timing })
      await scaffold.ctx.schedule.edit({ id: task.id, action: 'update', patch: { active: false } })
      tasks.push({ ...choice, task })
    }
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, locale: 'zh-CN', timezoneId: 'Asia/Shanghai' })
    await page.addInitScript(() => { localStorage.setItem('dsh.locale', 'zh') })
    const tripwire = watchConsole(page)
    await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
    await page.getByRole('button', { name: '自动化任务', exact: true }).click()
    const manager = page.getByTestId('task-manager-page')
    await manager.getByRole('button', { name: '全部', exact: true }).click()
    for (const { task, repeat, field } of tasks) {
      await manager.getByRole('button', { name: task.title, exact: true }).click()
      const detail = manager.getByRole('complementary', { name: '任务详情', exact: true })
      expect(await detail.getByRole('button', { name: `重复 ${repeat}`, exact: true }).isVisible()).toBe(true)
      const role = field === '星期' ? 'group' : field === '重复间隔' ? 'spinbutton' : 'button'
      expect(await detail.getByRole(role, { name: field, exact: true }).isVisible()).toBe(true)
      expect(await detail.getByRole('button', { name: '保存修改', exact: true }).isDisabled()).toBe(true)
      expect(await scaffold.ctx.schedule.view({ id: task.id })).toMatchObject({ kind: task.kind, scheduledAt: task.scheduledAt })
      if (field === '日期') {
        await detail.getByRole('button', { name: '日期', exact: true }).click()
        await page.getByRole('dialog', { name: '日期', exact: true }).waitFor()
        await page.keyboard.press('Escape')
      }
    }
    expect(tripwire.pageErrors).toEqual([])
  } finally {
    try { await browser?.close() } finally { await scaffold.close() }
  }
})

it.each(['2026-03-07T16:00:00.000Z', '2026-03-08T16:00:00.000Z'])(
  'saves a stored weekly task on %s without a false timing error', async (now) => {
    const scaffold = await launchWebScaffold({ firstUse: true })
    let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined
    try {
      const task = await scaffold.ctx.schedule.create({ title: 'Weekly review', prompt: 'Review the project',
        timing: { kind: 'weekly', weekly: { time: '02:30:00', time_zone: 'America/New_York', weekdays: [5] } } })
      await scaffold.ctx.schedule.edit({ id: task.id, action: 'update', patch: { active: false } })
      browser = await chromium.launch()
      const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, locale: 'zh-CN', timezoneId: 'America/New_York' })
      await page.addInitScript((now) => {
        localStorage.setItem('dsh.locale', 'zh')
        Date.now = () => Date.parse(now)
      }, now)
      const tripwire = watchConsole(page)
      await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
      await page.getByRole('button', { name: '自动化任务', exact: true }).click()
      const manager = page.getByTestId('task-manager-page')
      await manager.getByRole('button', { name: '全部', exact: true }).click()
      await manager.getByRole('button', { name: task.title, exact: true }).click()
      const detail = manager.getByRole('complementary', { name: '任务详情', exact: true })
      await detail.getByRole('group', { name: '星期', exact: true }).getByRole('button').nth(0).click()
      expect(await detail.getByRole('status').count()).toBe(0)
      const save = detail.getByRole('button', { name: '保存修改', exact: true })
      expect(await save.isEnabled()).toBe(true)
      await save.click()
      await expect.poll(async () => {
        const record = await scaffold.ctx.schedule.view({ id: task.id })
        return 'code' in record ? undefined : record.kind
      }).toBe('rrule')
      const updated = await scaffold.ctx.schedule.view({ id: task.id })
      expect(updated).toMatchObject({ kind: 'rrule', status: 'paused', target: task.target })
      if ('code' in updated || updated.kind !== 'rrule') throw new Error('expected an edited weekly rule')
      expect(updated.rrule).toContain('BYDAY=MO,FR')

      await page.reload({ waitUntil: 'load' })
      await page.getByRole('button', { name: '自动化任务', exact: true }).click()
      await manager.getByRole('button', { name: '全部', exact: true }).click()
      await manager.getByRole('button', { name: task.title, exact: true }).click()
      await detail.getByRole('button', { name: '重复 每周', exact: true }).waitFor()
      expect(await detail.getByRole('group', { name: '星期', exact: true }).getByRole('button')
        .evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-pressed'))))
        .toEqual(['true', 'false', 'false', 'false', 'true', 'false', 'false'])
      expect(await detail.getByRole('status').count()).toBe(0)
      expect(await save.isDisabled()).toBe(true)
      expect(tripwire.pageErrors).toEqual([])
    } finally {
      try { await browser?.close() } finally { await scaffold.close() }
    }
  },
)

it('creates from a paused empty state, selects the task, and saves an inline edit without starting an Agent', async () => {
  // First use registers the default Workspace, which a new task's directory starts with.
  const scaffold = await launchWebScaffold({ firstUse: true })
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined
  try {
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, locale: 'ru-RU', timezoneId: 'Asia/Shanghai' })
    await page.addInitScript(() => { localStorage.setItem('dsh.locale', 'ru') })
    const tripwire = watchConsole(page)
    await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
    await page.getByRole('button', { name: 'Задача автоматизации', exact: true }).click()
    const manager = page.getByTestId('task-manager-page')
    const createStyles = await manager.getByRole('group', { name: 'Создать', exact: true }).getByRole('button').evaluateAll(buttons => buttons.map((button) => {
      const style = getComputedStyle(button)
      return { height: style.height, topLeft: style.borderTopLeftRadius, bottomLeft: style.borderBottomLeftRadius,
        topRight: style.borderTopRightRadius, bottomRight: style.borderBottomRightRadius }
    }))
    expect(createStyles).toEqual([
      { height: '32px', topLeft: '16px', bottomLeft: '16px', topRight: '0px', bottomRight: '0px' },
      { height: '32px', topLeft: '0px', bottomLeft: '0px', topRight: '16px', bottomRight: '16px' },
    ])
    await manager.getByRole('button', { name: 'Приостановлена', exact: true }).click()
    await manager.getByRole('heading', { name: 'Нет приостановленных задач автоматизации', exact: true }).waitFor()
    await manager.getByRole('button', { name: 'Выбрать способ создания', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Создать вручную', exact: true }).waitFor()
    await page.keyboard.press('Escape')
    await manager.getByRole('button', { name: 'Создать задачу автоматизации', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Создать вручную', exact: true })
    await dialog.getByRole('textbox', { name: 'Название задачи автоматизации', exact: true }).fill('AI 新闻简报')
    await dialog.getByRole('textbox', { name: 'Инструкция для задачи автоматизации', exact: true }).fill('整理过去 24 小时的 AI 新闻, 附原文链接。')
    await dialog.getByRole('button', { name: /^Повтор / }).click()
    await page.getByRole('menuitem', { name: 'С понедельника по пятницу', exact: true }).click()
    await dialog.getByRole('button', { name: 'Время', exact: true }).click()
    await page.getByRole('listbox', { name: '时', exact: true }).getByRole('option', { name: '09', exact: true }).click()
    await page.getByRole('listbox', { name: 'м ', exact: true }).getByRole('option', { name: '00', exact: true }).click()
    await page.getByRole('listbox', { name: 'с', exact: true }).getByRole('option', { name: '00', exact: true }).click()
    await page.keyboard.press('Escape')
    await dialog.getByRole('button', { name: /^执行位置 / }).click()
    await page.getByRole('menuitem', { name: 'Новая сессия и 复用 首次运行时创建, 之后沿用这 сессия', exact: true }).waitFor()
    expect(await page.getByRole('menuitem').count()).toBe(2)
    const workspace = dialog.getByRole('button', { name: /^关联工作区 / })
    await expect.poll(() => workspace.textContent()).toContain('Рабочее пространство по умолчанию')
    await page.keyboard.press('Escape')
    // The workspace menu states each directory, so the default workspace names its folder.
    const defaultPath = scaffold.ctx.workspaceRegistry.list()[0]?.path
    if (defaultPath === undefined) throw new Error('first use did not register the default workspace')
    await workspace.click()
    await page.getByRole('menuitem').getByTitle(defaultPath, { exact: true }).waitFor()
    await page.keyboard.press('Escape')
    expect(await dialog.count()).toBe(1)
    await dialog.getByRole('button', { name: 'Создать', exact: true }).click()
    const detail = manager.getByRole('complementary', { name: 'Сведения о задаче', exact: true })
    await detail.getByRole('heading', { name: 'AI 新闻简报', exact: true }).waitFor()
    expect(await manager.getByRole('button', { name: 'Все', exact: true }).getAttribute('aria-pressed')).toBe('true')
    expect(await manager.getByRole('list', { name: 'Каталог задач', exact: true }).getByRole('button', { name: 'AI 新闻简报', exact: true }).count()).toBe(1)
    await detail.getByText('Ожидает создания', { exact: true }).waitFor()
    const task = (await scaffold.ctx.schedule.catalog()).find(task => task.title === 'AI 新闻简报')
    if (task === undefined || task.target.kind !== 'new_once') throw new Error('manual task was not created with the reusable target')
    expect(task.target.create.cwd).toBe(defaultPath)
    await detail.getByRole('button', { name: 'Редактировать', exact: true }).click()
    await detail.getByRole('textbox', { name: 'Инструкция для задачи автоматизации', exact: true }).fill('整理过去 24 小时的 AI 新闻, 附原文链接，按重要性排序。')
    await detail.getByRole('button', { name: 'Сохранить изменения', exact: true }).click()
    await detail.getByRole('textbox', { name: 'Инструкция для задачи автоматизации', exact: true }).waitFor({ state: 'detached' })
    await detail.getByText('整理过去 24 小时的 AI 新闻, 附原文链接，按重要性排序。', { exact: true }).waitFor()
    const saved = await scaffold.ctx.schedule.view({ id: task.id })
    if ('code' in saved) throw new Error('edited task was not retained')
    expect(saved.prompt).toBe('整理过去 24 小时的 AI 新闻, 附原文链接，按重要性排序。')
    await manager.getByRole('button', { name: 'Выбрать способ создания', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Создать вручную', exact: true }).click()
    await dialog.getByRole('textbox', { name: 'Название задачи автоматизации', exact: true }).fill('Проверьте 最新进展')
    await dialog.getByRole('textbox', { name: 'Инструкция для задачи автоматизации', exact: true }).fill('汇总最近的更新')
    await dialog.getByRole('button', { name: /^Повтор / }).click()
    await page.getByRole('menuitem', { name: 'Каждые N минут', exact: true }).click()
    await dialog.getByRole('spinbutton', { name: 'Интервал', exact: true }).fill('5')
    await dialog.getByRole('button', { name: /^执行位置 / }).click()
    await page.getByRole('menuitem', { name: 'Повторять с интервалом 次 新建会话 每次运行都创建独立会话', exact: true }).click()
    await dialog.getByText('Минимальный интервал запусков: 1 мин', { exact: true }).waitFor()
    const beforeCreate = Date.now()
    await dialog.getByRole('button', { name: 'Создать', exact: true }).click()
    await detail.getByRole('heading', { name: 'Проверьте 最新进展', exact: true }).waitFor()
    const intervalTask = (await scaffold.ctx.schedule.catalog()).find(item => item.title === 'Проверьте 最新进展')
    if (intervalTask === undefined) throw new Error('interval task was not created')
    expect(intervalTask.target.kind).toBe('new')
    expect(Date.parse(intervalTask.scheduledAt) - beforeCreate).toBeGreaterThan(240_000)
    expect(Date.parse(intervalTask.scheduledAt) - beforeCreate).toBeLessThanOrEqual(300_000)
    await detail.getByRole('button', { name: 'Приостановить', exact: true }).click()
    await detail.getByRole('button', { name: 'Возобновить', exact: true }).waitFor()
    expect(await detail.getByText('Ожидает создания', { exact: true }).count()).toBe(0)
    expect(await detail.getByText('Беседа последнего запуска', { exact: true }).count()).toBe(0)
    expect(await detail.getByText('运行间隔–少', { exact: false }).count()).toBe(0)
    expect(tripwire.pageErrors).toEqual([])
    expect(scaffold.ctx.agents.get(task.target.sessionId)).toBeUndefined()
  } finally {
    try { await browser?.close() } finally { await scaffold.close() }
  }
})

it('creates and edits Custom Cron through the built UI while retaining its explicit zone and record kind', async () => {
  const scaffold = await launchWebScaffold({ firstUse: true })
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined
  try {
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, locale: 'ru-RU', timezoneId: 'Asia/Shanghai' })
    await page.addInitScript(() => { localStorage.setItem('dsh.locale', 'ru') })
    const tripwire = watchConsole(page)
    await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
    await page.getByRole('button', { name: 'Задача автоматизации', exact: true }).click()
    const manager = page.getByTestId('task-manager-page')
    await manager.getByRole('button', { name: 'Выбрать способ создания', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Создать вручную', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Создать вручную', exact: true })
    await dialog.getByRole('textbox', { name: 'Название задачи автоматизации', exact: true }).fill('Cron deployment check')
    await dialog.getByRole('textbox', { name: 'Инструкция для задачи автоматизации', exact: true }).fill('Check the deployment status.')
    await dialog.getByRole('button', { name: /^Повтор / }).click()
    await page.getByRole('menuitem', { name: 'Пользовательские', exact: true }).click()
    await dialog.getByRole('textbox', { name: 'Пользовательские', exact: true }).fill('0 9 * * 1-5')
    await dialog.getByRole('button', { name: /^时区 / }).waitFor()
    await dialog.getByRole('button', { name: 'Создать', exact: true }).click()
    const detail = manager.getByRole('complementary', { name: 'Сведения о задаче', exact: true })
    await detail.getByRole('heading', { name: 'Cron deployment check', exact: true }).waitFor()
    const created = (await scaffold.ctx.schedule.catalog()).find(task => task.title === 'Cron deployment check')
    if (created === undefined) throw new Error('Custom Cron creation did not store a task')
    expect(created).toMatchObject({ kind: 'cron', expression: '0 9 * * 1-5', timeZone: 'Asia/Shanghai' })
    expect(created).not.toHaveProperty('rrule')

    await detail.getByRole('button', { name: 'Редактировать', exact: true }).click()
    await detail.getByRole('textbox', { name: 'Пользовательские', exact: true }).fill(' ')
    await detail.getByRole('button', { name: 'Сохранить изменения', exact: true }).click()
    await detail.getByRole('alert').getByText('Проверьте правило и часовой пояс', { exact: true }).waitFor()
    expect(await scaffold.ctx.schedule.view({ id: created.id })).toEqual(created)
    await detail.getByRole('textbox', { name: 'Пользовательские', exact: true }).fill('0 10 * * 1-5')
    await detail.getByRole('button', { name: /^时区 / }).waitFor()
    await detail.getByRole('button', { name: 'Сохранить изменения', exact: true }).click()
    await detail.getByRole('textbox', { name: 'Пользовательские', exact: true }).waitFor({ state: 'detached' })
    const edited = await scaffold.ctx.schedule.view({ id: created.id })
    expect(edited).toMatchObject({ id: created.id, kind: 'cron', expression: '0 10 * * 1-5', timeZone: 'Asia/Shanghai' })
    expect(edited).not.toHaveProperty('rrule')
    expect(tripwire.pageErrors).toEqual([])
  } finally {
    try { await browser?.close() } finally { await scaffold.close() }
  }
})
