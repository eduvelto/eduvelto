// Eduvelto — Currency & Remittance Calculator tool UI (28 Nov 2026).
//
// USER-ENTERED RATE ONLY (owner's binding FOREVER-AUTO rule): this tool
// fetches NO rates from any API and the UI never calls a rate "live".
// The user types the rate (1 FROM = X TO), the tool multiplies.
// Inward: foreign currency -> BDT, with the optional 2.5% government
// cash incentive on remittance through banking channels. Outward:
// BDT -> foreign currency (how much foreign currency X BDT buys).
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Tiles, ToolSection, errorStyle, gridStyle, inputStyle, labelStyle, noteStyle, resultStyle } from './eduToolUi';
import { CURRENCIES, currencyByCode } from '../../lib/tools/currencies';
import { GOVERNMENT_INCENTIVE_RATE_PERCENT, calculateOutwardRemittance, calculateRemittance } from '../../lib/tools/remittance';

type Direction = 'inward' | 'outward';

export function CurrencyRemittanceTool() {
  const { t } = useLanguage();
  const [direction, setDirection] = useState<Direction>('inward');
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('BDT');
  const [rate, setRate] = useState('121.50');
  const [fee, setFee] = useState('0');
  const [includeIncentive, setIncludeIncentive] = useState(true);

  const fromInfo = currencyByCode(from);
  const toInfo = currencyByCode(to);

  const outcome = useMemo(() => {
    const amountNum = Number(amount);
    const rateNum = Number(rate);
    const feeNum = fee.trim() === '' ? 0 : Number(fee);
    try {
      if (direction === 'inward') {
        const r = calculateRemittance({ amount: amountNum, rate: rateNum, fee: feeNum, includeIncentive });
        return { kind: 'ok' as const, converted: r.converted, incentive: r.incentive, fee: r.fee, received: r.received, reverseRate: r.reverseRate };
      }
      const out = calculateOutwardRemittance({ amount: amountNum, rate: rateNum, fee: feeNum });
      return { kind: 'ok' as const, converted: out.converted, incentive: 0, fee: out.fee, received: out.received, reverseRate: out.reverseRate };
    } catch (err) {
      return { kind: 'error' as const, message: err instanceof Error ? err.message : 'error' };
    }
  }, [amount, rate, fee, includeIncentive, direction]);

  const formattedReceived = useMemo(() => {
    if (outcome.kind !== 'ok' || !toInfo) return '';
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: toInfo.code }).format(outcome.received);
    } catch {
      return `${toInfo.symbol} ${outcome.received.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    }
  }, [outcome, toInfo]);

  function formatMoney(value: number, code: string): string {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(value);
    } catch {
      return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${code}`;
    }
  }

  function setDirectionAndCurrencies(next: Direction) {
    setDirection(next);
    if (next === 'inward') {
      setFrom((f) => (f === 'BDT' ? 'USD' : f));
      setTo('BDT');
    } else {
      setFrom('BDT');
      setTo((cur) => (cur === 'BDT' ? 'USD' : cur));
    }
  }

  function swap() {
    setFrom(to);
    setTo(from);
    setDirection((d) => (d === 'inward' ? 'outward' : 'inward'));
  }

  return (
    <ToolSection id="currency-remittance-title" titleBn="কারেন্সি ও রেমিট্যান্স ক্যালকুলেটর" titleEn="Currency & Remittance Calculator"
      descBn="বিদেশ থেকে টাকা পাঠালে কত টাকা পাবেন, আর টাকা পাঠিয়ে কত বিদেশি মুদ্রা পাবেন — রেট আপনি বসাবেন, হিসাব টুল করে দেবে।"
      descEn="How much taka you will receive when sending money home, and how much foreign currency your taka buys — you enter the rate, the tool does the maths.">
      <p style={noteStyle}>
        {t({
          bn: 'গুরুত্বপূর্ণ: এই টুল রেট ইন্টারনেট থেকে আনে না — কোনো রেট "লাইভ" নয়। আপনি নিজে রেট বসাবেন (যেমন ব্যাংক বা মানি এক্সচেঞ্জ থেকে জেনে) — টুল শুধু হিসাব করে দেবে।',
          en: 'Important: this tool fetches no rates from the internet — no rate here is "live". You enter the rate yourself (for example, one you checked with your bank or money changer) — the tool only does the calculation.',
        })}
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 44 }}
          aria-pressed={direction === 'inward'}
          onClick={() => setDirectionAndCurrencies('inward')}>
          {t({ bn: 'বিদেশ থেকে টাকা পাঠানো', en: 'Send money home' })}
        </button>
        <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 44 }}
          aria-pressed={direction === 'outward'}
          onClick={() => setDirectionAndCurrencies('outward')}>
          {t({ bn: 'বিদেশে টাকা পাঠানো', en: 'Send money abroad' })}
        </button>
      </div>

      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="cr-amount">{t({ bn: 'পরিমাণ', en: 'Amount' })}</label>
          <input id="cr-amount" style={inputStyle} type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="cr-from">{t({ bn: 'থেকে (মুদ্রা)', en: 'From (currency)' })}</label>
          <select id="cr-from" style={inputStyle} value={from} onChange={(e) => setFrom(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code} — {c.name} ({c.symbol})</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="cr-to">{t({ bn: 'এতে (মুদ্রা)', en: 'To (currency)' })}</label>
          <select id="cr-to" style={inputStyle} value={to} onChange={(e) => setTo(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code} — {c.name} ({c.symbol})</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="cr-rate">
            {t({ bn: `রেট — ১ ${from} = কত ${to}? (আপনি বসান)`, en: `Rate — 1 ${from} = how many ${to}? (you enter it)` })}
          </label>
          <input id="cr-rate" style={inputStyle} type="number" min="0" step="any" value={rate}
            placeholder={t({ bn: 'যেমন ১২১.৫০', en: 'e.g. 121.50' })}
            onChange={(e) => setRate(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="cr-fee">
            {t({ bn: `ট্রান্সফার ফি (ঐচ্ছিক, ${to}-তে)`, en: `Transfer fee (optional, in ${to})` })}
          </label>
          <input id="cr-fee" style={inputStyle} type="number" min="0" step="any" value={fee}
            placeholder="0"
            onChange={(e) => setFee(e.target.value)} />
        </div>
      </div>

      {direction === 'inward' && (
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14, fontWeight: 600, color: 'var(--heading)' }}>
            <input type="checkbox" checked={includeIncentive} onChange={(e) => setIncludeIncentive(e.target.checked)} style={{ marginTop: 3 }} />
            <span>
              {t({
                bn: `সরকারি প্রণোদনা ${GOVERNMENT_INCENTIVE_RATE_PERCENT}% যোগ করুন (ব্যাংকিং চ্যানেলে রেমিট্যান্সের উপর বাংলাদেশ ব্যাংকের নগদ প্রণোদনা)`,
                en: `Add the ${GOVERNMENT_INCENTIVE_RATE_PERCENT}% government incentive (Bangladesh Bank's cash incentive on inward remittance through banking channels)`,
              })}
            </span>
          </label>
          <p style={noteStyle}>
            {t({
              bn: 'ব্যাংকভেদে শর্ত ভিন্ন হতে পারে — আপনার ব্যাংক থেকে নিশ্চিত করুন।',
              en: 'Terms vary by bank — confirm with your bank.',
            })}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 44 }} onClick={swap}>
          {t({ bn: '⇄ উল্টান', en: '⇄ Swap' })}
        </button>
      </div>

      <div style={resultStyle} role="status">
        {outcome.kind === 'error' ? (
          <p style={{ ...errorStyle, margin: 0 }}>
            {t({
              bn: 'হিসাব করা যায়নি — পরিমাণ, রেট আর ফি ঠিক আছে কি না দেখুন। ফি রূপান্তরিত পরিমাণের সমান বা বেশি হলে ফলাফল শূন্যের নিচে যেত, তাই হিসাব বন্ধ করা হয়েছে।',
              en: 'Could not calculate — check that the amount, rate and fee are correct. If the fee is equal to or more than the converted amount the result would go below zero, so the calculation was stopped.',
            })}
          </p>
        ) : (
          <>
            <p style={{ margin: '0 0 6px', fontSize: 16 }}>
              {t({ bn: `আপনি পাবেন`, en: `You will receive` })}
            </p>
            <p style={{ margin: '0 0 6px', fontSize: 30, fontWeight: 700, color: 'var(--heading)', fontFamily: 'var(--font-head)' }}>{formattedReceived}</p>
            <Tiles items={[
              { label: t({ bn: 'রূপান্তরিত পরিমাণ', en: 'Converted amount' }), value: formatMoney(outcome.converted, to) },
              { label: t({ bn: 'ট্রান্সফার ফি', en: 'Transfer fee' }), value: formatMoney(outcome.fee, to) },
              ...(direction === 'inward'
                ? [{ label: t({ bn: `সরকারি প্রণোদনা (${GOVERNMENT_INCENTIVE_RATE_PERCENT}%)`, en: `Government incentive (${GOVERNMENT_INCENTIVE_RATE_PERCENT}%)` }), value: formatMoney(outcome.incentive, to) }]
                : []),
              { label: t({ bn: 'চূড়ান্ত প্রাপ্য', en: 'Final amount received' }), value: formatMoney(outcome.received, to) },
              { label: t({ bn: 'উল্টো রেট', en: 'Reverse rate' }), value: `1 ${to} = ${outcome.reverseRate.toFixed(6)} ${from}` },
            ]} />
            <p style={noteStyle}>
              {direction === 'inward'
                ? t({
                  bn: `হিসাব: ${amount} ${fromInfo?.code ?? from} × ${rate} = ${formatMoney(outcome.converted, to)}; ফি ${formatMoney(outcome.fee, to)} বাদ; প্রণোদনা ${formatMoney(outcome.incentive, to)} যোগ।`,
                  en: `Maths: ${amount} ${fromInfo?.code ?? from} × ${rate} = ${formatMoney(outcome.converted, to)}; minus fee ${formatMoney(outcome.fee, to)}; plus incentive ${formatMoney(outcome.incentive, to)}.`,
                })
                : t({
                  bn: `হিসাব: ${amount} ${fromInfo?.code ?? from} ÷ ${rate} = ${formatMoney(outcome.converted, to)}; ফি ${formatMoney(outcome.fee, to)} বাদ।`,
                  en: `Maths: ${amount} ${fromInfo?.code ?? from} ÷ ${rate} = ${formatMoney(outcome.converted, to)}; minus fee ${formatMoney(outcome.fee, to)}.`,
                })}
            </p>
          </>
        )}
        <p style={noteStyle}>{t({ bn: 'ফলাফল শুধু আপনার দেওয়া রেটের উপর নির্ভর করে — রেট ভুল হলে ফলাফলও ভুল হবে। প্রকৃত প্রাপ্য ব্যাংক/মানি এক্সচেঞ্জের চার্জের উপর নির্ভর করে ভিন্ন হতে পারে।', en: 'The result depends only on the rate you entered — if the rate is wrong, the result will be wrong too. The actual amount received can differ depending on your bank or money changer charges.' })}</p>
      </div>
    </ToolSection>
  );
}
