// Eduvelto — Pace & Speed Calculator tool logic
// (slug: pace-speed-calculator).
//
// Pace (min/km) = time / distance; speed (km/h) = distance / time.
// Shared engine: ./bodyMetrics. All outputs are informational
// estimates.
export {
  calculatePace,
  paceForTarget,
  timeForPace,
  formatPace,
  type PaceInput,
  type PaceResult,
} from './bodyMetrics';
