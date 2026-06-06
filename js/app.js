/**
 * app.js — Personal Dashboard
 *
 * Single JS file containing all modules:
 *   StorageService, ThemeController, GreetingWidget,
 *   TimerWidget, TodoWidget, LinksWidget, App
 *
 * Zero external dependencies. Open index.html in any modern browser.
 */

'use strict';

/* ============================================================
   StorageService
   Centralised wrapper around localStorage.
   All modules MUST use this instead of localStorage directly.
   ============================================================ */

const StorageService = {
  /**
   * Retrieve a value from localStorage.
   * @param {string} key
   * @returns {*|null} Parsed JSON value, or null if missing / parse error.
   */
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.error(`StorageService.get: failed to read key "${key}"`, err);
      return null;
    }
  },

  /**
   * Persist a value to localStorage as JSON.
   * @param {string} key
   * @param {*} value
   * @returns {boolean} true on success; false on error (e.g. QuotaExceededError).
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`StorageService.set: failed to write key "${key}"`, err);
      return false;
    }
  },

  /**
   * Remove an entry from localStorage.
   * @param {string} key
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error(`StorageService.remove: failed to remove key "${key}"`, err);
    }
  },
};

/* ============================================================
   ThemeController  — Task 2.1
   ============================================================ */

const ThemeController = {
  /**
   * Reads stored theme from StorageService, falls back to prefers-color-scheme,
   * then defaults to "light". Applies the resolved theme immediately.
   */
  init() {
    const stored = StorageService.get('theme');
    let theme;
    if (stored === 'light' || stored === 'dark') {
      theme = stored;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark';
    } else {
      theme = 'light';
    }
    this._apply(theme);
  },

  /**
   * Flips the current theme, persists it, and updates the DOM.
   */
  toggle() {
    const next = this.getCurrent() === 'light' ? 'dark' : 'light';
    StorageService.set('theme', next);
    this._apply(next);
  },

  /**
   * Returns "light" or "dark" based on the current <html> class.
   * @returns {"light"|"dark"}
   */
  getCurrent() {
    return document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light';
  },

  /**
   * Applies a theme by updating <html> class and the toggle button UI.
   * @param {"light"|"dark"} theme
   */
  _apply(theme) {
    document.documentElement.className = 'theme-' + theme;

    const btn  = document.getElementById('theme-toggle');
    const icon = document.getElementById('theme-icon');

    if (btn) {
      btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    }
    if (icon) {
      // Sun icon while light theme is active (clicking will switch to dark).
      // Moon icon while dark theme is active (clicking will switch to light).
      icon.textContent = theme === 'light' ? '☀️' : '🌙';
    }
  },
};

/* ============================================================
   GreetingWidget  — Tasks 3.1 – 3.3
   ============================================================ */

