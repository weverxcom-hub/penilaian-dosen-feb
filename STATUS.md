# Status Proyek — Penilaian Kinerja Dosen FEB UNIGA

> Catatan progres terakhir untuk siapa pun yang melanjutkan proyek ini.
> Update terakhir: **25 Mei 2026**

---

## 1. Ringkasan

Aplikasi web pengganti file Excel manual untuk penilaian kinerja dosen oleh mahasiswa **Fakultas Ekonomi & Bisnis Universitas Garut (UNIGA)**.

3 prodi: **Akuntansi (AKT)**, **Manajemen (MNJ)**, **Ekonomi Pembangunan (EKP)**.
7 indikator: **KD-1 s/d KD-7**, skala **1–4**, dengan kolom saran opsional.

Stack: **FastAPI + SQLite** (backend) · **Vite + React + TypeScript + Tailwind** (frontend) · **openpyxl** (export Excel) · **react-i18next** (ID/EN).

---

## 2. URL Live

| Komponen | URL | Hosting |
| --- | --- | --- |
| Frontend (production) | https://frontend-delta-livid-25.vercel.app | Vercel |
| Backend (production) | https://app-lfacsvll.fly.dev | Fly.io |
| Healthcheck backend | https://app-lfacsvll.fly.dev/healthz | — |
| Repo GitHub | https://github.com/weverxcom-hub/penilaian-dosen-feb | — |
| PR #1 (semua perubahan MVP) | https://github.com/weverxcom-hub/penilaian-dosen-feb/pull/1 | — |

Backend DB: SQLite di `/data/app.db` pada **Fly.io persistent volume (1 GB)**. Data bertahan lintas restart/deploy.

---

## 3. Fitur yang Sudah Selesai

### 3.1 Sisi Mahasiswa
- [x] Login dengan **NIM + nama** (validasi ringan, tidak case-sensitive)
- [x] Daftar matkul × dosen yang bisa dinilai (dari **pengampuan** periode aktif)
- [x] Form 7 KD skala 1–4 + saran (free text) per dosen
- [x] **1 NIM = 1 submit per kelas** (UNIQUE constraint di DB)
- [x] Halaman terima kasih setelah submit
- [x] **Bilingual ID/EN** dengan toggle di header
- [x] **Mobile-first responsive** (verified di 400px–1440px)
- [x] Link ke halaman **Panduan** dari login page

### 3.2 Sisi Admin
- [x] Login dengan password (ENV `ADMIN_PASSWORD`)
- [x] **Dashboard statistik:** total mahasiswa, sudah/belum mengisi, total penilaian, progress bar
- [x] **3 tab rekap penilaian:**
  - Rekap per Matkul–Dosen (kolom KD-1..7, RATA-2, JML, SARAN)
  - Rekap per Dosen (agregat seluruh matkul)
  - Detail Responden (per response)
- [x] **Filter prodi** (Akuntansi / Manajemen / Ekopembangunan / Semua)
- [x] **Export `.xlsx`:**
  - Rekap (layout sesuai file asli, 1 sheet per prodi)
  - Raw responses
  - Per-mahasiswa export
- [x] **Buka / tutup periode** (lock submit baru kapan saja)
- [x] **Master Data CRUD** (di tab "Master Data" admin dashboard):
  - **Mahasiswa** — add, edit, delete, **import CSV bulk** (kolom: `nim,nama,prodi_kode,angkatan`; prodi_kode = `AKT`/`MNJ`/`EKP`)
  - **Dosen** — add, edit, delete (NIDN opsional)
  - **Mata Kuliah** — add, edit, delete
  - **Pengampuan** (kelas) — pairing Matkul × Dosen di periode aktif. Mahasiswa hanya bisa nilai dosen yang terdaftar di sini
