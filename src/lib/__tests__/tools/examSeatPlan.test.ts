import { describe, it, expect } from 'vitest';
import { generateSeatPlan, parseStudentNames } from '../../tools/examSeatPlan';

describe('generateSeatPlan', () => {
  it('5 students in 2x3 -> seats 1-5, capacity 6, 1 empty', () => {
    const r = generateSeatPlan(['A', 'B', 'C', 'D', 'E'], 2, 3);
    expect(r.capacity).toBe(6);
    expect(r.emptySeats).toBe(1);
    expect(r.seats[4]).toEqual({ seatNo: 5, row: 2, col: 2, student: 'E' });
  });
  it('throws when students exceed capacity', () => {
    expect(() => generateSeatPlan(['A', 'B', 'C'], 1, 2)).toThrow();
  });
});

describe('parseStudentNames', () => {
  it('splits lines and commas', () => {
    expect(parseStudentNames('Rahim\nKarim, Salma')).toEqual(['Rahim', 'Karim', 'Salma']);
  });
});
