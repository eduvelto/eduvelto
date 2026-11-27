// Eduvelto — GK Flashcard tool UI.
// Static deck in src/lib/tools/gkFlashcards.ts: 30 well-established,
// uncontroversial facts only (capitals, basic science). NOT exam
// questions, NOT claimed to be from any exam or book.
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { GK_DECK, shuffleDeck, type Flashcard } from '../../lib/tools/gkFlashcards';
import { Tiles, ToolSection, noteStyle } from './eduToolUi';

export function GkFlashcardTool() {
  const { t } = useLanguage();
  const [deck, setDeck] = useState<readonly Flashcard[]>(() => shuffleDeck(GK_DECK, 42));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const card = deck[index];
  const next = () => { setFlipped(false); setIndex((i) => (i + 1) % deck.length); };
  const prev = () => { setFlipped(false); setIndex((i) => (i - 1 + deck.length) % deck.length); };

  return (
    <ToolSection id="gk-flashcard-title" titleBn="সাধারণ জ্ঞান ফ্ল্যাশকার্ড" titleEn="GK Flashcard"
      descBn="দৈনিক সাধারণ জ্ঞানের প্রশ্ন ফ্ল্যাশকার্ডে অনুশীলন করুন। কার্ডে চাপ দিলে উত্তর দেখা যাবে।"
      descEn="Practise daily general knowledge questions with flashcards. Tap a card to see the answer.">
      <Tiles items={[
        { label: t({ bn: 'কার্ড', en: 'Card' }), value: `${index + 1} / ${deck.length}` },
        { label: t({ bn: 'জানা হয়েছে', en: 'Known' }), value: String(known) },
        { label: t({ bn: 'মোট কার্ড', en: 'Total cards' }), value: String(deck.length) },
      ]} />
      <button type="button" onClick={() => setFlipped((f) => !f)}
        style={{
          display: 'block', width: '100%', marginTop: 14, minHeight: 180, padding: 24,
          borderRadius: 12, border: '2px solid var(--teal-deep)', background: 'var(--teal-soft)',
          color: 'var(--heading)', fontSize: 19, fontWeight: 600, cursor: 'pointer',
        }}>
        {flipped ? card.back : card.front}
        <span style={{ display: 'block', marginTop: 14, fontSize: 13, fontWeight: 400, color: 'var(--muted)' }}>
          {flipped
            ? t({ bn: 'আবার চাপ দিলে প্রশ্ন দেখা যাবে', en: 'Tap again to see the question' })
            : t({ bn: 'উত্তর দেখতে চাপ দিন', en: 'Tap to see the answer' })}
        </span>
      </button>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 44 }} onClick={prev}>
          {t({ bn: '← আগেরটি', en: '← Previous' })}
        </button>
        <button type="button" className="ev-btn ev-btn-primary" style={{ minHeight: 44 }} onClick={next}>
          {t({ bn: 'পরেরটি →', en: 'Next →' })}
        </button>
        <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 44 }}
          onClick={() => { setKnown((k) => k + 1); next(); }}>
          {t({ bn: 'জানি ✓', en: 'I know it ✓' })}
        </button>
        <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 44 }}
          onClick={() => { setDeck(shuffleDeck(GK_DECK)); setIndex(0); setFlipped(false); }}>
          {t({ bn: 'এলোমেলো করুন', en: 'Shuffle' })}
        </button>
      </div>
      <p style={noteStyle}>{t({ bn: '৩০টি কার্ড — শুরুটা। এগুলো সাধারণ, প্রতিষ্ঠিত তথ্য; কোনো পরীক্ষা বা বইয়ের প্রশ্ন বলে দাবি করা হয়নি।', en: '30 cards — a starter set. These are general, well-established facts; they are not claimed to be from any exam or book.' })}</p>
    </ToolSection>
  );
}
