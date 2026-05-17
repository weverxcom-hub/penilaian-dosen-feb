"""Seed the database with dummy master data for FEB (3 prodi)."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app import models


PRODI_LIST = [
    {"kode": "AKT", "nama": "Akuntansi"},
    {"kode": "MNJ", "nama": "Manajemen"},
    {"kode": "EKP", "nama": "Ekonomi Pembangunan"},
]


DOSEN_BY_PRODI: dict[str, list[dict[str, str]]] = {
    "AKT": [
        {"nidn": "0001019001", "nama": "Dr. Andi Wibowo, S.E., M.Ak."},
        {"nidn": "0002029002", "nama": "Sri Lestari, S.E., M.Si., Ak., CA"},
        {"nidn": "0003039003", "nama": "Bambang Hartono, S.E., M.Acc."},
        {"nidn": "0004049004", "nama": "Dewi Anggraini, S.E., M.Ak."},
        {"nidn": "0005059005", "nama": "Hendra Saputra, S.E., M.Si."},
    ],
    "MNJ": [
        {"nidn": "0010019010", "nama": "Dr. Rina Permatasari, S.E., M.M."},
        {"nidn": "0011029011", "nama": "Agus Setiawan, S.E., M.B.A."},
        {"nidn": "0012039012", "nama": "Lina Marlina, S.E., M.M."},
        {"nidn": "0013049013", "nama": "Joko Susilo, S.E., M.M."},
        {"nidn": "0014059014", "nama": "Maya Putri, S.E., M.M., Ph.D."},
    ],
    "EKP": [
        {"nidn": "0020019020", "nama": "Dr. Surya Pratama, S.E., M.E."},
        {"nidn": "0021029021", "nama": "Ratna Dewi, S.E., M.Si."},
        {"nidn": "0022039022", "nama": "Iwan Setiadi, S.E., M.E."},
        {"nidn": "0023049023", "nama": "Fitri Handayani, S.E., M.Si."},
    ],
}


MATKUL_BY_PRODI: dict[str, list[dict[str, str]]] = {
    "AKT": [
        {"kode": "AKT201", "nama": "Akuntansi Keuangan Menengah I"},
        {"kode": "AKT202", "nama": "Akuntansi Biaya"},
        {"kode": "AKT203", "nama": "Sistem Informasi Akuntansi"},
        {"kode": "AKT204", "nama": "Perpajakan"},
        {"kode": "AKT205", "nama": "Auditing I"},
        {"kode": "AKT206", "nama": "Akuntansi Sektor Publik"},
        {"kode": "AKT207", "nama": "Akuntansi Manajemen"},
        {"kode": "AKT208", "nama": "Etika Bisnis dan Profesi"},
    ],
    "MNJ": [
        {"kode": "MNJ201", "nama": "Manajemen Pemasaran"},
        {"kode": "MNJ202", "nama": "Manajemen Sumber Daya Manusia"},
        {"kode": "MNJ203", "nama": "Manajemen Operasi"},
        {"kode": "MNJ204", "nama": "Manajemen Keuangan"},
        {"kode": "MNJ205", "nama": "Manajemen Strategi"},
        {"kode": "MNJ206", "nama": "Perilaku Organisasi"},
        {"kode": "MNJ207", "nama": "Studi Kelayakan Bisnis"},
        {"kode": "MNJ208", "nama": "Kewirausahaan"},
    ],
    "EKP": [
        {"kode": "EKP201", "nama": "Ekonomi Mikro"},
        {"kode": "EKP202", "nama": "Ekonomi Makro"},
        {"kode": "EKP203", "nama": "Ekonometrika"},
        {"kode": "EKP204", "nama": "Ekonomi Pembangunan"},
        {"kode": "EKP205", "nama": "Ekonomi Moneter"},
        {"kode": "EKP206", "nama": "Ekonomi Internasional"},
        {"kode": "EKP207", "nama": "Ekonomi Publik"},
        {"kode": "EKP208", "nama": "Sejarah Pemikiran Ekonomi"},
    ],
}


MAHASISWA_BY_PRODI: dict[str, list[dict[str, str]]] = {
    "AKT": [
        {"nim": "2512001001", "nama": "Aditya Rahman", "angkatan": "2025"},
        {"nim": "2512001002", "nama": "Bella Safira", "angkatan": "2025"},
        {"nim": "2512001003", "nama": "Citra Kirana", "angkatan": "2025"},
        {"nim": "2512001004", "nama": "Dimas Pratama", "angkatan": "2025"},
        {"nim": "2412001005", "nama": "Eka Saputra", "angkatan": "2024"},
    ],
    "MNJ": [
        {"nim": "2512002001", "nama": "Faisal Akbar", "angkatan": "2025"},
        {"nim": "2512002002", "nama": "Gita Lestari", "angkatan": "2025"},
        {"nim": "2512002003", "nama": "Hadi Wijaya", "angkatan": "2025"},
        {"nim": "2512002004", "nama": "Indah Permata", "angkatan": "2025"},
        {"nim": "2412002005", "nama": "Joko Mulyono", "angkatan": "2024"},
    ],
    "EKP": [
        {"nim": "2512003001", "nama": "Kartika Sari", "angkatan": "2025"},
        {"nim": "2512003002", "nama": "Lukman Hakim", "angkatan": "2025"},
        {"nim": "2512003003", "nama": "Mira Astuti", "angkatan": "2025"},
        {"nim": "2412003004", "nama": "Nanda Putri", "angkatan": "2024"},
    ],
}


def _seed_prodi(db: Session) -> dict[str, models.Prodi]:
    out: dict[str, models.Prodi] = {}
    for p in PRODI_LIST:
        obj = db.query(models.Prodi).filter_by(kode=p["kode"]).first()
        if not obj:
            obj = models.Prodi(kode=p["kode"], nama=p["nama"])
            db.add(obj)
            db.flush()
        out[p["kode"]] = obj
    return out


def _seed_dosen(db: Session, prodi_map: dict[str, models.Prodi]) -> dict[str, list[models.Dosen]]:
    out: dict[str, list[models.Dosen]] = {}
    for kode, dosen_list in DOSEN_BY_PRODI.items():
        prodi = prodi_map[kode]
        out[kode] = []
        for d in dosen_list:
            obj = db.query(models.Dosen).filter_by(nidn=d["nidn"]).first()
            if not obj:
                obj = models.Dosen(nidn=d["nidn"], nama=d["nama"], prodi_id=prodi.id)
                db.add(obj)
                db.flush()
            out[kode].append(obj)
    return out


def _seed_matkul(db: Session, prodi_map: dict[str, models.Prodi]) -> dict[str, list[models.Matkul]]:
    out: dict[str, list[models.Matkul]] = {}
    for kode, matkul_list in MATKUL_BY_PRODI.items():
        prodi = prodi_map[kode]
        out[kode] = []
        for m in matkul_list:
            obj = (
                db.query(models.Matkul)
                .filter_by(kode=m["kode"], prodi_id=prodi.id)
                .first()
            )
            if not obj:
                obj = models.Matkul(kode=m["kode"], nama=m["nama"], prodi_id=prodi.id)
                db.add(obj)
                db.flush()
            out[kode].append(obj)
    return out


def _seed_mahasiswa(db: Session, prodi_map: dict[str, models.Prodi]) -> None:
    for kode, mhs_list in MAHASISWA_BY_PRODI.items():
        prodi = prodi_map[kode]
        for m in mhs_list:
            obj = db.query(models.Mahasiswa).filter_by(nim=m["nim"]).first()
            if not obj:
                obj = models.Mahasiswa(
                    nim=m["nim"],
                    nama=m["nama"],
                    prodi_id=prodi.id,
                    angkatan=m.get("angkatan"),
                )
                db.add(obj)


def _seed_periode(db: Session) -> models.Periode:
    obj = (
        db.query(models.Periode)
        .filter_by(tahun_akademik="2025/2026", semester="Genap")
        .first()
    )
    if not obj:
        obj = models.Periode(tahun_akademik="2025/2026", semester="Genap", is_open=True)
        db.add(obj)
        db.flush()
    return obj


def _seed_kelas(
    db: Session,
    matkul_map: dict[str, list[models.Matkul]],
    dosen_map: dict[str, list[models.Dosen]],
    periode: models.Periode,
) -> None:
    """Each matkul gets assigned 2 dosen (rotating from the prodi's dosen list)."""
    for kode in matkul_map:
        matkul_list = matkul_map[kode]
        dosen_list = dosen_map[kode]
        if not dosen_list:
            continue
        for idx, matkul in enumerate(matkul_list):
            d1 = dosen_list[idx % len(dosen_list)]
            d2 = dosen_list[(idx + 1) % len(dosen_list)]
            for dosen in {d1.id: d1, d2.id: d2}.values():
                exists = (
                    db.query(models.Kelas)
                    .filter_by(
                        matkul_id=matkul.id,
                        dosen_id=dosen.id,
                        periode_id=periode.id,
                    )
                    .first()
                )
                if not exists:
                    db.add(
                        models.Kelas(
                            matkul_id=matkul.id,
                            dosen_id=dosen.id,
                            periode_id=periode.id,
                        )
                    )


def seed_all(db: Session) -> None:
    prodi_map = _seed_prodi(db)
    db.flush()
    dosen_map = _seed_dosen(db, prodi_map)
    matkul_map = _seed_matkul(db, prodi_map)
    _seed_mahasiswa(db, prodi_map)
    periode = _seed_periode(db)
    _seed_kelas(db, matkul_map, dosen_map, periode)
    db.commit()
