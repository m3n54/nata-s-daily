/* ============================================================
   app.js — Logika utama Hari Kita 🩷
   Vanilla JS + Alpine.js + Firebase Firestore
   ============================================================ */

/* ---------- Quotes — ganti atau tambah sesuka hati ---------- */
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

function app() {
  return {
    /* --- State --- */
    firebaseReady: false,
    loading: true,
    checklist: [],
    schedule: [],
    newItem: '',
    newSchedTime: '',
    newSchedText: '',
    newSchedNote: '',
    todayStr: '',
    selectedDate: '',
    dateStr: '',
    dayName: '',
    dayLabel: '',
    anniversaryDays: null,
    dailyQuote: '',
    internship: null,
    unsubscribe: null,
    _localUpdating: false, // flag cegah snapshot overwrite saat update lokal

    /* --- Suggestion state --- */
    suggestions: [],         // barang yang disarankan
    loadingSuggestions: false,

    /* --- Schedule Template state --- */
    templates: {},
    templateLoading: false,
    templateDays: ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'],
    templateActiveDay: 'Senin',
    newTmplTime: '',
    newTmplText: '',
    newTmplNote: '',
    showTemplateModal: false,

    /* --- Copy Schedule state --- */
    showCopyModal: false,
    copySourceDate: '',

    /* --- Schedule Suggestions state --- */
    scheduleSuggestions: [],
    loadingSchedSuggestions: false,

    init() {
      console.log('App Alpine initialization...');
      this.setToday();
      this.dailyQuote = this.randomQuote();
      this.anniversaryDays = this.calculateAnniversary();
      this.internship = this.calculateInternshipCountdown();
      this.waitForFirebase();
    },

    setToday() {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      this.todayStr = `${y}-${m}-${d}`;
      this.selectedDate = this.todayStr;
      this.updateDateStrings();
    },

    waitForFirebase() {
      const wait = () => {
        if (window.FIREBASE_READY) {
          this.firebaseReady = true;
          this.loadDay();
        } else {
          window.addEventListener('firebase-ready', () => {
            this.firebaseReady = true;
            this.loadDay();
          });
        }
      };
      wait();
    },

    updateDateStrings() {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jum\'at', 'Sabtu'];
      const labels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const dateObj = new Date(this.selectedDate);
      this.dateStr = this.formatDate(this.selectedDate);
      this.dayName = days[dateObj.getDay()];
      this.dayLabel = labels[dateObj.getDay()] + ', ' + this.dateStr;
    },

    formatDate(dateStr) {
      const p = dateStr.split('-');
      return `${p[2]}/${p[1]}/${p[0]}`;
    },

    randomQuote() {
      return QUOTES[Math.floor(Math.random() * QUOTES.length)];
    },

    calculateAnniversary() {
      // Ganti dengan tanggal mulai hubungan kamu
      // Contoh: 1 Januari 2024 → 2024-01-01
      const start = new Date('2026-06-28');
      const now = new Date();
      const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : null;
    },

    calculateInternshipCountdown() {
      const start = new Date(2026, 5, 22);   // 22 Juni 2026 (Senin)
      const end   = new Date(2026, 7, 14);    // 14 Agustus 2026 (Jumat)
      const totalWorkingDays = 40;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (today > end) {
        return { remaining: 0, total: totalWorkingDays, completed: totalWorkingDays, done: true };
      }

      const actualStart = today < start ? start : today;
      let remaining = 0;
      const cursor = new Date(actualStart);
      while (cursor <= end) {
        const day = cursor.getDay();
        if (day !== 0 && day !== 6) remaining++;
        cursor.setDate(cursor.getDate() + 1);
      }

      let completed = 0;
      const completedCursor = new Date(start);
      while (completedCursor < actualStart) {
        const day = completedCursor.getDay();
        if (day !== 0 && day !== 6) completed++;
        completedCursor.setDate(completedCursor.getDate() + 1);
      }

      return { remaining, total: totalWorkingDays, completed, done: false };
    },

    loadDay() {
      if (!this.firebaseReady) return;
      this.updateDateStrings();
      this.loading = true;
      this.loadSuggestions();
      this.loadTemplates();
      if (!this.showTemplateModal) {
        this.loadScheduleSuggestions();
      }

      // Unsubscribe previous listener
      if (this.unsubscribe) this.unsubscribe();

      const { doc, onSnapshot } = window.FirebaseHelpers;
      const docRef = doc(window.FirebaseHelpers.db, 'days', this.selectedDate);

      // Real-time listener
      this.unsubscribe = onSnapshot(docRef, (snap) => {
        // Skip snapshot jika update lokal sedang berlangsung (cegah race condition)
        if (this._localUpdating) return;

        console.log('SNAP EXISTS VALUE:', snap?.exists);
        if (snap && snap.exists) {
          const data = snap.data();
          this.checklist = data.checklist || [];
          this.schedule = data.schedule || [];
          this.checkPastSchedules();
          this.loading = false;
        } else if (snap) {
          // Hanya reset data saat initial load, bukan saat snapshot "catch up"
          if (this.loading) {
            console.log('Inisialisasi data untuk tanggal:', this.selectedDate);
            this.checklist = [];
            this.schedule = [];
          }
          this.loading = false;
        } else {
          console.warn('Snapshot null, fallback ke mode offline');
          this.checklist = [];
          this.schedule = [];
          this.loading = false;
        }
        this.checkForConfetti();
      }, (error) => {
        console.error('Firestore error:', error);
        this.loading = false;
      });
    },

    checkPastSchedules() {
      const now = new Date();
      const today = this.selectedDate;
      this.schedule = this.schedule.map(item => {
        const itemDate = new Date(`${today}T${item.time}`);
        return { ...item, past: itemDate < now };
      });
    },

    shiftDay(delta) {
      const d = new Date(this.selectedDate);
      d.setDate(d.getDate() + delta);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      this.selectedDate = `${y}-${m}-${day}`;
      this.loadDay();
    },

    goToday() {
      this.selectedDate = this.todayStr;
      this.loadDay();
    },

    /* --- Checklist Functions --- */
    addItem() {
      const trimmed = this.newItem.trim();
      if (!trimmed) return;
      const { doc, setDoc } = window.FirebaseHelpers;
      const docRef = doc(window.FirebaseHelpers.db, 'days', this.selectedDate);
      const newItem = {
        id: Date.now(),
        text: trimmed,
        done: false
      };
      const updated = [...this.checklist, newItem];
      this._localUpdating = true;
      this.checklist = updated; // update lokal dulu → langsung muncul di UI
      setDoc(docRef, { checklist: updated }, { merge: true }).then(() => {
        this._localUpdating = false;
      }).catch(() => {
        this._localUpdating = false;
      });
      this.newItem = '';
      this.saveToCatalog(trimmed); // simpan ke katalog
    },

    toggleItem(idx) {
      const { doc, setDoc } = window.FirebaseHelpers;
      const docRef = doc(window.FirebaseHelpers.db, 'days', this.selectedDate);
      this._localUpdating = true;
      this.checklist = this.checklist.map((it, i) =>
        i === idx ? { ...it, done: !it.done } : it
      );
      setDoc(docRef, { checklist: this.checklist }, { merge: true }).then(() => {
        this._localUpdating = false;
      }).catch(() => {
        this._localUpdating = false;
      });
      this.checkForConfetti();
    },

    deleteItem(idx) {
      const { doc, setDoc } = window.FirebaseHelpers;
      const docRef = doc(window.FirebaseHelpers.db, 'days', this.selectedDate);
      const updated = this.checklist.filter((_, i) => i !== idx); // buat array baru
      this._localUpdating = true;
      this.checklist = updated;
      setDoc(docRef, { checklist: updated }, { merge: true }).then(() => {
        this._localUpdating = false;
      }).catch(() => {
        this._localUpdating = false;
      });
    },

    /* --- Schedule Functions --- */
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
      // Sort by time
      updated.sort((a, b) => a.time.localeCompare(b.time));
      this.schedule = updated;
      this.checkPastSchedules();
      setDoc(docRef, { schedule: updated }, { merge: true });
      this.newSchedTime = '';
      this.newSchedText = '';
      this.newSchedNote = '';
    },

    deleteSchedule(idx) {
      const { doc, setDoc } = window.FirebaseHelpers;
      const docRef = doc(window.FirebaseHelpers.db, 'days', this.selectedDate);
      const updated = this.schedule.filter((_, i) => i !== idx); // buat array baru
      this.schedule = updated;
      setDoc(docRef, { schedule: updated }, { merge: true });
    },

    /* --- Confetti --- */
    checkForConfetti() {
      const done = this.checklist.filter(i => i.done).length;
      if (done > 0 && done === this.checklist.length) {
        try { confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f06a7a', '#7fc7b6', '#c7b4f0', '#f7e9c7']
        }); } catch (e) { /* confetti error harmless */ }
      }
    },

    get doneCount() {
      return this.checklist.filter(i => i.done).length;
    },

    /* ====== Suggestion Engine ====== */

    // Simpan item ke katalog otomatis waktu ditambah
    saveToCatalog(itemText) {
      const { getDoc, doc, setDoc, serverTimestamp } = window.FirebaseHelpers;
      const catRef = doc(window.FirebaseHelpers.db, 'catalog', itemText.toLowerCase().trim());

      getDoc(catRef).then((snap) => {
        if (snap.exists) {
          const data = snap.data();
          setDoc(catRef, {
            count: (data.count || 0) + 1,
            lastUsed: new Date().toISOString().split('T')[0],
            text: itemText.trim()
          }, { merge: true });
        } else {
          setDoc(catRef, {
            count: 1,
            lastUsed: new Date().toISOString().split('T')[0],
            text: itemText.trim()
          });
        }
      }).catch((err) => console.warn('Katalog save error:', err));
    },

    // Ambil barang-barang dari kemarin
    getYesterdayItems() {
      const d = new Date(this.selectedDate);
      d.setDate(d.getDate() - 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const yesterdayStr = `${y}-${m}-${day}`;

      const { getDoc, doc } = window.FirebaseHelpers;
      const docRef = doc(window.FirebaseHelpers.db, 'days', yesterdayStr);

      return getDoc(docRef).then((snap) => {
        if (snap && snap.exists) {
          const data = snap.data();
          return (data.checklist || []).map(i => i.text);
        }
        return [];
      }).catch(() => []);
    },

    // Ambil barang favorit (paling sering dipake) dari katalog
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

    // Muat saran — milah dari kemarin + favorit
    loadSuggestions() {
      this.suggestions = [];
      this.loadingSuggestions = true;

      Promise.all([
        this.getYesterdayItems(),
        this.getFavoriteItems()
      ]).then(([yesterday, favorites]) => {
        const seen = new Set();
        const result = [];

        // Prioritaskan barang kemarin
        yesterday.forEach(text => {
          const t = text.trim();
          if (t && !seen.has(t.toLowerCase())) {
            seen.add(t.toLowerCase());
            result.push({ text: t, type: 'kemarin' });
          }
        });

        // Tambah favorit yang belum ada
        favorites.forEach(text => {
          const t = text.trim();
          if (t && !seen.has(t.toLowerCase())) {
            seen.add(t.toLowerCase());
            result.push({ text: t, type: 'favorit' });
          }
        });

        // Cek & sisihkan yg udah ada di checklist hari ini
        const existing = new Set(this.checklist.map(i => i.text.toLowerCase()));
        this.suggestions = result.filter(s => !existing.has(s.text.toLowerCase()));

        this.loadingSuggestions = false;
      }).catch(() => {
        this.loadingSuggestions = false;
      });
    },

    // Tambah saran ke checklist
    addSuggestion(text) {
      const trimmed = text.trim();
      if (!trimmed) return;
      const { doc, setDoc } = window.FirebaseHelpers;
      const docRef = doc(window.FirebaseHelpers.db, 'days', this.selectedDate);
      const newItem = {
        id: Date.now(),
        text: trimmed,
        done: false
      };
      const updated = [...this.checklist, newItem];
      this._localUpdating = true;
      this.checklist = updated;
      setDoc(docRef, { checklist: updated }, { merge: true }).then(() => {
        this._localUpdating = false;
      }).catch(() => {
        this._localUpdating = false;
      });
      // Hapus dari suggestions
      this.suggestions = this.suggestions.filter(s => s.text.toLowerCase() !== text.toLowerCase());
      this.saveToCatalog(text);
    },

    logout() {
      if (this.unsubscribe) this.unsubscribe();
      window.logoutUser();
    },

    /* ====== SCHEDULE TEMPLATE FUNCTIONS ====== */

    // Load templates untuk semua hari (dari Firestore saat pertama kali)
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

    // Nama field hari dari angka (0=Minggu)
    dayNameFromIndex(idx) {
      const MAP = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
      return MAP[idx % 7];
    },

    // Dapatkan nama template untuk hari ini (berdasarkan selectedDate)
    get templateForToday() {
      const dayIdx = new Date(this.selectedDate).getDay();
      // getDay(): 0=Minggu, 1=Senin, ..., 6=Sabtu
      const MAP = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
      return MAP[dayIdx];
    },

    // Cek apakah ada template untuk hari ini
    get hasTemplateForToday() {
      const t = this.templateForToday;
      return this.templates[t] && this.templates[t].length > 0;
    },

    // Ambil template schedule untuk suatu hari
    getTemplateByDay(dayName) {
      return this.templates[dayName] || [];
    },

    // Tambah item ke template (sementara, sebelum simpan)
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
      // Sort by time
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

    // Buka modal template & load data
    openTemplateModal() {
      this.loadTemplates();
      this.templateActiveDay = this.templateForToday;
      this.showTemplateModal = true;
    },

    // Terapkan template hari ini ke jadwal hari ini
    applyTemplate() {
      const dayName = this.templateForToday;
      const tmpl = this.templates[dayName];
      if (!tmpl || !tmpl.length) return;

      const { doc, setDoc } = window.FirebaseHelpers;
      const docRef = doc(window.FirebaseHelpers.db, 'days', this.selectedDate);

      // Ambil item yang belum ada (berdasarkan time+text)
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

    /* ====== COPY SCHEDULE FUNCTIONS ====== */

    // Buka modal copy
    openCopyModal() {
      // Set default: kemarin
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
          time: t.time,
          text: t.text,
          note: t.note || '',
          past: false
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

    /* ====== SCHEDULE SUGGESTIONS ====== */

    // Ambil jadwal dari N hari terakhir untuk saran
    loadScheduleSuggestions() {
      this.scheduleSuggestions = [];
      this.loadingSchedSuggestions = true;

      const promises = [];
      const existingKeys = new Set(this.schedule.map(s => s.time + '|' + s.text.toLowerCase()));

      // Lihat 7 hari ke belakang dari selectedDate (kecuali hari ini)
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
          // Filter item yang belum ada di hari ini
          const freshItems = r.items.filter(
            it => !existingKeys.has(it.time + '|' + it.text.toLowerCase())
          );
          if (!freshItems.length) continue;

          // Kelompokkan per hari
          for (const item of freshItems) {
            if (this.scheduleSuggestions.length >= 8) break resultLoop;
            this.scheduleSuggestions.push({
              date: r.date,
              dayName: r.dayName,
              time: item.time,
              text: item.text,
              note: item.note
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
            time: s.time,
            text: s.text,
            note: s.note || ''
          }));
        }
        return [];
      }).catch(() => []);
    },

    // Tambah saran jadwal ke hari ini
    addScheduleSuggestion(item) {
      // Cegah duplikat
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
        time: item.time,
        text: item.text,
        note: item.note || '',
        past: false
      };
      const updated = [...this.schedule, newItem];
      updated.sort((a, b) => a.time.localeCompare(b.time));
      this.schedule = updated;
      this.checkPastSchedules();
      setDoc(docRef, { schedule: updated }, { merge: true }).catch((err) => {
        console.warn('Gagal tambah saran jadwal:', err);
      });
      // Hapus dari saran
      this.scheduleSuggestions = this.scheduleSuggestions.filter(
        s => !(s.time === item.time && s.text.toLowerCase() === item.text.toLowerCase())
      );
    },

    // Muat saran jadwal (dipanggil dari loadDay)
    loadScheduleRelated() {
      // Cek apakah ada template untuk hari yang sedang dibuka
      this.loadScheduleSuggestions();
    }
  }
}