"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AudioLines, ChevronDown, Clock3, LogOut, Puzzle, Search, Settings2, Sparkles, Trash2, X,
} from "lucide-react";
import { useApp } from "./AppProvider";
import { BrandMark } from "./BrandMark";
import { languageLabel } from "@/lib/types";

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { history, user, signOut, selectEntry, deleteEntry, selectedId, clearHistory, notify } = useApp();
  const [query, setQuery] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? history.filter((h) => h.final_text.toLowerCase().includes(q)) : history;
  }, [history, query]);

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="flex items-center justify-between px-6 pb-7 pt-6">
        <Link href="/" onClick={onClose} className="flex items-center gap-3">
          <BrandMark />
          <div className="leading-none">
            <div className="text-[15px] font-semibold tracking-[-0.04em]">kairo</div>
            <div className="mt-1 text-[9px] uppercase tracking-[0.22em] text-white/35">kairo voice</div>
          </div>
        </Link>
        <button className="btn btn-icon lg:hidden" onClick={onClose} aria-label="Close menu"><X size={16} /></button>
      </div>

      <nav className="space-y-1 px-3">
        <Link href="/" onClick={onClose} className="nav-item" data-active={pathname === "/"} >
          <AudioLines size={16} /> Studio
        </Link>
        <Link href="/extension" onClick={onClose} className="nav-item" data-active={pathname === "/extension"}>
          <Puzzle size={16} /> Desktop extension
        </Link>
        <Link href="/settings" onClick={onClose} className="nav-item" data-active={pathname === "/settings"}>
          <Settings2 size={16} /> Settings
        </Link>
      </nav>

      <div className="mx-6 my-6 h-px bg-white/[0.07]" />

      <div className="flex min-h-0 flex-1 flex-col px-3">
        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            <Clock3 size={12} /> History
            <span className="ml-1 rounded-full bg-white/[0.07] px-1.5 py-0.5 text-[9px] tracking-normal text-white/50">{history.length}</span>
          </div>
          {history.length > 0 && (
            <button
              className="text-[11px] text-white/35 transition hover:text-red-300"
              onClick={() => {
                if (confirmClear) { clearHistory(); setConfirmClear(false); notify("History cleared.", "success"); }
                else { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 3000); }
              }}
            >
              {confirmClear ? "Confirm?" : "Clear"}
            </button>
          )}
        </div>

        <div className="relative px-2 pb-3">
          <Search size={13} className="absolute left-5 top-1/2 -translate-y-[38%] text-white/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transcripts"
            className="w-full rounded-[10px] border border-white/[0.06] bg-white/[0.03] py-2 pl-8 pr-3 text-[12px] text-white/80 outline-none placeholder:text-white/25 focus:border-white/20"
          />
        </div>

        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pb-4">
          {filtered.length === 0 ? (
            <div className="mx-2 mt-6 rounded-2xl border border-dashed border-white/[0.08] px-4 py-8 text-center">
              <Sparkles size={16} className="mx-auto mb-3 text-white/25" />
              <p className="text-[12px] leading-relaxed text-white/35">
                {history.length ? "No matches. Try another search." : "Your transcripts will appear here."}
              </p>
            </div>
          ) : filtered.map((item) => (
            <div key={item.id} className="group relative">
              <button
                onClick={() => { selectEntry(item.id); onClose(); }}
                className={`w-full rounded-xl px-3 py-3 pr-8 text-left transition ${
                  selectedId === item.id ? "bg-white/[0.09]" : "hover:bg-white/[0.045]"
                }`}
              >
                <div className="line-clamp-2 text-[12.5px] leading-[1.5] text-white/75">
                  {item.final_text || item.raw_text || "Untitled transcript"}
                </div>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-white/30">
                  <span>{relativeTime(item.created_at)}</span>
                  <span className="h-0.5 w-0.5 rounded-full bg-white/25" />
                  <span>{languageLabel(item.language)}</span>
                  {item.polished && <><span className="h-0.5 w-0.5 rounded-full bg-white/25" /><span className="text-[#c8ff5e]/70">polished</span></>}
                </div>
              </button>
              <button
                onClick={() => { deleteEntry(item.id); notify("Transcript deleted.", "info"); }}
                className="absolute right-2 top-3 rounded-md p-1.5 text-white/20 opacity-0 transition hover:bg-white/10 hover:text-red-300 group-hover:opacity-100"
                aria-label="Delete transcript"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/[0.07] p-4">
        {user ? (
          <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
            <div className="grid h-9 w-9 flex-none place-items-center rounded-full border border-white/15 bg-gradient-to-br from-white/20 to-white/5 text-[12px] font-semibold">
              {user.email?.slice(0, 1).toUpperCase() ?? "K"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] text-white/85">{user.email}</div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#c8ff5e]/70"><span className="h-1.5 w-1.5 rounded-full bg-[#c8ff5e]" /> Synced</div>
            </div>
            <button onClick={signOut} className="rounded-lg p-2 text-white/35 transition hover:bg-white/10 hover:text-white" aria-label="Sign out">
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <Link href="/login" onClick={onClose} className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 transition hover:bg-white/[0.07]">
            <div>
              <div className="text-[12px] font-medium text-white/85">Sign in to sync</div>
              <div className="mt-0.5 text-[10px] text-white/35">Keep history across devices</div>
            </div>
            <ChevronDown size={14} className="-rotate-90 text-white/40" />
          </Link>
        )}
      </div>
    </aside>
  );
}
