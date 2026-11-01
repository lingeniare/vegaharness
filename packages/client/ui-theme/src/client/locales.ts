/** `settings.theme` namespace dictionaries (the Appearance and font settings rows' copy). */

/** The settings.theme namespace key union. */
export type ThemeKey = keyof typeof en

/** English dictionary, the key-set source of truth. */
export const en = {
  'appearance.title': 'Appearance',
  'appearance.light': 'Light',
  'appearance.dark': 'Dark',
  'appearance.system': 'System',
  'fontSize.text.title': 'Font size',
  'fontSize.text.description': 'Only affects conversation content',
  'fontSize.text.increase': 'Increase font size',
  'fontSize.text.decrease': 'Decrease font size',
  'fontSize.code.title': 'Code font size',
  'fontSize.code.description': 'Used for code blocks, inline code, and tool output',
  'fontSize.code.increase': 'Increase code font size',
  'fontSize.code.decrease': 'Decrease code font size',
  'fontSize.terminal.title': 'Terminal font size',
  'fontSize.terminal.description': 'Used for the sidebar terminal',
  'fontSize.terminal.increase': 'Increase terminal font size',
  'fontSize.terminal.decrease': 'Decrease terminal font size',
  'fontSize.unit': 'px',
  'fontFamily.text.title': 'Text font',
  'fontFamily.text.description': 'Used for the interface and conversation text. Separate fonts with commas; leave empty for the default',
  'fontFamily.code.title': 'Code font',
  'fontFamily.code.description': 'Used for code blocks, inline code, and tool output. Separate fonts with commas; leave empty for the default',
  'fontFamily.terminal.title': 'Terminal font',
  'fontFamily.terminal.description': 'Used for the sidebar terminal. Separate fonts with commas; leave empty for the default',
  'fontFamily.placeholder': 'Default',
  'fontSize.more': 'More font settings',
} satisfies Record<string, string>

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'appearance.title': 'Внешний вид',
  'appearance.light': 'Светлая',
  'appearance.dark': 'Тёмная',
  'appearance.system': 'Системная',
  'fontSize.text.title': 'Размер шрифта',
  'fontSize.text.description': 'Влияет только на содержимое диалога',
  'fontSize.text.increase': 'Увеличить размер шрифта',
  'fontSize.text.decrease': 'Уменьшить размер шрифта',
  'fontSize.code.title': 'Размер шрифта кода',
  'fontSize.code.description': 'Используется для блоков кода, встроенного кода и вывода инструментов',
  'fontSize.code.increase': 'Увеличить размер шрифта кода',
  'fontSize.code.decrease': 'Уменьшить размер шрифта кода',
  'fontSize.terminal.title': 'Размер шрифта терминала',
  'fontSize.terminal.description': 'Используется для терминала на боковой панели',
  'fontSize.terminal.increase': 'Увеличить размер шрифта терминала',
  'fontSize.terminal.decrease': 'Уменьшить размер шрифта терминала',
  'fontSize.unit': 'px',
  'fontFamily.text.title': 'Шрифт текста',
  'fontFamily.text.description': 'Используется для интерфейса и текста диалога. Разделяйте названия шрифтов запятыми; оставьте поле пустым, чтобы использовать шрифт по умолчанию',
  'fontFamily.code.title': 'Шрифт кода',
  'fontFamily.code.description': 'Используется для блоков кода, встроенного кода и вывода инструментов. Разделяйте названия шрифтов запятыми; оставьте поле пустым, чтобы использовать шрифт по умолчанию',
  'fontFamily.terminal.title': 'Шрифт терминала',
  'fontFamily.terminal.description': 'Используется для терминала на боковой панели. Разделяйте названия шрифтов запятыми; оставьте поле пустым, чтобы использовать шрифт по умолчанию',
  'fontFamily.placeholder': 'По умолчанию',
  'fontSize.more': 'Дополнительные настройки шрифта',
} satisfies Record<keyof typeof en, string>
