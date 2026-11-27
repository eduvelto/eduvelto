// Eduvelto — Notes & To-Do List tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// List logic in src/lib/tools/notesTodo.ts. Persistence is
// localStorage ONLY, on the user's own device — nothing is ever
// sent to a server, and the UI says so plainly.

import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  addTodo, toggleTodo, deleteTodo, clearDone, filterTodos, todoCounts,
  parseStoredTodos, type TodoItem, type TodoFilter,
} from '../../lib/tools/notesTodo';
import {
  inputStyle, labelStyle, cardStyle, noteStyle, buttonRowStyle,
  tileGridStyle, ToolHero, CopyButton, Tile, presetChipStyle,
} from './toolUiShared';

const STORAGE_KEY = 'eduvelto-notes-todo-v1';

function loadStored(): TodoItem[] {
  try {
    return parseStoredTodos(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

export function NotesTodoTool() {
  const { t } = useLanguage();
  const [items, setItems] = useState<TodoItem[]>(() => loadStored());
  const [text, setText] = useState('');
  const [filter, setFilter] = useState<TodoFilter>('all');

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or unavailable (e.g. private mode): the list
      // still works for this session; nothing is sent anywhere.
    }
  }, [items]);

  const counts = todoCounts(items);
  const visible = useMemo(() => filterTodos(items, filter), [items, filter]);

  function submit(): void {
    const next = addTodo(items, text);
    if (next.length !== items.length) {
      setItems(next);
      setText('');
    }
  }

  const summaryText = items.map((i) => `${i.done ? '✓' : '○'} ${i.text}`).join('\n');

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="notes-title">
      <ToolHero
        titleId="notes-title"
        titleBn="নোট ও করণীয় তালিকা"
        titleEn="Notes & To-Do List"
        descBn="দৈনিক কাজের তালিকা ও নোট লিখে রাখুন — সবকিছু আপনার ব্রাউজারেই থাকে।"
        descEn="Keep daily tasks and notes in one list — everything stays in your browser."
        chipBn="শুধু আপনার ডিভাইসে সংরক্ষিত • সার্ভারে কিছু যায় না"
        chipEn="Stored only on your device • nothing goes to a server"
      />
      <div style={tileGridStyle}>
        <Tile label={t({ bn: 'মোট কাজ', en: 'Total tasks' })} value={String(counts.total)} />
        <Tile label={t({ bn: 'শেষ হয়েছে', en: 'Done' })} value={String(counts.done)} />
        <Tile label={t({ bn: 'বাকি আছে', en: 'Remaining' })} value={String(counts.remaining)} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle} htmlFor="todo-text">
            {t({ bn: 'নতুন কাজ / নোট', en: 'New task / note' })}
          </label>
          <input
            id="todo-text"
            style={inputStyle}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            placeholder={t({ bn: 'যেমন: ইংরেজি পড়া শেষ করা', en: 'e.g. Finish the English reading' })}
          />
        </div>
        <button
          type="button"
          className="ev-btn-outline"
          style={{ alignSelf: 'flex-end', minHeight: 44 }}
          onClick={submit}
        >
          {t({ bn: 'যোগ করুন', en: 'Add' })}
        </button>
      </div>
      <div style={buttonRowStyle} role="group" aria-label={t({ bn: 'দেখান', en: 'Show' })}>
        {(['all', 'active', 'done'] as const).map((f) => (
          <button
            key={f}
            type="button"
            style={presetChipStyle(filter === f)}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? t({ bn: 'সবগুলো', en: 'All' }) : f === 'active' ? t({ bn: 'বাকি', en: 'Remaining' }) : t({ bn: 'শেষ', en: 'Done' })}
          </button>
        ))}
        <button type="button" className="ev-btn-outline" onClick={() => setItems(clearDone(items))} disabled={counts.done === 0}>
          {t({ bn: 'শেষ হওয়াগুলো মুছুন', en: 'Clear completed' })}
        </button>
        {items.length > 0 ? (
          <CopyButton text={summaryText} labelBn="তালিকা কপি করুন" labelEn="Copy list" />
        ) : null}
      </div>
      <ul style={{ listStyle: 'none', margin: '16px 0 0', padding: 0 }}>
        {visible.map((item) => (
          <li
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: '10px 12px',
              marginBottom: 8,
              background: 'var(--card)',
            }}
          >
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => setItems(toggleTodo(items, item.id))}
              aria-label={item.text}
              style={{ width: 20, height: 20 }}
            />
            <span
              style={{
                flex: 1,
                fontSize: 15,
                color: 'var(--heading)',
                textDecoration: item.done ? 'line-through' : 'none',
                opacity: item.done ? 0.65 : 1,
              }}
            >
              {item.text}
            </span>
            <button
              type="button"
              className="ev-btn-outline"
              onClick={() => setItems(deleteTodo(items, item.id))}
              aria-label={t({ bn: `মুছুন: ${item.text}`, en: `Delete: ${item.text}` })}
            >
              {t({ bn: 'মুছুন', en: 'Delete' })}
            </button>
          </li>
        ))}
      </ul>
      {visible.length === 0 ? (
        <p style={{ marginTop: 14, color: 'var(--muted)', fontSize: 14 }}>
          {items.length === 0
            ? t({ bn: 'এখনো কোনো কাজ লেখা হয়নি — ওপরে লিখে যোগ করুন।', en: 'No tasks yet — write one above and add it.' })
            : t({ bn: 'এই তালিকায় কিছু নেই।', en: 'Nothing in this view.' })}
        </p>
      ) : null}
      <p style={noteStyle}>
        {t({
          bn: 'আপনার তালিকা শুধু এই ব্রাউজারের localStorage-এ থাকে — Eduvelto-র সার্ভারে কিছু পাঠানো হয় না। অন্য ডিভাইস বা ব্রাউজারে এটি দেখা যাবে না; ব্রাউজারের ডেটা মুছলে তালিকাও মুছে যাবে।',
          en: 'Your list lives only in this browser’s localStorage — nothing is sent to Eduvelto’s servers. It will not appear on another device or browser, and clearing browser data deletes it.',
        })}
      </p>
    </section>
  );
}
