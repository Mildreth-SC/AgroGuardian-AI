"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type Locale, type ThemeId, t as translate } from "@/lib/i18n/translations";

type PreferencesContextValue = {
  locale: Locale;
  theme: ThemeId;
  setLocale: (l: Locale) => void;
  setTheme: (t: ThemeId) => void;
  t: (key: string) => string;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

const STORAGE_KEY = "agroguardian-preferences";

function loadPrefs(): { locale: Locale; theme: ThemeId } {
  if (typeof window === "undefined") return { locale: "es", theme: "field" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { locale: "es", theme: "field" };
    const p = JSON.parse(raw) as { locale?: Locale; theme?: ThemeId };
    return {
      locale: p.locale === "en" ? "en" : "es",
      theme: (["field", "dark", "sunset", "ocean"] as ThemeId[]).includes(p.theme as ThemeId)
        ? (p.theme as ThemeId)
        : "field",
    };
  } catch {
    return { locale: "es", theme: "field" };
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState(loadPrefs);

  useEffect(() => {
    document.documentElement.lang = prefs.locale;
    document.documentElement.dataset.theme = prefs.theme;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const setLocale = useCallback((locale: Locale) => {
    setPrefs((p) => ({ ...p, locale }));
  }, []);

  const setTheme = useCallback((theme: ThemeId) => {
    setPrefs((p) => ({ ...p, theme }));
  }, []);

  const value = useMemo(
    () => ({
      locale: prefs.locale,
      theme: prefs.theme,
      setLocale,
      setTheme,
      t: (key: string) => translate(prefs.locale, key),
    }),
    [prefs.locale, prefs.theme, setLocale, setTheme]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
