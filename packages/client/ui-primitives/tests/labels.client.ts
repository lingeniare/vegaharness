import type {
  DiffBlockLabels,
  JsonTreeLabels,
  MarkdownLabels,
  ReadBlockLabels,
  SearchBlockLabels,
  TerminalBlockLabels,
  WebBlockLabels,
} from '../src/index.ts'

export const markdownLabels: MarkdownLabels = {
  code: { copyLabel: 'Копировать', copiedLabel: 'Скопировано' },
  footnotes: 'Footnotes',
}

export const diffBlockLabels: DiffBlockLabels = {
  codeLabel: 'Блок кода', wrapLabel: 'Перенос строк', unwrapLabel: 'Отключить перенос строк',
  copy: 'Копировать', copied: 'Скопировано', collapseAria: 'Свернуть различия',
  expandAria: hidden => `Показать ещё ${hidden} строк различий`,
  collapse: 'Свернуть', expand: hidden => `… ещё ${hidden} строк`,
}

export const readBlockLabels: ReadBlockLabels = {
  codeLabel: 'Блок кода', wrapLabel: 'Перенос строк', unwrapLabel: 'Отключить перенос строк',
  window: (shown, total) => `Показано ${shown} из ${total} строк`,
  copy: 'Копировать', copied: 'Скопировано', collapseAria: 'Свернуть содержимое',
  expandAria: hidden => `Показать ещё ${hidden} строк`,
  collapse: 'Свернуть', expand: hidden => `… ещё ${hidden} строк`,
}

export const searchBlockLabels: SearchBlockLabels = {
  pathsSummary: (shown, total, truncated) => truncated
    ? `Показано ${shown} из ${total} путей`
    : `${shown} путей`,
  matchesSummary: (shown, total, files, truncated) => truncated
    ? `Показано ${shown} из ${total} совпадений · файлов: ${files}`
    : `Совпадений: ${shown} · файлов: ${files}`,
  copy: 'Копировать', copied: 'Скопировано', noResults: 'Нет результатов',
  collapseAria: 'Свернуть результаты',
  expandAria: hidden => `Показать ещё ${hidden} строк результатов`,
  collapse: 'Свернуть', expand: hidden => `… ещё ${hidden} строк`,
}

export const terminalBlockLabels: TerminalBlockLabels = {
  commandLine: line => `Командная строка ${line}`,
  signal: signal => `сигнал ${signal}`,
  exitCode: code => `код выхода ${code}`,
  noExitCode: 'код выхода отсутствует',
  running: 'Выполняется', failed: 'Ошибка', done: 'Завершено',
  copy: 'Копировать', copied: 'Скопировано', noOutput: 'Нет вывода',
  collapseAria: 'Свернуть вывод', collapse: 'Свернуть',
  expandAria: hidden => `Развернуть оставшиеся ${hidden} строк вывода`,
  expand: hidden => `… ещё ${hidden} строк`,
}

export const jsonTreeLabels: JsonTreeLabels = {
  copyValue: 'Copy value', copyJson: 'Copy JSON', copyPath: 'Copy property path',
  copyPrettyJson: 'Copy pretty JSON', copyCompactJson: 'Copy compact JSON',
  copied: 'Copied', copyFailed: 'Copy failed',
  collapseNode: 'Collapse JSON node', expandNode: 'Expand JSON node',
  copyButtonTitle: action => `${action}; right-click for copy options`,
}

export const webBlockLabels: WebBlockLabels = {
  noResults: 'Результаты не найдены', sourcesTruncated: 'Список источников обрезан',
  http: 'HTTP', contentTruncated: 'Содержимое обрезано', markdown: markdownLabels,
}
