// Eduvelto — Country Calling Codes tool UI (27 Nov 2026).
// Searchable directory of verified ITU country dialing codes.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, cardStyle, noteStyle, labelStyle, shortInputStyle } from './toolUi';
import { COUNTRY_CODES, findCountryCodes } from '../../lib/tools/countryCodes';

const rowStyle: CSSProperties = { display: 'flex', gap: 12, alignItems: 'baseline', padding: '9px 0', borderBottom: '1px solid var(--line)' };

export function CountryCallingCodesTool() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const results = useMemo(() => findCountryCodes(query), [query]);

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="দেশের কলিং কোড" titleEn="Country Calling Codes" descBn="যেকোনো দেশের আন্তর্জাতিক ডায়ালিং কোড খুঁজুন — বাংলাদেশ +880, ভারত +91, আমেরিকা +1…" descEn="Find any country's international dialing code — Bangladesh +880, India +91, USA +1…" chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle} htmlFor="ccc-search">{t({ bn: 'দেশ বা কোড খুঁজুন', en: 'Search a country or code' })}</label>
        <input id="ccc-search" style={shortInputStyle} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Bangladesh, 880, USA…" />
      </div>
      <p style={{ fontSize: 14, color: 'var(--muted)' }}>{t({ bn: `${results.length}টি দেশের কোড দেখানো হচ্ছে`, en: `Showing codes for ${results.length} countries` })}</p>
      <div>
        {results.map((c) => (
          <div key={`${c.nameEn}-${c.code}`} style={rowStyle}>
            <span style={{ fontWeight: 800, minWidth: 64, color: 'var(--teal-deep)' }}>{c.code}</span>
            <span style={{ flex: 1, fontSize: 15 }}>{c.nameEn}</span>
            <CopyButton text={c.code} labelBn="কোড কপি" labelEn="Copy code" />
          </div>
        ))}
      </div>
      {results.length === 0 ? (
        <p style={{ marginTop: 14, fontSize: 14 }}>{t({ bn: 'কিছু পাওয়া যায়নি — অন্য নাম বা কোড দিয়ে চেষ্টা করুন।', en: 'Nothing found — try another name or code.' })}</p>
      ) : null}
      <p style={noteStyle}>{t({ bn: `এই তালিকায় ${COUNTRY_CODES.length}টি দেশের কোড আছে — শুধু যাচাই করা ITU কোড রাখা হয়েছে। যেসব দেশের কোড নিশ্চিত করা যায়নি, সেগুলো তালিকায় রাখা হয়নি; ভুল কোড দেওয়ার চেয়ে বাদ রাখাই ভালো। আন্তর্জাতিক কল করতে কোডের আগে + চিহ্ন দিন।`, en: `This list covers ${COUNTRY_CODES.length} countries — only verified ITU codes are included. Countries whose code could not be verified were left out rather than guessed. Dial + before the code for international calls.` })}</p>
    </section>
  );
}
