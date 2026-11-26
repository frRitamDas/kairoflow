import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/components/AppProvider";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Kairo — Speak it. Ship it.",
  description: "Voice-first writing with real-time transcription, AI cleanup, and a beautifully quiet workspace.",
  applicationName: "Kairo",
  openGraph: {
    title: "Kairo — Speak it. Ship it.",
    description: "Voice to text, refined. Real-time transcription with AI cleanup.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#07080a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="ambient">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
