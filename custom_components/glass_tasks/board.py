"""The task store: persistence, status tracking and change broadcasting."""

from __future__ import annotations

import uuid
from collections.abc import Callable
from datetime import datetime
from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from . import schedule
from .const import (
    DEFAULT_BACKGROUND,
    EVENT_COMPLETED,
    EVENT_OVERDUE,
    EVERYONE,
    MAX_HISTORY,
    MAX_MEMBERS,
    MAX_TASKS,
    REPEAT_DAILY,
    REPEAT_EVERY,
    REPEAT_WEEKLY,
    SIGNAL_UPDATED,
    STATUS_OVERDUE,
    STORAGE_KEY,
    STORAGE_VERSION,
)

# Fields a task can be created or edited with.
TASK_FIELDS = ("title", "icon", "tint", "assignee", "repeat", "days", "every_days", "times", "notify")
# How much history the card receives (the store keeps more).
CARD_HISTORY = 12


class TaskBoard:
    """Holds all tasks and people, and tells listeners when anything changes."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._tasks: dict[str, dict[str, Any]] = {}
        self._states: dict[str, dict[str, Any]] = {}
        self._members: dict[str, dict[str, Any]] = {}
        self._settings: dict[str, Any] = {
            "include_ha_people": True,
            "background": dict(DEFAULT_BACKGROUND),
        }
        # Called with a task when it becomes overdue (set up in __init__.py).
        self.on_overdue: Callable[[dict[str, Any]], None] | None = None

    async def async_load(self) -> None:
        data = await self._store.async_load() or {}
        self._tasks = {t["id"]: t for t in data.get("tasks", []) if isinstance(t, dict) and "id" in t}
        self._members = {m["id"]: m for m in data.get("members", []) if isinstance(m, dict) and "id" in m}
        self._settings.update(data.get("settings", {}))
        for task in self._tasks.values():
            self._states[task["id"]] = self._compute(task)

    # ------------------------------------------------------------------ read
    def _compute(self, task: dict[str, Any], now: datetime | None = None) -> dict[str, Any]:
        state = schedule.compute(task, now or dt_util.now())
        state["summary"] = schedule.describe(task)
        return state

    def public(self, task: dict[str, Any]) -> dict[str, Any]:
        """A task as the card and sensors see it: settings, status and recent history."""
        history = task.get("history") or []
        return {
            **{k: v for k, v in task.items() if k != "history"},
            **self._states.get(task["id"], {}),
            "history": history[-CARD_HISTORY:][::-1],
        }

    @property
    def tasks(self) -> list[dict[str, Any]]:
        ordered = sorted(self._tasks.values(), key=lambda t: (t.get("order", 0), t["created"]))
        return [self.public(t) for t in ordered]

    @property
    def members(self) -> list[dict[str, Any]]:
        """People added on the board itself (no Home Assistant account needed)."""
        return sorted(self._members.values(), key=lambda m: m["name"].lower())

    @property
    def settings(self) -> dict[str, Any]:
        return {**self._settings, "background": dict(self._settings["background"])}

    def get_member(self, member_id: str | None) -> dict[str, Any] | None:
        return self._members.get(member_id) if member_id else None

    def get(self, task_id: str) -> dict[str, Any] | None:
        task = self._tasks.get(task_id)
        return self.public(task) if task else None

    def find(self, key: str) -> dict[str, Any] | None:
        """Find a task by id or (case-insensitive) title."""
        if key in self._tasks:
            return self._tasks[key]
        wanted = key.strip().lower()
        return next((t for t in self._tasks.values() if t["title"].lower() == wanted), None)

    def for_person(self, person: str) -> list[dict[str, Any]]:
        """Tasks that are this person's job, or everyone's."""
        return [t for t in self.tasks if t.get("assignee", EVERYONE) in (person, EVERYONE)]

    # ----------------------------------------------------------------- tasks
    @callback
    def save_task(self, task_id: str | None, created_by: str | None = None, **fields: Any) -> dict[str, Any]:
        fields = {k: v for k, v in fields.items() if k in TASK_FIELDS and v is not None}
        if task_id:
            if (task := self._tasks.get(task_id)) is None:
                raise KeyError(task_id)
            task.update(fields)
            action = "updated"
        else:
            if len(self._tasks) >= MAX_TASKS:
                raise ValueError(f"The board can hold up to {MAX_TASKS} tasks")
            task = {
                "id": uuid.uuid4().hex[:12],
                "title": "",
                "icon": "✅",
                "tint": "clear",
                "assignee": EVERYONE,
                "repeat": REPEAT_DAILY,
                "days": [],
                "every_days": 1,
                "times": [],
                "notify": True,
                "created": dt_util.utcnow().isoformat(),
                "created_by_user_id": created_by,
                "order": max((t.get("order", 0) for t in self._tasks.values()), default=0) + 1,
                "history": [],
                "nudged": None,
                **fields,
            }
            action = "added"
        task["title"] = str(task.get("title") or "").strip()
        if not task["title"]:
            raise ValueError("Give the task a name")
        if task["repeat"] == REPEAT_WEEKLY and not task.get("days"):
            raise ValueError("Pick at least one day")
        if task["repeat"] != REPEAT_WEEKLY:
            task["days"] = []
        if task["repeat"] != REPEAT_EVERY:
            task["every_days"] = 1
        task["times"] = sorted(set(task.get("times") or []))
        task["days"] = sorted(set(task.get("days") or []))
        task_id = task["id"]
        if action == "added" or any(k in fields for k in ("repeat", "days", "every_days", "times")):
            # A new or changed schedule starts now: times already past today don't count against it.
            task["since"] = dt_util.utcnow().isoformat()
            task["nudged"] = None
        self._tasks[task_id] = task
        self._states[task_id] = self._compute(task)
        self._changed(action, self.public(task))
        return self.public(task)

    @callback
    def delete_task(self, task_id: str) -> bool:
        if self._tasks.pop(task_id, None) is None:
            return False
        self._states.pop(task_id, None)
        self._changed("removed", {"id": task_id})
        return True

    @callback
    def complete(self, task_id: str, *, by: str | None, by_name: str | None, at: datetime | None = None) -> dict[str, Any]:
        if (task := self._tasks.get(task_id)) is None:
            raise KeyError(task_id)
        when = dt_util.as_utc(at) if at else dt_util.utcnow()
        entry = {"at": when.isoformat(), "by": by, "by_name": by_name}
        history = task.setdefault("history", [])
        history.append(entry)
        history.sort(key=lambda e: e["at"])
        del history[:-MAX_HISTORY]
        self._states[task_id] = self._compute(task)
        self._changed("updated", self.public(task))
        self.hass.bus.async_fire(
            EVENT_COMPLETED,
            {"id": task_id, "title": task["title"], "by": by, "by_name": by_name, "at": entry["at"]},
        )
        return self.public(task)

    @callback
    def undo(self, task_id: str) -> dict[str, Any]:
        """Take back the most recent 'done' (for a tap by mistake)."""
        if (task := self._tasks.get(task_id)) is None:
            raise KeyError(task_id)
        history = task.get("history") or []
        if not history:
            raise ValueError("Nothing to undo")
        history.pop()
        self._states[task_id] = self._compute(task)
        self._changed("updated", self.public(task))
        return self.public(task)

    @callback
    def refresh(self, now: datetime | None = None) -> None:
        """Re-check every task (called every minute) and announce what changed."""
        now = now or dt_util.now()
        for task in self._tasks.values():
            old = self._states.get(task["id"], {})
            new = self._compute(task, now)
            self._states[task["id"]] = new
            keys = ("status", "due_at", "due_date", "next_due", "done_at")
            if any(old.get(k) != new.get(k) for k in keys):
                self._changed("updated", self.public(task), save=False)
            if new["status"] == STATUS_OVERDUE and task.get("nudged") != new["period_start"]:
                task["nudged"] = new["period_start"]
                self._save()
                self.hass.bus.async_fire(
                    EVENT_OVERDUE,
                    {"id": task["id"], "title": task["title"], "assignee": task.get("assignee"), "due_at": new["due_at"]},
                )
                if self.on_overdue is not None:
                    self.on_overdue(self.public(task))

    # --------------------------------------------------------------- people
    @callback
    def save_member(self, *, member_id: str | None, name: str, emoji: str, hue: int, notify: list[str]) -> dict[str, Any]:
        name = name.strip()
        if not name:
            raise ValueError("Please enter a name")
        if member_id and member_id not in self._members:
            raise KeyError(member_id)
        if not member_id and len(self._members) >= MAX_MEMBERS:
            raise ValueError(f"The board can hold up to {MAX_MEMBERS} people")
        member_id = member_id or f"member.{uuid.uuid4().hex[:8]}"
        member = {"id": member_id, "name": name, "emoji": emoji, "hue": int(hue) % 360, "notify": notify}
        self._members[member_id] = member
        self._members_changed()
        return member

    @callback
    def remove_member(self, member_id: str) -> bool:
        if self._members.pop(member_id, None) is None:
            return False
        # Their tasks become everyone's.
        for task in self._tasks.values():
            if task.get("assignee") == member_id:
                task["assignee"] = EVERYONE
                self._changed("updated", self.public(task), save=False)
        self._members_changed()
        return True

    @callback
    def update_settings(self, **settings: Any) -> dict[str, Any]:
        self._settings.update(settings)
        self._members_changed()
        return self.settings

    def _members_changed(self) -> None:
        self._save()
        async_dispatcher_send(
            self.hass, SIGNAL_UPDATED, "people", {"members": self.members, "settings": self.settings}
        )

    # -------------------------------------------------------------- internal
    def _save(self) -> None:
        self._store.async_delay_save(
            lambda: {
                "tasks": list(self._tasks.values()),
                "members": list(self._members.values()),
                "settings": self._settings,
            },
            1,
        )

    def _changed(self, action: str, task: dict[str, Any], save: bool = True) -> None:
        if save:
            self._save()
        async_dispatcher_send(self.hass, SIGNAL_UPDATED, action, task)
