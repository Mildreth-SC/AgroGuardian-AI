"use client";

import { Check } from "lucide-react";
import { THEMES } from "@/lib/i18n/translations";
import { usePreferences } from "@/providers/preferences-provider";
import { cn } from "@/lib/utils";

export function AppearancePanel() {
  const { locale, theme, setLocale, setTheme, t } = usePreferences();

  return (
    <div className="rounded-2xl border border-forest/10 bg-cream p-5 space-y-5 text-sm">
      <div>
        <h2 className="font-medium text-forest">{t("settings.appearance")}</h2>
        <p className="text-xs text-ink/55 mt-1">{t("settings.saved")}</p>
      </div>

      <div>
        <p className="text-xs font-medium text-ink/60 mb-2">{t("settings.theme")}</p>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((th) => (
            <button
              key={th.id}
              type="button"
              onClick={() => setTheme(th.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors",
                theme === th.id
                  ? "border-leaf bg-leaf/10 ring-1 ring-leaf/30"
                  : "border-forest/15 bg-white hover:border-leaf/40"
              )}
            >
              <span
                className="h-8 w-8 shrink-0 rounded-lg ring-1 ring-black/10"
                style={{ background: th.swatch }}
              />
              <span className="text-xs font-medium">
                {locale === "en" ? th.labelEn : th.labelEs}
              </span>
              {theme === th.id && <Check className="ml-auto h-4 w-4 text-leaf" />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-ink/60 mb-2">{t("settings.language")}</p>
        <div className="flex gap-2">
          {(
            [
              { id: "es" as const, label: "Español", flag: "🇪🇨" },
              { id: "en" as const, label: "English", flag: "🇺🇸" },
            ] as const
          ).map((lang) => (
            <button
              key={lang.id}
              type="button"
              onClick={() => setLocale(lang.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                locale === lang.id
                  ? "border-leaf bg-leaf text-white"
                  : "border-forest/15 bg-white text-ink hover:border-leaf/40"
              )}
            >
              <span>{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
