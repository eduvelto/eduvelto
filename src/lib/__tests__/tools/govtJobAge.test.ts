import { describe, it, expect } from 'vitest';
import { GOVT_JOB_AGE_REFERENCE, checkGovtJobAge } from '../../tools/govtJobAge';

describe('checkGovtJobAge', () => {
  it('DOB 2000-01-15 at 2026-11-27, limit 30 -> 26y, eligible, 4 years left', () => {
    const r = checkGovtJobAge('2000-01-15', 30, new Date(2026, 10, 27));
    expect(r.age.years).toBe(26);
    expect(r.eligible).toBe(true);
    expect(r.yearsLeft).toBe(4);
  });
  it('over the limit is not eligible', () => {
    expect(checkGovtJobAge('1990-01-01', 30, new Date(2026, 10, 27)).eligible).toBe(false);
  });
  it('reference data notes general 30 and quota 32 with a date', () => {
    expect(GOVT_JOB_AGE_REFERENCE.general).toBe(30);
    expect(GOVT_JOB_AGE_REFERENCE.freedomFighterQuota).toBe(32);
    expect(GOVT_JOB_AGE_REFERENCE.notedDate).toBe('2026-11-27');
  });
});
