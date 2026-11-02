"""Small helpers shared across the integration."""

from __future__ import annotations

import re
from typing import Any

import voluptuous as vol

from homeassistant.core import HomeAssistant, callback

from .const import (
    BACKGROUND_CUSTOM,
    BACKGROUND_PRESETS,
    DOMAIN,
    EVERYONE,
    MEMBER_PREFIX,
)

_TIME_RE = re.compile(r"^(\d{1,2}):(\d{2})(?::\d{2})?$")
_HEX6_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


def background(value: Any) -> dict[str, Any]:
    """Validate a background choice: a preset name, or 'custom' with three #rrggbb colours."""
    if isinstance(value, str):
        value = {"preset": value}
    if not isinstance(value, dict):
        raise vol.Invalid("background must be a preset name or an object")
    preset = str(value.get("preset", "")).strip().lower()
    if preset not in (*BACKGROUND_PRESETS, BACKGROUND_CUSTOM):
        raise vol.Invalid(
            f"unknown background '{preset}'; use one of {', '.join(BACKGROUND_PRESETS)} or custom"
        )
    colors = value.get("colors") or []
    if isinstance(colors, str):
        colors = [c.strip() for c in colors.split(",") if c.strip()]
    if preset == BACKGROUND_CUSTOM:
        if len(colors) != 3 or not all(isinstance(c, str) and _HEX6_RE.match(c) for c in colors):
            raise vol.Invalid("a custom background needs three colours like #3366ff")
        return {"preset": preset, "colors": [c.lower() for c in colors]}
    return {"preset": preset, "colors": []}


@callback
def person_for_user(hass: HomeAssistant, user_id: str | None) -> str | None:
    """Return the person entity linked to a Home Assistant user, if any."""
    if not user_id:
        return None
    for state in hass.states.async_all("person"):
        if state.attributes.get("user_id") == user_id:
            return state.entity_id
    return None


@callback
def display_name(hass: HomeAssistant, entity_id: str | None, fallback: str | None = None) -> str:
    """Friendly name for a person entity or board member, falling back gracefully."""
    if entity_id and entity_id.startswith(MEMBER_PREFIX):
        board = hass.data.get(DOMAIN)
        if board is not None and (member := board.get_member(entity_id)):
            return member["name"]
    elif entity_id and (state := hass.states.get(entity_id)):
        return state.name
    return fallback or "Home"


@callback
def users_for_person(hass: HomeAssistant, entity_id: str | None) -> str | None:
    """Return the user id linked to a person entity."""
    if entity_id and (state := hass.states.get(entity_id)):
        return state.attributes.get("user_id")
    return None


def _is_participant(value: str) -> bool:
    for prefix in ("person.", MEMBER_PREFIX):
        if value.startswith(prefix) and len(value) > len(prefix):
            return True
    return False


def recipient(value: Any) -> str:
    """Validate 'everyone', a person entity or a board member."""
    value = str(value or EVERYONE).strip().lower()
    if value == EVERYONE or _is_participant(value):
        return value
    raise vol.Invalid("must be 'everyone', a person entity or a board member")


def person_entity(value: Any) -> str:
    """Validate a sender: a person entity or a board member."""
    value = str(value).strip().lower()
    if _is_participant(value):
        return value
    raise vol.Invalid("must be a person entity or a board member")


def time_of_day(value: Any) -> str:
    """Validate a due time like '8:00' or '18:30' and normalise it to 'HH:MM'."""
    match = _TIME_RE.match(str(value or "").strip())
    if not match:
        raise vol.Invalid("time must look like 08:00 or 18:30")
    hours, minutes = int(match[1]), int(match[2])
    if hours > 23 or minutes > 59:
        raise vol.Invalid("time must be between 00:00 and 23:59")
    return f"{hours:02d}:{minutes:02d}"


def iso_date(value: Any) -> str:
    """Validate a day like '2026-11-05' for a one-time task."""
    from datetime import date

    try:
        return date.fromisoformat(str(value).strip()[:10]).isoformat()
    except ValueError as err:
        raise vol.Invalid("date must look like 2026-11-05") from err


def assignee(value: Any) -> str:
    """Whose job a task is: 'everyone', a person entity or a board member."""
    return recipient(value)


def task_fields() -> dict[Any, Any]:
    """Voluptuous fields for creating or editing a task (all optional)."""
    from .const import MAX_EVERY_DAYS, MAX_TIMES, MAX_TITLE, REPEATS, TINTS

    return {
        vol.Optional("title"): vol.All(str, vol.Strip, vol.Length(min=1, max=MAX_TITLE)),
        vol.Optional("icon"): vol.All(str, vol.Length(min=1, max=16)),
        vol.Optional("tint"): vol.In(TINTS),
        vol.Optional("assignee"): assignee,
        vol.Optional("repeat"): vol.In(REPEATS),
        vol.Optional("days"): vol.All([vol.All(vol.Coerce(int), vol.Range(min=0, max=6))], vol.Length(max=7)),
        vol.Optional("every_days"): vol.All(vol.Coerce(int), vol.Range(min=1, max=MAX_EVERY_DAYS)),
        vol.Optional("times"): vol.All([time_of_day], vol.Length(max=MAX_TIMES)),
        vol.Optional("date"): iso_date,
        vol.Optional("notify"): bool,
    }
