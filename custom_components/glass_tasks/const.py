"""Constants for the Glass Task Board integration."""

from __future__ import annotations

DOMAIN = "glass_tasks"
VERSION = "0.1.0"

STORAGE_KEY = f"{DOMAIN}.board"
STORAGE_VERSION = 1

SIGNAL_UPDATED = f"{DOMAIN}_updated"
EVENT_COMPLETED = f"{DOMAIN}_completed"
EVENT_OVERDUE = f"{DOMAIN}_overdue"

CARD_URL = f"/{DOMAIN}/glass-task-board.js"
DATA_FRONTEND = f"{DOMAIN}_frontend_registered"
DATA_WS = f"{DOMAIN}_ws_registered"

EVERYONE = "everyone"
MEMBER_PREFIX = "member."
MAX_MEMBERS = 30

MAX_TASKS = 100
MAX_TITLE = 60
MAX_TIMES = 6
MAX_HISTORY = 50
MAX_EVERY_DAYS = 365

TINTS = ["clear", "rose", "amber", "mint", "sky", "violet"]

# How a task repeats.
REPEAT_DAILY = "daily"  # every day, optionally several times a day
REPEAT_WEEKLY = "weekly"  # on chosen weekdays (0 = Monday)
REPEAT_EVERY = "every"  # every N days, counted from when it was last done
REPEATS = [REPEAT_DAILY, REPEAT_WEEKLY, REPEAT_EVERY]

# Task status, worked out from the schedule and the last time it was done.
STATUS_DONE = "done"
STATUS_DUE = "due"
STATUS_OVERDUE = "overdue"
STATUS_UPCOMING = "upcoming"
STATUSES = [STATUS_OVERDUE, STATUS_DUE, STATUS_DONE, STATUS_UPCOMING]

# Background colour themes. The card holds the actual colours for each preset.
BACKGROUND_PRESETS = [
    "aurora",
    "black",
    "sunset",
    "ocean",
    "forest",
    "lavender",
    "ember",
    "graphite",
    "midnight",
    "halloween",
    "festive",
]
BACKGROUND_CUSTOM = "custom"
DEFAULT_BACKGROUND = {"preset": "aurora", "colors": []}

# Options
CONF_NOTIFY_EVERYONE = "notify_everyone"
CONF_NOTIFY_URL = "notify_url"
