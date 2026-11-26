"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Check, Eye, EyeOff, Globe2, KeyRound, Loader2, LockKeyhole, Mic2, Save,
  ShieldCheck, Sparkles, TestTube2,
} from "lucide-react";
import { useApp } from "./AppProvider";
import { Toggle } from "./Toggle";
import { LANGUAGES, MODELS, type Engine } from "@/lib/types";

function KeyInput({
  value, onChange, placeholder, label,
}: { value: string; onChange: (value: string) => void; placeholder: string; label: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="label mb-2 block">{label}</label>
      <div className="relative">
        <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="input py-3 pl-10 pr-11 mono text-[12px]"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white/30 transition hover:text-white/70"
          aria-label={visible ? "Hide key" : "Show key"}
        >
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

function Section({
  icon, title, description, children,
}: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="panel p-5 sm:p-7">
      <div className="mb-6 flex items-start gap-4">
        <div className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-white/[0.09] bg-white/[0.04] text-white/70">{icon}</div>
        <div>
          <h2 className="text-[15px] font-medium tracking-tight text-white/95">{title}</h2>
          <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-white/35">{description}</p>
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function SettingsView() {
  const { settings, updateSettings, user, signOut, notify } = useApp();
  const [testing, setTesting] = useState(false);

  const testCleanup = async () => {
    setTesting(true);
    try {
      const response = await fetch("/api/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "umm so basically i think, like, this should work really well.",
          apiKey: settings.openrouterKey,
          model: settings.model,
          language: settings.language,
        }),
      });
      const data = await response.json();
      if (response.ok) notify(`Result: ${data.text}`, "success");
      else notify(data?.error ?? "Could not test cleanup.", "error");
    } catch {
      notify("Could not reach the cleanup service.", "error");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[980px] px-5 pb-20 pt-8 sm:px-8 lg:pt-11">
      <header className="mb-9 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c8ff5e]" /> Workspace / Settings
          </div>
          <h1 className="mt-2 text-[30px] font-light tracking-[-0.05em] text-white sm:text-[38px]">Make Kairo yours.</h1>
          <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-white/35">Tune transcription, polish and language to match how you think.</p>
        </div>
        <Link href="/" className="btn"><ArrowRight size={14} className="rotate-180" /> Back to studio</Link>
      </header>

      <div className="space-y-5">
        <Section
          icon={<Mic2 size={18} />}
          title="Speech engine"
          description="Start with browser transcription, or bring your own Groq key for Whisper-grade accuracy."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              { id: "browser", title: "Web Speech API", note: "Live, word-by-word transcription. Free, Chrome & Edge." },
              { id: "groq", title: "Groq Whisper", note: "Higher accuracy in noisy rooms and for Hinglish." },
            ] as { id: Engine; title: string; note: string }[]).map((option) => (
              <button
                key={option.id}
                onClick={() => updateSettings({ engine: option.id })}
                className={`rounded-2xl border p-4 text-left transition ${
                  settings.engine === option.id
                    ? "border-[#c8ff5e]/40 bg-[#c8ff5e]/[0.06]"
                    : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-white/90">{option.title}</span>
                  <span className={`grid h-4 w-4 place-items-center rounded-full border ${settings.engine === option.id ? "border-[#c8ff5e] bg-[#c8ff5e] text-[#121608]" : "border-white/20"}`}>
                    {settings.engine === option.id && <Check size={11} strokeWidth={3} />}
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-white/35">{option.note}</p>
              </button>
            ))}
          </div>
          <KeyInput
            label="Groq API key"
            placeholder={settings.engine === "groq" ? "gsk_…  (required for Whisper)" : "gsk_…  (optional)"}
            value={settings.groqKey}
            onChange={(value) => updateSettings({ groqKey: value })}
          />
        </Section>

        <Section
          icon={<Sparkles size={18} />}
          title="AI cleanup"
          description="Turn dictation into prose: filler words removed, grammar fixed, punctuation added."
        >
          <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5">
            <div>
              <div className="text-[13px] font-medium text-white/85">Enable cleanup after every recording</div>
              <div className="mt-1 text-[11px] text-white/35">You can still use the Polish button when this is off.</div>
            </div>
            <Toggle checked={settings.aiCleanup} onChange={(value) => updateSettings({ aiCleanup: value })} label="Enable AI cleanup" />
          </div>

          <div>
            <label className="label mb-2 block">Cleanup model</label>
            <div className="relative">
              <select
                value={settings.model}
                onChange={(event) => updateSettings({ model: event.target.value })}
                className="input select appearance-none py-3 pr-10 text-[13px]"
              >
                {MODELS.map((model) => <option key={model.id} value={model.id}>{model.label} — {model.note}</option>)}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/35">⌄</span>
            </div>
          </div>

          <KeyInput
            label="OpenRouter API key"
            placeholder="sk-or-v1-…"
            value={settings.openrouterKey}
            onChange={(value) => updateSettings({ openrouterKey: value })}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-md text-[11px] leading-relaxed text-white/30">
              No key? Kairo falls back to a lightweight local cleanup that removes common fillers.
            </p>
            <button onClick={testCleanup} disabled={testing} className="btn">
              {testing ? <Loader2 size={14} className="animate-spin" /> : <TestTube2 size={14} />} Test cleanup
            </button>
          </div>
        </Section>

        <Section
          icon={<Globe2 size={18} />}
          title="Language & storage"
          description="Choose how Kairo listens and where your transcripts live."
        >
          <div>
            <label className="label mb-3 block">Default language</label>
            <div className="segment flex-wrap">
              {LANGUAGES.map((language) => (
                <button
                  key={language.code}
                  data-active={settings.language === language.code}
                  onClick={() => updateSettings({ language: language.code })}
                >
                  {language.label} <span className="ml-1 text-[10px] opacity-50">{language.native}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5">
            <div>
              <div className="text-[13px] font-medium text-white/85">Save every transcript</div>
              <div className="mt-1 text-[11px] text-white/35">Automatically add finished recordings to your history.</div>
            </div>
            <Toggle checked={settings.autoSave} onChange={(value) => updateSettings({ autoSave: value })} label="Auto-save transcripts" />
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-[#c8ff5e]/15 bg-[#c8ff5e]/[0.04] px-4 py-3.5">
            <ShieldCheck size={16} className="mt-0.5 flex-none text-[#c8ff5e]/80" />
            <p className="text-[11px] leading-relaxed text-white/45">
              API keys stay in this browser&apos;s local storage. They are sent only to Kairo&apos;s server routes when you transcribe or polish, and never written to your Supabase account.
            </p>
          </div>
        </Section>

        <Section
          icon={<LockKeyhole size={18} />}
          title="Account"
          description={user ? "Your history is synced to Supabase and private to you." : "You can use Kairo without an account. Sign in to sync history across devices."}
        >
          {user ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-[12px] font-semibold">{user.email?.slice(0, 1).toUpperCase()}</div>
                <div>
                  <div className="text-[13px] text-white/85">{user.email}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[#c8ff5e]/70"><span className="h-1.5 w-1.5 rounded-full bg-[#c8ff5e]" /> Connected</div>
                </div>
              </div>
              <button onClick={signOut} className="btn">Sign out</button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-accent w-fit px-5">Sign in with Supabase <ArrowRight size={14} /></Link>
          )}
        </Section>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-[10px] uppercase tracking-[0.16em] text-white/20">
        <span>Kairo 1.0 · Built for clear thinking</span>
        <span className="flex items-center gap-1.5"><Save size={11} /> Settings saved locally</span>
      </div>
    </div>
  );
}
