/* ============================================================
   utils.js — Utility functions & constants
   ============================================================ */

const QUOTES = [
  'Kalau ada yang mau dilakukan, lakukan sekarang juga.',
  'Senyum dulu, ini dia yang buat hari ini berwarna.',
  'Ayo, barang sudah siap, sekarang waktunya berangkat.',
  'Jangan lupa makan, sayang.',
  'Setiap hari dengan kamu adalah hadiah tersendiri.',
  'Kita yang keren, pasti bisa menyelesaikan semua.',
  'Waktu terbaik adalah ketika kita berdua.',
  'One step at a time, love.',
  'Waktunya untuk bersenyum lebar.',
  'Kita jalani hari ini dengan seru.'
];

// Ubah teks jadi "key" untuk perbandingan — buang emoji, simbol, spasi berlebih
function normalizeKey(text) {
  if (!text) return '';
  return text.toLowerCase().trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Cek apakah teks mengandung emoji
function hasEmoji(text) {
  return /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/u.test(text);
}

// Pilih versi "terbaik" untuk ditampilkan (prioritas: emoji > panjang > baru)
function pickBestDisplay(existing, candidate) {
  if (!existing) return candidate;
  if (!candidate) return existing;
  const exEmoji = hasEmoji(existing);
  const canEmoji = hasEmoji(candidate);
  if (canEmoji && !exEmoji) return candidate;
  if (exEmoji && !canEmoji) return existing;
  if (candidate.length > existing.length) return candidate;
  if (existing.length > candidate.length) return existing;
  return candidate;
}

window.DailyApp = window.DailyApp || {};
DailyApp.utils = {
  normalizeKey,
  hasEmoji,
  pickBestDisplay,
};