const GreetingWidget = {
  init() {
    // Read userName from storage (used in _tick)
    StorageService.get('userName');
    // Start 1-second interval
    setInterval(() => this._tick(), 1000);
    // Populate display immediately
    this._tick();
  },

  _tick() {
    try {
      const date = new Date();

      // Update time display
      const timeEl = document.getElementById('time-display');
      if (timeEl) timeEl.innerText = this.formatTime(date);

      // Update date display
      const dateEl = document.getElementById('date-text');
      if (dateEl) dateEl.innerText = this.formatDate(date);

      // Build greeting phrase
      const phrase = this.getGreeting(date.getHours());
      const storedName = StorageService.get('userName');
      let display = phrase;
      if (storedName && typeof storedName === 'string' && storedName.trim() !== '') {
        display = `${phrase}, ${storedName.slice(0, 50)}`;
      }

      // Update greeting text
      const greetingEl = document.getElementById('greeting-text');
      if (greetingEl) {
        greetingEl.innerText = display;

        // If it was hidden by a previous error, restore it
        if (greetingEl.hidden) {
          greetingEl.hidden = false;
          const errEl = document.getElementById('clock-error');
          if (errEl) errEl.hidden = true;
        }
      }
    } catch (err) {
      // Hide greeting text
      const greetingEl = document.getElementById('greeting-text');
      if (greetingEl) greetingEl.hidden = true;

      // Show or create clock-error indicator
      const container = document.getElementById('greeting-display');
      let errEl = document.getElementById('clock-error');
      if (!errEl) {
        errEl = document.createElement('span');
        errEl.id = 'clock-error';
        if (container) container.appendChild(errEl);
      }
      errEl.textContent = '⚠ Clock unavailable';
      errEl.hidden = false;
    }
  },

  /**
   * Persists or removes the user name and immediately updates the greeting display.
   * @param {string} trimmedName  Already-trimmed name from the caller.
   */
  setName(trimmedName) {
    if (trimmedName !== '') {
      // Persist the full trimmed value (no truncation in storage)
      StorageService.set('userName', trimmedName);

      // Update greeting display (truncate to 50 chars for display only)
      const greetingEl = document.getElementById('greeting-text');
      if (greetingEl) {
        const phrase = this.getGreeting(new Date().getHours());
        greetingEl.innerText = `${phrase}, ${trimmedName.slice(0, 50)}`;
      }
    } else {
      // Remove from storage
      StorageService.remove('userName');

      // Update greeting display to greeting phrase only
      const greetingEl = document.getElementById('greeting-text');
      if (greetingEl) {
        const phrase = this.getGreeting(new Date().getHours());
        greetingEl.innerText = phrase;
      }
    }
  },

  /**
   * Returns the time-of-day greeting phrase for the given hour (0–23).
   * @param {number} hour  Integer hour in 0–23 range.
   * @returns {string}
   */
  getGreeting(hour) {
    if (hour >= 5 && hour <= 11) return 'Good morning';
    if (hour >= 12 && hour <= 17) return 'Good afternoon';
    if (hour >= 18 && hour <= 20) return 'Good evening';
    // 21–23 and 0–4
    return 'Good night';
  },

  /**
   * Returns a zero-padded HH:MM:SS string from a Date object.
   * @param {Date} date
   * @returns {string}  e.g. "09:05:03"
   */
  formatTime(date) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  },

  /**
   * Returns a formatted date string "Weekday, DD Month YYYY".
   * Day names and month names are always in English.
   * The day-of-month is zero-padded to 2 digits.
   * @param {Date} date
   * @returns {string}  e.g. "Saturday, 06 June 2026"
   */
  formatDate(date) {
    const DAYS = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday',
      'Thursday', 'Friday', 'Saturday',
    ];
    const MONTHS = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const weekday = DAYS[date.getDay()];
    const day     = String(date.getDate()).padStart(2, '0');
    const month   = MONTHS[date.getMonth()];
    const year    = date.getFullYear();
    return `${weekday}, ${day} ${month} ${year}`;
  },
};

/* ============================================================
   TimerWidget  — Tasks 4.1 – 4.3
   ============================================================ */

/**
 * Formats a total-seconds value as MM:SS with both parts zero-padded to ≥2 digits.
 * @param {number} totalSeconds  Non-negative integer (0–7200 typical range).
 * @returns {string}  e.g. formatMMSS(65) → "01:05", formatMMSS(7200) → "120:00"
 */
function formatMMSS(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
}

// Private state for TimerWidget
let _timerState     = 'idle';   // 'idle' | 'running' | 'paused' | 'finished'
let _timerRemaining = 0;        // seconds remaining
let _timerDuration  = 25;       // minutes
let _timerInterval  = null;     // setInterval handle

