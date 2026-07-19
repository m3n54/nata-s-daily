# Nata's Daily 🩷

Aplikasi web pribadi untuk mencatat barang persiapan dan jadwal kegiatan harian.
Dibuat khusus untuk Nataaa — semangat magang! 🫶💗😍

Akses terbatas — hanya bisa digunakan oleh akun yang terdaftar di Firebase Auth.

## ✨ Fitur

- 📋 **Checklist barang & persiapan** — tambah, centang, hapus, dan saran otomatis
- ⏰ **Jadwal kegiatan** — atur waktu, catatan opsional
- ✏️ **Edit jadwal** — ubah jam/kegiatan/catatan setelah dibuat
- 📋 **Salin jadwal** — copy jadwal dari hari lain
- 🗂️ **Template jadwal** — template per hari (Senin–Minggu), tinggal terapkan
- 💡 **Saran barang pintar** — rekomendasi barang dari hari sebelumnya & favoritmu
- 💡 **Saran jadwal** — rekomendasi jadwal dari hari sebelumnya
- 🎯 **Normalisasi item** — "TWS", "tws", "TWS🎧" otomatis digabung jadi satu dengan emoji 🎧
- 💗 **Sync real-time** — perubahan dari HP langsung muncul di device lain
- 📅 **Navigasi hari** — lihat hari kemarin/besok, atau pilih tanggal
- 🎉 **Confetti** — kalau semua checklist selesai
- 💌 **Quote harian** — ganti sesuai selera
- 📆 **Anniversary counter** — hitung hari bersama
- 💪 **Countdown magang** — sisa hari kerja
- 🔐 **Login email/password** — hanya pengguna terdaftar yang bisa akses

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, vanilla JS + Alpine.js
- **Database**: Firebase Firestore (free tier)
- **Auth**: Firebase Authentication (Email/Password)
- **Hosting**: GitHub Pages (free)

---

## 🚀 Panduan Setup (untuk yang clone)

### 1. Firebase Project

1. Buka [firebase.google.com](https://firebase.google.com) → **Add project**
2. **Firestore Database** → **Create database** (pilih lokasi `asia-southeast1`)
3. **Authentication** → **Sign-in method** → **Enable Email/Password**
4. **Authentication** → **Users** → **Add user** buat 2 akun (kamu & pacar)

### 2. Ambil Firebase Config & Tempel

1. Firebase Console → **Project Settings** → **Your apps** → **Web** (`</>`)
2. Copy config, tempel di `index.html` bagian `const firebaseConfig = { ... }`

### 3. Firestore Rules

Buka Firebase Console → **Firestore** → **Rules**, paste ini:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /days/{dayId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Personalisasi

- **Anniversary**: di `js/main.js`, cari `new Date('2026-06-28')` → ganti tanggal kalian
- **Quotes**: di `js/utils.js`, array `QUOTES` → tulis quotes sendiri
- **Warna**: CSS variables di `style.css` (`--primary`, `--accent`, dll)

### 5. Deploy GitHub Pages

```
git push origin main
```

Repo → **Settings** → **Pages** → Source: `main` → `/root`

---

## 📁 Struktur

```
daily-app/
├── index.html               → Halaman utama + login
├── style.css                → Gaya visual
├── firestore.rules          → Aturan keamanan database
├── manifest.json            → PWA config
├── README.md                → Panduan ini
└── js/
    ├── utils.js             → Utility (normalizeKey, emoji, quotes)
    ├── catalog.js           → Katalog barang favorit
    ├── suggestions.js       → Saran barang & persiapan
    ├── schedule.js          → CRUD jadwal (tambah, hapus, edit)
    ├── schedule-suggestions.js → Saran jadwal dari hari sebelumnya
    ├── templates.js         → Template jadwal per hari
    ├── copy.js              → Salin jadwal dari tanggal lain
    └── main.js              → Komponen utama Alpine (gabung semua modul)
```

> 💡 Setiap fitur dipisah ke file sendiri — mudah dicari, ditambah, atau diubah.

## 💡 Tips

- Buka di 2 device → login akun masing-masing → coba tambah item → lihat sync
- Data per hari disimpan terpisah (ID = tanggal)
- Free tier Firebase cukup untuk berdua seumur hidup ✨
- Normalisasi item otomatis: cukup tulis "tws" → otomatis jadi "TWS🎧" kalau itu versi terbaiknya
