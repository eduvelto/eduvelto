// Eduvelto — Password Generator tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: generatePassword() + passwordStrength() in src/lib/tools/passwordRandom.ts (WebCrypto only — never Math.random). 100% in-browser; nothing is uploaded.
import {useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {ToolHero, CopyButton, ButtonRow, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { generatePassword, passwordStrength } from '../../lib/tools/passwordRandom';

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





export function PasswordGeneratorTool() {
  const { t } = useLanguage();
  const [length, setLength] = useState(16);
  const [lower, setLower] = useState(true);
  const [upper, setUpper] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function generate(): void {
    setError(null);
    try {
      const list: string[] = [];
      for (let i = 0; i < quantity; i += 1) {
        list.push(generatePassword({ length, lower, upper, digits, symbols, avoidAmbiguous }));
      }
      setPasswords(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate a password');
    }
  }

  const firstStrength = passwords.length > 0 ? passwordStrength(passwords[0]) : null;

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="পাসওয়ার্ড জেনারেটর" titleEn="Password Generator" descBn="শক্তিশালী পাসওয়ার্ড বানান — আপনার ডিভাইসের নিরাপদ র‍্যান্ডম জেনারেটর দিয়ে।" descEn="Create strong passwords — with your device's secure random generator." chipBn="কিছু পাঠানো বা সংরক্ষণ করা হয় না" chipEn="Nothing is sent or stored anywhere" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="pg-length">{t({ bn: `দৈর্ঘ্য: ${length} অক্ষর`, en: `Length: ${length} characters` })}</label>
          <input id="pg-length" style={{ width: '100%' }} type="range" min={8} max={64} value={length} onChange={(e) => setLength(Number(e.target.value))} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="pg-qty">{t({ bn: 'কয়টি বানাবেন (১–১০)', en: 'How many (1–10)' })}</label>
          <input id="pg-qty" style={inputStyle} type="number" min={1} max={10} value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
        {([
          ['lower', lower, setLower, 'ছোট হাতের অক্ষর (a–z)', 'Lowercase (a–z)'],
          ['upper', upper, setUpper, 'বড় হাতের অক্ষর (A–Z)', 'Uppercase (A–Z)'],
          ['digits', digits, setDigits, 'সংখ্যা (0–9)', 'Digits (0–9)'],
          ['symbols', symbols, setSymbols, 'চিহ্ন (!@#…)', 'Symbols (!@#…)'],
        ] as const).map(([id, value, setter, bn, en]) => (
          <label key={id} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 15 }}>
            <input type="checkbox" checked={value} onChange={(e) => setter(e.target.checked)} />
            {t({ bn, en })}
          </label>
        ))}
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 15 }}>
          <input type="checkbox" checked={avoidAmbiguous} onChange={(e) => setAvoidAmbiguous(e.target.checked)} />
          {t({ bn: 'দ্ব্যর্থক অক্ষর বাদ দিন (0 O 1 l I |)', en: 'Avoid ambiguous characters (0 O 1 l I |)' })}
        </label>
      </div>
      <ButtonRow>
        <button type="button" style={{ minHeight: 44, padding: '0 22px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 700, cursor: 'pointer' }} onClick={generate}>
          {t({ bn: 'পাসওয়ার্ড বানান', en: 'Generate password' })}
        </button>
        <button type="button" style={{ minHeight: 44, padding: '0 18px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setShow((s) => !s)} disabled={passwords.length === 0}>
          {show ? t({ bn: 'লুকান', en: 'Hide' }) : t({ bn: 'দেখান', en: 'Show' })}
        </button>
      </ButtonRow>
      {error ? <p style={errorStyle} role="alert">{error}</p> : null}
      {passwords.length > 0 ? (
        <>
          <div style={resultStyle} role="status">
            {passwords.map((pw, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                <code style={{ fontSize: 16, wordBreak: 'break-all', flex: 1 }}>{show ? pw : '•'.repeat(pw.length)}</code>
                <CopyButton text={pw} labelBn="কপি করুন" labelEn="Copy" />
              </div>
            ))}
            {firstStrength ? (
              <p style={{ margin: '8px 0 0', fontSize: 15 }}>
                {t({ bn: `শক্তি: ${firstStrength.label} — ভাঙতে সময় লাগবে প্রায় ${firstStrength.crackTimeText} (অফলাইন আক্রমণে, প্রতি সেকেন্ডে ১০ বিলিয়ন অনুমান ধরে)।`, en: `Strength: ${firstStrength.label} — about ${firstStrength.crackTimeText} to crack (offline attack, 10 billion guesses per second).` })}
              </p>
            ) : null}
          </div>
        </>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'পাসওয়ার্ড বানানো হয় crypto.getRandomValues দিয়ে — Math.random দিয়ে গোপন কিছু বানানো হয় না। চালু থাকা প্রতিটি অক্ষরের ধরন থেকে অন্তত একটি অক্ষর থাকবেই। প্রতিটি সাইটে আলাদা পাসওয়ার্ড ব্যবহার করুন।', en: 'Passwords are made with crypto.getRandomValues — never Math.random for secrets. Every enabled character set contributes at least one character. Use a different password for each site.' })}</p>
    </section>
  );
}
