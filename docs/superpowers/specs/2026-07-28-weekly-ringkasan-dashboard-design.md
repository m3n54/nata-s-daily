# Weekly Ringkasan Dashboard 📊

## Ringkasan
Dashboard mingguan di bawah mood tracker yang nampilin rekap checklist, mood, dan jadwal dalam 7 hari terakhir. Bisa dibuka/tutup manual lewat tombol di header.

## Layout & Navigasi
- **Letak:** Section baru di bawah mood tracker (paling bawah page)
- **Akses:** Tombol `📊 Ringkasan` di area header/nav, toggle show/hide
- **Toggle state:** `showWeeklySummary` — default false
- **Data scope:** 7 hari terakhir dari `selectedDate` (bukan cuma hari ini)

## Data Sections

### 1. Kartu Statistik (atas)
4 kartu snapshot:
- ✅ **Checklist** — % selesai rata-rata minggu ini, total item
- 😊 **Mood** — mood dominan minggu ini + total tap
- ⏰ **Jadwal** — jumlah kegiatan terjadwal vs terlewat (`past: true`)
- 🔥 **Streak** — hari berturut-turut dengan completion > 0

### 2. Checklist per Hari (grafik batang)
Baris per hari: nama hari + progress bar + persentase + (x/y)
Highlight hari dengan completion 100% (⭐).
Sort newest first.

### 3. Mood Recap
Menggunakan kode weekly recap mood yang sudah ada (diperbaiki):
- Dominant mood
- Breakdown bar per mood
- Daily breakdown per hari

### 4. Jadwal Terlewat
Daftar kegiatan yang `past: true` dari 7 hari terakhir.
Compact: jam + teks kegiatan + hari.

## Fix Weekly Recap Mood (existing)

Masalah dan perbaikan pada modal weekly recap yang sudah ada:

1. **Missing `.recap-content` CSS** → tambah padding block
2. **Modal overflow** → tambah `overflow-y: auto` di `.recap-modal`
3. **Dominant mood crash** → fallback kalau dominant null
4. **Loading state bukan Promise.all** → error handling lebih baik

## Data Flow

```
openWeeklySummary()
  ↓
set loading = true
  ↓
loop 7 hari dari selectedDate
  ↓
_getDayData(dateStr) → { checklist, schedule, moods }
  ↓
compute agregat (rata-rata, total, dominan, streak)
  ↓
set weeklySummaryData = { ... }
loading = false
```

## File Changes

| File | Change |
|------|--------|
| `index.html` | Tombol toggle di header + section HTML baru di bawah mood |
| `style.css` | CSS untuk dashboard layout, grid kartu, grafik bar |
| `js/main.js` | Add state `showWeeklySummary`, `weeklySummaryData`, `weeklySummaryLoading` |
| `js/moods.js` | Perbaiki `openWeeklyRecap` + `_getDayMoods` (dominant fallback, error handling) |
| `js/utils.js` | Add helper `_getDayData` untuk ambil 3 data sekaligus |

## Non-Goals
- Tidak ada auto-popup — manual toggle only
- Tidak ubah struktur data Firestore (gunakan data yang ada)
- Tidak ganti layout existing sections (checklist, jadwal, mood tetap di atas)
