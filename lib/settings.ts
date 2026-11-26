import { DEFAULT_SETTINGS, isFreeModel, type Settings } from "./types";

const KEY = "kairo.settings.v1";

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const stored = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as Settings;
    // Old installs may have a paid model saved; never let one through.
    if (!isFreeModel(stored.model)) stored.model = DEFAULT_SETTINGS.model;
    return stored;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(settings));
}
