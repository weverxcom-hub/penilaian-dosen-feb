"""Admin endpoints for recap and master data management."""
from __future__ import annotations

import io
from collections import defaultdict
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.auth import require_admin, verify_admin_password
from app.db import get_db
from app.excel_export import (
    build_per_mahasiswa_workbook,
    build_raw_workbook,
    build_rekap_workbook,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/login")
def admin_login(payload: schemas.AdminLogin) -> dict:
    token = verify_admin_password(payload.password)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Password salah.")
    return {"token": token}


@router.get("/stats", response_model=schemas.StatsOut, dependencies=[Depends(require_admin)])
def admin_stats(db: Session = Depends(get_db)) -> schemas.StatsOut:
    periode = (
        db.query(models.Periode)
        .filter_by(is_open=True)
        .order_by(models.Periode.id.desc())
        .first()
    )
    if not periode:
        raise HTTPException(status_code=400, detail="Belum ada periode aktif.")

    total_mhs = db.query(func.count(models.Mahasiswa.id)).scalar() or 0

    # Mahasiswa yang minimal 1x mengisi di periode aktif
    sudah_q = (
        db.query(func.count(func.distinct(models.Penilaian.mahasiswa_id)))
        .join(models.Kelas, models.Penilaian.kelas_id == models.Kelas.id)
        .filter(models.Kelas.periode_id == periode.id)
    )
    sudah_mengisi = sudah_q.scalar() or 0

    total_penilaian = (
        db.query(func.count(models.Penilaian.id))
        .join(models.Kelas, models.Penilaian.kelas_id == models.Kelas.id)
        .filter(models.Kelas.periode_id == periode.id)
        .scalar()
        or 0
    )

    per_prodi_rows = (
        db.query(models.Prodi.nama, func.count(models.Mahasiswa.id))
        .join(models.Mahasiswa, models.Mahasiswa.prodi_id == models.Prodi.id)
        .group_by(models.Prodi.nama)
        .all()
    )
    per_prodi = [schemas.StatItem(label=row[0], value=row[1]) for row in per_prodi_rows]

    return schemas.StatsOut(
        total_mahasiswa=total_mhs,
        sudah_mengisi=sudah_mengisi,
        belum_mengisi=max(total_mhs - sudah_mengisi, 0),
        total_penilaian=total_penilaian,
        per_prodi=per_prodi,
        periode=schemas.PeriodeOut.model_validate(periode),
    )


def _rekap_query(db: Session, periode_id: int, prodi_id: Optional[int] = None):
    q = (
        db.query(models.Penilaian, models.Kelas, models.Matkul, models.Dosen, models.Prodi)
        .join(models.Kelas, models.Penilaian.kelas_id == models.Kelas.id)
        .join(models.Matkul, models.Kelas.matkul_id == models.Matkul.id)
        .join(models.Dosen, models.Kelas.dosen_id == models.Dosen.id)
        .join(models.Prodi, models.Matkul.prodi_id == models.Prodi.id)
        .filter(models.Kelas.periode_id == periode_id)
    )
    if prodi_id:
        q = q.filter(models.Prodi.id == prodi_id)
    return q


def _aggregate_rekap(rows) -> list[dict]:
    groups: dict[tuple[int, int], dict] = {}
    for penilaian, kelas, matkul, dosen, prodi in rows:
        key = (dosen.id, matkul.id)
        g = groups.setdefault(
            key,
            {
                "dosen_id": dosen.id,
                "dosen_nama": dosen.nama,
                "matkul_id": matkul.id,
                "matkul_kode": matkul.kode,
                "matkul_nama": matkul.nama,
                "prodi_id": prodi.id,
                "prodi_nama": prodi.nama,
                "prodi_kode": prodi.kode,
                "kd1": [],
                "kd2": [],
                "kd3": [],
                "kd4": [],
                "kd5": [],
                "kd6": [],
                "kd7": [],
                "saran": [],
            },
        )
        g["kd1"].append(penilaian.kd1)
        g["kd2"].append(penilaian.kd2)
        g["kd3"].append(penilaian.kd3)
        g["kd4"].append(penilaian.kd4)
        g["kd5"].append(penilaian.kd5)
        g["kd6"].append(penilaian.kd6)
        g["kd7"].append(penilaian.kd7)
        if penilaian.saran and penilaian.saran.strip():
            g["saran"].append(penilaian.saran.strip())

    out: list[dict] = []
    for g in groups.values():
        n = len(g["kd1"])
        avgs = {f"avg_kd{i}": (sum(g[f"kd{i}"]) / n if n else 0.0) for i in range(1, 8)}
        rata_total = sum(avgs.values()) / 7 if n else 0.0
        jml_total = sum(avgs.values())
        out.append(
            {
                **g,
                **avgs,
                "jumlah_responden": n,
                "rata_total": rata_total,
                "jml_total": jml_total,
            }
        )
    out.sort(key=lambda r: (r["prodi_nama"], r["dosen_nama"], r["matkul_kode"]))
    return out


@router.get("/rekap", response_model=list[schemas.RekapItem], dependencies=[Depends(require_admin)])
def get_rekap(
    db: Session = Depends(get_db),
    prodi_id: Optional[int] = Query(default=None),
) -> list[schemas.RekapItem]:
    periode = (
        db.query(models.Periode)
        .filter_by(is_open=True)
        .order_by(models.Periode.id.desc())
        .first()
    )
    if not periode:
        raise HTTPException(status_code=400, detail="Belum ada periode aktif.")
    rows = _rekap_query(db, periode.id, prodi_id).all()
    agg = _aggregate_rekap(rows)
    return [schemas.RekapItem(**a) for a in agg]


@router.get("/rekap-dosen", response_model=list[schemas.RekapDosenItem], dependencies=[Depends(require_admin)])
def get_rekap_per_dosen(
    db: Session = Depends(get_db),
    prodi_id: Optional[int] = Query(default=None),
) -> list[schemas.RekapDosenItem]:
    periode = (
        db.query(models.Periode)
        .filter_by(is_open=True)
        .order_by(models.Periode.id.desc())
        .first()
    )
    if not periode:
        raise HTTPException(status_code=400, detail="Belum ada periode aktif.")

    rows = _rekap_query(db, periode.id, prodi_id).all()
    groups: dict[int, dict] = {}
    for penilaian, kelas, matkul, dosen, prodi in rows:
        g = groups.setdefault(
            dosen.id,
            {
                "dosen_id": dosen.id,
                "dosen_nama": dosen.nama,
                "prodi_id": prodi.id,
                "prodi_nama": prodi.nama,
                "kd": {f"kd{i}": [] for i in range(1, 8)},
            },
        )
        for i in range(1, 8):
            g["kd"][f"kd{i}"].append(getattr(penilaian, f"kd{i}"))

    out: list[schemas.RekapDosenItem] = []
    for g in groups.values():
        n = len(g["kd"]["kd1"])
        avgs = {f"avg_kd{i}": (sum(g["kd"][f"kd{i}"]) / n if n else 0.0) for i in range(1, 8)}
        rata_total = sum(avgs.values()) / 7 if n else 0.0
        out.append(
            schemas.RekapDosenItem(
                dosen_id=g["dosen_id"],
                dosen_nama=g["dosen_nama"],
                prodi_id=g["prodi_id"],
                prodi_nama=g["prodi_nama"],
                jumlah_responden=n,
                **avgs,
                rata_total=rata_total,
            )
        )
    out.sort(key=lambda r: (r.prodi_nama, r.dosen_nama))
    return out


@router.get("/responses", dependencies=[Depends(require_admin)])
def list_responses(
    db: Session = Depends(get_db),
    prodi_id: Optional[int] = Query(default=None),
    limit: int = Query(default=500, le=2000),
) -> list[dict]:
    periode = (
        db.query(models.Periode)
        .filter_by(is_open=True)
        .order_by(models.Periode.id.desc())
        .first()
    )
    if not periode:
        return []
    q = (
        db.query(models.Penilaian)
        .options(
            joinedload(models.Penilaian.mahasiswa).joinedload(models.Mahasiswa.prodi),
            joinedload(models.Penilaian.kelas).joinedload(models.Kelas.matkul),
            joinedload(models.Penilaian.kelas).joinedload(models.Kelas.dosen),
        )
        .join(models.Kelas, models.Penilaian.kelas_id == models.Kelas.id)
        .join(models.Matkul, models.Kelas.matkul_id == models.Matkul.id)
        .filter(models.Kelas.periode_id == periode.id)
    )
    if prodi_id:
        q = q.filter(models.Matkul.prodi_id == prodi_id)
    q = q.order_by(models.Penilaian.created_at.desc()).limit(limit)
    out = []
    for p in q.all():
        kd_sum = p.kd1 + p.kd2 + p.kd3 + p.kd4 + p.kd5 + p.kd6 + p.kd7
        out.append(
            {
                "id": p.id,
                "timestamp": p.created_at.isoformat(timespec="seconds"),
                "nim": p.mahasiswa.nim,
                "mhs_nama": p.mahasiswa.nama,
                "prodi": p.mahasiswa.prodi.nama,
                "matkul_kode": p.kelas.matkul.kode,
                "matkul_nama": p.kelas.matkul.nama,
                "dosen_nama": p.kelas.dosen.nama,
                "kd1": p.kd1,
                "kd2": p.kd2,
                "kd3": p.kd3,
                "kd4": p.kd4,
                "kd5": p.kd5,
                "kd6": p.kd6,
                "kd7": p.kd7,
                "jml": kd_sum,
                "rata": round(kd_sum / 7, 2),
                "saran": p.saran or "",
            }
        )
    return out


@router.get("/prodi", response_model=list[schemas.ProdiOut])
def list_prodi(db: Session = Depends(get_db)) -> list[schemas.ProdiOut]:
    rows = db.query(models.Prodi).order_by(models.Prodi.nama).all()
    return [schemas.ProdiOut.model_validate(p) for p in rows]


@router.get("/export/rekap.xlsx", dependencies=[Depends(require_admin)])
def export_rekap_xlsx(
    db: Session = Depends(get_db),
    prodi_id: Optional[int] = Query(default=None),
) -> Response:
    periode = (
        db.query(models.Periode)
        .filter_by(is_open=True)
        .order_by(models.Periode.id.desc())
        .first()
    )
    if not periode:
        raise HTTPException(status_code=400, detail="Belum ada periode aktif.")
    rows = _rekap_query(db, periode.id, prodi_id).all()
    agg = _aggregate_rekap(rows)
    by_prodi: dict[str, list[dict]] = defaultdict(list)
    for r in agg:
        by_prodi[r["prodi_kode"]].append(r)
    data = build_rekap_workbook(periode, dict(by_prodi))
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="rekap-penilaian-dosen-{periode.semester.lower()}-{periode.tahun_akademik.replace("/", "-")}.xlsx"'
        },
    )


