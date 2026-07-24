/* ============================================================
   main.js — Alpine component utama (gabung semua modul)
   ============================================================ */

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
    _localUpdating: false,

    /* --- Suggestion state --- */
    suggestions: [],
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

    /* --- Edit Schedule state --- */
    editIdx: -1,
    editTime: '',
    editText: '',
    editNote: '',
    showEditModal: false,

    /* --- Copy Schedule state --- */
    showCopyModal: false,
    copySourceDate: '',

    /* --- Schedule Suggestions state --- */
    scheduleSuggestions: [],
    loadingSchedSuggestions: false,

    /* --- Inspiration state --- */
    showInspirationPopup: false,
    currentInspiration: null,
    showManageInspirations: false,
    inspirationsList: [],
    newInspText: '',
    newInspImageUrl: '',

    /* --- Init & Lifecycle --- */
    init() {
      console.log('App Alpine initialization...');
      this.setToday();
      this.dailyQuote = this.randomQuote();
      this.anniversaryDays = this.calculateAnniversary();
      this.internship = this.calculateInternshipCountdown();
      this.waitForFirebase();

      // Cek apakah perlu tampilkan popup inspirasi hari ini (setelah Firebase ready)
      const checkInsp = () => {
        if (window.FIREBASE_READY) {
          this.checkDailyInspiration();
        } else {
          window.addEventListener('firebase-ready', () => this.checkDailyInspiration(), { once: true });
        }
      };
      checkInsp();
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
      const start = new Date('2026-06-28');
      const now = new Date();
      const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : null;
    },

    calculateInternshipCountdown() {
      const start = new Date(2026, 5, 22);
      const end   = new Date(2026, 7, 14);
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

      if (this.unsubscribe) this.unsubscribe();

      const { doc, onSnapshot } = window.FirebaseHelpers;
      const docRef = doc(window.FirebaseHelpers.db, 'days', this.selectedDate);

      this.unsubscribe = onSnapshot(docRef, (snap) => {
        if (this._localUpdating) return;

        console.log('SNAP EXISTS VALUE:', snap?.exists);
        if (snap && snap.exists) {
          const data = snap.data();
          this.checklist = data.checklist || [];
          this.schedule = data.schedule || [];
          this.checkPastSchedules();
          this.loading = false;
        } else if (snap) {
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
        this.newItem = '';
        this.saveToCatalog(trimmed);
      }).catch(() => {
        this.saveToCatalog(trimmed);
      });
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
      const updated = this.checklist.filter((_, i) => i !== idx);
      this._localUpdating = true;
      this.checklist = updated;
      setDoc(docRef, { checklist: updated }, { merge: true }).then(() => {
        this._localUpdating = false;
      }).catch(() => {
        this._localUpdating = false;
      });
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

    /* --- Nama hari dari index --- */
    dayNameFromIndex(idx) {
      const MAP = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
      return MAP[idx % 7];
    },

    /* --- Template helpers (getter tetap di main) --- */
    get templateForToday() {
      const dayIdx = new Date(this.selectedDate).getDay();
      const MAP = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
      return MAP[dayIdx];
    },

    get hasTemplateForToday() {
      const t = this.templateForToday;
      return this.templates[t] && this.templates[t].length > 0;
    },

    getTemplateByDay(dayName) {
      return this.templates[dayName] || [];
    },

    /* --- Logout --- */
    logout() {
      if (this.unsubscribe) this.unsubscribe();
      window.logoutUser();
    },

    /* ====== Gabung method dari file lain ====== */
    ...DailyApp.utils,
    ...DailyApp.catalog,
    ...DailyApp.suggestions,
    ...DailyApp.schedule,
    ...DailyApp.templates,
    ...DailyApp.schedSuggestions,
    ...DailyApp.copy,
    ...DailyApp.inspirations,
  };
}
