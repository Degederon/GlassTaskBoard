"""Checks for the recurring-task logic. Run with: python3 tests/test_schedule.py

schedule.py has no Home Assistant imports, so this runs without Home Assistant installed.
"""

import importlib.util
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

_path = Path(__file__).resolve().parents[1] / "custom_components" / "glass_tasks" / "schedule.py"
_spec = importlib.util.spec_from_file_location("glass_tasks_schedule", _path)
S = importlib.util.module_from_spec(_spec)
sys.modules[_spec.name] = S
_spec.loader.exec_module(S)

TZ = timezone(timedelta(hours=-5))


def at(day, hour, minute=0):
    """A time in November 2026 (the 2nd is a Monday)."""
    return datetime(2026, 11, day, hour, minute, tzinfo=TZ)


def task(**fields):
    base = {"repeat": "daily", "times": [], "days": [], "every_days": 1, "created": at(1, 0).isoformat(), "history": []}
    base.update(fields)
    return base


def done(*times):
    return [{"at": t.isoformat(), "by": "member.sam", "by_name": "Sam"} for t in times]


CASES = []


def case(name, got, want):
    CASES.append((name, got, want))


# Twice a day: 8 am and 6 pm
feed = dict(times=["08:00", "18:00"])
case("due before 8 am", S.compute(task(**feed), at(2, 7))["status"], "due")
case("overdue at 8:30 when not done", S.compute(task(**feed), at(2, 8, 30))["status"], "overdue")
late = task(**feed, history=done(at(2, 8, 30)))
case("a late morning feed counts as the morning one", S.compute(late, at(2, 9))["status"], "due")
case("...so the evening one is still due at 6 pm", S.compute(late, at(2, 9))["due_at"], at(2, 18).isoformat())
early = task(**feed, history=done(at(2, 7, 30)))
case("done at 7:30", S.compute(early, at(2, 7, 45))["status"], "done")
case("next due is 6 pm", S.compute(early, at(2, 7, 45))["next_due"], at(2, 18).isoformat())
case("evening missed is overdue", S.compute(early, at(2, 19))["status"], "overdue")
both = task(**feed, history=done(at(2, 7, 30), at(2, 17)))
case("both done", S.compute(both, at(2, 20))["status"], "done")
case("next due tomorrow 8 am", S.compute(both, at(2, 20))["next_due"], at(3, 8).isoformat())
case("resets the next morning", S.compute(both, at(3, 6))["status"], "due")

# No due time: any time today
case("untimed is due all day", S.compute(task(), at(2, 23))["status"], "due")
case("untimed done", S.compute(task(history=done(at(2, 9))), at(2, 23))["status"], "done")
case("untimed resets tomorrow", S.compute(task(history=done(at(2, 9))), at(3, 1))["status"], "due")

# Weekly: Tuesdays at 7 pm
bins = task(repeat="weekly", days=[1], times=["19:00"])
case("not due on Monday", S.compute(bins, at(2, 12))["status"], "upcoming")
case("next due Tuesday 7 pm", S.compute(bins, at(2, 12))["next_due"], at(3, 19).isoformat())
case("due Tuesday afternoon", S.compute(bins, at(3, 15))["status"], "due")
case("overdue Tuesday 8 pm", S.compute(bins, at(3, 20))["status"], "overdue")
case("back to upcoming Wednesday", S.compute(bins, at(4, 9))["status"], "upcoming")

# Every 3 days, counted from when it was last done
plants = task(repeat="every", every_days=3, history=done(at(2, 10)))
case("done yesterday", S.compute(plants, at(3, 10))["status"], "done")
case("next due in 3 days", S.compute(plants, at(3, 10))["next_due"], at(5, 0).isoformat())
case("due on day 3", S.compute(plants, at(5, 10))["status"], "due")
case("overdue the day after", S.compute(plants, at(6, 10))["status"], "overdue")
case("stays overdue until done", S.compute(plants, at(9, 10))["status"], "overdue")

# Set up partway through the day
case("created after today's only due time", S.compute(task(times=["08:00"], created=at(2, 11).isoformat()), at(2, 12))["status"], "upcoming")
case("created between two due times", S.compute(task(**feed, since=at(2, 11).isoformat()), at(2, 12))["status"], "due")
case(
    "every-N created after its due time starts tomorrow",
    S.compute(task(repeat="every", every_days=2, times=["08:00"], created=at(2, 11).isoformat()), at(2, 12))["next_due"],
    at(3, 8).isoformat(),
)

# One time, on a chosen day
call = task(repeat="once", date="2026-11-05", times=["10:00"])
case("one-time before its day is upcoming", S.compute(call, at(3, 9))["status"], "upcoming")
case("...and says when", S.compute(call, at(3, 9))["next_due"], at(5, 10).isoformat())
case("one-time on its day is due", S.compute(call, at(5, 9))["status"], "due")
case("one-time after its time is overdue", S.compute(call, at(5, 11))["status"], "overdue")
case("one-time stays overdue days later", S.compute(call, at(8, 9))["status"], "overdue")
called = task(repeat="once", date="2026-11-05", times=["10:00"], history=done(at(5, 9, 30)))
case("one-time done", S.compute(called, at(5, 12))["status"], "done")
case("one-time done never comes back", S.compute(called, at(12, 12))["status"], "done")
case("one-time done has no next time", S.compute(called, at(5, 12))["next_due"], None)
early_call = task(repeat="once", date="2026-11-05", history=done(at(3, 9)))
case("one-time done early counts", S.compute(early_call, at(5, 12))["status"], "done")
anytime = task(repeat="once", date="2026-11-05")
case("untimed one-time is due all its day", S.compute(anytime, at(5, 23))["status"], "due")
case("untimed one-time is overdue the next day", S.compute(anytime, at(6, 0, 30))["status"], "overdue")
case("untimed one-time upcoming shows its day", S.compute(anytime, at(4, 9))["next_due"], at(5, 0).isoformat())

late_setup = task(repeat="once", date="2026-11-05", times=["07:00"], created=at(5, 9, 15).isoformat())
case("one-time set up after its time is due, not overdue", S.compute(late_setup, at(5, 9, 20))["status"], "due")
case("...for the rest of that day", S.compute(late_setup, at(5, 23, 30))["status"], "due")
case("...and overdue the next day if still not done", S.compute(late_setup, at(6, 8))["status"], "overdue")
case("one-time set up before its time still goes overdue", S.compute(task(repeat="once", date="2026-11-05", times=["07:00"], created=at(5, 6).isoformat()), at(5, 7, 30))["status"], "overdue")

# Descriptions
case("describe twice a day", S.describe(task(**feed)), "2 times a day by 08:00 and 18:00")
case("describe weekly", S.describe(bins), "Every Tue by 19:00")
case("describe every 3 days", S.describe(plants), "Every 3 days")
case("describe one time", S.describe(call), "Once on Thu 5 Nov by 10:00")

failed = [c for c in CASES if c[1] != c[2]]
for name, got, want in CASES:
    print(("ok   " if got == want else "FAIL ") + name + ("" if got == want else f"  (got {got!r}, want {want!r})"))
print(f"\n{len(CASES) - len(failed)} of {len(CASES)} passed")
sys.exit(1 if failed else 0)
