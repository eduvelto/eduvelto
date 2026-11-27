// Eduvelto — Discount, VAT & Profit Calculator tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/discountVatProfit.ts: three
// small calculations in one tool. The VAT rate is USER-ENTERED with
// 15% only as an example starting value — VAT rates vary by item in
// Bangladesh, so no rate is stated here as a fact. All results are
// labelled আনুমানিক (estimated).
//
// Design (Batch 2 pattern): gradient hero, mode tabs, headline +
// tiles per mode, copy buttons, a formula with the user's own
// numbers, and a free summary download via RewardedAdButton. Opens
// empty — the example fills in only when tapped.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { calculateDiscount, calculateProfit, calculateVat } from '../../lib/tools/discountVatProfit';
import {
  buttonRowStyle,
  cardStyle,
  errorStyle,
  FinanceHero,
  fmtMoney,
  formulaStyle,
  gridStyle,
  headlineLabelStyle,
  headlineStyle,
  inputStyle,
  labelStyle,
  parseAmount,
  presetChipStyle,
  presetRowStyle,
  resultStyle,
  SummaryDownload,
  tileGridStyle,
  tileLabelStyle,
  tileStyle,
  tileValueStyle,
  useCopyText,
} from './financeUi';

type DvpMode = 'discount' | 'vat' | 'profit';

