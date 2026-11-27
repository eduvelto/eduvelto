// Eduvelto — Data Storage Converter (Converters batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle, buttonStyle } from './toolUi';
import { convertDataStorage, DATA_STORAGE_UNITS, formatConverted } from '../../lib/tools/converterTools';

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

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function DataStorageConverterTool() {
  const { t } = useLanguage();
  const [value, setValue] = useState('1');
  const [from, setFrom] = useState('gigabyte');
  const [to, setTo] = useState('megabyte');

  const v = parseNum(value);
  const result = useMemo(() => (v !== null ? convertDataStorage(v, from, to) : null), [v, from, to]);
  const fromLabel = DATA_STORAGE_UNITS.find((u) => u.id === from);
  const toLabel = DATA_STORAGE_UNITS.find((u) => u.id === to);
  const tileItems = useMemo(() => {
    if (v === null) return [];
    return DATA_STORAGE_UNITS.filter((u) => u.id !== from && u.id !== to).slice(0, 3).map((u) => {
      const cv = convertDataStorage(v, from, u.id);
      return { labelBn: u.bn, labelEn: u.en, value: cv === null ? '—' : formatConverted(cv) };
    });
  }, [v, from, to]);
  const swap = () => { setFrom(to); setTo(from); };
  const clear = () => setValue('');
  const loadExample = () => { setValue('1'); setFrom('gigabyte'); setTo('megabyte'); };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="ডেটা স্টোরেজ কনভার্টার" titleEn="Data Storage Converter" descBn="বিট, বাইট, KB, MB, GB, TB, PB ও KiB/MiB/GiB-এর মধ্যে বদলান।" descEn="Convert between bits, bytes, KB, MB, GB, TB, PB and KiB/MiB/GiB." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="data-storage-converter-value">{t({ bn: 'মান', en: 'Value' })}</label>
          <input id="data-storage-converter-value" style={shortInputStyle} type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="1" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="data-storage-converter-from">{t({ bn: 'থেকে', en: 'From' })}</label>
          <select id="data-storage-converter-from" style={shortInputStyle} value={from} onChange={(e) => setFrom(e.target.value)}>
            {DATA_STORAGE_UNITS.map((u) => (<option key={u.id} value={u.id}>{t({ bn: u.bn, en: u.en })}</option>))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="data-storage-converter-to">{t({ bn: 'এতে', en: 'To' })}</label>
          <select id="data-storage-converter-to" style={shortInputStyle} value={to} onChange={(e) => setTo(e.target.value)}>
            {DATA_STORAGE_UNITS.map((u) => (<option key={u.id} value={u.id}>{t({ bn: u.bn, en: u.en })}</option>))}
          </select>
        </div>
      </div>

      <ButtonRow>
        <button type="button" style={buttonStyle} onClick={swap}>{t({ bn: '⇄ অদলবদল করুন', en: '⇄ Swap' })}</button>
        <ClearButton onClear={clear} />
        <ExampleButton onLoad={loadExample} />
      </ButtonRow>
      {result !== null && v !== null ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: `${formatConverted(v)} ${fromLabel ? fromLabel.bn : ''} =`, en: `${formatConverted(v)} ${fromLabel ? fromLabel.en : ''} =` })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{formatConverted(result)} {toLabel ? t({ bn: toLabel.bn, en: toLabel.en }) : ''}</p>
          </div>
          <Tiles items={tileItems} />
          <ButtonRow><CopyButton text={`${formatConverted(v)} ${fromLabel ? fromLabel.en : ''} = ${formatConverted(result)} ${toLabel ? toLabel.en : ''}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক মান দিন — সংখ্যা লিখুন এবং একক বেছে নিন।', en: 'Enter a valid number and pick both units.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'KB/MB/GB দশমিক হিসাব (১ KB = ১০০০ বাইট); KiB/MiB/GiB বাইনারি হিসাব (১ KiB = ১০২৪ বাইট) — দুটোই দেওয়া আছে যাতে পার্থক্যটা দেখা যায়।', en: 'KB/MB/GB are decimal (1 KB = 1000 bytes); KiB/MiB/GiB are binary (1 KiB = 1024 bytes) — both are offered so the difference is visible.' })}</p>
    </section>
  );
}
