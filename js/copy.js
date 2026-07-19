/* ============================================================
   copy.js — Salin jadwal dari tanggal lain
   ============================================================ */

window.DailyApp = window.DailyApp || {};
DailyApp.copy = {
  // Buka modal copy
  openCopyModal() {
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    this.copySourceDate = `${y}-${m}-${day}`;
    this.showCopyModal = true;
  },

  // Copy jadwal dari tanggal sumber
  copySchedule() {
    if (!this.copySourceDate || this.copySourceDate === this.selectedDate) return;

    const { getDoc, doc, setDoc } = window.FirebaseHelpers;
    const srcRef = doc(window.FirebaseHelpers.db, 'days', this.copySourceDate);

    getDoc(srcRef).then((snap) => {
      if (!snap || !snap.exists) {
        alert('Tidak ada jadwal di tanggal ' + this.copySourceDate);
        return;
      }
      const data = snap.data();
      const sourceSchedule = data.schedule || [];
      if (!sourceSchedule.length) {
        alert('Tidak ada jadwal di tanggal ' + this.copySourceDate);
        return;
      }

      // Filter yang belum ada di hari ini
      const existingKeys = new Set(this.schedule.map(s => s.time + '|' + s.text.toLowerCase()));
      const toAdd = sourceSchedule.filter(t => !existingKeys.has(t.time + '|' + t.text.toLowerCase()));
      if (!toAdd.length) {
        alert('Semua jadwal sudah ada di hari ini');
        return;
      }

      const newItems = toAdd.map(t => ({
        id: Date.now() + Math.floor(Math.random() * 1000),
        time: t.time, text: t.text, note: t.note || '', past: false
      }));

      const updated = [...this.schedule, ...newItems];
      updated.sort((a, b) => a.time.localeCompare(b.time));
      this.schedule = updated;
      this.checkPastSchedules();

      const dstRef = doc(window.FirebaseHelpers.db, 'days', this.selectedDate);
      setDoc(dstRef, { schedule: updated }, { merge: true }).then(() => {
        this.showCopyModal = false;
      }).catch((err) => {
        console.warn('Gagal copy jadwal:', err);
      });
    }).catch((err) => {
      console.warn('Gagal baca sumber:', err);
      alert('Gagal membaca jadwal sumber');
    });
  },
};
