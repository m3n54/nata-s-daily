/* ============================================================
   schedule.js — CRUD jadwal kegiatan (tambah, hapus, edit)
   ============================================================ */

window.DailyApp = window.DailyApp || {};
DailyApp.schedule = {
  // Tambah jadwal baru
  addSchedule() {
    const { doc, setDoc } = window.FirebaseHelpers;
    const docRef = doc(window.FirebaseHelpers.db, 'days', this.selectedDate);
    const newItem = {
      id: Date.now(),
      time: this.newSchedTime,
      text: this.newSchedText.trim(),
      note: this.newSchedNote.trim(),
      past: false
    };
    const updated = [...this.schedule, newItem];
    updated.sort((a, b) => a.time.localeCompare(b.time));
    this.schedule = updated;
    this.checkPastSchedules();
    setDoc(docRef, { schedule: updated }, { merge: true });
    this.newSchedTime = '';
    this.newSchedText = '';
    this.newSchedNote = '';
  },

  // Hapus jadwal
  deleteSchedule(idx) {
    const { doc, setDoc } = window.FirebaseHelpers;
    const docRef = doc(window.FirebaseHelpers.db, 'days', this.selectedDate);
    const updated = this.schedule.filter((_, i) => i !== idx);
    this.schedule = updated;
    setDoc(docRef, { schedule: updated }, { merge: true });
  },

  // Buka modal edit jadwal
  openEditSchedule(idx) {
    const item = this.schedule[idx];
    if (!item) return;
    this.editIdx = idx;
    this.editTime = item.time;
    this.editText = item.text;
    this.editNote = item.note || '';
    this.showEditModal = true;
  },

  // Simpan hasil edit jadwal
  saveEditSchedule() {
    if (!this.editText.trim() || !this.editTime) return;

    const { doc, setDoc } = window.FirebaseHelpers;
    const docRef = doc(window.FirebaseHelpers.db, 'days', this.selectedDate);

    const updated = this.schedule.map((item, i) => {
      if (i !== this.editIdx) return item;
      return { ...item, time: this.editTime, text: this.editText.trim(), note: this.editNote.trim() };
    });

    updated.sort((a, b) => a.time.localeCompare(b.time));
    this.schedule = updated;
    this.checkPastSchedules();
    setDoc(docRef, { schedule: updated }, { merge: true }).catch((err) => {
      console.warn('Gagal update jadwal:', err);
    });
    this.showEditModal = false;
    this.editIdx = -1;
  },
};
