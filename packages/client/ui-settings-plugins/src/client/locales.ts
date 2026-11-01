/** Locale bundles for the built-in plugins settings section. */

/** Locale keys the section renders. */
export type PluginsSettingsLocaleKey = 'nav' | 'title' | 'intro' | 'tabs' | 'empty'

/** English copy. */
export const en: Record<PluginsSettingsLocaleKey, string> = {
  nav: 'Built-in plugins',
  title: 'Built-in plugins',
  intro: 'Inspect the plugins this deployment ships.',
  tabs: 'Plugin views',
  empty: 'This deployment exposes no plugin views.',
}

/** Russian dictionary, checked against the English keys. */
export const ru = {
  nav: 'Встроенные плагины',
  title: 'Встроенные плагины',
  intro: 'Просмотрите плагины, входящие в состав этой установки.',
  tabs: 'Представления плагинов',
  empty: 'В этой установке нет доступных представлений плагинов.',
} satisfies Record<keyof typeof en, string>
