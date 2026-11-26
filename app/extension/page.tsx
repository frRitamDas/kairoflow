import Link from "next/link";
import { ArrowLeft, ArrowRight, Download, Keyboard, LockKeyhole, Mic2, Sparkles, Wand2 } from "lucide-react";

const steps = [
  "Download and unzip the extension.",
  "Open chrome://extensions (or edge://extensions).",
  "Turn on Developer mode, then click Load unpacked.",
  "Select the unzipped folder and pin Kairo Voice to your toolbar.",
];

const features = [
  { icon: Mic2, title: "Talk into any field", note: "Click any textbox, tap the flowing orb, and speak. Kairo writes directly into it." },
  { icon: Sparkles, title: "Polish instantly", note: "Remove fillers, fix grammar, and add punctuation — free, locally or with a free key." },
  { icon: Wand2, title: "Rewrite in a tone", note: "Concise, professional or friendly. Your words, sharpened." },
  { icon: Keyboard, title: "Alt + K anywhere", note: "Open the side panel without leaving the page you're working on." },
];

export default function ExtensionPage() {
  return (
    <div className="mx-auto w-full max-w-[1080px] px-5 pb-20 pt-8 sm:px-8 lg:pt-12">
      <div className="hairline-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]" />

      <header className="mb-10 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c8ff5e]" /> Kairo Voice / Desktop
          </div>
          <h1 className="mt-3 max-w-2xl text-[34px] font-light leading-[1.08] tracking-[-0.055em] text-white sm:text-[50px]">
            Your voice, <span className="text-white/30">everywhere you type.</span>
          </h1>
          <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-white/40">
            A small side-panel extension for Chrome, Edge and other Chromium browsers. Click a text field, tap the flowing orb, and Kairo Voice writes for you — at ₹0.
          </p>
        </div>
        <Link href="/" className="btn"><ArrowLeft size={14} /> Back to studio</Link>
      </header>

      <section className="panel relative overflow-hidden p-6 sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#c8ff5e]/[0.08] blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <span className="rounded-full border border-[#c8ff5e]/25 bg-[#c8ff5e]/[0.07] px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[#c8ff5e]">
              Free · Manifest V3 · v1.0
            </span>
            <h2 className="mt-5 text-[24px] font-light tracking-[-0.04em] text-white sm:text-[30px]">Bring Kairo Voice to every tab.</h2>
            <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-white/40">
              Dictation, polish and rewrite live in a side panel, so the page you&apos;re on stays untouched. Text is inserted into the last field you focused, with proper input events for React, Vue and plain HTML forms.
            </p>
            <a href="/kairo-voice-extension.zip" className="btn btn-accent mt-6 px-5 py-3">
              <Download size={15} /> Download extension
            </a>
          </div>

          <div className="panel-flat p-5">
            <div className="label mb-4">Install in 4 steps</div>
            <ol className="space-y-3">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-[11.5px] leading-relaxed text-white/55">
                  <span className="mono grid h-5 w-5 flex-none place-items-center rounded-full border border-white/10 bg-white/[0.04] text-[10px] text-[#c8ff5e]">{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        {features.map(({ icon: Icon, title, note }) => (
          <div key={title} className="panel-flat flex gap-4 p-5">
            <div className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-[#c8ff5e]/10 text-[#c8ff5e]"><Icon size={16} /></div>
            <div>
              <div className="text-[13px] font-medium text-white/85">{title}</div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-white/35">{note}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-4">
        <div className="flex items-start gap-3">
          <LockKeyhole size={15} className="mt-0.5 flex-none text-white/40" />
          <p className="max-w-xl text-[11.5px] leading-relaxed text-white/40">
            Keys stay in your browser. No key is needed — local polish and rewrite are free, and optional OpenRouter keys can only use free models. No paid calls, no spend.
          </p>
        </div>
        <Link href="/settings" className="btn">Open settings <ArrowRight size={14} /></Link>
      </section>
    </div>
  );
}
