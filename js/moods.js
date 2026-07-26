/* ============================================================
   moods.js — Mood tracker harian & weekly recap
   All Alpine state (moods, showWeeklyRecap, MOOD_LIST, etc.)
   is declared in main.js. This file only provides methods.
   ============================================================ */

window.DailyApp = window.DailyApp || {};
DailyApp.moods = {

  /* --- Computed helpers --- */

  // Total mood count for today
  calcMoodTotal() {
    return Object.values(this.moods).reduce((sum, v) => sum + (v || 0), 0);
  },

  // Moods with count > 0, sorted by count desc
  calcActiveMoods() {
    return this.MOOD_LIST
      .map(m => ({ ...m, emoji: this.moodCustomEmojis[m.key] || m.emoji, count: this.moods[m.key] || 0 }))
      .filter(m => m.count > 0)
      .sort((a, b) => b.count - a.count);
  },

  // Dominant mood key for today
  calcDominantMood() {
    const active = this.calcActiveMoods();
    return active.length ? active[0] : null;
  },

  /* --- Increment mood (tap) --- */
  incrementMood(key) {
    const { doc, setDoc } = window.FirebaseHelpers;
    const docRef = doc(window.FirebaseHelpers.db, 'days', this.selectedDate);

    // Optimistic update
    this.moods[key] = (this.moods[key] || 0) + 1;

    // Write to Firestore (merge agar tidak timpa checklist/schedule)
    setDoc(docRef, { moods: this.moods }, { merge: true }).catch((err) => {
      console.warn('Gagal simpan mood:', err);
    });
  },

  /* --- Mood emoji customization --- */
  initCustomEmojis() {
    try {
      const saved = localStorage.getItem('moodCustomEmojis');
      this.moodCustomEmojis = saved ? JSON.parse(saved) : {};
    } catch (e) {
      this.moodCustomEmojis = {};
    }
  },

  saveCustomEmoji(key, emoji) {
    this.moodCustomEmojis[key] = emoji;
    localStorage.setItem('moodCustomEmojis', JSON.stringify(this.moodCustomEmojis));
    // Update MOOD_LIST in place
    const mood = this.MOOD_LIST.find(m => m.key === key);
    if (mood) mood.emoji = emoji;
  },

  /* --- Mood emoji picker --- */
  moodCustomizeKey: null,

  openMoodEmojiPicker(key) {
    this.moodEmojiPickKey = key;
    this.openEmojiPicker('emojiSearch');
  },

  /* --- Weekly Recap --- */
  openWeeklyRecap() {
    this.showWeeklyRecap = true;
    this.weeklyRecapLoading = true;
    this.weeklyRecapData = null;

    // Ambil data 7 hari terakhir (termasuk hari ini)
    const promises = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(this.selectedDate);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;
      const dayName = this.dayNameFromIndex ? this.dayNameFromIndex(d.getDay()) : '';

      promises.push(
        this._getDayMoods(dateStr).then((moodData) => {
          const total = Object.values(moodData).reduce((s, v) => s + (v || 0), 0);
          return total > 0 ? { date: dateStr, dayName, moods: moodData, total } : null;
        })
      );
    }

    Promise.all(promises).then((results) => {
      const days = results.filter(Boolean);
      if (!days.length) {
        this.weeklyRecapData = { days: [], totals: {}, grandTotal: 0, dominant: null };
        this.weeklyRecapLoading = false;
        return;
      }

      // Aggregate totals across all days
      const totals = {};
      let grandTotal = 0;
      days.forEach(day => {
        this.MOOD_LIST.forEach(m => {
          const val = day.moods[m.key] || 0;
          if (val > 0) {
            totals[m.key] = (totals[m.key] || 0) + val;
            grandTotal += val;
          }
        });
      });

      // Find dominant mood
      let dominant = null;
      let maxCount = 0;
      this.MOOD_LIST.forEach(m => {
        if ((totals[m.key] || 0) > maxCount) {
          maxCount = totals[m.key];
          dominant = { ...m, emoji: this.moodCustomEmojis[m.key] || m.emoji, count: maxCount };
        }
      });

      // Sort days newest first
      days.sort((a, b) => b.date.localeCompare(a.date));

      this.weeklyRecapData = { days, totals, grandTotal, dominant };
      this.weeklyRecapLoading = false;
    }).catch(() => {
      this.weeklyRecapLoading = false;
    });
  },

  closeWeeklyRecap() {
    this.showWeeklyRecap = false;
    this.weeklyRecapData = null;
  },

  /* --- Helper: get moods from a specific date --- */
  _getDayMoods(dateStr) {
    const { getDoc, doc } = window.FirebaseHelpers;
    const ref = doc(window.FirebaseHelpers.db, 'days', dateStr);
    return getDoc(ref).then((snap) => {
      if (snap && snap.exists) {
        return snap.data().moods || {};
      }
      return {};
    }).catch(() => ({}));
  },
};
