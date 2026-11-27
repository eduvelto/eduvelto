// Eduvelto — Random Name Picker tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: makeFairQueue() + shuffleFair() in src/lib/tools/passwordRandom.ts (crypto-based shuffle; fair rotation with no repeats). 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {ToolHero, CopyButton, ButtonRow, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { makeFairQueue, shuffleFair } from '../../lib/tools/passwordRandom';

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





interface RosterEntry { roll: string; name: string; absent: boolean; }

function parseRoster(text: string): RosterEntry[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(\d+)\s*[-.)]?\s+(.+)$/);
      if (m) return { roll: m[1], name: m[2].trim(), absent: false };
      return { roll: '', name: line, absent: false };
    });
}

const EXAMPLE = '1 Rahim\n2 Karim\n3 Salma\n4 Arif\n5 Nusrat';

export function RandomNamePickerTool() {
  const { t } = useLanguage();
  const [rosterText, setRosterText] = useState(EXAMPLE);
  const [absent, setAbsent] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const roster = useMemo(() => parseRoster(rosterText), [rosterText]);
  const present = roster.filter((r) => !absent.has(r.name));
  const display = (name: string): string => {
    const entry = roster.find((r) => r.name === name);
    return entry && entry.roll ? `${entry.roll} — ${entry.name}` : name;
  };

  function ensureQueue(): string[] {
    if (queue.length > 0) return queue;
    const names = present.map((r) => r.name);
    if (names.length === 0) return [];
    const q = makeFairQueue(names);
    setQueue(q);
    return q;
  }

  function pick(): void {
    setError(null);
    if (present.length === 0) {
      setError(t({ bn: 'প্রথমে নামের তালিকা দিন ও অনুপস্থিতদের বাদ দিন।', en: 'First add a list of names and mark who is absent.' }));
      return;
    }
    let q = queue;
    if (q.length === 0) {
      q = ensureQueue();
      if (q.length === 0) return;
    }
    const [next, ...rest] = q;
    setQueue(rest);
    setPicked(next);
    setHistory((prev) => [next, ...prev].slice(0, 20));
  }

  function shuffleAll(): void {
    const names = present.map((r) => r.name);
    if (names.length === 0) return;
    setQueue(shuffleFair(names));
    setPicked(null);
  }

  function toggleAbsent(name: string): void {
    setAbsent((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    setQueue((q) => q.filter((n) => n !== name));
  }

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="এলোমেলো নাম বাছাই" titleEn="Random Name Picker" descBn="ক্লাসে এলোমেলোভাবে একজনকে বাছুন — সবার পালা শেষ না হওয়া পর্যন্ত কেউ দুবার আসে না।" descEn="Pick a random name in class — nobody repeats until everyone has had a turn." chipBn="ন্যায্য ঘূর্ণন • অনুপস্থিত বাদ দেওয়া যায়" chipEn="Fair rotation • absent students can be excluded" />
      <div>
        <label style={labelStyle} htmlFor="rnp-roster">{t({ bn: 'নামের তালিকা (প্রতি লাইনে একজন; রোল নম্বর থাকলে “১ রহিম” লিখুন)', en: 'Name list (one per line; with roll numbers write “1 Rahim”)' })}</label>
        <textarea id="rnp-roster" style={{ ...inputStyle, minHeight: 120 }} value={rosterText} onChange={(e) => { setRosterText(e.target.value); setQueue([]); setPicked(null); }} placeholder={EXAMPLE} />
      </div>
      {roster.length > 0 ? (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px' }}>{t({ bn: 'অনুপস্থিত চিহ্নিত করুন (নামে চাপ দিন):', en: 'Mark absent (tap a name):' })}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {roster.map((r) => {
              const isAbsent = absent.has(r.name);
              return (
                <button key={r.name} type="button" onClick={() => toggleAbsent(r.name)} style={{ minHeight: 36, padding: '0 12px', borderRadius: 999, border: '1px solid var(--line)', background: isAbsent ? '#f1f5f9' : 'var(--teal)', color: isAbsent ? 'var(--muted)' : '#fff', textDecoration: isAbsent ? 'line-through' : 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                  {r.roll ? `${r.roll} — ` : ''}{r.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <ButtonRow>
        <button type="button" style={{ minHeight: 44, padding: '0 22px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 700, cursor: 'pointer' }} onClick={pick}>
          {t({ bn: 'নাম বাছুন', en: 'Pick a name' })}
        </button>
        <button type="button" style={{ minHeight: 44, padding: '0 18px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', fontWeight: 600, cursor: 'pointer' }} onClick={shuffleAll} disabled={present.length === 0}>
          {t({ bn: 'নতুন করে এলোমেলো করুন', en: 'Reshuffle' })}
        </button>
      </ButtonRow>
      {error ? <p style={errorStyle} role="alert">{error}</p> : null}
      {picked ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'বাছা হয়েছে', en: 'Picked' })}</p>
          <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{display(picked)}</p>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{t({ bn: `বাকি আছে ${queue.length} জন — সবার পালা শেষ হলে আবার নতুন ঘূর্ণন শুরু হবে।`, en: `${queue.length} left — a new round starts when everyone has had a turn.` })}</p>
          <ButtonRow><CopyButton text={display(picked)} labelBn="নাম কপি করুন" labelEn="Copy name" /></ButtonRow>
        </div>
      ) : null}
      {history.length > 0 ? (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px' }}>{t({ bn: 'আগের বাছাই:', en: 'Previously picked:' })}</p>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>{history.map(display).join(' • ')}</p>
        </div>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'স্পেসবার চাপলেও নাম বাছা যায় না — বোতামে চাপ দিন। বাংলা নাম ইউনিকোড-নিরাপদভাবে বাছা হয়; রোল নম্বর থাকলে নামের সঙ্গে রোলও দেখানো হয়।', en: 'Names are shuffled Unicode-safely, so Bangla names never break. Roll numbers are shown with the name when you include them.' })}</p>
    </section>
  );
}
