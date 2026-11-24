/**
 * Eduvelto Job Preparation — typing simulator unit tests
 * (design-grades-written-previous-admin.md §7 step 5).
 */
import { describe, it, expect } from 'vitest';
import {
  scoreTyping,
  typingPassagesFor,
  typingPassageById,
  weekKeyFor,
  typingMilestoneFor,
  TYPING_SIMULATOR_NOTICE,
  TYPING_PASSAGES_BN,
  TYPING_PASSAGES_EN,
} from '../jobTypingPassages';

describe('typing passages (§1.8 — original sentences only)', () => {
  it('has 6 Bangla + 6 English passages, 2 per level', () => {
    expect(TYPING_PASSAGES_BN).toHaveLength(6);
    expect(TYPING_PASSAGES_EN).toHaveLength(6);
    for (const lang of ['bn', 'en'] as const) {
      for (const level of [1, 2, 3] as const) {
        expect(typingPassagesFor(lang, level)).toHaveLength(2);
      }
    }
  });

  it('passage ids are unique and stable', () => {
    const ids = [...TYPING_PASSAGES_BN, ...TYPING_PASSAGES_EN].map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(typingPassageById('bn-l1-01')?.lang).toBe('bn');
    expect(typingPassageById('en-l3-02')?.lang).toBe('en');
    expect(typingPassageById('no-such')).toBeUndefined();
  });

  it('passages carry no "from the paper" claim and no source citation', () => {
    for (const p of [...TYPING_PASSAGES_BN, ...TYPING_PASSAGES_EN]) {
      expect(p.text.length).toBeGreaterThan(20);
      expect(p.text).not.toMatch(/পরীক্ষার প্রশ্ন|from the (real )?exam/i);
    }
  });

  it('honest framing notice is exact', () => {
    expect(TYPING_SIMULATOR_NOTICE.bn).toBe(
      'টাইপিং অনুশীলন — কর্তৃপক্ষের ব্যবহারিক পরীক্ষার হুবহু নকল নয়',
    );
    expect(TYPING_SIMULATOR_NOTICE.en).toBe(
      'Typing practice — not an exact replica of the authority’s practical test',
    );
  });
});

describe('scoreTyping (WPM / accuracy / errors)', () => {
  it('perfect typing: 100% accuracy, 0 errors', () => {
    const text = 'Hello world, this is a test.';
    const s = scoreTyping({ passageText: text, typedText: text, elapsedSeconds: 60 });
    expect(s.accuracy).toBe(100);
    expect(s.errors).toBe(0);
    expect(s.correctChars).toBe(text.length);
    expect(s.typedChars).toBe(text.length);
    expect(s.wpm).toBe(Math.round((text.length / 5) * 10) / 10);
  });

  it('one wrong char counts one error and lowers accuracy', () => {
    const s = scoreTyping({ passageText: 'abcd', typedText: 'abxd', elapsedSeconds: 60 });
    expect(s.errors).toBe(1);
    expect(s.correctChars).toBe(3);
    expect(s.accuracy).toBe(75);
  });

  it('WPM scales with time (half the time, double the WPM)', () => {
    const fast = scoreTyping({ passageText: 'abcdefghij', typedText: 'abcdefghij', elapsedSeconds: 30 });
    const slow = scoreTyping({ passageText: 'abcdefghij', typedText: 'abcdefghij', elapsedSeconds: 60 });
    expect(fast.wpm).toBe(slow.wpm * 2);
  });

  it('empty input: accuracy 100, wpm 0, no errors', () => {
    const s = scoreTyping({ passageText: 'abc', typedText: '', elapsedSeconds: 60 });
    expect(s.accuracy).toBe(100);
    expect(s.wpm).toBe(0);
    expect(s.errors).toBe(0);
  });
});

describe('milestones (§1.8 — only best-WPM-per-week is storable)', () => {
  it('weekKeyFor groups Monday–Sunday', () => {
    // 2026-11-23 is a Monday; 2026-11-24 (Tue) and 2026-11-29 (Sun)
    // share its week, 2026-11-30 (Mon) starts a new one.
    expect(weekKeyFor(new Date('2026-11-24T10:00:00+06:00'))).toBe('2026-11-23');
    expect(weekKeyFor(new Date('2026-11-29T10:00:00+06:00'))).toBe('2026-11-23');
    expect(weekKeyFor(new Date('2026-11-30T10:00:00+06:00'))).toBe('2026-11-30');
  });

  it('typingMilestoneFor carries lang + passage + wpm + accuracy + week', () => {
    const m = typingMilestoneFor({
      lang: 'bn',
      passageId: 'bn-l1-01',
      score: { wpm: 22, accuracy: 96.5, errors: 2, correctChars: 100, typedChars: 102 },
      at: new Date('2026-11-24T10:00:00+06:00'),
    });
    expect(m).toEqual({ lang: 'bn', passageId: 'bn-l1-01', wpm: 22, accuracy: 96.5, weekKey: '2026-11-23' });
  });
});
