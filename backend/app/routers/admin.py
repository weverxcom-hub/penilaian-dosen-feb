"""Admin endpoints for recap and master data management."""
from __future__ import annotations

import csv
import io
from collections import defaultdict
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
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
    q: Optional[str] = Query(default=None, max_length=120),
) -> list[schemas.MahasiswaOut]:
    query = db.query(models.Mahasiswa)
    if prodi_id:
        query = query.filter(models.Mahasiswa.prodi_id == prodi_id)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter((models.Mahasiswa.nim.ilike(like)) | (models.Mahasiswa.nama.ilike(like)))
    rows = query.order_by(models.Mahasiswa.nama).all()
    return [schemas.MahasiswaOut.model_validate(m) for m in rows]


def _ensure_prodi(db: Session, prodi_id: int) -> models.Prodi:
    prodi = db.query(models.Prodi).filter_by(id=prodi_id).first()
    if not prodi:
        raise HTTPException(status_code=400, detail="Prodi tidak ditemukan.")
    return prodi


@router.post(
    "/mahasiswa",
    response_model=schemas.MahasiswaOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def create_mahasiswa(
    payload: schemas.MahasiswaCreate,
    db: Session = Depends(get_db),
) -> schemas.MahasiswaOut:
    _ensure_prodi(db, payload.prodi_id)
    nim = payload.nim.strip()
    if db.query(models.Mahasiswa).filter_by(nim=nim).first():
        raise HTTPException(status_code=409, detail=f"NIM {nim} sudah terdaftar.")
    obj = models.Mahasiswa(
        nim=nim,
        nama=payload.nama.strip(),
        prodi_id=payload.prodi_id,
        angkatan=(payload.angkatan or "").strip() or None,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return schemas.MahasiswaOut.model_validate(obj)


@router.put(
    "/mahasiswa/{mhs_id}",
    response_model=schemas.MahasiswaOut,
    dependencies=[Depends(require_admin)],
)
def update_mahasiswa(
    mhs_id: int,
    payload: schemas.MahasiswaUpdate,
    db: Session = Depends(get_db),
) -> schemas.MahasiswaOut:
    obj = db.query(models.Mahasiswa).filter_by(id=mhs_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Mahasiswa tidak ditemukan.")
    if payload.nim is not None:
        nim = payload.nim.strip()
        if nim != obj.nim and db.query(models.Mahasiswa).filter_by(nim=nim).first():
            raise HTTPException(status_code=409, detail=f"NIM {nim} sudah terdaftar.")
        obj.nim = nim
    if payload.nama is not None:
        obj.nama = payload.nama.strip()
    if payload.prodi_id is not None:
        _ensure_prodi(db, payload.prodi_id)
        obj.prodi_id = payload.prodi_id
    if payload.angkatan is not None:
        obj.angkatan = payload.angkatan.strip() or None
    db.commit()
    db.refresh(obj)
    return schemas.MahasiswaOut.model_validate(obj)


@router.delete("/mahasiswa/{mhs_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_mahasiswa(mhs_id: int, db: Session = Depends(get_db)) -> Response:
    obj = db.query(models.Mahasiswa).filter_by(id=mhs_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Mahasiswa tidak ditemukan.")
    has_penilaian = db.query(models.Penilaian).filter_by(mahasiswa_id=obj.id).first()
    if has_penilaian:
        raise HTTPException(
            status_code=400,
            detail="Mahasiswa sudah memiliki penilaian, tidak bisa dihapus.",
        )
    db.delete(obj)
    db.commit()
    return Response(status_code=204)


@router.post(
    "/mahasiswa/import",
    response_model=schemas.MahasiswaImportResult,
    dependencies=[Depends(require_admin)],
)
async def import_mahasiswa_csv(
    file: UploadFile = File(...),
    update_existing: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> schemas.MahasiswaImportResult:
    """Import mahasiswa from CSV with columns: nim, nama, prodi_kode, angkatan (optional)."""
    raw = await file.read()
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = raw.decode("latin-1")
    reader = csv.DictReader(io.StringIO(text))
    required = {"nim", "nama", "prodi_kode"}
    fieldnames = {(f or "").strip().lower() for f in (reader.fieldnames or [])}
    if not required.issubset(fieldnames):
        raise HTTPException(
            status_code=400,
            detail="CSV harus berisi kolom: nim, nama, prodi_kode (angkatan opsional).",
        )

    prodi_map = {p.kode.upper(): p for p in db.query(models.Prodi).all()}
    created = 0
    updated = 0
    skipped = 0
    errors: list[str] = []

    for line_no, row in enumerate(reader, start=2):
        norm = {(k or "").strip().lower(): (v or "").strip() for k, v in row.items()}
        nim = norm.get("nim", "")
        nama = norm.get("nama", "")
        prodi_kode = norm.get("prodi_kode", "").upper()
        angkatan = norm.get("angkatan") or None
        if not nim or not nama or not prodi_kode:
            skipped += 1
            errors.append(f"Baris {line_no}: kolom wajib kosong.")
            continue
        prodi = prodi_map.get(prodi_kode)
        if not prodi:
            skipped += 1
            errors.append(f"Baris {line_no}: prodi_kode '{prodi_kode}' tidak ditemukan.")
            continue
        existing = db.query(models.Mahasiswa).filter_by(nim=nim).first()
        if existing:
            if update_existing:
                existing.nama = nama
                existing.prodi_id = prodi.id
                existing.angkatan = angkatan
                updated += 1
            else:
                skipped += 1
                errors.append(f"Baris {line_no}: NIM {nim} sudah ada (skipped).")
            continue
        db.add(models.Mahasiswa(nim=nim, nama=nama, prodi_id=prodi.id, angkatan=angkatan))
        created += 1

    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Gagal commit: {e}")
    return schemas.MahasiswaImportResult(
        created=created, updated=updated, skipped=skipped, errors=errors[:50]
    )


@router.get("/dosen", response_model=list[schemas.DosenOut], dependencies=[Depends(require_admin)])
def list_dosen(
    db: Session = Depends(get_db),
    prodi_id: Optional[int] = Query(default=None),
) -> list[schemas.DosenOut]:
    query = db.query(models.Dosen)
    if prodi_id:
        query = query.filter(models.Dosen.prodi_id == prodi_id)
    rows = query.order_by(models.Dosen.nama).all()
    return [schemas.DosenOut.model_validate(d) for d in rows]


@router.post(
    "/dosen",
    response_model=schemas.DosenOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def create_dosen(payload: schemas.DosenCreate, db: Session = Depends(get_db)) -> schemas.DosenOut:
    _ensure_prodi(db, payload.prodi_id)
    nidn = (payload.nidn or "").strip() or None
    if nidn:
        existing = db.query(models.Dosen).filter_by(nidn=nidn).first()
        if existing:
            raise HTTPException(status_code=409, detail=f"NIDN {nidn} sudah terdaftar.")
    obj = models.Dosen(nidn=nidn, nama=payload.nama.strip(), prodi_id=payload.prodi_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return schemas.DosenOut.model_validate(obj)


@router.put(
    "/dosen/{dosen_id}",
    response_model=schemas.DosenOut,
    dependencies=[Depends(require_admin)],
)
def update_dosen(
    dosen_id: int,
    payload: schemas.DosenUpdate,
    db: Session = Depends(get_db),
) -> schemas.DosenOut:
    obj = db.query(models.Dosen).filter_by(id=dosen_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Dosen tidak ditemukan.")
    if payload.nidn is not None:
        nidn = payload.nidn.strip() or None
        if nidn and nidn != obj.nidn:
            if db.query(models.Dosen).filter_by(nidn=nidn).first():
                raise HTTPException(status_code=409, detail=f"NIDN {nidn} sudah terdaftar.")
        obj.nidn = nidn
    if payload.nama is not None:
        obj.nama = payload.nama.strip()
    if payload.prodi_id is not None:
        _ensure_prodi(db, payload.prodi_id)
        obj.prodi_id = payload.prodi_id
    db.commit()
    db.refresh(obj)
    return schemas.DosenOut.model_validate(obj)


@router.delete("/dosen/{dosen_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_dosen(dosen_id: int, db: Session = Depends(get_db)) -> Response:
    obj = db.query(models.Dosen).filter_by(id=dosen_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Dosen tidak ditemukan.")
    if db.query(models.Kelas).filter_by(dosen_id=obj.id).first():
        raise HTTPException(
            status_code=400,
            detail="Dosen masih terhubung ke kelas, hapus pengampuan terlebih dahulu.",
        )
    db.delete(obj)
    db.commit()
    return Response(status_code=204)


@router.get("/matkul", response_model=list[schemas.MatkulOut], dependencies=[Depends(require_admin)])
def list_matkul(
    db: Session = Depends(get_db),
    prodi_id: Optional[int] = Query(default=None),
) -> list[schemas.MatkulOut]:
    query = db.query(models.Matkul)
    if prodi_id:
        query = query.filter(models.Matkul.prodi_id == prodi_id)
    rows = query.order_by(models.Matkul.kode).all()
    return [schemas.MatkulOut.model_validate(m) for m in rows]


@router.post(
    "/matkul",
    response_model=schemas.MatkulOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def create_matkul(payload: schemas.MatkulCreate, db: Session = Depends(get_db)) -> schemas.MatkulOut:
    _ensure_prodi(db, payload.prodi_id)
    kode = payload.kode.strip()
    existing = (
        db.query(models.Matkul)
        .filter_by(kode=kode, prodi_id=payload.prodi_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail=f"Kode '{kode}' sudah ada di prodi ini.")
    obj = models.Matkul(kode=kode, nama=payload.nama.strip(), prodi_id=payload.prodi_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return schemas.MatkulOut.model_validate(obj)


@router.put(
    "/matkul/{matkul_id}",
    response_model=schemas.MatkulOut,
    dependencies=[Depends(require_admin)],
)
def update_matkul(
    matkul_id: int,
    payload: schemas.MatkulUpdate,
    db: Session = Depends(get_db),
) -> schemas.MatkulOut:
    obj = db.query(models.Matkul).filter_by(id=matkul_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Mata kuliah tidak ditemukan.")
    new_kode = payload.kode.strip() if payload.kode is not None else obj.kode
    new_prodi_id = payload.prodi_id if payload.prodi_id is not None else obj.prodi_id
    if payload.kode is not None or payload.prodi_id is not None:
        clash = (
            db.query(models.Matkul)
            .filter(
                models.Matkul.kode == new_kode,
                models.Matkul.prodi_id == new_prodi_id,
                models.Matkul.id != obj.id,
            )
            .first()
        )
        if clash:
            raise HTTPException(status_code=409, detail=f"Kode '{new_kode}' sudah ada di prodi ini.")
    if payload.kode is not None:
        obj.kode = new_kode
    if payload.nama is not None:
        obj.nama = payload.nama.strip()
    if payload.prodi_id is not None:
        _ensure_prodi(db, payload.prodi_id)
        obj.prodi_id = payload.prodi_id
    db.commit()
    db.refresh(obj)
    return schemas.MatkulOut.model_validate(obj)


@router.delete("/matkul/{matkul_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_matkul(matkul_id: int, db: Session = Depends(get_db)) -> Response:
    obj = db.query(models.Matkul).filter_by(id=matkul_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Mata kuliah tidak ditemukan.")
    if db.query(models.Kelas).filter_by(matkul_id=obj.id).first():
        raise HTTPException(
            status_code=400,
            detail="Mata kuliah masih punya pengampu, hapus pengampuan terlebih dahulu.",
        )
    db.delete(obj)
    db.commit()
    return Response(status_code=204)


def _get_active_periode(db: Session) -> models.Periode:
    periode = (
        db.query(models.Periode)
        .filter_by(is_open=True)
        .order_by(models.Periode.id.desc())
        .first()
    )
    if not periode:
        raise HTTPException(status_code=400, detail="Belum ada periode aktif.")
    return periode


@router.get(
    "/kelas",
    response_model=list[schemas.KelasListItem],
    dependencies=[Depends(require_admin)],
)
def list_kelas(
    db: Session = Depends(get_db),
    prodi_id: Optional[int] = Query(default=None),
    periode_id: Optional[int] = Query(default=None),
) -> list[schemas.KelasListItem]:
    if periode_id is None:
        periode = (
            db.query(models.Periode).order_by(models.Periode.id.desc()).first()
        )
        if not periode:
            return []
        periode_id = periode.id
    query = (
        db.query(models.Kelas, models.Matkul, models.Dosen, models.Prodi)
        .join(models.Matkul, models.Kelas.matkul_id == models.Matkul.id)
        .join(models.Dosen, models.Kelas.dosen_id == models.Dosen.id)
        .join(models.Prodi, models.Matkul.prodi_id == models.Prodi.id)
        .filter(models.Kelas.periode_id == periode_id)
    )
    if prodi_id:
        query = query.filter(models.Matkul.prodi_id == prodi_id)
    rows = query.order_by(models.Prodi.kode, models.Matkul.kode, models.Dosen.nama).all()
    return [
        schemas.KelasListItem(
            id=k.id,
            matkul_id=m.id,
            matkul_kode=m.kode,
            matkul_nama=m.nama,
            dosen_id=d.id,
            dosen_nama=d.nama,
            periode_id=k.periode_id,
            prodi_id=p.id,
            prodi_nama=p.nama,
        )
        for (k, m, d, p) in rows
    ]


@router.post(
    "/kelas",
    response_model=schemas.KelasListItem,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def create_kelas(payload: schemas.KelasCreate, db: Session = Depends(get_db)) -> schemas.KelasListItem:
    matkul = db.query(models.Matkul).filter_by(id=payload.matkul_id).first()
    if not matkul:
        raise HTTPException(status_code=400, detail="Mata kuliah tidak ditemukan.")
    dosen = db.query(models.Dosen).filter_by(id=payload.dosen_id).first()
    if not dosen:
        raise HTTPException(status_code=400, detail="Dosen tidak ditemukan.")
    if payload.periode_id:
        periode = db.query(models.Periode).filter_by(id=payload.periode_id).first()
        if not periode:
            raise HTTPException(status_code=400, detail="Periode tidak ditemukan.")
    else:
        periode = _get_active_periode(db)
    existing = (
        db.query(models.Kelas)
        .filter_by(matkul_id=matkul.id, dosen_id=dosen.id, periode_id=periode.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Pengampuan ini sudah terdaftar.")
    obj = models.Kelas(matkul_id=matkul.id, dosen_id=dosen.id, periode_id=periode.id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    prodi = matkul.prodi
    return schemas.KelasListItem(
        id=obj.id,
        matkul_id=matkul.id,
        matkul_kode=matkul.kode,
        matkul_nama=matkul.nama,
        dosen_id=dosen.id,
        dosen_nama=dosen.nama,
        periode_id=obj.periode_id,
        prodi_id=prodi.id,
        prodi_nama=prodi.nama,
    )


@router.delete("/kelas/{kelas_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_kelas(kelas_id: int, db: Session = Depends(get_db)) -> Response:
    obj = db.query(models.Kelas).filter_by(id=kelas_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Pengampuan tidak ditemukan.")
    if db.query(models.Penilaian).filter_by(kelas_id=obj.id).first():
        raise HTTPException(
            status_code=400,
            detail="Pengampuan ini sudah dinilai, tidak bisa dihapus.",
        )
    db.delete(obj)
    db.commit()
    return Response(status_code=204)
