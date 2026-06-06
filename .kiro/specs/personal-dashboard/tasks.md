# Implementation Plan: Personal Dashboard

## Overview

Implement a client-only single-page application using plain HTML5, CSS3, and Vanilla JavaScript (ES6+). The app delivers four widgets — Greeting, Timer, To-Do, and Quick Links — backed by a `localStorage` persistence layer and a centralised theme controller. No build tools, no Node.js, no testing frameworks — the project runs directly by opening `index.html` in a browser.

---

## Tasks

- [ ] 1. Set up project structure and core infrastructure
  - Create `index.html`, `css/styles.css`, and `js/app.js` matching the single-file-per-type structure
  - Scaffold the `StorageService` module (get, set, remove) with try/catch around every `localStorage` call
  - _Requirements: 12.1, 12.3_

- [ ] 2. Implement ThemeController
  - [ ] 2.1 Implement ThemeController module
    - Read `theme` from Storage on init; fall back to `prefers-color-scheme`, then `"light"`
    - Apply `theme-light` / `theme-dark` class on `<html>` before body content renders (inline script in HTML)
    - Expose `toggle()`: flip stored value, update class, update toggle button `aria-label` and icon
    - Define CSS custom properties (`--bg`, `--fg`, `--accent`, etc.) per theme class in `styles.css`
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 3. Implement GreetingWidget — clock, date, and greeting
  - [ ] 3.1 Implement `getGreeting(hour)` pure function and clock/date formatters
    - `getGreeting`: map hour 0–23 to one of four phrases (05–11 → morning, 12–17 → afternoon, 18–20 → evening, 21–23/00–04 → night)
    - Time formatter: produce `HH:MM:SS` with zero-padded components
    - Date formatter: produce `"Weekday, DD Month YYYY"` with zero-padded day
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.2 Implement `GreetingWidget.init()` and `_tick()` with error handling
    - Start 1-second `setInterval`; wrap `new Date()` in try/catch; show `⚠ Clock unavailable` on failure
    - Handle midnight/DST rollover by re-evaluating date on every tick
    - _Requirements: 1.3, 1.4, 2.5, 2.6_

  - [ ] 3.3 Implement `GreetingWidget.setName()` and name persistence
    - Trim input, persist under `userName`, update display without reload
    - Truncate displayed name to 50 characters; do not alter stored value
    - Handle empty/clear: remove `userName` from Storage, show greeting without suffix
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 4. Implement TimerWidget — state machine and display
  - [ ] 4.1 Implement `formatMMSS(totalSeconds)` utility
    - Zero-pad minutes and seconds; handle range 0–7200
    - _Requirements: 4.7_

  - [ ] 4.2 Implement `TimerWidget` state machine (idle → running → paused/finished → idle)
    - `init()`: read `pomodoroDuration` from Storage, default 25; initialise display and input field
    - `start()`, `stop()`, `reset()`: enforce state-machine transitions; guard rapid clicks via `getState()`
    - `_tick()`: decrement remaining seconds, check for 00:00, transition to FINISHED state
    - `_setState()`: enable/disable Start, Stop, Reset controls per spec
    - Show session-end indicator on FINISHED; hide on Reset or Start
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

  - [ ] 4.3 Implement `TimerWidget.setDuration(minutes)` with validation and persistence
    - Validate integer in 1–120; reject with inline message otherwise
    - On valid input: persist to Storage, reset display and input field, stop timer if running
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 5. Implement TodoWidget — full task CRUD
  - [ ] 5.1 Implement task data model, `_render()`, `_persist()`, and `init()`
    - Task shape: `{ id: string, text: string, completed: boolean }`; generate IDs with `crypto.randomUUID()` (Date-based fallback for older Safari)
    - `init()`: read `tasks` from Storage, render list; empty Storage → empty list, no error
    - `_render()`: full list re-render from in-memory array
    - `_persist()`: call `StorageService.set`; on `false`, revert state and render inline error
    - _Requirements: 6.6, 6.7, 8.7_

  - [ ] 5.2 Implement `TodoWidget.addTask(text)`
    - Trim input; reject empty/whitespace-only, > 500 characters, or list at 100 items with inline messages
    - On valid input: append task, clear input field, persist
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 5.3 Implement `TodoWidget.editTask(id, text)`
    - On Edit: replace label with pre-filled input + Save/Cancel controls; only one task in edit mode at a time
    - On Confirm (non-empty, non-whitespace): trim, update in-memory, persist, restore label
    - On Confirm (empty/whitespace): inline validation, keep edit field active
    - On Cancel / switching edit to another task: discard changes, restore original label
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ] 5.4 Implement `TodoWidget.toggleComplete(id)` and `TodoWidget.deleteTask(id)`
    - Toggle: flip `completed` boolean, apply/remove strikethrough style, persist
    - Delete: remove from in-memory list, re-render, persist
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 6. Implement LinksWidget — quick link CRUD
  - [ ] 6.1 Implement link data model, `_validateUrl()`, `_render()`, `_persist()`, and `init()`
    - Link shape: `{ id: string, label: string, url: string }`
    - `_validateUrl()`: must start with `http://` or `https://`, parseable by `new URL(url)` without throwing
    - `init()`: read `quickLinks` from Storage; render buttons; empty array → empty-state message
    - Truncate displayed label to 50 characters; render invalid-URL links as disabled with indicator
    - _Requirements: 9.1, 9.3, 9.4_

  - [ ] 6.2 Implement `LinksWidget.addLink(label, url)` with validation
    - Validate: non-empty label ≤ 100 chars, valid URL ≤ 2048 chars starting with http(s)://
    - Reject at 50-item limit with inline message; on valid input: append, persist
    - Open links in new tab on click/keyboard activation
    - _Requirements: 9.2, 10.1, 10.2, 10.3, 10.4, 10.7_

  - [ ] 6.3 Implement `LinksWidget.deleteLink(id)` with storage-failure rollback
    - Remove from in-memory list, re-render, persist; on persist failure revert and show inline error
    - _Requirements: 10.5, 10.6, 10.8_

