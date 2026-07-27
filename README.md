# Nata's Daily 🩷

Aplikasi web pribadi untuk catatan harian — barang persiapan, jadwal kegiatan, mood, dan semangat每日.
Dibuat khusus untuk Nataaa — semangat magang! 🫶💗😍

Akses terbatas — hanya bisa digunakan oleh akun yang terdaftar di Firebase Auth.

## ✨ Fitur

### 📋 Checklist & Persiapan
- **Checklist barang** — tambah, centang, hapus item
- **Saran pintar** — rekomendasi dari 7 hari terakhir + favorit, lengkap dengan label hari
- **⭐ Prioritas** — toggle bintang, item prioritas otomatis diurutkan ke atas
- **Normalisasi item** — "TWS", "tws", "TWS🎧" otomatis digabung jadi satu dengan emoji 🎧
- **Katalog favorit** — barang yang sering dipakai otomatis jadi favorit, muncul sebagai saran

### ⏰ Jadwal Kegiatan
- **CRUD jadwal** — tambah, edit, hapus kegiatan dengan jam & catatan
- **Saran jadwal** — rekomendasi dari hari sebelumnya
- **🗂️ Template jadwal** — template per hari (Senin–Minggu), tinggal terapkan
- **📋 Salin jadwal** — copy jadwal dari tanggal lain

### 😊 Mood Tracker
- **11 mood** — dari super happy sampai bad, tap buat increment
- **Daily recap** — lihat ringkasan mood hari ini
- **Weekly recap modal** — grafik mood seminggu
- **🦖 Dino mood spesial** — NATASAURUS ROARRR dengan styling khusus

### ⏳ Multiple Countdowns
- **Countdown & countup** — hitung mundur atau hitung naik
- **Compact chips card** — tampilan ringkas di header
- **Modal management** — tambah/edit/hapus countdown
- **Edit countdown** — update judul, emoji, tanggal, jenis kapan saja
- Bisa dipakai untuk magang, anniversary, ultah, deadline, dll.

### 😊 Emoji Picker
- **8 kategori** ~700 emoji — Smiley, People, Animals, Food, Travel, Activities, Objects, Symbols
- **Search** — cari emoji cepat
- **Reusable** — bisa dipakai di mood tracker, checklist, schedule, inspirasi

### 💬 Inspirasi & Semangat
- **Popup harian** — kata semangat + gambar, muncul otomatis tiap hari
- **Atur sendiri** — tambah/edit/hapus kata-kata & gambar kustom
- **🎲 Quote lain** — tombol acak quote baru di popup

### 🎨 Tampilan & Kenyamanan
- **🌙 Dark mode** — toggle dengan warna cozy warm, tersimpan di localStorage
- **🌤️ Sapaan otomatis** — judul berubah "Selamat pagi/siang/sore/malam" sesuai jam
- **💌 Quote harian** — ganti sesuai selera di utils.js
- **🖼️ Background video** — video estetik sebagai latar dengan overlay gradient
- **🎉 Confetti** — kalau semua checklist selesai

### 🔧 Lainnya
- **🔐 Login email/password** — hanya pengguna terdaftar yang bisa akses
- **📅 Navigasi hari** — lihat hari kemarin/besok, atau pilih tanggal
- **💗 Sync real-time** — perubahan dari HP langsung muncul di device lain (Firebase `onSnapshot`)
- **🦊 Firefox fallback** — error handling + kompatibilitas browser
- **Cache bust** — version query param (`?v=N`) di setiap file, gampang force refresh

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, vanilla JS + Alpine.js 3.x
- **Database**: Firebase Firestore (free tier) — collections: `days`, `catalog`, `inspirations`, `countdowns`, `templates`
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
    match /catalog/{itemId} {
      allow read, write: if request.auth != null;
    }
    match /inspirations/{docId} {
      allow read, write: if request.auth != null;
    }
    match /countdowns/{docId} {
      allow read, write: if request.auth != null;
    }
    match /templates/{docId} {
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
├── index.html               → Halaman utama + login + semua modal
├── style.css                → Semua styling + dark mode
├── firestore.rules          → Aturan keamanan database (copy ke console)
├── manifest.json            → PWA config
├── bg.mp4                   → Background video estetik
├── README.md                → Panduan ini
└── js/
    ├── main.js              → Alpine component utama (gabung semua modul via spread)
    ├── utils.js             → Utility (normalizeKey, quotes)
    ├── catalog.js           → Katalog barang favorit
    ├── suggestions.js       → Saran barang dari riwayat & favorit
    ├── schedule.js          → CRUD jadwal (tambah, hapus, edit)
    ├── schedule-suggestions.js → Saran jadwal dari hari sebelumnya
    ├── templates.js         → Template jadwal per hari (Senin–Minggu)
    ├── copy.js              → Salin jadwal dari tanggal lain
    ├── inspirations.js      → Kata semangat & gambar (custom quotes)
    ├── moods.js             → Mood tracker + daily recap + weekly recap
    ├── countdowns.js        → Multiple countdowns (add/edit/delete/countup)
    └── emoji-picker.js      → Emoji picker 8 kategori + search
```

> 💡 Setiap fitur dipisah ke file sendiri — mudah dicari, ditambah, atau diubah.

## 💡 Tips

- Buka di 2 device → login akun masing-masing → coba tambah item → lihat sync real-time
- Data per hari disimpan terpisah (ID = tanggal)
- Free tier Firebase cukup untuk berdua seumur hidup ✨
- Normalisasi item otomatis: cukup tulis "tws" → otomatis jadi "TWS🎧" kalau itu versi terbaiknya
- Dark mode otomatis inget pilihan kamu — gak perlu toggle ulang tiap buka
