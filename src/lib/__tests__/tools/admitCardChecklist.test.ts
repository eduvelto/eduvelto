import { describe, it, expect } from 'vitest';
import { ADMIT_CARD_ITEMS, checklistProgress } from '../../tools/admitCardChecklist';

describe('checklistProgress', () => {
  it('counts packed items', () => {
    const p = checklistProgress(['admit', 'pen'], ADMIT_CARD_ITEMS);
    expect(p.done).toBe(2);
    expect(p.total).toBe(ADMIT_CARD_ITEMS.length);
    expect(p.percent).toBe(Math.round((2 / ADMIT_CARD_ITEMS.length) * 100));
    expect(p.allDone).toBe(false);
  });
  it('all done when every item is checked', () => {
    const ids = ADMIT_CARD_ITEMS.map((i) => i.id);
    expect(checklistProgress(ids, ADMIT_CARD_ITEMS).allDone).toBe(true);
  });
  it('default list includes the admit card itself', () => {
    expect(ADMIT_CARD_ITEMS.some((i) => i.id === 'admit')).toBe(true);
  });
});
