# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Nata's Daily 🩷

Aplikasi web personal daily planner untuk dua orang. Firebase + Alpine.js 3.x + vanilla JS. Hosting via GitHub Pages.

## Tech Stack

- **Frontend**: HTML, CSS, vanilla JS + Alpine.js 3.x (CDN)
- **Auth**: Firebase Auth compat (Email/Password)
- **DB**: Firebase Firestore compat — collections: `days`, `catalog`, `inspirations`, `countdowns`, `templates`
- **Fonts**: Patrick Hand (headings), Nunito (body) — Google Fonts
- **Confetti**: canvas-confetti CDN
- **Hosting**: GitHub Pages (`main` branch, `/root`)

## Arsitektur Kode

### Pola Module
```
Setiap file JS di js/ menambahkan dirinya ke window.DailyApp:
  window.DailyApp = window.DailyApp || {};
  DailyApp.namaModul = { method1() { ... }, method2() { ... } };

main.js menggabung semua modul via spread operator di return object app():
  ...DailyApp.utils,
  ...DailyApp.catalog,
  ...DailyApp.suggestions,
  ...DailyApp.schedule,
  ...dll.
```

Urutan load di index.html penting — GRATIS  utils dulu, baru modul lain, TERAKHIR main.js:
```
utils → catalog → suggestions → schedule → templates → schedule-suggestions → copy → inspirations → moods → countdowns → emoji-picker → main
```

### State Management
- Semua state deklaratif di return object function `app()` di main.js
- Modul hanya berisi method, state tetap di main.js
- `$store.auth` (Alpine store) untuk login state
- Firebase real-time via `onSnapshot` (disimpan di `this.unsubscribe`)
- Optimistic updates dengan flag `this._localUpdating` untuk mencegah feedback loop snapshot

### Firebase Helpers
Ada bridge object `window.FirebaseHelpers` yang membungkus Firebase compat API:
```js
window.FirebaseHelpers = {
  db, doc(), getDoc(), setDoc(), onSnapshot(), serverTimestamp()
}
```
Gunakan ini, bukan firebase global langsung.

### Firestore Collections
| Collection | Doc ID | Data Shape |
|---|---|---|
| `days` | `YYYY-MM-DD` | `{ checklist: [{id, text, done, priority}], schedule: [{id, time, text, note, past}], moods: { happy: 2, love: 1, ... } }` |
| `catalog` | normalizedKey | `{ text, count, lastUsed }` |
| `inspirations` | auto (push) | `{ text, emoji, imageUrl, active, createdAt }` |
| `countdowns` | auto (push) | `{ title, emoji, targetDate, type: 'countdown'|'countup', createdAt }` |
| `templates` | `schedule` | `{ days: { Senin: [...], Selasa: [...], ... } }` |

### Normalisasi Item
`normalizeKey(text)` di utils.js — buang emoji/simbol/kapital → lowercase key untuk dedup.
`pickBestDisplay()` — pilih versi terbaik (prioritas emoji > longest > newest).
Catalog menyimpan canonical text.

### Dark Mode
- CSS variables di `:root` dan `[data-theme="dark"]`
- Toggle state di localStorage key `darkMode`
- Inline script sebelum Alpine.js parse untuk mencegah flash

### Cache Bust
Semua `<script>` dan `<link>` punya `?v=N` query param. Increment saat deploy perubahan.

### Konfigurasi Personal
- Anniversary date: cari `new Date(2026, 5, 28)` di main.js
- Quotes statis: array `QUOTES` di utils.js
- Warna: CSS variables `--primary`, `--accent`, `--accent2` di style.css
- Magang: tanggal `2026-05-22` s.d. `2026-08-14` + 40 hari kerja

## Commands
- **Run locally**: buka `index.html` langsung di browser (no build step needed)
- **Deploy**: `git push origin main` → GitHub Pages auto-deploy
- **Firestore rules**: copy `firestore.rules` ke Firebase Console → Firestore → Rules
- **Version bump**: ubah `?v=N` di semua script/style link index.html

## Pola Penting
- Loading state `this.loading` + heartbeat loader `💗💗💗`
- Empty state tiap section dengan pesan personal Bahasa Indonesia
- Error handling: mostly `console.warn` + kadang `alert()` untuk user-facing error
- Date format: `YYYY-MM-DD` internal, `DD/MM/YYYY` display
- Config-sensitive: API key Firebase di-hardcode di index.html (private repo)
