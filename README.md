# Kairo

A voice-first writing workspace — speak naturally, get back clean, considered text. Built with Next.js, Tailwind CSS, Supabase, Web Speech API, Groq Whisper and OpenRouter.

**Live:** https://kairovoice.vercel.app

## Features

- **Large center mic** with rich listening animation and `⌘/Ctrl + M` shortcut.
- **Real-time transcription** via the browser Web Speech API (English, Hindi, Hinglish).
- **Groq Whisper mode** as an optional free-tier STT upgrade using `whisper-large-v3-turbo`; without a key, Kairo automatically uses the free Web Speech engine.
- **₹0 AI cleanup:** runs a built-in local cleaner by default — no key, no network call, no cost. Optional free-tier OpenRouter `*:free` models can be enabled in Settings; paid models are rejected by the server.
- **Editable transcript** with copy, polish, rewrite tones, save and clear actions.
- **Desktop extension** — Chromium side panel that dictates into any text field at ₹0. See [`extension/README.md`](extension/README.md) and the in-app `/extension` page.
- **History** with search and delete; local for guests, synced per-user to Supabase when signed in.
- **Supabase Auth** with password and magic-link sign-in.
- **Settings** for optional free-tier keys, free cleanup model, engine, language and auto-save. Keys remain in browser storage.
- Responsive dark UI with fine grain, glass panels and a mobile drawer.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase values
npm run dev
```

Environment variables:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key |
| `NEXT_PUBLIC_SITE_URL` | Site URL used for auth redirects |
| `OPENROUTER_API_KEY` | Optional free-tier-only fallback for cleanup (leave blank for ₹0 local cleanup) |
| `GROQ_API_KEY` | Optional free-tier fallback for transcription |

**Zero-cost design:** no key is required. Web Speech handles live transcription, and local cleanup handles polishing. If you add keys, only OpenRouter models ending in `:free` (or `openrouter/free`) are accepted, and Groq transcription is pinned to its free-tier Whisper model. Paid models are rejected server-side.

## Database

Run [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) in the Supabase SQL editor. It creates `public.transcripts` with row-level security: users can only read, insert and delete their own rows.

## Deployment

Deployed on Vercel from this repository at `kairovoice.vercel.app`. Set the environment variables above in the Vercel project settings, and add the deployment URL to the Supabase Auth redirect allow list.
