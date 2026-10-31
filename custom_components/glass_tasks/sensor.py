"""Sensors: how many tasks are left to do, plus one sensor per task for automations."""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorStateClass
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .board import TaskBoard
from .const import DOMAIN, SIGNAL_UPDATED, STATUS_DUE, STATUS_OVERDUE, STATUSES, VERSION


async def async_setup_entry(hass: HomeAssistant, entry, async_add_entities: AddEntitiesCallback) -> None:
    board: TaskBoard = entry.runtime_data
    known: set[str] = set()

    def _new_task_entities(tasks: list[dict[str, Any]]) -> list[SensorEntity]:
        fresh = [t for t in tasks if t["id"] not in known]
        known.update(t["id"] for t in fresh)
        return [TaskSensor(board, entry.entry_id, t["id"]) for t in fresh]

    async_add_entities([ToDoSensor(board, entry.entry_id), *_new_task_entities(board.tasks)])

    @callback
    def _on_change(action: str, item: dict[str, Any]) -> None:
        if action == "added":
            async_add_entities(_new_task_entities([item]))
        elif action == "removed":
            known.discard(item["id"])

    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_UPDATED, _on_change))


class _BoardEntity(SensorEntity):
    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, board: TaskBoard, entry_id: str) -> None:
        self._board = board
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry_id)},
            name="Glass Task Board",
            manufacturer="Community",
            model="Task board",
            sw_version=VERSION,
        )

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(async_dispatcher_connect(self.hass, SIGNAL_UPDATED, self._handle_update))

    @callback
    def _handle_update(self, *_: Any) -> None:
        self.async_write_ha_state()


class ToDoSensor(_BoardEntity):
    """Number of tasks due or overdue right now."""

    _attr_icon = "mdi:checkbox-marked-circle-outline"
    _attr_name = "Tasks to do"
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = "tasks"

    def __init__(self, board: TaskBoard, entry_id: str) -> None:
        super().__init__(board, entry_id)
        self._attr_unique_id = f"{entry_id}_to_do"

    @property
    def native_value(self) -> int:
        return sum(1 for t in self._board.tasks if t.get("status") in (STATUS_DUE, STATUS_OVERDUE))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        tasks = self._board.tasks
        return {
            "overdue": [t["title"] for t in tasks if t.get("status") == STATUS_OVERDUE],
            "due": [t["title"] for t in tasks if t.get("status") == STATUS_DUE],
            "total": len(tasks),
        }


class TaskSensor(_BoardEntity):
    """One task: its state is done, due, overdue or upcoming."""

    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = STATUSES

    def __init__(self, board: TaskBoard, entry_id: str, task_id: str) -> None:
        super().__init__(board, entry_id)
        self._task_id = task_id
        self._attr_unique_id = f"{entry_id}_task_{task_id}"
        task = board.get(task_id) or {}
        self._attr_name = task.get("title") or "Task"

    @callback
    def _handle_update(self, action: str = "", item: dict[str, Any] | None = None, *_: Any) -> None:
        if not item or item.get("id") != self._task_id:
            return
        if action == "removed":
            registry = er.async_get(self.hass)
            if self.registry_entry is not None:
                registry.async_remove(self.entity_id)
            else:
                self.hass.async_create_task(self.async_remove())
            return
        self._attr_name = item.get("title") or self._attr_name
        self.async_write_ha_state()

    @property
    def available(self) -> bool:
        return self._board.get(self._task_id) is not None

    @property
    def icon(self) -> str:
        status = (self._board.get(self._task_id) or {}).get("status")
        return {
            "done": "mdi:check-circle",
            "due": "mdi:circle-outline",
            "overdue": "mdi:alert-circle",
        }.get(status, "mdi:calendar-clock")

    @property
    def native_value(self) -> str | None:
        return (self._board.get(self._task_id) or {}).get("status")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        task = self._board.get(self._task_id) or {}
        last = (task.get("history") or [None])[0]
        return {
            "task_id": self._task_id,
            "icon_emoji": task.get("icon"),
            "assignee": task.get("assignee"),
            "schedule": task.get("summary"),
            "due_at": task.get("due_at"),
            "next_due": task.get("next_due"),
            "last_done_at": last.get("at") if last else None,
            "last_done_by": last.get("by_name") if last else None,
            "done_today": task.get("done_today"),
            "times_today": task.get("slots_today"),
        }
