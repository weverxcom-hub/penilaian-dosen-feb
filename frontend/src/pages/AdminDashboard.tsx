import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  Download,
  FileSpreadsheet,
  Lock,
  LogOut,
  RefreshCcw,
  Unlock,
  Users,
} from "lucide-react";
import {
  api,
  ApiError,
  type Prodi,
  type RawResponse,
  type RekapDosen,
  type RekapItem,
  type Stats,
} from "@/lib/api";

interface Props {
  token: string;
  onLogout: () => void;
}

type Tab = "rekap" | "dosen" | "responses";

export function AdminDashboard({ token, onLogout }: Props) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [prodiList, setProdiList] = useState<Prodi[]>([]);
  const [selectedProdi, setSelectedProdi] = useState<number | undefined>(undefined);
  const [rekap, setRekap] = useState<RekapItem[]>([]);
  const [rekapDosen, setRekapDosen] = useState<RekapDosen[]>([]);
  const [responses, setResponses] = useState<RawResponse[]>([]);
  const [tab, setTab] = useState<Tab>("rekap");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [s, p, r, rd, resp] = await Promise.all([
        api.adminStats(token),
        api.adminListProdi(),
        api.adminRekap(token, selectedProdi),
        api.adminRekapDosen(token, selectedProdi),
        api.adminResponses(token, selectedProdi),
      ]);
      setStats(s);
      setProdiList(p);
      setRekap(r);
      setRekapDosen(rd);
      setResponses(resp);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onLogout();
        navigate("/admin");
        return;
      }
      setError(err instanceof ApiError ? err.message : t("admin_dashboard.err_load"));
    } finally {
      setLoading(false);
    }
  }, [token, selectedProdi, navigate, onLogout, t]);

  useEffect(() => {
    load();
  }, [load]);

  const togglePeriode = async () => {
    try {
      await api.adminTogglePeriode(token);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("admin_dashboard.err_periode"));
    }
  };

  const downloadRekap = async () => {
    try {
      const q = selectedProdi ? `?prodi_id=${selectedProdi}` : "";
      const period = stats?.periode;
      const name = `rekap-penilaian-dosen-${period?.semester.toLowerCase() ?? "periode"}-${period?.tahun_akademik.replace("/", "-") ?? ""}.xlsx`;
      await api.downloadFile(`/api/admin/export/rekap.xlsx${q}`, token, name);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin_dashboard.err_download"));
    }
  };

  const downloadRaw = async () => {
    try {
      const q = selectedProdi ? `?prodi_id=${selectedProdi}` : "";
      await api.downloadFile(`/api/admin/export/raw.xlsx${q}`, token, "penilaian-raw-responses.xlsx");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin_dashboard.err_download"));
    }
  };

  const progressPct = useMemo(() => {
    if (!stats || stats.total_mahasiswa === 0) return 0;
    return Math.round((stats.sudah_mengisi / stats.total_mahasiswa) * 100);
  }, [stats]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t("admin_dashboard.title")}</h1>
          <p className="text-sm text-slate-500">
            {stats?.periode
              ? t("admin_dashboard.periode_label", {
                  semester: stats.periode.semester,
                  tahun: stats.periode.tahun_akademik,
                })
              : t("admin_dashboard.periode_loading")}
            {stats?.periode && (
              <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${stats.periode.is_open ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                {stats.periode.is_open ? <Unlock size={12} /> : <Lock size={12} />}
                {stats.periode.is_open ? t("admin_dashboard.open") : t("admin_dashboard.closed")}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={togglePeriode}
            className="text-sm px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 inline-flex items-center gap-1"
          >
            {stats?.periode?.is_open ? <Lock size={14} /> : <Unlock size={14} />}
            {stats?.periode?.is_open ? t("admin_dashboard.btn_close_periode") : t("admin_dashboard.btn_open_periode")}
          </button>
          <button
            onClick={load}
            className="text-sm px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 inline-flex items-center gap-1"
          >
            <RefreshCcw size={14} /> {t("admin_dashboard.btn_refresh")}
          </button>
          <button
            onClick={() => {
              onLogout();
              navigate("/admin");
            }}
            className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
          >
            <LogOut size={14} /> {t("admin_dashboard.btn_logout")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={t("admin_dashboard.stat_total_mhs")} value={stats?.total_mahasiswa ?? 0} icon={<Users size={16} />} tone="slate" />
        <StatCard label={t("admin_dashboard.stat_filled")} value={stats?.sudah_mengisi ?? 0} tone="emerald" />
        <StatCard label={t("admin_dashboard.stat_pending")} value={stats?.belum_mengisi ?? 0} tone="amber" />
        <StatCard label={t("admin_dashboard.stat_total_penilaian")} value={stats?.total_penilaian ?? 0} tone="indigo" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-slate-700">{t("admin_dashboard.progress_label")}</span>
          <span className="text-slate-500">{progressPct}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm text-slate-600">{t("admin_dashboard.filter_prodi")}</label>
          <select
            value={selectedProdi ?? ""}
            onChange={(e) => setSelectedProdi(e.target.value ? Number(e.target.value) : undefined)}
            className="text-sm border border-slate-300 rounded-md px-2 py-1.5"
          >
            <option value="">{t("admin_dashboard.all_prodi")}</option>
            {prodiList.map((p) => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={downloadRekap}
            className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md inline-flex items-center gap-1.5"
          >
            <FileSpreadsheet size={14} /> {t("admin_dashboard.export_rekap")}
          </button>
          <button
            onClick={downloadRaw}
            className="text-sm bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded-md inline-flex items-center gap-1.5"
          >
            <Download size={14} /> {t("admin_dashboard.export_raw")}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 flex items-start gap-2 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {([
            ["rekap", t("admin_dashboard.tab_rekap")],
            ["dosen", t("admin_dashboard.tab_dosen")],
            ["responses", t("admin_dashboard.tab_responses")],
          ] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap ${
                tab === key
                  ? "text-indigo-700 border-b-2 border-indigo-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="p-3 sm:p-4">
          {loading && <div className="text-center text-slate-500 py-8">{t("common.loading")}</div>}
          {!loading && tab === "rekap" && <RekapTable rows={rekap} />}
          {!loading && tab === "dosen" && <RekapDosenTable rows={rekapDosen} />}
          {!loading && tab === "responses" && <ResponsesTable rows={responses} locale={i18n.resolvedLanguage} />}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, tone = "indigo" }: { label: string; value: number; icon?: React.ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-50 text-slate-700",
  };
  return (
    <div className={`rounded-xl px-4 py-3 ${tones[tone] ?? tones.indigo}`}>
      <div className="flex items-center gap-2 text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-2xl font-semibold leading-tight mt-0.5">{value}</p>
    </div>
  );
}

function rataColor(v: number): string {
  if (v >= 3.5) return "text-emerald-700";
  if (v >= 2.5) return "text-sky-700";
  if (v >= 1.5) return "text-amber-700";
  return "text-rose-700";
}

function RekapTable({ rows }: { rows: RekapItem[] }) {
  const { t } = useTranslation();
  if (rows.length === 0) {
    return <div className="text-center text-slate-500 py-8 text-sm">{t("admin_dashboard.empty")}</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-slate-500 bg-slate-50">
          <tr>
            <th className="text-left px-3 py-2">{t("admin_dashboard.th_prodi")}</th>
            <th className="text-left px-3 py-2">{t("admin_dashboard.th_dosen")}</th>
            <th className="text-left px-3 py-2">{t("admin_dashboard.th_matkul")}</th>
            <th className="px-2 py-2">{t("admin_dashboard.th_n")}</th>
            <th className="px-2 py-2">KD1</th>
            <th className="px-2 py-2">KD2</th>
            <th className="px-2 py-2">KD3</th>
            <th className="px-2 py-2">KD4</th>
            <th className="px-2 py-2">KD5</th>
            <th className="px-2 py-2">KD6</th>
            <th className="px-2 py-2">KD7</th>
            <th className="px-2 py-2">{t("admin_dashboard.th_avg")}</th>
            <th className="text-left px-3 py-2">{t("admin_dashboard.th_saran")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={`${r.dosen_id}-${r.matkul_id}`} className="hover:bg-slate-50">
              <td className="px-3 py-2 text-xs text-slate-600">{r.prodi_nama}</td>
              <td className="px-3 py-2 font-medium">{r.dosen_nama}</td>
              <td className="px-3 py-2 text-xs text-slate-600">
                <div className="font-mono text-[11px] text-slate-500">{r.matkul_kode}</div>
                <div>{r.matkul_nama}</div>
              </td>
              <td className="px-2 py-2 text-center text-slate-600">{r.jumlah_responden}</td>
              {[r.avg_kd1, r.avg_kd2, r.avg_kd3, r.avg_kd4, r.avg_kd5, r.avg_kd6, r.avg_kd7].map((v, i) => (
                <td key={i} className={`px-2 py-2 text-center ${rataColor(v)}`}>{v.toFixed(2)}</td>
              ))}
              <td className={`px-2 py-2 text-center font-semibold ${rataColor(r.rata_total)}`}>{r.rata_total.toFixed(2)}</td>
              <td className="px-3 py-2 text-xs text-slate-600 max-w-xs">
                {r.saran.length === 0 ? (
                  <span className="text-slate-400">—</span>
                ) : (
                  <ul className="list-disc pl-4 space-y-0.5">
                    {r.saran.slice(0, 3).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                    {r.saran.length > 3 && (
                      <li className="text-slate-400">
                        {t("admin_dashboard.more_items", { count: r.saran.length - 3 })}
                      </li>
                    )}
                  </ul>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RekapDosenTable({ rows }: { rows: RekapDosen[] }) {
  const { t } = useTranslation();
  if (rows.length === 0) {
    return <div className="text-center text-slate-500 py-8 text-sm">{t("admin_dashboard.empty")}</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-slate-500 bg-slate-50">
          <tr>
            <th className="text-left px-3 py-2">{t("admin_dashboard.th_prodi")}</th>
            <th className="text-left px-3 py-2">{t("admin_dashboard.th_dosen")}</th>
            <th className="px-2 py-2">{t("admin_dashboard.th_n")}</th>
            <th className="px-2 py-2">KD1</th>
            <th className="px-2 py-2">KD2</th>
            <th className="px-2 py-2">KD3</th>
            <th className="px-2 py-2">KD4</th>
            <th className="px-2 py-2">KD5</th>
            <th className="px-2 py-2">KD6</th>
            <th className="px-2 py-2">KD7</th>
            <th className="px-2 py-2">{t("admin_dashboard.th_avg")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.dosen_id} className="hover:bg-slate-50">
              <td className="px-3 py-2 text-xs text-slate-600">{r.prodi_nama}</td>
              <td className="px-3 py-2 font-medium">{r.dosen_nama}</td>
              <td className="px-2 py-2 text-center text-slate-600">{r.jumlah_responden}</td>
              {[r.avg_kd1, r.avg_kd2, r.avg_kd3, r.avg_kd4, r.avg_kd5, r.avg_kd6, r.avg_kd7].map((v, i) => (
                <td key={i} className={`px-2 py-2 text-center ${rataColor(v)}`}>{v.toFixed(2)}</td>
              ))}
              <td className={`px-2 py-2 text-center font-semibold ${rataColor(r.rata_total)}`}>{r.rata_total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResponsesTable({ rows, locale }: { rows: RawResponse[]; locale?: string }) {
  const { t } = useTranslation();
  const dtLocale = locale === "en" ? "en-GB" : "id-ID";
  if (rows.length === 0) {
    return <div className="text-center text-slate-500 py-8 text-sm">{t("admin_dashboard.empty_resp")}</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-slate-500 bg-slate-50">
          <tr>
            <th className="text-left px-3 py-2">{t("admin_dashboard.th_waktu")}</th>
            <th className="text-left px-3 py-2">{t("admin_dashboard.th_nim")}</th>
            <th className="text-left px-3 py-2">{t("admin_dashboard.th_mahasiswa")}</th>
            <th className="text-left px-3 py-2">{t("admin_dashboard.th_matkul")}</th>
            <th className="text-left px-3 py-2">{t("admin_dashboard.th_dosen")}</th>
            <th className="px-2 py-2">{t("admin_dashboard.th_avg")}</th>
            <th className="text-left px-3 py-2">{t("admin_dashboard.th_saran")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50">
              <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">
                {new Date(r.timestamp).toLocaleString(dtLocale, { hour12: false })}
              </td>
              <td className="px-3 py-2 font-mono text-xs">{r.nim}</td>
              <td className="px-3 py-2">
                <div className="font-medium">{r.mhs_nama}</div>
                <div className="text-xs text-slate-500">{r.prodi}</div>
              </td>
              <td className="px-3 py-2 text-xs">
                <div className="font-mono text-[11px] text-slate-500">{r.matkul_kode}</div>
                <div>{r.matkul_nama}</div>
              </td>
              <td className="px-3 py-2">{r.dosen_nama}</td>
              <td className={`px-2 py-2 text-center font-semibold ${rataColor(r.rata)}`}>{r.rata.toFixed(2)}</td>
              <td className="px-3 py-2 text-xs text-slate-600 max-w-xs">{r.saran || <span className="text-slate-400">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
