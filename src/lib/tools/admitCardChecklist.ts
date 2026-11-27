/**
 * Admit Card Checklist — pure logic (default exam-day items + progress).
 * The list is a starting point the user can tick, add to and remove
 * from in the UI. Pure functions only: no network, no storage, no DOM.
 */

export interface ChecklistItem {
  id: string;
  bn: string;
  en: string;
  category: string;
}

export const ADMIT_CARD_ITEMS: readonly ChecklistItem[] = [
  { id: 'admit', bn: 'প্রবেশপত্র (প্রিন্ট)', en: 'Admit card (printed)', category: 'must' },
  { id: 'nid', bn: 'জাতীয় পরিচয়পত্র / জন্ম নিবন্ধন', en: 'NID / birth certificate', category: 'must' },
  { id: 'pen', bn: 'কলম (২টি)', en: 'Pens (2)', category: 'must' },
  { id: 'pencil', bn: 'পেনসিল ও ইরেজার', en: 'Pencil and eraser', category: 'must' },
  { id: 'scale', bn: 'স্কেল', en: 'Ruler', category: 'must' },
  { id: 'watch', bn: 'ঘড়ি', en: 'Watch', category: 'useful' },
  { id: 'water', bn: 'পানির বোতল', en: 'Water bottle', category: 'useful' },
  { id: 'calculator', bn: 'ক্যালকুলেটর (যদি অনুমতি থাকে)', en: 'Calculator (if allowed)', category: 'useful' },
  { id: 'mask', bn: 'মাস্ক / রুমাল', en: 'Mask / handkerchief', category: 'useful' },
  { id: 'bag', bn: 'স্বচ্ছ ব্যাগ / ফাইল', en: 'Clear bag / file', category: 'useful' },
];

export interface ChecklistProgress {
  done: number;
  total: number;
  percent: number;
  allDone: boolean;
}

export function checklistProgress(checkedIds: readonly string[], items: readonly ChecklistItem[]): ChecklistProgress {
  const total = items.length;
  const done = items.filter((item) => checkedIds.includes(item.id)).length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100), allDone: total > 0 && done === total };
}