@router.get("/export/raw.xlsx", dependencies=[Depends(require_admin)])
def export_raw_xlsx(
    db: Session = Depends(get_db),
    prodi_id: Optional[int] = Query(default=None),
) -> Response:
    rows = list_responses(db=db, prodi_id=prodi_id, limit=2000)
    data = build_raw_workbook(rows)
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="penilaian-raw-responses.xlsx"'},
    )


@router.get("/export/mahasiswa/{nim}.xlsx", dependencies=[Depends(require_admin)])
def export_per_mahasiswa(nim: str, db: Session = Depends(get_db)) -> Response:
    mhs = db.query(models.Mahasiswa).filter_by(nim=nim).first()
    if not mhs:
        raise HTTPException(status_code=404, detail="Mahasiswa tidak ditemukan")
    periode = (
        db.query(models.Periode)
        .filter_by(is_open=True)
        .order_by(models.Periode.id.desc())
        .first()
    )
    if not periode:
        raise HTTPException(status_code=400, detail="Belum ada periode aktif.")
    plist = (
        db.query(models.Penilaian)
        .options(
            joinedload(models.Penilaian.kelas).joinedload(models.Kelas.matkul),
            joinedload(models.Penilaian.kelas).joinedload(models.Kelas.dosen),
        )
        .join(models.Kelas, models.Penilaian.kelas_id == models.Kelas.id)
        .filter(models.Penilaian.mahasiswa_id == mhs.id, models.Kelas.periode_id == periode.id)
        .all()
    )
    data = build_per_mahasiswa_workbook(mhs, plist)
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="penilaian-{nim}.xlsx"'},
    )


@router.post("/periode/toggle", dependencies=[Depends(require_admin)])
def toggle_periode(db: Session = Depends(get_db)) -> dict:
    periode = (
        db.query(models.Periode).order_by(models.Periode.id.desc()).first()
    )
    if not periode:
        raise HTTPException(status_code=404, detail="Belum ada periode.")
    periode.is_open = not periode.is_open
    db.commit()
    return {"id": periode.id, "is_open": periode.is_open}


@router.get("/mahasiswa", response_model=list[schemas.MahasiswaOut], dependencies=[Depends(require_admin)])
def list_mahasiswa(
    db: Session = Depends(get_db),
    prodi_id: Optional[int] = Query(default=None),
) -> list[schemas.MahasiswaOut]:
    q = db.query(models.Mahasiswa)
    if prodi_id:
        q = q.filter(models.Mahasiswa.prodi_id == prodi_id)
    rows = q.order_by(models.Mahasiswa.nama).all()
    return [schemas.MahasiswaOut.model_validate(m) for m in rows]
