/**
 * Canonical publication manifest for the documentation website.
 *
 * Markdown stays in its owning repository tier. This manifest maps each
 * canonical English source into the site's single route tree.
 */

/** Sidebar collection rendered for one top-level module. */
export type DocsSidebar = 'guide' | 'develop' | 'reference'

/** A page projected into the VitePress source tree. */
export interface DocsPage {
  /** Repository-relative canonical Markdown source. */
  source: string
  /** VitePress route, including the `.md` suffix. */
  route: string
  /** Navigation label shown in the sidebar. */
  label: string
  /** Sidebar collection that owns the page, or null for the home page. */
  sidebar: DocsSidebar | null
  /** Section label within the sidebar. */
  section: string
  /** Stable order within the section. */
  order: number
  /** Heading levels included in this page's VitePress outline. */
  outline?: number | readonly [number, number] | 'deep' | false | undefined
  /** Additional repository paths that resolve to this page. */
  sourceAliases?: string[]
}

interface PageSpec {
  source: string
  route: string
  label: string
  sidebar: DocsSidebar | null
  section: string
  order: number
  outline?: DocsPage['outline']
  sourceAliases?: string[]
}

function pages(specs: PageSpec[]): DocsPage[] {
  return specs
}

const homeAndGuide = pages([
  {
    source: 'docs/user/index.md',
    route: 'index.md',
    label: 'VEGA Harness',
    sidebar: null,
    section: 'Home',
    order: 0,
  },
  {
    source: 'docs/user/guide/index.md',
    route: 'guide/quickstart.md',
    label: 'Use the Web UI',
    sidebar: 'guide',
    section: 'Guide',
    order: 1,
    sourceAliases: ['docs/user/guide'],
  },
  {
    source: 'docs/user/guide/providers.md',
    route: 'guide/providers.md',
    label: 'Configure models',
    sidebar: 'guide',
    section: 'Guide',
    order: 2,
  },
  {
    source: 'docs/user/guide/network-proxy.md',
    route: 'guide/network-proxy.md',
    label: 'Network proxy',
    sidebar: 'guide',
    section: 'Guide',
    order: 3,
  },
  {
    source: 'docs/user/guide/public-deployments.md',
    route: 'guide/public-deployments.md',
    label: 'Public deployments',
    sidebar: 'guide',
    section: 'Guide',
    order: 4,
  },
  {
    source: 'docs/user/guide/python-sdk.md',
    route: 'guide/python-sdk.md',
    label: 'Python',
    sidebar: 'guide',
    section: 'SDK',
    order: 1,
  },
  {
    source: 'docs/user/guide/github-review.md',
    route: 'guide/github-review.md',
    label: 'GitHub review sessions',
    sidebar: 'guide',
    section: 'Automation',
    order: 1,
  },
  {
    source: 'docs/user/guide/schedule.md',
    route: 'guide/schedule.md',
    label: 'Session reminders',
    sidebar: 'guide',
    section: 'Automation',
    order: 2,
  },
  {
    source: 'docs/user/guide/plugin-market.md',
    route: 'guide/plugin-market.md',
    label: 'Plugin indexes',
    sidebar: 'guide',
    section: 'Integrations',
    order: 2,
  },
  {
    source: 'docs/user/guide/mcp-memory.md',
    route: 'guide/mcp-memory.md',
    label: 'Memory MCP',
    sidebar: 'guide',
    section: 'Integrations',
    order: 1,
  },
])

