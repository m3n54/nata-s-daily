/* ============================================================
   schedule-suggestions.js — Saran jadwal dari hari sebelumnya
   ============================================================ */

window.DailyApp = window.DailyApp || {};
DailyApp.schedSuggestions = {
  // Ambil jadwal dari 7 hari terakhir untuk saran
  loadScheduleSuggestions() {
    this.scheduleSuggestions = [];
    this.loadingSchedSuggestions = true;

    const promises = [];
    const existingKeys = new Set(this.schedule.map(s => s.time + '|' + s.text.toLowerCase()));

    for (let i = 1; i <= 7; i++) {
      const d = new Date(this.selectedDate);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;
      const dayName = this.dayNameFromIndex(d.getDay());

      promises.push(
        this._getDaySchedule(dateStr).then((items) => {
          if (!items.length) return null;
          return { date: dateStr, dayName, items };
        })
      );
    }

    Promise.all(promises).then((results) => {
      resultLoop:
      for (const r of results) {
        if (!r) continue;
        const freshItems = r.items.filter(
          it => !existingKeys.has(it.time + '|' + it.text.toLowerCase())
        );
        if (!freshItems.length) continue;

        for (const item of freshItems) {
          if (this.scheduleSuggestions.length >= 8) break resultLoop;
          this.scheduleSuggestions.push({
            date: r.date, dayName: r.dayName,
            time: item.time, text: item.text, note: item.note
          });
        }
      }
      this.loadingSchedSuggestions = false;
    }).catch(() => {
      this.loadingSchedSuggestions = false;
    });
  },

  // Helper: ambil jadwal dari suatu tanggal
  _getDaySchedule(dateStr) {
    const { getDoc, doc } = window.FirebaseHelpers;
    const ref = doc(window.FirebaseHelpers.db, 'days', dateStr);
    return getDoc(ref).then((snap) => {
      if (snap && snap.exists) {
        return (snap.data().schedule || []).map(s => ({
          time: s.time, text: s.text, note: s.note || ''
        }));
      }
      return [];
    }).catch(() => []);
  },

  // Tambah saran jadwal ke hari ini
  addScheduleSuggestion(item) {
    const exists = this.schedule.some(
      s => s.time === item.time && s.text.toLowerCase() === item.text.toLowerCase()
    );
    if (exists) {
      this.scheduleSuggestions = this.scheduleSuggestions.filter(
        s => !(s.time === item.time && s.text.toLowerCase() === item.text.toLowerCase())
      );
      return;
    }

    const { doc, setDoc } = window.FirebaseHelpers;
    const docRef = doc(window.FirebaseHelpers.db, 'days', this.selectedDate);
    const newItem = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      time: item.time, text: item.text, note: item.note || '', past: false
    };
    const updated = [...this.schedule, newItem];
    updated.sort((a, b) => a.time.localeCompare(b.time));
    this.schedule = updated;
    this.checkPastSchedules();
    setDoc(docRef, { schedule: updated }, { merge: true }).catch((err) => {
      console.warn('Gagal tambah saran jadwal:', err);
    });
    this.scheduleSuggestions = this.scheduleSuggestions.filter(
      s => !(s.time === item.time && s.text.toLowerCase() === item.text.toLowerCase())
    );
  },

  loadScheduleRelated() {
    this.loadScheduleSuggestions();
  },
};
