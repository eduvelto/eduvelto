import { describe, it, expect } from 'vitest';
import { calculateAttendance } from '../../tools/attendance';

describe('calculateAttendance', () => {
  it('60/80 = 75%, target 75 -> needed 0, can miss 0', () => {
    expect(calculateAttendance(60, 80, 75)).toEqual(
      { attended: 60, total: 80, percentage: 75, classesNeeded: 0, classesCanMiss: 0, target: 75 },
    );
  });
  it('70/100 = 70%, target 75 -> 20 more classes needed', () => {
    expect(calculateAttendance(70, 100, 75).classesNeeded).toBe(20);
  });
  it('80/100 = 80%, target 75 -> can miss 6 classes', () => {
    expect(calculateAttendance(80, 100, 75).classesCanMiss).toBe(6);
  });
  it('throws when attended exceeds total', () => {
    expect(() => calculateAttendance(90, 80)).toThrow();
  });
});
