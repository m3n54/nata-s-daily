/* ============================================================
   moods.js — Mood tracker harian & weekly recap
   collection Firestore: days/{dateId}.moods
   ============================================================ */

window.DailyApp = window.DailyApp || {};
DailyApp.moods = {
  /* --- Mood definitions (10 moods, positive → neutral → negative) --- */
  MOOD_LIST: [
    { key: 'happy',    emoji: '😊',  label: 'Happy' },
    { key: 'love',     emoji: '🥰',  label: 'Love' },
    { key: 'excited',  emoji: '🎉',  label: 'Excited' },
    { key: 'motivated',emoji: '💪',  label: 'Motivated' },
    { key: 'grateful', emoji: '🤗',  label: 'Grateful' },
    { key: 'meh',      emoji: '😐',  label: 'Meh' },
    { key: 'tired',    emoji: '😴',  label: 'Tired' },
    { key: 'anxious',  emoji: '😰',  label: 'Anxious' },
    { key: 'sad',      emoji: '😢',  label: 'Sad' },
    { key: 'angry',    emoji: '😡',  label: 'Angry' },
  ],

  /* --- State --- */
  moods: {},
  showWeeklyRecap: false,
  weeklyRecapData: null,
  weeklyRecapLoading: false,

  /* --- Computed helpers (methods karena getter nggak bisa di-spread ke Alpine) --- */

  // Total mood count for today
  calcMoodTotal() {
    return Object.values(this.moods).reduce((sum, v) => sum + (v || 0), 0);
  },

  // Moods with count > 0, sorted by count desc
  calcActiveMoods() {
    return this.MOOD_LIST
      .map(m => ({ ...m, count: this.moods[m.key] || 0 }))
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
          dominant = { ...m, count: maxCount };
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
