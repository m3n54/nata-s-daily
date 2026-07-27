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

    /* --- Greeting --- */
    greeting: '',

    /* --- Dark Mode --- */
    darkMode: false,

    setGreeting() {
      const h = new Date().getHours();
      if (h >= 3 && h < 11) this.greeting = 'Selamat pagi ☀️';
      else if (h >= 11 && h < 15) this.greeting = 'Selamat siang 🌤️';
      else if (h >= 15 && h < 18) this.greeting = 'Selamat sore 🌅';
      else this.greeting = 'Selamat malam 🌙';
    },

    toggleDark() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('darkMode', this.darkMode);
      if (this.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    },

    /* --- Countdowns state --- */
    countdowns: [],
    showCountdownModal: false,
    newCdTitle: '',
    newCdEmoji: '🎯',
    newCdDate: '',
    newCdType: 'countdown',
    editingCdId: null,
    editingCd: false,

    /* --- Emoji picker state --- */
    showEmojiPicker: false,
    emojiPickerTarget: null,
    emojiSearch: '',
    emojiActiveCategory: 'Smiley',
    moodEmojiPickKey: null,

    /* --- Anniversary Popup state --- */
    showAnniversaryPopup: false,
    anniversaryRange: false,

    /* --- Inspiration state --- */
    showInspirationPopup: false,
    currentInspiration: null,
    showManageInspirations: false,
    inspirationsList: [],
    newInspText: '',
    newInspImageUrl: '',
    newInspEmoji: '💬',

    /* --- Mood Tracker state --- */
    moods: {},
    showWeeklyRecap: false,
    weeklyRecapData: null,
    weeklyRecapLoading: false,
    showMoodCustomize: false,
    moodCustomEmojis: {},
    MOOD_LIST: [
      { key: 'happy',    emoji: '😊',  label: 'Happy' },
      { key: 'love',     emoji: '🥰',  label: 'Love' },
      { key: 'excited',  emoji: '🎉',  label: 'Excited' },
      { key: 'motivated',emoji: '💪',  label: 'Motivated' },
      { key: 'grateful', emoji: '🤗',  label: 'Grateful' },
      { key: 'dino',     emoji: '🦖',  label: 'Natasaurus Roarrr' },
      { key: 'meh',      emoji: '😐',  label: 'Meh' },
      { key: 'tired',    emoji: '😴',  label: 'Tired' },
      { key: 'anxious',  emoji: '😰',  label: 'Anxious' },
      { key: 'sad',      emoji: '😢',  label: 'Sad' },
      { key: 'angry',    emoji: '😡',  label: 'Angry' },
    ],
    newInspText: '',
    newInspImageUrl: '',
    newInspEmoji: '💬',

    /* --- Init & Lifecycle --- */
    init() {
      /* --- Dark mode init --- */
      this.darkMode = localStorage.getItem('darkMode') === 'true';
      if (this.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }

      console.log('App Alpine initialization...');
      this.setToday();
      this.dailyQuote = this.randomQuote();
      this.anniversaryDays = this.calculateAnniversary();
      this.internship = this.calculateInternshipCountdown();
      this.setGreeting();
      this.initCustomEmojis();
      this.checkAnniversary();
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
          this.loadCountdowns();
          this.loadDay();
        } else {
          window.addEventListener('firebase-ready', () => {
            this.firebaseReady = true;
            this.loadCountdowns();
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
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const start = new Date(2026, 5, 28); // 28 Juni 2026 local time
      const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 ? diffDays : null;
    },

    /* --- Anniversary 1-month popup --- */
    checkAnniversary() {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const start = new Date(2026, 5, 28);
      const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
      this.anniversaryRange = diffDays >= 30;
      if (this.anniversaryRange) {
        const shown = localStorage.getItem('anniversaryShown');
        if (shown !== this.todayStr) {
          setTimeout(() => {
            this.showAnniversaryPopup = true;
            setTimeout(() => this.fireAnniversaryConfetti(), 300);
          }, 800);
        }
      }
    },

    fireAnniversaryConfetti() {
      try {
        const duration = 3000;
        const end = Date.now() + duration;
        const frame = () => {
          confetti({
            particleCount: 6,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.7 },
            colors: ['#f06a7a', '#7fc7b6', '#c7b4f0', '#f7e9c7', '#ffd700'],
          });
          confetti({
            particleCount: 6,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.7 },
            colors: ['#f06a7a', '#7fc7b6', '#c7b4f0', '#f7e9c7', '#ffd700'],
          });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
        // Big burst at start
        setTimeout(() => {
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.5 },
            colors: ['#f06a7a', '#ffd700', '#c7b4f0', '#7fc7b6', '#ffffff'],
          });
        }, 100);
      } catch (e) { /* confetti error harmless */ }
    },

    closeAnniversaryPopup() {
      this.showAnniversaryPopup = false;
      localStorage.setItem('anniversaryShown', this.todayStr);
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
          this.checklist = this._sortChecklist(data.checklist || []);
          this.schedule = data.schedule || [];
          this.moods = data.moods || {};
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
        const newItem = { id: Date.now(), text: displayText, done: false, priority: false };
        const updated = this._sortChecklist([...this.checklist, newItem]);
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

    togglePriority(idx) {
      const { doc, setDoc } = window.FirebaseHelpers;
      const docRef = doc(window.FirebaseHelpers.db, 'days', this.selectedDate);
      this._localUpdating = true;
      this.checklist = this.checklist.map((it, i) =>
        i === idx ? { ...it, priority: !it.priority } : it
      );
      this.checklist = this._sortChecklist(this.checklist);
      setDoc(docRef, { checklist: this.checklist }, { merge: true }).then(() => {
        this._localUpdating = false;
      }).catch(() => {
        this._localUpdating = false;
      });
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

    _sortChecklist(arr) {
      return [...arr].sort((a, b) => {
        if (a.priority && !b.priority) return -1;
        if (!a.priority && b.priority) return 1;
        return (a.id || 0) - (b.id || 0);
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
    ...DailyApp.moods,
    ...DailyApp.countdowns,
    ...DailyApp.emojiPicker,
  };
}