const TimerWidget = {
  /**
   * Reads stored pomodoroDuration, initialises state and DOM.
   */
  init() {
    const stored = StorageService.get('pomodoroDuration');
    if (Number.isInteger(stored) && stored >= 1 && stored <= 120) {
      _timerDuration = stored;
    } else {
      _timerDuration = 25;
    }
    _timerRemaining = _timerDuration * 60;

    const timeEl = document.getElementById('timer-time');
    if (timeEl) timeEl.textContent = formatMMSS(_timerRemaining);

    const durationInput = document.getElementById('duration-input');
    if (durationInput) durationInput.value = _timerDuration;

    this._setState('idle');
  },

  /**
   * Starts the countdown. Only acts when state is 'idle' or 'paused'.
   */
  start() {
    if (_timerState !== 'idle' && _timerState !== 'paused' && _timerState !== 'finished') return;

    // Hide session-end indicator
    const endIndicator = document.getElementById('timer-end-indicator');
    if (endIndicator) endIndicator.hidden = true;

    this._setState('running');
    _timerInterval = setInterval(() => this._tick(), 1000);
  },

  /**
   * Pauses the countdown. Only acts when state is 'running'.
   */
  stop() {
    if (_timerState !== 'running') return;

    clearInterval(_timerInterval);
    _timerInterval = null;
    this._setState('paused');
  },

  /**
   * Resets the timer to the current duration from any state.
   */
  reset() {
    clearInterval(_timerInterval);
    _timerInterval = null;

    _timerRemaining = _timerDuration * 60;

    const timeEl = document.getElementById('timer-time');
    if (timeEl) timeEl.textContent = formatMMSS(_timerRemaining);

    const endIndicator = document.getElementById('timer-end-indicator');
    if (endIndicator) endIndicator.hidden = true;

    this._setState('idle');
  },

  /**
   * Updates the Pomodoro duration. Validates and persists; resets display if valid.
   * @param {number} minutes
   */
  setDuration(minutes) {
    const val = parseInt(minutes, 10);
    const errEl = document.getElementById('duration-error');

    if (!Number.isInteger(val) || val < 1 || val > 120) {
      if (errEl) {
        errEl.textContent = 'Duration must be a whole number between 1 and 120.';
        errEl.hidden = false;
      }
      return;
    }

    // Hide any previous error
    if (errEl) errEl.hidden = true;

    // If running, stop first
    if (_timerState === 'running') {
      clearInterval(_timerInterval);
      _timerInterval = null;
    }

    _timerDuration = val;
    StorageService.set('pomodoroDuration', _timerDuration);

    _timerRemaining = _timerDuration * 60;

    const timeEl = document.getElementById('timer-time');
    if (timeEl) timeEl.textContent = formatMMSS(_timerRemaining);

    const durationInput = document.getElementById('duration-input');
    if (durationInput) durationInput.value = _timerDuration;

    const endIndicator = document.getElementById('timer-end-indicator');
    if (endIndicator) endIndicator.hidden = true;

    this._setState('idle');
  },

  /**
   * Called every second while running.
   */
  _tick() {
    _timerRemaining -= 1;

    const timeEl = document.getElementById('timer-time');
    if (timeEl) timeEl.textContent = formatMMSS(_timerRemaining);

    if (_timerRemaining <= 0) {
      clearInterval(_timerInterval);
      _timerInterval = null;
      _timerRemaining = 0;
      this._setState('finished');

      const endIndicator = document.getElementById('timer-end-indicator');
      if (endIndicator) endIndicator.hidden = false;
    }
  },

  /**
   * Transitions to a new state and updates button disabled states.
   * @param {'idle'|'running'|'paused'|'finished'} newState
   */
  _setState(newState) {
    _timerState = newState;

    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');
    const resetBtn = document.getElementById('timer-reset');

    if (!startBtn || !stopBtn || !resetBtn) return;

    switch (newState) {
      case 'idle':
        startBtn.disabled = false;
        stopBtn.disabled  = true;
        resetBtn.disabled = true;
        break;
      case 'running':
        startBtn.disabled = true;
        stopBtn.disabled  = false;
        resetBtn.disabled = false;
        break;
      case 'paused':
        startBtn.disabled = false;
        stopBtn.disabled  = true;
        resetBtn.disabled = false;
        break;
      case 'finished':
        startBtn.disabled = false;
        stopBtn.disabled  = true;
        resetBtn.disabled = false;
        break;
    }
  },

  /** @returns {'idle'|'running'|'paused'|'finished'} */
  getState() { return _timerState; },

  /** @returns {number} Seconds remaining. */
  getRemaining() { return _timerRemaining; },
};

