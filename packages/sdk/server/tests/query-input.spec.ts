import { describe, expect, it } from 'vitest'
import { CommandDefinitionId, type CommandDescriptor } from '@deepseek-ai/dsh-commands'
import { queryCommand } from '../src/query-input.ts'

const commands: readonly CommandDescriptor[] = [
  { name: 'compact', definitionId: CommandDefinitionId('@deepseek-ai/dsh-command-compact'), description: 'Compact' },
  { name: 'plan', definitionId: CommandDefinitionId('@deepseek-ai/dsh-plan-mode'), description: 'Plan', input: { hint: 'Task' } },
  { name: 'goal', definitionId: CommandDefinitionId('@deepseek-ai/dsh-command-goal'), description: 'Goal', input: { hint: 'Goal' } },
  { name: 'permission', definitionId: CommandDefinitionId('@deepseek-ai/dsh-permission-presets'), description: 'Permission', input: { hint: 'Preset' } },
  { name: 'feedback', definitionId: CommandDefinitionId('@deepseek-ai/dsh-command-feedback'), description: 'Feedback', input: { hint: 'Feedback' } },
  { name: 'export', definitionId: CommandDefinitionId('@deepseek-ai/dsh-session-log-export'), description: 'Export' },
]

describe('SDK query text recognition', () => {
  it.each([
    ['/compact', '/compact'], [' \n/compact \t', '/compact'], ['/сжать', '/compact'],
    ['/permission workspace-write', '/permission workspace-write'],
    [' \n/разрешение\tread-only \t', '/permission\tread-only'],
    ['/permission\ncustom-deployment-preset', '/permission\ncustom-deployment-preset'],
    ['/permission\rread-only', '/permission\rread-only'],
    ['/permission  missing extra', '/permission  missing extra'],
    ['/plan', '/plan'], ['/план', '/plan'], [' \n/plan off\t ', '/plan off'],
    ['/план\nDesign the change', '/plan\nDesign the change'],
    ['/plan  off extra', '/plan  off extra'],
    ['/goal', '/goal'], ['/цель', '/goal'], ['/цель\nfinish the task', '/goal\nfinish the task'],
    ['/goal edit new objective', '/goal edit new objective'], ['/goal pause', '/goal pause'],
    ['/goal resume', '/goal resume'], ['/goal clear', '/goal clear'],
  ])('recognizes the Desktop form %j', (text, expected) => {
    expect(queryCommand(text, commands)).toBe(expected)
  })

  it.each([
    ['/plan\u3000Inspect\u3000the\nchange', '/plan Inspect\u3000the\nchange'],
    ['/план\u00a0\t设计\u00a0方案', '/plan \t设计\u00a0方案'],
    ['/goal\u2003Finish\u3000the task', '/goal Finish\u3000the task'],
    ['/цель\u3000\u00a0完成任务', '/goal \u00a0完成任务'],
    ['/permission\u00a0read-only', '/permission read-only'],
    ['/разрешение\u202f\tread-only', '/permission \tread-only'],
  ])('normalizes only the first Unicode separator in %j', (text, expected) => {
    expect(queryCommand(text, commands)).toBe(expected)
  })

  it.each(['ordinary text', '/', '/unknown', '/usr/bin', '/COMPACT', '/模型', '/文件',
    '/compact extra', '/сжать extra', '/export path', '/model extra', '/file path',
    '/plans inspect', '/goals finish', '/отзыв problem',
    '/permission', ' \n/permission \t', '/разрешение', '/разрешение\n\t', '/permissions read-only',
    '/экспорт', '/export', '/model', '/file'])('leaves %j as ordinary text', (text) => {
    expect(queryCommand(text, commands)).toBeUndefined()
  })

  it('does not identify unrelated scoped replacements as builtins', () => {
    const replaced = [{ name: 'compact', description: 'Scoped command' }, { name: 'permission', description: 'Scoped permission' }]
    expect(queryCommand('/compact', replaced)).toBeUndefined()
    expect(queryCommand('/сжать', replaced)).toBeUndefined()
    expect(queryCommand('/permission read-only', replaced)).toBeUndefined()
    expect(queryCommand('/разрешение read-only', replaced)).toBeUndefined()
    expect(queryCommand('/план', [{ name: 'plan', description: 'Scoped plan' }])).toBeUndefined()
  })

  it('leaves other registered commands and unavailable supported commands unchanged', () => {
    expect(queryCommand('/feedback', commands)).toBeUndefined()
    expect(queryCommand('/goal', [])).toBeUndefined()
    expect(queryCommand('/plan', [])).toBeUndefined()
    expect(queryCommand('/compact', [])).toBeUndefined()
    expect(queryCommand('/export', [])).toBeUndefined()
    expect(queryCommand('/permission read-only', [])).toBeUndefined()
    expect(queryCommand('/сжать', [{ name: 'prune', definitionId: CommandDefinitionId('@deepseek-ai/dsh-command-compact'), description: 'Renamed command' }]))
      .toBe('/prune')
    expect(queryCommand('/разрешение read-only', [{ name: 'access', definitionId: CommandDefinitionId('@deepseek-ai/dsh-permission-presets'), description: 'Renamed permission' }]))
      .toBe('/access read-only')
    expect(queryCommand('/план', [{ name: 'planning', definitionId: CommandDefinitionId('@deepseek-ai/dsh-plan-mode'), description: 'Renamed plan' }]))
      .toBe('/planning')
    expect(queryCommand('/цель', [{ name: 'goal', description: 'Scoped goal' }])).toBeUndefined()
  })

  it('preserves exact-name priority over localized aliases', () => {
    const shadowed = [...commands, { name: '权限', description: 'Another definition' }]
    expect(queryCommand('/разрешение read-only', shadowed)).toBeUndefined()
  })
})
