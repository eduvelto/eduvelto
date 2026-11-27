// Eduvelto — Owner Summary (Worker G, 27 Nov 2026) unit tests.
//
// Covers only what is provable without Firestore: the Dhaka calendar
// month window, the backup staleness bands, and the last-verified
// backup snapshot values. `getOwnerSummary` (live reads) is tested
// against the emulator, not here.
//
// Run with `npm run test:unit`.
import { describe, it, expect } from 'vitest';
import {
  LAST_VERIFIED_BACKUP,
  backupStaleness,
  dhakaMonthWindow,
} from '../ceo';

describe('dhakaMonthWindow', () => {
  it('returns the November 2026 Dhaka calendar month for a November date', () => {
    const w = dhakaMonthWindow(new Date('2026-11-27T15:31:00+06:00'));
    // 1 Nov 00:00 Dhaka = 31 Oct 18:00 UTC; 1 Dec 00:00 Dhaka = 30 Nov 18:00 UTC.
    expect(w.start.toISOString()).toBe('2026-10-31T18:00:00.000Z');
    expect(w.end.toISOString()).toBe('2026-11-30T18:00:00.000Z');
    expect(w.labelEn).toBe('November 2026');
    expect(w.labelBn).toContain('২০২৬');
  });

  it('uses the Dhaka wall date, not the UTC date', () => {
    // 1 Nov 00:30 Dhaka is still 31 Oct in UTC — the month is November.
    const w = dhakaMonthWindow(new Date('2026-11-01T00:30:00+06:00'));
    expect(w.labelEn).toBe('November 2026');
    expect(w.start.toISOString()).toBe('2026-10-31T18:00:00.000Z');
  });

  it('rolls over to December for a 1 Dec Dhaka date', () => {
    const w = dhakaMonthWindow(new Date('2026-12-01T00:30:00+06:00'));
    expect(w.labelEn).toBe('December 2026');
    expect(w.start.toISOString()).toBe('2026-11-30T18:00:00.000Z');
    expect(w.end.toISOString()).toBe('2026-12-31T18:00:00.000Z');
  });
});

describe('backupStaleness', () => {
  it('is ok under 24h, due at 24–36h, overdue past 36h', () => {
    expect(backupStaleness(0)).toBe('ok');
    expect(backupStaleness(23.9)).toBe('ok');
    expect(backupStaleness(24)).toBe('due');
    expect(backupStaleness(36)).toBe('due');
    expect(backupStaleness(36.1)).toBe('overdue');
    expect(backupStaleness(100)).toBe('overdue');
  });
});

describe('LAST_VERIFIED_BACKUP', () => {
  it('holds the 26 Nov 2026 14:27 Dhaka success snapshot', () => {
    expect(LAST_VERIFIED_BACKUP.lastSuccessAtDhaka).toBe('2026-11-26 14:27');
    expect(LAST_VERIFIED_BACKUP.lastSuccessDocs).toBe(7120);
    expect(LAST_VERIFIED_BACKUP.lastSuccessBytes).toBe(57_006_419);
    expect(LAST_VERIFIED_BACKUP.lastSuccessVerify).toBe('metadata-ok, download-sha-ok, decrypt-check-ok');
    expect(LAST_VERIFIED_BACKUP.restoreTested).toBe(false);
  });

  it('records the 24–26 Nov HTTP 429 failures, newest first', () => {
    expect(LAST_VERIFIED_BACKUP.failuresSince).toHaveLength(6);
    expect(LAST_VERIFIED_BACKUP.failuresSince[0]?.atDhaka).toBe('2026-11-26 00:05:53');
    for (const f of LAST_VERIFIED_BACKUP.failuresSince) {
      expect(f.error).toContain('HTTP 429');
    }
    expect(LAST_VERIFIED_BACKUP.previousSuccessAtDhaka).toBe('2026-11-24 08:11');
    expect(LAST_VERIFIED_BACKUP.previousSuccessDocs).toBe(7105);
  });
});
