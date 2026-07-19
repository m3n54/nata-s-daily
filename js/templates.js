/* ============================================================
   templates.js — Template jadwal per hari (Senin-Minggu)
   ============================================================ */

window.DailyApp = window.DailyApp || {};
DailyApp.templates = {
  // Load templates dari Firestore
  loadTemplates() {
    if (this.templateLoading) return;
    this.templateLoading = true;
    const { db } = window.FirebaseHelpers;
    db.collection('templates').doc('schedule').get().then((snap) => {
      if (snap && snap.exists) {
        this.templates = snap.data().days || {};
      } else {
        this.templates = {};
      }
      this.templateLoading = false;
    }).catch(() => {
      this.templates = {};
      this.templateLoading = false;
    });
  },

  // Tambah item ke template
  addTemplateItem() {
    if (!this.newTmplText.trim() || !this.newTmplTime) return;
    const day = this.templateActiveDay;
    if (!this.templates[day]) this.templates[day] = [];
    this.templates[day].push({
      id: Date.now(),
      time: this.newTmplTime,
      text: this.newTmplText.trim(),
      note: this.newTmplNote.trim()
    });
    this.templates[day].sort((a, b) => a.time.localeCompare(b.time));
    this.newTmplTime = '';
    this.newTmplText = '';
    this.newTmplNote = '';
  },

  // Hapus item dari template
  deleteTemplateItem(idx) {
    const day = this.templateActiveDay;
    if (!this.templates[day]) return;
    this.templates[day] = this.templates[day].filter((_, i) => i !== idx);
  },

  // Simpan semua template ke Firestore
  saveTemplates() {
    const { setDoc, doc } = window.FirebaseHelpers;
    const ref = doc(window.FirebaseHelpers.db, 'templates', 'schedule');
    return setDoc(ref, { days: this.templates }, { merge: true }).then(() => {
      this.showTemplateModal = false;
    }).catch((err) => {
      console.warn('Gagal simpan template:', err);
    });
  },

  // Buka modal template
  openTemplateModal() {
    this.loadTemplates();
    this.templateActiveDay = this.templateForToday;
    this.showTemplateModal = true;
  },

  // Terapkan template hari ini ke jadwal
  applyTemplate() {
    const dayName = this.templateForToday;
    const tmpl = this.templates[dayName];
    if (!tmpl || !tmpl.length) return;

    const { doc, setDoc } = window.FirebaseHelpers;
    const docRef = doc(window.FirebaseHelpers.db, 'days', this.selectedDate);

    const existingKeys = new Set(this.schedule.map(s => s.time + '|' + s.text.toLowerCase()));
    const toAdd = tmpl.filter(t => !existingKeys.has(t.time + '|' + t.text.toLowerCase()));
    if (!toAdd.length) return;

    const newItems = toAdd.map(t => ({
      id: Date.now() + Math.floor(Math.random() * 1000),
      time: t.time,
      text: t.text,
      note: t.note || '',
      past: false
    }));

    const updated = [...this.schedule, ...newItems];
    updated.sort((a, b) => a.time.localeCompare(b.time));
    this.schedule = updated;
    this.checkPastSchedules();
    setDoc(docRef, { schedule: updated }, { merge: true }).catch((err) => {
      console.warn('Gagal apply template:', err);
    });
  },
};
