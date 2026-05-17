# Penilaian Kinerja Dosen — Fakultas Ekonomi & Bisnis

Platform digital pengganti file Excel manual untuk pengisian penilaian kinerja dosen oleh mahasiswa FEB (Akuntansi, Manajemen, Ekonomi Pembangunan).

## Stack

- **Backend:** FastAPI + SQLAlchemy + SQLite (persisten via Fly.io volume)
- **Frontend:** Vite + React + TypeScript + Tailwind + Lucide
- **Export:** openpyxl (.xlsx layout sama seperti file asli)
- **Deploy:** Fly.io (backend) + Vercel (frontend)

## Struktur Repo

```
backend/   FastAPI app (poetry)
frontend/  Vite React app (npm)
```

## Quickstart Lokal

### Backend

```bash
cd backend
poetry install
poetry run fastapi dev app/main.py --host 0.0.0.0 --port 8000
```

Backend akan auto-seed master data (3 prodi, 16 dosen, 24 matkul, 14 mahasiswa dummy) saat pertama jalan.

### Frontend

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev
```

Buka http://localhost:5173.

## Login Demo

- **Mahasiswa:** NIM `2512001001` / nama `Aditya Rahman` (Akuntansi). Lihat `backend/app/seed.py` untuk daftar lengkap.
- **Admin:** password dari env `ADMIN_PASSWORD` (default `admin123` saat dev).

## Fitur

### Mahasiswa
- Login NIM + nama
- Form penilaian per matkul → per dosen
- 7 indikator (KD-1 s/d KD-7) skala 1–4
- Saran/masukan opsional
- 1 NIM hanya bisa menilai 1× per kelas per periode

### Admin
- Dashboard statistik (total/sudah/belum mengisi, total penilaian)
- 3 tab rekap: per matkul-dosen, per dosen, detail responden
- Filter per prodi
- Export `.xlsx` rekap (1 sheet per prodi) + raw responses
- Buka/tutup periode penilaian

## Variabel Lingkungan

### Backend
- `ADMIN_PASSWORD` — password dashboard admin (wajib di production)
- `DB_PATH` — path file SQLite. Default `/data/app.db` di Fly.io, lokal di backend dir
- `DEFAULT_TAHUN` / `DEFAULT_SEMESTER` — periode default (default `2025/2026` / `Genap`)

### Frontend
- `VITE_API_URL` — URL backend (mis. `https://penilaian-dosen-feb-backend.fly.dev`)

## Deploy

- Backend: Fly.io dengan volume 1GB mount di `/data` (DB persistent)
- Frontend: Vercel, set `VITE_API_URL` ke URL backend
