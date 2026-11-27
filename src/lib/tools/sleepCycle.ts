// Eduvelto — Sleep Cycle Calculator tool logic
// (slug: sleep-cycle-calculator).
//
// One sleep cycle is about 90 minutes, plus about 15 minutes to
// fall asleep. Shared engine: ./healthDates. All outputs are
// informational estimates.
export {
  bedtimesForWake,
  wakeTimesForBed,
  parseClockTime,
  formatClockTime,
  type SleepOption,
} from './healthDates';
