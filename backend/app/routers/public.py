"""Public endpoints (mahasiswa form)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.db import get_db

router = APIRouter(prefix="/api/public", tags=["public"])


def _get_active_periode(db: Session) -> models.Periode:
    periode = db.query(models.Periode).filter_by(is_open=True).order_by(models.Periode.id.desc()).first()
    if not periode:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tidak ada periode penilaian yang sedang dibuka.",
        )
    return periode


@router.post("/login", response_model=schemas.LoginOutput)
def login_mahasiswa(payload: schemas.LoginInput, db: Session = Depends(get_db)) -> schemas.LoginOutput:
    nim = payload.nim.strip()
    nama = payload.nama.strip()
    mahasiswa = db.query(models.Mahasiswa).filter_by(nim=nim).first()
    if not mahasiswa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NIM tidak ditemukan. Hubungi admin prodi jika data Anda belum terdaftar.",
        )
    if mahasiswa.nama.strip().lower() != nama.lower():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nama tidak cocok dengan NIM yang dimasukkan.",
        )

    periode = _get_active_periode(db)

    kelas_list = (
        db.query(models.Kelas)
        .options(
            joinedload(models.Kelas.matkul),
            joinedload(models.Kelas.dosen),
            joinedload(models.Kelas.periode),
        )
        .join(models.Matkul, models.Kelas.matkul_id == models.Matkul.id)
        .filter(
            models.Kelas.periode_id == periode.id,
            models.Matkul.prodi_id == mahasiswa.prodi_id,
        )
        .order_by(models.Matkul.kode.asc(), models.Kelas.id.asc())
        .all()
    )

    sudah = (
        db.query(models.Penilaian.kelas_id)
        .filter(models.Penilaian.mahasiswa_id == mahasiswa.id)
        .all()
    )
    sudah_ids = [row[0] for row in sudah]

    return schemas.LoginOutput(
        mahasiswa=schemas.MahasiswaOut.model_validate(mahasiswa),
        prodi=schemas.ProdiOut.model_validate(mahasiswa.prodi),
        periode=schemas.PeriodeOut.model_validate(periode),
        kelas=[schemas.KelasOut.model_validate(k) for k in kelas_list],
        sudah_dinilai_kelas_ids=sudah_ids,
    )


@router.post("/penilaian", response_model=list[schemas.PenilaianOut])
def submit_penilaian(
    payload: schemas.PenilaianBatchInput,
    db: Session = Depends(get_db),
) -> list[schemas.PenilaianOut]:
    mahasiswa = db.query(models.Mahasiswa).filter_by(nim=payload.nim.strip()).first()
    if not mahasiswa:
        raise HTTPException(status_code=404, detail="NIM tidak ditemukan.")
    periode = _get_active_periode(db)
    if not periode.is_open:
        raise HTTPException(status_code=400, detail="Periode penilaian sudah ditutup.")

    if not payload.items:
        raise HTTPException(status_code=400, detail="Penilaian kosong.")

    saved: list[models.Penilaian] = []
    for item in payload.items:
        kelas = (
            db.query(models.Kelas)
            .filter_by(id=item.kelas_id, periode_id=periode.id)
            .first()
        )
        if not kelas:
            raise HTTPException(
                status_code=404,
                detail=f"Kelas id {item.kelas_id} tidak ditemukan di periode aktif.",
            )
        if kelas.matkul.prodi_id != mahasiswa.prodi_id:
            raise HTTPException(
                status_code=400,
                detail="Anda hanya dapat menilai dosen di prodi Anda.",
            )
        existing = (
            db.query(models.Penilaian)
            .filter_by(mahasiswa_id=mahasiswa.id, kelas_id=kelas.id)
            .first()
        )
        if existing:
            existing.kd1 = item.kd1
            existing.kd2 = item.kd2
            existing.kd3 = item.kd3
            existing.kd4 = item.kd4
            existing.kd5 = item.kd5
            existing.kd6 = item.kd6
            existing.kd7 = item.kd7
            existing.saran = item.saran
            saved.append(existing)
        else:
            row = models.Penilaian(
                mahasiswa_id=mahasiswa.id,
                kelas_id=kelas.id,
                kd1=item.kd1,
                kd2=item.kd2,
                kd3=item.kd3,
                kd4=item.kd4,
                kd5=item.kd5,
                kd6=item.kd6,
                kd7=item.kd7,
                saran=item.saran,
            )
            db.add(row)
            saved.append(row)

    db.commit()
    for row in saved:
        db.refresh(row)
    return [schemas.PenilaianOut.model_validate(p) for p in saved]
