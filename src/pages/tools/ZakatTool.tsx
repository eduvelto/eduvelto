// Eduvelto — Zakat Calculator tool UI (100-Tools Project, Phase 2, Wave 3).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/zakat.ts: zakat is 2.5% of net
// wealth, due only when net wealth reaches the nisab (85 g gold or
// 595 g silver). Gold/silver prices are USER-ENTERED here — no price
// is ever hardcoded or fetched.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  calculateZakat,
  ZAKAT_NISAB_GOLD_GRAMS,
  ZAKAT_NISAB_SILVER_GRAMS,
  type NisabBasis,
} from '../../lib/tools/zakat';

const inputStyle: CSSProperties = {
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

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--heading)',
  marginBottom: 6,
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 12,
};

const cardStyle: CSSProperties = {
  marginTop: 16,
  padding: '18px 16px',
};

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '14px 16px',
  borderRadius: 10,
  background: 'var(--teal-soft)',
};

const formulaStyle: CSSProperties = {
  margin: '10px 0 0',
  fontSize: 13,
  color: 'var(--muted)',
};

const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};

/** Empty means "not entered yet"; a non-empty value must parse to a number. */
function parseAmount(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function fmtMoney(n: number): string {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export function ZakatTool() {
  const { t } = useLanguage();
  const [cash, setCash] = useState('');
  const [goldGrams, setGoldGrams] = useState('');
  const [goldPrice, setGoldPrice] = useState('');
  const [silverGrams, setSilverGrams] = useState('');
  const [silverPrice, setSilverPrice] = useState('');
  const [business, setBusiness] = useState('');
  const [debts, setDebts] = useState('');
  const [nisabBasis, setNisabBasis] = useState<NisabBasis>('gold');

  const cashV = parseAmount(cash);
  const goldGramsV = parseAmount(goldGrams);
  const goldPriceV = parseAmount(goldPrice);
  const silverGramsV = parseAmount(silverGrams);
  const silverPriceV = parseAmount(silverPrice);
  const businessV = parseAmount(business);
  const debtsV = parseAmount(debts);

  const anyAmountInvalid =
    [cashV, goldGramsV, silverGramsV, businessV, debtsV].some((v) => v !== null && v < 0) ||
    [cash, goldGrams, silverGrams, business, debts].some(
      (raw, i) =>
        raw.trim() !== '' &&
        [cashV, goldGramsV, silverGramsV, businessV, debtsV][i] === null,
    );
  const pricesReady =
    goldPriceV !== null && goldPriceV > 0 && silverPriceV !== null && silverPriceV > 0;
  const anyFilled =
    [cash, goldGrams, goldPrice, silverGrams, silverPrice, business, debts].some(
      (raw) => raw.trim() !== '',
    );

  const result = useMemo(() => {
    if (!pricesReady || anyAmountInvalid) return null;
    try {
      return calculateZakat({
        cash: cashV ?? 0,
        goldGrams: goldGramsV ?? 0,
        silverGrams: silverGramsV ?? 0,
        businessGoodsValue: businessV ?? 0,
        debts: debtsV ?? 0,
        goldPricePerGram: goldPriceV as number,
        silverPricePerGram: silverPriceV as number,
        nisabBasis,
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricesReady, anyAmountInvalid, cashV, goldGramsV, silverGramsV, businessV, debtsV, goldPriceV, silverPriceV, nisabBasis]);

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="zakat-title">
      <h2 id="zakat-title" style={{ fontSize: 19, color: 'var(--heading)', margin: '0 0 4px' }}>
        {t({ bn: 'যাকাত ক্যালকুলেটর', en: 'Zakat Calculator' })}
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 14px' }}>
        {t({
          bn: 'নগদ টাকা, সোনা-রুপা ও ব্যবসার পণ্যের মূল্য দিন। সোনা-রুপার বর্তমান দাম আপনিই বসাবেন — এখানে কোনো দাম আগে থেকে দেওয়া নেই। সব হিসাব আপনার ডিভাইসেই হয়।',
          en: 'Enter cash, gold, silver and business goods. You enter the current gold and silver prices yourself — no price is preset here. Everything is computed on your device.',
        })}
      </p>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="zakat-cash">
            {t({ bn: 'নগদ টাকা', en: 'Cash in hand / bank' })}
          </label>
          <input
            id="zakat-cash"
            style={inputStyle}
            type="number"
            min="0"
            inputMode="decimal"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="zakat-gold-grams">
            {t({ bn: 'সোনা (গ্রাম)', en: 'Gold (grams)' })}
          </label>
          <input
            id="zakat-gold-grams"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={goldGrams}
            onChange={(e) => setGoldGrams(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="zakat-gold-price">
            {t({ bn: 'সোনার দাম (প্রতি গ্রাম)', en: 'Gold price (per gram)' })}
          </label>
          <input
            id="zakat-gold-price"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={goldPrice}
            onChange={(e) => setGoldPrice(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="zakat-silver-grams">
            {t({ bn: 'রুপা (গ্রাম)', en: 'Silver (grams)' })}
          </label>
          <input
            id="zakat-silver-grams"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={silverGrams}
            onChange={(e) => setSilverGrams(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="zakat-silver-price">
            {t({ bn: 'রুপার দাম (প্রতি গ্রাম)', en: 'Silver price (per gram)' })}
          </label>
          <input
            id="zakat-silver-price"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={silverPrice}
            onChange={(e) => setSilverPrice(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="zakat-business">
            {t({ bn: 'ব্যবসার পণ্যের মূল্য', en: 'Business goods value' })}
          </label>
          <input
            id="zakat-business"
            style={inputStyle}
            type="number"
            min="0"
            inputMode="decimal"
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="zakat-debts">
            {t({ bn: 'ঋণ / দেনা (বাদ যাবে)', en: 'Debts (subtracted)' })}
          </label>
          <input
            id="zakat-debts"
            style={inputStyle}
            type="number"
            min="0"
            inputMode="decimal"
            value={debts}
            onChange={(e) => setDebts(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="zakat-nisab">
            {t({ bn: 'নিসাবের ভিত্তি', en: 'Nisab basis' })}
          </label>
          <select
            id="zakat-nisab"
            style={inputStyle}
            value={nisabBasis}
            onChange={(e) => setNisabBasis(e.target.value as NisabBasis)}
          >
            <option value="gold">
              {t({ bn: 'সোনা (৮৫ গ্রাম)', en: 'Gold (85 grams)' })}
            </option>
            <option value="silver">
              {t({ bn: 'রুপা (৫৯৫ গ্রাম)', en: 'Silver (595 grams)' })}
            </option>
          </select>
        </div>
      </div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}>
            <strong>
              {result.due
                ? t({ bn: 'যাকাত দিতে হবে: ', en: 'Zakat due: ' })
                : t({ bn: 'যাকাত দিতে হবে না', en: 'No zakat due' })}
              {result.due ? fmtMoney(result.zakat) : ''}
            </strong>
          </p>
          <p style={{ margin: '0 0 6px', fontSize: 15 }}>
            {t({ bn: 'মোট সম্পদ: ', en: 'Net wealth: ' })}
            {fmtMoney(result.netWealth)}
          </p>
          <p style={{ margin: '0 0 6px', fontSize: 15 }}>
            {t({ bn: 'নিসাব: ', en: 'Nisab: ' })}
            {fmtMoney(result.nisab)}
          </p>
          {!result.due ? (
            <p style={{ margin: 0, fontSize: 15 }}>
              {t({
                bn: 'মোট সম্পদ নিসাবের নিচে, তাই যাকাত ফরজ হয়নি।',
                en: 'Net wealth is below the nisab, so no zakat is due.',
              })}
            </p>
          ) : null}
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: নিসাব = ${nisabBasis === 'gold' ? `${ZAKAT_NISAB_GOLD_GRAMS} গ্রাম সোনার দাম` : `${ZAKAT_NISAB_SILVER_GRAMS} গ্রাম রুপার দাম`}; মোট সম্পদ নিসাবের সমান বা বেশি হলে যাকাত = মোট সম্পদের ২.৫%।`,
              en: `Formula: nisab = price of ${nisabBasis === 'gold' ? `${ZAKAT_NISAB_GOLD_GRAMS} g of gold` : `${ZAKAT_NISAB_SILVER_GRAMS} g of silver`}; when net wealth reaches the nisab, zakat = 2.5% of net wealth.`,
            })}
          </p>
        </div>
      ) : anyAmountInvalid ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'সঠিক মান দিন — কোনো পরিমাণ ঋণাত্মক হতে পারবে না।',
            en: 'Enter valid values — no amount can be negative.',
          })}
        </p>
      ) : anyFilled ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'যাকাত বের করতে সোনা ও রুপার বর্তমান দাম (প্রতি গ্রাম) দিন।',
            en: 'Enter the current gold and silver prices (per gram) to calculate zakat.',
          })}
        </p>
      ) : null}
    </section>
  );
}
