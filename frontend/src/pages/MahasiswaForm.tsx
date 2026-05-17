import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, LogOut, Save } from "lucide-react";
import { api, ApiError, type Kelas, type LoginResponse, type PenilaianItem } from "@/lib/api";
import { ScoreInput } from "@/components/ScoreInput";

const KD_KEYS: (keyof Omit<PenilaianItem, "nim" | "kelas_id" | "saran">)[] = [
  "kd1",
  "kd2",
  "kd3",
  "kd4",
  "kd5",
  "kd6",
  "kd7",
];

interface Props {
  nim: string;
  nama: string;
  onLogout: () => void;
}

type FormState = Record<number, Partial<PenilaianItem>>;

export function MahasiswaForm({ nim, nama, onLogout }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : t("mahasiswa_form.err_load")));
  }, [nim, nama, navigate, t]);

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
      const allKd = KD_KEYS.every((key) => typeof entry[key] === "number");
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
      const head = missing.slice(0, 3).join("; ");
      const tail =
        missing.length > 3 ? `, ${t("mahasiswa_form.err_more", { count: missing.length - 3 })}` : "";
      setSubmitError(t("mahasiswa_form.err_missing", { names: head + tail }));
      return;
    }
    if (items.length === 0) {
      setSubmitError(t("mahasiswa_form.err_no_items"));
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
      setSubmitError(err instanceof ApiError ? err.message : t("mahasiswa_form.err_send"));
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
            <p className="font-medium">{t("mahasiswa_form.err_load")}</p>
            <p className="text-sm text-rose-600 mt-1">{loadError}</p>
            <button
              onClick={() => navigate("/")}
              className="mt-3 text-sm underline"
            >
              {t("mahasiswa_form.back_to_login")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center text-slate-500 py-12">{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs text-slate-500">{t("mahasiswa_form.label_mahasiswa")}</p>
            <p className="font-semibold">{data.mahasiswa.nama}</p>
            <p className="text-xs text-slate-500 mt-1">
              {data.mahasiswa.nim} &middot; {data.prodi.nama} &middot; {t("mahasiswa_form.angkatan")} {data.mahasiswa.angkatan ?? "-"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {t("mahasiswa_form.periode_label")} <span className="font-medium">{data.periode.semester} {data.periode.tahun_akademik}</span>
            </p>
          </div>
          <button
            onClick={onLogout}
            className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
          >
            <LogOut size={14} /> {t("mahasiswa_form.logout")}
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label={t("mahasiswa_form.stat_total")} value={String(data.kelas.length)} />
          <Stat label={t("mahasiswa_form.stat_done")} value={String(data.sudah_dinilai_kelas_ids.length)} tone="emerald" />
          <Stat label={t("mahasiswa_form.stat_remaining")} value={String(remaining)} tone={remaining > 0 ? "amber" : "slate"} />
        </div>
      </div>

      {submitSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 flex items-start gap-2">
          <CheckCircle2 size={18} className="mt-0.5" />
          <div className="text-sm">{t("mahasiswa_form.success")}</div>
        </div>
      )}

      {remaining === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-600">
          <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={32} />
          <p className="font-medium">{t("mahasiswa_form.all_done_title")}</p>
          <p className="text-sm text-slate-500 mt-1">{t("mahasiswa_form.all_done_desc")}</p>
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
                      {t("mahasiswa_form.dosen_waiting", { count: dosenBelum.length })}
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
            {submitting ? t("common.submitting") : t("mahasiswa_form.cta_submit")}
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
  const { t } = useTranslation();
  return (
    <div className="px-4 sm:px-5 py-4">
      <div className="mb-3">
        <p className="text-xs text-slate-500">{t("mahasiswa_form.dosen_pengampu")}</p>
        <p className="font-semibold">{kelas.dosen.nama}</p>
      </div>
      <div className="space-y-4">
        {KD_KEYS.map((key) => (
          <div key={key}>
            <p className="text-sm text-slate-700 mb-1.5">
              <span className="font-medium">{key.toUpperCase()}</span> &middot; {t(`kd.${key}` as const)}
            </p>
            <ScoreInput
              name={t(`kd.${key}` as const)}
              value={(value[key] as number) ?? 0}
              onChange={(v) => onChange(key, v)}
            />
          </div>
        ))}
        <div>
          <label className="text-sm text-slate-700 mb-1.5 block">
            {t("mahasiswa_form.saran_label")} <span className="text-slate-400">({t("common.optional")})</span>
          </label>
          <textarea
            value={(value.saran as string) ?? ""}
            onChange={(e) => onChange("saran", e.target.value)}
            rows={2}
            placeholder={t("mahasiswa_form.saran_placeholder")}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>
    </div>
  );
}