/* ============================================================
   TodoWidget  — Tasks 5.1 – 5.4 (with sorting & duplicate prompt)
   ============================================================ */

/**
 * Generates a unique ID using crypto.randomUUID when available,
 * falling back to a timestamp+random string.
 * @returns {string}
 */
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Private state for TodoWidget
let _tasks     = []; // Array of { id, text, completed }
let _editingId = null; // id of the task currently in edit mode, or null

const TodoWidget = {
  /**
   * Loads tasks from StorageService and renders the list.
   */
  init() {
    const stored = StorageService.get('tasks');
    _tasks = Array.isArray(stored) ? stored : [];
    this._render();
  },

  /**
   * Persists the current _tasks array to StorageService.
   * @returns {boolean} true on success, false on failure.
   */
  _persist() {
    const ok = StorageService.set('tasks', _tasks);
    if (!ok) {
      const errEl = document.getElementById('todo-add-error');
      if (errEl) {
        errEl.textContent = 'Failed to save tasks. Storage may be full.';
        errEl.hidden = false;
      }
      return false;
    }
    return true;
  },

  /**
   * Re-renders the entire task list from _tasks.
   * Handles edit mode: the task matching _editingId is rendered with an inline edit UI.
   * Uses event delegation on the <ul> for all task interactions.
   * Requirements: 7.1–7.6
   */
  _render() {
    const list = document.getElementById('todo-list');
    if (!list) return;

    // Clear existing content and remove stale delegated listeners
    list.innerHTML = '';

    if (list._delegatedHandler) {
      list.removeEventListener('change', list._delegatedHandler);
      list.removeEventListener('click', list._delegatedHandler);
    }

    // Build list items
    _tasks.forEach((task) => {
      const li = document.createElement('li');
      li.dataset.taskId = task.id;

      if (task.id === _editingId) {
        // ── Edit mode row ──────────────────────────────────────
        li.classList.add('editing');

        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'task-edit-input';
        editInput.value = task.text;
        editInput.setAttribute('aria-label', `Edit task: ${task.text}`);

        const saveBtn = document.createElement('button');
        saveBtn.className = 'task-save-btn';
        saveBtn.textContent = 'Save';
        saveBtn.dataset.id = task.id;
        saveBtn.dataset.action = 'save-edit';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'task-cancel-btn';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.dataset.id = task.id;
        cancelBtn.dataset.action = 'cancel-edit';

        const errSpan = document.createElement('span');
        errSpan.id = `todo-edit-error-${task.id}`;
        errSpan.className = 'error-msg';
        errSpan.setAttribute('role', 'alert');
        errSpan.hidden = true;

        // Enter → save; Escape → cancel
        editInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.editTask(task.id, editInput.value);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            _editingId = null;
            this._render();
          }
        });

        li.appendChild(editInput);
        li.appendChild(saveBtn);
        li.appendChild(cancelBtn);
        li.appendChild(errSpan);

        // Auto-focus the input after render
        requestAnimationFrame(() => editInput.focus());
      } else {
        // ── Normal display row ─────────────────────────────────
        if (task.completed) li.classList.add('completed');

        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.setAttribute('aria-label', `Mark ${task.text} as complete`);
        checkbox.dataset.id = task.id;
        checkbox.dataset.action = 'toggle';

        // Task text span
        const span = document.createElement('span');
        span.className = 'task-text';
        span.textContent = task.text;

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'task-edit-btn';
        editBtn.textContent = 'Edit';
        editBtn.dataset.id = task.id;
        editBtn.dataset.action = 'edit';

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'task-delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.dataset.id = task.id;
        deleteBtn.dataset.action = 'delete';

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
      }

      list.appendChild(li);
    });

    // Single delegated event handler for clicks and checkbox changes
    const handler = (e) => {
      const action = e.target.dataset && e.target.dataset.action;
      if (!action) return;

      const id = e.target.dataset.id;

      if (action === 'toggle' && e.type === 'change') {
        this.toggleComplete(id);
      } else if (action === 'edit' && e.type === 'click') {
        this.editTask(id);
      } else if (action === 'delete' && e.type === 'click') {
        this.deleteTask(id);
      } else if (action === 'save-edit' && e.type === 'click') {
        const li = e.target.closest('li');
        const input = li ? li.querySelector('.task-edit-input') : null;
        if (input) this.editTask(id, input.value);
      } else if (action === 'cancel-edit' && e.type === 'click') {
        _editingId = null;
        this._render();
      }
    };

    list._delegatedHandler = handler;
    list.addEventListener('change', handler);
    list.addEventListener('click', handler);
  },

  /**
   * Validates and adds a new task.
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.1–8.6
   * Skenario Duplikasi: Pengecekan nama ganda dengan konfirmasi sebelum penambahan.
   * @param {string} text  Raw input value from the user.
   * @returns {boolean} true on success, false on validation failure or storage error.
   */
  addTask(text) {
    const errEl = document.getElementById('todo-add-error');

    // Clear any previous error
    if (errEl) {
      errEl.hidden = true;
      errEl.textContent = '';
    }

    const trimmed = (text || '').trim();

    // Validate: empty or whitespace-only
    if (trimmed === '') {
      if (errEl) {
        errEl.textContent = 'Task cannot be empty.';
        errEl.hidden = false;
      }
      return false;
    }

    // Validate: exceeds 500 characters
    if (trimmed.length > 500) {
      if (errEl) {
        errEl.textContent = 'Task must be 500 characters or fewer.';
        errEl.hidden = false;
      }
      return false;
    }

    // Validate: task limit reached
    if (_tasks.length >= 100) {
      if (errEl) {
        errEl.textContent = 'Task limit of 100 reached.';
        errEl.hidden = false;
      }
      return false;
    }

    // Pengecekan Tugas Ganda (Case-insensitive)
    const isDuplicate = _tasks.some(task => task.text.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      const confirmAdd = confirm(`Tugas dengan nama "${trimmed}" sudah ada di daftar. Apakah Anda tetap ingin menambahkannya?`);
      if (!confirmAdd) {
        return false; // Batalkan penambahan tugas
      }
    }

    // Create the new task object
    const newTask = { id: generateId(), text: trimmed, completed: false };

    // Snapshot for rollback
    const snapshot = [..._tasks];

    // Add to array
    _tasks.push(newTask);

    // Attempt to persist; rollback on failure
    if (!this._persist()) {
      _tasks = snapshot;
      this._render();
      return false;
    }

    // Success: re-render and clear input
    this._render();
    const inputEl = document.getElementById('todo-input');
    if (inputEl) inputEl.value = '';

    return true;
  },

  /**
   * Enters edit mode for a task (id only), or confirms an edit (id + newText).
   * Requirements: 7.1–7.6
   * @param {string} id
   * @param {string} [newText]  Omit to enter edit mode; provide to confirm edit.
   * @returns {boolean}
   */
  editTask(id, newText) {
    if (newText === undefined) {
      // ── Enter edit mode ──────────────────────────────────────
      const task = _tasks.find(t => t.id === id);
      if (!task) return false;

      // Set editing id and re-render (which will draw the edit UI for this task)
      _editingId = id;
      this._render();
      return true;
    } else {
      // ── Confirm edit ─────────────────────────────────────────
      const trimmed = (newText || '').trim();

      // Show error in the edit row's error span
      const errSpan = document.getElementById(`todo-edit-error-${_editingId}`);

      if (trimmed === '') {
        if (errSpan) {
          errSpan.textContent = 'Task cannot be empty.';
          errSpan.hidden = false;
        }
        return false;
      }

      // Snapshot for rollback
      const snapshot = _tasks.map(t => ({ ...t }));

      const task = _tasks.find(t => t.id === _editingId);
      if (!task) return false;

      task.text = trimmed;

      if (!this._persist()) {
        _tasks = snapshot;
        this._render();
        return false;
      }

      _editingId = null;
      this._render();
      return true;
    }
  },

  /**
   * Removes a task by id.
   * Requirements: 8.5, 8.6
   * @param {string} id
   */
  deleteTask(id) {
    // Snapshot for rollback
    const snapshot = [..._tasks];

    // Remove the task; also clear edit mode if this was the editing task
    if (_editingId === id) _editingId = null;
    _tasks = _tasks.filter(t => t.id !== id);

    // Attempt to persist; rollback on failure
    if (!this._persist()) {
      _tasks = snapshot;
      this._render();
      return;
    }

    this._render();
  },

  /**
   * Toggles the completed state of a task by id.
   * Requirements: 8.1, 8.2, 8.3, 8.4
   * @param {string} id
   */
  toggleComplete(id) {
    const task = _tasks.find(t => t.id === id);
    if (!task) return;

    // Snapshot for rollback
    const snapshot = _tasks.map(t => ({ ...t }));

    // Toggle
    task.completed = !task.completed;

    // Attempt to persist; rollback on failure
    if (!this._persist()) {
      _tasks = snapshot;
      this._render();
      return;
    }

    this._render();
  },

  /**
   * Mengurutkan daftar tugas berdasarkan alfabetis.
   * @param {'asc'|'desc'} direction
   */
  sortTasks(direction) {
    const sorted = [..._tasks].sort((a, b) => {
      return a.text.localeCompare(b.text, undefined, { sensitivity: 'base', numeric: true });
    });

    if (direction === 'desc') {
      sorted.reverse();
    }

    // Salin snapshot untuk rollback jika gagal simpan
    const snapshot = [..._tasks];
    _tasks = sorted;

    if (!this._persist()) {
      _tasks = snapshot;
    }

    this._render();
  },
};

