// Eduvelto — BMI Calculator tool logic (slug: bmi-calculator).
//
// BMI = weight (kg) / height (m)^2. Categories: WHO (World Health
// Organization) BMI classification. Shared engine: ./bodyMetrics.
// All outputs are informational estimates, not medical advice.
export {
  calculateBmi,
  bmiCategory,
  weightForBmi,
  BMI_CATEGORY_LABELS,
  type BmiInput,
  type BmiResult,
  type BmiCategory,
} from './bodyMetrics';
