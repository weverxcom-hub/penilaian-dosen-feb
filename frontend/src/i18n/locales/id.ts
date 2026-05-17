const id = {
  common: {
    loading: "Memuat...",
    submit: "Kirim",
    submitting: "Mengirim...",
    save: "Simpan",
    cancel: "Batal",
    close: "Tutup",
    back: "Kembali",
    optional: "opsional",
    yes: "Ya",
    no: "Tidak",
    refresh: "Refresh",
    error_generic: "Terjadi kesalahan",
  },
  header: {
    app_title: "Penilaian Kinerja Dosen",
    app_subtitle: "Fakultas Ekonomi dan Bisnis · UNIGA Malang",
    nav_mahasiswa: "Mahasiswa",
    nav_admin: "Admin",
    nav_panduan: "Panduan",
    language: "Bahasa",
    language_id: "Indonesia",
    language_en: "English",
  },
  footer: {
    periode: "Periode penilaian 2025/2026",
    privacy: "Data dijaga kerahasiaannya",
  },
  kd: {
    kd1: "Menyampaikan RPS / Kontrak kuliah",
    kd2: "Kesesuaian materi kuliah dengan RPS / Kontrak Kuliah",
    kd3: "Kemampuan menjelaskan materi",
    kd4: "Kemampuan menjawab pertanyaan / berdiskusi",
    kd5: "Kemampuan berinteraksi dengan mahasiswa",
    kd6: "Kedisiplinan / tepat waktu mengajar",
    kd7: "Kerapian pakaian dosen",
  },
  score: {
    "1": "Sangat Kurang",
    "2": "Cukup",
    "3": "Baik",
    "4": "Sangat Baik",
  },
  mahasiswa_login: {
    title: "Login Mahasiswa",
    desc: "Masukkan NIM dan nama lengkap Anda untuk mulai mengisi penilaian kinerja dosen.",
    label_nim: "NIM",
    placeholder_nim: "2512000xxx",
    label_nama: "Nama Lengkap",
    placeholder_nama: "Sesuai data SIAKAD",
    cta_login: "Mulai Mengisi Penilaian",
    notes_title: "Catatan:",
    note_1: "Penilaian ini bersifat anonim untuk dosen yang dinilai.",
    note_2: "Tidak mempengaruhi nilai Anda di setiap matkul.",
    note_3: "Data digunakan untuk evaluasi & perbaikan kinerja dosen.",
    panduan_link: "Baca panduan pengisian terlebih dahulu",
    err_login_failed: "Login gagal",
  },
  mahasiswa_form: {
    label_mahasiswa: "Mahasiswa",
    angkatan: "Angkatan",
    periode_label: "Periode:",
    logout: "Keluar",
    stat_total: "Total Dosen",
    stat_done: "Sudah Dinilai",
    stat_remaining: "Belum Dinilai",
    success: "Penilaian Anda telah tersimpan. Terima kasih atas partisipasinya!",
    all_done_title: "Semua dosen di kelas Anda sudah dinilai.",
    all_done_desc: "Terima kasih atas partisipasinya!",
    dosen_waiting: "{{count}} dosen menunggu penilaian",
    dosen_pengampu: "Dosen Pengampu",
    saran_label: "Saran / Masukan",
    saran_placeholder: "Tuliskan saran membangun untuk dosen ini...",
    cta_submit: "Kirim Semua Penilaian",
    err_missing: "Masih ada dosen yang belum dinilai: {{names}}",
    err_more: "{{count}} lainnya",
    err_no_items: "Tidak ada penilaian untuk dikirim.",
    err_load: "Gagal memuat data",
    err_send: "Gagal mengirim penilaian",
    back_to_login: "Kembali ke login",
  },
  admin_login: {
    title: "Login Admin",
    desc: "Akses dashboard rekap penilaian dan ekspor laporan untuk prodi/fakultas.",
    label_password: "Password Admin",
    cta_login: "Masuk",
    panduan_link: "Baca panduan admin terlebih dahulu",
    err_login_failed: "Login gagal",
  },
  admin_dashboard: {
    title: "Dashboard Admin",
    periode_loading: "Memuat...",
    periode_label: "Periode {{semester}} {{tahun}}",
    open: "Dibuka",
    closed: "Ditutup",
    btn_open_periode: "Buka Periode",
    btn_close_periode: "Tutup Periode",
    btn_refresh: "Refresh",
    btn_logout: "Keluar",
    stat_total_mhs: "Total Mahasiswa",
    stat_filled: "Sudah Mengisi",
    stat_pending: "Belum Mengisi",
    stat_total_penilaian: "Total Penilaian",
    progress_label: "Progress pengisian",
    filter_prodi: "Filter Prodi:",
    all_prodi: "Semua Prodi",
    export_rekap: "Export Rekap (.xlsx)",
    export_raw: "Export Raw Responses",
    tab_rekap: "Rekap per Matkul-Dosen",
    tab_dosen: "Rekap per Dosen",
    tab_responses: "Detail Responden",
    empty: "Belum ada data penilaian.",
    empty_resp: "Belum ada respon mahasiswa.",
    th_prodi: "Prodi",
    th_dosen: "Dosen",
    th_matkul: "Matkul",
    th_n: "N",
    th_avg: "Rata",
    th_saran: "Saran",
    th_waktu: "Waktu",
    th_nim: "NIM",
    th_mahasiswa: "Mahasiswa",
    more_items: "+{{count}} lagi",
    err_load: "Gagal memuat data",
    err_periode: "Gagal mengubah periode",
    err_download: "Gagal mengunduh",
  },
  panduan: {
    title: "Panduan Penggunaan",
    subtitle:
      "Halaman ini menjelaskan cara menggunakan platform Penilaian Kinerja Dosen FEB UNIGA Malang, baik untuk mahasiswa maupun admin prodi/fakultas.",
    tab_mahasiswa: "Untuk Mahasiswa",
    tab_admin: "Untuk Admin / Prodi",

    mhs_intro_title: "Apa itu Penilaian Kinerja Dosen?",
    mhs_intro_body:
      "Penilaian Kinerja Dosen adalah evaluasi rutin yang Anda berikan sebagai mahasiswa terhadap dosen pengampu mata kuliah di semester berjalan. Hasilnya digunakan oleh prodi & fakultas untuk perbaikan mutu pengajaran. Penilaian bersifat anonim untuk dosen — dosen tidak melihat siapa yang memberikan skor tertentu.",

    mhs_step1_title: "Langkah 1 · Login",
    mhs_step1_body:
      "Buka halaman utama, masuk dengan NIM (10 digit) dan nama lengkap sesuai data SIAKAD. Sistem hanya mengizinkan 1 sesi pengisian per NIM per periode.",

    mhs_step2_title: "Langkah 2 · Membaca daftar matkul & dosen",
    mhs_step2_body:
      "Setelah login Anda akan melihat ringkasan: total dosen yang harus dinilai, sudah dinilai, dan belum dinilai. Di bawahnya ada daftar mata kuliah Anda; klik untuk membuka dan melihat dosen pengampunya.",

    mhs_step3_title: "Langkah 3 · Mengisi 7 indikator (KD-1 s/d KD-7)",
    mhs_step3_body:
      "Untuk setiap dosen, beri skor 1–4 pada 7 indikator berikut. Klik kotak skor untuk memilih. Semua 7 indikator wajib diisi sebelum penilaian bisa dikirim.",
    mhs_step3_scale_title: "Skala penilaian:",
    mhs_step3_scale_1: "1 — Sangat Kurang: tidak memenuhi ekspektasi sama sekali",
    mhs_step3_scale_2: "2 — Cukup: memenuhi sebagian, masih perlu perbaikan",
    mhs_step3_scale_3: "3 — Baik: memenuhi ekspektasi dengan baik",
    mhs_step3_scale_4: "4 — Sangat Baik: melebihi ekspektasi, layak dijadikan contoh",
    mhs_step3_kd_title: "Penjelasan tiap indikator:",
    mhs_step3_kd1: "KD-1 · Menyampaikan RPS / Kontrak kuliah — dosen menjelaskan rencana pembelajaran semester di awal.",
    mhs_step3_kd2: "KD-2 · Kesesuaian materi dengan RPS — apa yang diajarkan sesuai yang dijanjikan di RPS.",
    mhs_step3_kd3: "KD-3 · Kemampuan menjelaskan materi — kejelasan, struktur, contoh yang relevan.",
    mhs_step3_kd4: "KD-4 · Kemampuan menjawab pertanyaan / berdiskusi — responsif, tepat, menghargai pendapat.",
    mhs_step3_kd5: "KD-5 · Kemampuan berinteraksi dengan mahasiswa — komunikatif, ramah, mendorong partisipasi.",
    mhs_step3_kd6: "KD-6 · Kedisiplinan / tepat waktu mengajar — datang & selesai sesuai jadwal.",
    mhs_step3_kd7: "KD-7 · Kerapian pakaian — berpakaian sopan & sesuai standar institusi.",

    mhs_step4_title: "Langkah 4 · Saran / Masukan (opsional)",
    mhs_step4_body:
      "Tuliskan saran membangun untuk dosen tersebut. Hindari komentar pribadi yang tidak relevan dengan kualitas pengajaran. Saran akan tampil ke admin tanpa nama Anda.",

    mhs_step5_title: "Langkah 5 · Kirim semua penilaian",
    mhs_step5_body:
      "Setelah seluruh dosen di semua matkul Anda diisi, klik tombol \"Kirim Semua Penilaian\" di bagian bawah. Setelah berhasil terkirim, Anda akan melihat konfirmasi dan tidak perlu mengisi ulang.",

    mhs_ethics_title: "Etika pengisian",
    mhs_ethics_1: "Jawab dengan jujur berdasarkan pengalaman langsung di kelas.",
    mhs_ethics_2: "Bedakan antara kualitas mengajar dosen dengan nilai/tugas yang Anda dapat.",
    mhs_ethics_3: "Tidak ada balasan negatif — identitas Anda tidak diberikan ke dosen.",
    mhs_ethics_4: "Jangan menggunakan kolom saran untuk menyerang pribadi.",

    mhs_faq_title: "Pertanyaan yang sering muncul",
    mhs_faq_q1: "Apakah dosen tahu siapa yang memberi nilai?",
    mhs_faq_a1:
      "Tidak. Yang dilihat dosen/prodi adalah rata-rata kelas dan kumpulan saran tanpa identitas pengirim. Identitas hanya tercatat di sisi admin untuk audit pengisian dan tidak dipublikasikan.",
    mhs_faq_q2: "Bisakah saya mengubah jawaban setelah dikirim?",
    mhs_faq_a2:
      "Tidak. Setelah \"Kirim Semua Penilaian\", data terkunci untuk periode tersebut. Pastikan jawaban final sebelum klik kirim.",
    mhs_faq_q3: "Bagaimana kalau saya tidak hadir di sebagian besar pertemuan?",
    mhs_faq_a3:
      "Anda tetap bisa mengisi, tetapi mohon jawab hanya untuk indikator yang Anda bisa nilai jujur berdasarkan pengalaman Anda.",
    mhs_faq_q4: "NIM saya ditolak saat login. Kenapa?",
    mhs_faq_a4:
      "Periode mungkin belum dibuka atau NIM belum ada di basis data. Hubungi admin/operator prodi Anda.",

    admin_intro_title: "Tentang panel Admin",
    admin_intro_body:
      "Panel admin diakses oleh operator prodi/fakultas untuk memantau progress pengisian, melihat rekap penilaian, mengelola periode, dan mengekspor laporan ke Excel untuk diteruskan ke pimpinan prodi/fakultas.",

    admin_step1_title: "Langkah 1 · Login Admin",
    admin_step1_body:
      "Buka halaman /admin, masukkan password admin yang Anda terima dari fakultas. Sesi login berlaku sampai Anda klik Keluar atau menutup browser.",

    admin_step2_title: "Langkah 2 · Membaca dashboard ringkasan",
    admin_step2_body:
      "Di bagian atas dashboard tampil status periode (Dibuka/Ditutup), 4 statistik (Total Mahasiswa, Sudah Mengisi, Belum Mengisi, Total Penilaian), dan progress bar pengisian. Gunakan ini untuk memantau respons real-time.",

    admin_step3_title: "Langkah 3 · Kontrol periode",
    admin_step3_body:
      "Tombol \"Buka Periode\" / \"Tutup Periode\" mengontrol apakah mahasiswa bisa mengirim penilaian baru. Tutup periode setelah waktu pengisian berakhir agar data terkunci sebelum dirangkum.",

    admin_step4_title: "Langkah 4 · Filter & rekap",
    admin_step4_body:
      "Gunakan dropdown Filter Prodi untuk fokus ke satu program studi. Ada 3 tab rekap:",
    admin_step4_t1: "Rekap per Matkul-Dosen — rata-rata setiap kombinasi mata kuliah × dosen, sesuai format setoran ke fakultas.",
    admin_step4_t2: "Rekap per Dosen — rata-rata seorang dosen dari seluruh matkul yang dia ampu.",
    admin_step4_t3: "Detail Responden — daftar mentah setiap pengiriman mahasiswa, untuk audit dan verifikasi.",

    admin_step5_title: "Langkah 5 · Ekspor ke Excel",
    admin_step5_body:
      "Tombol \"Export Rekap (.xlsx)\" mengunduh file Excel dengan layout mengikuti file Penilaian Kinerja MHS yang biasa diteruskan ke prodi/fakultas: 1 sheet per prodi, kolom NO, Nama Dosen, Matkul, N, KD-1..KD-7, JML, RATA-2, SARAN. Tombol \"Export Raw Responses\" mengunduh data mentah untuk audit. Hasil ekspor sudah memperhitungkan filter prodi yang aktif.",

    admin_step6_title: "Langkah 6 · Penyetoran",
    admin_step6_body:
      "Setelah periode ditutup, ekspor rekap final, lampirkan ke surat resmi prodi (sesuai SOP kampus), dan teruskan ke wakil dekan / pimpinan fakultas untuk tindak lanjut. Simpan juga file raw responses sebagai arsip.",

    admin_security_title: "Keamanan & best practice",
    admin_security_1: "Jangan bagikan password admin via grup terbuka. Rotasi password setiap awal periode.",
    admin_security_2: "Lakukan logout setiap selesai bekerja terutama di komputer bersama.",
    admin_security_3: "Periksa Detail Responden untuk mendeteksi pengisian yang mencurigakan (mis. NIM mengisi 100% skor 1 atau 4).",
    admin_security_4: "Data tersimpan di server kampus (Fly.io volume persisten). Backup berkala disarankan dengan men-download Raw Responses.",

    contact_title: "Bantuan & kontak",
    contact_body:
      "Pertanyaan teknis: hubungi admin sistem fakultas. Pertanyaan terkait kebijakan penilaian: hubungi kaprodi atau bagian akademik FEB UNIGA Malang.",
  },
} as const;

export default id;
