import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, LogOut, Save } from "lucide-react";
import { api, ApiError, type Kelas, type LoginResponse, type PenilaianItem } from "@/lib/api";
import { ScoreInput } from "@/components/ScoreInput";

const KD_DESCRIPTIONS: { key: keyof Omit<PenilaianItem, "nim" | "kelas_id" | "saran">; label: string }[] = [
  { key: "kd1", label: "Menyampaikan RPS / Kontrak kuliah" },
  { key: "kd2", label: "Kesesuaian materi kuliah dengan RPS / Kontrak Kuliah" },
  { key: "kd3", label: "Kemampuan menjelaskan materi" },
  { key: "kd4", label: "Kemampuan menjawab pertanyaan / berdiskusi" },
  { key: "kd5", label: "Kemampuan berinteraksi dengan mahasiswa" },
  { key: "kd6", label: "Kedisiplinan / tepat waktu mengajar" },
  { key: "kd7", label: "Kerapian pakaian dosen" },
];

interface Props {
  nim: string;
  nama: string;
  onLogout: () => void;
}

type FormState = Record<number, Partial<PenilaianItem>>;

export function MahasiswaForm({ nim, nama, onLogout }: Props) {
  const navigate = useNavigate();
  const [data, setData] = useState<LoginResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!nim) {
      navigate("/");
      return;
    }
    api
      .loginMahasiswa(nim, nama)
      .then((d) => {
        setData(d);
        const initial: FormState = {};
        const expand: Record<number, boolean> = {};
        for (const k of d.kelas) {
          if (!d.sudah_dinilai_kelas_ids.includes(k.id)) {
            initial[k.id] = {};
            expand[k.matkul.id] = true;
          }
        }
        setForm(initial);
        setExpanded(expand);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Gagal memuat data"));
  }, [nim, nama, navigate]);

  const matkulGroups = useMemo(() => {
    if (!data) return [];
    const map = new Map<number, { matkul: Kelas["matkul"]; kelas: Kelas[] }>();
    for (const k of data.kelas) {
      const entry = map.get(k.matkul.id);
      if (entry) entry.kelas.push(k);
      else map.set(k.matkul.id, { matkul: k.matkul, kelas: [k] });
    }
    return Array.from(map.values());
  }, [data]);

  const remaining = useMemo(() => {
    if (!data) return 0;
    const sudah = new Set(data.sudah_dinilai_kelas_ids);
    return data.kelas.filter((k) => !sudah.has(k.id)).length;
  }, [data]);

  const updateScore = (kelasId: number, key: string, value: number | string) => {
    setForm((prev) => ({
      ...prev,
      [kelasId]: { ...(prev[kelasId] ?? {}), [key]: value },
    }));
  };

  const handleSubmit = async () => {
    if (!data) return;
    setSubmitError(null);
    const items: PenilaianItem[] = [];
    const missing: string[] = [];
    for (const k of data.kelas) {
      if (data.sudah_dinilai_kelas_ids.includes(k.id)) continue;
      const entry = form[k.id] ?? {};
      const allKd = KD_DESCRIPTIONS.every((d) => typeof entry[d.key] === "number");
      if (!allKd) {
        missing.push(`${k.matkul.kode} - ${k.dosen.nama}`);
        continue;
      }
      items.push({
        nim: data.mahasiswa.nim,
        kelas_id: k.id,
        kd1: entry.kd1 as number,
        kd2: entry.kd2 as number,
        kd3: entry.kd3 as number,
        kd4: entry.kd4 as number,
        kd5: entry.kd5 as number,
        kd6: entry.kd6 as number,
        kd7: entry.kd7 as number,
        saran: (entry.saran as string | undefined) ?? null,
      });
    }
    if (missing.length > 0) {
      setSubmitError(
        `Masih ada dosen yang belum dinilai: ${missing.slice(0, 3).join("; ")}${missing.length > 3 ? `, +${missing.length - 3} lainnya` : ""}`,
      );
      return;
    }
    if (items.length === 0) {
      setSubmitError("Tidak ada penilaian untuk dikirim.");
      return;
    }
    setSubmitting(true);
    try {
      await api.submitPenilaian({ nim: data.mahasiswa.nim, items });
      setSubmitSuccess(true);
      const refreshed = await api.loginMahasiswa(nim, nama);
      setData(refreshed);
      setForm({});
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Gagal mengirim penilaian");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <div className="max-w-md mx-auto bg-white border border-rose-200 rounded-xl p-6 text-rose-700">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <div>
            <p className="font-medium">Gagal memuat data</p>
            <p className="text-sm text-rose-600 mt-1">{loadError}</p>
            <button
              onClick={() => navigate("/")}
              className="mt-3 text-sm underline"
            >
              Kembali ke login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center text-slate-500 py-12">Memuat data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs text-slate-500">Mahasiswa</p>
            <p className="font-semibold">{data.mahasiswa.nama}</p>
            <p className="text-xs text-slate-500 mt-1">
              {data.mahasiswa.nim} &middot; {data.prodi.nama} &middot; Angkatan {data.mahasiswa.angkatan ?? "-"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Periode: <span className="font-medium">{data.periode.semester} {data.periode.tahun_akademik}</span>
            </p>
          </div>
          <button
            onClick={onLogout}
            className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
          >
            <LogOut size={14} /> Keluar
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Total Dosen" value={String(data.kelas.length)} />
          <Stat label="Sudah Dinilai" value={String(data.sudah_dinilai_kelas_ids.length)} tone="emerald" />
          <Stat label="Belum Dinilai" value={String(remaining)} tone={remaining > 0 ? "amber" : "slate"} />
        </div>
      </div>

      {submitSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 flex items-start gap-2">
          <CheckCircle2 size={18} className="mt-0.5" />
          <div className="text-sm">
            Penilaian Anda telah tersimpan. Terima kasih atas partisipasinya!
          </div>
        </div>
      )}

      {remaining === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-600">
          <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={32} />
          <p className="font-medium">Semua dosen di kelas Anda sudah dinilai.</p>
          <p className="text-sm text-slate-500 mt-1">Terima kasih atas partisipasinya!</p>
        </div>
      ) : (
        <>
          {matkulGroups.map(({ matkul, kelas }) => {
            const isOpen = expanded[matkul.id] !== false;
            const dosenBelum = kelas.filter((k) => !data.sudah_dinilai_kelas_ids.includes(k.id));
            if (dosenBelum.length === 0) return null;
            return (
              <div key={matkul.id} className="bg-white border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setExpanded((p) => ({ ...p, [matkul.id]: !isOpen }))}
                  className="w-full flex items-center justify-between px-4 sm:px-5 py-3 text-left"
                >
                  <div>
                    <p className="text-xs text-slate-500">{matkul.kode}</p>
                    <p className="font-semibold text-sm sm:text-base">{matkul.nama}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {dosenBelum.length} dosen menunggu penilaian
                    </p>
                  </div>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100">
                    {dosenBelum.map((k) => (
                      <DosenSection
                        key={k.id}
                        kelas={k}
                        value={form[k.id] ?? {}}
                        onChange={(key, v) => updateScore(k.id, key, v)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {submitError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 flex items-start gap-2 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl px-4 py-3 flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
          >
            <Save size={18} />
            {submitting ? "Mengirim..." : "Kirim Semua Penilaian"}
          </button>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone = "indigo" }: { label: string; value: string; tone?: string }) {
  const tones: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-50 text-slate-700",
  };
  return (
    <div className={`rounded-lg px-3 py-2 ${tones[tone] ?? tones.indigo}`}>
      <p className="text-xs">{label}</p>
      <p className="text-xl font-semibold leading-tight">{value}</p>
    </div>
  );
}

function DosenSection({
  kelas,
  value,
  onChange,
}: {
  kelas: Kelas;
  value: Partial<PenilaianItem>;
  onChange: (key: string, value: number | string) => void;
}) {
  return (
    <div className="px-4 sm:px-5 py-4">
      <div className="mb-3">
        <p className="text-xs text-slate-500">Dosen Pengampu</p>
        <p className="font-semibold">{kelas.dosen.nama}</p>
      </div>
      <div className="space-y-4">
        {KD_DESCRIPTIONS.map((kd) => (
          <div key={kd.key}>
            <p className="text-sm text-slate-700 mb-1.5">
              <span className="font-medium">{kd.key.toUpperCase()}</span> &middot; {kd.label}
            </p>
            <ScoreInput
              name={kd.label}
              value={(value[kd.key] as number) ?? 0}
              onChange={(v) => onChange(kd.key, v)}
            />
          </div>
        ))}
        <div>
          <label className="text-sm text-slate-700 mb-1.5 block">
            Saran / Masukan <span className="text-slate-400">(opsional)</span>
          </label>
          <textarea
            value={(value.saran as string) ?? ""}
            onChange={(e) => onChange("saran", e.target.value)}
            rows={2}
            placeholder="Tuliskan saran membangun untuk dosen ini..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>
    </div>
  );
}
