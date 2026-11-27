/**
 * Notes & To-Do — pure list logic. Persistence lives in the UI
 * (localStorage ONLY, on the user's own device — nothing is ever
 * sent to a server). The logic here never touches storage or the
 * DOM, so it is fully testable.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  /** Epoch milliseconds when the item was created. */
  createdAt: number;
}

/** Create an item from user text; returns null for blank text. */
export function createTodo(text: string, now: number = Date.now()): TodoItem | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  return {
    id: `${now}-${Math.floor(Math.random() * 100000)}`,
    text: trimmed,
    done: false,
    createdAt: now,
  };
}

/** Add an item (no-op for blank text). */
export function addTodo(items: readonly TodoItem[], text: string, now: number = Date.now()): TodoItem[] {
  const item = createTodo(text, now);
  return item ? [...items, item] : [...items];
}

/** Toggle the done flag of one item (unknown id: unchanged). */
export function toggleTodo(items: readonly TodoItem[], id: string): TodoItem[] {
  return items.map((item) => (item.id === id ? { ...item, done: !item.done } : item));
}

/** Delete one item (unknown id: unchanged). */
export function deleteTodo(items: readonly TodoItem[], id: string): TodoItem[] {
  return items.filter((item) => item.id !== id);
}

/** Remove all completed items. */
export function clearDone(items: readonly TodoItem[]): TodoItem[] {
  return items.filter((item) => !item.done);
}

export type TodoFilter = 'all' | 'active' | 'done';

export function filterTodos(items: readonly TodoItem[], filter: TodoFilter): TodoItem[] {
  if (filter === 'active') return items.filter((i) => !i.done);
  if (filter === 'done') return items.filter((i) => i.done);
  return [...items];
}

export function todoCounts(items: readonly TodoItem[]): { total: number; done: number; remaining: number } {
  const done = items.filter((i) => i.done).length;
  return { total: items.length, done, remaining: items.length - done };
}

/** Parse stored JSON defensively: anything invalid becomes an empty list. */
export function parseStoredTodos(raw: string | null): TodoItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is TodoItem =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as TodoItem).id === 'string' &&
        typeof (item as TodoItem).text === 'string' &&
        typeof (item as TodoItem).done === 'boolean' &&
        typeof (item as TodoItem).createdAt === 'number',
    );
  } catch {
    return [];
  }
}
