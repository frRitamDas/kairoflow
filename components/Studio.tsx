"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight, Check, Copy, Eraser, Keyboard, Loader2, Mic, Save, Sparkles, Square,
} from "lucide-react";
import { useApp } from "./AppProvider";
import { Waveform } from "./Waveform";
import { Toggle } from "./Toggle";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { localCleanup } from "@/lib/localCleanup";
import { LANGUAGES, languageLabel, type LanguageCode } from "@/lib/types";

function pickMimeType() {
  const options = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return options.find((type) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) ?? "";
}

export function Studio() {
  const { settings, updateSettings, notify, addEntry, user, history, selectedId, selectEntry } = useApp();
  const speech = useSpeechRecognition(settings.language);
  const [draft, setDraft] = useState("");
  const [rawText, setRawText] = useState("");
  const [polished, setPolished] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const textRef = useRef("");
  const rawRef = useRef("");
  const editedRef = useRef(false);
  const startedRef = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const historyRef = useRef(history);
  const speechRef = useRef(speech);

  useEffect(() => { textRef.current = draft; }, [draft]);
  useEffect(() => { rawRef.current = rawText; }, [rawText]);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { speechRef.current = speech; }, [speech]);
  useEffect(() => { speech.setErrorHandler((message) => notify(message, "error")); }, [speech.setErrorHandler, notify]);

  // Live words from the Web Speech API.
  useEffect(() => {
    if (settings.engine !== "browser" || !speech.listening || editedRef.current) return;
    setDraft(speech.finalText);
  }, [speech.finalText, speech.interimText, speech.listening, settings.engine]);

  // Open a transcript from the sidebar.
  useEffect(() => {
    if (!selectedId) return;
    const item = historyRef.current.find((entry) => entry.id === selectedId);
    if (!item) return;
    const text = item.final_text || item.raw_text;
    setDraft(text);
    setRawText(item.raw_text);
    setPolished(item.polished);
    editedRef.current = false;
    if (item.language !== settings.language) updateSettings({ language: item.language });
    notify("Transcript loaded from history.", "info");
    selectEntry(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const cleanupText = useCallback(async (text: string, silentFallback = false) => {
    if (!text.trim()) return { text, polished: false };
    try {
      const response = await fetch("/api/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          apiKey: settings.openrouterKey,
          model: settings.model,
          language: settings.language,
        }),
      });
      const data = await response.json();
      if (response.ok && typeof data.text === "string") return { text: data.text as string, polished: true };
      if (response.status === 400) {
        if (!silentFallback) notify("Using local cleanup — add an OpenRouter key for AI polishing.", "info");
        return { text: localCleanup(text, settings.language), polished: true };
      }
      throw new Error(data?.error ?? "Cleanup failed");
    } catch {
      notify("AI cleanup unavailable. Kept your original transcript.", "error");
      return { text, polished: false };
    }
  }, [settings.openrouterKey, settings.model, settings.language, notify]);

  const finalize = useCallback(async (spoken: string) => {
    const original = spoken.trim();
    if (!original) {
      setIsProcessing(false);
      return;
    }
    setIsProcessing(true);
    rawRef.current = original;
    setRawText(original);

    let final = original;
    let wasPolished = false;
    if (settings.aiCleanup) {
      const result = await cleanupText(original);
      final = result.text;
      wasPolished = result.polished;
    }

    setDraft(final);
    textRef.current = final;
    setPolished(wasPolished);
    editedRef.current = false;

    if (settings.autoSave) {
      await addEntry({
        raw_text: original,
        final_text: final,
        language: settings.language,
        source: settings.engine,
        polished: wasPolished,
        duration_ms: Math.max(0, Date.now() - startedRef.current),
      });
    }
    setIsProcessing(false);
  }, [settings.aiCleanup, settings.autoSave, settings.engine, settings.language, cleanupText, addEntry]);

  const stopGroqRecording = useCallback(() => {
    setIsRecording(false);
    if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
  }, []);

  const startGroqRecording = useCallback(async () => {
    if (!settings.groqKey) {
      notify("Add your Groq API key in Settings to use Whisper transcription.", "error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        if (!blob.size) { setIsProcessing(false); return; }
        setIsProcessing(true);
        const form = new FormData();
        form.append("file", blob, "kairo-audio.webm");
        form.append("apiKey", settings.groqKey);
        form.append("language", settings.language);
        try {
          const response = await fetch("/api/transcribe", { method: "POST", body: form });
          const data = await response.json();
          if (!response.ok || typeof data.text !== "string") throw new Error(data?.error ?? "Transcription failed");
          await finalize(data.text as string);
        } catch (error) {
          setIsProcessing(false);
          notify(error instanceof Error ? error.message : "Transcription failed.", "error");
        }
      };

      recorder.start(4000);
      startedRef.current = Date.now();
      setDraft("");
      setRawText("");
      setPolished(false);
      editedRef.current = false;
      setIsRecording(true);
    } catch {
      notify("Microphone access is needed to record audio.", "error");
    }
  }, [settings.groqKey, settings.language, finalize, notify]);

  const toggleRecording = useCallback(() => {
    if (isProcessing) return;
    if (isRecording) {
      if (settings.engine === "browser") {
        speechRef.current.stop();
        setIsRecording(false);
        setTimeout(() => {
          const current = speechRef.current;
          const spoken = editedRef.current
            ? textRef.current.trim()
            : [current.finalText, current.interimText].filter(Boolean).join(" ").trim();
          if (spoken) finalize(spoken);
        }, 300);
      } else {
        stopGroqRecording();
      }
      return;
    }
    if (settings.engine === "browser") {
      if (!speech.supported) {
        notify("Live transcription needs Chrome or Edge. You can also switch to Groq Whisper in Settings.", "error");
        return;
      }
      if (!speech.start()) return;
    } else {
      void startGroqRecording();
      return;
    }
    startedRef.current = Date.now();
    editedRef.current = false;
    setDraft("");
    setRawText("");
    setPolished(false);
    setIsRecording(true);
  }, [isProcessing, isRecording, settings.engine, speech, stopGroqRecording, startGroqRecording, finalize, notify]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "m") {
        event.preventDefault();
        toggleRecording();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleRecording]);

  const copy = async () => {
    if (!draft.trim()) return;
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    notify("Copied to clipboard.", "success");
    setTimeout(() => setCopied(false), 1800);
  };

  const polishNow = async () => {
    if (!draft.trim() || isProcessing) return;
    setIsProcessing(true);
    const result = await cleanupText(draft, true);
    setDraft(result.text);
    setPolished(result.polished);
    setIsProcessing(false);
    notify("Text polished.", "success");
  };

  const saveNow = async () => {
    if (!draft.trim()) return;
    await addEntry({
      raw_text: rawRef.current || draft,
      final_text: draft,
      language: settings.language,
      source: settings.engine,
      polished,
      duration_ms: Math.max(0, Date.now() - startedRef.current),
    });
    notify("Saved to history.", "success");
  };

  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  const status = isProcessing ? "Processing…" : isRecording ? (settings.engine === "browser" ? "Listening live" : "Recording audio") : draft ? "Ready" : "Standing by";

  return (
    <div className="relative mx-auto w-full max-w-[1180px] px-5 pb-16 pt-8 sm:px-8 lg:px-12 lg:pt-11">
      <div className="hairline-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px]" />

      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c8ff5e]" /> Workspace / Studio
          </div>
          <h1 className="mt-2 text-[22px] font-medium tracking-[-0.04em] text-white/95 sm:text-[25px]">Good to have you here.</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="segment" aria-label="Language selection">
            {LANGUAGES.map((language) => (
              <button
                key={language.code}
                data-active={settings.language === language.code}
                onClick={() => updateSettings({ language: language.code })}
                title={language.native}
              >
                {language.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
            <Sparkles size={14} className={settings.aiCleanup ? "text-[#c8ff5e]" : "text-white/30"} />
            <span className="text-[12px] text-white/70">AI cleanup</span>
            <Toggle checked={settings.aiCleanup} onChange={(value) => updateSettings({ aiCleanup: value })} label="AI cleanup" />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center pt-10 text-center sm:pt-14">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.035] px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">
          <span className={`h-1.5 w-1.5 rounded-full ${isRecording ? "bg-[#ff8f7a] shadow-[0_0_10px_#ff8f7a]" : "bg-[#c8ff5e] shadow-[0_0_10px_#c8ff5e]"}`} />
          {status}
        </div>
        <h2 className="max-w-2xl text-balance text-[34px] font-light leading-[1.1] tracking-[-0.055em] text-white sm:text-[48px] lg:text-[56px]">
          Speak naturally. <span className="text-white/35">Get clean text.</span>
        </h2>
        <p className="mt-4 max-w-lg text-[13px] leading-relaxed text-white/40 sm:text-[14px]">
          Kairo listens in real time, removes the ums and ahs, and gives you words worth keeping.
        </p>

        <div className="relative mt-10 flex flex-col items-center">
          <div className="mic-wrap">
            <span className={`mic-halo ${isRecording ? "live" : ""}`} />
            <span className={`mic-halo delay ${isRecording ? "live" : ""}`} />
            <span className={`mic-ring ${isRecording ? "live" : ""}`} />
            <button
              onClick={toggleRecording}
              disabled={isProcessing}
              className={`mic-button ${isRecording ? "live" : ""} ${isProcessing ? "busy" : ""}`}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isProcessing ? <Loader2 size={44} className="animate-spin" strokeWidth={1.6} />
                : isRecording ? <Square size={38} fill="currentColor" strokeWidth={1} />
                : <Mic size={44} strokeWidth={1.6} />}
            </button>
          </div>
          <div className="mt-6 h-10 w-[280px] sm:w-[360px]"><Waveform active={isRecording} /></div>
          <p className="mt-1 text-[11px] text-white/30">
            {isProcessing ? "Refining your words…" : isRecording ? "Tap the button to finish" : (
              <>
                Tap to speak or press <kbd className="mono rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/50">⌘ M</kbd>
              </>
            )}
          </p>
        </div>
      </section>

      {/* Transcript */}
      <section className="panel mt-10 overflow-hidden sm:mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className={`h-2 w-2 rounded-full ${isRecording ? "animate-pulse bg-[#ff8f7a]" : draft ? "bg-[#c8ff5e]" : "bg-white/20"}`} />
            <span className="text-[12px] font-medium tracking-tight text-white/85">Transcript</span>
            <span className="mono text-[10px] text-white/25">{String(wordCount).padStart(2, "0")} words</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-white/35">
            <span className="rounded-md border border-white/[0.07] px-2 py-1">{languageLabel(settings.language)}</span>
            <span className="rounded-md border border-white/[0.07] px-2 py-1">{settings.engine === "browser" ? "Web Speech" : "Groq Whisper"}</span>
            {polished && <span className="rounded-md border border-[#c8ff5e]/20 bg-[#c8ff5e]/[0.07] px-2 py-1 text-[#c8ff5e]/80">Polished</span>}
          </div>
        </div>

        <div className="relative min-h-[210px] px-5 py-7 sm:min-h-[250px] sm:px-9 sm:py-9">
          {!draft && !isRecording && (
            <div className="pointer-events-none absolute left-5 top-7 sm:left-9 sm:top-9">
              <p className="transcript-text text-white/15">Your words will appear here as you speak…</p>
            </div>
          )}
          <textarea
            value={draft}
            onChange={(event) => { editedRef.current = true; setDraft(event.target.value); }}
            placeholder=""
            spellCheck={false}
            aria-label="Transcript text"
            className="transcript-text block min-h-[160px] w-full resize-none bg-transparent text-white/90 outline-none placeholder:text-white/15"
          />
          {isRecording && settings.engine === "browser" && speech.interimText && (
            <p className="interim mt-1 text-[15px]">{speech.interimText}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] bg-black/10 px-5 py-3.5 sm:px-7">
          <div className="flex items-center gap-2 text-[11px] text-white/30">
            <Keyboard size={13} />
            <span className="hidden sm:inline">⌘ M to dictate · text is editable</span>
            <span className="sm:hidden">Editable</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={saveNow} disabled={!draft.trim()} className="btn" title="Save to history"><Save size={14} /> <span className="hidden sm:inline">Save</span></button>
            <button onClick={polishNow} disabled={!draft.trim() || isProcessing} className="btn" title="Polish with AI"><Sparkles size={14} /> <span className="hidden sm:inline">Polish</span></button>
            <button
              onClick={() => { setDraft(""); setRawText(""); setPolished(false); editedRef.current = false; speech.reset(); }}
              disabled={!draft.trim() || isRecording}
              className="btn"
              title="Clear transcript"
            ><Eraser size={14} /> <span className="hidden sm:inline">Clear</span></button>
            <button onClick={copy} disabled={!draft.trim()} className="btn btn-primary">
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy text"}
            </button>
          </div>
        </div>
      </section>

      {/* Status strip */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="panel-flat flex items-center gap-3 px-4 py-3.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#c8ff5e]/10 text-[#c8ff5e]"><AudioIcon /></div>
          <div><div className="text-[11px] font-medium text-white/80">{settings.engine === "browser" ? "Real-time capture" : "Studio-grade Whisper"}</div><div className="mt-0.5 text-[10px] text-white/30">{settings.engine === "browser" ? "Web Speech API" : "Groq whisper-large-v3-turbo"}</div></div>
        </div>
        <div className="panel-flat flex items-center gap-3 px-4 py-3.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.06] text-white/60"><Sparkles size={15} /></div>
          <div><div className="text-[11px] font-medium text-white/80">{settings.aiCleanup ? "Cleanup active" : "Cleanup off"}</div><div className="mt-0.5 text-[10px] text-white/30">{settings.aiCleanup ? settings.model.split("/").pop() : "Raw transcript only"}</div></div>
        </div>
        <div className="panel-flat flex items-center justify-between gap-3 px-4 py-3.5">
          <div><div className="text-[11px] font-medium text-white/80">{user ? "History synced" : `${history.length} local transcripts`}</div><div className="mt-0.5 text-[10px] text-white/30">{user ? "Saved to Supabase" : "Sign in to sync everywhere"}</div></div>
          {!user && <Link href="/login" className="rounded-lg border border-white/10 p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white" aria-label="Sign in"><ArrowUpRight size={15} /></Link>}
        </div>
      </div>
    </div>
  );
}

function AudioIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 12h2m3-5v10m4-14v18m4-14v10m4-7v4" />
    </svg>
  );
}
