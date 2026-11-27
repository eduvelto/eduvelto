// Eduvelto — Flashcard Maker tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: createDeck() / addCard() / editCard() / deleteCard() / recordAnswer() / importDeck() / exportDeck() in src/lib/tools/flashcardMaker.ts (localStorage key eduvelto-flashcards-v1). 100% in-browser; nothing is uploaded.
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import {
  FLASHCARD_STORAGE_KEY, addCard, createDeck, deleteCard, editCard, exportDeck, importDeck, recordAnswer, dueCards,
  type FlashDeck, type Flashcard,
} from '../../lib/tools/flashcardMaker';
import { shuffleFair } from '../../lib/tools/passwordRandom';

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};

const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};





const EXAM_TAGS = ['BCS', 'Bank', 'Primary', 'Admission', 'Custom'] as const;

function loadDecks(): FlashDeck[] {
  try {
    const raw = localStorage.getItem(FLASHCARD_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FlashDeck[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function FlashcardMakerTool() {
  const { t } = useLanguage();
  const [decks, setDecks] = useState<FlashDeck[]>(() => loadDecks());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [examTag, setExamTag] = useState<(typeof EXAM_TAGS)[number]>('Custom');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Study session state
  const [session, setSession] = useState<Flashcard[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [unknown, setUnknown] = useState(0);

  useEffect(() => {
    try { localStorage.setItem(FLASHCARD_STORAGE_KEY, JSON.stringify(decks)); } catch { /* storage full/blocked */ }
  }, [decks]);

  const active = decks.find((d) => d.id === activeId) ?? null;
  const current = session[0] ?? null;
  const dueCount = useMemo(() => (active ? dueCards(active).length : 0), [active]);

  function updateDeck(next: FlashDeck): void {
    setDecks((prev) => prev.map((d) => (d.id === next.id ? next : d)));
  }

  function handleCreateDeck(): void {
    setError(null);
    try {
      const deck = createDeck(title, subject, examTag);
      setDecks((prev) => [...prev, deck]);
      setActiveId(deck.id);
      setTitle('');
      setSubject('');
      setNotice(t({ bn: `ডেক তৈরি হয়েছে: ${deck.title}`, en: `Deck created: ${deck.title}` }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the deck');
    }
  }

  function handleAddCard(): void {
    if (!active) return;
    setError(null);
    try {
      if (editingId) {
        updateDeck(editCard(active, editingId, front, back));
        setEditingId(null);
      } else {
        updateDeck(addCard(active, front, back));
      }
      setFront('');
      setBack('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the card');
    }
  }

  function startStudy(shuffle: boolean): void {
    if (!active || active.cards.length === 0) return;
    const cards = shuffle ? shuffleFair(active.cards) : [...active.cards];
    setSession(cards);
    setFlipped(false);
    setKnown(0);
    setUnknown(0);
  }

  function answer(correct: boolean): void {
    if (!active || !current) return;
    const updated = recordAnswer(current, correct);
    updateDeck({ ...active, cards: active.cards.map((c) => (c.id === current.id ? updated : c)) });
    if (correct) setKnown((k) => k + 1);
    else {
      setUnknown((u) => u + 1);
      setSession((prev) => [...prev.slice(1), current]);
    }
    if (correct) setSession((prev) => prev.slice(1));
    setFlipped(false);
  }

  async function handleImport(file: File | null): Promise<void> {
    if (!file) return;
    setError(null);
    try {
      const deck = importDeck(await file.text());
      setDecks((prev) => [...prev, deck]);
      setActiveId(deck.id);
      setNotice(t({ bn: `ডেক আমদানি হয়েছে: ${deck.title} (${deck.cards.length}টি কার্ড)`, en: `Deck imported: ${deck.title} (${deck.cards.length} cards)` }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read the deck file');
    }
  }

  function handleExport(deck: FlashDeck): void {
    const blob = new Blob([exportDeck(deck)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.title.replace(/[^A-Za-z0-9_-]+/g, '-').toLowerCase() || 'deck'}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="ফ্ল্যাশকার্ড মেকার" titleEn="Flashcard Maker" descBn="নিজের ফ্ল্যাশকার্ড ডেক বানান, পড়ুন ও সংরক্ষণ করুন — কোনো অ্যাকাউন্ট লাগে না।" descEn="Make your own flashcard decks, study them and keep them — no account needed." chipBn="ডেক আপনার ডিভাইসেই থাকে" chipEn="Your decks stay on your device" />
      {error ? <p style={errorStyle} role="alert">{error}</p> : null}
      {notice ? <p style={noteStyle} role="status">{notice}</p> : null}

      {active === null ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div>
              <label style={labelStyle} htmlFor="fc-title">{t({ bn: 'ডেকের নাম', en: 'Deck title' })}</label>
              <input id="fc-title" style={inputStyle} type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t({ bn: 'যেমন: BCS সাধারণ জ্ঞান', en: 'e.g. BCS General Knowledge' })} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="fc-subject">{t({ bn: 'বিষয় (ঐচ্ছিক)', en: 'Subject (optional)' })}</label>
              <input id="fc-subject" style={inputStyle} type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t({ bn: 'যেমন: বাংলাদেশ', en: 'e.g. Bangladesh' })} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="fc-tag">{t({ bn: 'পরীক্ষা', en: 'Exam' })}</label>
              <select id="fc-tag" style={inputStyle} value={examTag} onChange={(e) => setExamTag(e.target.value as (typeof EXAM_TAGS)[number])}>
                {EXAM_TAGS.map((tag) => (<option key={tag} value={tag}>{tag}</option>))}
              </select>
            </div>
          </div>
          <ButtonRow>
            <button type="button" style={{ minHeight: 44, padding: '0 22px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 700, cursor: 'pointer' }} onClick={handleCreateDeck}>
              {t({ bn: 'ডেক তৈরি করুন', en: 'Create deck' })}
            </button>
            <label style={{ minHeight: 44, lineHeight: '44px', padding: '0 18px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', fontWeight: 600, cursor: 'pointer' }}>
              {t({ bn: 'ডেক আমদানি করুন (JSON)', en: 'Import deck (JSON)' })}
              <input type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => void handleImport(e.target.files?.[0] ?? null)} />
            </label>
          </ButtonRow>
          {decks.length > 0 ? (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>{t({ bn: 'আপনার ডেক:', en: 'Your decks:' })}</p>
              {decks.map((d) => (
                <div key={d.id} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '12px', marginBottom: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong>{d.title}</strong>
                    <span style={{ color: 'var(--muted)', fontSize: 14 }}> — {d.cards.length} {t({ bn: 'কার্ড', en: 'cards' })} • {d.examTag}{d.subject ? ` • ${d.subject}` : ''}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" style={{ minHeight: 36, padding: '0 12px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 600, cursor: 'pointer' }} onClick={() => { setActiveId(d.id); setSession([]); }}>{t({ bn: 'খুলুন', en: 'Open' })}</button>
                    <button type="button" style={{ minHeight: 36, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', cursor: 'pointer', color: '#b3261e' }} onClick={() => setDecks((prev) => prev.filter((x) => x.id !== d.id))}>{t({ bn: 'মুছুন', en: 'Delete' })}</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={noteStyle}>{t({ bn: 'এখনো কোনো ডেক নেই — উপরে নাম দিয়ে প্রথম ডেকটি বানান।', en: 'No decks yet — create your first deck above.' })}</p>
          )}
        </>
      ) : (
        <>
          <ButtonRow>
            <button type="button" style={{ minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', cursor: 'pointer', fontWeight: 600 }} onClick={() => { setActiveId(null); setSession([]); }}>
              ← {t({ bn: 'সব ডেক', en: 'All decks' })}
            </button>
            <button type="button" style={{ minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', cursor: 'pointer', fontWeight: 600 }} onClick={() => handleExport(active)}>
              {t({ bn: 'ডেক এক্সপোর্ট করুন (JSON)', en: 'Export deck (JSON)' })}
            </button>
          </ButtonRow>
          <p style={{ fontSize: 16, fontWeight: 700, margin: '14px 0 4px' }}>{active.title} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({active.cards.length} {t({ bn: 'কার্ড', en: 'cards' })}{dueCount > 0 ? ` • ${dueCount} ${t({ bn: 'আজকের পড়া বাকি', en: 'due today' })}` : ''})</span></p>

          {session.length === 0 ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
                <div>
                  <label style={labelStyle} htmlFor="fc-front">{t({ bn: 'সামনের দিক (প্রশ্ন)', en: 'Front (question)' })}</label>
                  <input id="fc-front" style={inputStyle} type="text" value={front} onChange={(e) => setFront(e.target.value)} placeholder={t({ bn: 'যেমন: বাংলাদেশের রাজধানী কোনটি?', en: 'e.g. What is the capital of Bangladesh?' })} />
                </div>
                <div>
                  <label style={labelStyle} htmlFor="fc-back">{t({ bn: 'পেছনের দিক (উত্তর)', en: 'Back (answer)' })}</label>
                  <input id="fc-back" style={inputStyle} type="text" value={back} onChange={(e) => setBack(e.target.value)} placeholder="ঢাকা" />
                </div>
              </div>
              <ButtonRow>
                <button type="button" style={{ minHeight: 44, padding: '0 18px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 700, cursor: 'pointer' }} onClick={handleAddCard}>
                  {editingId ? t({ bn: 'কার্ড সংরক্ষণ করুন', en: 'Save card' }) : t({ bn: 'কার্ড যোগ করুন', en: 'Add card' })}
                </button>
                {editingId ? (
                  <button type="button" style={{ minHeight: 44, padding: '0 18px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', cursor: 'pointer' }} onClick={() => { setEditingId(null); setFront(''); setBack(''); }}>{t({ bn: 'বাতিল', en: 'Cancel' })}</button>
                ) : null}
                <button type="button" style={{ minHeight: 44, padding: '0 18px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', fontWeight: 600, cursor: 'pointer' }} onClick={() => startStudy(false)} disabled={active.cards.length === 0}>
                  {t({ bn: 'পড়া শুরু করুন', en: 'Start studying' })}
                </button>
                <button type="button" style={{ minHeight: 44, padding: '0 18px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', fontWeight: 600, cursor: 'pointer' }} onClick={() => startStudy(true)} disabled={active.cards.length === 0}>
                  {t({ bn: 'এলোমেলো করে পড়ুন', en: 'Shuffle & study' })}
                </button>
              </ButtonRow>
              {active.cards.length > 0 ? (
                <div style={{ marginTop: 14 }}>
                  {active.cards.map((c) => (
                    <div key={c.id} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', marginBottom: 8, display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div><strong>{c.front}</strong><span style={{ color: 'var(--muted)' }}> → {c.back}</span>{c.nextReview ? <span style={{ color: 'var(--muted)', fontSize: 13 }}> • {t({ bn: 'পরের পড়া: ', en: 'Next review: ' })}{c.nextReview}</span> : null}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" style={{ minHeight: 32, padding: '0 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', cursor: 'pointer' }} onClick={() => { setEditingId(c.id); setFront(c.front); setBack(c.back); }}>{t({ bn: 'সম্পাদনা', en: 'Edit' })}</button>
                        <button type="button" style={{ minHeight: 32, padding: '0 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', cursor: 'pointer', color: '#b3261e' }} onClick={() => updateDeck(deleteCard(active, c.id))}>{t({ bn: 'মুছুন', en: 'Delete' })}</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={noteStyle}>{t({ bn: 'এই ডেকে এখনো কার্ড নেই — উপরে প্রশ্ন ও উত্তর দিয়ে প্রথম কার্ডটি যোগ করুন।', en: 'This deck has no cards yet — add the first one above.' })}</p>
              )}
            </>
          ) : (
            <>
              {current ? (
                <div style={{ marginTop: 14, border: '1px solid var(--line)', borderRadius: 12, padding: '24px 18px', textAlign: 'center', background: 'var(--card)', cursor: 'pointer', minHeight: 160 }} onClick={() => setFlipped((f) => !f)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setFlipped((f) => !f); }}>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 8px' }}>{flipped ? t({ bn: 'উত্তর — চাপ দিলে প্রশ্ন দেখাবে', en: 'Answer — tap to see the question' }) : t({ bn: 'প্রশ্ন — চাপ দিলে উত্তর দেখাবে', en: 'Question — tap to see the answer' })}</p>
                  <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{flipped ? current.back : current.front}</p>
                </div>
              ) : null}
              <p style={{ marginTop: 10, fontSize: 14, color: 'var(--muted)' }}>{t({ bn: `বাকি: ${session.length}টি • জানা: ${known} • জানা নেই: ${unknown}`, en: `Remaining: ${session.length} • Known: ${known} • Don't know: ${unknown}` })}</p>
              {current ? (
                <ButtonRow>
                  <button type="button" style={{ minHeight: 44, padding: '0 18px', borderRadius: 8, border: 'none', background: '#15803d', color: '#fff', fontWeight: 700, cursor: 'pointer' }} onClick={() => answer(true)}>{t({ bn: 'জানি ✓', en: "I know ✓" })}</button>
                  <button type="button" style={{ minHeight: 44, padding: '0 18px', borderRadius: 8, border: 'none', background: '#b3261e', color: '#fff', fontWeight: 700, cursor: 'pointer' }} onClick={() => answer(false)}>{t({ bn: 'জানি না ✗', en: "I don't know ✗" })}</button>
                  <button type="button" style={{ minHeight: 44, padding: '0 18px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', cursor: 'pointer' }} onClick={() => { setSession([]); setFlipped(false); }}>{t({ bn: 'পড়া থামান', en: 'Stop studying' })}</button>
                </ButtonRow>
              ) : (
                <div style={resultStyle} role="status">
                  <p style={{ margin: 0, fontSize: 16 }}><strong>{t({ bn: `সেশন শেষ — জানা: ${known}, জানা নেই: ${unknown}। ভুল কার্ডগুলো আগামীকাল আবার আসবে, ঠিক কার্ডগুলো ৩ দিন পর।`, en: `Session done — known: ${known}, unknown: ${unknown}. Wrong cards return tomorrow, right cards in 3 days.` })}</strong></p>
                  <ButtonRow><CopyButton text={`${t({ bn: 'ফ্ল্যাশকার্ড সেশন', en: 'Flashcard session' })}: ${t({ bn: 'জানা', en: 'known' })} ${known}, ${t({ bn: 'জানা নেই', en: 'unknown' })} ${unknown}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /></ButtonRow>
                </div>
              )}
            </>
          )}
        </>
      )}
      <p style={noteStyle}>{t({ bn: 'ভুল কার্ড সেশনের শেষে আবার আসে — না জানা কার্ড বারবার দেখা যায়। ডেকগুলো এই ডিভাইসের ব্রাউজারে থাকে; অন্য ডিভাইসে নিতে JSON এক্সপোর্ট করে আমদানি করুন।', en: 'Wrong cards recycle to the end of the session so you see them again. Decks live in this device browser — export as JSON to move them to another device.' })}</p>
    </section>
  );
}
