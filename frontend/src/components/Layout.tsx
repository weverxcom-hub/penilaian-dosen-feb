import { Link, useLocation } from "react-router-dom";

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

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
                Penilaian Kinerja Dosen
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 truncate">
                Fakultas Ekonomi dan Bisnis &middot; UNIGA Malang
              </div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 text-xs sm:text-sm shrink-0">
            <Link
              to="/"
              className={`px-2.5 sm:px-3 py-1.5 rounded-md ${
                !isAdmin ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Mahasiswa
            </Link>
            <Link
              to="/admin"
              className={`px-2.5 sm:px-3 py-1.5 rounded-md ${
                isAdmin ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">{children}</main>
      <footer className="text-center text-xs text-slate-400 py-6 px-4">
        Periode penilaian 2025/2026 &middot; Data dijaga kerahasiaannya
      </footer>
    </div>
  );
}
