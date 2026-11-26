"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { loadSettings, saveSettings } from "@/lib/settings";
import { DEFAULT_SETTINGS, type LanguageCode, type Settings, type Transcript } from "@/lib/types";

const HISTORY_KEY = "kairo.history.v1";
type Toast = { id: number; message: string; tone: "success" | "error" | "info" };

type AppContextValue = {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  user: User | null;
  authReady: boolean;
  signOut: () => Promise<void>;
  history: Transcript[];
  addEntry: (entry: Omit<Transcript, "id" | "created_at">) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  selectedId: string | null;
  selectEntry: (id: string | null) => void;
  notify: (message: string, tone?: Toast["tone"]) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function readLocalHistory(): Transcript[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as Transcript[]) : [];
  } catch {
    return [];
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [history, setHistory] = useState<Transcript[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const migrated = useRef(false);

  const notify = useCallback((message: string, tone: Toast["tone"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  useEffect(() => {
    setSettings(loadSettings());
    setHistory(readLocalHistory());

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setAuthReady(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    return () => subscription.subscription.unsubscribe();
  }, [supabase]);

  // Load cloud history for signed-in users; move any guest history into their account.
  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;

    async function sync() {
      if (!user) {
        setHistory(readLocalHistory());
        migrated.current = false;
        return;
      }

      const { data, error } = await supabase
        .from("transcripts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (cancelled) return;
      if (error) {
        notify("Could not load your cloud history.", "error");
        return;
      }

      let rows = (data ?? []) as Transcript[];
      const local = readLocalHistory();

      if (!migrated.current && local.length) {
        migrated.current = true;
        const { data: inserted } = await supabase
          .from("transcripts")
          .insert(
            local.map((item) => ({
              user_id: user.id,
              raw_text: item.raw_text,
              final_text: item.final_text,
              language: item.language,
              source: item.source,
              polished: item.polished,
              duration_ms: item.duration_ms,
              created_at: item.created_at,
            })),
          )
          .select("*");
        if (inserted?.length) rows = [...inserted, ...rows].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        localStorage.removeItem(HISTORY_KEY);
      }

      setHistory(rows);
    }

    sync();
    return () => { cancelled = true; };
  }, [user, authReady, supabase, notify]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const addEntry = useCallback(async (entry: Omit<Transcript, "id" | "created_at">) => {
    const created_at = new Date().toISOString();
    if (user) {
      const { data, error } = await supabase
        .from("transcripts")
        .insert({ ...entry, user_id: user.id, created_at })
        .select("*")
        .single();
      if (error || !data) {
        notify("Transcript could not be saved to your account.", "error");
        return;
      }
      setHistory((prev) => [data as Transcript, ...prev]);
    } else {
      const item = { ...entry, id: crypto.randomUUID(), created_at } as Transcript;
      const next = [item, ...readLocalHistory()].slice(0, 200);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      setHistory(next);
    }
  }, [user, supabase, notify]);

  const deleteEntry = useCallback(async (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (user) {
      const { error } = await supabase.from("transcripts").delete().eq("id", id).eq("user_id", user.id);
      if (error) notify("Could not delete that transcript.", "error");
    } else {
      const next = readLocalHistory().filter((item) => item.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    }
    setSelectedId((current) => (current === id ? null : current));
  }, [user, supabase, notify]);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    if (user) {
      const { error } = await supabase.from("transcripts").delete().eq("user_id", user.id);
      if (error) notify("Could not clear your history.", "error");
    } else {
      localStorage.removeItem(HISTORY_KEY);
    }
    setSelectedId(null);
  }, [user, supabase, notify]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    notify("Signed out. Your local workspace is still available.", "success");
  }, [supabase, notify]);

  const selectEntry = useCallback((id: string | null) => {
    setSelectedId(id);
    if (typeof window !== "undefined" && window.location.pathname !== "/") router.push("/");
  }, [router]);

  const value: AppContextValue = {
    settings, updateSettings, user, authReady, signOut, history,
    addEntry, deleteEntry, clearHistory, selectedId, selectEntry, notify,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.tone}`}>
            <span className="toast-dot" />
            {toast.message}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function useLanguage(): LanguageCode {
  return useApp().settings.language;
}
