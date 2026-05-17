"""Pydantic schemas for request/response bodies."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ProdiOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kode: str
    nama: str


class DosenOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nidn: Optional[str] = None
    nama: str
    prodi_id: int


class MatkulOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kode: str
    nama: str
    prodi_id: int


class PeriodeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tahun_akademik: str
    semester: str
    is_open: bool


class KelasOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    matkul: MatkulOut
    dosen: DosenOut
    periode: PeriodeOut


class MahasiswaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nim: str
    nama: str
    prodi_id: int
    angkatan: Optional[str] = None


class LoginInput(BaseModel):
    nim: str = Field(..., min_length=3, max_length=40)
    nama: str = Field(..., min_length=2, max_length=160)


class LoginOutput(BaseModel):
    mahasiswa: MahasiswaOut
    prodi: ProdiOut
    periode: PeriodeOut
    kelas: list[KelasOut]
    sudah_dinilai_kelas_ids: list[int]


class PenilaianInput(BaseModel):
    nim: str
    kelas_id: int
    kd1: int = Field(..., ge=1, le=4)
    kd2: int = Field(..., ge=1, le=4)
    kd3: int = Field(..., ge=1, le=4)
    kd4: int = Field(..., ge=1, le=4)
    kd5: int = Field(..., ge=1, le=4)
    kd6: int = Field(..., ge=1, le=4)
    kd7: int = Field(..., ge=1, le=4)
    saran: Optional[str] = None


class PenilaianBatchInput(BaseModel):
    nim: str
    items: list[PenilaianInput]


class PenilaianOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mahasiswa_id: int
    kelas_id: int
    kd1: int
    kd2: int
    kd3: int
    kd4: int
    kd5: int
    kd6: int
    kd7: int
    saran: Optional[str] = None
    created_at: datetime


class AdminLogin(BaseModel):
    password: str


class RekapItem(BaseModel):
    dosen_id: int
    dosen_nama: str
    matkul_id: int
    matkul_kode: str
    matkul_nama: str
    prodi_id: int
    prodi_nama: str
    jumlah_responden: int
    avg_kd1: float
    avg_kd2: float
    avg_kd3: float
    avg_kd4: float
    avg_kd5: float
    avg_kd6: float
    avg_kd7: float
    rata_total: float
    saran: list[str]


class RekapDosenItem(BaseModel):
    dosen_id: int
    dosen_nama: str
    prodi_id: int
    prodi_nama: str
    jumlah_responden: int
    avg_kd1: float
    avg_kd2: float
    avg_kd3: float
    avg_kd4: float
    avg_kd5: float
    avg_kd6: float
    avg_kd7: float
    rata_total: float


class StatItem(BaseModel):
    label: str
    value: int


class StatsOut(BaseModel):
    total_mahasiswa: int
    sudah_mengisi: int
    belum_mengisi: int
    total_penilaian: int
    per_prodi: list[StatItem]
    periode: PeriodeOut
