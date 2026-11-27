// Eduvelto — Heart Rate Zone Calculator tool logic
// (slug: heart-rate-zone-calculator).
//
// Karvonen formula (Karvonen et al., 1957) with HRmax = 220 - age
// (Fox et al. estimate). Shared engine: ./bodyMetrics. All outputs
// are informational estimates, not medical advice.
export {
  calculateHeartRateZones,
  type HeartRateZone,
  type HeartRateResult,
} from './bodyMetrics';
