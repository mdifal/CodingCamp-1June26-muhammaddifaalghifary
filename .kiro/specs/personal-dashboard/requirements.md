# Requirements Document

## Introduction

A personal dashboard delivered as a standalone web app (or browser new tab replacement) built with plain HTML, CSS, and Vanilla JavaScript. All data is stored client-side using the browser Local Storage API. The dashboard combines a time-aware greeting, a configurable Pomodoro focus timer, a persistent to-do list, and a set of user-defined quick-access links — all wrapped in a light/dark themed interface with a customisable user name.

---

## Glossary

- **Dashboard**: The single-page web application that hosts all widgets.
- **Greeting_Widget**: The area that displays the current time, date, and a time-of-day greeting.
- **Timer_Widget**: The Pomodoro-style countdown timer component.
- **Todo_Widget**: The to-do list component including task input, task list, and controls.
- **Links_Widget**: The quick-links component that renders user-defined bookmark buttons.
- **Storage**: The browser `localStorage` API used as the sole persistence layer.
- **Theme_Controller**: The module responsible for toggling and persisting the light/dark colour theme.
- **User_Profile**: The stored object containing the user's display name.
- **Task**: A to-do item with at minimum a text label and a completion status.
- **Link**: A bookmark entry with a display label and a URL.
- **Pomodoro_Duration**: The configurable countdown length (in minutes) used by the Timer_Widget.

---

## Requirements

### Requirement 1: Display Current Time and Date

**User Story:** As a user, I want to see the current time and date at a glance, so that I am always oriented without switching tabs.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM:SS format based on the browser's local timezone, updated once per second.
2. THE Greeting_Widget SHALL display the current full date in the format "Weekday, DD Month YYYY" (e.g., "Saturday, 06 June 2026") based on the browser's local timezone.
3. WHEN the local clock ticks to a new second, THE Greeting_Widget SHALL update the displayed time within 1 second and SHALL do so without triggering a page navigation or page reload.
4. WHEN the date changes (midnight rollover or DST transition), THE Greeting_Widget SHALL update both the displayed time and the displayed date to reflect the new values within 1 second of the change.

---

### Requirement 2: Time-of-Day Greeting

**User Story:** As a user, I want to receive a greeting that reflects the time of day, so that the dashboard feels personal and contextual.

#### Acceptance Criteria

1. WHEN the current local hour is between 05 and 11 (inclusive), THE Greeting_Widget SHALL display the greeting "Good morning".
2. WHEN the current local hour is between 12 and 17 (inclusive), THE Greeting_Widget SHALL display the greeting "Good afternoon".
3. WHEN the current local hour is between 18 and 20 (inclusive), THE Greeting_Widget SHALL display the greeting "Good evening".
4. WHEN the current local hour is between 21 and 23 (inclusive) or between 00 and 04 (inclusive), THE Greeting_Widget SHALL display the greeting "Good night".
5. IF the Greeting_Widget cannot determine the current local hour (e.g., `Date` API throws or returns an invalid value), THE Greeting_Widget SHALL hide the time-of-day greeting text and display a visible error indicator in its place; THE Greeting_Widget SHALL NOT display any time-of-day greeting text while in this error state.
6. All time-range evaluations in criteria 1–4 SHALL use the user's local device timezone as returned by the browser's `Date` API.

---

### Requirement 3: Custom Name in Greeting

**User Story:** As a user, I want my name to appear in the greeting, so that the dashboard feels personalised to me.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL append the stored user name to the time-of-day greeting using the format "[Greeting], [Name]" (e.g., "Good morning, Alex").
2. WHEN no user name has been saved in Storage, THE Greeting_Widget SHALL display only the time-of-day greeting without any name suffix.
3. WHEN the user submits a non-empty name via the name-input field, THE Dashboard SHALL trim leading and trailing whitespace from the value and persist the trimmed result to Storage under the key `userName`, then update the greeting display immediately without a page reload.
4. WHEN the Dashboard loads, THE Greeting_Widget SHALL read `userName` from Storage; IF a non-empty value is found, THE Greeting_Widget SHALL display it appended to the greeting; IF no value is found or the value is empty, THE Greeting_Widget SHALL display the greeting without a name suffix.
5. WHEN the user clears the name-input field and saves, THE Dashboard SHALL remove the `userName` entry from Storage and update the Greeting_Widget to display only the time-of-day greeting without a name suffix.
6. WHEN the stored `userName` value exceeds 50 characters, THE Dashboard SHALL truncate the displayed name to 50 characters but SHALL NOT alter the value stored in Storage.

