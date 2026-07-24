/* ============================================================
   inspirations.js — Kata semangat + gambar (custom quotes)
   collection Firestore: inspirations/{docId}
   ============================================================ */

window.DailyApp = window.DailyApp || {};
DailyApp.inspirations = {
  /* --- State --- */
  showInspirationPopup: false,
  currentInspiration: null,
  showManageInspirations: false,
  inspirationsList: [],

  /* --- Form state --- */
  newInspText: '',
  newInspImageUrl: '',

  /* --- Daily trigger init (dipanggil dari main.js init) --- */
  checkDailyInspiration() {
    const today = this.todayStr;
    const lastShown = localStorage.getItem('lastInspirationDate');

    if (lastShown !== today) {
      // Belum muncul hari ini → tampilkan
      this.showRandomInspiration(() => {
        localStorage.setItem('lastInspirationDate', today);
      });
    }
  },

  /* --- Seed default inspirations (pertama kali aja) --- */
  _seedDefaultInspirations() {
    const defaults = [
      {
        text: 'Semangat hari ini! Kamu hebat dan aku bangga 🫶',
        imageUrl: 'https://6a62e6126ba67c0bc5fe42c2.imgix.net/sandbox/nataaa.jpeg',
        active: true,
        createdAt: FirebaseHelpers.serverTimestamp()
      },
      {
        text: 'Jangan lupa makan dan minum ya sayang 💕',
        imageUrl: '',
        active: true,
        createdAt: FirebaseHelpers.serverTimestamp()
      },
      {
        text: 'One step at a time. Kita jalani bareng-bareng 🥰',
        imageUrl: 'https://6a62e6126ba67c0bc5fe42c2.imgix.net/sandbox/nataaa.jpeg',
        active: true,
        createdAt: FirebaseHelpers.serverTimestamp()
      },
      {
        text: 'Semua akan baik-baik saja, aku di sini untukmu 🤗',
        imageUrl: '',
        active: true,
        createdAt: FirebaseHelpers.serverTimestamp()
      },
    ];

    const batch = FirebaseHelpers.db.batch();
    defaults.forEach((data) => {
      const ref = FirebaseHelpers.db.collection('inspirations').doc();
      batch.set(ref, data);
    });
    return batch.commit();
  },

  /* --- Ambil semua inspirasi dari Firestore --- */
  loadInspirations(callback) {
    FirebaseHelpers.db.collection('inspirations')
      .where('active', '==', true)
      .get()
      .then((snap) => {
        const items = [];
        snap.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });

        // First time — seed default inspirations
        if (items.length === 0) {
          console.log('🌱 Belum ada inspirasi, seeding defaults...');
          return this._seedDefaultInspirations().then(() => {
            // Reload setelah seed
            return FirebaseHelpers.db.collection('inspirations')
              .where('active', '==', true).get().then((snap2) => {
                const newItems = [];
                snap2.forEach((doc) => {
                  newItems.push({ id: doc.id, ...doc.data() });
                });
                newItems.sort((a, b) => {
                  const ta = a.createdAt ? a.createdAt.toMillis() : 0;
                  const tb = b.createdAt ? b.createdAt.toMillis() : 0;
                  return tb - ta;
                });
                this.inspirationsList = newItems;
                if (callback) callback(newItems);
              });
          });
        }
        // Sort: newest first
        items.sort((a, b) => {
          const ta = a.createdAt ? a.createdAt.toMillis() : 0;
          const tb = b.createdAt ? b.createdAt.toMillis() : 0;
          return tb - ta;
        });
        this.inspirationsList = items;
        if (callback) callback(items);
      })
      .catch((err) => {
        console.warn('Gagal muat inspirasi:', err);
        if (callback) callback([]);
      });
  },

  /* --- Tampilkan random inspirasi --- */
  showRandomInspiration(callback) {
    this.loadInspirations((items) => {
      if (!items.length) {
        // Fallback ke quotes statis dari utils
        const fallback = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        this.currentInspiration = { text: fallback, imageUrl: '' };
        this.showInspirationPopup = true;
        if (callback) callback();
        return;
      }

      // Pilih random, pastikan beda dari yang terakhir (kalau ada lebih dari 1)
      let selected;
      const lastText = localStorage.getItem('lastInspirationText');

      if (items.length === 1) {
        selected = items[0];
      } else {
        const filtered = items.filter(i => i.text !== lastText);
        const pool = filtered.length > 0 ? filtered : items;
        selected = pool[Math.floor(Math.random() * pool.length)];
      }

      this.currentInspiration = { text: selected.text, imageUrl: selected.imageUrl || '' };
      this.showInspirationPopup = true;
      localStorage.setItem('lastInspirationText', selected.text);
      if (callback) callback();
    });
  },

  /* --- Tampilkan inspirasi manual (dari tombol) --- */
  showManualInspiration() {
    this.showRandomInspiration();
  },

  /* --- Tutup popup --- */
  closeInspiration() {
    this.showInspirationPopup = false;
  },

  /* --- Buka modal management inspirasi --- */
  openManageInspirations() {
    this.showManageInspirations = true;
    this.newInspText = '';
    this.newInspImageUrl = '';
    this.loadInspirations();
  },

  /* --- Tutup modal management --- */
  closeManageInspirations() {
    this.showManageInspirations = false;
  },

  /* --- Tambah inspirasi baru ke Firestore --- */
  addInspiration() {
    const text = this.newInspText.trim();
    if (!text) return;

    const data = {
      text: text,
      imageUrl: this.newInspImageUrl.trim() || '',
      active: true,
      createdAt: FirebaseHelpers.serverTimestamp()
    };

    FirebaseHelpers.db.collection('inspirations').add(data)
      .then(() => {
        this.newInspText = '';
        this.newInspImageUrl = '';
        this.loadInspirations();
      })
      .catch((err) => {
        console.warn('Gagal simpan inspirasi:', err);
        alert('Gagal menyimpan 😔 coba lagi ya');
      });
  },

  /* --- Hapus inspirasi dari Firestore --- */
  deleteInspiration(id) {
    if (!confirm('Hapus kata semangat ini?')) return;

    FirebaseHelpers.db.collection('inspirations').doc(id).delete()
      .then(() => {
        this.inspirationsList = this.inspirationsList.filter(i => i.id !== id);
      })
      .catch((err) => {
        console.warn('Gagal hapus inspirasi:', err);
      });
  },
};
