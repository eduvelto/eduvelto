// Eduvelto — Vocabulary Trainer tool UI.
// Static deck in src/lib/tools/vocabularyTrainer.ts: 30 common
// English words with Bangla meanings. NOT exam questions, NOT
// claimed to be from any exam or book.
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { VOCAB_DECK, shuffleDeck, type VocabCard } from '../../lib/tools/vocabularyTrainer';
import { Tiles, ToolSection, noteStyle } from './eduToolUi';

export function VocabularyTrainerTool() {
  const { t } = useLanguage();
  const [deck, setDeck] = useState<readonly VocabCard[]>(() => shuffleDeck(VOCAB_DECK, 7));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const card = deck[index];
  const next = () => { setFlipped(false); setIndex((i) => (i + 1) % deck.length); };
  const prev = () => { setFlipped(false); setIndex((i) => (i - 1 + deck.length) % deck.length); };

  return (
    <ToolSection id="vocab-title" titleBn="শব্দভান্ডার প্রশিক্ষক" titleEn="Vocabulary Trainer"
      descBn="নতুন ইংরেজি শব্দ শিখুন ও অনুশীলন করুন। কার্ডে চাপ দিলে অর্থ ও উদাহরণ দেখা যাবে।"
      descEn="Learn and practise new English words. Tap a card to see the meaning and an example.">
      <Tiles items={[
        { label: t({ bn: 'কার্ড', en: 'Card' }), value: `${index + 1} / ${deck.length}` },
        { label: t({ bn: 'জানা হয়েছে', en: 'Known' }), value: String(known) },
        { label: t({ bn: 'মোট শব্দ', en: 'Total words' }), value: String(deck.length) },
      ]} />
      <button type="button" onClick={() => setFlipped((f) => !f)}
        style={{
          display: 'block', width: '100%', marginTop: 14, minHeight: 180, padding: 24,
          borderRadius: 12, border: '2px solid var(--teal-deep)', background: 'var(--teal-soft)',
          color: 'var(--heading)', fontSize: 22, fontWeight: 700, cursor: 'pointer',
        }}>
        {flipped ? (
          <span style={{ fontSize: 17, fontWeight: 400, display: 'block', lineHeight: 1.8 }}>
            {card.meaningBn} — {card.meaningEn}
            <span style={{ display: 'block', marginTop: 10, fontSize: 15, color: 'var(--muted)' }}>{card.exampleEn}</span>
          </span>
        ) : (
          card.word
        )}
        <span style={{ display: 'block', marginTop: 14, fontSize: 13, fontWeight: 400, color: 'var(--muted)' }}>
          {flipped
            ? t({ bn: 'আবার চাপ দিলে শব্দ দেখা যাবে', en: 'Tap again to see the word' })
            : t({ bn: 'অর্থ দেখতে চাপ দিন', en: 'Tap to see the meaning' })}
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
          onClick={() => { setDeck(shuffleDeck(VOCAB_DECK)); setIndex(0); setFlipped(false); }}>
          {t({ bn: 'এলোমেলো করুন', en: 'Shuffle' })}
        </button>
      </div>
      <p style={noteStyle}>{t({ bn: '৩০টি শব্দ — শুরুটা। এগুলো সাধারণ ইংরেজি শব্দের অর্থ; কোনো পরীক্ষা বা বইয়ের প্রশ্ন বলে দাবি করা হয়নি।', en: '30 words — a starter set. These are meanings of common English words; they are not claimed to be from any exam or book.' })}</p>
    </ToolSection>
  );
}
