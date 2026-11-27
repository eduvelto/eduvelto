// Eduvelto — World Clock tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: formatLiveClock() + WORLD_CLOCK_PRESETS in src/lib/tools/worldClock.ts; zones from timeZones.ts (Intl API, no network). 100% in-browser; nothing is uploaded.
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {ToolHero, inputStyle, cardStyle, noteStyle } from './toolUi';
import { COMMON_TIME_ZONES } from '../../lib/tools/timeZones';
import { formatLiveClock, WORLD_CLOCK_PRESETS } from '../../lib/tools/worldClock';






export function WorldClockTool() {
  const { t, lang } = useLanguage();
  const [zones, setZones] = useState<string[]>(() => WORLD_CLOCK_PRESETS.slice(0, 8).map((z) => z.zone));
  const [hour12, setHour12] = useState(false);
  const [addZone, setAddZone] = useState('Europe/London');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!document.hidden) setNow(new Date());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const zoneName = (zone: string): string => {
    const found = COMMON_TIME_ZONES.find((z) => z.zone === zone) ?? WORLD_CLOCK_PRESETS.find((z) => z.zone === zone);
    if (!found) return zone;
    return lang === 'bn' ? found.nameBn : found.nameEn;
  };

  const readings = useMemo(() => zones.map((z) => ({ zone: z, ...formatLiveClock(now, z, hour12) })), [zones, now, hour12]);
  const available = COMMON_TIME_ZONES.filter((z) => !zones.includes(z.zone));

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="বিশ্ব ঘড়ি" titleEn="World Clock" descBn="ঢাকাসহ বিশ্বের শহরগুলোতে এখন কয়টা বাজে — সরাসরি টিকটিক ঘড়ি।" descEn="What time is it now in Dhaka and cities around the world — live ticking clocks." chipBn="প্রতি সেকেন্ডে আপডেট • DST নিজে থেকে হিসাব হয়" chipEn="Updates every second • DST handled automatically" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <button type="button" style={{ minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)', background: !hour12 ? 'var(--teal)' : 'var(--surface)', color: !hour12 ? '#fff' : 'var(--heading)', cursor: 'pointer' }} onClick={() => setHour12(false)}>24h</button>
        <button type="button" style={{ minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)', background: hour12 ? 'var(--teal)' : 'var(--surface)', color: hour12 ? '#fff' : 'var(--heading)', cursor: 'pointer' }} onClick={() => setHour12(true)}>12h</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {readings.map((r) => (
          <div key={r.zone} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '14px 12px', background: 'var(--card)' }}>
            <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700, color: 'var(--heading)' }}>
              {r.isDaytime ? '☀️ ' : '🌙 '}{zoneName(r.zone)}
            </p>
            <p style={{ margin: '0 0 2px', fontSize: '1.6rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{r.time}</p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>{r.date} • {r.offset}</p>
            {zones.length > 1 ? (
              <button type="button" style={{ marginTop: 8, minHeight: 32, padding: '0 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', cursor: 'pointer', fontSize: 13 }} onClick={() => setZones((prev) => prev.filter((z) => z !== r.zone))}>
                {t({ bn: 'সরান', en: 'Remove' })}
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {available.length > 0 ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <select style={{ ...inputStyle, maxWidth: 260 }} value={addZone} onChange={(e) => setAddZone(e.target.value)} aria-label={t({ bn: 'অঞ্চল বাছুন', en: 'Choose a time zone' })}>
            {available.map((z) => (<option key={z.zone} value={z.zone}>{lang === 'bn' ? z.nameBn : z.nameEn}</option>))}
          </select>
          <button type="button" style={{ minHeight: 44, padding: '0 18px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 600, cursor: 'pointer' }} onClick={() => setZones((prev) => [...prev, addZone])}>
            {t({ bn: 'ঘড়ি যোগ করুন', en: 'Add clock' })}
          </button>
        </div>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'সময় আপনার ডিভাইসের ঘড়ি থেকে নেওয়া হয়; অঞ্চলের ব্যবধান ও দিবালোক সাশ্রয়ী সময় (DST) ব্রাউজারের Intl হিসাবেই ধরা হয় — লন্ডন শীতে GMT, গ্রীষ্মে BST (+১)। ট্যাব লুকানো থাকলে ঘড়ি থেমে যায়, ফিরে এলে আবার সঠিক সময় দেখায়।', en: 'Times come from your device clock; offsets and daylight saving are handled by the browser Intl API — London is GMT in winter and BST (+1) in summer. The clocks pause while the tab is hidden and resume at the correct time.' })}</p>
    </section>
  );
}
