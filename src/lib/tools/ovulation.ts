// Eduvelto — Ovulation Calculator tool logic
// (slug: ovulation-calculator).
//
// Cycle math: ovulation about 14 days before the next period;
// fertile window 5 days before ovulation to 1 day after. An
// estimate only — NOT medical advice; the tool page carries that
// disclaimer in bn+en. Shared engine: ./healthDates.
export {
  calculateOvulation,
  type OvulationResult,
} from './healthDates';
