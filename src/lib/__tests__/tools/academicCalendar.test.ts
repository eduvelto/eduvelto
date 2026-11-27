import { describe, it, expect } from 'vitest';
import { countAcademicEvents, sortAcademicEvents, validateAcademicEvent } from '../../tools/academicCalendar';

describe('academicCalendar', () => {
  it('sorts events by date', () => {
    const sorted = sortAcademicEvents([
      { date: '2027-06-20', title: 'Exam', type: 'exam' },
      { date: '2027-01-02', title: 'Start', type: 'event' },
    ]);
    expect(sorted.map((e) => e.date)).toEqual(['2027-01-02', '2027-06-20']);
  });
  it('counts by type', () => {
    expect(countAcademicEvents([
      { date: '2027-01-02', title: 'A', type: 'exam' },
      { date: '2027-01-03', title: 'B', type: 'holiday' },
      { date: '2027-01-04', title: 'C', type: 'exam' },
    ])).toEqual({ exam: 2, holiday: 1, event: 0 });
  });
  it('flags an invalid event', () => {
    expect(validateAcademicEvent({ date: 'not-a-date', title: '', type: 'exam' }).length).toBe(2);
  });
});
