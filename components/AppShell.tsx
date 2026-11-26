"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { BrandMark } from "./BrandMark";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="app-shell">
      {drawerOpen && <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />}
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="main-area min-h-screen">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3 lg:hidden">
          <button className="btn btn-icon" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <Menu size={17} />
          </button>
          <BrandMark size={27} />
          <span className="text-sm font-semibold tracking-tight">kairo</span>
        </div>
        {children}
      </div>
    </div>
  );
}
