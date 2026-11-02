<div align="center">

![VEGA Harness](.github/assets/vega-harness-cover.png)

# VEGA Harness

**ИИ-агент, который делает, а не только отвечает — без VPN, без подписки, без компромиссов по приватности.**

[Русский](#по-русски) · [English](#english)

</div>

---

## По-русски

**VEGA Harness** — это агентская среда выполнения: открытый (MIT) форк [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), адаптированный под реальность русскоязычного пользователя. Формула проста: **Агент = Модель + Harness**. Модель рассуждает, а harness даёт ей руки — файлы, терминал, браузер, поиск. Веб-чат нужен, чтобы *спросить*. Harness — чтобы *сделать*.

### Знакомые боли — и как мы их закрыли

| Боль | Решение в VEGA Harness |
|---|---|
| DeepSeek API не работает из России без VPN, оплата зарубежной картой — лотерея | **Работает в России без VPN.** Вход через аккаунт VEGA одной кнопкой, баланс в рублях |
| Сырой текст промптов и документов уходит провайдеру — риск по 152-ФЗ | **Обезличивание промптов и документов** перед отправкой: персональные данные не покидают доверенный контур |
| Одна модель — одна эпоха; переподключать агента под новую LLM мучительно | **400+ AI-моделей** через единый ключ `api.vega.chat` — переключение в один клик |
| Агент слеп к актуальному интернету — отвечает вчерашним днём | **Встроенные web search и web fetch** на движке Parallel: ищет и читает страницы сам, без ваших копипастов |
| Для картинки или видео нужен отдельный сервис и отдельный диалог | **Генерация фото и видео** прямо в сессии через VEGA Studio skill |
| Подписка списывается даже когда не пользуешься; твои данные — топливо чужой аналитики | **Без подписки** — платите только за токены. **Без аналитики и рекламы** вообще |

### Что можно делать

- **Работа с проектом.** Агент сам изучает репозиторий или папку с документами, пишет и правит файлы, гоняет тесты, собирает отчёты и презентации.
- **Исследования с фактами.** Встроенный поиск Parallel находит источники, читает их и проверяет утверждения — без галлюцинаций «из памяти».
- **Контент и медиа.** Попросили картинку для статьи или видеоролик — агент сгенерирует их через VEGA Studio, не выходя из задачи.
- **Автоматизация по расписанию.** «Каждую пятницу в 17:00 собери записи проекта и сделай недельный отчёт» — один раз настроили, дальше работает само.
- **Корпоративный контур.** Обезличивание данных на входе делает сценарий «агент читает внутренние документы» совместимым с требованиями 152-ФЗ.

### Под капотом

Архитектура «всё — плагин» на фреймворке Cordis: адаптер модели, инструменты, сессии, песочница, agent loop — каждый слой заменяем конфигурацией, без форка рантайма. Сессии персистентны: переживают перезапуск, сжимаются, журналируют каждый вызов инструмента для аудита.

### Запуск из исходников

```sh
git clone <этот репозиторий>
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

Web UI откроется на `http://127.0.0.1:3080`. Войдите через аккаунт VEGA — ключ `sk-apivega-…` и список моделей подтянутся автоматически, без ручного ввода.

> **Developer preview.** Проект активно развивается, возможны ломающие изменения. См. [уведомление о безопасности](SAFETY.md).

---

## English

**VEGA Harness** is an open-source (MIT) agent runtime — a fork of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) built for users who need privacy, reach, and zero friction: **Agent = Model + Harness**. The model reasons; the harness acts — on files, shell, browser, and the live web.

### Why VEGA Harness over stock DeepSeek Harness

- **Works in Russia without a VPN** — sign in with a VEGA account, balance in RUB, no foreign cards.
- **Prompt & document depersonalization** — personal data is stripped before leaving your trusted boundary (152-FZ friendly).
- **400+ AI models** through a single `api.vega.chat` key — OpenRouter-compatible, one-click switching.
- **Integrated web search + web fetch** powered by Parallel — the agent reads the live internet itself.
- **Image & video generation** in-session via the VEGA Studio skill API.
- **No subscription** — pay per token only. **No analytics, no ads** — your usage is yours.

Everything else you love stays: the everything-is-a-plugin Cordis architecture, persistent auditable sessions, headless/PTC/SDK modes, and MIT licensing.

---

<p align="center">
  <a href="mailto:mail@vega.chat"><img src="https://img.shields.io/badge/✉️_Email-mail%40vega.chat-EA4335?style=for-the-badge" alt="Email: mail@vega.chat"></a>
  <a href="https://t.me/ingeniare"><img src="https://img.shields.io/badge/Telegram-t.me%2Fingeniare-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram: t.me/ingeniare"></a>
  <a href="https://vega.codes"><img src="https://img.shields.io/badge/🌐_Web-vega.codes-7B61FF?style=for-the-badge" alt="Web: vega.codes"></a>
</p>

<p align="center">
  <sub>License: <a href="LICENSE">MIT</a> · Built on <a href="https://github.com/deepseek-ai/deepseek-harness">DeepSeek Harness</a> · Powered by <a href="https://api.vega.chat">api.vega.chat</a></sub>
</p>