- [x] **"Simpan & Tambah Lagi"** di semua form create (Mahasiswa/Dosen/Matkul/Pengampuan):
  - Save record + reset field input + modal tetap terbuka
  - Pilihan **Prodi dipertahankan** (untuk bulk input prodi yang sama)
  - Pengampuan: Prodi + Matkul dipertahankan, hanya Dosen yang reset
- [x] Validasi HTML5 `required` masih aktif — minimum field tetap divalidasi sebelum submit

### 3.3 Halaman Panduan
- [x] **2 tab:** "Untuk Mahasiswa" & "Untuk Admin/Prodi"
- [x] Detail lengkap: cara login, baca daftar matkul/dosen, isi 7 KD, etika, FAQ, export Excel, buka/tutup periode, keamanan
- [x] Bilingual ID/EN
- [x] Linked dari header nav + kedua halaman login

### 3.4 Infrastruktur
- [x] **CORS** dikonfigurasi untuk allow origin Vercel
- [x] **Bearer token auth** untuk admin endpoints (HMAC-SHA256 dari `ADMIN_PASSWORD` + salt)
- [x] **CSRF-safe** via Bearer header (no cookie auth)
- [x] **Auto-seed** master data dummy saat first run (14 mahasiswa, 16 dosen, 24 matkul, 16 kelas)
- [x] **Vercel auto-deploy from GitHub** — fixed (rootDirectory di-set ke `frontend/`)
- [x] **Persistent SQLite** via Fly.io volume di `/data/app.db`
- [x] **Logo UNIGA** + nama "Fakultas Ekonomi dan Bisnis · UNIGA Malang" di header

---

## 4. Arsitektur

### 4.1 Struktur Folder

```
penilaian-dosen-feb/
├── backend/                          # FastAPI app
│   ├── app/
│   │   ├── main.py                   # FastAPI instance + CORS + lifespan
│   │   ├── auth.py                   # Admin bearer token (HMAC-SHA256)
│   │   ├── db.py                     # SQLAlchemy engine + session
│   │   ├── models.py                 # ORM models
│   │   ├── schemas.py                # Pydantic request/response schemas
│   │   ├── seed.py                   # Dummy data (14 mhs, 16 dsn, 24 mtkul)
│   │   ├── excel_export.py           # openpyxl export builders
│   │   └── routers/
│   │       ├── public.py             # /api/public/* (login mahasiswa, submit penilaian)
│   │       └── admin.py              # /api/admin/* (CRUD, rekap, export)
│   ├── pyproject.toml                # Poetry deps
│   └── Dockerfile                    # Untuk Fly.io
│
├── frontend/                         # Vite React TS
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                   # Routes (react-router-dom)
│   │   ├── i18n/
│   │   │   ├── index.ts              # react-i18next init
│   │   │   └── locales/
│   │   │       ├── id.ts             # Indonesian (default)
│   │   │       └── en.ts             # English
│   │   ├── lib/
│   │   │   └── api.ts                # API client (fetch wrappers)
│   │   ├── components/
│   │   │   ├── Layout.tsx            # Header + footer
│   │   │   ├── LanguageSwitcher.tsx
│   │   │   └── ScoreInput.tsx        # 1–4 score buttons untuk form
│   │   └── pages/
│   │       ├── MahasiswaLogin.tsx
│   │       ├── MahasiswaForm.tsx     # Form penilaian
│   │       ├── AdminLogin.tsx
│   │       ├── AdminDashboard.tsx    # Stats + section toggle (Rekap/Master)
│   │       ├── admin/
│   │       │   └── MasterDataPanel.tsx  # Tabs untuk CRUD master data
│   │       └── Panduan.tsx           # Halaman panduan ID/EN
│   ├── public/
│   │   └── logo-uniga.png            # Logo kampus
│   ├── vercel.json                   # buildCommand, installCommand, framework=vite
│   └── package.json
│
├── README.md                         # Quickstart developer
├── STATUS.md                         # File ini
└── .gitignore
```

### 4.2 Model Database

