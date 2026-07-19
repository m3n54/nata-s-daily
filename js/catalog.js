/* ============================================================
   catalog.js — Katalog barang favorit (count, frekuensi)
   ============================================================ */

window.DailyApp = window.DailyApp || {};
DailyApp.catalog = {
  // Simpan item ke katalog, gabung varian yg sama via normalizeKey
  saveToCatalog(itemText) {
    const { getDoc, doc, setDoc } = window.FirebaseHelpers;
    const key = normalizeKey(itemText);
    if (!key) return;
    const catRef = doc(window.FirebaseHelpers.db, 'catalog', key);

    getDoc(catRef).then((snap) => {
      const canonicalText = pickBestDisplay(snap.exists ? snap.data().text : null, itemText.trim());
      setDoc(catRef, {
        count: (snap.exists ? snap.data().count : 0) + 1,
        lastUsed: new Date().toISOString().split('T')[0],
        text: canonicalText
      });
    }).catch((err) => console.warn('Katalog save error:', err));
  },

  // Ambil barang dari 7 hari terakhir
  getRecentChecklistItems() {
    const promises = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(this.selectedDate);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;
      const dayName = this.dayNameFromIndex(d.getDay());

      promises.push(
        this._getDayChecklist(dateStr).then((items) => {
          if (!items.length) return null;
          return { date: dateStr, dayName, items };
        })
      );
    }
    return Promise.all(promises).then((results) => results.filter(Boolean));
  },

  // Helper: ambil checklist dari suatu tanggal
  _getDayChecklist(dateStr) {
    const { getDoc, doc } = window.FirebaseHelpers;
    const ref = doc(window.FirebaseHelpers.db, 'days', dateStr);
    return getDoc(ref).then((snap) => {
      if (snap && snap.exists) {
        return (snap.data().checklist || []).map(c => c.text);
      }
      return [];
    }).catch(() => []);
  },

  // Ambil barang paling sering dipake dari katalog
  getFavoriteItems() {
    const { db } = window.FirebaseHelpers;
    return db.collection('catalog').orderBy('count', 'desc').limit(8).get()
      .then((snap) => {
        const items = [];
        snap.forEach((d) => {
          const data = d.data();
          if (data.text) items.push(data.text);
        });
        return items;
      }).catch(() => []);
  },
};
