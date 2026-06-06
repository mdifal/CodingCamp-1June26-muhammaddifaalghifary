# Design Document: Personal Dashboard

## Overview

The Personal Dashboard is a lightweight, client-only single-page application (SPA) built with plain HTML5, CSS3, and Vanilla JavaScript (ES6+). It acts as a browser home/new-tab replacement and requires no build toolstep, no backend server, and no external libraries.

The four interactive widgets — Greeting, Timer, To-Do, and Quick Links — share a single `localStorage`-based persistence layer and a centralised theme controller. All state lives in the browser; nothing is ever sent over the network.

### Goals

- Zero external dependencies — runs entirely from the filesystem or a static file server.
- Sub-3-second time-to-interactive on a 10 Mbps connection.
- Full keyboard accessibility and WCAG 2.1 AA colour-contrast compliance.
- Predictable, explicit state machine for the Pomodoro timer.
- All user-visible text updates within 100 ms of an interaction.

### Non-Goals

- No server-side sync, user accounts, or cloud backup.
- No support for browsers older than the current stable release of Chrome, Firefox, Edge, and Safari.
- No offline service-worker caching layer (the file is already local).

---

## Architecture

The application follows a **modular, event-driven** architecture within a single HTML page. Each widget is an isolated module that owns its own DOM subtree, its own storage keys, and its own event listeners. A thin `App` bootstrap script wires the modules together and initialises them in order.

```
index.html
├── css/
│   └── styles.css        ← all visual styling + CSS custom properties for theming
└── js/
    └── app.js            ← all JavaScript (single JS file)
        ├── StorageService   (CRUD wrapper around localStorage)
        ├── ThemeController  (reads/writes theme, applies CSS class)
        ├── GreetingWidget   (clock, date, greeting, name display)
        ├── TimerWidget      (Pomodoro state machine + UI)
        ├── TodoWidget       (task list CRUD + inline editing)
        ├── LinksWidget      (quick-link CRUD + URL validation)
        └── App.init()       (bootstrap: calls each module's init())
```

### Data Flow

```
User Interaction
      │
      ▼
Widget Event Handler
      │
      ├──► DOM Update  (synchronous, < 100 ms)
      │
      └──► StorageService.save(key, value)
                │
                └──► localStorage.setItem(...)
                           │
                    (next page load reads back)
```

No reactive data-binding library is used. Each module directly manipulates the relevant DOM nodes it owns. Cross-widget communication (e.g., duration change stopping a running timer) is handled through direct method calls from the event handler — keeping the call graph explicit and traceable.

### Timer State Machine

```
          ┌──────────────────────────────────────┐
          │              IDLE                    │
          │  (display = pomodoroDuration, MM:SS) │
          └────────┬─────────────────────────────┘
                   │  Start pressed
                   ▼
          ┌──────────────────────────────────────┐
          │             RUNNING                  │
          │  (countdown tick every 1 s)          │
          └────┬──────────────┬──────────────────┘
       Stop    │              │  Reaches 00:00
       pressed ▼              ▼
          ┌─────────┐   ┌───────────────────┐
          │ PAUSED  │   │     FINISHED      │
          │         │   │ (end indicator    │
          └─┬───────┘   │  visible)         │
            │ Start      └──────┬────────────┘
            │ pressed           │ Reset or Start
            ▼                   ▼
          RUNNING             IDLE
                  ◄── Reset ──(from any state)
```

---

## Components and Interfaces

### StorageService

Wraps `localStorage` to centralise error handling and serialisation.

```js
StorageService = {
  get(key)        → any | null,   // JSON.parse or null on error/missing
  set(key, value) → boolean,      // true on success; false + console.error on QuotaExceededError
  remove(key)     → void,
}
```

All modules call `StorageService` rather than `localStorage` directly. If `set()` returns `false`, the calling widget rolls back its in-memory state and shows an inline error.

### ThemeController

