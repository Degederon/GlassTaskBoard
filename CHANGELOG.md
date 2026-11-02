# Changelog

All notable changes to this project are documented in this file.

## [0.4.0] - 2026-11-02

### Added

- **One time** under **How often?**, for jobs that happen once, like calling the plumber on Thursday. Pick **Today**, **Tomorrow** or any day, with an optional due time. Before its day the tile says when; on the day it's due; if it's missed it stays overdue (with the reminder and pop-up) until someone does it. Once done it never comes back, and it leaves the board the day after.
- `glass_tasks.add_task` takes `repeat: once` and a `date`.

### Fixed

- When a task was overdue, the **To do** filter button stretched across the header and glowed. It picked up the overdue pop-up's style by mistake.

## [0.3.0] - 2026-11-02

### Added

- An overdue pop-up, so tasks aren't missed. When a task becomes overdue, a full-screen glass alert appears on the board, even over the ambient clock, listing everything that's overdue. **Done** asks who did it (closing that without picking anyone brings the alert back), **Remind me in 15 min** snoozes it, and **Got it** hides it until the task's next due time. It closes on its own once someone does the task, on any screen. Available in English, German, Spanish and French.
- Card options `alert_overdue` (on by default), `alert_sound` (a soft chime, off by default) and `alert_snooze` (minutes, 15 by default).
- An automation example in the README that wakes a sleeping tablet screen when a task becomes overdue.

## [0.2.0] - 2026-11-02

### Added

- A ready-to-go dashboard, `dashboards/household-tasks.yaml`: the full-screen board for a wall tablet, plus a **Today** view with what's due, every task's status and schedule, and what got done today. It finds every task on its own.
- A quick start at the top of the README: install, make a dashboard, configure.
- German, Spanish and French. The board's buttons, task status and schedules, the task form and its ready-made tasks, background names, People screen, ambient screen and card settings follow each person's Home Assistant language; the setup and options screens, the actions and phone reminders follow Home Assistant's language. English is unchanged.
- The integration now adds the board to **Settings → Dashboards → Resources** automatically and updates its version number after every update, so tablets always load the current board. An entry added by hand is updated rather than duplicated. Dashboards in YAML mode get the board loaded on every page instead.

### Changed

- A new app icon in the same style as Glass Message Board: two frosted-glass cards on the aurora background, the front one a checklist, with a mint badge holding a tick inside a repeat arrow.
- The README now follows the same layout as Glass Message Board: a step-by-step setup, a picture tour, tables for options, actions, sensors and events, a Languages section with pictures of the board in each language, and troubleshooting.

### Fixed

- The Who did it?, task, editor, People and Background windows no longer flicker when you tap inside them. They now animate only when they first open.
- On narrow screens, filter buttons no longer squeeze their text onto two lines.
- Tasks without a due time no longer say "Next: tomorrow 12:00 AM"; they say "Next: tomorrow".

## [0.1.1] - 2026-11-01

### Added

- An app icon: a frosted-glass tile with a green tick and a repeat arrow. It appears next to Glass Task Board in the Marketplace and on the Devices & services page (Home Assistant 2026.3 or later).

## [0.1.0] - 2026-10-31

### Added

- First release: recurring household tasks on a frosted-glass board.
- Tap a task and pick who did it; it resets on its own schedule (daily, several times a day, certain weekdays, or every few days).
- Overdue tiles glow and send phone reminders.
- History with undo, per-person filters, ambient clock mode and colour themes.
- A sensor for every task, plus actions and events for automations.
