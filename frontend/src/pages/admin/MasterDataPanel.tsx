import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  Database,
  Edit,
  GraduationCap,
  Link as LinkIcon,
  Plus,
  Trash2,
  Upload,
  UserCog,
  Users,
  X,
} from "lucide-react";
import {
  api,
  ApiError,
  type Dosen,
  type KelasListItem,
  type Mahasiswa,
  type MahasiswaImportResult,
  type Matkul,
  type Prodi,
} from "@/lib/api";

type Tab = "mahasiswa" | "dosen" | "matkul" | "kelas";

interface Props {
  token: string;
  prodiList: Prodi[];
  onChanged: () => void;
}

export function MasterDataPanel({ token, prodiList, onChanged }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("mahasiswa");
  const [filterProdi, setFilterProdi] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "mahasiswa", label: t("master_data.tab_mahasiswa"), icon: <Users size={14} /> },
    { key: "dosen", label: t("master_data.tab_dosen"), icon: <UserCog size={14} /> },
    { key: "matkul", label: t("master_data.tab_matkul"), icon: <GraduationCap size={14} /> },
    { key: "kelas", label: t("master_data.tab_kelas"), icon: <LinkIcon size={14} /> },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl">
      <div className="px-3 sm:px-4 py-3 border-b border-slate-200 flex items-center gap-2">
        <Database size={16} className="text-indigo-600" />
        <h2 className="font-semibold text-sm sm:text-base">{t("master_data.section_title")}</h2>
      </div>
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => {
              setTab(tb.key);
              setError(null);
            }}
            className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap inline-flex items-center gap-1.5 ${
              tab === tb.key
                ? "text-indigo-700 border-b-2 border-indigo-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tb.icon}
            {tb.label}
          </button>
        ))}
      </div>

      <div className="px-3 sm:px-4 py-2.5 border-b border-slate-100 flex flex-wrap items-center gap-2">
        <label className="text-xs sm:text-sm text-slate-600">{t("admin_dashboard.filter_prodi")}</label>
        <select
          value={filterProdi ?? ""}
          onChange={(e) => setFilterProdi(e.target.value ? Number(e.target.value) : undefined)}
          className="text-xs sm:text-sm border border-slate-300 rounded-md px-2 py-1"
        >
          <option value="">{t("admin_dashboard.all_prodi")}</option>
          {prodiList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mx-3 sm:mx-4 mt-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md px-3 py-2 flex items-start gap-2 text-xs sm:text-sm">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span className="break-words">{error}</span>
          <button className="ml-auto text-rose-400 hover:text-rose-600" onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      <div className="p-3 sm:p-4">
        {tab === "mahasiswa" && (
          <MahasiswaTab
            token={token}
            prodiList={prodiList}
            filterProdi={filterProdi}
            setError={setError}
            onChanged={onChanged}
          />
        )}
        {tab === "dosen" && (
          <DosenTab
            token={token}
            prodiList={prodiList}
            filterProdi={filterProdi}
            setError={setError}
            onChanged={onChanged}
          />
        )}
        {tab === "matkul" && (
          <MatkulTab
            token={token}
            prodiList={prodiList}
            filterProdi={filterProdi}
            setError={setError}
            onChanged={onChanged}
          />
        )}
        {tab === "kelas" && (
          <KelasTab
            token={token}
            prodiList={prodiList}
            filterProdi={filterProdi}
            setError={setError}
            onChanged={onChanged}
          />
        )}
      </div>
    </div>
  );
}

interface SubProps {
  token: string;
  prodiList: Prodi[];
  filterProdi: number | undefined;
  setError: (msg: string | null) => void;
  onChanged: () => void;
}