- [ ] 7. Wire everything together in `App.init()` and finalise HTML/CSS
  - [ ] 7.1 Build `index.html` with semantic widget sections and ARIA roles/labels
    - Mark up Greeting, Timer, Todo, and Links sections with appropriate landmark roles
    - Include theme-toggle button, name-input, duration-input with accessible labels
    - Ensure all inline validation message containers use `role="alert"`
    - _Requirements: 12.1, 13.1, 13.2_

  - [ ] 7.2 Finalise `styles.css` with responsive layout and WCAG 2.1 AA contrast
    - Define all CSS custom properties under `.theme-light` and `.theme-dark`
    - Apply strikethrough style for completed tasks
    - Apply disabled-link indicator style for invalid URLs
    - Ensure foreground/background contrast ratio ≥ 4.5:1 in both themes
    - _Requirements: 11.6, 8.2, 9.3_

  - [ ] 7.3 Implement `App.init()` bootstrap — call each module's `init()` in order
    - Order: ThemeController → GreetingWidget → TimerWidget → TodoWidget → LinksWidget
    - Confirm all widgets render and all controls respond within 100 ms of interaction
    - _Requirements: 12.2, 12.4_

---

## Notes

- No Node.js, no npm, no build step — open `index.html` directly in any modern browser
- All persistent reads/writes go through `StorageService` — never `localStorage` directly
- The app uses standard ES6+ browser features (ES modules via `type="module"`, `crypto.randomUUID()`, CSS custom properties)
- All implementation lives in three files: `index.html`, `css/styles.css`, `js/app.js`

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1"] },
    { "id": 1, "tasks": ["3.2", "4.1"] },
    { "id": 2, "tasks": ["3.3", "4.2", "5.1"] },
    { "id": 3, "tasks": ["4.3", "5.2", "6.1"] },
    { "id": 4, "tasks": ["5.3", "5.4", "6.2"] },
    { "id": 5, "tasks": ["6.3", "7.1"] },
    { "id": 6, "tasks": ["7.2", "7.3"] }
  ]
}
```
