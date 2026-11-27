// Eduvelto — Break-Even Calculator tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/breakEven.ts:
// contribution margin = selling price - variable cost per unit;
// break-even units = fixed costs / margin (rounded up). When the
// selling price does not cover the variable cost, the tool says
// breaking even is impossible instead of showing a meaningless
// number. No figures are hardcoded — every number is the user's
// own. All results are estimates.
//
// Design (Batch 2 pattern): gradient hero, headline break-even
// units + tiles, copy buttons, what-if modes (units for a target
// profit; profit at a given volume), a formula with the user's own
// numbers, and a free summary download via RewardedAdButton. Opens
// empty — the example fills in only when tapped.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { calculateBreakEven, profitAtUnits, unitsForTargetProfit } from '../../lib/tools/breakEven';
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
  resultStyle,
  SummaryDownload,
  tileGridStyle,
  tileLabelStyle,
  tileStyle,
  tileValueStyle,
  useCopyText,
} from './financeUi';

export function BreakEvenTool() {
  const { t } = useLanguage();
  const [fixedCosts, setFixedCosts] = useState('');
  const [variableCost, setVariableCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [targetProfit, setTargetProfit] = useState('');
  const [units, setUnits] = useState('');
  const { copied, copyText } = useCopyText();

  const fixedV = parseAmount(fixedCosts);
  const variableV = parseAmount(variableCost);
  const priceV = parseAmount(sellingPrice);
  const targetV = parseAmount(targetProfit);
  const unitsV = parseAmount(units);
  const invalid =
    [fixedV, variableV, priceV, targetV, unitsV].some((v) => v !== null && v < 0) ||
    [fixedCosts, variableCost, sellingPrice, targetProfit, units].some(
      (raw, i) => raw.trim() !== '' && [fixedV, variableV, priceV, targetV, unitsV][i] === null,
    ) ||
    (unitsV !== null && !Number.isInteger(unitsV));
  const ready = !invalid && fixedV !== null && variableV !== null && priceV !== null;

  const result = useMemo(() => {
    if (!ready) return null;
    try {
      return calculateBreakEven({
        fixedCosts: fixedV as number,
        variableCostPerUnit: variableV as number,
        sellingPricePerUnit: priceV as number,
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, fixedV, variableV, priceV]);

  const targetUnits =
    result && result.possible && targetV !== null && targetV >= 0 && !invalid
      ? unitsForTargetProfit(
          { fixedCosts: fixedV as number, variableCostPerUnit: variableV as number, sellingPricePerUnit: priceV as number },
          targetV,
        )
      : null;

  const profitResult =
    result && unitsV !== null && Number.isInteger(unitsV) && unitsV >= 0 && !invalid
      ? (() => {
          try {
            return profitAtUnits({
              fixedCosts: fixedV as number,
              variableCostPerUnit: variableV as number,
              sellingPricePerUnit: priceV as number,
              units: unitsV,
            });
          } catch {
            return null;
          }
        })()
      : null;

  function loadExample(): void {
    setFixedCosts('50000');
    setVariableCost('100');
    setSellingPrice('250');
  }

  const summary = result?.possible
    ? t({
        bn: `ব্রেক-ইভেন (আনুমানিক): স্থায়ী খরচ ৳${fmtMoney(fixedV as number)}, প্রতি ইউনিট খরচ ৳${fmtMoney(variableV as number)}, বিক্রির দাম ৳${fmtMoney(priceV as number)} — লাভ শুরু হবে ${result.breakEvenUnits} ইউনিট বিক্রির পর (আয় ৳${fmtMoney(result.breakEvenRevenue as number)})। প্রতি ইউনিটে লাভের অংশ ৳${fmtMoney(result.contributionMarginPerUnit)}।`,
        en: `Break-even (estimate): fixed costs ৳${fmtMoney(fixedV as number)}, variable cost ৳${fmtMoney(variableV as number)}/unit, selling price ৳${fmtMoney(priceV as number)} — profit starts after ${result.breakEvenUnits} units (revenue ৳${fmtMoney(result.breakEvenRevenue as number)}). Contribution per unit ৳${fmtMoney(result.contributionMarginPerUnit)}.`,
      })
    : null;

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="breakeven-title">
      <FinanceHero
        titleId="breakeven-title"
        titleBn="ব্রেক-ইভেন ক্যালকুলেটর"
        titleEn="Break-Even Calculator"
        descBn="স্থায়ী খরচ, প্রতি ইউনিটের খরচ ও বিক্রির দাম দিন — কত ইউনিট বিক্রি করলে লাভ শুরু হবে তা দেখুন। বিক্রির দাম খরচের চেয়ে কম হলে লাভ কখনো হবে না — সেটাও জানিয়ে দেওয়া হয়।"
        descEn="Enter fixed costs, cost per unit and selling price — see how many units you must sell before profit starts. If the selling price does not cover the cost per unit, profit is never possible — the tool says so."
        trustBn="১০০% ব্রাউজারে • কোনো আপলোড নয়"
        trustEn="100% in-browser • nothing uploaded"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="breakeven-fixed">
            {t({ bn: 'স্থায়ী খরচ (ভাড়া, বেতন…)', en: 'Fixed costs (rent, salaries…)' })}
          </label>
          <input
            id="breakeven-fixed"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={fixedCosts}
            onChange={(e) => setFixedCosts(e.target.value)}
            placeholder="50000"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="breakeven-variable">
            {t({ bn: 'প্রতি ইউনিটের খরচ', en: 'Variable cost per unit' })}
          </label>
          <input
            id="breakeven-variable"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={variableCost}
            onChange={(e) => setVariableCost(e.target.value)}
            placeholder="100"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="breakeven-price">
            {t({ bn: 'প্রতি ইউনিটের বিক্রির দাম', en: 'Selling price per unit' })}
          </label>
          <input
            id="breakeven-price"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            placeholder="250"
          />
        </div>
      </div>
      <div style={gridStyle}>
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle} htmlFor="breakeven-target">
            {t({ bn: 'কী পরিমাণ লাভ করতে চান? (ঐচ্ছিক)', en: 'Target profit (optional)' })}
          </label>
          <input
            id="breakeven-target"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={targetProfit}
            onChange={(e) => setTargetProfit(e.target.value)}
            placeholder="30000"
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle} htmlFor="breakeven-units">
            {t({ bn: 'কত ইউনিট বিক্রি করবেন? (ঐচ্ছিক)', en: 'Units you plan to sell (optional)' })}
          </label>
          <input
            id="breakeven-units"
            style={inputStyle}
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            placeholder="500"
          />
        </div>
      </div>
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: 'উদাহরণ বসান (স্থায়ী খরচ ৳৫০,০০০, খরচ ৳১০০, দাম ৳২৫০)', en: 'Load example (fixed ৳50,000, cost ৳100, price ৳250)' })}
        </button>
      </div>
      {targetUnits !== null && targetV !== null ? (
        <div style={{ ...resultStyle, background: 'var(--amber-soft)' }}>
          <p style={{ margin: 0, fontSize: 15 }}>
            {t({
              bn: `৳${fmtMoney(targetV)} লাভ করতে ${targetUnits} ইউনিট বিক্রি করতে হবে (আনুমানিক)।`,
              en: `To earn ৳${fmtMoney(targetV)} profit, sell ${targetUnits} units (estimate).`,
            })}
          </p>
        </div>
      ) : null}
      {profitResult ? (
        <div style={{ ...resultStyle, background: 'var(--amber-soft)' }}>
          <p style={{ margin: 0, fontSize: 15 }}>
            {t({
              bn: `${unitsV} ইউনিট বিক্রি করলে আয় ৳${fmtMoney(profitResult.revenue)}, মোট খরচ ৳${fmtMoney(profitResult.totalCost)} — ${profitResult.profit >= 0 ? `লাভ ৳${fmtMoney(profitResult.profit)}` : `ক্ষতি ৳${fmtMoney(-profitResult.profit)}`} (আনুমানিক)।`,
              en: `Selling ${unitsV} units brings revenue ৳${fmtMoney(profitResult.revenue)} and total cost ৳${fmtMoney(profitResult.totalCost)} — ${profitResult.profit >= 0 ? `profit ৳${fmtMoney(profitResult.profit)}` : `loss ৳${fmtMoney(-profitResult.profit)}`} (estimate).`,
            })}
          </p>
        </div>
      ) : null}
      {result ? (
        result.possible ? (
          <div style={resultStyle} role="status">
            <p style={headlineLabelStyle}>{t({ bn: 'ব্রেক-ইভেন — আনুমানিক', en: 'Break-even point — estimate' })}</p>
            <p style={headlineStyle}>
              {result.breakEvenUnits} {t({ bn: 'ইউনিট', en: 'units' })}
            </p>
            <div style={buttonRowStyle}>
              <button
                type="button"
                className="ev-btn-outline"
                onClick={() => void copyText(`${result.breakEvenUnits}`, 'units')}
              >
                {copied === 'units'
                  ? t({ bn: 'কপি হয়েছে', en: 'Copied' })
                  : t({ bn: 'ইউনিট কপি করুন', en: 'Copy units' })}
              </button>
              <button
                type="button"
                className="ev-btn-outline"
                onClick={() => void copyText(summary ?? '', 'summary')}
              >
                {copied === 'summary'
                  ? t({ bn: 'কপি হয়েছে', en: 'Copied' })
                  : t({ bn: 'সারাংশ কপি করুন', en: 'Copy summary' })}
              </button>
            </div>
            <div style={tileGridStyle}>
              <div style={tileStyle}>
                <p style={tileLabelStyle}>{t({ bn: 'প্রতি ইউনিটে লাভের অংশ', en: 'Contribution per unit' })}</p>
                <p style={tileValueStyle}>৳{fmtMoney(result.contributionMarginPerUnit)}</p>
              </div>
              <div style={tileStyle}>
                <p style={tileLabelStyle}>{t({ bn: 'মার্জিনের হার', en: 'Contribution margin ratio' })}</p>
                <p style={tileValueStyle}>{result.contributionMarginRatioPercent}%</p>
              </div>
              <div style={tileStyle}>
                <p style={tileLabelStyle}>{t({ bn: 'ব্রেক-ইভেন আয়', en: 'Break-even revenue' })}</p>
                <p style={tileValueStyle}>৳{fmtMoney(result.breakEvenRevenue as number)}</p>
              </div>
            </div>
            <p style={formulaStyle}>
              {t({
                bn: `সূত্র: প্রতি ইউনিটে লাভের অংশ = ৳${fmtMoney(priceV as number)} − ৳${fmtMoney(variableV as number)} = ৳${fmtMoney(result.contributionMarginPerUnit)}; ব্রেক-ইভেন ইউনিট = ৳${fmtMoney(fixedV as number)} ÷ ৳${fmtMoney(result.contributionMarginPerUnit)} = ${result.breakEvenUnits} (ভগ্নাংশ উপরে তোলা হয়েছে); আয় = ${result.breakEvenUnits} × ৳${fmtMoney(priceV as number)} = ৳${fmtMoney(result.breakEvenRevenue as number)}।`,
                en: `Formula: contribution per unit = ৳${fmtMoney(priceV as number)} − ৳${fmtMoney(variableV as number)} = ৳${fmtMoney(result.contributionMarginPerUnit)}; break-even units = ৳${fmtMoney(fixedV as number)} ÷ ৳${fmtMoney(result.contributionMarginPerUnit)} = ${result.breakEvenUnits} (rounded up); revenue = ${result.breakEvenUnits} × ৳${fmtMoney(priceV as number)} = ৳${fmtMoney(result.breakEvenRevenue as number)}.`,
              })}
            </p>
            <SummaryDownload filename="break-even-summary.txt" text={summary} durationSeconds={15} />
          </div>
        ) : (
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 6px', fontSize: 16 }}>
              <strong>
                {t({ bn: 'এই দামে লাভ কখনো হবে না', en: 'Profit is never possible at this price' })}
              </strong>
            </p>
            <p style={{ margin: 0, fontSize: 15 }}>
              {t({
                bn: `বিক্রির দাম ৳${fmtMoney(priceV as number)} প্রতি ইউনিটের খরচ ৳${fmtMoney(variableV as number)}-এর সমান বা কম — প্রতি ইউনিট বিক্রিতে লাভের অংশ ৳${fmtMoney(result.contributionMarginPerUnit)}। দাম বাড়ান বা খরচ কমান।`,
                en: `The selling price of ৳${fmtMoney(priceV as number)} is at or below the variable cost of ৳${fmtMoney(variableV as number)} — contribution per unit is ৳${fmtMoney(result.contributionMarginPerUnit)}. Raise the price or lower the cost.`,
              })}
            </p>
          </div>
        )
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({ bn: 'সঠিক মান দিন — কোনো মান ঋণাত্মক হতে পারবে না, ইউনিট পূর্ণসংখ্যা হতে হবে।', en: 'Enter valid values — no value can be negative, and units must be a whole number.' })}
        </p>
      ) : null}
    </section>
  );
}