const develop = pages([
  {
    source: 'docs/user/develop/basic/index.md',
    route: 'develop/basic/index.md',
    label: 'Your first Harness plugin',
    sidebar: 'develop',
    section: 'Basics',
    order: 1,
    sourceAliases: ['docs/user/develop/basic'],
  },
  {
    source: 'docs/user/develop/basic/tool.md',
    route: 'develop/basic/tool.md',
    label: 'Build a tool',
    sidebar: 'develop',
    section: 'Basics',
    order: 2,
  },
  {
    source: 'docs/user/develop/basic/config.md',
    route: 'develop/basic/config.md',
    label: 'Plugin configuration',
    sidebar: 'develop',
    section: 'Basics',
    order: 3,
  },
  {
    source: 'docs/user/develop/basic/publish.md',
    route: 'develop/basic/publish.md',
    label: 'Package and install',
    sidebar: 'develop',
    section: 'Basics',
    order: 4,
  },
  {
    source: 'docs/user/develop/framework/index.md',
    route: 'develop/framework/index.md',
    label: 'Plugin lifecycle',
    sidebar: 'develop',
    section: 'Framework',
    order: 1,
    sourceAliases: ['docs/user/develop/framework'],
  },
  {
    source: 'docs/user/develop/framework/service.md',
    route: 'develop/framework/service.md',
    label: 'Services and dependencies',
    sidebar: 'develop',
    section: 'Framework',
    order: 2,
  },
  {
    source: 'docs/user/develop/framework/events.md',
    route: 'develop/framework/events.md',
    label: 'Event system',
    sidebar: 'develop',
    section: 'Framework',
    order: 3,
  },
  {
    source: 'docs/user/develop/practice/index.md',
    route: 'develop/practice/index.md',
    label: 'Capability layering',
    sidebar: 'develop',
    section: 'Practice',
    order: 1,
    sourceAliases: ['docs/user/develop/practice'],
  },
  {
    source: 'docs/user/develop/practice/llm-adapter.md',
    route: 'develop/practice/llm-adapter.md',
    label: 'LLM adapter',
    sidebar: 'develop',
    section: 'Practice',
    order: 2,
  },
  {
    source: 'docs/user/develop/practice/dynamic-cordis.md',
    route: 'develop/practice/dynamic-cordis.md',
    label: 'Persistent Harness plugins',
    sidebar: 'develop',
    section: 'Practice',
    order: 3,
  },
])

const cordisTutorial = pages(([
  ['index.md', '总览', 'Overview'],
  ['01-first-plugin.md', '1. 第一个插件', '1. Your first plugin'],
  ['02-lifecycle-and-effects.md', '2. 生命周期与副作用', '2. Lifecycle and effects'],
  ['03-services.md', '3. 服务', '3. Services'],
  ['04-events.md', '4. 事件', '4. Events'],
  ['05-config.md', '5. 配置', '5. Configuration'],
  ['06-composition-and-hmr.md', '6. 组合与热重载', '6. Composition and HMR'],
  ['07-into-the-harness.md', '7. 进入 Harness', '7. Into the harness'],
] as const).map(([file, , enLabel], order): PageSpec => ({
  source: `docs/cordis-tutorial/${file}`,
  route: `develop/cordis-tutorial/${file}`,
  label: enLabel,
  sidebar: 'develop',
  section: 'Cordis framework tutorial',
  order,
  ...(file === 'index.md' ? { sourceAliases: ['docs/cordis-tutorial'] } : {}),
})))

const cordisPrimerReference = pages([
  {
    source: 'docs/cordis-primer.md',
    route: 'reference/cordis-primer.md',
    label: 'Cordis primer',
    sidebar: 'reference',
    section: 'Concepts',
    order: 1,
  },
])

/**
 * Subsystem pages grouped by the concern they document, as `[Chinese section,
 * English section, pages]`. One flat list of every subsystem pushed the rest of
 * the reference sidebar below the fold.
 */
