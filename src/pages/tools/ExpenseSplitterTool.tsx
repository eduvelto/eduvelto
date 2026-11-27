// Eduvelto — Expense Splitter tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/expenseSplitter.ts:
// equal split, split by shares (rounding drift folded into the last
// share so the parts always add up), and settle-up (a minimal
// transfer list from a greedy debtor/creditor match). No amounts
// are hardcoded — every number is the user's own. All results are
// estimates.
//
// Design (Batch 2 pattern): gradient hero, headline per-person
// share + tiles, copy buttons, an equal/shares mode switch, a
// settle-up section ("who already paid what" -> who owes whom),
// a formula with the user's own numbers, and a free summary
// download via RewardedAdButton. Opens empty — the example fills
// in only when tapped.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { settleUp, splitByShares, splitEqually } from '../../lib/tools/expenseSplitter';
import {
  buttonRowStyle,
  cardStyle,
  cellStyle,
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
  tableStyle,
  tileGridStyle,
  tileLabelStyle,
  tileStyle,
  tileValueStyle,
  useCopyText,
} from './financeUi';

/** Parse a comma-separated list of numbers; null when any part is not a number. */
function parseNumberList(raw: string): number[] | null {
  if (raw.trim() === '') return null;
  const parts = raw.split(',').map((p) => p.trim());
  if (parts.some((p) => p === '')) return null;
  const values = parts.map((p) => Number(p));
  if (values.some((v) => !Number.isFinite(v))) return null;
  return values;
}

