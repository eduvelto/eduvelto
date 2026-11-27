import { describe, it, expect } from 'vitest';
import { VOCAB_DECK, shuffleDeck } from '../../tools/vocabularyTrainer';

describe('VOCAB_DECK', () => {
  it('has 30 words, each with Bangla + English meanings and an example', () => {
    expect(VOCAB_DECK.length).toBe(30);
    for (const card of VOCAB_DECK) {
      expect(card.word.trim().length).toBeGreaterThan(0);
      expect(card.meaningBn.trim().length).toBeGreaterThan(0);
      expect(card.meaningEn.trim().length).toBeGreaterThan(0);
      expect(card.exampleEn.trim().length).toBeGreaterThan(0);
    }
  });
  it('has no duplicate words', () => {
    const words = VOCAB_DECK.map((c) => c.word.toLowerCase());
    expect(new Set(words).size).toBe(words.length);
  });
  it('shuffle keeps the deck intact', () => {
    expect(shuffleDeck(VOCAB_DECK, 7).length).toBe(30);
  });
});
