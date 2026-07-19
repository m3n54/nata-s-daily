/* ============================================================
   suggestions.js — Saran barang & persiapan
   ============================================================ */

window.DailyApp = window.DailyApp || {};
DailyApp.suggestions = {
  // Muat saran — dari 7 hari terakhir + katalog favorit
  loadSuggestions() {
    this.suggestions = [];
    this.loadingSuggestions = true;

    Promise.all([
      this.getRecentChecklistItems(),
      this.getFavoriteItems()
    ]).then(([recentDays, favorites]) => {
      const seen = new Set();
      const result = [];

      recentDays.forEach(day => {
        day.items.forEach(text => {
          const key = normalizeKey(text);
          if (key && !seen.has(key)) {
            seen.add(key);
            result.push({ text: text.trim(), type: day.dayName, date: day.date });
          }
        });
      });

      favorites.forEach(text => {
        const key = normalizeKey(text);
        if (key && !seen.has(key)) {
          seen.add(key);
          result.push({ text: text.trim(), type: 'favorit', date: null });
        }
      });

      // Sisihkan yg udah ada di checklist hari ini
      const existing = new Set(this.checklist.map(i => normalizeKey(i.text)));
      this.suggestions = result.filter(s => !existing.has(normalizeKey(s.text)));

      this.loadingSuggestions = false;
    }).catch(() => {
      this.loadingSuggestions = false;
    });
  },

  // Tambah saran ke checklist
  addSuggestion(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Cari canonical version dari catalog
    const { getDoc, doc } = window.FirebaseHelpers;
    const key = normalizeKey(trimmed);
    getDoc(doc(window.FirebaseHelpers.db, 'catalog', key)).then((snap) => {
      const displayText = snap && snap.exists ? snap.data().text : trimmed;

      const { doc: doc2, setDoc } = window.FirebaseHelpers;
      const docRef = doc2(window.FirebaseHelpers.db, 'days', this.selectedDate);
      const newItem = { id: Date.now(), text: displayText, done: false };
      const updated = [...this.checklist, newItem];
      this._localUpdating = true;
      this.checklist = updated;
      setDoc(docRef, { checklist: updated }, { merge: true }).then(() => {
        this._localUpdating = false;
      }).catch(() => {
        this._localUpdating = false;
      });
      // Hapus dari suggestions berdasarkan normalizeKey
      const nk = normalizeKey(text);
      this.suggestions = this.suggestions.filter(s => normalizeKey(s.text) !== nk);
      this.saveToCatalog(text);
    }).catch(() => {
      this.saveToCatalog(trimmed);
    });
  },
};