function MahasiswaTab({ token, prodiList, filterProdi, setError, onChanged }: SubProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Mahasiswa[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState<{ mode: "add" | "edit"; row?: Mahasiswa } | null>(null);
  const [openImport, setOpenImport] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.adminListMahasiswa(token, { prodiId: filterProdi, q: search });
      setRows(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("master_data.err_load"));
    } finally {
      setLoading(false);
    }
  }, [token, filterProdi, search, setError, t]);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = async (row: Mahasiswa) => {
    if (!confirm(t("master_data.confirm_delete"))) return;
    try {
      await api.adminDeleteMahasiswa(token, row.id);
      onChanged();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("master_data.err_delete"));
    }
  };

  const prodiName = (id: number) => prodiList.find((p) => p.id === id)?.nama ?? "-";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("master_data.search_placeholder")}
          className="text-xs sm:text-sm border border-slate-300 rounded-md px-2 py-1.5 flex-1 min-w-[160px]"
        />
        <button
          onClick={() => setOpenImport(true)}
          className="text-xs sm:text-sm border border-slate-300 hover:bg-slate-50 rounded-md px-2.5 py-1.5 inline-flex items-center gap-1.5"
        >
          <Upload size={14} /> {t("master_data.btn_import_csv")}
        </button>
        <button
          onClick={() => setOpenForm({ mode: "add" })}
          className="text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-2.5 py-1.5 inline-flex items-center gap-1.5"
        >
          <Plus size={14} /> {t("master_data.btn_add")}
        </button>
      </div>

      <TableShell loading={loading} empty={!loading && rows.length === 0} emptyText={t("master_data.empty_mahasiswa")}>
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] sm:text-xs">
            <tr>
              <th className="text-left px-3 py-2">{t("master_data.th_nim")}</th>
              <th className="text-left px-3 py-2">{t("master_data.th_nama")}</th>
              <th className="text-left px-3 py-2">{t("master_data.th_prodi")}</th>
              <th className="text-left px-3 py-2">{t("master_data.th_angkatan")}</th>
              <th className="px-3 py-2 text-right">{t("master_data.th_aksi")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-mono">{r.nim}</td>
                <td className="px-3 py-2 font-medium">{r.nama}</td>
                <td className="px-3 py-2 text-slate-600">{prodiName(r.prodi_id)}</td>
                <td className="px-3 py-2 text-slate-500">{r.angkatan ?? "—"}</td>
                <td className="px-3 py-2">
                  <ActionButtons
                    onEdit={() => setOpenForm({ mode: "edit", row: r })}
                    onDelete={() => onDelete(r)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      {openForm && (
        <MahasiswaForm
          token={token}
          prodiList={prodiList}
          initial={openForm.row}
          onClose={() => setOpenForm(null)}
          onSaved={async () => {
            setOpenForm(null);
            onChanged();
            await load();
          }}
          onSavedAndContinue={async () => {
            onChanged();
            await load();
          }}
          setError={setError}
        />
      )}
      {openImport && (
        <ImportMahasiswaModal
          token={token}
          onClose={() => setOpenImport(false)}
          onDone={async () => {
            onChanged();
            await load();
          }}
        />
      )}
    </div>
  );
}