---

### Requirement 4: Focus Timer (Pomodoro)

**User Story:** As a user, I want a countdown timer, so that I can manage focused work sessions.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Timer_Widget SHALL read the stored `pomodoroDuration` value (an integer between 1 and 120 minutes) from Storage and initialise the countdown display to that value in MM:SS format; IF no stored value is found, THE Timer_Widget SHALL initialise to 25:00.
2. WHEN the user activates the Start control, THE Timer_Widget SHALL begin counting down one second per real second.
3. WHEN the user activates the Stop control while the timer is running, THE Timer_Widget SHALL pause the countdown and retain the current remaining time in the display.
4. IF the user activates the Stop control while the timer is not running, THE Timer_Widget SHALL take no action.
5. WHEN the user activates the Reset control, THE Timer_Widget SHALL stop the countdown and restore the display to the current `pomodoroDuration` value in MM:SS format.
6. WHEN the countdown reaches 00:00, THE Timer_Widget SHALL stop automatically and display a distinctly visible session-end indicator; THE session-end indicator SHALL remain visible until the user activates the Reset or Start control.
7. THE Timer_Widget SHALL display remaining time in MM:SS format at all times.
8. WHILE the timer is running, THE Timer_Widget SHALL disable the Start control and enable the Stop and Reset controls.
9. WHILE the timer is stopped or paused, THE Timer_Widget SHALL enable the Start control, disable the Stop control, and enable the Reset control.
10. WHEN the Dashboard first loads and the timer has not yet been started, THE Timer_Widget SHALL display the Start control as enabled, the Stop control as disabled, and the Reset control as disabled.

---

### Requirement 5: Configurable Pomodoro Duration

**User Story:** As a user, I want to change the Pomodoro timer duration, so that I can adapt the session length to my working style.

#### Acceptance Criteria

1. THE Timer_Widget SHALL provide a duration-input field that accepts integer values between 1 and 120 (minutes, inclusive); the input field SHALL be submitted via an explicit Save/Set control or the Enter key.
2. WHEN the user submits a valid new duration, THE Dashboard SHALL persist the integer value to Storage under the key `pomodoroDuration`.
3. WHEN the user submits a valid new duration while the timer is stopped or paused, THE Timer_Widget SHALL immediately reset the countdown display to the new duration in MM:SS format and update the duration-input field to show the new value.
4. WHEN the user submits a valid new duration while the timer is running, THE Timer_Widget SHALL immediately stop the timer, reset the countdown display to the new duration in MM:SS format, and update the duration-input field to show the new value.
5. WHEN the user submits a duration that is not an integer or is outside the range 1–120, THE Timer_Widget SHALL display an inline validation message, SHALL NOT update the stored duration, and SHALL retain the last valid duration in both the countdown display and the duration-input field.
6. WHEN the Dashboard loads, THE Timer_Widget SHALL read `pomodoroDuration` from Storage and initialise both the countdown display and the duration-input field to that value; IF no value exists in Storage, THE Timer_Widget SHALL default to 25 minutes for both the countdown display and the duration-input field.

---

### Requirement 6: To-Do List — Add and Display Tasks

**User Story:** As a user, I want to add tasks to a list, so that I can track what I need to do.

#### Acceptance Criteria

1. THE Todo_Widget SHALL provide a text-input field (maximum 500 characters) and an Add control for entering new tasks; the Add control SHALL be activated via button click or the Enter key.
2. WHEN the user submits a non-empty, non-whitespace-only task string of 500 characters or fewer, THE Todo_Widget SHALL trim leading and trailing whitespace, append the new Task to the task list, clear the input field, and persist the updated list to Storage under the key `tasks`.
3. IF the user submits an empty or whitespace-only string, THE Todo_Widget SHALL display an inline validation message indicating the field is required and SHALL NOT add a task.
4. IF the user submits a task string exceeding 500 characters, THE Todo_Widget SHALL display an inline validation message indicating the character limit and SHALL NOT add the task.
5. IF the `tasks` list already contains 100 items, THE Todo_Widget SHALL display an inline validation message indicating the task limit has been reached and SHALL NOT add the task.
6. WHEN the Dashboard loads, THE Todo_Widget SHALL read the `tasks` array from Storage and render all stored tasks; IF no `tasks` array is found in Storage, THE Todo_Widget SHALL render an empty list with no error.
7. IF a Storage write fails when persisting a new task, THE Todo_Widget SHALL display an inline error message and SHALL NOT add the task to the rendered list.

