# Weekly Ringkasan Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a weekly ringkasan dashboard section below mood tracker showing checklist completion, mood recap, schedule stats, and streak — manual toggle only.

**Architecture:** New section in index.html below mood tracker card, toggled by `showWeeklySummary` state. Data fetched via `_getDayData()` that reads all 3 data types from Firestore for last 7 days. Computed aggregate in `openWeeklySummary()` method.

**Tech Stack:** Alpine.js 3.x, Firebase Firestore compat, vanilla CSS

## Global Constraints

- All state in main.js `app()` return object
- Use `window.FirebaseHelpers` for Firestore ops
- Internal date format `YYYY-MM-DD`
- Don't modify existing sections layout
- Version bump all changed script/style links

---

### Task 1: Fix existing Weekly Recap Mood modal

**Files:**
- Modify: `js/moods.js:72-152`
- Modify: `style.css:1307-1309`
- Modify: `style.css` (add `.recap-content`)
- Modify: `index.html:458-540`

**Interfaces:**
- Consumes: `this.showWeeklyRecap`, `this.weeklyRecapLoading`, `this.weeklyRecapData`, `this.MOOD_LIST`, `this.moodCustomEmojis`, `this.selectedDate`, `this._getDayMoods()`, `this.dayNameFromIndex()`
- Produces: Working weekly recap modal with proper styling and error handling

- [ ] **Step 1: Add `.recap-content` CSS + fix modal scroll**

In `style.css`, after `.recap-modal { max-width: 520px; }` add:
```css
.recap-content {
  padding: 0 4px 8px;
}
```
Also change `.recap-modal` to:
```css
.recap-modal {
  max-width: 520px;
  max-height: 80vh;
  overflow-y: auto;
}
```

- [ ] **Step 2: Fix dominant mood null safety in moods.js**

In `js/moods.js`, function `openWeeklyRecap()`, change the dominant mood computation:
```js
let dominant = null;
let maxCount = 0;
this.MOOD_LIST.forEach(m => {
  if ((totals[m.key] || 0) > maxCount) {
    maxCount = totals[m.key];
    dominant = { ...m, emoji: this.moodCustomEmojis[m.key] || m.emoji, count: maxCount };
  }
});
```
Keep as is — the bug is in the template. In `index.html`, wrap dominant section with `x-if`:
```html
<template x-if="weeklyRecapData.dominant">
  <div class="recap-dominant">
    ...
  </div>
</template>
<template x-if="!weeklyRecapData.dominant && weeklyRecapData.grandTotal > 0">
  <div class="recap-dominant">
    <span class="recap-dominant-label">Minggu ini kamu merasa</span>
    <span class="recap-dominant-mood">beragam 💫</span>
  </div>
</template>
```

- [ ] **Step 3: Add catch to Promise.all in weekly recap**

In `js/moods.js`, after `Promise.all(promises).then(...)` add `.catch`:
```js
.catch(() => {
  this.weeklyRecapLoading = false;
});
```
(Already exists at line 132, good.)

- [ ] **Step 4: Version bump**

In `index.html`:
- `js/moods.js?v=2` → `js/moods.js?v=3`
- `style.css?v=3` → `style.css?v=4`

---

### Task 2: Add `_getDayData` helper & weekly summary state

**Files:**
- Modify: `js/moods.js` (add `_getDayData` helper)
- Modify: `js/main.js` (add state: `showWeeklySummary`, `weeklySummaryData`, `weeklySummaryLoading` + `openWeeklySummary()` method)

**Interfaces:**
- Consumes: `window.FirebaseHelpers.getDoc`, `window.FirebaseHelpers.doc`
- Produces: `_getDayData(dateStr)` returning `{ moods, checklist, schedule }`
- Produces: `weeklySummaryData` object used by later tasks

- [ ] **Step 1: Add `_getDayData` helper to moods.js**