```
Prodi (id, kode, nama)
Periode (id, tahun, semester, is_open)        ← aktif: 2025/2026 Genap
Mahasiswa (id, nim, nama, prodi_id, angkatan)
Dosen (id, nidn, nama, prodi_id)
Matkul (id, kode, nama, prodi_id)
Kelas (id, matkul_id, dosen_id, periode_id)   ← unique (matkul, dosen, periode)
Response (id, kelas_id, mahasiswa_id, kd1..kd7, saran, created_at)
                                              ← unique (kelas, mahasiswa)
```

### 4.3 Endpoint Penting

**Public** (`/api/public`)
- `POST /login` → validasi NIM + nama, return data mahasiswa
- `GET /kelas/{mahasiswa_id}` → daftar kelas yang bisa dinilai (belum diisi mahasiswa ini)
- `POST /response` → submit penilaian (atomic per kelas)

**Admin** (`/api/admin`) — semua butuh `Authorization: Bearer <token>`
- `POST /login` → tukar password jadi token (HMAC-SHA256)
- `GET /stats` → dashboard stats
- `GET /rekap` `GET /rekap-dosen` `GET /responses` → 3 tab rekap
- `GET /export/rekap.xlsx` `GET /export/raw.xlsx` `GET /export/mahasiswa/{nim}.xlsx`
- `POST /periode/toggle` → buka/tutup
- `GET|POST|PUT|DELETE /mahasiswa` + `POST /mahasiswa/import-csv` → CRUD + bulk
- `GET|POST|PUT|DELETE /dosen` → CRUD
- `GET|POST|PUT|DELETE /matkul` → CRUD
- `GET|POST|DELETE /kelas` → CRUD pengampuan (edit jarang dibutuhkan, jadi tidak ada PUT)

---

## 5. Kredensial & Akun Demo

> **Jangan commit kredensial nyata.** Semua nilai sensitif disimpan sebagai env var di Fly.io / Vercel.

| Aktor | Cara login | Notes |
| --- | --- | --- |
| Mahasiswa (seed) | NIM `2512001001..05` (AKT), `2512002001..05` (MNJ), `2512003001..04` (EKP) | Daftar lengkap di `backend/app/seed.py`. Nama harus persis (case-insensitive). |
| Admin | Password = nilai env `ADMIN_PASSWORD` di Fly.io | Sudah di-set oleh user via secret prompt saat first deploy. Default `admin123` ditolak di production. |

---

## 6. Variabel Lingkungan

**Backend (Fly.io)**
- `ADMIN_PASSWORD` — wajib di production
- `ADMIN_TOKEN_SALT` — default `feb-penilaian-dosen` (boleh diganti, tapi semua token aktif jadi invalid)
- `DB_PATH` — default `/data/app.db` (Fly.io volume)
- `DEFAULT_TAHUN` `DEFAULT_SEMESTER` — default `2025/2026` / `Genap`

**Frontend (Vercel)**
- `VITE_API_URL` — di-set ke `https://app-lfacsvll.fly.dev` di Vercel env

---

## 7. CI / CD

- **Backend → Fly.io:** manual via `fly deploy` (atau Devin yang handle saat ada perubahan backend)
- **Frontend → Vercel:** auto-deploy dari GitHub setiap push ke branch
  - Project ID Vercel: `prj_A7oYSahJm3HPi32B2arZu5gteAYr`
  - rootDirectory = `frontend`
  - framework = `vite`
  - install/build dari `frontend/vercel.json`

GitHub Actions belum ada — tidak ada lint/test gate otomatis di PR. Local lint command: `(cd frontend && npm run lint)`.

---

## 8. Known Limitations / TODO Backlog

