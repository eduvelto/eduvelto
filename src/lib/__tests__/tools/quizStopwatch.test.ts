import { describe, it, expect } from 'vitest';
import { describeLaps, formatStopwatch } from '../../tools/quizStopwatch';

describe('quizStopwatch', () => {
  it('describes laps with split and duration', () => {
    expect(describeLaps([60000, 150000])).toEqual([
      { lap: 1, split: '01:00.0', duration: '01:00.0' },
      { lap: 2, split: '02:30.0', duration: '01:30.0' },
    ]);
  });
  it('formatStopwatch(61500) = 01:01.5', () => expect(formatStopwatch(61500)).toBe('01:01.5'));
});
