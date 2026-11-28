// Eduvelto — Global Currency Converter tool UI (28 Nov 2026, global batch item 2).
//
// USER-ENTERED RATE ONLY (owner's binding FOREVER-AUTO rule): this tool
// fetches NO rates from any API — free or otherwise — and the UI never
// claims a fetched rate. The user types the rate (1 FROM = X TO),
// the tool multiplies. 154 ISO 4217 currencies.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Tiles, ToolSection, gridStyle, inputStyle, labelStyle, noteStyle, resultStyle } from './eduToolUi';
import { CURRENCIES, POPULAR_PAIRS, currencyByCode } from '../../lib/tools/currencies';

export function CurrencyConverterTool() {
  const { t } = useLanguage();
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('BDT');
  const [rate, setRate] = useState('');

  const fromInfo = currencyByCode(from);
  const toInfo = currencyByCode(to);
  const amountNum = Number(amount);
  const rateNum = Number(rate);
  const valid = Number.isFinite(amountNum) && amountNum >= 0 && Number.isFinite(rateNum) && rateNum > 0;
  const result = valid ? amountNum * rateNum : null;
  const reverseRate = valid ? 1 / rateNum : null;

  const formatted = useMemo(() => {
    if (result === null || !toInfo) return '';
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: toInfo.code }).format(result);
    } catch {
      return `${toInfo.symbol} ${result.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    }
  }, [result, toInfo]);

  function swap() {
    setFrom(to);
    setTo(from);
    if (reverseRate) setRate(String(Number(reverseRate.toFixed(6))));
  }

  return (
    <ToolSection id="currency-converter-title" titleBn="কারেন্সি কনভার্টার" titleEn="Currency Converter"
      descBn="আপনি রেট বসান, টুল হিসাব করে দেবে। ১৫৪টি মুদ্রা। কোনো রেট ইন্টারনেট থেকে আনা হয় না — সব হিসাব আপনার ব্রাউজারেই হয়।"
      descEn="You enter the rate, the tool converts. 154 currencies. No rate is fetched from the internet — everything is calculated in your browser.">
      <p style={noteStyle}>
        {t({
          bn: 'গুরুত্বপূর্ণ: এই টুল রেট ইন্টারনেট থেকে আনে না। আপনি নিজে রেট বসাবেন (যেমন ব্যাংক বা মানি এক্সচেঞ্জ থেকে জেনে) — টুল শুধু গুণ করে দেবে।',
          en: 'Important: this tool fetches no rates from the internet. You enter the rate yourself (for example, one you checked with your bank or money changer) — the tool only does the multiplication.',
        })}
      </p>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="cc-amount">{t({ bn: 'পরিমাণ', en: 'Amount' })}</label>
          <input id="cc-amount" style={inputStyle} type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="cc-from">{t({ bn: 'থেকে (মুদ্রা)', en: 'From (currency)' })}</label>
          <select id="cc-from" style={inputStyle} value={from} onChange={(e) => setFrom(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code} — {c.name} ({c.symbol})</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="cc-to">{t({ bn: 'এতে (মুদ্রা)', en: 'To (currency)' })}</label>
          <select id="cc-to" style={inputStyle} value={to} onChange={(e) => setTo(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code} — {c.name} ({c.symbol})</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="cc-rate">
            {t({ bn: `রেট — ১ ${from} = কত ${to}? (আপনি বসান)`, en: `Rate — 1 ${from} = how many ${to}? (you enter it)` })}
          </label>
          <input id="cc-rate" style={inputStyle} type="number" min="0" step="any" value={rate}
            placeholder={t({ bn: 'যেমন ১২১.৫০', en: 'e.g. 121.50' })}
            onChange={(e) => setRate(e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 44 }} onClick={swap}>
          {t({ bn: '⇄ উল্টান', en: '⇄ Swap' })}
        </button>
      </div>
      <div style={resultStyle} role="status">
        {result === null ? (
          <p style={{ margin: 0 }}>{t({ bn: 'পরিমাণ আর রেট বসালেই ফলাফল এখানে দেখাবে।', en: 'Enter an amount and a rate to see the result here.' })}</p>
        ) : (
          <>
            <p style={{ margin: '0 0 6px', fontSize: 16 }}>
              {t({ bn: `${amountNum} ${fromInfo?.code ?? from} =`, en: `${amountNum} ${fromInfo?.code ?? from} =` })}
            </p>
            <p style={{ margin: '0 0 6px', fontSize: 30, fontWeight: 700, color: 'var(--heading)', fontFamily: 'var(--font-head)' }}>{formatted}</p>
            <Tiles items={[
              { label: t({ bn: 'আপনার রেট', en: 'Your rate' }), value: `1 ${from} = ${rateNum} ${to}` },
              { label: t({ bn: 'উল্টো রেট', en: 'Reverse rate' }), value: reverseRate ? `1 ${to} = ${reverseRate.toFixed(6)} ${from}` : '—' },
            ]} />
          </>
        )}
        <p style={noteStyle}>{t({ bn: 'ফলাফল শুধু আপনার দেওয়া রেটের উপর নির্ভর করে — রেট ভুল হলে ফলাফলও ভুল হবে।', en: 'The result depends only on the rate you entered — if the rate is wrong, the result will be wrong too.' })}</p>
      </div>
      <div style={{ marginTop: 14 }}>
        <p style={labelStyle}>{t({ bn: 'জনপ্রিয় জোড়া (শুধু মুদ্রা বদলায়, রেট নয়)', en: 'Popular pairs (changes only the currencies, not the rate)' })}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {POPULAR_PAIRS.map((p) => (
            <button key={p.label} type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 40 }}
              onClick={() => { setFrom(p.from); setTo(p.to); }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </ToolSection>
  );
}