---

### Requirement 7: To-Do List — Edit Tasks

**User Story:** As a user, I want to edit existing tasks, so that I can correct mistakes or update task details.

#### Acceptance Criteria

1. THE Todo_Widget SHALL provide an Edit control for each rendered Task.
2. WHEN the user activates the Edit control for a Task, THE Todo_Widget SHALL replace the task label with an editable text field pre-filled with the current task text, and SHALL provide a Confirm control (e.g., "Save" button or Enter key) and a Cancel control (e.g., "Cancel" button or Escape key) within the edit interface.
3. WHEN the user confirms the edit with a non-empty, non-whitespace-only string, THE Todo_Widget SHALL trim leading and trailing whitespace from the new text, update the Task's text, persist the updated `tasks` array to Storage, and restore the task label display with the updated text.
4. IF the user confirms an edit with an empty or whitespace-only string, THE Todo_Widget SHALL display an inline validation message and SHALL NOT save the change; the edit field SHALL remain active.
5. WHEN the user cancels the edit, THE Todo_Widget SHALL discard any changes and restore the original task label display without modifying Storage.
6. IF a Task is already in edit mode and the user activates the Edit control for a different Task, THE Todo_Widget SHALL cancel the first edit (discarding changes) before entering edit mode for the second Task; only one Task SHALL be in edit mode at any time.

---

### Requirement 8: To-Do List — Complete and Delete Tasks

**User Story:** As a user, I want to mark tasks as done and remove tasks I no longer need, so that I can manage my list effectively.

#### Acceptance Criteria

1. THE Todo_Widget SHALL provide a completion toggle (e.g., checkbox) for each rendered Task.
2. WHEN the user toggles the completion control for an incomplete Task, THE Todo_Widget SHALL set the Task's completion status to complete and apply a strikethrough style to the task text label.
3. WHEN the user toggles the completion control for a complete Task, THE Todo_Widget SHALL set the Task's completion status to incomplete and remove the strikethrough style from the task text label.
4. WHEN the completion status changes per criteria 2 or 3, THE Todo_Widget SHALL persist the updated `tasks` array to Storage.
5. THE Todo_Widget SHALL provide a Delete control for each rendered Task.
6. WHEN the user activates the Delete control for a Task, THE Todo_Widget SHALL immediately remove the Task from the rendered list and persist the updated `tasks` array to Storage.
7. IF a Storage write fails when persisting a completion toggle or deletion, THE Todo_Widget SHALL display an inline error message and SHALL revert the in-memory task list to its pre-operation state.

---

### Requirement 9: Quick Links — Display and Open

**User Story:** As a user, I want quick-access buttons to my favourite websites, so that I can navigate to them with a single click.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Links_Widget SHALL read the `quickLinks` array from Storage and render each Link as a labelled button; IF a Link's label exceeds 50 characters, THE Links_Widget SHALL truncate the displayed label to 50 characters without altering the stored value.
2. WHEN the user activates a Link button (via click or keyboard activation), THE Dashboard SHALL open the corresponding URL in a new browser tab.
3. IF a stored Link's URL is malformed or cannot be opened as a valid URL, THE Links_Widget SHALL render the Link button as disabled and display a visible indicator on that button indicating the URL is invalid.
4. WHEN the `quickLinks` array in Storage is empty or contains no renderable Link buttons, THE Links_Widget SHALL display an empty-state message indicating that no links are available.

---

### Requirement 10: Quick Links — Add and Delete

**User Story:** As a user, I want to add and remove quick links, so that I can keep the list current.

#### Acceptance Criteria

