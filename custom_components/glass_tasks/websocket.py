"""Websocket API used by the glass card."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from . import helpers as h
from .board import TaskBoard
from .const import DATA_WS, DOMAIN, SIGNAL_UPDATED

TASK_FIELDS = ("title", "icon", "tint", "assignee", "repeat", "days", "every_days", "times", "date", "notify")


@callback
def async_register_websocket(hass: HomeAssistant) -> None:
    if hass.data.get(DATA_WS):
        return
    for handler in (
        ws_subscribe,
        ws_task_save,
        ws_task_delete,
        ws_task_complete,
        ws_task_undo,
        ws_member_save,
        ws_member_remove,
        ws_settings,
    ):
        websocket_api.async_register_command(hass, handler)
    hass.data[DATA_WS] = True


def _board(hass: HomeAssistant, connection, msg) -> TaskBoard | None:
    board = hass.data.get(DOMAIN)
    if board is None:
        connection.send_error(msg["id"], "not_loaded", "Glass Task Board is not set up")
    return board


@websocket_api.websocket_command({vol.Required("type"): "glass_tasks/subscribe"})
@callback
def ws_subscribe(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg) -> None:
    if (board := _board(hass, connection, msg)) is None:
        return

    @callback
    def forward(action: str, item: dict[str, Any]) -> None:
        connection.send_message(websocket_api.event_message(msg["id"], {"action": action, "task": item}))

    connection.subscriptions[msg["id"]] = async_dispatcher_connect(hass, SIGNAL_UPDATED, forward)
    connection.send_result(msg["id"])
    connection.send_message(
        websocket_api.event_message(
            msg["id"],
            {"action": "snapshot", "tasks": board.tasks, "members": board.members, "settings": board.settings},
        )
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "glass_tasks/task/save",
        vol.Optional("task_id"): vol.Any(None, str),
        **h.task_fields(),
    }
)
@callback
def ws_task_save(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg) -> None:
    if (board := _board(hass, connection, msg)) is None:
        return
    fields = {k: v for k, v in msg.items() if k in TASK_FIELDS}
    try:
        task = board.save_task(msg.get("task_id"), created_by=connection.user.id, **fields)
    except KeyError:
        connection.send_error(msg["id"], "not_found", "That task is no longer on the board")
        return
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_format", str(err))
        return
    connection.send_result(msg["id"], {"id": task["id"]})


@websocket_api.websocket_command({vol.Required("type"): "glass_tasks/task/delete", vol.Required("task_id"): str})
@callback
def ws_task_delete(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg) -> None:
    if (board := _board(hass, connection, msg)) is None:
        return
    if not board.delete_task(msg["task_id"]):
        connection.send_error(msg["id"], "not_found", "That task is no longer on the board")
        return
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "glass_tasks/task/complete",
        vol.Required("task_id"): str,
        vol.Optional("by"): vol.Any(None, h.person_entity),
    }
)
@callback
def ws_task_complete(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg) -> None:
    if (board := _board(hass, connection, msg)) is None:
        return
    by = msg.get("by")
    name = h.display_name(hass, by, None) if by else None
    try:
        board.complete(msg["task_id"], by=by, by_name=name)
    except KeyError:
        connection.send_error(msg["id"], "not_found", "That task is no longer on the board")
        return
    connection.send_result(msg["id"])


@websocket_api.websocket_command({vol.Required("type"): "glass_tasks/task/undo", vol.Required("task_id"): str})
@callback
def ws_task_undo(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg) -> None:
    if (board := _board(hass, connection, msg)) is None:
        return
    try:
        board.undo(msg["task_id"])
    except KeyError:
        connection.send_error(msg["id"], "not_found", "That task is no longer on the board")
        return
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_format", str(err))
        return
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "glass_tasks/member/save",
        vol.Optional("member_id"): vol.Any(None, vol.All(str, vol.Match(r"^member\.[0-9a-f]{4,32}$"))),
        vol.Required("name"): vol.All(str, vol.Strip, vol.Length(min=1, max=40)),
        vol.Optional("emoji", default="🙂"): vol.All(str, vol.Length(min=1, max=16)),
        vol.Optional("hue", default=210): vol.All(vol.Coerce(int), vol.Range(min=0, max=359)),
        vol.Optional("notify", default=[]): [vol.All(str, vol.Match(r"^notify\.[a-z0-9_]+$"))],
    }
)
@callback
def ws_member_save(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg) -> None:
    if (board := _board(hass, connection, msg)) is None:
        return
    try:
        member = board.save_member(
            member_id=msg.get("member_id"), name=msg["name"], emoji=msg["emoji"], hue=msg["hue"], notify=msg["notify"]
        )
    except KeyError:
        connection.send_error(msg["id"], "not_found", "That person is no longer on the board")
        return
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_format", str(err))
        return
    connection.send_result(msg["id"], member)


@websocket_api.websocket_command({vol.Required("type"): "glass_tasks/member/remove", vol.Required("member_id"): str})
@callback
def ws_member_remove(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg) -> None:
    if (board := _board(hass, connection, msg)) is None:
        return
    if not board.remove_member(msg["member_id"]):
        connection.send_error(msg["id"], "not_found", "That person is no longer on the board")
        return
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "glass_tasks/settings",
        vol.Optional("include_ha_people"): bool,
        vol.Optional("background"): h.background,
    }
)
@callback
def ws_settings(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg) -> None:
    if (board := _board(hass, connection, msg)) is None:
        return
    changes = {k: v for k, v in msg.items() if k in ("include_ha_people", "background")}
    connection.send_result(msg["id"], board.update_settings(**changes))
