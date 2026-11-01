// @vitest-environment jsdom

import { act, cleanup, createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { GoalSnapshot } from '@deepseek-ai/dsh-goal/client'
import { makeTranslate, RemoteError } from '@deepseek-ai/dsh-client-test-runtime'
import { ru as commonRu } from '@deepseek-ai/dsh-client-locale/src/locales/ru.ts'
import { GoalBar } from '../src/client/GoalBar.tsx'
import type { GoalActionResult, GoalBarActions } from '../src/client/slots.ts'
import { ru } from '../src/client/locales.ts'

const t: Parameters<typeof GoalBar>[0]['t'] = makeTranslate(ru, commonRu)

afterEach(cleanup)

function makeGoal(over: Partial<GoalSnapshot> = {}): GoalSnapshot {
  return {
    id: 'g1' as GoalSnapshot['id'],
    revision: 1,
    objective: 'Ship the redesign',
    phase: 'active',
    maxGoalRounds: 4,
    ...over,
  }
}

function makeActions() {
  return {
    onEdit: vi.fn<GoalBarActions['onEdit']>(() => Promise.resolve({ ok: true, value: undefined })),
    onPause: vi.fn<GoalBarActions['onPause']>(() => Promise.resolve({ ok: true, value: undefined })),
    onResume: vi.fn<GoalBarActions['onResume']>(() => Promise.resolve({ ok: true, value: undefined })),
    onClear: vi.fn<GoalBarActions['onClear']>(() => Promise.resolve({ ok: true, value: undefined })),
  } satisfies GoalBarActions
}

describe('GoalBar', () => {
  it('renders nothing while loading, absent, or when the goal is complete', () => {
    const actions = makeActions()
    const loading = render(<GoalBar goal={undefined} {...actions} t={t} />)
    expect(loading.container.firstChild).toBeNull()
    cleanup()

    const absent = render(<GoalBar goal={null} {...actions} t={t} />)
    expect(absent.container.firstChild).toBeNull()
    cleanup()

    const complete = render(<GoalBar goal={makeGoal({ phase: 'complete' })} {...actions} t={t} />)
    expect(complete.container.firstChild).toBeNull()
  })

  it('active goal: goal glyph, "Текущая цель", truncated objective, edit and clear actions', () => {
    const actions = makeActions()
    render(<GoalBar goal={makeGoal()} {...actions} t={t} />)
    expect(screen.getByText('Текущая цель')).toBeTruthy()
    expect(screen.getByText('Ship the redesign')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Очистить цель' }))
    expect(actions.onClear).toHaveBeenCalledTimes(1)
  })

  it('single-flights rapid clear clicks and hides the committed goal before its projection catches up', async () => {
    const actions = makeActions()
    let resolveClear!: (result: GoalActionResult) => void
    actions.onClear.mockImplementation(() => new Promise((resolve) => { resolveClear = resolve }))
    const { container, rerender } = render(<GoalBar goal={makeGoal()} {...actions} t={t} />)
    const clear = screen.getByRole<HTMLButtonElement>('button', { name: 'Очистить цель' })

    act(() => {
      clear.click()
      clear.click()
    })
    expect(actions.onClear).toHaveBeenCalledTimes(1)
    expect(clear.disabled).toBe(true)

    await act(async () => { resolveClear({ ok: true, value: undefined }) })
    expect(container.firstChild).toBeNull()

    rerender(<GoalBar goal={makeGoal({ id: 'g2' as GoalSnapshot['id'], objective: 'Next goal' })} {...actions} t={t} />)
    expect(screen.getByText('Next goal')).toBeTruthy()
  })

  it('edit swaps the strip for a prefilled form; Enter saves, empty stays disabled', async () => {
    const actions = makeActions()
    render(<GoalBar goal={makeGoal()} {...actions} t={t} />)
    fireEvent.click(screen.getByRole('button', { name: 'Редактировать цель' }))
    const box = screen.getByRole('textbox', { name: 'Содержание цели' })
    expect(box).toHaveProperty('value', 'Ship the redesign')

    fireEvent.change(box, { target: { value: '   ' } })
    expect(screen.getByRole('button', { name: 'Сохранить цель' })).toHaveProperty('disabled', true)

    fireEvent.change(box, { target: { value: 'Ship v2' } })
    fireEvent.keyDown(box, { key: 'Enter' })
    expect(actions.onEdit).toHaveBeenCalledWith('Ship v2')
    await waitFor(() => { expect(screen.getByText('Текущая цель')).toBeTruthy() })
  })

  it('edits a multi-line objective: Shift+Enter and IME confirmation do not save', () => {
    const actions = makeActions()
    render(<GoalBar goal={makeGoal({ objective: 'Line one\nLine two' })} {...actions} t={t} />)
    fireEvent.click(screen.getByRole('button', { name: 'Редактировать цель' }))
    const box = screen.getByRole('textbox', { name: 'Содержание цели' })
    expect(box).toHaveProperty('value', 'Line one\nLine two')

    fireEvent.keyDown(box, { key: 'Enter', shiftKey: true })
    fireEvent.keyDown(box, { key: 'Enter', isComposing: true })
    fireEvent.keyDown(box, { key: 'Enter', keyCode: 229 })
    expect(actions.onEdit).not.toHaveBeenCalled()

    fireEvent.change(box, { target: { value: 'Line one\nLine three' } })
    const enter = createEvent.keyDown(box, { key: 'Enter' })
    fireEvent(box, enter)
    expect(enter.defaultPrevented).toBe(true)
    expect(actions.onEdit).toHaveBeenCalledWith('Line one\nLine three')
  })

  it('Esc cancels the edit without calling onEdit', () => {
    const actions = makeActions()
    render(<GoalBar goal={makeGoal()} {...actions} t={t} />)
    fireEvent.click(screen.getByRole('button', { name: 'Редактировать цель' }))
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Содержание цели' }), { key: 'Escape' })
    expect(actions.onEdit).not.toHaveBeenCalled()
    expect(screen.getByText('Текущая цель')).toBeTruthy()
  })

  it('the cancel button exits the form and drops the draft (re-edit starts from the objective)', () => {
    const actions = makeActions()
    render(<GoalBar goal={makeGoal()} {...actions} t={t} />)
    fireEvent.click(screen.getByRole('button', { name: 'Редактировать цель' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Содержание цели' }), { target: { value: 'abandoned draft' } })
    fireEvent.click(screen.getByRole('button', { name: 'Отменить редактирование' }))
    expect(actions.onEdit).not.toHaveBeenCalled()
    expect(screen.getByText('Текущая цель')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Редактировать цель' }))
    expect(screen.getByRole('textbox', { name: 'Содержание цели' })).toHaveProperty('value', 'Ship the redesign')
  })

  it('Enter with a blank draft neither saves nor closes the form', () => {
    const actions = makeActions()
    render(<GoalBar goal={makeGoal()} {...actions} t={t} />)
    fireEvent.click(screen.getByRole('button', { name: 'Редактировать цель' }))
    const box = screen.getByRole('textbox', { name: 'Содержание цели' })
    fireEvent.change(box, { target: { value: '   ' } })
    fireEvent.keyDown(box, { key: 'Enter' })
    expect(actions.onEdit).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox', { name: 'Содержание цели' })).toBeTruthy()
  })

  it('active goal: the pause action pauses', () => {
    const actions = makeActions()
    render(<GoalBar goal={makeGoal()} activation="armed" {...actions} t={t} />)
    fireEvent.click(screen.getByRole('button', { name: 'Приостановить цель' }))
    expect(actions.onPause).toHaveBeenCalledTimes(1)
  })

  it('active disarmed goal: "Неактивная цель" with a resume action instead of pause', () => {
    const actions = makeActions()
    render(<GoalBar goal={makeGoal()} activation="disarmed" {...actions} t={t} />)
    expect(screen.getByText('Неактивная цель')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Возобновить цель' }))
    expect(actions.onResume).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Приостановить цель' })).toBeNull()
  })

  it('paused goal: "Неактивная цель" with a resume action before edit', () => {
    const actions = makeActions()
    render(<GoalBar goal={makeGoal({ phase: 'paused' })} {...actions} t={t} />)
    expect(screen.getByText('Приостановленная цель')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Возобновить цель' }))
    expect(actions.onResume).toHaveBeenCalledTimes(1)
  })

  it('portals an action tooltip out of the strip, where the input card cannot cover it', () => {
    vi.useFakeTimers()
    try {
      render(<GoalBar goal={makeGoal()} activation="armed" {...makeActions()} t={t} />)
      fireEvent.pointerEnter(screen.getByRole('button', { name: 'Приостановить цель' }))
      act(() => { vi.advanceTimersByTime(500) })
      const tooltip = screen.getByRole('tooltip')
      expect(tooltip.textContent).toBe('Приостановить цель')
      expect(tooltip.parentElement).toBe(document.body)
    } finally {
      vi.useRealTimers()
    }
  })

  it('a new goal identity drops the edit form (no stale draft over the new goal)', () => {
    const actions = makeActions()
    const { rerender } = render(<GoalBar goal={makeGoal()} {...actions} t={t} />)
    fireEvent.click(screen.getByRole('button', { name: 'Редактировать цель' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Содержание цели' }), { target: { value: 'stale draft' } })

    rerender(<GoalBar goal={makeGoal({ id: 'g2' as GoalSnapshot['id'], objective: 'New goal' })} {...actions} t={t} />)
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.getByText('Текущая цель')).toBeTruthy()
    expect(screen.getByText('New goal')).toBeTruthy()

    rerender(<GoalBar goal={null} {...actions} t={t} />)
    expect(screen.queryByText('Текущая цель')).toBeNull()
  })

  it('blocked goal: "Заблокированная цель" with the block reason as the strip tooltip', () => {
    const actions = makeActions()
    const goal = makeGoal({ phase: 'blocked', blockedReason: { code: 'stalled', message: 'No progress in 3 rounds' } })
    render(<GoalBar goal={goal} {...actions} t={t} />)
    expect(screen.getByText('Заблокированная цель')).toBeTruthy()
    expect(screen.getByText('Заблокированная цель').closest('[title]')?.getAttribute('title')).toBe('No progress in 3 rounds')
  })

  it('blocked goal: offers resume and no pause', () => {
    const actions = makeActions()
    render(<GoalBar goal={makeGoal({ phase: 'blocked' })} {...actions} t={t} />)
    expect(screen.queryByRole('button', { name: 'Приостановить цель' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Возобновить цель' }))
    expect(actions.onResume).toHaveBeenCalledTimes(1)
  })

  it('blocked goal without a reason carries no tooltip', () => {
    const actions = makeActions()
    render(<GoalBar goal={makeGoal({ phase: 'blocked' })} {...actions} t={t} />)
    expect(screen.getByText('Заблокированная цель')).toBeTruthy()
    expect(screen.getByText('Заблокированная цель').closest('[title]')).toBeNull()
  })

  it('keeps the edit draft open and reports a failed save', async () => {
    const actions = makeActions()
    actions.onEdit.mockResolvedValue({
      ok: false, error: new RemoteError('session/agent-busy', 'stale revision', { reason: 'stale revision' }),
    })
    render(<GoalBar goal={makeGoal()} {...actions} t={t} />)
    fireEvent.click(screen.getByRole('button', { name: 'Редактировать цель' }))
    const box = screen.getByRole('textbox', { name: 'Содержание цели' })
    fireEvent.change(box, { target: { value: 'retry this draft' } })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить цель' }))

    expect((await screen.findByRole('alert')).textContent).toBe('stale revision (session/agent-busy)')
    expect(screen.getByRole('textbox', { name: 'Содержание цели' })).toHaveProperty('value', 'retry this draft')
  })

  it('reports resume and clear failures without hiding the goal', async () => {
    const actions = makeActions()
    actions.onResume.mockResolvedValue({ ok: false, error: new RemoteError('gateway/internal', 'resume failed', {}) })
    const { rerender } = render(<GoalBar goal={makeGoal({ phase: 'paused' })} {...actions} t={t} />)
    fireEvent.click(screen.getByRole('button', { name: 'Возобновить цель' }))
    expect((await screen.findByRole('alert')).textContent).toBe('resume failed (gateway/internal)')

    actions.onClear.mockResolvedValue({
      ok: false, error: new RemoteError('session/agent-busy', 'clear failed', { reason: 'clear failed' }),
    })
    rerender(<GoalBar goal={makeGoal()} {...actions} t={t} />)
    fireEvent.click(screen.getByRole('button', { name: 'Очистить цель' }))
    expect((await screen.findByRole('alert')).textContent).toBe('clear failed (session/agent-busy)')
    expect(screen.getByText('Ship the redesign')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Очистить цель' }))
    await waitFor(() => { expect(actions.onClear).toHaveBeenCalledTimes(2) })
  })
})
