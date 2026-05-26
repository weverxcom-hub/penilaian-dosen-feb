import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { t } = useTranslation();
  const isAdmin = location.pathname.startsWith("/admin");
  const isPanduan = location.pathname.startsWith("/panduan");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img
              src="/logo-uniga.png"
              alt="Universitas Gajayana Malang"
              className="h-9 w-9 sm:h-11 sm:w-11 shrink-0 object-contain"
            />
            <div className="leading-tight min-w-0">
              <div className="font-semibold text-sm sm:text-base truncate">
                {t("header.app_title")}
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 truncate">
                {t("header.app_subtitle")}
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <nav className="flex items-center gap-1 text-xs sm:text-sm">
              <Link
                to="/"
                className={`px-2 sm:px-3 py-1.5 rounded-md ${
                  !isAdmin && !isPanduan
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t("header.nav_mahasiswa")}
              </Link>
              <Link
                to="/admin"
                className={`px-2 sm:px-3 py-1.5 rounded-md ${
                  isAdmin ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t("header.nav_admin")}
              </Link>
              <Link
                to="/panduan"
                className={`px-2 sm:px-3 py-1.5 rounded-md ${
                  isPanduan ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t("header.nav_panduan")}
              </Link>
            </nav>
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">{children}</main>
      <footer className="text-center text-xs text-slate-400 py-6 px-4">
        {t("footer.periode")} &middot; {t("footer.privacy")}
      </footer>
    </div>
  );
}
