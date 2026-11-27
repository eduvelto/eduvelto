// Eduvelto — UUID & Hash Generator tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, inputStyle, labelStyle, cardStyle, buttonStyle, noteStyle } from './toolUi';
import { generateUuid, isValidUuid, hashText, type ShaAlgorithm } from '../../lib/tools/hashTools';


const selectStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 15,
  boxSizing: 'border-box',
  background: 'var(--surface)',
  color: 'var(--heading)',
};

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};

const errorStyle: CSSProperties = {
  marginTop: 12,
  padding: '10px 12px',
  borderRadius: 8,
  background: '#fef2f2',
  color: '#991b1b',
  fontSize: 14,
};

export function UuidHashGeneratorTool() {
  const { t } = useLanguage();
  const [uuids, setUuids] = useState<string[]>([]);
  const [hashInput, setHashInput] = useState('');
  const [algo, setAlgo] = useState<'MD5' | ShaAlgorithm>('SHA-256');
  const [hash, setHash] = useState('');
  const [hashError, setHashError] = useState('');
  const makeUuid = () => setUuids((prev) => [generateUuid(), ...prev].slice(0, 5));
  const computeHash = async () => {
    try {
      setHash(await hashText(hashInput, algo));
      setHashError('');
    } catch (err) {
      setHashError(err instanceof Error ? err.message : '');
      setHash('');
    }
  };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="ইউইউআইডি ও হ্যাশ জেনারেটর" titleEn="UUID & Hash Generator" descBn="UUID তৈরি করুন ও MD5 বা SHA-256 হ্যাশ হিসাব করুন।" descEn="Generate UUIDs and calculate MD5 or SHA-256 hashes." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 17, margin: '0 0 10px' }}>{t({ bn: 'UUID তৈরি করুন', en: 'Generate UUIDs' })}</h3>
        <ButtonRow>
          <button type="button" style={buttonStyle} onClick={makeUuid}>{t({ bn: 'নতুন UUID', en: 'New UUID' })}</button>
        </ButtonRow>
        {uuids.length > 0 ? (
          <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none' }}>
            {uuids.map((id) => (
              <li key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8, padding: '10px 12px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10 }}>
                <code style={{ wordBreak: 'break-all' }}>{id}</code>
                <CopyButton text={id} />
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'উপরে চাপ দিলে UUID তৈরি হবে।', en: 'Tap above to generate a UUID.' })}</p>
        )}
      </div>
      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
        <h3 style={{ fontSize: 17, margin: '0 0 10px' }}>{t({ bn: 'হ্যাশ হিসাব করুন', en: 'Calculate a hash' })}</h3>
        <label style={labelStyle} htmlFor="uh-input">{t({ bn: 'লেখা', en: 'Text' })}</label>
        <textarea id="uh-input" style={inputStyle} value={hashInput} onChange={(e) => setHashInput(e.target.value)} placeholder="hello" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, alignItems: 'center' }}>
          <select style={{ ...selectStyle, width: 'auto', minHeight: 44 }} value={algo} onChange={(e) => setAlgo(e.target.value as 'MD5' | ShaAlgorithm)} aria-label={t({ bn: 'অ্যালগরিদম', en: 'Algorithm' })}>
            <option value="MD5">MD5</option>
            <option value="SHA-1">SHA-1</option>
            <option value="SHA-256">SHA-256</option>
            <option value="SHA-384">SHA-384</option>
            <option value="SHA-512">SHA-512</option>
          </select>
          <button type="button" style={buttonStyle} onClick={() => void computeHash()} disabled={hashInput === ''}>{t({ bn: 'হ্যাশ বের করুন', en: 'Calculate hash' })}</button>
          {hash ? <CopyButton text={hash} /> : null}
        </div>
        {hashError ? <div style={errorStyle} role="alert">{hashError}</div> : null}
        {hash ? <div style={{ ...resultStyle, fontFamily: 'monospace', wordBreak: 'break-all' }}>{hash}</div> : null}
        <p style={noteStyle}>{t({ bn: 'MD5 ও SHA হ্যাশ একমুখী — হ্যাশ থেকে মূল লেখা ফেরানো যায় না। MD5 নিরাপত্তার জন্য দুর্বল, শুধু চেকসাম হিসেবে ব্যবহার করুন।', en: 'MD5 and SHA hashes are one-way — the original text cannot be recovered from a hash. MD5 is weak for security; use it only as a checksum.' })}</p>
      </div>
      <p style={noteStyle}>{t({ bn: 'UUID যাচাই: ', en: 'UUID check: ' })}{uuids.length > 0 ? String(isValidUuid(uuids[0])) : '—'}</p>
    </section>
  );
}
