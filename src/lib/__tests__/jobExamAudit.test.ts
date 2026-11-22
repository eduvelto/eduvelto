/**
 * Eduvelto Job Preparation — Step 9 closure unit tests
 * (jobExamAudit.ts: audit-log doc builder + validator).
 *
 * Covers: buildMockAuditLogDoc (shape, server timestamp, detail
 * defaults to null, short machine-readable detail codes),
 * MOCK_AUDIT_EVENTS (exactly the four lifecycle events),
 * validateMockAuditLog (valid passes; unknown event / >500-char
 * detail / smuggled extra field / non-object are rejected).
 * The Firestore write itself is covered by rules tests e67–e72
 * (emulator-tests/rules-step9-full-exam.test.ts).
 */
import { describe, it, expect } from 'vitest';
import {
  buildMockAuditLogDoc,
  MOCK_AUDIT_EVENTS,
  validateMockAuditLog,
} from '../jobExamAudit';

describe('buildMockAuditLogDoc', () => {
  it('builds the full shape with a server timestamp and null detail', () => {
    const doc = buildMockAuditLogDoc({
      uid: 'student-1', event: 'mock_started', examSlug: 'bcs',
      mockId: 'full__bcs__1', sessionId: 'sess-1', bundleId: 'mock__full__bcs__1',
    });
    expect(doc.uid).toBe('student-1');
    expect(doc.event).toBe('mock_started');
    expect(doc.detail).toBeNull();
    expect(doc.createdAt).toBeDefined();
    expect(validateMockAuditLog(doc)).toEqual([]);
  });

  it('carries a short machine-readable detail code, never free text', () => {
    const doc = buildMockAuditLogDoc({
      uid: 'student-1', event: 'mock_submit_failed', examSlug: 'bcs',
      mockId: 'full__bcs__1', sessionId: 'sess-1', bundleId: 'mock__full__bcs__1',
      detail: 'key-unreadable',
    });
    expect(doc.detail).toBe('key-unreadable');
    expect(validateMockAuditLog(doc)).toEqual([]);
  });

  it('exposes exactly the four lifecycle events', () => {
    expect([...MOCK_AUDIT_EVENTS]).toEqual([
      'mock_started', 'mock_submitted', 'mock_abandoned', 'mock_submit_failed',
    ]);
  });
});

describe('validateMockAuditLog', () => {
  const valid = () => buildMockAuditLogDoc({
    uid: 'student-1', event: 'mock_submitted', examSlug: 'bcs',
    mockId: 'full__bcs__1', sessionId: 'sess-1', bundleId: 'mock__full__bcs__1',
  });

  it('rejects an unknown event', () => {
    expect(validateMockAuditLog({ ...valid(), event: 'exam_started' }).length).toBeGreaterThan(0);
  });

  it('rejects a >500-char detail', () => {
    expect(validateMockAuditLog({ ...valid(), detail: 'x'.repeat(501) }).length).toBeGreaterThan(0);
  });

  it('rejects an unknown field (no answers/scores smuggled in)', () => {
    expect(validateMockAuditLog({ ...valid(), score: 5 }).length).toBeGreaterThan(0);
  });

  it('rejects a non-object doc', () => {
    expect(validateMockAuditLog(null).length).toBeGreaterThan(0);
    expect(validateMockAuditLog('x').length).toBeGreaterThan(0);
  });
});
