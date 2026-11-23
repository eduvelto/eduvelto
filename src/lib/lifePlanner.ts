// Eduvelto — Life Planner pure helpers (§3C).
//
// Daily planner + study/work planner. All data lives in localStorage
// (key below) on the user's own device — never sent anywhere, no login.
// These functions are pure: they take tasks + a "today" date string and
// return filtered/sorted views and counts. No I/O, no Date.now() here,
// so the tests can pin "today" exactly.

export const LIFE_PLANNER_STORAGE_KEY = 'eduvelto.life.planner.v1';

export type PlannerCategory = 'study' | 'work' | 'personal';

export const PLANNER_CATEGORIES: PlannerCategory[] = ['study', 'work', 'personal'];

export interface PlannerTask {
  id: string;
  title: string;
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  /** Optional start time, HH:MM (24h). Empty string = no time set. */
  time: string;
  category: PlannerCategory;
  done: boolean;
  /** ms since epoch, for stable ordering of same-day, same-time tasks. */
  createdAt: number;
}

export type PlannerFilter = 'today' | 'upcoming' | 'done';

export interface PlannerSummary {
  total: number;
  done: number;
  todayTotal: number;
  todayDone: number;
  upcomingTotal: number;
}

/** Local YYYY-MM-DD for a Date (device timezone, not UTC). */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const parsed = new Date(y, m - 1, d);
  return parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d;
}

export function isValidTime(value: string): boolean {
  if (value === '') return true;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  return match !== null;
}

export function isPlannerCategory(value: string): value is PlannerCategory {
  return value === 'study' || value === 'work' || value === 'personal';
}

/**
 * Build a task from form input. Returns null when the title is empty or
 * the date/time/category is invalid — the page shows a message instead
 * of storing a broken task.
 */
export function buildTask(input: {
  title: string;
  date: string;
  time: string;
  category: string;
  nowMs: number;
  id: string;
}): PlannerTask | null {
  const title = input.title.trim();
  if (!title) return null;
  if (!isValidDateKey(input.date)) return null;
  if (!isValidTime(input.time)) return null;
  if (!isPlannerCategory(input.category)) return null;
  return {
    id: input.id,
    title,
    date: input.date,
    time: input.time,
    category: input.category,
    done: false,
    createdAt: input.nowMs,
  };
}

/** Date, then time (no-time tasks last), then creation order. */
export function sortTasks(tasks: PlannerTask[]): PlannerTask[] {
  return [...tasks].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (a.time !== b.time) {
      if (a.time === '') return 1;
      if (b.time === '') return -1;
      return a.time < b.time ? -1 : 1;
    }
    return a.createdAt - b.createdAt;
  });
}

export function tasksDueToday(tasks: PlannerTask[], today: string): PlannerTask[] {
  return sortTasks(tasks.filter((task) => task.date === today && !task.done));
}

/** Open tasks dated after today. */
export function tasksUpcoming(tasks: PlannerTask[], today: string): PlannerTask[] {
  return sortTasks(tasks.filter((task) => !task.done && task.date > today));
}

/** Overdue open tasks (dated before today, not done) — shown with the upcoming list so they are never silently hidden. */
export function tasksOverdue(tasks: PlannerTask[], today: string): PlannerTask[] {
  return sortTasks(tasks.filter((task) => !task.done && task.date < today));
}

export function tasksDone(tasks: PlannerTask[]): PlannerTask[] {
  return sortTasks(tasks.filter((task) => task.done));
}

export function filterTasks(tasks: PlannerTask[], filter: PlannerFilter, today: string): PlannerTask[] {
  if (filter === 'today') return tasksDueToday(tasks, today);
  if (filter === 'upcoming') return [...tasksOverdue(tasks, today), ...tasksUpcoming(tasks, today)];
  return tasksDone(tasks);
}

/** "Today's focus" — counts only, no task content. */
export function summarizeTasks(tasks: PlannerTask[], today: string): PlannerSummary {
  const todayTasks = tasks.filter((task) => task.date === today);
  return {
    total: tasks.length,
    done: tasks.filter((task) => task.done).length,
    todayTotal: todayTasks.length,
    todayDone: todayTasks.filter((task) => task.done).length,
    upcomingTotal: tasks.filter((task) => !task.done && task.date > today).length,
  };
}

/** Parse stored JSON defensively: anything malformed becomes an empty list. */
export function parseStoredTasks(raw: string | null): PlannerTask[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const tasks: PlannerTask[] = [];
    for (const item of parsed) {
      if (typeof item !== 'object' || item === null) continue;
      const candidate = item as Partial<PlannerTask>;
      if (
        typeof candidate.id === 'string' &&
        typeof candidate.title === 'string' &&
        typeof candidate.date === 'string' &&
        isValidDateKey(candidate.date) &&
        typeof candidate.time === 'string' &&
        isValidTime(candidate.time) &&
        typeof candidate.category === 'string' &&
        isPlannerCategory(candidate.category) &&
        typeof candidate.done === 'boolean' &&
        typeof candidate.createdAt === 'number'
      ) {
        tasks.push({
          id: candidate.id,
          title: candidate.title,
          date: candidate.date,
          time: candidate.time,
          category: candidate.category,
          done: candidate.done,
          createdAt: candidate.createdAt,
        });
      }
    }
    return tasks;
  } catch {
    return [];
  }
}