```js
/* --- Get all day data for ringkasan --- */
_getDayData(dateStr) {
  const { getDoc, doc } = window.FirebaseHelpers;
  const ref = doc(window.FirebaseHelpers.db, 'days', dateStr);
  return getDoc(ref).then((snap) => {
    if (snap && snap.exists) {
      const data = snap.data();
      return {
        moods: data.moods || {},
        checklist: data.checklist || [],
        schedule: data.schedule || [],
      };
    }
    return { moods: {}, checklist: [], schedule: [] };
  }).catch(() => ({ moods: {}, checklist: [], schedule: [] }));
},
```

- [ ] **Step 2: Add weekly summary state to main.js**

In `app()` return object, after the anniversary/range state (line 98-99), add:
```js
/* --- Weekly Summary state --- */
showWeeklySummary: false,
weeklySummaryData: null,
weeklySummaryLoading: false,
```

- [ ] **Step 3: Add `openWeeklySummary` method to main.js**

```js
/* --- Weekly Summary --- */
openWeeklySummary() {
  this.showWeeklySummary = !this.showWeeklySummary;
  if (!this.showWeeklySummary || this.weeklySummaryData) return;

  this.weeklySummaryLoading = true;
  this.weeklySummaryData = null;

  const promises = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    const dayIdx = d.getDay();
    promises.push(
      this._getDayData(dateStr).then((data) => ({
        date: dateStr,
        dayName: this.dayNameFromIndex(dayIdx),
        ...data,
      }))
    );
  }

  Promise.all(promises).then((days) => {
    // Sort newest first
    days.sort((a, b) => b.date.localeCompare(a.date));

    // Checklist stats
    let totalItems = 0;
    let totalDone = 0;
    let dayCountWithItems = 0;
    const checklistPerDay = days.map(day => {
      const items = day.checklist.length;
      const done = day.checklist.filter(i => i.done).length;
      if (items > 0) {
        totalItems += items;
        totalDone += done;
        dayCountWithItems++;
      }
      return {
        dayName: day.dayName,
        date: day.date,
        total: items,
        done,
        pct: items > 0 ? Math.round((done / items) * 100) : 0,
        allDone: items > 0 && done === items,
      };
    });

    const avgPct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

    // Mood aggregation
    const moodTotals = {};
    let moodGrandTotal = 0;
    days.forEach(day => {
      this.MOOD_LIST.forEach(m => {
        const val = day.moods[m.key] || 0;
        if (val > 0) {
          moodTotals[m.key] = (moodTotals[m.key] || 0) + val;
          moodGrandTotal += val;
        }
      });
    });

    let dominantMood = null;
    let maxMoodCount = 0;
    this.MOOD_LIST.forEach(m => {
      if ((moodTotals[m.key] || 0) > maxMoodCount) {
        maxMoodCount = moodTotals[m.key];
        dominantMood = {
          key: m.key,
          label: m.label,
          emoji: this.moodCustomEmojis[m.key] || m.emoji,
          count: maxMoodCount,
        };
      }
    });

    // Schedule stats
    let totalScheduled = 0;
    let totalMissed = 0;
    days.forEach(day => {
      totalScheduled += day.schedule.length;
      totalMissed += day.schedule.filter(i => i.past).length;
    });

    // Missed schedule items list
    const missedItems = [];
    days.forEach(day => {
      day.schedule.filter(i => i.past).forEach(item => {
        missedItems.push({
          time: item.time,
          text: item.text,
          dayName: day.dayName,
          date: day.date,
        });
      });
    });
    missedItems.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    // Streak: count consecutive days (from most recent) with at least 1 done item
    let streak = 0;
    for (const day of days) {
      if (day.checklist.some(i => i.done)) {
        streak++;
      } else {
        break;
      }
    }

    this.weeklySummaryData = {
      days: checklistPerDay,
      avgPct,
      totalItems,
      totalDone,
      dayCountWithItems,
      moodTotals,
      moodGrandTotal,
      dominantMood,
      totalScheduled,
      totalMissed,
      missedItems,
      streak,
      hasData: totalItems > 0 || moodGrandTotal > 0 || totalScheduled > 0,
    };
    this.weeklySummaryLoading = false;
  }).catch(() => {
    this.weeklySummaryLoading = false;
  });
},
```

- [ ] **Step 4: Version bump main.js**

`js/main.js?v=10` → `js/main.js?v=11`

---

### Task 3: Add toggle button in header

