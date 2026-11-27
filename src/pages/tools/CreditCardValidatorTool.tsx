// Eduvelto — Credit Card Validator tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { validateCardNumber, maskCardNumber } from '../../lib/tools/cardValidator';


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

export function CreditCardValidatorTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const result = useMemo(() => {
    if (input.trim() === '') return { ok: false, error: '', data: null as ReturnType<typeof validateCardNumber> | null };
    try {
      return { ok: true, error: '', data: validateCardNumber(input) };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : '', data: null };
    }
  }, [input]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="ক্রেডিট কার্ড যাচাইকারী" titleEn="Credit Card Validator" descBn="Luhn পদ্ধতিতে কার্ড নম্বরের গঠন ঠিক আছে কি না যাচাই করুন — শুধু পরীক্ষার জন্য।" descEn="Check whether a card number is structurally valid using the Luhn method — for testing only." chipBn="শুধু গঠন যাচাই — আসল কার্ড নয়" chipEn="Structure check only — not a real card check" />
      <div>
        <label style={labelStyle} htmlFor="ccv-input">{t({ bn: 'কার্ড নম্বর (শুধু পরীক্ষার নম্বর ব্যবহার করুন)', en: 'Card number (use a test number only)' })}</label>
        <input id="ccv-input" style={shortInputStyle} inputMode="numeric" value={input} onChange={(e) => setInput(e.target.value)} placeholder="4242 4242 4242 4242" autoComplete="off" />
      </div>
      <p style={noteStyle}>{t({ bn: 'সতর্কতা: আসল কার্ড নম্বর কখনো এখানে লিখবেন না। নম্বরটি আপনার ডিভাইস ছাড়া কোথাও পাঠানো হয় না, তবুও শুধু পরীক্ষার নম্বর ব্যবহার করুন — যেমন 4242 4242 4242 4242।', en: 'Warning: never enter a real card number here. The number never leaves your device, but use a test number only — for example 4242 4242 4242 4242.' })}</p>
      {result.error ? <div style={errorStyle} role="alert">{result.error}</div> : null}
      {result.data ? (
        <>
          <div style={{ ...resultStyle, borderLeft: `6px solid ${result.data.luhnValid ? '#16a34a' : '#dc2626'}` }} role="status">
            <div style={{ fontSize: 20, fontWeight: 700 }}>
              {result.data.luhnValid
                ? t({ bn: 'গঠন ঠিক আছে (Luhn যাচাই পাস)', en: 'Structurally valid (Luhn check passed)' })
                : t({ bn: 'গঠন ঠিক নেই (Luhn যাচাই ফেল)', en: 'Structurally invalid (Luhn check failed)' })}
            </div>
            <div style={{ marginTop: 6, fontSize: 15 }}>{maskCardNumber(result.data.digits)}</div>
          </div>
          <Tiles items={[
            { labelBn: 'ব্র্যান্ড', labelEn: 'Brand', value: result.data.brand },
            { labelBn: 'সংখ্যার দৈর্ঘ্য', labelEn: 'Length', value: String(result.data.length) },
            { labelBn: 'Luhn', labelEn: 'Luhn', value: result.data.luhnValid ? t({ bn: 'পাস', en: 'Pass' }) : t({ bn: 'ফেল', en: 'Fail' }) },
          ]} />
        </>
      ) : null}
      <ButtonRow>
        <ExampleButton onLoad={() => setInput('4242 4242 4242 4242')} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      <p style={noteStyle}>{t({ bn: 'Luhn যাচাই শুধু সংখ্যার গঠন দেখে — এটি প্রমাণ করে না যে কার্ডটি আসল, চালু, বা কারো।', en: 'The Luhn check only looks at the number structure — it does not prove a card is real, active, or belongs to anyone.' })}</p>
    </section>
  );
}
