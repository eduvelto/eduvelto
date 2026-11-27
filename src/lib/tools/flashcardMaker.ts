// localStorage (versioned key eduvelto-flashcards-v1) and rendering.
// User decks are the user's own content. Built-in decks must be verified facts
// only (NCTB-first rule) — no new built-in deck ships in this batch.

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  /** ISO date of the next review (lightweight SRS). */
  nextReview?: string;
  /** Consecutive correct answers. */
  streak?: number;
}

export interface FlashDeck {
  id: string;
  title: string;
  subject: string;
  examTag: 'BCS' | 'Bank' | 'Primary' | 'Admission' | 'Custom';
  cards: Flashcard[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export const FLASHCARD_STORAGE_KEY = 'eduvelto-flashcards-v1';

export function makeId(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const buf = new Uint8Array(8);
    cryptoObj.getRandomValues(buf);
    return [...buf].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `card-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export function createDeck(title: string, subject: string, examTag: FlashDeck['examTag']): FlashDeck {
  if (title.trim() === '') throw new Error('Give the deck a title first');
  if (title.trim().length > 80) throw new Error('Deck title must be 80 characters or fewer');
  const now = new Date().toISOString();
  return { id: makeId(), title: title.trim(), subject: subject.trim(), examTag, cards: [], createdAt: now, updatedAt: now };
}

export function addCard(deck: FlashDeck, front: string, back: string): FlashDeck {
  if (front.trim() === '') throw new Error('The front of the card cannot be empty');
  if (back.trim() === '') throw new Error('The back of the card cannot be empty');
  if (front.trim().length > 500 || back.trim().length > 1000) {
    throw new Error('Card text is too long (front 500, back 1000 characters)');
  }
  const now = new Date().toISOString();
  return {
    ...deck,
    cards: [...deck.cards, { id: makeId(), front: front.trim(), back: back.trim() }],
    updatedAt: now,
  };
}

export function editCard(deck: FlashDeck, cardId: string, front: string, back: string): FlashDeck {
  if (!deck.cards.some((c) => c.id === cardId)) throw new Error(`No card with id ${cardId} in this deck`);
  if (front.trim() === '' || back.trim() === '') throw new Error('Front and back cannot be empty');
  return {
    ...deck,
    cards: deck.cards.map((c) => (c.id === cardId ? { ...c, front: front.trim(), back: back.trim() } : c)),
    updatedAt: new Date().toISOString(),
  };
}

export function deleteCard(deck: FlashDeck, cardId: string): FlashDeck {
  return {
    ...deck,
    cards: deck.cards.filter((c) => c.id !== cardId),
    updatedAt: new Date().toISOString(),
  };
}

/** Lightweight SRS: wrong -> tomorrow, right -> in 3 days (local only). */
export function recordAnswer(card: Flashcard, correct: boolean, now = new Date()): Flashcard {
  const next = new Date(now);
  if (correct) {
    next.setDate(next.getDate() + 3);
    return { ...card, streak: (card.streak ?? 0) + 1, nextReview: next.toISOString().slice(0, 10) };
  }
  next.setDate(next.getDate() + 1);
  return { ...card, streak: 0, nextReview: next.toISOString().slice(0, 10) };
}

export function dueCards(deck: FlashDeck, today = new Date().toISOString().slice(0, 10)): Flashcard[] {
  return deck.cards.filter((c) => !c.nextReview || c.nextReview <= today);
}

/** Validate + parse an imported deck JSON file. Errors name the bad card. */
export function importDeck(jsonText: string): FlashDeck {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`Could not read the deck file: ${e instanceof Error ? e.message : 'invalid JSON'}`);
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('The deck file must contain one deck object');
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.title !== 'string' || obj.title.trim() === '') {
    throw new Error('The deck file has no title');
  }
  if (!Array.isArray(obj.cards)) throw new Error('The deck file has no "cards" list');
  const cards: Flashcard[] = [];
  for (let i = 0; i < obj.cards.length; i += 1) {
    const c = obj.cards[i] as Record<string, unknown>;
    if (!c || typeof c.front !== 'string' || c.front.trim() === '' || typeof c.back !== 'string' || c.back.trim() === '') {
      throw new Error(`Card ${i + 1} in the file is missing its front or back text`);
    }
    cards.push({ id: typeof c.id === 'string' ? c.id : makeId(), front: c.front.trim(), back: c.back.trim() });
  }
  if (cards.length === 0) throw new Error('The deck file has no cards');
  if (cards.length > 500) throw new Error(`The deck has ${cards.length} cards — the limit is 500 per deck`);
  const now = new Date().toISOString();
  return {
    id: makeId(),
    title: obj.title.trim(),
    subject: typeof obj.subject === 'string' ? obj.subject.trim() : '',
    examTag: 'Custom',
    cards,
    createdAt: now,
    updatedAt: now,
  };
}

export function exportDeck(deck: FlashDeck): string {
  return JSON.stringify({ title: deck.title, subject: deck.subject, examTag: deck.examTag, cards: deck.cards }, null, 2);
}