/* ============================================================
   LinksWidget  — Tasks 6.1 – 6.3
   ============================================================ */

// Private state for LinksWidget
let _links = []; // Array of { id, label, url }

const LinksWidget = {
  /**
   * Loads links from StorageService and renders the list.
   * Requirements: 9.1
   */
  init() {
    const quickLinks = StorageService.get('quickLinks');
    _links = Array.isArray(quickLinks) ? quickLinks : [];
    this._render();
  },

  /**
   * Validates a URL — must start with http:// or https:// and be parseable.
   * Requirements: 9.3
   * @param {string} url
   * @returns {boolean}
   */
  _validateUrl(url) {
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      return false;
    }
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Persists the current _links array to StorageService.
   * @returns {boolean} true on success, false on failure.
   */
  _persist() {
    const ok = StorageService.set('quickLinks', _links);
    if (!ok) {
      const errEl = document.getElementById('link-add-error');
      if (errEl) {
        errEl.textContent = 'Failed to save links. Storage may be full.';
        errEl.hidden = false;
      }
      return false;
    }
    return true;
  },

  /**
   * Re-renders the entire links list from _links.
   * Requirements: 9.1, 9.3, 9.4
   */
  _render() {
    const linksList = document.getElementById('links-list');
    if (!linksList) return;

    // Remove old delegated handler
    if (linksList._delegatedHandler) {
      linksList.removeEventListener('click', linksList._delegatedHandler);
    }

    // Rebuild all content
    linksList.innerHTML = '';

    const emptyState = document.getElementById('links-empty-state');

    if (_links.length === 0) {
      // Show empty state
      if (emptyState) {
        emptyState.hidden = false;
        linksList.appendChild(emptyState);
      }
      return;
    }

    // Hide empty state
    if (emptyState) {
      emptyState.hidden = true;
    }

    // Build each link item
    _links.forEach((link) => {
      const item = document.createElement('div');
      item.setAttribute('role', 'listitem');

      // Truncate label to 50 chars for display only
      const displayLabel = link.label.length > 50
        ? link.label.slice(0, 50)
        : link.label;

      // Link button
      const linkBtn = document.createElement('button');
      linkBtn.className = 'link-btn';
      linkBtn.textContent = displayLabel;
      linkBtn.dataset.id = link.id;

      const isValid = this._validateUrl(link.url);

      if (!isValid) {
        // Invalid URL — disable the button
        linkBtn.classList.add('invalid-url');
        linkBtn.disabled = true;
        linkBtn.setAttribute('aria-disabled', 'true');
        linkBtn.title = 'Invalid URL';
      } else {
        // Valid URL — wire click and keyboard activation
        const openLink = () => {
          window.open(link.url, '_blank', 'noopener,noreferrer');
        };
        linkBtn.addEventListener('click', openLink);
        linkBtn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openLink();
          }
        });
      }

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'link-delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.dataset.id = link.id;
      deleteBtn.dataset.action = 'delete-link';
      deleteBtn.setAttribute('aria-label', `Delete link ${displayLabel}`);

      item.appendChild(linkBtn);
      item.appendChild(deleteBtn);
      linksList.appendChild(item);
    });

    // Event delegation on the list for delete buttons
    const delegatedHandler = (e) => {
      if (e.target.dataset && e.target.dataset.action === 'delete-link') {
        this.deleteLink(e.target.dataset.id);
      }
    };

    linksList._delegatedHandler = delegatedHandler;
    linksList.addEventListener('click', delegatedHandler);
  },

  /**
   * Validates and adds a new link.
   * Requirements: 10.1–10.8
   * @param {string} label  Raw label value from the user.
   * @param {string} url    Raw URL value from the user.
   * @returns {boolean} true on success, false on validation failure or storage error.
   */
  addLink(label, url) {
    const errEl = document.getElementById('link-add-error');

    // Clear any previous error
    if (errEl) {
      errEl.hidden = true;
      errEl.textContent = '';
    }

    const trimmedLabel = (label || '').trim();
    const trimmedUrl   = (url   || '').trim();

    // Validate label
    if (trimmedLabel === '') {
      if (errEl) {
        errEl.textContent = 'Label cannot be empty.';
        errEl.hidden = false;
      }
      return false;
    }

    if (trimmedLabel.length > 100) {
      if (errEl) {
        errEl.textContent = 'Label must be 100 characters or fewer.';
        errEl.hidden = false;
      }
      return false;
    }

    // Validate URL
    if (trimmedUrl === '') {
      if (errEl) {
        errEl.textContent = 'URL cannot be empty.';
        errEl.hidden = false;
      }
      return false;
    }

    if (trimmedUrl.length > 2048) {
      if (errEl) {
        errEl.textContent = 'URL must be 2048 characters or fewer.';
        errEl.hidden = false;
      }
      return false;
    }

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      if (errEl) {
        errEl.textContent = 'URL must start with http:// or https://';
        errEl.hidden = false;
      }
      return false;
    }

    // Validate link limit
    if (_links.length >= 50) {
      if (errEl) {
        errEl.textContent = 'Link limit of 50 reached.';
        errEl.hidden = false;
      }
      return false;
    }

    // Create new link
    const link = { id: generateId(), label: trimmedLabel, url: trimmedUrl };

    // Snapshot for rollback
    const snapshot = [..._links];

    _links.push(link);

    if (!this._persist()) {
      _links = snapshot;
      this._render();
      return false;
    }

    // Success: re-render and clear inputs
    this._render();

    const labelInput = document.getElementById('link-label-input');
    const urlInput   = document.getElementById('link-url-input');
    if (labelInput) labelInput.value = '';
    if (urlInput)   urlInput.value   = '';

    return true;
  },

  /**
   * Removes a link by id.
   * Requirements: 10.5, 10.6, 10.8
   * @param {string} id
   */
  deleteLink(id) {
    // Snapshot for rollback
    const snapshot = [..._links];

    _links = _links.filter(l => l.id !== id);

    if (!this._persist()) {
      _links = snapshot;
      this._render();
      return;
    }

    this._render();
  },
};

