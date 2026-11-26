# Kairo

A voice-first writing workspace — speak naturally, get back clean, considered text. Built with Next.js, Tailwind CSS, Supabase, Web Speech API, Groq Whisper and OpenRouter.

**Live:** https://kairoflow-eight.vercel.app (Vercel project `kairoflow`; `kairoflow.vercel.app` is currently held by another Vercel project and must be transferred/released to be attached here)

## Features

- **Large center mic** with rich listening animation and `⌘/Ctrl + M` shortcut.
- **Real-time transcription** via the browser Web Speech API (English, Hindi, Hinglish).
- **Groq Whisper mode** as a switchable STT engine using `whisper-large-v3-turbo`.
- **AI cleanup** through OpenRouter: removes fillers, fixes grammar, adds punctuation, preserves Hindi/Hinglish. Includes a local fallback when no key is set.
- **Editable transcript** with copy, polish, save and clear actions.
- **History** with search and delete; local for guests, synced per-user to Supabase when signed in.
- **Supabase Auth** with password and magic-link sign-in.
- **Settings** for API keys, cleanup model, engine, language and auto-save. Keys remain in browser storage.
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
| `OPENROUTER_API_KEY` | Optional server fallback for cleanup |
| `GROQ_API_KEY` | Optional server fallback for transcription |

Users can enter their own OpenRouter and Groq keys in **Settings**; those are stored in `localStorage` and forwarded only to `/api/cleanup` and `/api/transcribe`.

## Database

Run [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) in the Supabase SQL editor. It creates `public.transcripts` with row-level security: users can only read, insert and delete their own rows.

## Deployment

Deployed on Vercel from this repository. Production branch deployments are aliased to `kairoflow.vercel.app`. Set the environment variables above in the Vercel project settings, and add the deployment URL to the Supabase Auth redirect allow list.
