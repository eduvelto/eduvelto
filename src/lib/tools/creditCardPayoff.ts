/**
 * Credit Card Payoff Calculator — pure logic.
 *
 * Simulates month-by-month payoff: each month interest is added at
 * the monthly rate (APR / 100 / 12), then the fixed monthly payment
 * is subtracted. The last payment is the remaining balance, so the
 * total paid is exact, not months x payment.
 *
 * When the monthly payment does not even cover one month's interest,
 * the balance never falls — payoff is impossible and the result says
 * so instead of looping forever (capped at 1,200 months / 100 years).
 *
 * The APR is USER-ENTERED — no card rate is hardcoded. All money
 * results are estimates, rounded to 2 decimals.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

export interface CreditCardPayoffInput {
  /** Outstanding card balance. */
  balance: number;
  /** Annual percentage rate in percent (user-entered). */
  annualRatePercent: number;
  /** Fixed amount paid every month. */
  monthlyPayment: number;
}

export interface CreditCardPayoffResult {
  /** False when the payment never covers a month's interest. */
  payoffPossible: boolean;
  /** Whole months until the card is clear (null when impossible). */
  months: number | null;
  /** Total actually paid, including the smaller final payment. */
  totalPaid: number;
  /** Total interest paid. */
  totalInterest: number;
  /** Interest charged in the first month (the hurdle the payment must clear). */
  firstMonthInterest: number;
}

export interface RequiredPaymentInput {
  /** Outstanding card balance. */
  balance: number;
  /** Annual percentage rate in percent (user-entered). */
  annualRatePercent: number;
  /** Target payoff time in whole months. */
  months: number;
}

const MAX_MONTHS = 1200;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Simulate the payoff.
 *
 * Hand-check: balance 100,000, APR 24%, payment 5,000/month ->
 * monthly rate 0.02, first-month interest 2,000 (payment clears it);
 * simulation pays off in 26 months, total paid 128,987.28, interest
 * 28,987.28. (Exact figures come from the simulation; the test
 * asserts the simulated values.)
 * Impossible case: balance 100,000 at 24%, payment 1,500/month ->
 * first-month interest 2,000 > payment -> payoffPossible false.
 * At 0% APR: balance 60,000, payment 5,000 -> 12 months, interest 0.
 */
export function calculateCreditCardPayoff(input: CreditCardPayoffInput): CreditCardPayoffResult {
  if (!Number.isFinite(input.balance) || input.balance < 0) {
    throw new Error(`balance must be a finite number >= 0, got ${input.balance}`);
  }
  if (!Number.isFinite(input.annualRatePercent) || input.annualRatePercent < 0) {
    throw new Error(`annualRatePercent must be a finite number >= 0, got ${input.annualRatePercent}`);
  }
  if (!Number.isFinite(input.monthlyPayment) || input.monthlyPayment < 0) {
    throw new Error(`monthlyPayment must be a finite number >= 0, got ${input.monthlyPayment}`);
  }
  const monthlyRate = input.annualRatePercent / 100 / 12;
  const firstMonthInterest = roundMoney(input.balance * monthlyRate);
  if (input.balance === 0) {
    return { payoffPossible: true, months: 0, totalPaid: 0, totalInterest: 0, firstMonthInterest: 0 };
  }
  if (input.monthlyPayment <= 0 || input.monthlyPayment <= input.balance * monthlyRate) {
    return {
      payoffPossible: false,
      months: null,
      totalPaid: 0,
      totalInterest: 0,
      firstMonthInterest,
    };
  }
  let balance = input.balance;
  let totalPaid = 0;
  let months = 0;
  while (balance > 0 && months < MAX_MONTHS) {
    const interest = balance * monthlyRate;
    balance += interest;
    const payment = Math.min(input.monthlyPayment, balance);
    balance -= payment;
    totalPaid += payment;
    months += 1;
  }
  if (balance > 0.005) {
    return { payoffPossible: false, months: null, totalPaid: 0, totalInterest: 0, firstMonthInterest };
  }
  return {
    payoffPossible: true,
    months,
    totalPaid: roundMoney(totalPaid),
    totalInterest: roundMoney(totalPaid - input.balance),
    firstMonthInterest,
  };
}

/**
 * Reverse: the fixed monthly payment that clears `balance` in
 * exactly `months` at `annualRatePercent` (the EMI formula).
 *
 * Hand-check: balance 100,000, 24% APR, 12 months -> r = 0.02,
 * (1.02)^12 = 1.268242; payment = 100000 x 0.02 x 1.268242 /
 * 0.268242 = 9,455.96.
 * At 0%: balance 60,000 / 12 months -> 5,000.
 */
export function requiredMonthlyPayment(input: RequiredPaymentInput): number {
  if (!Number.isFinite(input.balance) || input.balance < 0) {
    throw new Error(`balance must be a finite number >= 0, got ${input.balance}`);
  }
  if (!Number.isFinite(input.annualRatePercent) || input.annualRatePercent < 0) {
    throw new Error(`annualRatePercent must be a finite number >= 0, got ${input.annualRatePercent}`);
  }
  if (!Number.isFinite(input.months) || input.months <= 0 || !Number.isInteger(input.months)) {
    throw new Error(`months must be a positive integer, got ${input.months}`);
  }
  const r = input.annualRatePercent / 100 / 12;
  if (r === 0) return roundMoney(input.balance / input.months);
  const factor = Math.pow(1 + r, input.months);
  return roundMoney((input.balance * r * factor) / (factor - 1));
}