const subsystemGroups = [
  ['总览', 'Overview', [
    ['README.md', '子系统', 'Subsystems'],
  ]],
  ['内核与作用域', 'Core and scopes', [
    ['core.md', '核心', 'Core'],
    ['scope.md', '作用域', 'Scopes'],
  ]],
  ['会话与持久化', 'Sessions and persistence', [
    ['session.md', '会话', 'Sessions'],
    ['session-query.md', '会话查询', 'Session query'],
    ['session-reference.md', '会话引用', 'Session references'],
    ['session-title.md', '会话标题', 'Session titles'],
    ['session-projection.md', '会话投影', 'Session projections'],
    ['persistence.md', '会话持久化', 'Session persistence'],
    ['spill.md', 'Spill 存储', 'Spill storage'],
    ['session-telemetry.md', '遥测', 'SessionTelemetryBackend'],
    ['attachment.md', '附件', 'Attachments'],
    ['deliverables.md', '交付物', 'Deliverables'],
  ]],
  ['模型与上下文', 'Model and context', [
    ['llm-streaming.md', 'LLM 流式响应', 'LLM streaming'],
    ['token-meter.md', 'Token 计量', 'Token metering'],
    ['system-prompt.md', '系统提示词', 'System prompts'],
    ['compaction.md', '上下文压缩', 'Compaction'],
  ]],
  ['执行与工具', 'Execution and tools', [
    ['tools.md', '工具', 'Tools'],
    ['shell.md', 'Bash 执行', 'Bash execution'],
    ['subprocess.md', '子进程', 'Subprocesses'],
    ['terminal.md', 'PTY 会话', 'PTY sessions'],
    ['jobs.md', '后台任务', 'Background jobs'],
    ['filesystem.md', '文件系统', 'Filesystem'],
    ['lsp.md', 'LSP 导航', 'LSP navigation'],
    ['ptc-runtime.md', 'PTC 运行时', 'PTC runtime'],
    ['web.md', 'Web 访问', 'Web access'],
    ['skills.md', '技能', 'Skills'],
    ['workflow.md', '工作流', 'Workflows'],
    ['subagent.md', '子智能体', 'Subagents'],
    ['agent-team.md', '智能体团队', 'Agent teams'],
    ['browser-use.md', '浏览器交互', 'Browser use'],
    ['computer-use.md', '计算机交互', 'Computer use'],
    ['extensions.md', '扩展', 'Extensions'],
    ['office-to-pdf.md', 'Office 转 PDF', 'Office to PDF'],
    ['ssh.md', 'SSH 执行', 'SSH execution'],
    ['todo.md', '待办', 'Todo tracking'],
    ['translation.md', '翻译', 'Translation'],
  ]],
  ['策略与交互', 'Policy and interaction', [
    ['approval.md', '审批', 'Approvals'],
    ['permission-presets.md', '权限预设', 'Permission presets'],
    ['sandbox.md', '沙箱', 'Sandboxing'],
    ['plan.md', '计划模式', 'Plan mode'],
    ['user-questions.md', '用户交互', 'User interaction'],
    ['commands.md', '命令', 'Human commands'],
    ['goal.md', '目标', 'Goals'],
    ['schedule.md', '定时提醒', 'Scheduled reminders'],
    ['feedback.md', '反馈', 'Feedback'],
    ['voice-input.md', '语音输入', 'Voice input'],
  ]],
  ['平台与接入', 'Platform and access', [
    ['web-server.md', 'HTTP 服务器', 'HTTP server'],
    ['web-client.md', 'Web Client 架构', 'Web Client architecture'],
    ['client-modules.md', '客户端模块', 'Client modules'],
    ['slots.md', '客户端 Slots', 'Client slots'],
    ['client-resources.md', '客户端资源', 'Client resources'],
    ['sidebar-right.md', '右侧 Sidebar', 'Right Sidebar'],
    ['conversation.md', 'Conversation 组装', 'Conversation assembly'],
    ['typert.md', 'Typert', 'Typert'],
    ['storage.md', '存储', 'Storage'],
    ['workspace.md', '工作区', 'Workspaces'],
    ['settings.md', '用户设置', 'User settings'],
    ['credentials.md', '用户凭据', 'User credentials'],
    ['boot.md', '启动', 'Boot'],
    ['claude-code-mods.md', 'Claude Code 适配', 'Claude Code mods'],
    ['forge.md', 'Forge', 'Forge'],
    ['liveshare.md', '实时共享', 'Liveshare'],
    ['mcp.md', 'MCP', 'MCP'],
    ['otel.md', 'OpenTelemetry', 'OpenTelemetry'],
    ['product-telemetry.md', '产品遥测', 'Product telemetry'],
    ['webhook.md', 'Webhook', 'Webhooks'],
    ['working-directory.md', '工作目录', 'Working directories'],
    ['worktrees.md', '工作树', 'Worktrees'],
  ]],
] as const