```js
ThemeController = {
  init()    → void,   // reads Storage, applies theme class to <html>
  toggle()  → void,   // flips theme, persists, updates toggle button aria-label
  getCurrent() → "light" | "dark",
}
```

The theme is applied as a CSS class on the `<html>` element (`class="theme-dark"` or `class="theme-light"`). CSS custom properties (`--bg`, `--fg`, `--accent`, …) are redefined per theme class.

### GreetingWidget

```js
GreetingWidget = {
  init()    → void,   // reads userName, starts 1-second setInterval
  _tick()   → void,   // updates time, date, greeting (called by interval)
  setName(trimmedName: string) → void,  // updates display + Storage
  getGreeting(hour: number) → string,   // pure function: hour → phrase
}
```

The `getGreeting` function is a pure function mapping hour → phrase, making it straightforwardly testable.

### TimerWidget

```js
TimerWidget = {
  init()       → void,
  start()      → void,
  stop()       → void,
  reset()      → void,
  setDuration(minutes: number) → void, // validates, persists, resets display
  _tick()      → void,   // decrements, checks for 00:00
  _setState(newState: TimerState) → void,  // updates button enabled/disabled
  getState()   → TimerState,  // "idle" | "running" | "paused" | "finished"
  getRemaining() → number,    // seconds remaining
}
```

### TodoWidget

```js
TodoWidget = {
  init()                        → void,
  addTask(text: string)         → boolean,   // false = validation failed
  editTask(id: string, text: string) → boolean,
  deleteTask(id: string)        → void,
  toggleComplete(id: string)    → void,
  _render()                     → void,      // full list re-render from in-memory array
  _persist()                    → boolean,   // returns StorageService.set result
}
```

Each Task object: `{ id: string, text: string, completed: boolean }`. IDs are generated with `crypto.randomUUID()` (or a Date-based fallback for Safari < 15.4).

### LinksWidget

```js
LinksWidget = {
  init()                                  → void,
  addLink(label: string, url: string)     → boolean,
  deleteLink(id: string)                  → void,
  _validateUrl(url: string)               → boolean,
  _render()                               → void,
  _persist()                              → boolean,
}
```

Each Link object: `{ id: string, label: string, url: string }`.

URL validation: must start with `http://` or `https://`, parseable by `new URL(url)` without throwing.

---

## Data Models

All data is stored in `localStorage` as JSON-serialised strings under these keys:

### `userName` — `string`

```
"Alex"
```

- Trimmed before storage.
- Max 50 characters enforced on display only; stored value is unchanged.
- Absent key → greeting shows no name suffix.

### `pomodoroDuration` — `number` (integer, 1–120)

```
25
```

- Stored as a plain integer (JSON number).
- Default: 25.

### `tasks` — `Task[]`

```json
[
  { "id": "a1b2c3d4-...", "text": "Buy groceries", "completed": false },
  { "id": "e5f6g7h8-...", "text": "Read chapter 3", "completed": true }
]
```

- Maximum 100 entries.
- `id` is a UUID string.
- `text` is trimmed, 1–500 characters.
- `completed` is boolean.

### `quickLinks` — `Link[]`

```json
[
  { "id": "uuid-1", "label": "GitHub", "url": "https://github.com" },
  { "id": "uuid-2", "label": "Gmail",  "url": "https://mail.google.com" }
]
```

- Maximum 50 entries.
- `label` is 1–100 characters.
- `url` must start with `http://` or `https://`, max 2048 characters.

### `theme` — `"light" | "dark"`

```
"dark"
```

- Absent key → use `prefers-color-scheme`, fallback to `"light"`.

### Storage Key Summary

| Key               | Type       | Default  | Widget(s)                   |
|-------------------|------------|----------|-----------------------------|
| `userName`        | string     | (absent) | GreetingWidget              |
| `pomodoroDuration`| number     | 25       | TimerWidget                 |
| `tasks`           | Task[]     | []       | TodoWidget                  |
| `quickLinks`      | Link[]     | []       | LinksWidget                 |
| `theme`           | string     | system   | ThemeController             |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Time-of-day greeting coverage

