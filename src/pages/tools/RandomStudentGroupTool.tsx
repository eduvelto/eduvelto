// Eduvelto — Random Student Group Maker tool UI.
// Pure logic in src/lib/tools/randomGroups.ts (seeded shuffle).
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { makeRandomGroups, parseGroupNames } from '../../lib/tools/randomGroups';
import {
  CopyBtn, LoadExampleBtn, Tiles, ToolSection, errorStyle, formulaStyle,
  gridStyle, inputStyle, labelStyle, resultStyle,
} from './eduToolUi';

const EXAMPLE_NAMES = 'Rahim\nKarim\nSalma\nTanvir\nNusrat\nHasan\nMim\nArif\nRina\nSakib\nLima\nFahim';

export function RandomStudentGroupTool() {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [size, setSize] = useState('4');
  const [seed, setSeed] = useState(1);

  const result = useMemo(() => {
    if (text.trim() === '') return null;
    try { return makeRandomGroups(parseGroupNames(text), Number(size), seed); } catch { return null; }
  }, [text, size, seed]);

  const copyText = result
    ? result.map((g) => `Group ${g.groupNo}: ${g.members.join(', ')}`).join('\n')
    : '';

  return (
    <ToolSection id="random-groups-title" titleBn="এলোমেলো ছাত্র দল মেকার" titleEn="Random Student Group Maker"
      descBn="শিক্ষার্থীদের এলোমেলোভাবে দলে ভাগ করুন। সব কাজ আপনার ডিভাইসেই হয়।"
      descEn="Split students into random groups. Everything happens on your device.">
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="groups-names">{t({ bn: 'শিক্ষার্থীর নাম (প্রতি লাইনে একজন)', en: 'Student names (one per line)' })}</label>
          <textarea id="groups-names" style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} value={text}
            onChange={(e) => setText(e.target.value)} placeholder={EXAMPLE_NAMES} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="groups-size">{t({ bn: 'প্রতি দলে কতজন (২–২০)', en: 'Students per group (2–20)' })}</label>
          <input id="groups-size" style={inputStyle} type="number" min="2" max="20" value={size} onChange={(e) => setSize(e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <LoadExampleBtn onLoad={() => setText(EXAMPLE_NAMES)} />
        <button type="button" className="ev-btn ev-btn-primary" style={{ minHeight: 36 }}
          onClick={() => setSeed(Math.floor(Math.random() * 2 ** 31))}>
          {t({ bn: 'আবার এলোমেলো করুন', en: 'Shuffle again' })}
        </button>
      </div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}><strong>{t({ bn: 'দল তৈরি হয়েছে', en: 'Groups are ready' })}</strong></p>
          <Tiles items={[
            { label: t({ bn: 'দলের সংখ্যা', en: 'Groups' }), value: String(result.length) },
            { label: t({ bn: 'প্রতি দলে', en: 'Per group' }), value: size },
            { label: t({ bn: 'মোট শিক্ষার্থী', en: 'Total students' }), value: String(result.reduce((s, g) => s + g.members.length, 0)) },
          ]} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 12 }}>
            {result.map((g) => (
              <div key={g.groupNo} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)' }}>
                <p style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--heading)' }}>{t({ bn: 'দল', en: 'Group' })} {g.groupNo}</p>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
                  {g.members.map((m) => (<li key={m}>{m}</li>))}
                </ul>
              </div>
            ))}
          </div>
          <p style={formulaStyle}>{t({ bn: 'নামগুলো এলোমেলোভাবে সাজিয়ে প্রতি দলে ভাগ করা হয়েছে।', en: 'Names were shuffled randomly and then split into groups.' })}</p>
          <div style={{ marginTop: 12 }}><CopyBtn text={copyText} labelBn="দল কপি করুন" labelEn="Copy groups" /></div>
        </div>
      ) : text.trim() !== '' ? (
        <p style={errorStyle} role="alert">{t({ bn: 'কমপক্ষে ২ জন শিক্ষার্থী দিন এবং দলের আকার ২–২০ রাখুন।', en: 'Enter at least 2 students and keep group size between 2 and 20.' })}</p>
      ) : null}
    </ToolSection>
  );
}
