# Hari Kita 🩷

Aplikasi web sederhana untuk mencatat barang persiapan dan jadwal kegiatan harian.
Dibuat khusus untuk berdua — kamu dan pacar. Real-time sync, tanpa login ribet.

## ✨ Fitur

- 📋 **Checklist barang & persiapan** — tambah, centang, hapus
- ⏰ **Jadwal kegiatan** — atur waktu, catatan opsional
- 💗 **Sync real-time** — perubahan dari HP kamu langsung muncul di HP pacar
- 📅 **Navigasi hari** — lihat hari kemarin/besok
- 🎉 **Confetti** — kalau semua checklist selesai
- 💌 **Quote harian** — ganti sesuai selera
- 📆 **Anniversary counter** — hitung hari bersama

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, vanilla JS + Alpine.js
- **Database**: Firebase Firestore (free tier)
- **Hosting**: GitHub Pages (free)

---

## 🚀 Langkah Setup

### 1. Buat Firebase Project

1. Buka [firebase.google.com](https://firebase.google.com)
2. Klik **Add project** → beri nama → **Create project**
3. Di dashboard, klik **Firestore Database** → **Create database**
   - Pilih mode **test mode** (nanti kita ganti rules)
   - Pilih lokasi: `asia-southeast1` (Singapore) atau `asia-east1` (Taiwan)
4. Klik **Authentication** → **Get started** → **Sign-in method**
   - Aktifkan **Anonymous** (biar ga perlu login manual)

### 2. Ambil Firebase Config

1. Di Firebase Console → **Project Settings** (gear icon) → tab **General**
2. Scroll ke bawah → **Your apps** → klik icon **Web** (`</>`)
3. Beri nickname, klik **Register app**
4. Copy config object (6 baris: apiKey, authDomain, dll)
5. Buka `index.html`, cari bagian `const firebaseConfig = { ... }`
6. Ganti dengan config kamu

### 3. Atur Firestore Security Rules

Di Firestore → **Rules**, ganti dengan:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /days/{dayId} {
      allow read, write: if true;
    }
  }
}
```

> ⚠️ Ini buat app pribadi berdua. Kalau mau lebih aman, pakai auth check.

### 4. Personalisasi

- **Warna**: edit CSS variables di `style.css` (`--primary`, `--accent`, dll)
- **Anniversary**: di `app.js`, cari `new Date('2024-01-01')` → ganti tanggal kalian
- **Quotes**: di `app.js`, array `QUOTES` → tulis quotes sendiri
- **Nama**: di `index.html` footer "Dibuat khusus untuk kamu"

### 5. Deploy ke GitHub Pages

1. Buat repo di GitHub (misal `hari-kita`)
2. Upload semua file: `index.html`, `style.css`, `app.js`, `manifest.json`
3. Repo → **Settings** → **Pages**
4. Source: **Deploy from a branch** → pilih `main` → `/root`
5. Save → tunggu ~1 menit
6. Web live di: `https://username.github.io/hari-kita`

### 6. Akses dari HP

- Buka URL di browser HP
- Chrome/Android: menu `⋮` → **Add to Home screen** → jadi app
- Safari/iOS: Share → **Add to Home Screen**

---

## 📁 Struktur

```
hari-kita/
├── index.html      → Halaman utama
├── style.css       → Gaya visual
├── app.js          → Logika + Firebase
├── manifest.json   → PWA config
└── README.md       → Panduan ini
```

## 💡 Tips

- Buka di 2 device berbeda → coba tambah item → lihat sync real-time
- Data per hari disimpan terpisah (ID = tanggal)
- Free tier Firebase cukup untuk berdua seumur hidup ✨