*For any* integer hour `h` in the range 0–23, `GreetingWidget.getGreeting(h)` SHALL return exactly one of `"Good morning"`, `"Good afternoon"`, `"Good evening"`, or `"Good night"`, with the value matching the hour-to-phrase boundary rules (05–11 → morning, 12–17 → afternoon, 18–20 → evening, 21–23 / 00–04 → night).

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

---

### Property 2: Clock display formatting

*For any* combination of valid hour (0–23), minute (0–59), and second (0–59) values, the time-format function SHALL produce a string matching `HH:MM:SS` with zero-padded components, and *for any* valid `Date` object the date-format function SHALL produce a string matching `"Weekday, DD Month YYYY"` with a two-digit zero-padded day.

**Validates: Requirements 1.1, 1.2**

---

### Property 3: Greeting name round-trip

*For any* non-empty string `s` (including strings with leading/trailing whitespace), saving it as the user name SHALL store `s.trim()` in Storage under `userName`, and a subsequent `GreetingWidget` initialisation reading that key SHALL display `s.trim()` appended to the greeting.

**Validates: Requirements 3.1, 3.3, 3.4**

---

### Property 4: Displayed name truncation invariant

*For any* stored `userName` string of length greater than 50 characters, `GreetingWidget` SHALL display at most 50 characters of the name while the value persisted in Storage SHALL remain the full untruncated string.

**Validates: Requirements 3.6**

---

### Property 5: Pomodoro duration persistence round-trip

*For any* integer `d` in the range 1–120, calling `TimerWidget.setDuration(d)` SHALL persist `d` to Storage under `pomodoroDuration`, and a subsequent `TimerWidget.init()` reading from Storage SHALL initialise both the countdown display and the duration-input field to `d` minutes in MM:SS format.

**Validates: Requirements 4.1, 5.2, 5.3, 5.6**

---

### Property 6: Invalid duration rejection

*For any* value that is not an integer, or is an integer outside the range 1–120, calling `TimerWidget.setDuration()` SHALL leave the stored `pomodoroDuration` value unchanged and the countdown display unchanged.

**Validates: Requirements 5.5**

---

### Property 7: MM:SS formatting

*For any* integer total-seconds value `s` in the range 0–7200 (0 to 120 minutes), the MM:SS formatting function SHALL return a string matching `\d{2}:\d{2}` where the minutes component equals `Math.floor(s / 60)` zero-padded to two digits and the seconds component equals `s % 60` zero-padded to two digits.

**Validates: Requirements 4.7**

---

### Property 8: Task addition round-trip

*For any* non-empty, non-whitespace-only string of 1–500 characters, calling `TodoWidget.addTask()` SHALL grow the task list by exactly one entry whose `text` field equals the trimmed input, and the persisted `tasks` array in Storage SHALL reflect the same addition.

**Validates: Requirements 6.2**

---

### Property 9: Whitespace input rejection (add and edit)

*For any* string composed entirely of whitespace characters (including the empty string), calling `TodoWidget.addTask()` or `TodoWidget.editTask()` with that string SHALL return false, the task list SHALL remain unchanged, and no write to Storage SHALL occur.

**Validates: Requirements 6.3, 7.4**

---

### Property 10: Task edit round-trip

*For any* existing task and any valid edit string (non-empty, non-whitespace-only, ≤500 characters), confirming the edit SHALL update the task's `text` field to the trimmed edit string in both the in-memory list and the persisted Storage value.

**Validates: Requirements 7.3**

---

### Property 11: Task completion toggle round-trip

*For any* task in the list, toggling its completion status twice (incomplete → complete → incomplete) SHALL return the task to its original completion state, and the persisted `tasks` array in Storage SHALL reflect that restored state.

**Validates: Requirements 8.2, 8.3, 8.4**

---