const subsystemsReference = subsystemGroups.flatMap(([, enSection, files]) => pages(
  files.map(([file, , enLabel], order): PageSpec => ({
    source: `docs/subsystems/${file}`,
    route: file === 'README.md' ? 'reference/subsystems/index.md' : `reference/subsystems/${file}`,
    label: enLabel,
    sidebar: 'reference',
    section: enSection,
    order,
    // Subsystem pages carry long third-level sections a two-level outline reaches.
    outline: [2, 3],
    ...(file === 'README.md' ? { sourceAliases: ['docs/subsystems'] } : {}),
  })),
))

const reference = [
  // `docs/deepseek-llm-api-wire-extensions.md` is a repository-only provider protocol reference.
  // Projected links intentionally resolve to its GitHub source instead of a public site route.
  ...pages(([
    ['docs/architecture.md', 'reference/index.md', '架构', 'Architecture', 0],
  ] as const).map(([source, route, , enLabel, order]): PageSpec => ({
    source,
    route,
    label: enLabel,
    sidebar: 'reference',
    section: 'Concepts',
    order,
  }))),
  ...pages(([
    ['docs/capability-seams.md', 'reference/capability-seams.md', '能力服务', 'Capability services', 2],
    ['docs/agent-lifecycle.md', 'reference/agent-lifecycle.md', 'Agent 生命周期', 'Agent lifecycle', 3],
    ['docs/tool-execution-pipeline.md', 'reference/tool-execution-pipeline.md', 'Tool 执行', 'Tool execution', 4],
    ['docs/api-gateway.md', 'reference/api-gateway.md', 'API Gateway', 'API Gateway', 5],
  ] as const).map(([source, route, , enLabel, order]): PageSpec => ({
    source,
    route,
    label: enLabel,
    sidebar: 'reference',
    section: 'Concepts',
    order,
  }))),
  ...pages(([
    ['docs/config-catalog.md', 'reference/config-catalog.md', '插件配置', 'Plugin configuration'],
    ['docs/tool-catalog.md', 'reference/tool-catalog.md', 'Tool Schema', 'Tool schemas'],
    ['docs/persistence-catalog.md', 'reference/persistence-catalog.md', '持久化事件', 'Persistence events', 'deep'],
    ['docs/experimental-persistence-catalog.md', 'reference/experimental-persistence-catalog.md', '实验性持久化记录', 'Experimental persistence'],
  ] as const).map(([source, route, , enLabel, outline], order): PageSpec => ({
    source,
    route,
    label: enLabel,
    sidebar: 'reference',
    section: 'Generated reference',
    order,
    ...(outline === undefined ? {} : { outline }),
  }))),
  ...pages(([
    ['context.md', 'Context', 'Context'],
    ['events.md', 'Events', 'Events'],
    ['fiber.md', 'Fiber', 'Fiber'],
    ['registry.md', 'Plugin Registry', 'Plugin Registry'],
    ['service.md', 'Service', 'Service'],
  ] as const).map(([file, , enLabel], order): PageSpec => ({
    source: `docs/cordis-api/${file}`,
    route: `reference/cordis-api/${file}`,
    label: enLabel,
    sidebar: 'reference',
    section: 'Cordis Core API',
    order,
  }))),
  ...pages(([
    ['inherited.md', '继承接口面', 'Inherited surface'],
  ] as const).map(([file, , enLabel], order): PageSpec => ({
    source: `docs/cordis-api/${file}`,
    route: `reference/cordis-api/${file}`,
    label: enLabel,
    sidebar: 'reference',
    section: 'Cordis Core API',
    order: order + 5,
  }))),
  ...pages(([
    ['adding-a-package.md', '新增 Package', 'Adding a package'],
    ['adding-a-tool.md', '新增 Tool', 'Adding a tool'],
    ['adding-an-llm-adapter.md', '新增 LLM Adapter', 'Adding an LLM adapter'],
    ['adding-a-settings-card.md', '新增设置页', 'Adding a settings page'],
    ['extension-cookbook.md', '扩展模式', 'Extension patterns'],
  ] as const).map(([file, , enLabel], order): PageSpec => ({
    source: `docs/cookbook/${file}`,
    route: `reference/cookbook/${file}`,
    label: enLabel,
    sidebar: 'reference',
    section: 'Cookbook',
    order,
  }))),
]