/* ============================================================
   App  — Task 7.3 bootstrap
   ============================================================ */

const App = {
  init() {
    ThemeController.init();

    // Wire theme toggle button
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => ThemeController.toggle());
    }

    GreetingWidget.init();

    // Wire name form
    const nameInput = document.getElementById('name-input');
    const nameSave  = document.getElementById('name-save');

    if (nameSave && nameInput) {
      nameSave.addEventListener('click', () => {
        const trimmed = nameInput.value.trim();
        GreetingWidget.setName(trimmed);
      });
    }

    if (nameInput) {
      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const trimmed = nameInput.value.trim();
          GreetingWidget.setName(trimmed);
        }
      });

      // Pre-fill input with stored name if available
      const storedName = StorageService.get('userName');
      if (storedName && typeof storedName === 'string') {
        nameInput.value = storedName;
      }
    }

    TimerWidget.init();

    // Wire timer controls
    const timerStart = document.getElementById('timer-start');
    const timerStop  = document.getElementById('timer-stop');
    const timerReset = document.getElementById('timer-reset');

    if (timerStart) timerStart.addEventListener('click', () => TimerWidget.start());
    if (timerStop)  timerStop.addEventListener('click',  () => TimerWidget.stop());
    if (timerReset) timerReset.addEventListener('click', () => TimerWidget.reset());

    // Wire duration form
    const durationInput = document.getElementById('duration-input');
    const durationSave  = document.getElementById('duration-save');

    if (durationSave && durationInput) {
      durationSave.addEventListener('click', () => {
        TimerWidget.setDuration(durationInput.value);
      });
    }

    if (durationInput) {
      durationInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          TimerWidget.setDuration(durationInput.value);
        }
      });
    }

    TodoWidget.init();

    // Wire todo add form
    const todoAddBtn = document.getElementById('todo-add-btn');
    const todoInput  = document.getElementById('todo-input');
    const todoAddErr = document.getElementById('todo-add-error');

    if (todoAddBtn) {
      todoAddBtn.addEventListener('click', () => {
        TodoWidget.addTask(todoInput ? todoInput.value : '');
      });
    }

    if (todoInput) {
      todoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          TodoWidget.addTask(todoInput.value);
        }
      });

      // Clear the error as the user types
      todoInput.addEventListener('input', () => {
        if (todoAddErr) {
          todoAddErr.hidden = true;
          todoAddErr.textContent = '';
        }
      });
    }

    // Wire todo sorting buttons
    const sortAscBtn  = document.getElementById('todo-sort-asc');
    const sortDescBtn = document.getElementById('todo-sort-desc');

    if (sortAscBtn) {
      sortAscBtn.addEventListener('click', () => TodoWidget.sortTasks('asc'));
    }
    if (sortDescBtn) {
      sortDescBtn.addEventListener('click', () => TodoWidget.sortTasks('desc'));
    }

    LinksWidget.init();

    // Wire links add form
    const linkLabelInput = document.getElementById('link-label-input');
    const linkUrlInput   = document.getElementById('link-url-input');
    const linkAddBtn     = document.getElementById('link-add-btn');
    const linkAddError   = document.getElementById('link-add-error');

    if (linkAddBtn) {
      linkAddBtn.addEventListener('click', () => {
        LinksWidget.addLink(
          linkLabelInput ? linkLabelInput.value : '',
          linkUrlInput   ? linkUrlInput.value   : ''
        );
      });
    }

    if (linkLabelInput) {
      linkLabelInput.addEventListener('input', () => {
        if (linkAddError) { linkAddError.hidden = true; linkAddError.textContent = ''; }
      });
    }

    if (linkUrlInput) {
      linkUrlInput.addEventListener('input', () => {
        if (linkAddError) { linkAddError.hidden = true; linkAddError.textContent = ''; }
      });
    }
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());