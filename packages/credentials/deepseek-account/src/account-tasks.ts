/** Account sign-out policy over the latest logged request route. */
import type { Context } from '@deepseek-ai/cordis'
import { LlmError } from '@deepseek-ai/dsh-llm'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type {} from './index.ts'

/**
 * Routes whose credential the account grant owns, from the live provider
 * directory. Read lazily per decision: the directory may fill after the
 * account provider mounts, and providers re-register on settings updates.
 * @param ctx - account provider lifetime.
 * @returns provider ids flagged `accountManaged` in the directory.
 */
export function accountManagedProviders(ctx: Context): ReadonlySet<string> {
  const llm = ctx.get('llm')
  if (llm === undefined) return new Set()
  return new Set(
    llm.listConfigurableProviders()
      .filter(entry => entry.accountManaged === true)
      .map(entry => entry.provider),
  )
}

/**
 * Identify running work whose latest bound request used an account-managed route.
 * @param agent - live Agent with its durable request context.
 * @param providers - account-managed provider routes, from {@link accountManagedProviders}.
 * @returns whether account sign-out should interrupt this task.
 */
export function isRunningAccountTask(agent: Pick<Agent, 'status' | 'session'>, providers: ReadonlySet<string>): boolean {
  const provider = agent.session.requestContext()?.provider
  return agent.status === 'running' && provider !== undefined && providers.has(provider)
}

/**
 * Cancel signed-out account tasks and publish sign-in guidance for rejected requests.
 * @param ctx - account provider lifetime; Agents may attach later.
 */
export function installAccountTaskCancellation(ctx: Context): void {
  ctx.inject(['agents'], (scope) => {
    scope.on('agent/error', ({ error }) => {
      if (error instanceof LlmError && error.code === 'ACCOUNT_SIGN_IN_REQUIRED') {
        scope.emit('deepseek-account/model-sign-in-required')
      }
    })
    scope.on('deepseek-account/signed-out', () => {
      const providers = accountManagedProviders(ctx)
      for (const agent of scope.agents.list()) {
        if (isRunningAccountTask(agent, providers)) {
          agent.cancel({ kind: 'hook', reason: 'deepseek-account/signed-out' }, { keepInbox: true })
        }
      }
    })
  })
}
