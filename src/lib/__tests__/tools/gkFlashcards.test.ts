import { describe, it, expect } from 'vitest';
import { GK_DECK, shuffleDeck } from '../../tools/gkFlashcards';

describe('GK_DECK', () => {
  it('has 30 cards, all with a question and an answer', () => {
    expect(GK_DECK.length).toBe(30);
    for (const card of GK_DECK) {
      expect(card.front.trim().length).toBeGreaterThan(0);
      expect(card.back.trim().length).toBeGreaterThan(0);
    }
  });
  it('includes the capital of Bangladesh as Dhaka', () => {
    expect(GK_DECK[0].back).toContain('Dhaka');
  });
});

describe('shuffleDeck', () => {
  it('keeps all cards and is deterministic with a seed', () => {
    const a = shuffleDeck(GK_DECK, 42);
    const b = shuffleDeck(GK_DECK, 42);
    expect(a).toEqual(b);
    expect(a.map((c) => c.front).sort()).toEqual(GK_DECK.map((c) => c.front).sort());
  });
});
