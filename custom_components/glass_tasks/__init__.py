"""Glass Task Board: recurring household tasks on a beautiful glass dashboard."""

from __future__ import annotations

from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.event import async_track_time_interval

from .board import TaskBoard
from .const import CARD_URL, DATA_FRONTEND, DOMAIN, VERSION
from .notifier import async_send_overdue
from .services import async_register_services, async_unregister_services
from .websocket import async_register_websocket

PLATFORMS = [Platform.SENSOR]
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

type GlassTasksConfigEntry = ConfigEntry[TaskBoard]


async def async_setup_entry(hass: HomeAssistant, entry: GlassTasksConfigEntry) -> bool:
    board = TaskBoard(hass)
    await board.async_load()
    entry.runtime_data = board
    hass.data[DOMAIN] = board

    await _async_register_frontend(hass)
    async_register_websocket(hass)
    async_register_services(hass)

    @callback
    def _overdue(task: dict[str, Any]) -> None:
        hass.async_create_task(async_send_overdue(hass, entry, task))

    @callback
    def _tick(_now: datetime) -> None:
        board.refresh()

    board.on_overdue = _overdue
    entry.async_on_unload(async_track_time_interval(hass, _tick, timedelta(minutes=1)))
    entry.async_on_unload(entry.add_update_listener(_async_reload))

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    board.refresh()
    return True


async def async_unload_entry(hass: HomeAssistant, entry: GlassTasksConfigEntry) -> bool:
    if unloaded := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        entry.runtime_data.on_overdue = None
        hass.data.pop(DOMAIN, None)
        async_unregister_services(hass)
    return unloaded


async def _async_reload(hass: HomeAssistant, entry: GlassTasksConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


async def _async_register_frontend(hass: HomeAssistant) -> None:
    """Serve the card and load it on every dashboard — no manual resource needed."""
    if hass.data.get(DATA_FRONTEND):
        return
    card = Path(__file__).parent / "frontend" / "glass-task-board.js"
    await hass.http.async_register_static_paths([StaticPathConfig(CARD_URL, str(card), False)])
    add_extra_js_url(hass, f"{CARD_URL}?v={VERSION}")
    hass.data[DATA_FRONTEND] = True