function DosenTab({ token, prodiList, filterProdi, setError, onChanged }: SubProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Dosen[]>([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState<{ mode: "add" | "edit"; row?: Dosen } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.adminListDosen(token, filterProdi);
      setRows(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("master_data.err_load"));
    } finally {
      setLoading(false);
    }
  }, [token, filterProdi, setError, t]);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = async (row: Dosen) => {
    if (!confirm(t("master_data.confirm_delete"))) return;
    try {
      await api.adminDeleteDosen(token, row.id);
      onChanged();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("master_data.err_delete"));
    }
  };

  const prodiName = (id: number) => prodiList.find((p) => p.id === id)?.nama ?? "-";

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() => setOpenForm({ mode: "add" })}
          className="text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-2.5 py-1.5 inline-flex items-center gap-1.5"
        >
          <Plus size={14} /> {t("master_data.btn_add")}
        </button>
      </div>

      <TableShell loading={loading} empty={!loading && rows.length === 0} emptyText={t("master_data.empty_dosen")}>
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] sm:text-xs">
            <tr>
              <th className="text-left px-3 py-2">{t("master_data.th_nidn")}</th>
              <th className="text-left px-3 py-2">{t("master_data.th_nama")}</th>
              <th className="text-left px-3 py-2">{t("master_data.th_prodi")}</th>
              <th className="px-3 py-2 text-right">{t("master_data.th_aksi")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-mono text-slate-500">{r.nidn ?? "—"}</td>
                <td className="px-3 py-2 font-medium">{r.nama}</td>
                <td className="px-3 py-2 text-slate-600">{prodiName(r.prodi_id)}</td>
                <td className="px-3 py-2">
                  <ActionButtons
                    onEdit={() => setOpenForm({ mode: "edit", row: r })}
                    onDelete={() => onDelete(r)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      {openForm && (
        <DosenForm
          token={token}
          prodiList={prodiList}
          initial={openForm.row}
          onClose={() => setOpenForm(null)}
          onSaved={async () => {
            setOpenForm(null);
            onChanged();
            await load();
          }}
          onSavedAndContinue={async () => {
            onChanged();
            await load();
          }}
          setError={setError}
        />
      )}
    </div>
  );
}

function MatkulTab({ token, prodiList, filterProdi, setError, onChanged }: SubProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Matkul[]>([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState<{ mode: "add" | "edit"; row?: Matkul } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.adminListMatkul(token, filterProdi);
      setRows(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("master_data.err_load"));
    } finally {
      setLoading(false);
    }
  }, [token, filterProdi, setError, t]);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = async (row: Matkul) => {
    if (!confirm(t("master_data.confirm_delete"))) return;
    try {
      await api.adminDeleteMatkul(token, row.id);
      onChanged();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("master_data.err_delete"));
    }
  };

  const prodiName = (id: number) => prodiList.find((p) => p.id === id)?.nama ?? "-";

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() => setOpenForm({ mode: "add" })}
          className="text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-2.5 py-1.5 inline-flex items-center gap-1.5"
        >
          <Plus size={14} /> {t("master_data.btn_add")}
        </button>
      </div>

      <TableShell loading={loading} empty={!loading && rows.length === 0} emptyText={t("master_data.empty_matkul")}>
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] sm:text-xs">
            <tr>
              <th className="text-left px-3 py-2">{t("master_data.th_kode")}</th>
              <th className="text-left px-3 py-2">{t("master_data.th_nama")}</th>
              <th className="text-left px-3 py-2">{t("master_data.th_prodi")}</th>
              <th className="px-3 py-2 text-right">{t("master_data.th_aksi")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-mono text-slate-500">{r.kode}</td>
                <td className="px-3 py-2 font-medium">{r.nama}</td>
                <td className="px-3 py-2 text-slate-600">{prodiName(r.prodi_id)}</td>
                <td className="px-3 py-2">
                  <ActionButtons
                    onEdit={() => setOpenForm({ mode: "edit", row: r })}
                    onDelete={() => onDelete(r)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      {openForm && (
        <MatkulForm
          token={token}
          prodiList={prodiList}
          initial={openForm.row}
          onClose={() => setOpenForm(null)}
          onSaved={async () => {
            setOpenForm(null);
            onChanged();
            await load();
          }}
          onSavedAndContinue={async () => {
            onChanged();
            await load();
          }}
          setError={setError}
        />
      )}
    </div>
  );
}