1. THE Links_Widget SHALL provide a label-input field (maximum 100 characters) and a URL-input field (maximum 2048 characters) along with an Add control for adding new links.
2. WHEN the user submits a new link with a non-empty label (1–100 characters) and a valid URL (beginning with `http://` or `https://`, maximum 2048 characters), THE Links_Widget SHALL append the Link to the list and persist the updated `quickLinks` array to Storage.
3. WHEN the user submits a link with an empty label, an empty URL, a label exceeding 100 characters, or a URL exceeding 2048 characters, THE Links_Widget SHALL display an inline validation message indicating the specific field error and SHALL NOT add the link.
4. WHEN the user submits a URL that does not begin with `http://` or `https://`, THE Links_Widget SHALL display an inline validation message indicating the URL format requirement and SHALL NOT add the link.
5. THE Links_Widget SHALL provide a Delete control for each rendered Link.
6. WHEN the user activates the Delete control for a Link, THE Links_Widget SHALL remove the Link from the list and persist the updated `quickLinks` array to Storage.
7. IF the `quickLinks` list already contains 50 items, THE Links_Widget SHALL display an inline validation message indicating the link limit has been reached and SHALL NOT add the new link.
8. IF a Storage write fails when persisting an add or delete operation, THE Links_Widget SHALL display an inline error message and SHALL revert the in-memory links list to its pre-operation state.

---

### Requirement 11: Light / Dark Mode

**User Story:** As a user, I want to switch between a light and dark colour theme, so that I can adjust the interface to my environment or preference.

#### Acceptance Criteria

1. THE Theme_Controller SHALL provide a toggle control that is rendered and not hidden on the Dashboard at all times; the toggle SHALL visually indicate the currently active theme (e.g., a sun icon for light, a moon icon for dark).
2. WHEN the user activates the theme toggle, THE Theme_Controller SHALL switch the active theme between light and dark, update the toggle's visual indicator to reflect the newly active theme, and persist the selection to Storage under the key `theme` using the value `"light"` or `"dark"`.
3. WHEN the Dashboard loads, THE Theme_Controller SHALL read the `theme` value from Storage and apply the matching theme before any visible content is painted; the applied theme SHALL exactly match the stored `"light"` or `"dark"` value.
4. IF no `theme` value exists in Storage and `prefers-color-scheme` is detectable by the browser, THE Theme_Controller SHALL apply the theme that matches the operating system preference.
5. IF no `theme` value exists in Storage and `prefers-color-scheme` is not detectable, THE Theme_Controller SHALL apply the light theme by default.
6. THE Dashboard SHALL always apply exactly one background style — WHILE dark theme is active, THE Dashboard SHALL apply a dark background with light foreground text across all widgets such that the foreground text is visually distinguishable from the background; WHILE light theme is active, THE Dashboard SHALL apply a light background with dark foreground text across all widgets such that the foreground text is visually distinguishable from the background.

---

### Requirement 12: Single-File Structure and Performance

**User Story:** As a developer, I want a clean, single-file-per-type structure, so that the codebase remains easy to maintain and deploy.

#### Acceptance Criteria

1. THE Dashboard SHALL be delivered as exactly one HTML file, one CSS file inside a `css/` directory, and one JavaScript file inside a `js/` directory.
2. THE Dashboard SHALL load and become fully interactive — defined as all widgets rendered, all controls responding to user input, and no loading indicators active — within 3 seconds on a connection of at least 10 Mbps download speed, without any backend server.
3. THE Dashboard SHALL store and retrieve all persistent data exclusively via the browser `localStorage` API with no external network calls for data persistence.
4. WHEN the user interacts with any widget control (buttons, dropdowns, toggles, or input fields), THE Dashboard SHALL reflect the updated UI state within 100 milliseconds.

---

### Requirement 13: Browser Compatibility

**User Story:** As a user, I want the dashboard to work in any modern browser, so that I am not restricted to a specific browser.

#### Acceptance Criteria

1. THE Dashboard SHALL function correctly in the latest stable release of Chrome, Firefox, Edge, and Safari (at time of testing), meaning: all widgets render without JavaScript errors, all interactive controls respond to user input as specified, and no console errors referencing unsupported or non-standard features appear.
2. THE Dashboard SHALL use only standard HTML5, CSS3, and ES6+ JavaScript features available natively in the four target browsers without polyfills or non-standard extensions.
3. IF a standard feature used by the Dashboard is not supported in one of the four target browsers, THE Dashboard SHALL display a visible, user-readable fallback or degraded-state message for the affected widget rather than silently failing or displaying broken UI.