export function ExpenseSplitterTool() {
  const { t } = useLanguage();
  const [total, setTotal] = useState('');
  const [peopleCount, setPeopleCount] = useState('3');
  const [mode, setMode] = useState<'equal' | 'shares'>('equal');
  const [sharesRaw, setSharesRaw] = useState('');
  const [paidRaw, setPaidRaw] = useState('');
  const { copied, copyText } = useCopyText();

  const totalV = parseAmount(total);
  const peopleV = parseAmount(peopleCount);
  const shares = parseNumberList(sharesRaw);
  const paid = parseNumberList(paidRaw);
  const invalid =
    [totalV, peopleV].some((v) => v !== null && v < 0) ||
    [total, peopleCount].some((raw, i) => raw.trim() !== '' && [totalV, peopleV][i] === null) ||
    (peopleV !== null && (!Number.isInteger(peopleV) || peopleV <= 0)) ||
    (sharesRaw.trim() !== '' && (shares === null || shares.some((s) => s < 0))) ||
    (paidRaw.trim() !== '' && (paid === null || paid.some((p) => p < 0)));
  const ready = !invalid && totalV !== null && peopleV !== null && Number.isInteger(peopleV) && peopleV > 0;

  const equalResult = useMemo(() => {
    if (mode !== 'equal' || !ready) return null;
    try {
      return splitEqually(totalV as number, peopleV as number);
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, ready, totalV, peopleV]);

  const sharesResult = useMemo(() => {
    if (mode !== 'shares' || !ready || !shares || shares.length === 0) return null;
    try {
      return splitByShares(totalV as number, shares);
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, ready, totalV, shares]);

  const settleResult = useMemo(() => {
    if (!ready || !paid || paid.length === 0 || paid.length !== (peopleV as number)) return null;
    try {
      return settleUp(
        paid.map((amount, i) => ({
          name: t({ bn: `ব্যক্তি ${i + 1}`, en: `Person ${i + 1}` }),
          paid: amount,
        })),
      );
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, paid, peopleV, t]);

  function loadExample(): void {
    setTotal('3000');
    setPeopleCount('3');
    setMode('equal');
    setSharesRaw('');
    setPaidRaw('3000, 1000, 0');
  }

  const headline = equalResult
    ? equalResult.perPerson
    : sharesResult
      ? sharesResult.amounts[0]
      : null;
  const summary =
    equalResult && totalV !== null
      ? t({
          bn: `খরচ ভাগাভাগি: মোট ৳${fmtMoney(totalV)} ${equalResult.peopleCount} জনের মধ্যে সমান ভাগে — জনপ্রতি ৳${fmtMoney(equalResult.perPerson)}।`,
          en: `Expense split: total ৳${fmtMoney(totalV)} split equally among ${equalResult.peopleCount} people — ৳${fmtMoney(equalResult.perPerson)} each.`,
        })
      : sharesResult && totalV !== null
        ? t({
            bn: `খরচ ভাগাভাগি (ভিন্ন ভাগে): মোট ৳${fmtMoney(totalV)} — ভাগগুলো: ${sharesResult.amounts.map((a) => `৳${fmtMoney(a)}`).join(', ')}।`,
            en: `Expense split (unequal shares): total ৳${fmtMoney(totalV)} — shares: ${sharesResult.amounts.map((a) => `৳${fmtMoney(a)}`).join(', ')}.`,
          })
        : null;

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="splitter-title">
      <FinanceHero
        titleId="splitter-title"
        titleBn="খরচ ভাগাভাগি ক্যালকুলেটর"
        titleEn="Expense Splitter"
        descBn="মোট খরচ ও কতজন ভাগ করবেন তা দিন — জনপ্রতি কত পড়বে তা দেখুন। ভিন্ন ভাগেও ভাগ করা যায়, আর কে কত দিয়েছে লিখলে কে কাকে কত দেবে তাও বের হয়ে যাবে।"
        descEn="Enter the total expense and how many people share it — see each person's share. Split in different shares too, and enter who already paid what to see who owes whom."
        trustBn="১০০% ব্রাউজারে • কোনো আপলোড নয়"
        trustEn="100% in-browser • nothing uploaded"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="splitter-total">
            {t({ bn: 'মোট খরচ', en: 'Total expense' })}
          </label>
          <input
            id="splitter-total"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            placeholder="3000"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="splitter-people">
            {t({ bn: 'কতজন', en: 'Number of people' })}
          </label>
          <input
            id="splitter-people"
            style={inputStyle}
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={peopleCount}
            onChange={(e) => setPeopleCount(e.target.value)}
          />
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--heading)', margin: '0 0 4px' }}>
          {t({ bn: 'ভাগের ধরন', en: 'Split type' })}
        </p>
        <div style={presetRowStyle} role="group" aria-label={t({ bn: 'ভাগের ধরন', en: 'Split type' })}>
          <button
            type="button"
            style={presetChipStyle(mode === 'equal')}
            aria-pressed={mode === 'equal'}
            onClick={() => setMode('equal')}
          >
            {t({ bn: 'সমান ভাগে', en: 'Equal split' })}
          </button>
          <button
            type="button"
            style={presetChipStyle(mode === 'shares')}
            aria-pressed={mode === 'shares'}
            onClick={() => setMode('shares')}
          >
            {t({ bn: 'ভিন্ন ভাগে', en: 'Different shares' })}
          </button>
        </div>
      </div>
      {mode === 'shares' ? (
        <div style={{ ...gridStyle, marginTop: 12 }}>
          <div>
            <label style={labelStyle} htmlFor="splitter-shares">
              {t({ bn: 'ভাগের অনুপাত (কমা দিয়ে, যেমন 2, 1, 1)', en: 'Share ratios (comma-separated, e.g. 2, 1, 1)' })}
            </label>
            <input
              id="splitter-shares"
              style={inputStyle}
              type="text"
              inputMode="decimal"
              value={sharesRaw}
              onChange={(e) => setSharesRaw(e.target.value)}
              placeholder="2, 1, 1"
            />
          </div>
        </div>
      ) : null}
      <div style={{ ...gridStyle, marginTop: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="splitter-paid">
            {t({ bn: 'কে কত দিয়েছে (ঐচ্ছিক, কমা দিয়ে — ব্যক্তি ১, ২, ৩ ক্রমে)', en: 'Who already paid what (optional, comma-separated — Person 1, 2, 3 in order)' })}
          </label>
          <input
            id="splitter-paid"
            style={inputStyle}
            type="text"
            inputMode="decimal"
            value={paidRaw}
            onChange={(e) => setPaidRaw(e.target.value)}
            placeholder="3000, 1000, 0"
          />
        </div>
      </div>
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: 'উদাহরণ বসান (মোট ৳৩,০০০, ৩ জন)', en: 'Load example (total ৳3,000, 3 people)' })}
        </button>
      </div>
      {settleResult ? (
        <div style={{ ...resultStyle, background: 'var(--amber-soft)' }}>
          <h3 style={{ fontSize: 16, color: 'var(--heading)', margin: '0 0 4px' }}>
            {t({ bn: 'কে কাকে দেবে', en: 'Who owes whom' })}
          </h3>
          {settleResult.transfers.length === 0 ? (
            <p style={{ margin: 0, fontSize: 15 }}>
              {t({ bn: 'সবাই নিজের ভাগ দিয়ে দিয়েছে — কেউ কাউকে কিছু দেবে না।', en: 'Everyone has already paid their share — nobody owes anybody.' })}
            </p>
          ) : (
            <table style={tableStyle}>
              <tbody>
                {settleResult.transfers.map((tr, i) => (
                  <tr key={i}>
                    <td style={cellStyle}>{tr.from} → {tr.to}</td>
                    <td style={cellStyle}>৳{fmtMoney(tr.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--muted)' }}>
            {t({
              bn: `মোট ৳${fmtMoney(settleResult.total)} — জনপ্রতি ভাগ ৳${fmtMoney(settleResult.sharePerPerson)}।`,
              en: `Total ৳${fmtMoney(settleResult.total)} — share per person ৳${fmtMoney(settleResult.sharePerPerson)}.`,
            })}
          </p>
        </div>
      ) : null}
      {equalResult || sharesResult ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>
            {mode === 'equal'
              ? t({ bn: 'জনপ্রতি — আনুমানিক', en: 'Per person — estimate' })
              : t({ bn: 'প্রথম ভাগ — আনুমানিক', en: 'First share — estimate' })}
          </p>
          <p style={headlineStyle}>৳{fmtMoney(headline as number)}</p>
          <div style={buttonRowStyle}>
            <button
              type="button"
              className="ev-btn-outline"
              onClick={() => void copyText(`৳${fmtMoney(headline as number)}`, 'share')}
            >
              {copied === 'share'
                ? t({ bn: 'কপি হয়েছে', en: 'Copied' })
                : t({ bn: 'ভাগ কপি করুন', en: 'Copy share' })}
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
              <p style={tileLabelStyle}>{t({ bn: 'মোট খরচ', en: 'Total expense' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(totalV as number)}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'কতজন', en: 'People' })}</p>
              <p style={tileValueStyle}>{mode === 'equal' ? peopleV : sharesResult?.amounts.length}</p>
            </div>
          </div>
          {sharesResult ? (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={cellStyle}>{t({ bn: 'ব্যক্তি', en: 'Person' })}</th>
                  <th style={cellStyle}>{t({ bn: 'ভাগ', en: 'Share' })}</th>
                </tr>
              </thead>
              <tbody>
                {sharesResult.amounts.map((a, i) => (
                  <tr key={i}>
                    <td style={cellStyle}>{t({ bn: `ব্যক্তি ${i + 1}`, en: `Person ${i + 1}` })}</td>
                    <td style={cellStyle}>৳{fmtMoney(a)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          <p style={formulaStyle}>
            {mode === 'equal'
              ? t({
                  bn: `সূত্র: জনপ্রতি = ৳${fmtMoney(totalV as number)} ÷ ${peopleV} = ৳${fmtMoney((equalResult as { perPerson: number }).perPerson)}।`,
                  en: `Formula: per person = ৳${fmtMoney(totalV as number)} ÷ ${peopleV} = ৳${fmtMoney((equalResult as { perPerson: number }).perPerson)}.`,
                })
              : t({
                  bn: `সূত্র: প্রতিটি ভাগ = মোট ৳${fmtMoney(totalV as number)} × (নিজের অনুপাত ÷ সব অনুপাতের যোগফল)। ভাগগুলোর যোগফল মোটের সমান হয়।`,
                  en: `Formula: each share = total ৳${fmtMoney(totalV as number)} × (own ratio ÷ sum of all ratios). The shares add up to the total exactly.`,
                })}
          </p>
          <SummaryDownload filename="expense-split-summary.txt" text={summary} durationSeconds={15} />
        </div>
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({ bn: 'সঠিক মান দিন — লোকের সংখ্যা পূর্ণসংখ্যা হতে হবে; ভাগ ও পরিশোধের তালিকায় শুধু সংখ্যা (কমা দিয়ে) দিন।', en: 'Enter valid values — the number of people must be a whole number; shares and payments take numbers only, separated by commas.' })}
        </p>
      ) : null}
    </section>
  );
}
