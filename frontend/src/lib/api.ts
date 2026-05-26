const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export type Prodi = { id: number; kode: string; nama: string };
export type Periode = { id: number; tahun_akademik: string; semester: string; is_open: boolean };
export type Mahasiswa = { id: number; nim: string; nama: string; prodi_id: number; angkatan?: string | null };
export type Dosen = { id: number; nidn?: string | null; nama: string; prodi_id: number };
export type Matkul = { id: number; kode: string; nama: string; prodi_id: number };
export type Kelas = { id: number; matkul: Matkul; dosen: Dosen; periode: Periode };

export type LoginResponse = {
  mahasiswa: Mahasiswa;
  prodi: Prodi;
  periode: Periode;
  kelas: Kelas[];
  sudah_dinilai_kelas_ids: number[];
};

export type PenilaianItem = {
  nim: string;
  kelas_id: number;
  kd1: number;
  kd2: number;
  kd3: number;
  kd4: number;
  kd5: number;
  kd6: number;
  kd7: number;
  saran?: string | null;
};

export type PenilaianBatch = {
  nim: string;
  items: PenilaianItem[];
};

export type RekapItem = {
  dosen_id: number;
  dosen_nama: string;
  matkul_id: number;
  matkul_kode: string;
  matkul_nama: string;
  prodi_id: number;
  prodi_nama: string;
  jumlah_responden: number;
  avg_kd1: number;
  avg_kd2: number;
  avg_kd3: number;
  avg_kd4: number;
  avg_kd5: number;
  avg_kd6: number;
  avg_kd7: number;
  rata_total: number;
  saran: string[];
};

export type RekapDosen = {
  dosen_id: number;
  dosen_nama: string;
  prodi_id: number;
  prodi_nama: string;
  jumlah_responden: number;
  avg_kd1: number;
  avg_kd2: number;
  avg_kd3: number;
  avg_kd4: number;
  avg_kd5: number;
  avg_kd6: number;
  avg_kd7: number;
  rata_total: number;
};

export type Stats = {
  total_mahasiswa: number;
  sudah_mengisi: number;
  belum_mengisi: number;
  total_penilaian: number;
  per_prodi: { label: string; value: number }[];
  periode: Periode;
};

export type KelasListItem = {
  id: number;
  matkul_id: number;
  matkul_kode: string;
  matkul_nama: string;
  dosen_id: number;
  dosen_nama: string;
  periode_id: number;
  prodi_id: number;
  prodi_nama: string;
};

export type MahasiswaImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
};

export type RawResponse = {
  id: number;
  timestamp: string;
  nim: string;
  mhs_nama: string;
  prodi: string;
  matkul_kode: string;
  matkul_nama: string;
  dosen_nama: string;
  kd1: number;
  kd2: number;
  kd3: number;
  kd4: number;
  kd5: number;
  kd6: number;
  kd7: number;
  jml: number;
  rata: number;
  saran: string;
};

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = "Terjadi kesalahan";
    try {
      const data = await res.json();
      if (typeof data.detail === "string") detail = data.detail;
      else detail = JSON.stringify(data.detail ?? data);
    } catch {
      detail = await res.text();
    }
    throw new ApiError(detail, res.status);
  }
  return (await res.json()) as T;
}

export const api = {
  loginMahasiswa: (nim: string, nama: string) =>
    request<LoginResponse>("/api/public/login", {
      method: "POST",
      body: JSON.stringify({ nim, nama }),
    }),

  submitPenilaian: (payload: PenilaianBatch) =>
    request<unknown[]>("/api/public/penilaian", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  adminLogin: (password: string) =>
    request<{ token: string }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  adminStats: (token: string) =>
    request<Stats>("/api/admin/stats", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminRekap: (token: string, prodiId?: number) =>
    request<RekapItem[]>(`/api/admin/rekap${prodiId ? `?prodi_id=${prodiId}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminRekapDosen: (token: string, prodiId?: number) =>
    request<RekapDosen[]>(`/api/admin/rekap-dosen${prodiId ? `?prodi_id=${prodiId}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminResponses: (token: string, prodiId?: number) =>
    request<RawResponse[]>(`/api/admin/responses${prodiId ? `?prodi_id=${prodiId}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminListProdi: () => request<Prodi[]>("/api/admin/prodi"),

  adminTogglePeriode: (token: string) =>
    request<{ id: number; is_open: boolean }>("/api/admin/periode/toggle", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminListMahasiswa: (token: string, opts: { prodiId?: number; q?: string } = {}) => {
    const params = new URLSearchParams();
    if (opts.prodiId) params.set("prodi_id", String(opts.prodiId));
    if (opts.q) params.set("q", opts.q);
    const qs = params.toString();
    return request<Mahasiswa[]>(`/api/admin/mahasiswa${qs ? `?${qs}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  adminCreateMahasiswa: (token: string, payload: Omit<Mahasiswa, "id">) =>
    request<Mahasiswa>("/api/admin/mahasiswa", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  adminUpdateMahasiswa: (token: string, id: number, payload: Partial<Omit<Mahasiswa, "id">>) =>
    request<Mahasiswa>(`/api/admin/mahasiswa/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  adminDeleteMahasiswa: (token: string, id: number) =>
    request<unknown>(`/api/admin/mahasiswa/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),
  adminImportMahasiswa: async (
    token: string,
    file: File,
    updateExisting = false,
  ): Promise<MahasiswaImportResult> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(
      `${API_URL}/api/admin/mahasiswa/import?update_existing=${updateExisting ? "true" : "false"}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      },
    );
    if (!res.ok) {
      let detail = "Gagal import";
      try {
        const data = await res.json();
        if (typeof data.detail === "string") detail = data.detail;
        else detail = JSON.stringify(data.detail ?? data);
      } catch {
        detail = await res.text();
      }
      throw new ApiError(detail, res.status);
    }
    return (await res.json()) as MahasiswaImportResult;
  },

  adminListDosen: (token: string, prodiId?: number) =>
    request<Dosen[]>(`/api/admin/dosen${prodiId ? `?prodi_id=${prodiId}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  adminCreateDosen: (token: string, payload: Omit<Dosen, "id">) =>
    request<Dosen>("/api/admin/dosen", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  adminUpdateDosen: (token: string, id: number, payload: Partial<Omit<Dosen, "id">>) =>
    request<Dosen>(`/api/admin/dosen/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  adminDeleteDosen: (token: string, id: number) =>
    request<unknown>(`/api/admin/dosen/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminListMatkul: (token: string, prodiId?: number) =>
    request<Matkul[]>(`/api/admin/matkul${prodiId ? `?prodi_id=${prodiId}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  adminCreateMatkul: (token: string, payload: Omit<Matkul, "id">) =>
    request<Matkul>("/api/admin/matkul", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  adminUpdateMatkul: (token: string, id: number, payload: Partial<Omit<Matkul, "id">>) =>
    request<Matkul>(`/api/admin/matkul/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  adminDeleteMatkul: (token: string, id: number) =>
    request<unknown>(`/api/admin/matkul/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminListKelas: (token: string, prodiId?: number) =>
    request<KelasListItem[]>(`/api/admin/kelas${prodiId ? `?prodi_id=${prodiId}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  adminCreateKelas: (token: string, payload: { matkul_id: number; dosen_id: number }) =>
    request<KelasListItem>("/api/admin/kelas", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  adminDeleteKelas: (token: string, id: number) =>
    request<unknown>(`/api/admin/kelas/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),

  downloadFile: async (path: string, token: string, filename: string): Promise<void> => {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(body || "Gagal mengunduh file");
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

export { ApiError };
