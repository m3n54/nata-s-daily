# Nata's Daily 🩷

Aplikasi web pribadi untuk mencatat barang persiapan dan jadwal kegiatan harian.
Dibuat khusus untuk kamu @natinanana — semangat magang! 🫶

Akses terbatas — hanya bisa digunakan oleh akun yang terdaftar di Firebase Auth.

## ✨ Fitur

- 📋 **Checklist barang & persiapan** — tambah, centang, hapus
- ⏰ **Jadwal kegiatan** — atur waktu, catatan opsional
- 💗 **Sync real-time** — perubahan dari HP langsung muncul di device lain
- 📅 **Navigasi hari** — lihat hari kemarin/besok
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

- **Anniversary**: di `app.js`, cari `new Date('2026-06-28')` → ganti tanggal kalian
- **Quotes**: di `app.js`, array `QUOTES` → tulis quotes sendiri
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
├── index.html      → Halaman utama + login
├── style.css       → Gaya visual
├── app.js          → Logika + Firebase
├── firestore.rules → Aturan keamanan database
├── manifest.json   → PWA config
└── README.md       → Panduan ini
```

## 💡 Tips

- Buka di 2 device → login akun masing-masing → coba tambah item → lihat sync
- Data per hari disimpan terpisah (ID = tanggal)
- Free tier Firebase cukup untuk berdua seumur hidup ✨
