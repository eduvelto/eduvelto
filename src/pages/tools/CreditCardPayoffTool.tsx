// Eduvelto — Credit Card Payoff Calculator tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/creditCardPayoff.ts: a
// month-by-month simulation. When the monthly payment does not cover
// one month's interest, the tool says payoff is impossible instead
// of showing a meaningless number. The APR is USER-ENTERED with an
// example starting value only — no card rate is stated as a fact.
// All results are labelled আনুমানিক (estimated).
//
// Design (Batch 2 pattern): gradient hero, headline months + tiles,
// copy buttons, a reverse mode ("pay off in N months — what payment?"),
// a formula with the user's own numbers, and a free summary download
// via RewardedAdButton. Opens empty — the example fills in only
// when tapped.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { calculateCreditCardPayoff, requiredMonthlyPayment } from '../../lib/tools/creditCardPayoff';
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

export function CreditCardPayoffTool() {
  const { t } = useLanguage();
  const [balance, setBalance] = useState('');
  const [apr, setApr] = useState('24');
  const [payment, setPayment] = useState('');
  const [targetMonths, setTargetMonths] = useState('');
  const { copied, copyText } = useCopyText();

  const balanceV = parseAmount(balance);
  const aprV = parseAmount(apr);
  const paymentV = parseAmount(payment);
  const targetMonthsV = parseAmount(targetMonths);
  const invalid =
    [balanceV, aprV, paymentV, targetMonthsV].some((v) => v !== null && v < 0) ||
    [balance, apr, payment, targetMonths].some(
      (raw, i) => raw.trim() !== '' && [balanceV, aprV, paymentV, targetMonthsV][i] === null,
    ) ||
    (targetMonthsV !== null && (!Number.isInteger(targetMonthsV) || targetMonthsV <= 0));
  const ready = !invalid && balanceV !== null && aprV !== null && paymentV !== null;

  const result = useMemo(() => {
    if (!ready) return null;
    try {
      return calculateCreditCardPayoff({
        balance: balanceV as number,
        annualRatePercent: aprV as number,
        monthlyPayment: paymentV as number,
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, balanceV, aprV, paymentV]);

  const reverse =
    balanceV !== null &&
    aprV !== null &&
    aprV >= 0 &&
    targetMonthsV !== null &&
    Number.isInteger(targetMonthsV) &&
    targetMonthsV > 0 &&
    !invalid
      ? (() => {
          try {
            return requiredMonthlyPayment({
              balance: balanceV,
              annualRatePercent: aprV,
              months: targetMonthsV,
            });
          } catch {
            return null;
          }
        })()
      : null;

  function loadExample(): void {
    setBalance('100000');
    setApr('24');
    setPayment('5000');
  }

  const summary =
    result && result.payoffPossible
      ? t({
          bn: `ক্রেডিট কার্ড পরিশোধ (আনুমানিক): বকেয়া ৳${fmtMoney(balanceV as number)}, APR ${aprV}%, মাসে ৳${fmtMoney(paymentV as number)} করে দিলে ${result.months} মাসে শোধ হবে। মোট দিতে হবে ৳${fmtMoney(result.totalPaid)}, সুদ ৳${fmtMoney(result.totalInterest)}।`,
          en: `Credit card payoff (estimate): balance ৳${fmtMoney(balanceV as number)}, APR ${aprV}%, paying ৳${fmtMoney(paymentV as number)}/month clears it in ${result.months} months. Total paid ৳${fmtMoney(result.totalPaid)}, interest ৳${fmtMoney(result.totalInterest)}.`,
        })
      : null;

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="credit-card-title">
      <FinanceHero
        titleId="credit-card-title"
        titleBn="ক্রেডিট কার্ড পরিশোধ ক্যালকুলেটর"
        titleEn="Credit Card Payoff Calculator"
        descBn="বকেয়া, APR ও মাসিক পরিশোধ দিন — কত মাসে কার্ড শোধ হবে ও কত সুদ দিতে হবে তা দেখুন। শুধু ন্যূনতম পরিমাণ দিলে সুদ অনেক বেড়ে যায়। সব হিসাব আনুমানিক।"
        descEn="Enter the balance, APR and monthly payment — see how many months it takes to clear the card and how much interest it costs. Paying only the minimum makes the interest much bigger. All figures are estimates."
        trustBn="১০০% ব্রাউজারে • কোনো আপলোড নয়"
        trustEn="100% in-browser • nothing uploaded"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="credit-card-balance">
            {t({ bn: 'বকেয়া', en: 'Card balance' })}
          </label>
          <input
            id="credit-card-balance"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="100000"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="credit-card-apr">
            {t({ bn: 'বার্ষিক সুদের হার / APR (%) — উদাহরণ মান', en: 'Annual rate / APR (%) — example value' })}
          </label>
          <input
            id="credit-card-apr"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={apr}
            onChange={(e) => setApr(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="credit-card-payment">
            {t({ bn: 'মাসিক পরিশোধ', en: 'Monthly payment' })}
          </label>
          <input
            id="credit-card-payment"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
            placeholder="5000"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="credit-card-target-months">
            {t({ bn: 'উল্টো হিসাব — কত মাসে শোধ করতে চান? (ঐচ্ছিক)', en: 'Reverse — pay off in how many months? (optional)' })}
          </label>
          <input
            id="credit-card-target-months"
            style={inputStyle}
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={targetMonths}
            onChange={(e) => setTargetMonths(e.target.value)}
            placeholder="12"
          />
        </div>
      </div>
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: 'উদাহরণ বসান (বকেয়া ৳১ লাখ, APR ২৪%, মাসে ৳৫,০০০)', en: 'Load example (balance ৳100,000, APR 24%, ৳5,000/month)' })}
        </button>
      </div>
      {reverse !== null && targetMonthsV !== null ? (
        <div style={{ ...resultStyle, background: 'var(--amber-soft)' }}>
          <p style={{ margin: 0, fontSize: 15 }}>
            {t({
              bn: `${targetMonthsV} মাসে শোধ করতে প্রতি মাসে ৳${fmtMoney(reverse)} করে দিতে হবে (আনুমানিক)।`,
              en: `To clear it in ${targetMonthsV} months, pay ৳${fmtMoney(reverse)} every month (estimate).`,
            })}
          </p>
        </div>
      ) : null}
      {result ? (
        result.payoffPossible ? (
          <div style={resultStyle} role="status">
            <p style={headlineLabelStyle}>{t({ bn: 'শোধ হতে লাগবে — আনুমানিক', en: 'Time to pay off — estimate' })}</p>
            <p style={headlineStyle}>
              {result.months} {t({ bn: 'মাস', en: 'months' })}
            </p>
            <div style={buttonRowStyle}>
              <button
                type="button"
                className="ev-btn-outline"
                onClick={() => void copyText(`${result.months}`, 'months')}
              >
                {copied === 'months'
                  ? t({ bn: 'কপি হয়েছে', en: 'Copied' })
                  : t({ bn: 'মাস কপি করুন', en: 'Copy months' })}
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
                <p style={tileLabelStyle}>{t({ bn: 'মোট পরিশোধ', en: 'Total paid' })}</p>
                <p style={tileValueStyle}>৳{fmtMoney(result.totalPaid)}</p>
              </div>
              <div style={tileStyle}>
                <p style={tileLabelStyle}>{t({ bn: 'মোট সুদ', en: 'Total interest' })}</p>
                <p style={tileValueStyle}>৳{fmtMoney(result.totalInterest)}</p>
              </div>
              <div style={tileStyle}>
                <p style={tileLabelStyle}>{t({ bn: 'প্রথম মাসের সুদ', en: 'First month interest' })}</p>
                <p style={tileValueStyle}>৳{fmtMoney(result.firstMonthInterest)}</p>
              </div>
            </div>
            <p style={formulaStyle}>
              {t({
                bn: `সূত্র: মাসিক হার = ${aprV}% ÷ ১২; প্রথম মাসের সুদ = ৳${fmtMoney(balanceV as number)} × মাসিক হার = ৳${fmtMoney(result.firstMonthInterest)}। প্রতি মাসে সুদ যোগ হয়ে ৳${fmtMoney(paymentV as number)} পরিশোধ ধরা হয়েছে — শেষ মাসের পরিশোধ বাকি টাকার সমান।`,
                en: `Formula: monthly rate = ${aprV}% ÷ 12; first-month interest = ৳${fmtMoney(balanceV as number)} × monthly rate = ৳${fmtMoney(result.firstMonthInterest)}. Each month interest is added and ৳${fmtMoney(paymentV as number)} is paid — the last payment equals the remaining balance.`,
              })}
            </p>
            <p style={formulaStyle}>
              {t({
                bn: 'APR-টি উদাহরণ মাত্র — কার্ডের আসল হার ব্যাংকভেদে আলাদা। নিজের কার্ডের বর্তমান হার স্টেটমেন্টে যাচাই করুন। তথ্য: 27 Nov 2026।',
                en: 'The APR is an example only — the real rate differs by card and bank. Check your own card statement for the current rate. Noted: 27 Nov 2026.',
              })}
            </p>
            <SummaryDownload filename="credit-card-payoff-summary.txt" text={summary} durationSeconds={15} />
          </div>
        ) : (
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 6px', fontSize: 16 }}>
              <strong>
                {t({ bn: 'এই পরিশোধে কার্ড কখনো শোধ হবে না', en: 'This payment will never clear the card' })}
              </strong>
            </p>
            <p style={{ margin: 0, fontSize: 15 }}>
              {t({
                bn: `প্রথম মাসের সুদই ৳${fmtMoney(result.firstMonthInterest)} — আপনার মাসিক পরিশোধ ৳${fmtMoney(paymentV as number)} তার চেয়ে কম, তাই বকেয়া কমার বদলে বাড়বে। পরিশোধ বাড়ান (প্রথম মাসের সুদের চেয়ে বেশি হতে হবে)।`,
                en: `The first month's interest alone is ৳${fmtMoney(result.firstMonthInterest)} — your monthly payment of ৳${fmtMoney(paymentV as number)} is smaller, so the balance grows instead of shrinking. Raise the payment (it must be above the first month's interest).`,
              })}
            </p>
          </div>
        )
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({ bn: 'সঠিক মান দিন — কোনো মান ঋণাত্মক হতে পারবে না, মাস পূর্ণসংখ্যা হতে হবে।', en: 'Enter valid values — no value can be negative, and months must be a whole number.' })}
        </p>
      ) : null}
    </section>
  );
}
