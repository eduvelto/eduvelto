import { describe, it, expect } from 'vitest';
import { buildRoutine, formatRoutineHour } from '../../tools/studyRoutine';

describe('buildRoutine', () => {
  it('2 subjects x 3h over 3 days -> 6 slots of 60 min, 6h/week', () => {
    const r = buildRoutine(
      [{ name: 'Bangla', hoursPerWeek: 3 }, { name: 'English', hoursPerWeek: 3 }],
      ['Saturday', 'Sunday', 'Monday'], 16,
    );
    expect(r.slots.length).toBe(6);
    expect(r.totalHoursPerWeek).toBe(6);
    expect(r.totalMinutesPerDay).toBe(120);
    expect(r.slots[0]).toEqual({ day: 'Saturday', subject: 'Bangla', startHour: 16, durationMin: 60 });
  });
  it('throws with no subjects or no days', () => {
    expect(() => buildRoutine([], ['Saturday'], 16)).toThrow();
    expect(() => buildRoutine([{ name: 'Bangla', hoursPerWeek: 3 }], [], 16)).toThrow();
  });
});

describe('formatRoutineHour', () => {
  it('16.5 -> 16:30', () => expect(formatRoutineHour(16.5)).toBe('16:30'));
  it('9 -> 09:00', () => expect(formatRoutineHour(9)).toBe('09:00'));
});
