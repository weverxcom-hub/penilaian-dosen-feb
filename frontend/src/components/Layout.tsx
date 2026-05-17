import { Link, useLocation } from "react-router-dom";
import { GraduationCap } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white rounded-lg p-2">
              <GraduationCap size={20} />
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-sm sm:text-base">Penilaian Kinerja Dosen</div>
              <div className="text-xs text-slate-500">Fakultas Ekonomi dan Bisnis</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-md ${
                !isAdmin ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Mahasiswa
            </Link>
            <Link
              to="/admin"
              className={`px-3 py-1.5 rounded-md ${
                isAdmin ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      <footer className="text-center text-xs text-slate-400 py-6">
        Periode penilaian 2025/2026 &middot; Data dijaga kerahasiaannya
      </footer>
    </div>
  );
}
