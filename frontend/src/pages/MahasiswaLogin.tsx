import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, AlertCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api";

interface Props {
  onLogin: (nim: string, nama: string) => void;
}

export function MahasiswaLogin({ onLogin }: Props) {
  const [nim, setNim] = useState("");
  const [nama, setNama] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.loginMahasiswa(nim.trim(), nama.trim());
      onLogin(nim.trim(), nama.trim());
      navigate("/form");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Login gagal";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <h1 className="text-xl font-semibold mb-1">Login Mahasiswa</h1>
        <p className="text-sm text-slate-500 mb-6">
          Masukkan NIM dan nama lengkap Anda untuk mulai mengisi penilaian kinerja dosen.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nim" className="block text-sm font-medium text-slate-700 mb-1">
              NIM
            </label>
            <input
              id="nim"
              type="text"
              required
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              placeholder="2512000xxx"
              autoComplete="username"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label htmlFor="nama" className="block text-sm font-medium text-slate-700 mb-1">
              Nama Lengkap
            </label>
            <input
              id="nama"
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Sesuai data SIAKAD"
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
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md px-4 py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <LogIn size={16} />
            {loading ? "Memuat..." : "Mulai Mengisi Penilaian"}
          </button>
        </form>
        <div className="mt-6 text-xs text-slate-500 leading-relaxed">
          <p className="font-medium text-slate-700 mb-1">Catatan:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Penilaian ini bersifat anonim untuk dosen yang dinilai.</li>
            <li>Tidak mempengaruhi nilai Anda di setiap matkul.</li>
            <li>Data digunakan untuk evaluasi & perbaikan kinerja dosen.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
