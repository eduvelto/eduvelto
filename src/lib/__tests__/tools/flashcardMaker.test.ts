import { describe, expect, it } from 'vitest';
import {
  createDeck,
  addCard,
  editCard,
  deleteCard,
  recordAnswer,
  dueCards,
  importDeck,
  exportDeck,
} from '../../tools/flashcardMaker';

describe('flashcardMaker', () => {
  it('creates a deck and adds cards', () => {
    let deck = createDeck('BCS GK', 'Bangladesh Affairs', 'BCS');
    deck = addCard(deck, 'What is the capital of Bangladesh?', 'Dhaka');
    deck = addCard(deck, 'When was Bangladesh liberated?', '16 December 1971');
    expect(deck.cards).toHaveLength(2);
  });
  it('rejects empty titles and empty card sides', () => {
    expect(() => createDeck('', 'X', 'Custom')).toThrow(/title/);
    const deck = createDeck('D', 'S', 'Custom');
    expect(() => addCard(deck, '', 'back')).toThrow(/front/);
    expect(() => addCard(deck, 'front', '')).toThrow(/back/);
  });
  it('edits and deletes cards', () => {
    let deck = createDeck('D', 'S', 'Custom');
    deck = addCard(deck, 'Q1', 'A1');
    const id = deck.cards[0].id;
    deck = editCard(deck, id, 'Q1 edited', 'A1 edited');
    expect(deck.cards[0].front).toBe('Q1 edited');
    deck = deleteCard(deck, id);
    expect(deck.cards).toHaveLength(0);
  });
  it('SRS: wrong -> tomorrow, right -> in 3 days', () => {
    const now = new Date('2026-11-27T00:00:00Z');
    const card = { id: '1', front: 'Q', back: 'A' };
    expect(recordAnswer(card, false, now).nextReview).toBe('2026-11-28');
    expect(recordAnswer(card, true, now).nextReview).toBe('2026-11-30');
    expect(recordAnswer(card, true, now).streak).toBe(1);
  });
  it('dueCards returns only due cards', () => {
    let deck = createDeck('D', 'S', 'Custom');
    deck = addCard(deck, 'Q1', 'A1');
    deck = addCard(deck, 'Q2', 'A2');
    deck = {
      ...deck,
      cards: [
        { ...deck.cards[0], nextReview: '2026-11-27' },
        { ...deck.cards[1], nextReview: '2026-12-01' },
      ],
    };
    expect(dueCards(deck, '2026-11-27')).toHaveLength(1);
  });
  it('export -> import round-trips', () => {
    let deck = createDeck('BCS GK', 'Bangladesh Affairs', 'BCS');
    deck = addCard(deck, 'Q1', 'A1');
    const imported = importDeck(exportDeck(deck));
    expect(imported.title).toBe('BCS GK');
    expect(imported.cards).toHaveLength(1);
    expect(imported.cards[0].front).toBe('Q1');
  });
  it('import names the bad card', () => {
    expect(() => importDeck('{"title":"D","cards":[{"front":"Q"}]}')).toThrow(/Card 1/);
    expect(() => importDeck('not json')).toThrow(/Could not read/);
    expect(() => importDeck('{"title":"D","cards":[]}')).toThrow(/no cards/);
  });
});
