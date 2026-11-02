"""Work out whether a recurring task is done, due, overdue or not due yet.

Pure functions with no Home Assistant imports, so they are easy to test.
All datetimes are timezone-aware; ``now`` should be in the household's time zone.

A day with due times 08:00 and 18:00 has two "slots": midnight to 08:00 and
08:00 to 18:00. Each time someone marks the task done, that fills the earliest
open slot that had already started, so feeding the dog late at 08:30 still
counts as the morning feed rather than the evening one.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, tzinfo
from typing import Any

DAILY = "daily"
WEEKLY = "weekly"
EVERY = "every"
ONCE = "once"

DONE = "done"
DUE = "due"
OVERDUE = "overdue"
UPCOMING = "upcoming"

# Look this far ahead for the next weekday a weekly task is on.
_SEARCH_DAYS = 8


@dataclass
class Slot:
    start: datetime
    due: datetime
    timed: bool  # False when the task has no due time (due by the end of the day)


def parse_time(value: str) -> time:
    hours, minutes = str(value).strip().split(":")[:2]
    return time(int(hours), int(minutes))


def _times(task: dict[str, Any]) -> list[time]:
    return sorted({parse_time(t) for t in task.get("times") or []})


def _midnight(day: date, tz: tzinfo) -> datetime:
    return datetime.combine(day, time(0), tz)


def _day_slots(task: dict[str, Any], day: date, tz: tzinfo) -> list[Slot]:
    start = _midnight(day, tz)
    times = _times(task)
    if not times:
        return [Slot(start, start + timedelta(days=1), False)]
    slots = []
    for t in times:
        due = datetime.combine(day, t, tz)
        slots.append(Slot(start, due, True))
        start = due
    return slots


def _completions(task: dict[str, Any], tz: tzinfo) -> list[tuple[datetime, dict[str, Any]]]:
    out = []
    for entry in task.get("history") or []:
        try:
            at = datetime.fromisoformat(entry["at"]).astimezone(tz)
        except (KeyError, TypeError, ValueError):
            continue
        out.append((at, entry))
    return sorted(out, key=lambda x: x[0])


def _since(task: dict[str, Any], tz: tzinfo) -> datetime | None:
    """When the current schedule started (due times before this don't count)."""
    for key in ("since", "created"):
        try:
            return datetime.fromisoformat(task[key]).astimezone(tz)
        except (KeyError, TypeError, ValueError):
            continue
    return None


def _active(task: dict[str, Any], day: date) -> bool:
    if task.get("repeat") == WEEKLY:
        return day.weekday() in (task.get("days") or [])
    return True


def _next_active_day(task: dict[str, Any], after: date) -> date | None:
    for i in range(1, _SEARCH_DAYS):
        day = after + timedelta(days=i)
        if _active(task, day):
            return day
    return None


def _result(status: str, slot: Slot | None, next_due: datetime | None, done: dict | None, slots_today: int = 0, done_today: int = 0) -> dict[str, Any]:
    return {
        "status": status,
        "period_start": slot.start.isoformat() if slot else None,
        "due_at": slot.due.isoformat() if slot and slot.timed else None,
        "due_date": slot.start.date().isoformat() if slot else None,
        "next_due": next_due.isoformat() if next_due else None,
        "done_at": done.get("at") if done else None,
        "done_by": done.get("by") if done else None,
        "done_by_name": done.get("by_name") if done else None,
        "slots_today": slots_today,
        "done_today": done_today,
    }


def _first_due(task: dict[str, Any], day: date, tz: tzinfo) -> datetime:
    slot = _day_slots(task, day, tz)[0]
    return slot.due if slot.timed else slot.start


def compute(task: dict[str, Any], now: datetime) -> dict[str, Any]:
    """Return the task's current status and the times that go with it."""
    tz = now.tzinfo
    if task.get("repeat") == EVERY:
        return _compute_every(task, now)
    if task.get("repeat") == ONCE:
        return _compute_once(task, now)

    today = now.date()
    completions = _completions(task, tz)
    if not _active(task, today):
        nxt = _next_active_day(task, today)
        last = completions[-1][1] if completions else None
        return _result(UPCOMING, None, _first_due(task, nxt, tz) if nxt else None, last)

    slots = _day_slots(task, today, tz)
    day_start = slots[0].start
    since = _since(task, tz)
    if since is not None and since > day_start:
        # Set up partway through today: skip due times that had already passed.
        slots = [s for s in slots if not s.timed or s.due > since]
        if not slots:
            nxt = _next_active_day(task, today)
            return _result(UPCOMING, None, _first_due(task, nxt, tz) if nxt else None, None)
    todays = [(at, e) for at, e in completions if day_start <= at < day_start + timedelta(days=1)]

    # Give each completion to the earliest open slot that had already started.
    filled: list[dict[str, Any] | None] = [None] * len(slots)
    for at, entry in todays:
        for i, slot in enumerate(slots):
            if filled[i] is None and slot.start <= at:
                filled[i] = entry
                break

    done_count = sum(1 for f in filled if f is not None)
    nxt_day = _next_active_day(task, today)

    # A slot whose due time has passed without being done is overdue.
    for i, slot in enumerate(slots):
        if filled[i] is None and slot.timed and slot.due <= now:
            return _result(OVERDUE, slot, None, None, len(slots), done_count)

    # Otherwise we are in the first slot that has not ended yet.
    for i, slot in enumerate(slots):
        if slot.due > now or not slot.timed:
            if filled[i] is None:
                return _result(DUE, slot, None, None, len(slots), done_count)
            # Done; is there another slot later today?
            later = next((s for j, s in enumerate(slots) if j > i and filled[j] is None), None)
            next_due = later.due if later else (_first_due(task, nxt_day, tz) if nxt_day else None)
            return _result(DONE, slot, next_due, filled[i], len(slots), done_count)

    # Every slot today is done and past.
    last_slot = slots[-1]
    next_due = _first_due(task, nxt_day, tz) if nxt_day else None
    return _result(DONE, last_slot, next_due, filled[-1], len(slots), done_count)


def _compute_every(task: dict[str, Any], now: datetime) -> dict[str, Any]:
    """Every N days, counted from the last time it was done."""
    tz = now.tzinfo
    every = max(1, int(task.get("every_days") or 1))
    completions = _completions(task, tz)
    last = completions[-1] if completions else None
    if last is None:
        since = _since(task, tz) or now
        due_day = since.date()
        first = _day_slots(task, due_day, tz)[0]
        if first.timed and first.due <= since:
            due_day += timedelta(days=1)
    else:
        due_day = last[0].date() + timedelta(days=every)

    slot = _day_slots(task, due_day, tz)[0]
    if now < slot.start:
        # Done recently; the next one isn't due yet.
        return _result(UPCOMING if last is None else DONE, None, slot.due if slot.timed else slot.start, last[1] if last else None)
    if slot.timed and slot.due <= now:
        return _result(OVERDUE, slot, None, None)
    if not slot.timed and now >= slot.due:
        # Untimed and the due day has passed: it's late.
        return _result(OVERDUE, slot, None, None)
    return _result(DUE, slot, None, None)


def once_date(task: dict[str, Any], tz: tzinfo) -> date:
    """The day a one-time task is for (the day it was set up, if no date was given)."""
    try:
        return date.fromisoformat(str(task.get("date")))
    except (TypeError, ValueError):
        since = _since(task, tz)
        return since.date() if since else datetime.now(tz).date()


def _compute_once(task: dict[str, Any], now: datetime) -> dict[str, Any]:
    """One time, on a chosen day. Done once means done for good."""
    tz = now.tzinfo
    day = once_date(task, tz)
    completions = _completions(task, tz)
    # Only the first due time counts: a one-time task is done in one go.
    slot = _day_slots(task, day, tz)[0]
    if completions:
        return _result(DONE, slot, None, completions[-1][1], 1, 1)
    if now < slot.start:
        return _result(UPCOMING, None, slot.due if slot.timed else slot.start, None)
    if now >= slot.due:
        # Its time (or its whole day) has passed: overdue until someone does it.
        return _result(OVERDUE, slot, None, None, 1, 0)
    return _result(DUE, slot, None, None, 1, 0)


def describe(task: dict[str, Any]) -> str:
    """Short plain-English summary, e.g. 'Every day at 8:00 and 18:00'."""
    times = [t.strftime("%H:%M") for t in _times(task)]
    at = f" by {' and '.join(times)}" if times else ""
    repeat = task.get("repeat")
    if repeat == ONCE:
        try:
            day = date.fromisoformat(str(task.get("date")))
            return f"Once on {day.strftime('%a')} {day.day} {day.strftime('%b')}{at}"
        except (TypeError, ValueError):
            return f"Once{at}"
    if repeat == WEEKLY:
        names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        days = ", ".join(names[d] for d in sorted(task.get("days") or []))
        return f"Every {days}{at}"
    if repeat == EVERY:
        n = int(task.get("every_days") or 1)
        return f"Every {n} days{at}" if n > 1 else f"Every day{at}"
    if len(times) > 1:
        return f"{len(times)} times a day{at}"
    return f"Every day{at}"