/**
 * Sidebar collections in the order the site's navigation presents them. The
 * navigation bar and the llms.txt index both read this sequence, so a new
 * collection lands in both surfaces together.
 */
export const sidebarCollections = ['guide', 'develop', 'reference'] as const satisfies readonly DocsSidebar[]

/** A sidebar group, matched to pages by `label`. */
export interface DocsSection {
  /** Group heading, equal to the `section` field of every page it holds. */
  label: string
  /** Render the group collapsed until it holds the page being read. */
  collapsed?: boolean
}

/**
 * Every sidebar group, in render order.
 *
 * The subsystem groups collapse because together they outnumber the rest of the
 * reference sidebar; expanded, they push every other group below the fold.
 */
const sections: readonly DocsSection[] = [
  { label: 'Guide' }, { label: 'SDK' }, { label: 'Automation' }, { label: 'Integrations' },
  { label: 'Basics' }, { label: 'Framework' }, { label: 'Practice' }, { label: 'Cordis framework tutorial' },
  { label: 'Concepts' }, { label: 'Generated reference' }, { label: 'Cordis Core API' }, { label: 'Cookbook' },
  { label: 'Overview' },
  { label: 'Core and scopes', collapsed: true },
  { label: 'Sessions and persistence', collapsed: true },
  { label: 'Model and context', collapsed: true },
  { label: 'Execution and tools', collapsed: true },
  { label: 'Policy and interaction', collapsed: true },
  { label: 'Platform and access', collapsed: true },
]

/**
 * Placement and collapse behavior of one sidebar group.
 *
 * @param label - Section label carried by the pages in the group.
 * @returns The declared group, plus its zero-based position.
 * @throws When no placement is declared for the label. Ranking by list
 *   membership alone would sort an undeclared group silently ahead of every
 *   declared one.
 */
export function sectionSpec(label: string): DocsSection & { index: number } {
  const section = sections.find(candidate => candidate.label === label)
  if (section === undefined) throw new Error(`Sidebar section "${label}" has no placement.`)
  return { ...section, index: sections.indexOf(section) }
}

/** Every canonical page published by the documentation website. */
export const docsPages: DocsPage[] = [
  ...homeAndGuide,
  ...develop,
  ...cordisTutorial,
  ...cordisPrimerReference,
  ...subsystemsReference,
  ...reference,
]

/**
 * Pages of one sidebar collection, in the order the sidebar lists them.
 *
 * @param collection - Sidebar collection to read.
 * @returns The collection's pages, ordered by section placement then by `order`.
 */
export function orderedPages(collection: DocsSidebar): DocsPage[] {
  return docsPages
    .filter(page => page.sidebar === collection)
    .sort((left, right) => (
      sectionSpec(left.section).index - sectionSpec(right.section).index
      || left.order - right.order
    ))
}

/**
 * Site-relative link for a published route.
 *
 * @param route - Manifest route, including its `.md` suffix.
 * @returns The link VitePress serves the route at.
 */
export function routeLink(route: string): string {
  return `/${route.replace(/(?:index)?\.md$/, '')}`
}

/**
 * Where a top-level navigation item lands.
 *
 * The target is derived rather than written down: a collection whose first page
 * is renamed or reordered would otherwise leave the navigation bar pointing at
 * a route the manifest no longer publishes.
 *
 * @param collection - Sidebar collection the item opens.
 * @returns Site-relative link of the collection's first page.
 * @throws When the collection publishes no page.
 */
export function landingLink(collection: DocsSidebar): string {
  const first = orderedPages(collection)[0]
  if (first === undefined) throw new Error(`Sidebar collection "${collection}" publishes no page.`)
  return routeLink(first.route)
}
