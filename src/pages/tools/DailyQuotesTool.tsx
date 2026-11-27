// Eduvelto — Daily Quotes & Wishes tool UI (27 Nov 2026).
// Today's quote rotates by date from a static list of real quotes
// with correct attribution; "another one" shuffles.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, cardStyle, noteStyle, buttonStyle } from './toolUi';
import { QUOTES, quoteOfTheDay, randomQuote } from '../../lib/tools/quotesData';

const quoteStyle: CSSProperties = { marginTop: 14, padding: '22px 18px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)', textAlign: 'center' };

export function DailyQuotesTool() {
  const { t } = useLanguage();
  const today = useMemo(() => quoteOfTheDay(new Date()), []);
  const [current, setCurrent] = useState(today);
  const [currentIndex, setCurrentIndex] = useState(() => QUOTES.indexOf(today));
  const [showBnOnly, setShowBnOnly] = useState(false);

  const shuffle = () => {
    const { quote, index } = randomQuote(currentIndex);
    setCurrent(quote);
    setCurrentIndex(index);
  };

  const isToday = currentIndex === QUOTES.indexOf(today);

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="আজকের উক্তি ও শুভেচ্ছা" titleEn="Daily Quotes & Wishes" descBn="প্রতিদিন একটি নতুন উক্তি — বাংলা ও ইংরেজি, সঠিক লেখকের নামসহ।" descEn="A new quote every day — Bangla and English, with correct attribution." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
        <button type="button" style={buttonStyle} onClick={() => { setCurrent(today); setCurrentIndex(QUOTES.indexOf(today)); }}>{t({ bn: 'আজকের উক্তি', en: "Today's quote" })}</button>
        <button type="button" style={buttonStyle} onClick={shuffle}>{t({ bn: 'আরেকটি দেখুন', en: 'Another one' })}</button>
        <button type="button" style={buttonStyle} onClick={() => setShowBnOnly((v) => !v)}>{showBnOnly ? t({ bn: 'সব ভাষা দেখান', en: 'Show all languages' }) : t({ bn: 'শুধু বাংলা দেখান', en: 'Bangla only' })}</button>
      </div>
      <div style={quoteStyle} role="status">
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
          {isToday ? t({ bn: 'আজকের উক্তি', en: "Today's quote" }) : t({ bn: 'উক্তি', en: 'Quote' })}
        </p>
        <p style={{ margin: 0, fontSize: 20, lineHeight: 1.7, fontFamily: 'var(--font-head)' }}>“{current.text}”</p>
        <p style={{ margin: '12px 0 0', fontSize: 15, fontWeight: 700, color: 'var(--teal-deep)' }}>— {current.author}</p>
        <ButtonRow>
          <CopyButton text={`“${current.text}” — ${current.author}`} labelBn="উক্তি কপি করুন" labelEn="Copy quote" />
        </ButtonRow>
      </div>
      <h3 style={{ margin: '20px 0 6px', fontSize: 16 }}>{t({ bn: 'সব উক্তি', en: 'All quotes' })}</h3>
      <div>
        {(showBnOnly ? QUOTES.filter((q) => q.lang === 'bn') : QUOTES).map((q, i) => (
          <div key={`${q.text}-${i}`} style={{ padding: '9px 0', borderBottom: '1px solid var(--line)', fontSize: 14, lineHeight: 1.6 }}>
            “{q.text}” <span style={{ color: 'var(--muted)' }}>— {q.author}</span>
          </div>
        ))}
      </div>
      <p style={noteStyle}>{t({ bn: 'এখানে শুধু সেসব উক্তি রাখা হয়েছে যেগুলোর কথা ও লেখক সম্পর্কে নিশ্চিত হওয়া গেছে; সন্দেহজনক উক্তি বাদ দেওয়া হয়েছে। তারিখের ভিত্তিতে আজকের উক্তি বদলায়।', en: 'Only quotes whose wording and author could be verified are listed here; doubtful ones were left out. Today\u2019s quote changes with the date.' })}</p>
    </section>
  );
}
