// Eduvelto — Password Strength Checker tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: passwordStrength() in src/lib/tools/passwordRandom.ts (zxcvbn-style estimate WITHOUT the zxcvbn dependency). 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {ToolHero, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { passwordStrength } from '../../lib/tools/passwordRandom';

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};






const SCORE_COLORS = ['#b3261e', '#d97706', '#ca8a04', '#65a30d', '#15803d'];
const SCORE_LABEL_BN = ['খুব দুর্বল', 'দুর্বল', 'মাঝারি', 'ভালো', 'শক্তিশালী'];
const SCORE_LABEL_EN = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];

export function PasswordStrengthTool() {
  const { t, lang } = useLanguage();
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const result = useMemo(() => passwordStrength(pw), [pw]);

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="পাসওয়ার্ড শক্তি পরীক্ষক" titleEn="Password Strength Checker" descBn="পাসওয়ার্ড কতটা শক্তিশালী তা যাচাই করুন — কোথাও পাঠানো হয় না।" descEn="Check how strong a password is — it is never sent anywhere." chipBn="পাসওয়ার্ড সংরক্ষণ করা হয় না, লগ করা হয় না" chipEn="The password is never stored or logged" />
      <div>
        <label style={labelStyle} htmlFor="ps-input">{t({ bn: 'পাসওয়ার্ড', en: 'Password' })}</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input id="ps-input" style={{ ...inputStyle, flex: 1 }} type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} placeholder={t({ bn: 'এখানে পাসওয়ার্ড লিখুন', en: 'Type a password here' })} autoComplete="off" />
          <button type="button" style={{ minHeight: 44, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', cursor: 'pointer' }} onClick={() => setShow((s) => !s)}>
            {show ? t({ bn: 'লুকান', en: 'Hide' }) : t({ bn: 'দেখান', en: 'Show' })}
          </button>
        </div>
      </div>
      {pw === '' ? (
        <p style={noteStyle}>{t({ bn: 'শক্তি দেখতে পাসওয়ার্ড লিখুন।', en: 'Type a password to see its strength.' })}</p>
      ) : (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'শক্তি', en: 'Strength' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: SCORE_COLORS[result.score] }}>
              {lang === 'bn' ? SCORE_LABEL_BN[result.score] : SCORE_LABEL_EN[result.score]} ({result.score}/4)
            </p>
            <div style={{ height: 10, borderRadius: 999, background: 'var(--line)', overflow: 'hidden', marginTop: 10 }}>
              <div style={{ width: `${((result.score + 1) / 5) * 100}%`, height: '100%', background: SCORE_COLORS[result.score], borderRadius: 999 }} />
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 15 }}>{t({ bn: `ভাঙতে সময় লাগবে প্রায় ${result.crackTimeText} (অফলাইন আক্রমণে, প্রতি সেকেন্ডে ১০ বিলিয়ন অনুমান ধরে; অনলাইন আক্রমণ অনেক ধীর)। এনট্রপি: ${result.entropyBits} বিট।`, en: `About ${result.crackTimeText} to crack (offline attack at 10 billion guesses per second; online attacks are far slower). Entropy: ${result.entropyBits} bits.` })}</p>
          </div>
          {result.issues.length > 0 ? (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>{t({ bn: 'সমস্যা', en: 'Issues' })}</p>
              {result.issues.map((issue, i) => (<p key={i} style={{ margin: '4px 0', fontSize: 14 }}>• {issue}</p>))}
            </div>
          ) : null}
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>{t({ bn: 'আরও শক্ত করতে', en: 'To make it stronger' })}</p>
            {result.suggestions.map((s, i) => (<p key={i} style={{ margin: '4px 0', fontSize: 14 }}>• {s}</p>))}
          </div>
        </>
      )}
      <p style={noteStyle}>{t({ bn: 'এটি একটি অনুমান, নিশ্চয়তা নয় — “নিরাপদ” বলে কোনো পাসওয়ার্ডের গ্যারান্টি দেওয়া হয় না। শক্তিশালী হলেও প্রতিটি সাইটে আলাদা পাসওয়ার্ড ব্যবহার করুন, আর পাসওয়ার্ড ম্যানেজার ব্যবহার করাই ভালো।', en: 'This is an estimate, not a guarantee — no password is promised “safe”. Even a strong password should be different on every site; a password manager is the better habit.' })}</p>
    </section>
  );
}
