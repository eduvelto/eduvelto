// Eduvelto — Life Planner unit tests (§3C).
//
// Pure helpers only: "today" is passed in as a fixed YYYY-MM-DD string,
// so no test depends on the machine's clock or timezone.

import { describe, expect, it } from 'vitest';
import {
  buildTask,
  filterTasks,
  isValidDateKey,
  isValidTime,
  parseStoredTasks,
  sortTasks,
  summarizeTasks,
  tasksDone,
  tasksDueToday,
  tasksOverdue,
  tasksUpcoming,
  toDateKey,
  type PlannerTask,
} from '../lifePlanner';

const TODAY = '2026-11-23';

function task(overrides: Partial<PlannerTask> = {}): PlannerTask {
  return {
    id: 't1',
    title: 'পড়া',
    date: TODAY,
    time: '',
    category: 'study',
    done: false,
    createdAt: 1000,
    ...overrides,
  };
}

describe('toDateKey', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 10, 23, 15, 30))).toBe('2026-11-23');
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('isValidDateKey / isValidTime', () => {
  it('accepts real calendar dates only', () => {
    expect(isValidDateKey('2026-11-23')).toBe(true);
    expect(isValidDateKey('2026-02-29')).toBe(false); // 2026 is not a leap year
    expect(isValidDateKey('2024-02-29')).toBe(true);
    expect(isValidDateKey('23-11-2026')).toBe(false);
    expect(isValidDateKey('2026-13-01')).toBe(false);
  });

  it('accepts HH:MM or empty only', () => {
    expect(isValidTime('')).toBe(true);
    expect(isValidTime('09:30')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('9:30')).toBe(false);
  });
});

describe('buildTask', () => {
  it('builds a valid task and trims the title', () => {
    const built = buildTask({
      title: '  অঙ্ক প্র্যাকটিস  ',
      date: TODAY,
      time: '18:00',
      category: 'study',
      nowMs: 5000,
      id: 'abc',
    });
    expect(built).toEqual({
      id: 'abc',
      title: 'অঙ্ক প্র্যাকটিস',
      date: TODAY,
      time: '18:00',
      category: 'study',
      done: false,
      createdAt: 5000,
    });
  });

  it('rejects an empty title, a bad date, a bad time, or a bad category', () => {
    const base = { title: 'x', date: TODAY, time: '', category: 'work', nowMs: 1, id: 'a' };
    expect(buildTask({ ...base, title: '   ' })).toBeNull();
    expect(buildTask({ ...base, date: '2026-02-30' })).toBeNull();
    expect(buildTask({ ...base, time: '25:00' })).toBeNull();
    expect(buildTask({ ...base, category: 'other' })).toBeNull();
  });
});

describe('sortTasks', () => {
  it('orders by date, then time (no-time last), then creation order', () => {
    const tasks = [
      task({ id: 'c', date: '2026-11-24', time: '08:00', createdAt: 3 }),
      task({ id: 'a', date: TODAY, time: '', createdAt: 1 }),
      task({ id: 'b', date: TODAY, time: '09:00', createdAt: 2 }),
      task({ id: 'd', date: TODAY, time: '09:00', createdAt: 4 }),
    ];
    expect(sortTasks(tasks).map((t) => t.id)).toEqual(['b', 'd', 'a', 'c']);
  });
});

describe('today / upcoming / overdue / done splits', () => {
  const tasks = [
    task({ id: 'today-open', date: TODAY }),
    task({ id: 'today-done', date: TODAY, done: true }),
    task({ id: 'future', date: '2026-11-25' }),
    task({ id: 'past-open', date: '2026-11-20' }),
    task({ id: 'past-done', date: '2026-11-20', done: true }),
  ];

  it('today lists only open tasks dated today', () => {
    expect(tasksDueToday(tasks, TODAY).map((t) => t.id)).toEqual(['today-open']);
  });

  it('upcoming lists only open future tasks', () => {
    expect(tasksUpcoming(tasks, TODAY).map((t) => t.id)).toEqual(['future']);
  });

  it('overdue lists open tasks dated before today', () => {
    expect(tasksOverdue(tasks, TODAY).map((t) => t.id)).toEqual(['past-open']);
  });

  it('done lists every completed task', () => {
    expect(tasksDone(tasks).map((t) => t.id)).toEqual(['past-done', 'today-done']);
  });

  it('the upcoming filter shows overdue first so nothing is lost', () => {
    expect(filterTasks(tasks, 'upcoming', TODAY).map((t) => t.id)).toEqual(['past-open', 'future']);
    expect(filterTasks(tasks, 'today', TODAY).map((t) => t.id)).toEqual(['today-open']);
    expect(filterTasks(tasks, 'done', TODAY).map((t) => t.id)).toEqual(['past-done', 'today-done']);
  });
});

describe('summarizeTasks', () => {
  it('counts total, done, today and upcoming', () => {
    const tasks = [
      task({ id: 'a', date: TODAY }),
      task({ id: 'b', date: TODAY, done: true }),
      task({ id: 'c', date: '2026-11-25' }),
      task({ id: 'd', date: '2026-11-20', done: true }),
    ];
    expect(summarizeTasks(tasks, TODAY)).toEqual({
      total: 4,
      done: 2,
      todayTotal: 2,
      todayDone: 1,
      upcomingTotal: 1,
    });
  });

  it('returns zeros for an empty list', () => {
    expect(summarizeTasks([], TODAY)).toEqual({
      total: 0,
      done: 0,
      todayTotal: 0,
      todayDone: 0,
      upcomingTotal: 0,
    });
  });
});

describe('parseStoredTasks', () => {
  it('returns [] for null, malformed JSON, or non-arrays', () => {
    expect(parseStoredTasks(null)).toEqual([]);
    expect(parseStoredTasks('not json')).toEqual([]);
    expect(parseStoredTasks('{"a":1}')).toEqual([]);
  });

  it('keeps valid tasks and drops malformed entries', () => {
    const good = task({ id: 'ok' });
    const raw = JSON.stringify([good, { id: 'bad', title: 42 }, 'junk', { ...good, id: 'bad-date', date: '2026-02-30' }]);
    expect(parseStoredTasks(raw)).toEqual([good]);
  });
});