function KelasTab({ token, prodiList, filterProdi, setError, onChanged }: SubProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<KelasListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.adminListKelas(token, filterProdi);
      setRows(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("master_data.err_load"));
    } finally {
      setLoading(false);
    }
  }, [token, filterProdi, setError, t]);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = async (row: KelasListItem) => {
    if (!confirm(t("master_data.confirm_delete"))) return;
    try {
      await api.adminDeleteKelas(token, row.id);
      onChanged();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("master_data.err_delete"));
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
        {t("master_data.pengampuan_hint")}
      </p>
      <div className="flex justify-end">
        <button
          onClick={() => setOpenForm(true)}
          className="text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-2.5 py-1.5 inline-flex items-center gap-1.5"
        >
          <Plus size={14} /> {t("master_data.btn_add")}
        </button>
      </div>

      <TableShell loading={loading} empty={!loading && rows.length === 0} emptyText={t("master_data.empty_kelas")}>
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] sm:text-xs">
            <tr>
              <th className="text-left px-3 py-2">{t("master_data.th_prodi")}</th>
              <th className="text-left px-3 py-2">{t("master_data.th_matkul")}</th>
              <th className="text-left px-3 py-2">{t("master_data.th_dosen")}</th>
              <th className="px-3 py-2 text-right">{t("master_data.th_aksi")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 text-slate-600">{r.prodi_nama}</td>
                <td className="px-3 py-2">
                  <div className="font-mono text-[10px] sm:text-xs text-slate-500">{r.matkul_kode}</div>
                  <div className="font-medium">{r.matkul_nama}</div>
                </td>
                <td className="px-3 py-2 font-medium">{r.dosen_nama}</td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => onDelete(r)}
                    className="text-rose-600 hover:bg-rose-50 inline-flex items-center gap-1 text-xs px-2 py-1 rounded"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      {openForm && (
        <KelasForm
          token={token}
          prodiList={prodiList}
          onClose={() => setOpenForm(false)}
          onSaved={async () => {
            setOpenForm(false);
            onChanged();
            await load();
          }}
          onSavedAndContinue={async () => {
            onChanged();
            await load();
          }}
          setError={setError}
        />
      )}
    </div>
  );
}

function ActionButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-1">
      <button
        onClick={onEdit}
        className="text-indigo-600 hover:bg-indigo-50 inline-flex items-center gap-1 text-xs px-2 py-1 rounded"
      >
        <Edit size={12} />
      </button>
      <button
        onClick={onDelete}
        className="text-rose-600 hover:bg-rose-50 inline-flex items-center gap-1 text-xs px-2 py-1 rounded"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function TableShell({
  loading,
  empty,
  emptyText,
  children,
}: {
  loading: boolean;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  if (loading) {
    return <div className="text-center text-slate-500 py-8 text-sm">{t("common.loading")}</div>;
  }
  if (empty) {
    return <div className="text-center text-slate-500 py-8 text-sm">{emptyText}</div>;
  }
  return <div className="overflow-x-auto border border-slate-200 rounded-md">{children}</div>;
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-3">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function MahasiswaForm({
  token,
  prodiList,
  initial,
  onClose,
  onSaved,
  onSavedAndContinue,
  setError,
}: {
  token: string;
  prodiList: Prodi[];
  initial?: Mahasiswa;
  onClose: () => void;
  onSaved: () => void;
  onSavedAndContinue?: () => void;
  setError: (msg: string | null) => void;
}) {
  const { t } = useTranslation();
  const [nim, setNim] = useState(initial?.nim ?? "");
  const [nama, setNama] = useState(initial?.nama ?? "");
  const [prodiId, setProdiId] = useState<number | "">(initial?.prodi_id ?? "");
  const [angkatan, setAngkatan] = useState(initial?.angkatan ?? "");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prodiId) return;
    const mode = getSubmitMode(e);
    setSaving(true);
    try {
      if (initial) {
        await api.adminUpdateMahasiswa(token, initial.id, {
          nim: nim.trim(),
          nama: nama.trim(),
          prodi_id: prodiId as number,
          angkatan: angkatan.trim() || null,
        });
      } else {
        await api.adminCreateMahasiswa(token, {
          nim: nim.trim(),
          nama: nama.trim(),
          prodi_id: prodiId as number,
          angkatan: angkatan.trim() || null,
        });
      }
      if (mode === "continue" && !initial && onSavedAndContinue) {
        setNim("");
        setNama("");
        setAngkatan("");
        // keep prodiId selected to speed up bulk add
        onSavedAndContinue();
      } else {
        onSaved();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("master_data.err_save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={initial ? t("master_data.edit_mahasiswa") : t("master_data.add_mahasiswa")} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3 text-sm">
        <Field label={t("master_data.field_nim")} required>
          <input
            type="text"
            required
            value={nim}
            onChange={(e) => setNim(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-2 py-1.5"
          />
        </Field>
        <Field label={t("master_data.field_nama")} required>
          <input
            type="text"
            required
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-2 py-1.5"
          />
        </Field>
        <Field label={t("master_data.field_prodi")} required>
          <select
            required
            value={prodiId}
            onChange={(e) => setProdiId(e.target.value ? Number(e.target.value) : "")}
            className="w-full border border-slate-300 rounded-md px-2 py-1.5"
          >
            <option value="">{t("master_data.field_pilih_prodi")}</option>
            {prodiList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
        </Field>
        <Field label={`${t("master_data.field_angkatan")} (${t("common.optional")})`}>
          <input
            type="text"
            value={angkatan}
            onChange={(e) => setAngkatan(e.target.value)}
            placeholder="2025"
            className="w-full border border-slate-300 rounded-md px-2 py-1.5"
          />
        </Field>
        <FormFooter onClose={onClose} saving={saving} showAddAnother={!initial} />
      </form>
    </ModalShell>
  );
}

function DosenForm({
  token,
  prodiList,
  initial,
  onClose,
  onSaved,
  onSavedAndContinue,
  setError,
}: {
  token: string;
  prodiList: Prodi[];
  initial?: Dosen;
  onClose: () => void;
  onSaved: () => void;
  onSavedAndContinue?: () => void;
  setError: (msg: string | null) => void;
}) {
  const { t } = useTranslation();
  const [nidn, setNidn] = useState(initial?.nidn ?? "");
  const [nama, setNama] = useState(initial?.nama ?? "");
  const [prodiId, setProdiId] = useState<number | "">(initial?.prodi_id ?? "");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prodiId) return;
    const mode = getSubmitMode(e);
    setSaving(true);
    try {
      if (initial) {
        await api.adminUpdateDosen(token, initial.id, {
          nidn: nidn.trim() || null,
          nama: nama.trim(),
          prodi_id: prodiId as number,
        });
      } else {
        await api.adminCreateDosen(token, {
          nidn: nidn.trim() || null,
          nama: nama.trim(),
          prodi_id: prodiId as number,
        });
      }
      if (mode === "continue" && !initial && onSavedAndContinue) {
        setNidn("");
        setNama("");
        // keep prodiId selected to speed up bulk add
        onSavedAndContinue();
      } else {
        onSaved();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("master_data.err_save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={initial ? t("master_data.edit_dosen") : t("master_data.add_dosen")} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3 text-sm">
        <Field label={`${t("master_data.field_nidn")} (${t("common.optional")})`}>
          <input
            type="text"
            value={nidn}
            onChange={(e) => setNidn(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-2 py-1.5"
          />
        </Field>
        <Field label={t("master_data.field_nama")} required>
          <input
            type="text"
            required
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-2 py-1.5"
          />
        </Field>
        <Field label={t("master_data.field_prodi")} required>
          <select
            required
            value={prodiId}
            onChange={(e) => setProdiId(e.target.value ? Number(e.target.value) : "")}
            className="w-full border border-slate-300 rounded-md px-2 py-1.5"
          >
            <option value="">{t("master_data.field_pilih_prodi")}</option>
            {prodiList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
        </Field>
        <FormFooter onClose={onClose} saving={saving} showAddAnother={!initial} />
      </form>
    </ModalShell>
  );
}

function MatkulForm({
  token,
  prodiList,
  initial,
  onClose,
  onSaved,
  onSavedAndContinue,
  setError,
}: {
  token: string;
  prodiList: Prodi[];
  initial?: Matkul;
  onClose: () => void;
  onSaved: () => void;
  onSavedAndContinue?: () => void;
  setError: (msg: string | null) => void;
}) {
  const { t } = useTranslation();
  const [kode, setKode] = useState(initial?.kode ?? "");
  const [nama, setNama] = useState(initial?.nama ?? "");
  const [prodiId, setProdiId] = useState<number | "">(initial?.prodi_id ?? "");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prodiId) return;
    const mode = getSubmitMode(e);
    setSaving(true);
    try {
      if (initial) {
        await api.adminUpdateMatkul(token, initial.id, {
          kode: kode.trim(),
          nama: nama.trim(),
          prodi_id: prodiId as number,
        });
      } else {
        await api.adminCreateMatkul(token, {
          kode: kode.trim(),
          nama: nama.trim(),
          prodi_id: prodiId as number,
        });
      }
      if (mode === "continue" && !initial && onSavedAndContinue) {
        setKode("");
        setNama("");
        // keep prodiId selected to speed up bulk add
        onSavedAndContinue();
      } else {
        onSaved();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("master_data.err_save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={initial ? t("master_data.edit_matkul") : t("master_data.add_matkul")} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3 text-sm">
        <Field label={t("master_data.field_kode_matkul")} required>
          <input
            type="text"
            required
            value={kode}
            onChange={(e) => setKode(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-2 py-1.5"
          />
        </Field>
        <Field label={t("master_data.field_nama_matkul")} required>
          <input
            type="text"
            required
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-2 py-1.5"
          />
        </Field>
        <Field label={t("master_data.field_prodi")} required>
          <select
            required
            value={prodiId}
            onChange={(e) => setProdiId(e.target.value ? Number(e.target.value) : "")}
            className="w-full border border-slate-300 rounded-md px-2 py-1.5"
          >
            <option value="">{t("master_data.field_pilih_prodi")}</option>
            {prodiList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
        </Field>
        <FormFooter onClose={onClose} saving={saving} showAddAnother={!initial} />
      </form>
    </ModalShell>
  );
}

function KelasForm({
  token,
  prodiList,
  onClose,
  onSaved,
  onSavedAndContinue,
  setError,
}: {
  token: string;
  prodiList: Prodi[];
  onClose: () => void;
  onSaved: () => void;
  onSavedAndContinue?: () => void;
  setError: (msg: string | null) => void;
}) {
  const { t } = useTranslation();
  const [prodiId, setProdiId] = useState<number | "">("");
  const [matkulList, setMatkulList] = useState<Matkul[]>([]);
  const [dosenList, setDosenList] = useState<Dosen[]>([]);
  const [matkulId, setMatkulId] = useState<number | "">("");
  const [dosenId, setDosenId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!prodiId) {
      setMatkulList([]);
      setDosenList([]);
      return;
    }
    (async () => {
      try {
        const [m, d] = await Promise.all([
          api.adminListMatkul(token, prodiId as number),
          api.adminListDosen(token, prodiId as number),
        ]);
        setMatkulList(m);
        setDosenList(d);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t("master_data.err_load"));
      }
    })();
  }, [prodiId, token, setError, t]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!matkulId || !dosenId) return;
    const mode = getSubmitMode(e);
    setSaving(true);
    try {
      await api.adminCreateKelas(token, {
        matkul_id: matkulId as number,
        dosen_id: dosenId as number,
      });
      if (mode === "continue" && onSavedAndContinue) {
        // keep prodi + matkul selected; reset dosen so user can quickly pair the same matkul with another dosen
        setDosenId("");
        onSavedAndContinue();
      } else {
        onSaved();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("master_data.err_save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={t("master_data.add_kelas")} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3 text-sm">
        <Field label={t("master_data.field_prodi")} required>
          <select
            required
            value={prodiId}
            onChange={(e) => setProdiId(e.target.value ? Number(e.target.value) : "")}
            className="w-full border border-slate-300 rounded-md px-2 py-1.5"
          >
            <option value="">{t("master_data.field_pilih_prodi")}</option>
            {prodiList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("master_data.field_matkul")} required>
          <select
            required
            value={matkulId}
            onChange={(e) => setMatkulId(e.target.value ? Number(e.target.value) : "")}
            disabled={!prodiId}
            className="w-full border border-slate-300 rounded-md px-2 py-1.5 disabled:bg-slate-50"
          >
            <option value="">{t("master_data.field_pilih_matkul")}</option>
            {matkulList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.kode} — {m.nama}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("master_data.field_dosen")} required>
          <select
            required
            value={dosenId}
            onChange={(e) => setDosenId(e.target.value ? Number(e.target.value) : "")}
            disabled={!prodiId}
            className="w-full border border-slate-300 rounded-md px-2 py-1.5 disabled:bg-slate-50"
          >
            <option value="">{t("master_data.field_pilih_dosen")}</option>
            {dosenList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nama}
              </option>
            ))}
          </select>
        </Field>
        <FormFooter onClose={onClose} saving={saving} showAddAnother />
      </form>
    </ModalShell>
  );
}

function ImportMahasiswaModal({
  token,
  onClose,
  onDone,
}: {
  token: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<MahasiswaImportResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErr(t("master_data.err_no_file"));
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const r = await api.adminImportMahasiswa(token, file, updateExisting);
      setResult(r);
      onDone();
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : t("master_data.err_save"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title={t("master_data.import_title")} onClose={onClose}>
      <p className="text-xs text-slate-600 mb-3">{t("master_data.import_format")}</p>
      <form onSubmit={onSubmit} className="space-y-3 text-sm">
        <Field label={t("master_data.import_file_label")} required>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-xs"
          />
        </Field>
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={updateExisting}
            onChange={(e) => setUpdateExisting(e.target.checked)}
          />
          {t("master_data.import_update_existing")}
        </label>

        {err && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-2 py-1.5">{err}</div>
        )}

        {result && (
          <div className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-2 space-y-1">
            <p className="font-medium">{t("master_data.import_result_title")}</p>
            <p>{t("master_data.import_result_created", { n: result.created })}</p>
            <p>{t("master_data.import_result_updated", { n: result.updated })}</p>
            <p>{t("master_data.import_result_skipped", { n: result.skipped })}</p>
            {result.errors.length > 0 && (
              <details className="mt-1">
                <summary className="cursor-pointer text-rose-700">
                  {t("master_data.import_errors_title", { n: result.errors.length })}
                </summary>
                <ul className="list-disc pl-4 mt-1 space-y-0.5 max-h-32 overflow-y-auto">
                  {result.errors.map((e2, i) => (
                    <li key={i}>{e2}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="text-sm border border-slate-300 rounded-md px-3 py-1.5 hover:bg-slate-50"
          >
            {t("common.close")}
          </button>
          <button
            type="submit"
            disabled={busy}
            className="text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-md px-3 py-1.5 inline-flex items-center gap-1.5"
          >
            <Upload size={14} /> {busy ? t("common.submitting") : t("master_data.import_btn_upload")}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-700">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function FormFooter({
  onClose,
  saving,
  showAddAnother = false,
}: {
  onClose: () => void;
  saving: boolean;
  showAddAnother?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onClose}
        className="text-sm border border-slate-300 rounded-md px-3 py-1.5 hover:bg-slate-50"
      >
        {t("common.cancel")}
      </button>
      {showAddAnother && (
        <button
          type="submit"
          data-mode="continue"
          disabled={saving}
          className="text-sm border border-indigo-300 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 rounded-md px-3 py-1.5"
        >
          {saving ? t("common.submitting") : t("master_data.btn_save_and_add")}
        </button>
      )}
      <button
        type="submit"
        data-mode="close"
        disabled={saving}
        className="text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-md px-3 py-1.5"
      >
        {saving ? t("common.submitting") : t("common.save")}
      </button>
    </div>
  );
}

function getSubmitMode(e: React.FormEvent<HTMLFormElement>): "close" | "continue" {
  const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
  return submitter?.dataset.mode === "continue" ? "continue" : "close";
}
