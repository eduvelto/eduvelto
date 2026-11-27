// Eduvelto — Water Intake Calculator tool logic
// (slug: water-intake-calculator).
//
// Weight-based guidance: 30-40 ml per kg per day; recommended
// 35 ml/kg plus about 350 ml per 30 minutes of exercise and
// 500 ml extra on hot days. Shared engine: ./bodyMetrics.
// All outputs are informational estimates, not medical advice.
export {
  calculateWaterIntake,
  type WaterInput,
  type WaterResult,
} from './bodyMetrics';
