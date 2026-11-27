// Pace & Speed Calculator — unit tests. Every expected value is hand-computed.
import { describe, it, expect } from 'vitest';
import { calculatePace, paceForTarget, timeForPace } from '../../tools/paceSpeed';

describe('calculatePace', () => {
  it('5 km in 30:00 -> pace 6:00 /km, speed 10 km/h', () => {
    expect(calculatePace({ distanceKm: 5, hours: 0, minutes: 30, seconds: 0 })).toEqual({
      totalMinutes: 30,
      paceMinPerKm: 6,
      paceFormatted: '6:00',
      speedKmh: 10,
      speedMs: 2.78,
    });
  });

  it('10 km in 55:00 -> pace 5:30 /km, speed 10.91 km/h', () => {
    // 55 / 10 = 5.5 min/km; 10 / (55/60) = 10.91 km/h.
    const result = calculatePace({ distanceKm: 10, hours: 0, minutes: 55, seconds: 0 });
    expect(result.paceMinPerKm).toBe(5.5);
    expect(result.paceFormatted).toBe('5:30');
    expect(result.speedKmh).toBe(10.91);
  });

  it('reverse: 5 km in 25 min needs 5:00 /km (12 km/h)', () => {
    expect(paceForTarget(5, 25).paceFormatted).toBe('5:00');
    expect(paceForTarget(5, 25).speedKmh).toBe(12);
  });

  it('what-if: 10 km at 6:00 /km takes 60 minutes', () => {
    expect(timeForPace(10, 6)).toBe(60);
  });

  it('rejects zero distance and zero time', () => {
    expect(() => calculatePace({ distanceKm: 0, hours: 0, minutes: 30, seconds: 0 })).toThrow(/distanceKm/);
    expect(() => calculatePace({ distanceKm: 5, hours: 0, minutes: 0, seconds: 0 })).toThrow(/time/);
  });
});
