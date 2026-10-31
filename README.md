# Glass Task Board

**A frosted-glass board for the jobs your home repeats, made for a wall tablet running Home Assistant.**

"Did someone already feed the dog?" Glass Task Board answers that at a glance. Each recurring task is a glass tile. Tap it when it's done, pick who did it, and it resets on its own schedule. If something isn't done in time, the tile glows red and a reminder goes to that person's phone.

![The board](docs/images/board.png)

## What it does

- **Tap, pick a face, done.** Tapping a task asks "Who did it?" with everyone's picture. The tile then shows who did it and when.
- **Resets on its own.** Every day, several times a day (feed the dog at 8 am *and* 6 pm), on certain weekdays (bins on Tuesday), or every few days counted from when it was last done (water the plants every 3 days).
- **Overdue tasks stand out.** After their due time, tiles glow red and the person whose job it is (or everyone) gets a phone reminder.
- **Late still counts.** Feeding the dog at 8:30 counts as the morning feed, not the evening one.
- **History.** See who did each task and when, and undo a tap made by mistake.
- **Whose job.** Give a task to one person or to everyone, and filter the board by person or by "To do".
- **Works with automations.** Every task is a sensor (`done`, `due`, `overdue` or `upcoming`), and there are services to mark tasks done from a button, NFC tag or voice assistant.
- **Glass look and ambient mode.** Same frosted-glass style and colour themes as [Glass Message Board](https://github.com/Degederon/GlassMessageBoard). When idle, the tablet shows a big clock and whatever is due next.

| Who did it? | New task | History |
|---|---|---|
| ![Who did it](docs/images/who-did-it.png) | ![New task](docs/images/new-task.png) | ![History](docs/images/history.png) |

## Install

### HACS (custom repository)

1. In HACS, open the menu (⋮) → **Custom repositories**.
2. Add `https://github.com/Degederon/GlassTaskBoard` with the type **Integration**.
3. Install **Glass Task Board**, then restart Home Assistant.

### Manually

Copy `custom_components/glass_tasks` into your Home Assistant `config/custom_components/` folder and restart Home Assistant.

### Set up

1. Go to **Settings → Devices & services → Add integration** and add **Glass Task Board**.
2. Open a dashboard, choose **Edit → Add card**, and pick **Glass Task Board**. The card loads automatically; you don't need to add a resource.
3. On the board, tap **People** to add everyone in the house, then **New task**. There are ready-made tasks to start from.

For a wall tablet, a dashboard in panel view with the card filling the screen works best.

## Card options

| Option | Default | Description |
|---|---|---|
| `title` | `Tasks` | Shown in the header. |
| `height` | full screen | Any CSS height, like `100vh` or `720px`. |
| `ambient_after` | `120` | Seconds without a touch before showing the big clock. `0` turns it off. |
| `column_width` | `260` | Minimum tile width in pixels. |
| `group_by_status` | `false` | Show "To do" tiles first and done ones last, instead of a fixed order. |
| `show_clock` | `true` | Show the clock in the header. |
| `background_image` | — | Optional image URL behind the glass. |

## Reminders

Overdue reminders go to:

- **People added on the board:** pick their phone in the **People** screen.
- **Home Assistant users:** go to **Settings → Devices & services → Glass Task Board → Configure** and pick a notify service for each person.

Turn reminders off for a single task under **More options** when editing it.

## Sensors

- `sensor.glass_task_board_tasks_to_do`: how many tasks are due or overdue right now, with lists of their names.
- One sensor per task, for example `sensor.glass_task_board_feed_the_dog`. Its state is `done`, `due`, `overdue` or `upcoming`, with attributes such as `due_at`, `next_due`, `last_done_by` and `last_done_at`.

Example: flash a light if the dog hasn't been fed.

```yaml
automation:
  - alias: Dog not fed
    triggers:
      - trigger: state
        entity_id: sensor.glass_task_board_feed_the_dog
        to: overdue
    actions:
      - action: light.turn_on
        target:
          entity_id: light.kitchen
        data:
          flash: long
```

## Services

| Service | What it does |
|---|---|
| `glass_tasks.complete` | Mark a task done. `task` is its name or id; `by` is optional (a person entity or board member). |
| `glass_tasks.undo` | Take back the most recent "done". |
| `glass_tasks.add_task` | Add a task from a script. |
| `glass_tasks.delete_task` | Remove a task. |
| `glass_tasks.set_background` | Change the colour theme on every screen. |

Example: an NFC tag by the dog bowl.

```yaml
automation:
  - alias: Dog bowl tag
    triggers:
      - trigger: tag
        tag_id: dog-bowl
    actions:
      - action: glass_tasks.complete
        data:
          task: Feed the dog
```

## Events

- `glass_tasks_completed`: fired when a task is marked done (`id`, `title`, `by`, `by_name`, `at`).
- `glass_tasks_overdue`: fired once when a task becomes overdue (`id`, `title`, `assignee`, `due_at`).

## Development

The schedule logic has no Home Assistant dependencies and comes with tests:

```sh
python3 tests/test_schedule.py
```

## License

MIT
