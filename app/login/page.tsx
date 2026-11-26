"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2, Mail, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { Waveform } from "@/components/Waveform";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [method, setMethod] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) setError("That sign-in link is invalid or has expired. Please try again.");
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!email.trim()) { setError("Enter your email address."); return; }
    if (method === "password" && password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;

    try {
      if (method === "magic") {
        const { error: authError } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirectTo } });
        if (authError) throw authError;
        setMessage("Check your inbox — we sent you a secure sign-in link.");
      } else if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(), password, options: { emailRedirectTo: redirectTo },
        });
        if (authError) throw authError;
        if (data.session) { router.push("/"); router.refresh(); }
        else setMessage("Account created. Confirm your email, then sign in.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        router.push("/");
        router.refresh();
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <section className="login-art relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.07] p-12 lg:flex">
        <div className="hairline-grid pointer-events-none absolute inset-0" />
        <Link href="/" className="relative flex items-center gap-3">
          <BrandMark size={36} />
          <div>
            <div className="text-[16px] font-semibold tracking-[-0.04em]">kairo</div>
            <div className="mt-1 text-[9px] uppercase tracking-[0.22em] text-white/35">voice intelligence</div>
          </div>
        </Link>
        <div className="relative max-w-lg">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-white/40">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c8ff5e]" /> Words, without the work
          </div>
          <h1 className="text-[52px] font-light leading-[1.05] tracking-[-0.06em] text-white">
            Think out loud.<br /><span className="text-white/30">We&apos;ll do the writing.</span>
          </h1>
          <p className="mt-6 max-w-md text-[14px] leading-relaxed text-white/40">
            A quiet place for your ideas. Dictate in English, Hindi or Hinglish, and get back clean, considered text in seconds.
          </p>
          <div className="mt-10 w-[320px] opacity-80"><Waveform active={false} /></div>
        </div>
        <p className="relative text-[10px] uppercase tracking-[0.18em] text-white/20">Private by design · Powered by Supabase Auth</p>
      </section>

      {/* Form */}
      <section className="flex items-center justify-center px-6 py-14 sm:px-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 flex items-center justify-between lg:hidden">
            <Link href="/" className="flex items-center gap-2.5"><BrandMark size={30} /><span className="text-sm font-semibold">kairo</span></Link>
            <Link href="/" className="btn btn-icon"><ArrowLeft size={16} /></Link>
          </div>

          <div className="mb-8">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-[#c8ff5e]"><ShieldCheck size={19} /></div>
            <h2 className="text-[28px] font-light tracking-[-0.05em] text-white">{mode === "signin" ? "Welcome back." : "Start with Kairo."}</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-white/40">
              {mode === "signin" ? "Sign in to sync your transcripts everywhere." : "Create an account to keep your history in the cloud."}
            </p>
          </div>

          <div className="segment mb-6 w-full">
            <button data-active={method === "password"} onClick={() => { setMethod("password"); setError(""); }} className="flex-1">Password</button>
            <button data-active={method === "magic"} onClick={() => { setMethod("magic"); setError(""); }} className="flex-1">Email link</button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label mb-2 block">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" autoComplete="email" className="input py-3 pl-10"
                />
              </div>
            </div>
            {method === "password" && (
              <div>
                <label className="label mb-2 block">Password</label>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters" autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  className="input py-3"
                />
              </div>
            )}

            {error && <p className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-[12px] leading-relaxed text-red-300">{error}</p>}
            {message && (
              <p className="flex items-start gap-2 rounded-xl border border-[#c8ff5e]/20 bg-[#c8ff5e]/[0.06] px-4 py-3 text-[12px] leading-relaxed text-[#c8ff5e]">
                <Check size={14} className="mt-0.5 flex-none" /> {message}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn btn-accent w-full py-3.5 text-[13px]">
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              {loading ? "One moment…" : method === "magic" ? "Send secure link" : mode === "signin" ? "Sign in" : "Create account"}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          <p className="mt-6 text-center text-[12px] text-white/35">
            {mode === "signin" ? "New to Kairo?" : "Already have an account?"}{" "}
            <button
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setMessage(""); }}
              className="font-medium text-white/80 underline decoration-white/20 underline-offset-4 transition hover:text-[#c8ff5e]"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
          <Link href="/" className="mt-5 block text-center text-[11px] text-white/25 transition hover:text-white/60">Continue without an account</Link>
        </div>
      </section>
    </main>
  );
}
