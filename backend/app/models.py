"""SQLAlchemy ORM models for the penilaian dosen platform."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Prodi(Base):
    __tablename__ = "prodi"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    kode: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    nama: Mapped[str] = mapped_column(String(120), nullable=False)

    dosen: Mapped[list["Dosen"]] = relationship(back_populates="prodi")
    matkul: Mapped[list["Matkul"]] = relationship(back_populates="prodi")
    mahasiswa: Mapped[list["Mahasiswa"]] = relationship(back_populates="prodi")


class Dosen(Base):
    __tablename__ = "dosen"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nidn: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    nama: Mapped[str] = mapped_column(String(160), nullable=False)
    prodi_id: Mapped[int] = mapped_column(ForeignKey("prodi.id"), nullable=False)

    prodi: Mapped[Prodi] = relationship(back_populates="dosen")
    kelas: Mapped[list["Kelas"]] = relationship(back_populates="dosen")


class Matkul(Base):
    __tablename__ = "matkul"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    kode: Mapped[str] = mapped_column(String(40), nullable=False)
    nama: Mapped[str] = mapped_column(String(200), nullable=False)
    prodi_id: Mapped[int] = mapped_column(ForeignKey("prodi.id"), nullable=False)

    prodi: Mapped[Prodi] = relationship(back_populates="matkul")
    kelas: Mapped[list["Kelas"]] = relationship(back_populates="matkul")

    __table_args__ = (UniqueConstraint("kode", "prodi_id", name="uq_matkul_kode_prodi"),)


class Periode(Base):
    __tablename__ = "periode"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tahun_akademik: Mapped[str] = mapped_column(String(20), nullable=False)
    semester: Mapped[str] = mapped_column(String(20), nullable=False)
    is_open: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    __table_args__ = (
        UniqueConstraint("tahun_akademik", "semester", name="uq_periode_ta_sem"),
    )

    kelas: Mapped[list["Kelas"]] = relationship(back_populates="periode")


class Kelas(Base):
    """Pengampuan: 1 matkul bisa ada banyak dosen, jadi 1 baris = 1 dosen di 1 matkul di 1 periode."""

    __tablename__ = "kelas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    matkul_id: Mapped[int] = mapped_column(ForeignKey("matkul.id"), nullable=False)
    dosen_id: Mapped[int] = mapped_column(ForeignKey("dosen.id"), nullable=False)
    periode_id: Mapped[int] = mapped_column(ForeignKey("periode.id"), nullable=False)

    matkul: Mapped[Matkul] = relationship(back_populates="kelas")
    dosen: Mapped[Dosen] = relationship(back_populates="kelas")
    periode: Mapped[Periode] = relationship(back_populates="kelas")
    penilaian: Mapped[list["Penilaian"]] = relationship(back_populates="kelas")

    __table_args__ = (
        UniqueConstraint("matkul_id", "dosen_id", "periode_id", name="uq_kelas"),
    )


class Mahasiswa(Base):
    __tablename__ = "mahasiswa"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nim: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    nama: Mapped[str] = mapped_column(String(160), nullable=False)
    prodi_id: Mapped[int] = mapped_column(ForeignKey("prodi.id"), nullable=False)
    angkatan: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)

    prodi: Mapped[Prodi] = relationship(back_populates="mahasiswa")
    penilaian: Mapped[list["Penilaian"]] = relationship(back_populates="mahasiswa")


class Penilaian(Base):
    __tablename__ = "penilaian"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    mahasiswa_id: Mapped[int] = mapped_column(ForeignKey("mahasiswa.id"), nullable=False)
    kelas_id: Mapped[int] = mapped_column(ForeignKey("kelas.id"), nullable=False)
    kd1: Mapped[int] = mapped_column(Integer, nullable=False)
    kd2: Mapped[int] = mapped_column(Integer, nullable=False)
    kd3: Mapped[int] = mapped_column(Integer, nullable=False)
    kd4: Mapped[int] = mapped_column(Integer, nullable=False)
    kd5: Mapped[int] = mapped_column(Integer, nullable=False)
    kd6: Mapped[int] = mapped_column(Integer, nullable=False)
    kd7: Mapped[int] = mapped_column(Integer, nullable=False)
    saran: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    mahasiswa: Mapped[Mahasiswa] = relationship(back_populates="penilaian")
    kelas: Mapped[Kelas] = relationship(back_populates="penilaian")

    __table_args__ = (
        UniqueConstraint("mahasiswa_id", "kelas_id", name="uq_penilaian_mhs_kelas"),
    )
