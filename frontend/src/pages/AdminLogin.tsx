import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertCircle, BookOpen, ShieldCheck } from "lucide-react";
import { api, ApiError } from "@/lib/api";

interface Props {
  onLogin: (token: string) => void;
}

export function AdminLogin({ onLogin }: Props) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await api.adminLogin(password);
      onLogin(token);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("admin_login.err_login_failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="text-indigo-600" size={20} />
          <h1 className="text-xl font-semibold">{t("admin_login.title")}</h1>
        </div>
        <p className="text-sm text-slate-500 mb-4">{t("admin_login.desc")}</p>
        <Link
          to="/panduan"
          className="mb-5 inline-flex items-center gap-1.5 text-xs sm:text-sm text-indigo-600 hover:text-indigo-700"
        >
          <BookOpen size={14} /> {t("admin_login.panduan_link")}
        </Link>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              {t("admin_login.label_password")}
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md px-4 py-2.5 disabled:opacity-60"
          >
            {loading ? t("common.loading") : t("admin_login.cta_login")}
          </button>
        </form>
      </div>
    </div>
  );
}
