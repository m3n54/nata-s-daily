/* ============================================================
   countdowns.js — Multiple custom countdowns / countups
   Data disimpan di Firestore collection: countdowns/{docId}
   Tampil sebagai compact chips di antara mood & 2-col layout
   ============================================================ */

window.DailyApp = window.DailyApp || {};
DailyApp.countdowns = {

  /* --- State (dideklarasikan juga di main.js) --- */
  countdowns: [],
  showCountdownModal: false,
  newCdTitle: '',
  newCdEmoji: '🎯',
  newCdDate: '',
  newCdType: 'countdown',

  /* --- Load countdowns dari Firestore --- */
  loadCountdowns() {
    FirebaseHelpers.db.collection('countdowns')
      .get()
      .then((snap) => {
        const items = [];
        snap.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        // Sort manual: newest first
        items.sort((a, b) => {
          const ta = a.createdAt ? a.createdAt.toMillis() : 0;
          const tb = b.createdAt ? b.createdAt.toMillis() : 0;
          return tb - ta;
        });
        this.countdowns = items;
      })
      .catch((err) => {
        console.warn('Gagal load countdowns:', err);
      });
  },

  /* --- Kalkulasi jumlah hari --- */
  calcCountdownDays(targetDate, type) {
    if (!targetDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(targetDate + 'T00:00:00');
    const diffTime = target - now;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (type === 'countup') {
      const elapsed = Math.abs(diffDays);
      return { days: elapsed, label: 'hari lalu', past: diffDays < 0 };
    }

    // countdown
    if (diffDays < 0) {
      return { days: Math.abs(diffDays), label: 'hari yang lalu 🎉', past: true };
    }
    if (diffDays === 0) {
      return { days: 0, label: 'Hari ini! 🎉', past: false };
    }
    return { days: diffDays, label: 'hari lagi', past: false };
  },

  /* --- Open modal management --- */
  openCountdownModal() {
    this.newCdTitle = '';
    this.newCdEmoji = '🎯';
    this.newCdDate = '';
    this.newCdType = 'countdown';
    this.showCountdownModal = true;
  },

  closeCountdownModal() {
    this.showCountdownModal = false;
  },

  /* --- Tambah countdown baru --- */
  addCountdown() {
    const title = this.newCdTitle.trim();
    if (!title || !this.newCdDate) return;

    const data = {
      title: title,
      emoji: this.newCdEmoji || '🎯',
      targetDate: this.newCdDate,
      type: this.newCdType,
      createdAt: FirebaseHelpers.serverTimestamp(),
    };

    FirebaseHelpers.db.collection('countdowns').add(data)
      .then(() => {
        this.newCdTitle = '';
        this.newCdEmoji = '🎯';
        this.newCdDate = '';
        this.newCdType = 'countdown';
        this.loadCountdowns();
      })
      .catch((err) => {
        console.warn('Gagal simpan countdown:', err);
      });
  },

  /* --- Hapus countdown --- */
  deleteCountdown(id) {
    FirebaseHelpers.db.collection('countdowns').doc(id).delete()
      .then(() => {
        this.countdowns = this.countdowns.filter(c => c.id !== id);
      })
      .catch((err) => {
        console.warn('Gagal hapus countdown:', err);
      });
  },
};