export function DiscountVatProfitTool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<DvpMode>('discount');
  // Discount fields
  const [price, setPrice] = useState('');
  const [discountPct, setDiscountPct] = useState('');
  // VAT fields
  const [vatPrice, setVatPrice] = useState('');
  const [vatPct, setVatPct] = useState('15');
  const [vatIncluded, setVatIncluded] = useState(false);
  // Profit fields
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const { copied, copyText } = useCopyText();

  const priceV = parseAmount(price);
  const discountV = parseAmount(discountPct);
  const vatPriceV = parseAmount(vatPrice);
  const vatPctV = parseAmount(vatPct);
  const costV = parseAmount(costPrice);
  const sellingV = parseAmount(sellingPrice);
  const allVals = [priceV, discountV, vatPriceV, vatPctV, costV, sellingV];
  const allRaws = [price, discountPct, vatPrice, vatPct, costPrice, sellingPrice];
  const invalid =
    allVals.some((v) => v !== null && v < 0) ||
    allRaws.some((raw, i) => raw.trim() !== '' && allVals[i] === null) ||
    (discountV !== null && discountV > 100);

  const discountResult = useMemo(() => {
    if (mode !== 'discount' || invalid || priceV === null || discountV === null) return null;
    try {
      return calculateDiscount({ originalPrice: priceV, discountPercent: discountV });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, invalid, priceV, discountV]);

  const vatResult = useMemo(() => {
    if (mode !== 'vat' || invalid || vatPriceV === null || vatPctV === null) return null;
    try {
      return calculateVat({ price: vatPriceV, vatPercent: vatPctV, vatIncluded });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, invalid, vatPriceV, vatPctV, vatIncluded]);

  const profitResult = useMemo(() => {
    if (mode !== 'profit' || invalid || costV === null || sellingV === null) return null;
    try {
      return calculateProfit({ costPrice: costV, sellingPrice: sellingV });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, invalid, costV, sellingV]);

  function loadExample(): void {
    if (mode === 'discount') {
      setPrice('2000');
      setDiscountPct('25');
    } else if (mode === 'vat') {
      setVatPrice('1000');
      setVatPct('15');
      setVatIncluded(false);
    } else {
      setCostPrice('800');
      setSellingPrice('1000');
    }
  }

  const modeLabel = t({
    bn: mode === 'discount' ? 'ছাড়' : mode === 'vat' ? 'ভ্যাট' : 'লাভ',
    en: mode === 'discount' ? 'Discount' : mode === 'vat' ? 'VAT' : 'Profit',
  });
  const summary = discountResult
    ? t({
        bn: `ছাড় (আনুমানিক): দাম ৳${fmtMoney(priceV as number)}, ছাড় ${discountV}% — বাঁচবে ৳${fmtMoney(discountResult.discountAmount)}, দিতে হবে ৳${fmtMoney(discountResult.finalPrice)}।`,
        en: `Discount (estimate): price ৳${fmtMoney(priceV as number)}, ${discountV}% off — you save ৳${fmtMoney(discountResult.discountAmount)}, pay ৳${fmtMoney(discountResult.finalPrice)}.`,
      })
    : vatResult
      ? t({
          bn: `ভ্যাট (আনুমানিক): দাম ৳${fmtMoney(vatPriceV as number)}, ভ্যাট ${vatPctV}% — ভ্যাটের পরিমাণ ৳${fmtMoney(vatResult.vatAmount)}, ভ্যাট ছাড়া ৳${fmtMoney(vatResult.priceExVat)}, ভ্যাটসহ ৳${fmtMoney(vatResult.priceIncVat)}।`,
          en: `VAT (estimate): price ৳${fmtMoney(vatPriceV as number)}, VAT ${vatPctV}% — VAT amount ৳${fmtMoney(vatResult.vatAmount)}, excluding VAT ৳${fmtMoney(vatResult.priceExVat)}, including VAT ৳${fmtMoney(vatResult.priceIncVat)}.`,
        })
      : profitResult
        ? t({
            bn: `লাভ (আনুমানিক): কেনা ৳${fmtMoney(costV as number)}, বিক্রি ৳${fmtMoney(sellingV as number)} — লাভ ৳${fmtMoney(profitResult.profit)}, মার্জিন ${profitResult.profitMarginPercent}%, মার্কআপ ${profitResult.markupPercent === null ? '—' : `${profitResult.markupPercent}%`}।`,
            en: `Profit (estimate): cost ৳${fmtMoney(costV as number)}, selling ৳${fmtMoney(sellingV as number)} — profit ৳${fmtMoney(profitResult.profit)}, margin ${profitResult.profitMarginPercent}%, markup ${profitResult.markupPercent === null ? '—' : `${profitResult.markupPercent}%`}.`,
          })
        : null;

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="dvp-title">
      <FinanceHero
        titleId="dvp-title"
        titleBn="ছাড়, ভ্যাট ও লাভ ক্যালকুলেটর"
        titleEn="Discount, VAT & Profit Calculator"
        descBn="পণ্যের ছাড়, ভ্যাট ও লাভ — তিনটি হিসাব এক জায়গায়। ভ্যাটের হার নিজে বসান (১৫% শুধু উদাহরণ মান — পণ্যভেদে হার আলাদা)। সব হিসাব আনুমানিক।"
        descEn="Product discounts, VAT and profit — three calculations in one place. Enter the VAT rate yourself (15% is only an example — rates differ by item). All figures are estimates."
        trustBn="১০০% ব্রাউজারে • কোনো আপলোড নয়"
        trustEn="100% in-browser • nothing uploaded"
      />
      <div style={presetRowStyle} role="group" aria-label={t({ bn: 'হিসাবের ধরন', en: 'Calculation type' })}>
        {(['discount', 'vat', 'profit'] as DvpMode[]).map((m) => (
          <button
            key={m}
            type="button"
            style={presetChipStyle(mode === m)}
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
          >
            {t({
              bn: m === 'discount' ? 'ছাড়' : m === 'vat' ? 'ভ্যাট' : 'লাভ',
              en: m === 'discount' ? 'Discount' : m === 'vat' ? 'VAT' : 'Profit',
            })}
          </button>
        ))}
      </div>
      {mode === 'discount' ? (
        <div style={{ ...gridStyle, marginTop: 14 }}>
          <div>
            <label style={labelStyle} htmlFor="dvp-price">
              {t({ bn: 'আসল দাম', en: 'Original price' })}
            </label>
            <input
              id="dvp-price"
              style={inputStyle}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="2000"
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="dvp-discount">
              {t({ bn: 'ছাড় (%)', en: 'Discount (%)' })}
            </label>
            <input
              id="dvp-discount"
              style={inputStyle}
              type="number"
              min="0"
              max="100"
              step="0.01"
              inputMode="decimal"
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value)}
              placeholder="25"
            />
          </div>
        </div>
      ) : mode === 'vat' ? (
        <div style={{ ...gridStyle, marginTop: 14 }}>
          <div>
            <label style={labelStyle} htmlFor="dvp-vat-price">
              {t({ bn: 'দাম', en: 'Price' })}
            </label>
            <input
              id="dvp-vat-price"
              style={inputStyle}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={vatPrice}
              onChange={(e) => setVatPrice(e.target.value)}
              placeholder="1000"
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="dvp-vat-pct">
              {t({ bn: 'ভ্যাটের হার (%) — উদাহরণ মান', en: 'VAT rate (%) — example value' })}
            </label>
            <input
              id="dvp-vat-pct"
              style={inputStyle}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={vatPct}
              onChange={(e) => setVatPct(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="dvp-vat-included">
              {t({ bn: 'দামে ভ্যাট অন্তর্ভুক্ত কি না', en: 'Is VAT included in the price?' })}
            </label>
            <select
              id="dvp-vat-included"
              style={inputStyle}
              value={vatIncluded ? 'yes' : 'no'}
              onChange={(e) => setVatIncluded(e.target.value === 'yes')}
            >
              <option value="no">{t({ bn: 'না — ভ্যাট ছাড়া দাম', en: 'No — price excludes VAT' })}</option>
              <option value="yes">{t({ bn: 'হ্যাঁ — ভ্যাটসহ দাম', en: 'Yes — price includes VAT' })}</option>
            </select>
          </div>
        </div>
      ) : (
        <div style={{ ...gridStyle, marginTop: 14 }}>
          <div>
            <label style={labelStyle} htmlFor="dvp-cost">
              {t({ bn: 'কেনা দাম', en: 'Cost price' })}
            </label>
            <input
              id="dvp-cost"
              style={inputStyle}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="800"
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="dvp-selling">
              {t({ bn: 'বিক্রির দাম', en: 'Selling price' })}
            </label>
            <input
              id="dvp-selling"
              style={inputStyle}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="1000"
            />
          </div>
        </div>
      )}
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: `উদাহরণ বসান (${modeLabel})`, en: `Load example (${modeLabel})` })}
        </button>
      </div>
      {discountResult ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'ছাড়ের পর দাম — আনুমানিক', en: 'Price after discount — estimate' })}</p>
          <p style={headlineStyle}>৳{fmtMoney(discountResult.finalPrice)}</p>
          <div style={buttonRowStyle}>
            <button
              type="button"
              className="ev-btn-outline"
              onClick={() => void copyText(`৳${fmtMoney(discountResult.finalPrice)}`, 'final')}
            >
              {copied === 'final' ? t({ bn: 'কপি হয়েছে', en: 'Copied' }) : t({ bn: 'দাম কপি করুন', en: 'Copy price' })}
            </button>
            <button
              type="button"
              className="ev-btn-outline"
              onClick={() => void copyText(summary ?? '', 'summary')}
            >
              {copied === 'summary' ? t({ bn: 'কপি হয়েছে', en: 'Copied' }) : t({ bn: 'সারাংশ কপি করুন', en: 'Copy summary' })}
            </button>
          </div>
          <div style={tileGridStyle}>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'ছাড়ের পরিমাণ', en: 'Discount amount' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(discountResult.discountAmount)}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'আসল দাম', en: 'Original price' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(priceV as number)}</p>
            </div>
          </div>
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: ছাড় = ৳${fmtMoney(priceV as number)} × ${discountV}% ÷ ১০০ = ৳${fmtMoney(discountResult.discountAmount)}; দিতে হবে = ৳${fmtMoney(priceV as number)} − ৳${fmtMoney(discountResult.discountAmount)} = ৳${fmtMoney(discountResult.finalPrice)}।`,
              en: `Formula: discount = ৳${fmtMoney(priceV as number)} × ${discountV}% ÷ 100 = ৳${fmtMoney(discountResult.discountAmount)}; pay = ৳${fmtMoney(priceV as number)} − ৳${fmtMoney(discountResult.discountAmount)} = ৳${fmtMoney(discountResult.finalPrice)}.`,
            })}
          </p>
          <SummaryDownload filename="discount-summary.txt" text={summary} durationSeconds={15} />
        </div>
      ) : vatResult ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'ভ্যাটের পরিমাণ — আনুমানিক', en: 'VAT amount — estimate' })}</p>
          <p style={headlineStyle}>৳{fmtMoney(vatResult.vatAmount)}</p>
          <div style={buttonRowStyle}>
            <button
              type="button"
              className="ev-btn-outline"
              onClick={() => void copyText(`৳${fmtMoney(vatResult.vatAmount)}`, 'vat')}
            >
              {copied === 'vat' ? t({ bn: 'কপি হয়েছে', en: 'Copied' }) : t({ bn: 'ভ্যাট কপি করুন', en: 'Copy VAT' })}
            </button>
            <button
              type="button"
              className="ev-btn-outline"
              onClick={() => void copyText(summary ?? '', 'summary')}
            >
              {copied === 'summary' ? t({ bn: 'কপি হয়েছে', en: 'Copied' }) : t({ bn: 'সারাংশ কপি করুন', en: 'Copy summary' })}
            </button>
          </div>
          <div style={tileGridStyle}>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'ভ্যাট ছাড়া দাম', en: 'Price excluding VAT' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(vatResult.priceExVat)}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'ভ্যাটসহ দাম', en: 'Price including VAT' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(vatResult.priceIncVat)}</p>
            </div>
          </div>
          <p style={formulaStyle}>
            {vatIncluded
              ? t({
                  bn: `সূত্র: ভ্যাটসহ দাম ৳${fmtMoney(vatPriceV as number)}; ভ্যাট = ৳${fmtMoney(vatPriceV as number)} × ${vatPctV}% ÷ (১০০ + ${vatPctV}) = ৳${fmtMoney(vatResult.vatAmount)}; ভ্যাট ছাড়া = ৳${fmtMoney(vatResult.priceExVat)}।`,
                  en: `Formula: price including VAT ৳${fmtMoney(vatPriceV as number)}; VAT = ৳${fmtMoney(vatPriceV as number)} × ${vatPctV}% ÷ (100 + ${vatPctV}) = ৳${fmtMoney(vatResult.vatAmount)}; excluding VAT = ৳${fmtMoney(vatResult.priceExVat)}.`,
                })
              : t({
                  bn: `সূত্র: ভ্যাট = ৳${fmtMoney(vatPriceV as number)} × ${vatPctV}% ÷ ১০০ = ৳${fmtMoney(vatResult.vatAmount)}; ভ্যাটসহ মোট = ৳${fmtMoney(vatResult.priceIncVat)}।`,
                  en: `Formula: VAT = ৳${fmtMoney(vatPriceV as number)} × ${vatPctV}% ÷ 100 = ৳${fmtMoney(vatResult.vatAmount)}; total including VAT = ৳${fmtMoney(vatResult.priceIncVat)}.`,
                })}
          </p>
          <p style={formulaStyle}>
            {t({
              bn: 'ভ্যাটের হারটি উদাহরণ মাত্র — বাংলাদেশে পণ্য ও সেবাভেদে ভ্যাটের হার আলাদা (যেমন ৫%, ৭.৫%, ১০%, ১৫%)। নিজের পণ্যের সঠিক হার NBR-এর তালিকায় যাচাই করুন। তথ্য: 27 Nov 2026।',
              en: 'The VAT rate is an example only — in Bangladesh the rate differs by product and service (e.g. 5%, 7.5%, 10%, 15%). Check the correct rate for your item in the NBR schedule. Noted: 27 Nov 2026.',
            })}
          </p>
          <SummaryDownload filename="vat-summary.txt" text={summary} durationSeconds={15} />
        </div>
      ) : profitResult ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>
            {profitResult.profit >= 0
              ? t({ bn: 'লাভ — আনুমানিক', en: 'Profit — estimate' })
              : t({ bn: 'ক্ষতি — আনুমানিক', en: 'Loss — estimate' })}
          </p>
          <p style={headlineStyle}>৳{fmtMoney(profitResult.profit)}</p>
          <div style={buttonRowStyle}>
            <button
              type="button"
              className="ev-btn-outline"
              onClick={() => void copyText(`৳${fmtMoney(profitResult.profit)}`, 'profit')}
            >
              {copied === 'profit' ? t({ bn: 'কপি হয়েছে', en: 'Copied' }) : t({ bn: 'লাভ কপি করুন', en: 'Copy profit' })}
            </button>
            <button
              type="button"
              className="ev-btn-outline"
              onClick={() => void copyText(summary ?? '', 'summary')}
            >
              {copied === 'summary' ? t({ bn: 'কপি হয়েছে', en: 'Copied' }) : t({ bn: 'সারাংশ কপি করুন', en: 'Copy summary' })}
            </button>
          </div>
          <div style={tileGridStyle}>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'মার্জিন (বিক্রির উপর)', en: 'Margin (on selling price)' })}</p>
              <p style={tileValueStyle}>{profitResult.profitMarginPercent}%</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'মার্কআপ (কেনার উপর)', en: 'Markup (on cost price)' })}</p>
              <p style={tileValueStyle}>
                {profitResult.markupPercent === null ? '—' : `${profitResult.markupPercent}%`}
              </p>
            </div>
          </div>
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: লাভ = ৳${fmtMoney(sellingV as number)} − ৳${fmtMoney(costV as number)} = ৳${fmtMoney(profitResult.profit)}; মার্জিন = ৳${fmtMoney(profitResult.profit)} ÷ ৳${fmtMoney(sellingV as number)} × ১০০ = ${profitResult.profitMarginPercent}%।`,
              en: `Formula: profit = ৳${fmtMoney(sellingV as number)} − ৳${fmtMoney(costV as number)} = ৳${fmtMoney(profitResult.profit)}; margin = ৳${fmtMoney(profitResult.profit)} ÷ ৳${fmtMoney(sellingV as number)} × 100 = ${profitResult.profitMarginPercent}%.`,
            })}
          </p>
          <SummaryDownload filename="profit-summary.txt" text={summary} durationSeconds={15} />
        </div>
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({ bn: 'সঠিক মান দিন — কোনো মান ঋণাত্মক হতে পারবে না, ছাড় ১০০%-এর বেশি হতে পারবে না।', en: 'Enter valid values — no value can be negative, and the discount cannot exceed 100%.' })}
        </p>
      ) : null}
    </section>
  );
}
