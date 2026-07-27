# Nata's Daily 🩷

Aplikasi web personal daily planner. Firebase + Alpine.js + vanilla JS.

## File penting
- `index.html` — main page + semua modal + login
- `style.css` — semua styling + dark mode
- `firestore.rules` — **harus di-copy manual ke Firebase Console**
- `js/main.js` — Alpine component utama, gabung semua modul via spread
- `js/*.js` — masing2 fitur dipisah per file

## Pola kode
- Alpine store `$store.auth` untuk login state
- Spread modul di `main.js` via `...DailyApp.namaModul`
- Semua fungsi template langsung di HTML (Alpine `@click`, `x-text`, dll)
- Version cache bust: `?v=N` di setiap script & CSS link

## Firestore collections
- `days/{date}` — checklist, schedule, moods per tanggal
- `catalog/{normalizedKey}` — barang favorit, count, canonical text
- `inspirations/{docId}` — kata semangat + emoji + image
- `countdowns/{docId}` — multiple countdowns (title, emoji, targetDate, type)
- `templates/schedule` — template jadwal per hari (object)

## Fitur umum
- Checklist → suggestions from history & favorites
- Schedule → CRUD, edit, template, copy, saran from prev days
- Mood → increment, daily recap, weekly recap modal
- Countdown → compact chips card, modal management, edit existing
- Emoji picker → 8 categories ~700 emoji, search, reusable
