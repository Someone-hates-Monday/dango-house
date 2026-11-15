# Model IDs and settings

A model ID is the provider's API identifier, not a character name. Checked on 2026-11-15 against the [official DeepSeek integration guide](https://api-docs.deepseek.com/).

For the official DeepSeek API, choose DeepSeek, use `https://api.deepseek.com/chat/completions`, and try `deepseek-flash` for everyday conversations. Another official option is `deepseek-v4-pro`. Example buttons only fill the field; they do not save settings or send paid requests. Gateways require the URL and model ID shown in their own console.

Save and test, then enable live chat. Avatar tools allow model-controlled character actions; turn them off to test plain chat with models that lack tool support. Enter keys only inside the local app.

Alpha.6 fixes text-input width rules stretching checkboxes and separating them from their labels. Checkboxes are 20×20 with a label hit area at least 44px tall; switches have 52×44 hit areas. Controls use 14–15px text and helpers 13px. Related instructions stay close, action groups wrap, and the active provider is retained.

Run `node scripts/verify-settings-layout.mjs --packaged` for isolated offline checks at 1280×860 and 1060×760 in Chinese, English and Japanese, including label clicks, model examples, sizing and horizontal overflow. No live API request is sent. The reviewed GPT video remains unchanged.

The local build is alpha.6; the public preview remains alpha.5. This update does not replace the published binary.