### Belum diimplementasi
- [ ] **Google Sheets sync** — fase 2, butuh setup Service Account
- [ ] **Multi-periode UI** — saat ini cuma satu periode aktif (2025/2026 Genap). Kalau mau histori per semester, perlu UI untuk switch periode aktif di admin
- [ ] **Edit/delete Response** dari admin (kalau ada salah submit dari mahasiswa). Saat ini cuma view-only di "Detail Responden"
- [ ] **Edit Pengampuan** — saat ini hanya add/delete. Kalau mau ubah dosen/matkul, harus delete + add ulang
- [ ] **Audit log** untuk perubahan master data (siapa edit apa kapan)
- [ ] **GitHub Actions CI** — minimal lint + typecheck + build di PR
- [ ] **Test suite** — baik unit (backend) maupun e2e (Playwright)
- [ ] **Notification email** ke mahasiswa untuk reminder isi penilaian (opsional)
- [ ] **Rate limiting** di endpoint public (untuk anti-spam submit)
- [ ] **2FA / SSO admin** — saat ini cuma single password
- [ ] **Backup otomatis** SQLite ke S3/Drive

### Bug / kekurangan yang diketahui
- **Delete cascade:** kalau delete Dosen yang masih punya Kelas, atau Matkul yang masih punya Kelas, backend reject dengan 400. UX-nya pesan errornya generic — bisa di-improve dengan pesan spesifik ("hapus pengampuan dulu sebelum hapus dosen").
- **Form delete mahasiswa:** kalau mahasiswa sudah punya Response, delete akan gagal (FK constraint). Sama, butuh pesan error yang lebih jelas.

---

## 9. Cara Melanjutkan Proyek (Onboarding)

1. **Clone:**
   ```bash
   git clone https://github.com/weverxcom-hub/penilaian-dosen-feb.git
   cd penilaian-dosen-feb
   ```

2. **Backend (Python 3.11+):**
   ```bash
   cd backend
   poetry install
   echo "ADMIN_PASSWORD=admin123" > .env       # ganti utk production
   poetry run fastapi dev app/main.py --host 0.0.0.0 --port 8000
   ```
   First run akan auto-seed data dummy. DB lokal di `backend/app/app.db`.

3. **Frontend (Node 20+):**
   ```bash
   cd frontend
   npm install
   echo "VITE_API_URL=http://localhost:8000" > .env
   npm run dev
   ```
   Buka http://localhost:5173.

4. **Lint + build:**
   ```bash
   (cd frontend && npm run lint && npm run build)
   ```

5. **Deploy:**
   - Backend: `fly deploy` dari folder `backend/` (sudah ada `fly.toml` + `Dockerfile`)
   - Frontend: push ke branch — Vercel auto-deploy. Atau manual: `(cd frontend && vercel deploy --prod)`

6. **Devin environment blueprint** sudah di-set di Devin settings — session berikutnya otomatis install deps.

---

## 10. Commit History (PR #1)

PR #1 merangkum 6 commit utama:

1. `4bb6399` Initial commit: backend + frontend skeleton + seed data
2. `e49f0c9` Load `.env` via python-dotenv untuk `ADMIN_PASSWORD` di production
3. `17248b4` Logo UNIGA + responsive header + Vercel deploy config
4. `525d9e2` Bilingual (ID/EN) support + halaman Panduan
5. `f8d2503` Admin CRUD: Mahasiswa / Dosen / Matkul / Pengampuan + CSV import
6. `0c2828a` "Simpan & tambah lagi" untuk bulk input master data
7. `1c84260` (CI) trigger Vercel auto-deploy after setting rootDirectory=frontend

---

## 11. Kontak / Owner

- Repo owner: `weverxcom-hub` (org)
- Email maintainer: `weverxcom+1@gmail.com`
- Project: Fakultas Ekonomi & Bisnis, Universitas Garut Malang

---

_Catatan ini akan di-update setiap kali ada perubahan signifikan. Kalau Mas / kontributor melanjutkan kerjaan, **tolong perbarui section 3, 8, dan 10** supaya state proyek tetap akurat._
