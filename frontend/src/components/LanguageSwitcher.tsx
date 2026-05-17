import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  const current = i18n.resolvedLanguage === "en" ? "en" : "id";

  const toggle = () => {
    const next = current === "id" ? "en" : "id";
    void i18n.changeLanguage(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("header.language")}
      title={t("header.language")}
      className={
        "inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 " +
        (compact ? "px-1.5 py-1 text-[11px]" : "px-2 py-1 text-xs")
      }
    >
      <Languages size={compact ? 12 : 14} />
      <span className="font-medium uppercase">{current}</span>
    </button>
  );
}