**Files:**
- Modify: `index.html` (add button in header-actions div)
- Modify: `style.css` (add `.btn-summary` style)

- [ ] **Step 1: Add button to header-actions**

In `index.html`, after the date-picker line (line 109), add:
```html
<button class="btn-summary" @click="openWeeklySummary()" :class="{ active: showWeeklySummary }">
  📊 <span class="btn-summary-label">Ringkasan</span>
</button>
```

- [ ] **Step 2: Add CSS for toggle button**

In `style.css`, add after the `.date-picker` styles:
```css
.btn-summary {
  background: var(--card-bg);
  border: 1.5px solid var(--accent);
  color: var(--text);
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  font-family: var(--font-head);
  font-size: 0.95rem;
  cursor: pointer;
  transition: var(--transition);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-summary:hover,
.btn-summary.active {
  background: var(--accent);
  color: #fff;
}
@media (max-width: 480px) {
  .btn-summary-label { display: none; }
}
```

---

### Task 4: Build Weekly Ringkasan Dashboard HTML

**Files:**
- Modify: `index.html` (add section after mood tracker, before countdowns card)
- Modify: `style.css` (add all dashboard styles)

- [ ] **Step 1: Add dashboard section HTML**

In `index.html`, after mood section closing `</section>` (line 184) and before countdowns card `<section class="card countdowns-card">` (line 186), insert:

```html
<!-- ====== WEEKLY RINGKASAN DASHBOARD ====== -->
<section class="weekly-summary" x-show="showWeeklySummary" x-cloak>
  <div class="ws-header">
    <h2>📊 Ringkasan Mingguan</h2>
    <span class="ws-subtitle" x-text="'7 hari terakhir'"></span>
  </div>

  <template x-if="weeklySummaryLoading">
    <div class="ws-loading">Menghitung data... 💭</div>
  </template>

  <template x-if="!weeklySummaryLoading && weeklySummaryData">
    <template x-if="!weeklySummaryData.hasData">
      <div class="ws-empty">
        <p>Belum ada data minggu ini 🕊️</p>
        <p class="small-hint">Isi checklist, mood, dan jadwal dulu ya!</p>
      </div>
    </template>

    <template x-if="weeklySummaryData.hasData">
      <div class="ws-content">
        <!-- 4 stat cards -->
        <div class="ws-cards">
          <div class="ws-card ws-card-checklist">
            <span class="ws-card-icon">✅</span>
            <span class="ws-card-value" x-text="weeklySummaryData.avgPct + '%'"></span>
            <span class="ws-card-label" x-text="weeklySummaryData.totalDone + '/' + weeklySummaryData.totalItems + ' selesai'"></span>
          </div>
          <div class="ws-card ws-card-mood" x-show="weeklySummaryData.dominantMood">
            <span class="ws-card-icon" x-text="weeklySummaryData.dominantMood?.emoji || '😊'"></span>
            <span class="ws-card-value" x-text="weeklySummaryData.dominantMood?.label || '—'"></span>
            <span class="ws-card-label" x-text="(weeklySummaryData.dominantMood?.count || 0) + 'x minggu ini'"></span>
          </div>
          <div class="ws-card ws-card-schedule" x-show="weeklySummaryData.totalScheduled > 0">
            <span class="ws-card-icon">⏰</span>
            <span class="ws-card-value" x-text="(weeklySummaryData.totalScheduled - weeklySummaryData.totalMissed) + '/' + weeklySummaryData.totalScheduled"></span>
            <span class="ws-card-label" x-text="'Tepat waktu'"></span>
          </div>
          <div class="ws-card ws-card-streak" x-show="weeklySummaryData.streak > 0">
            <span class="ws-card-icon">🔥</span>
            <span class="ws-card-value" x-text="weeklySummaryData.streak + ' hr'"></span>
            <span class="ws-card-label">Streak checklist</span>
          </div>
        </div>

        <!-- Checklist per day bars -->
        <div class="ws-section">
          <p class="ws-section-title">📋 Checklist per Hari</p>
          <template x-for="day in weeklySummaryData.days" :key="day.date">
            <div class="ws-bar-row" :class="{ 'ws-bar-perfect': day.allDone && day.total > 0 }">
              <span class="ws-bar-day" x-text="day.dayName"></span>
              <div class="ws-bar-track">
                <div class="ws-bar-fill" :style="'width:' + day.pct + '%'" :class="{ 'ws-bar-done': day.allDone && day.total > 0 }"></div>
              </div>
              <span class="ws-bar-pct" x-text="day.pct + '%'"></span>
              <span class="ws-bar-count" x-text="'(' + day.done + '/' + day.total + ')'"></span>
              <span class="ws-bar-star" x-show="day.allDone && day.total > 0">⭐</span>
            </div>
          </template>
        </div>

        <!-- Mood recap section -->
        <div class="ws-section" x-show="weeklySummaryData.moodGrandTotal > 0">
          <p class="ws-section-title">😊 Mood</p>
          <template x-if="weeklySummaryData.dominantMood">
            <div class="ws-mood-dominant">
              <span class="ws-mood-dom-emoji" x-text="weeklySummaryData.dominantMood.emoji"></span>
              <span class="ws-mood-dom-label" x-text="weeklySummaryData.dominantMood.label"></span>
              <span class="ws-mood-dom-count" x-text="'(' + weeklySummaryData.dominantMood.count + 'x)'"></span>
            </div>
          </template>
          <div class="ws-mood-breakdown">
            <template x-for="m in MOOD_LIST" :key="m.key">
              <template x-if="(weeklySummaryData.moodTotals[m.key] || 0) > 0">
                <div class="ws-mood-row">
                  <span class="ws-mood-emoji" x-text="m.emoji"></span>
                  <span class="ws-mood-label" x-text="m.label"></span>
                  <div class="ws-mood-bar-track">
                    <div class="ws-mood-bar-fill" :style="'width:' + ((weeklySummaryData.moodTotals[m.key] / weeklySummaryData.moodGrandTotal) * 100) + '%'"></div>
                  </div>
                  <span class="ws-mood-count" x-text="weeklySummaryData.moodTotals[m.key] + 'x'"></span>
                </div>
              </template>
            </template>
          </div>
        </div>

        <!-- Missed schedule -->
        <div class="ws-section" x-show="weeklySummaryData.missedItems.length > 0">
          <p class="ws-section-title">⏰ Kegiatan Terlewat</p>
          <div class="ws-missed-list">
            <template x-for="item in weeklySummaryData.missedItems" :key="item.date + '|' + item.time + '|' + item.text">
              <div class="ws-missed-item">
                <span class="ws-missed-time" x-text="item.time"></span>
                <span class="ws-missed-text" x-text="item.text"></span>
                <span class="ws-missed-day" x-text="item.dayName"></span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </template>
  </template>
</section>
```

