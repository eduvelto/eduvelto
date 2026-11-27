// Eduvelto — Macro Nutrient Calculator tool logic
// (slug: macro-nutrient-calculator).
//
// Macros from TDEE: protein and carbohydrate 4 kcal/g, fat 9 kcal/g.
// Splits are common published starting splits (maintain 30/40/30,
// lose 35/35/30, gain 25/45/30), shown as editable presets — not a
// prescription. Shared engine: ./bodyMetrics. The TDEE itself comes
// from the same BMR -> TDEE chain, so the numbers agree with the
// TDEE tool. All outputs are informational estimates.
export {
  calculateMacros,
  calculateTdee,
  MACRO_SPLITS,
  type MacroGoal,
  type MacroResult,
  type TdeeInput,
} from './bodyMetrics';
