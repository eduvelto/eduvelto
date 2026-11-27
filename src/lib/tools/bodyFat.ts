// Eduvelto — Body Fat Calculator tool logic
// (slug: body-fat-calculator).
//
// U.S. Navy method (Hodgdon & Beckett, Naval Health Research
// Center, 1984), all measurements in centimetres; categories per
// the American Council on Exercise (ACE). Shared engine:
// ./bodyMetrics. All outputs are informational estimates.
export {
  calculateBodyFat,
  calculateBodyFatWithWeight,
  bodyFatCategory,
  BODY_FAT_LABELS,
  type BodyFatInput,
  type BodyFatResult,
  type BodyFatCategory,
  type Sex,
} from './bodyMetrics';
