// Notes & To-Do + Tasbih Counter — unit tests.
import { describe, it, expect } from 'vitest';
import {
  addTodo, toggleTodo, deleteTodo, clearDone, filterTodos, todoCounts,
  parseStoredTodos, createTodo,
} from '../../tools/notesTodo';
import { DHIKRS, TASBIH_TARGETS, tasbihProgress, parseStoredCount, dhikrByKey } from '../../tools/tasbih';

describe('notesTodo', () => {
  it('adds, toggles and deletes items; blank text is ignored', () => {
    let items = addTodo([], '  ');
    expect(items).toHaveLength(0);
    items = addTodo(items, 'পড়া শেষ করা', 1000);
    expect(items).toHaveLength(1);
    expect(items[0].done).toBe(false);
    items = toggleTodo(items, items[0].id);
    expect(items[0].done).toBe(true);
    expect(todoCounts(items)).toEqual({ total: 1, done: 1, remaining: 0 });
    items = deleteTodo(items, items[0].id);
    expect(items).toHaveLength(0);
  });

  it('clearDone keeps only active items; filter works', () => {
    let items = addTodo([], 'ক', 1);
    items = addTodo(items, 'খ', 2);
    items = toggleTodo(items, items[0].id);
    expect(filterTodos(items, 'done')).toHaveLength(1);
    expect(filterTodos(items, 'active')).toHaveLength(1);
    expect(clearDone(items)).toHaveLength(1);
  });

  it('parseStoredTodos rejects corrupt or malformed data', () => {
    expect(parseStoredTodos(null)).toEqual([]);
    expect(parseStoredTodos('not json')).toEqual([]);
    expect(parseStoredTodos('{"a":1}')).toEqual([]);
    const good = [{ id: '1', text: 'ক', done: false, createdAt: 1 }];
    expect(parseStoredTodos(JSON.stringify(good))).toEqual(good);
    expect(createTodo('  ')).toBeNull();
  });
});

describe('tasbih', () => {
  it('has 8 dhikr phrases and targets 33/99/100/500', () => {
    expect(DHIKRS).toHaveLength(8);
    expect(TASBIH_TARGETS).toEqual([33, 99, 100, 500]);
    expect(dhikrByKey('subhanallah')?.arabic).toContain('سُبْحَانَ');
    for (const d of DHIKRS) {
      expect(d.arabic.trim()).not.toBe('');
      expect(d.meaningBn.trim()).not.toBe('');
    }
  });

  it('progress counts rounds and remainder', () => {
    expect(tasbihProgress(100, 33)).toEqual({ rounds: 3, inRound: 1, percent: 100 });
    expect(tasbihProgress(50, 100)).toEqual({ rounds: 0, inRound: 50, percent: 50 });
    expect(tasbihProgress(0, 33)).toEqual({ rounds: 0, inRound: 0, percent: 0 });
  });

  it('parseStoredCount rejects invalid values', () => {
    expect(parseStoredCount(null)).toBe(0);
    expect(parseStoredCount('abc')).toBe(0);
    expect(parseStoredCount('-5')).toBe(0);
    expect(parseStoredCount('42')).toBe(42);
  });
});