### Property 12: Deletion removes entry from list and Storage

*For any* item (task or quick link) present in its respective list, activating its Delete control SHALL remove exactly that item from the in-memory list and from the corresponding persisted array in Storage, leaving all other items unchanged.

**Validates: Requirements 8.6, 10.6**

---

### Property 13: Link input validation gate

*For any* combination of label and URL inputs, `LinksWidget.addLink()` SHALL return false and leave the links list and Storage unchanged if: the label is empty, the label exceeds 100 characters, the URL is empty, the URL exceeds 2048 characters, or the URL does not begin with `http://` or `https://`. For any combination that satisfies all constraints, `addLink()` SHALL append one entry and persist the updated list.

**Validates: Requirements 10.2, 10.3, 10.4**

---

### Property 14: Theme toggle round-trip

*For any* initial theme state (`"light"` or `"dark"`), calling `ThemeController.toggle()` twice in succession SHALL result in the same theme being active and exactly one theme class applied to `<html>`, with the Storage value equalling the original theme.

**Validates: Requirements 11.2, 11.6**

---

## Error Handling

### Storage Failures

`StorageService.set()` wraps `localStorage.setItem()` in a try/catch. If a `QuotaExceededError` (or any other error) is thrown:
- The method returns `false`.
- The calling widget's `_persist()` method detects `false`, reverts the in-memory state to its pre-operation snapshot, and renders an inline error message to the user.
- No partial state is written.

### Date API Failures

`GreetingWidget._tick()` wraps `new Date()` in a try/catch. If an invalid value is returned or an exception is thrown:
- The time and greeting text are hidden.
- A visible error indicator (`⚠ Clock unavailable`) is shown in the Greeting_Widget area.

### URL Validation

`LinksWidget._validateUrl()` uses `new URL(url)` inside a try/catch. Invalid URLs throw and return `false`. This avoids custom regex and leverages the browser's own URL parser.

### Input Validation

All inline validation messages:
- Are rendered adjacent to the relevant input field.
- Use `role="alert"` so screen readers announce them immediately.
- Are cleared as soon as the user begins typing again (on `input` event).

### Timer Edge Cases

- If `setInterval` drifts, the timer uses the tick count rather than wall-clock difference for simplicity (acceptable for ±1 s accuracy in a Pomodoro context).
- Rapid Start/Stop clicks are guarded by checking `getState()` before acting.

---

## Verification Approach

This project has no build step and no testing framework. Correctness is verified manually by opening `index.html` in a browser.

### Manual Smoke Checklist

Run in the latest stable release of Chrome, Firefox, Edge, and Safari:

| Area | Check |
|------|-------|
| Greeting | Clock ticks every second; date updates at midnight; greeting phrase matches time of day |
| Name | Save a name → appears in greeting; clear name → greeting shows without suffix; name > 50 chars displays truncated |
| Timer | Start counts down; Stop pauses; Reset restores duration; reaching 00:00 shows session-end indicator |
| Duration | Set valid duration → timer resets to new value; set invalid value → inline error shown |
| To-Do | Add task → appears in list; edit task → updates text; toggle → strikethrough applied; delete → removed |
| Quick Links | Add valid link → button appears; click → opens new tab; add invalid URL → inline error; delete → removed |
| Theme | Toggle switches light/dark; preference persists on reload; OS preference respected when no stored value |
| Storage | Reload page → all data (tasks, links, name, timer duration, theme) restored from localStorage |
| Keyboard | Tab through all controls; Enter/Space activate buttons; Escape cancels edit mode |
| Console | Zero JS errors or warnings in all four browsers |

### Browser Compatibility

No polyfills or build tools are used. The app relies only on standard features available natively in current Chrome, Firefox, Edge, and Safari:
- ES6 modules (`type="module"`)
- CSS custom properties
- `localStorage`
- `crypto.randomUUID()` (with Date-based fallback for older Safari)
- `new URL()` for URL validation
- `prefers-color-scheme` media query
