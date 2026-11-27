// Eduvelto — Calorie & TDEE Calculator tool logic
// (slug: calorie-tdee-calculator).
//
// TDEE = BMR (Mifflin-St Jeor, 1990) x activity factor. The BMR
// intermediate value is shown on the page. Shared engine:
// ./bodyMetrics. All outputs are informational estimates.
export {
  calculateTdee,
  calculateBmr,
  ACTIVITY_FACTORS,
  ACTIVITY_LABELS,
  type TdeeInput,
  type TdeeResult,
  type ActivityLevel,
  type Sex,
} from './bodyMetrics';
