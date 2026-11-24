import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { PageShell } from '../components/PageShell';
import { Breadcrumb } from '../components/Breadcrumb';
import {
  LIFE_PLANNER_STORAGE_KEY,
  buildTask,
  filterTasks,
  parseStoredTasks,
  summarizeTasks,
  toDateKey,
  type PlannerCategory,
  type PlannerFilter,
  type PlannerTask,
} from '../lib/lifePlanner';

// Eduvelto Life Planner (§3C) — daily planner + study/work planner in one
// page. No login, no server: every task lives in localStorage on the
// user's own device under eduvelto.life.planner.v1 and is never sent
// anywhere. "Today's focus" shows counts only.

const CATEGORY_LABELS: Record<PlannerCategory, { bn: string; en: string }> = {
  study: { bn: 'পড়াশোনা', en: 'Study' },
  work: { bn: 'কাজ', en: 'Work' },
  personal: { bn: 'ব্যক্তিগত', en: 'Personal' },
};

const FILTER_LABELS: Record<PlannerFilter, { bn: string; en: string }> = {
  today: { bn: 'আজ', en: 'Today' },
  upcoming: { bn: 'আসছে', en: 'Upcoming' },
  done: { bn: 'সম্পন্ন', en: 'Done' },
};

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `task-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

function loadTasks(): PlannerTask[] {
  try {
    return parseStoredTasks(window.localStorage.getItem(LIFE_PLANNER_STORAGE_KEY));
  } catch {
    return [];
  }
}

export default function LifePlannerPage() {
  const { t, lang } = useLanguage();
  const today = useMemo(() => toDateKey(new Date()), []);
  const [tasks, setTasks] = useState<PlannerTask[]>(loadTasks);
  const [filter, setFilter] = useState<PlannerFilter>('today');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<PlannerCategory>('study');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      window.localStorage.setItem(LIFE_PLANNER_STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // Storage full/blocked (e.g. private mode): the in-memory list still
      // works for this visit; the note below says data stays on-device.
    }
  }, [tasks]);

  const summary = useMemo(() => summarizeTasks(tasks, today), [tasks, today]);
  const visible = useMemo(() => filterTasks(tasks, filter, today), [tasks, filter, today]);
  const counts: Record<PlannerFilter, number> = {
    today: summary.todayTotal - summary.todayDone,
    upcoming: summary.upcomingTotal,
    done: summary.done,
  };

  function addTask() {
    const built = buildTask({ title, date, time, category, nowMs: Date.now(), id: newId() });
    if (!built) {
      setError(t({ bn: 'কাজের নাম লিখুন এবং সঠিক তারিখ ও সময় দিন।', en: 'Enter a task name and a valid date and time.' }));
      return;
    }
    setTasks((prev) => [...prev, built]);
    setTitle('');
    setTime('');
    setDate(today);
    setError('');
  }

  function toggleDone(id: string) {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }

  return (
    <PageShell titleBn="দৈনিক পরিকল্পনা" titleEn="Daily Planner" wide>
      {/* Visible breadcrumb (24 Nov 2026 SEO pass) — labels match the BreadcrumbList JSON-LD in lib/seo.ts. */}
      <Breadcrumb items={[{ label: lang === 'bn' ? 'জীবন সেবা' : 'Life Services', to: '/life' }, { label: lang === 'bn' ? 'দৈনিক প্ল্যানার' : 'Daily Planner' }]} />
      <p style={{ color: 'var(--muted)' }}>
        {t({
          bn: 'আপনার দিনের কাজগুলো সাজান — পড়াশোনা, কাজ বা ব্যক্তিগত। কোনো লগইন লাগে না; সব তথ্য শুধু আপনার ডিভাইসেই থাকে, কোথাও পাঠানো হয় না।',
          en: 'Plan your day — study, work or personal. No login needed; everything stays only on your device and is never sent anywhere.',
        })}
      </p>

      {/* Today's focus — counts only. */}
      <div
        className="ev-card"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}
        aria-label={t({ bn: 'আজকের সারসংক্ষেপ', en: "Today's summary" })}
      >
        <span className="ev-chip" style={{ fontSize: 15, padding: '8px 14px' }}>
          {t({ bn: `আজ মোট: ${summary.todayTotal}`, en: `Today total: ${summary.todayTotal}` })}
        </span>
        <span className="ev-chip" style={{ fontSize: 15, padding: '8px 14px' }}>
          {t({ bn: `আজ সম্পন্ন: ${summary.todayDone}`, en: `Done today: ${summary.todayDone}` })}
        </span>
        <span className="ev-chip" style={{ fontSize: 15, padding: '8px 14px' }}>
          {t({ bn: `আসছে: ${summary.upcomingTotal}`, en: `Upcoming: ${summary.upcomingTotal}` })}
        </span>
        <span className="ev-chip" style={{ fontSize: 15, padding: '8px 14px' }}>
          {t({ bn: `সব মিলিয়ে: ${summary.total}`, en: `All tasks: ${summary.total}` })}
        </span>
      </div>

      {/* Add a task. */}
      <form
        className="ev-card"
        style={{ marginTop: 16, display: 'grid', gap: 12 }}
        onSubmit={(e) => {
          e.preventDefault();
          addTask();
        }}
      >
        <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
          {t({ bn: 'কাজের নাম', en: 'Task name' })}
          <input
            className="ev-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t({ bn: 'যেমন: ইংরেজি ২য় পত্র পড়া', en: 'e.g. Study English 2nd paper' })}
            maxLength={200}
          />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
            {t({ bn: 'তারিখ', en: 'Date' })}
            <input className="ev-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
            {t({ bn: 'সময় (ঐচ্ছিক)', en: 'Time (optional)' })}
            <input className="ev-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
            {t({ bn: 'ধরন', en: 'Category' })}
            <select
              className="ev-input"
              value={category}
              onChange={(e) => setCategory(e.target.value as PlannerCategory)}
            >
              {(Object.keys(CATEGORY_LABELS) as PlannerCategory[]).map((key) => (
                <option key={key} value={key}>
                  {t(CATEGORY_LABELS[key])}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error ? (
          <p role="alert" style={{ color: '#b3261e', margin: 0 }}>
            {error}
          </p>
        ) : null}
        <div>
          <button className="ev-btn ev-btn-primary" type="submit" style={{ minHeight: 44 }}>
            {t({ bn: 'কাজ যোগ করুন', en: 'Add task' })}
          </button>
        </div>
      </form>

      {/* Filter tabs. */}
      <div role="tablist" style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
        {(Object.keys(FILTER_LABELS) as PlannerFilter[]).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={filter === key}
            className={`ev-btn ${filter === key ? 'ev-btn-primary' : 'ev-btn-outline'}`}
            type="button"
            style={{ minHeight: 44 }}
            onClick={() => setFilter(key)}
          >
            {t(FILTER_LABELS[key])} ({counts[key]})
          </button>
        ))}
      </div>

      {/* Task list. */}
      {visible.length === 0 ? (
        <p className="ev-card" style={{ marginTop: 16, color: 'var(--muted)' }}>
          {filter === 'today'
            ? t({ bn: 'আজকের কোনো কাজ নেই। উপরে থেকে একটি কাজ যোগ করুন।', en: 'No tasks for today yet. Add one above.' })
            : filter === 'upcoming'
              ? t({ bn: 'আসন্ন কোনো কাজ নেই।', en: 'No upcoming tasks.' })
              : t({ bn: 'এখনো কোনো কাজ সম্পন্ন হয়নি।', en: 'No completed tasks yet.' })}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: '16px 0 0', padding: 0, display: 'grid', gap: 12 }}>
          {visible.map((task) => (
            <li key={task.id} className="ev-card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleDone(task.id)}
                aria-label={t({ bn: `সম্পন্ন চিহ্নিত করুন: ${task.title}`, en: `Mark done: ${task.title}` })}
                style={{ width: 24, height: 24, marginTop: 2, flexShrink: 0, accentColor: 'var(--link)' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong
                  style={{
                    display: 'block',
                    fontSize: 16,
                    textDecoration: task.done ? 'line-through' : 'none',
                    color: task.done ? 'var(--muted)' : 'var(--heading)',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {task.title}
                </strong>
                <span style={{ display: 'block', color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
                  {task.date === today
                    ? t({ bn: 'আজ', en: 'Today' })
                    : task.date}
                  {task.time ? ` · ${task.time}` : ''} · {t(CATEGORY_LABELS[task.category])}
                </span>
              </div>
              <button
                className="ev-btn ev-btn-danger"
                type="button"
                style={{ minHeight: 44, flexShrink: 0 }}
                onClick={() => deleteTask(task.id)}
                aria-label={t({ bn: `মুছুন: ${task.title}`, en: `Delete: ${task.title}` })}
              >
                {t({ bn: 'মুছুন', en: 'Delete' })}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 20 }}>
        {t({
          bn: 'গোপনীয়তা: আপনার কাজগুলো শুধু এই ডিভাইসের ব্রাউজারে সংরক্ষিত থাকে। ব্রাউজারের ডেটা মুছলে কাজগুলোও মুছে যাবে।',
          en: 'Privacy: your tasks are stored only in this device’s browser. Clearing browser data will delete them.',
        })}
      </p>
    </PageShell>
  );
}
