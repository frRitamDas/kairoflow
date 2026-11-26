# Kairo Voice — browser extension

A Manifest V3 side-panel extension for Chrome, Edge and other Chromium browsers. It brings Kairo dictation, polishing and rewriting to any text field on the web.

## Install

1. Download `kairo-voice-extension.zip` from the website (`/extension`) or clone this repo.
2. Unzip it into a folder.
3. Open `chrome://extensions` (or `edge://extensions`).
4. Enable **Developer mode** and click **Load unpacked**.
5. Select the unzipped folder, then pin **Kairo Voice** to the toolbar.

## Use

1. Click any text field on any website.
2. Click the Kairo Voice toolbar icon (or press **Alt + K**) to open the side panel.
3. Tap the flowing orb and speak. Tap again when done.
4. The transcript is polished and written straight into the field you had focused.

Modes in the panel:

- **Voice** — raw dictation, no changes.
- **Polish** — remove fillers, fix grammar, add punctuation.
- **Rewrite** — choose Concise, Professional or Friendly.

`Insert`, `Copy` and `Clear` are always available under the transcript, and the last eight results are kept in **Recent**.

## Free tier

No key is required. Polish and rewrite run locally in the extension. If you add an optional free-tier OpenRouter key in **Settings**, the extension calls the Kairo `/api/cleanup` route, which rejects every non-free model. Groq isn't needed by the extension; it uses the free Web Speech API for live dictation.

## Files

- `manifest.json` — MV3 config, side panel, commands
- `background.js` — panel behaviour and message relay
- `content.js` — tracks the focused field and inserts text with native input events
- `sidepanel.html` / `sidepanel.css` / `sidepanel.js` — UI, orb animation and speech logic
- `icons/` — toolbar icons

To update the shipped zip after editing, rezip the folder contents into `public/kairo-voice-extension.zip`.