- [ ] **Step 2: Add all CSS for weekly summary dashboard**

In `style.css`, add after the weekly recap modal styles:

```css
/* --- Weekly Summary Dashboard --- */
.weekly-summary {
  background: var(--card-bg);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 20px 18px 16px;
  margin-bottom: 18px;
  border: 1.5px solid var(--accent);
}
.ws-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}
.ws-header h2 {
  font-family: var(--font-head);
  font-size: 1.3rem;
  color: var(--text);
}
.ws-subtitle {
  font-size: 0.8rem;
  color: var(--text-light);
}
.ws-loading, .ws-empty {
  text-align: center;
  padding: 24px 0;
  color: var(--text-light);
  font-family: var(--font-head);
}
.ws-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 18px;
}
@media (max-width: 560px) {
  .ws-cards { grid-template-columns: repeat(2, 1fr); }
}
.ws-card {
  background: var(--bg);
  border-radius: var(--radius-sm);
  padding: 12px 8px;
  text-align: center;
  border: 1px solid #f0ede8;
}
[data-theme="dark"] .ws-card {
  border-color: #2a221c;
}
.ws-card-icon {
  display: block;
  font-size: 1.5rem;
  margin-bottom: 4px;
}
.ws-card-value {
  display: block;
  font-family: var(--font-head);
  font-size: 1.4rem;
  color: var(--text);
  line-height: 1.2;
}
.ws-card-label {
  display: block;
  font-size: 0.7rem;
  color: var(--text-light);
  margin-top: 2px;
}
.ws-card-checklist .ws-card-value { color: #4caf50; }
.ws-card-mood .ws-card-value { color: var(--primary); }
.ws-card-schedule .ws-card-value { color: #2196f3; }
.ws-card-streak .ws-card-value { color: #ff9800; }

/* Checklist per day */
.ws-section {
  margin-bottom: 16px;
}
.ws-section:last-child {
  margin-bottom: 0;
}
.ws-section-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-light);
  margin-bottom: 8px;
}
.ws-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
}
.ws-bar-day {
  font-size: 0.78rem;
  font-weight: 700;
  min-width: 42px;
  color: var(--text-light);
}
.ws-bar-track {
  flex: 1;
  height: 14px;
  background: #f0ede8;
  border-radius: 50px;
  overflow: hidden;
}
[data-theme="dark"] .ws-bar-track {
  background: #1f1a16;
}
.ws-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #f0c040, #f0d080);
  border-radius: 50px;
  transition: width 0.5s ease;
  min-width: 2px;
}
.ws-bar-done {
  background: linear-gradient(90deg, #4caf50, #81c784);
}
.ws-bar-pct {
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 36px;
  text-align: right;
  color: var(--text-light);
}
.ws-bar-count {
  font-size: 0.7rem;
  color: var(--text-light);
  min-width: 50px;
  text-align: right;
}
.ws-bar-star {
  font-size: 0.8rem;
  margin-left: 2px;
}
.ws-bar-perfect {
  background: rgba(76, 175, 80, 0.06);
  border-radius: 6px;
  padding: 5px 0;
}
[data-theme="dark"] .ws-bar-perfect {
  background: rgba(76, 175, 80, 0.12);
}

/* Mood recap inside dashboard */
.ws-mood-dominant {
  text-align: center;
  padding: 10px 0 8px;
  background: linear-gradient(135deg, #fcf3e8, #fdf8f0);
  border-radius: var(--radius-sm);
  margin-bottom: 12px;
}
[data-theme="dark"] .ws-mood-dominant {
  background: linear-gradient(135deg, #2a221c, #1f1a16);
}
.ws-mood-dom-emoji {
  font-size: 1.8rem;
  display: block;
  line-height: 1.3;
}
.ws-mood-dom-label {
  font-family: var(--font-head);
  font-size: 1.2rem;
  color: var(--text);
}
.ws-mood-dom-count {
  font-size: 0.8rem;
  color: var(--text-light);
}
.ws-mood-breakdown {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.ws-mood-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ws-mood-emoji {
  font-size: 1rem;
  width: 24px;
  text-align: center;
}
.ws-mood-label {
  font-size: 0.75rem;
  font-weight: 700;
  width: 60px;
  color: var(--text-light);
}
.ws-mood-bar-track {
  flex: 1;
  height: 14px;
  background: #f0ede8;
  border-radius: 50px;
  overflow: hidden;
}
[data-theme="dark"] .ws-mood-bar-track {
  background: #1f1a16;
}
.ws-mood-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  border-radius: 50px;
  min-width: 2px;
  transition: width 0.5s ease;
}
.ws-mood-count {
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 30px;
  text-align: right;
  color: var(--text-light);
}

/* Missed schedule */
.ws-missed-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ws-missed-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: var(--radius-sm);
  background: rgba(244, 67, 54, 0.04);
  font-size: 0.85rem;
}
[data-theme="dark"] .ws-missed-item {
  background: rgba(244, 67, 54, 0.1);
}
.ws-missed-time {
  font-weight: 700;
  color: var(--text-light);
  min-width: 40px;
}
.ws-missed-text {
  flex: 1;
  color: var(--text);
}
.ws-missed-day {
  font-size: 0.7rem;
  color: var(--text-light);
  min-width: 50px;
  text-align: right;
}
```

- [ ] **Step 3: Version bump**

In `index.html`:
- `style.css?v=4` → `style.css?v=5`
- `main.js?v=11` → `main.js?v=12`
- `moods.js?v=3` → `moods.js?v=4`
