<div align="center">

![VEGA Harness](cover.webp)

**An AI agent that gets things done, not just answers — no VPN, no subscription, no privacy trade-offs.**

[ `🇷🇺 Русский` ](README.md) ・ **`🇬🇧 English`**

</div>

---

**VEGA Harness** is an open-source (MIT) agent runtime — a fork of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) built for users who need privacy, reach, and zero friction. The formula is simple: **Agent = Model + Harness**. The model reasons; the harness gives it hands — files, terminal, browser, search. A web chat is for *asking*. A harness is for *doing*.

## Pain points — and how we solve them

| Pain | Solution in VEGA Harness |
|---|---|
| DeepSeek API doesn't work from Russia without a VPN; paying with a foreign card is a lottery | **Works in Russia without a VPN.** One-click VEGA account sign-in, balance in RUB |
| Raw prompts and documents go to the provider — a compliance risk under 152-FZ | **Prompt & document depersonalization** before sending: personal data never leaves your trusted boundary |
| One model, one era; rewiring an agent for every new LLM is painful | **400+ AI models** through a single `api.vega.chat` key — switch in one click |
| The agent is blind to the live internet — it answers with yesterday's knowledge | **Built-in web search and web fetch** on the Parallel engine: it finds and reads pages itself, no copy-pasting |
| An image or a video means a separate service and a separate chat | **Photo & video generation** right inside the session via the VEGA Studio skill |
| A subscription bills you even when you don't use it; your data fuels someone else's analytics | **No subscription** — pay per token only. **No analytics, no ads** at all |

## What you can do

- **Work on a project.** The agent explores a repo or a folder of documents itself, writes and edits files, runs tests, assembles reports and presentations.
- **Research with facts.** Built-in Parallel search finds sources, reads them, and verifies claims — no memory-based hallucinations.
- **Content & media.** Ask for an article illustration or a video clip — the agent generates it via VEGA Studio without leaving the task.
- **Scheduled automation.** "Every Friday at 17:00, collect the project notes and build a weekly report" — set it once, it runs by itself.
- **Corporate perimeter.** Input-side data depersonalization makes the "agent reads internal documents" scenario compatible with 152-FZ requirements.

## Under the hood

An everything-is-a-plugin architecture on the Cordis framework: model adapter, tools, sessions, sandbox, agent loop — every layer is replaceable via configuration, no runtime fork needed. Sessions are persistent: they survive restarts, compact, and journal every tool call for audit.

## Run from source

```sh
git clone <this repository>
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

The Web UI opens at `http://127.0.0.1:3080`. Sign in with a VEGA account — the `sk-apivega-…` key and the model list are pulled automatically, no manual key entry.

> **Developer preview.** The project is evolving fast; breaking changes are possible. See the [safety notice](SAFETY.md).

---

<p align="center">
  <a href="mailto:mail@vega.chat"><img src="https://img.shields.io/badge/✉️_Email-mail%40vega.chat-EA4335?style=for-the-badge" alt="Email: mail@vega.chat"></a>
  <a href="https://t.me/ingeniare"><img src="https://img.shields.io/badge/Telegram-t.me%2Fingeniare-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram: t.me/ingeniare"></a>
  <a href="https://vega.codes"><img src="https://img.shields.io/badge/🌐_Web-vega.codes-7B61FF?style=for-the-badge" alt="Web: vega.codes"></a>
</p>

<p align="center">
  <sub>License: <a href="LICENSE">MIT</a> · Built on <a href="https://github.com/deepseek-ai/deepseek-harness">DeepSeek Harness</a> · Powered by <a href="https://api.vega.chat">api.vega.chat</a></sub>
</p>
