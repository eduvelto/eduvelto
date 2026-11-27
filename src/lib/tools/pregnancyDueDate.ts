// Eduvelto — Pregnancy Due Date Calculator tool logic
// (slug: pregnancy-due-date-calculator).
//
// Naegele's rule: last menstrual period + 280 days (40 weeks).
// Standard obstetric estimate — NOT medical advice; the tool page
// carries that disclaimer in bn+en. Shared engine: ./healthDates.
export {
  calculateDueDate,
  gestationalAge,
  type DueDateResult,
} from './healthDates';
