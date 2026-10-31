"""Services so automations, scripts and voice assistants can use the board."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv

from . import helpers as h
from .board import TaskBoard
from .const import DOMAIN, MAX_TITLE

SERVICES = ("complete", "undo", "add_task", "delete_task", "set_background")
TASK_FIELDS = ("title", "icon", "tint", "assignee", "repeat", "days", "every_days", "times", "notify")

TASK_REF = {vol.Required("task"): cv.string}
COMPLETE_SCHEMA = vol.Schema({**TASK_REF, vol.Optional("by"): h.person_entity})
UNDO_SCHEMA = vol.Schema(TASK_REF)
DELETE_SCHEMA = vol.Schema(TASK_REF)
# Equal voluptuous markers keep the first key, so drop the fields we override before adding them.
_OVERRIDDEN = ("title", "notify", "days", "times")
ADD_SCHEMA = vol.Schema(
    {
        **{k: v for k, v in h.task_fields().items() if str(k) not in _OVERRIDDEN},
        vol.Required("title"): vol.All(cv.string, vol.Strip, vol.Length(min=1, max=MAX_TITLE)),
        vol.Optional("notify"): cv.boolean,
        vol.Optional("days"): vol.All(cv.ensure_list, [vol.All(vol.Coerce(int), vol.Range(min=0, max=6))]),
        vol.Optional("times"): vol.All(cv.ensure_list, [h.time_of_day]),
    }
)
BACKGROUND_SCHEMA = vol.Schema(
    {
        vol.Required("preset"): cv.string,
        vol.Optional("colors"): vol.Any(cv.string, [cv.string]),
    }
)


def _board(hass: HomeAssistant) -> TaskBoard:
    if (board := hass.data.get(DOMAIN)) is None:
        raise HomeAssistantError("Glass Task Board is not set up")
    return board


def _task(board: TaskBoard, key: str) -> dict[str, Any]:
    if (task := board.find(key)) is None:
        raise HomeAssistantError(f"No task called '{key}'")
    return task


@callback
def async_register_services(hass: HomeAssistant) -> None:
    if hass.services.has_service(DOMAIN, "complete"):
        return

    async def complete(call: ServiceCall) -> None:
        board = _board(hass)
        task = _task(board, call.data["task"])
        by = call.data.get("by") or h.person_for_user(hass, call.context.user_id)
        board.complete(task["id"], by=by, by_name=h.display_name(hass, by, None) if by else None)

    async def undo(call: ServiceCall) -> None:
        board = _board(hass)
        try:
            board.undo(_task(board, call.data["task"])["id"])
        except ValueError as err:
            raise HomeAssistantError(str(err)) from err

    async def add_task(call: ServiceCall) -> ServiceResponse:
        fields = {k: v for k, v in call.data.items() if k in TASK_FIELDS}
        try:
            task = _board(hass).save_task(None, created_by=call.context.user_id, **fields)
        except ValueError as err:
            raise HomeAssistantError(str(err)) from err
        return {"id": task["id"]}

    async def delete_task(call: ServiceCall) -> None:
        board = _board(hass)
        board.delete_task(_task(board, call.data["task"])["id"])

    async def set_background(call: ServiceCall) -> None:
        try:
            choice = h.background(dict(call.data))
        except vol.Invalid as err:
            raise HomeAssistantError(str(err)) from err
        _board(hass).update_settings(background=choice)

    hass.services.async_register(DOMAIN, "complete", complete, COMPLETE_SCHEMA)
    hass.services.async_register(DOMAIN, "undo", undo, UNDO_SCHEMA)
    hass.services.async_register(DOMAIN, "add_task", add_task, ADD_SCHEMA, SupportsResponse.OPTIONAL)
    hass.services.async_register(DOMAIN, "delete_task", delete_task, DELETE_SCHEMA)
    hass.services.async_register(DOMAIN, "set_background", set_background, BACKGROUND_SCHEMA)


@callback
def async_unregister_services(hass: HomeAssistant) -> None:
    for service in SERVICES:
        hass.services.async_remove(DOMAIN, service)
