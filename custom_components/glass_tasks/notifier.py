"""Send a phone reminder when a task becomes overdue."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from .const import CONF_NOTIFY_EVERYONE, CONF_NOTIFY_URL, DOMAIN, EVERYONE, MEMBER_PREFIX

_LOGGER = logging.getLogger(__name__)

# The reminder's own words, in Home Assistant's language (English otherwise).
_DUE_AT = {
    "en": "It was due at {time}.",
    "de": "Sie war um {time} fällig.",
    "es": "Tocaba a las {time}.",
    "fr": "Elle était prévue à {time}.",
}
_NOT_DONE = {
    "en": "It hasn't been done yet.",
    "de": "Sie ist noch nicht erledigt.",
    "es": "Todavía no se ha hecho.",
    "fr": "Elle n'a pas encore été faite.",
}


def _language(hass: HomeAssistant) -> str:
    lang = str(getattr(hass.config, "language", None) or "en").split("-")[0].lower()
    return lang if lang in _DUE_AT else "en"


def _as_list(value: Any) -> list[str]:
    if not value:
        return []
    if isinstance(value, str):
        return [value]
    return [str(v) for v in value]


def _targets(hass: HomeAssistant, entry: ConfigEntry, assignee: str) -> set[str]:
    """Notify services for whoever's job the task is (everyone, a person, or a board member)."""
    options = entry.options
    board = hass.data.get(DOMAIN)
    members = board.members if board is not None else []
    targets: set[str] = set()
    if assignee == EVERYONE:
        for key, value in options.items():
            if key.startswith("person."):
                targets.update(_as_list(value))
        for member in members:
            targets.update(_as_list(member.get("notify")))
        targets.update(_as_list(options.get(CONF_NOTIFY_EVERYONE)))
    elif assignee.startswith(MEMBER_PREFIX):
        member = next((m for m in members if m["id"] == assignee), None)
        targets.update(_as_list(member.get("notify") if member else None))
    else:
        targets.update(_as_list(options.get(assignee)))
    return targets


def _clock(iso: str | None, lang: str = "en") -> str:
    if not iso:
        return ""
    when = dt_util.as_local(datetime.fromisoformat(iso))
    if lang != "en":
        return f"{when.hour}:{when.minute:02d}"
    return when.strftime("%-I:%M %p").lower() if when.minute else when.strftime("%-I %p").lower()


async def async_send_overdue(hass: HomeAssistant, entry: ConfigEntry, task: dict[str, Any]) -> None:
    """Remind the people whose job an overdue task is."""
    if not task.get("notify", True):
        return
    targets = _targets(hass, entry, task.get("assignee") or EVERYONE)
    if not targets:
        return
    lang = _language(hass)
    due = _clock(task.get("due_at"), lang)
    body = _DUE_AT[lang].format(time=due) if due else _NOT_DONE[lang]
    data: dict[str, Any] = {"tag": f"glass-tasks-{task['id']}", "group": DOMAIN}
    if url := entry.options.get(CONF_NOTIFY_URL):
        data["url"] = url
        data["clickAction"] = url

    for target in sorted(targets):
        domain, _, service = target.partition(".")
        if domain != "notify" or not service:
            continue
        try:
            await hass.services.async_call(
                "notify",
                service,
                {"title": f"{task.get('icon') or '⏰'} {task['title']}", "message": body, "data": data},
                blocking=False,
            )
        except Exception:  # noqa: BLE001 - a broken notifier must not break the board
            _LOGGER.warning("Could not send task reminder via %s", target, exc_info=True)
