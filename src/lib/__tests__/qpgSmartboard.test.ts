// Question Paper Generator Phase 2 — Smartboard model tests.
// Own Canvas 2D implementation (no Excalidraw): slides, answers,
// annotations, timer, debounced autosave.
import { describe, it, expect, vi } from 'vitest';
import {
  addBoardAnnotation,
  blankBoardSlide,
  boardTimerSeconds,
  buildBoardSlides,
  clearBoardAnnotations,
  createDebouncedBoardSaver,
  formatBoardTimer,
  newBoardAnnotationId,
  QPG_BOARD_DEFAULT_TIMER_MINUTES,
  QPG_BOARD_TIMER_OPTIONS,
  removeBoardAnnotation,
  toggleBoardAnswer,
  undoBoardAnnotation,
  validateQpgBoard,
} from '../qpgSmartboard';
import { buildQpgPaper, defaultPaperSetup, QPG_VERIFIED_POOL } from '../questionPaper';

function samplePaper() {
  const setup = defaultPaperSetup({
    title: 'টেস্ট পেপার',
    subject: 'English',
    classLabel: 'অনার্স',
    questionCount: 2,
    marksPerQuestion: 1,
    timeMinutes: 60,
    sectionHeading: 'ক-বিভাগ',
  });
  return buildQpgPaper({
    setup,
    questions: QPG_VERIFIED_POOL.slice(0, 2),
    isCustomVariant: false,
    kind: 'chapter-paper',
    patternLabelBn: 'টেস্ট',
    patternLabelEn: 'Test',
  });
}

describe('buildBoardSlides', () => {
  it('separate-slides: one slide per question, answers hidden', () => {
    const slides = buildBoardSlides(samplePaper(), 'separate');
    expect(slides).toHaveLength(2);
    expect(slides[0].questionId).toBe(QPG_VERIFIED_POOL[0].id);
    expect(slides[0].showAnswer).toBe(false);
    expect(slides[0].correctLetter).toBe(QPG_VERIFIED_POOL[0].correctLetter);
    expect(slides[0].annotations).toEqual([]);
  });

  it('whole-paper: a single slide carrying the full paper text + key', () => {
    const slides = buildBoardSlides(samplePaper(), 'whole-paper');
    expect(slides).toHaveLength(1);
    expect(slides[0].questionId).toBeNull();
    expect(slides[0].questionText).toContain('1.');
    expect(slides[0].questionText).toContain('2.');
    expect(slides[0].explanation).toContain('উত্তরমালা');
  });

  it('blank slides carry no question', () => {
    const s = blankBoardSlide(1);
    expect(s.questionId).toBeNull();
    expect(s.questionText).toBe('');
  });
});

describe('answer toggle + annotations', () => {
  it('toggleBoardAnswer flips showAnswer only', () => {
    const slide = buildBoardSlides(samplePaper(), 'separate')[0];
    const shown = toggleBoardAnswer(slide);
    expect(shown.showAnswer).toBe(true);
    expect(toggleBoardAnswer(shown).showAnswer).toBe(false);
    expect(shown.questionText).toBe(slide.questionText);
  });

  it('add / remove / undo / clear annotations', () => {
    const slide = buildBoardSlides(samplePaper(), 'separate')[0];
    const ann = { kind: 'stroke' as const, id: newBoardAnnotationId(), points: [{ x: 1, y: 2 }], color: '#14532d', width: 3 };
    const withOne = addBoardAnnotation(slide, ann);
    expect(withOne.annotations).toHaveLength(1);
    expect(undoBoardAnnotation(withOne).annotations).toHaveLength(0);
    expect(removeBoardAnnotation(withOne, ann.id).annotations).toHaveLength(0);
    expect(clearBoardAnnotations(withOne).annotations).toHaveLength(0);
    expect(undoBoardAnnotation(slide).annotations).toHaveLength(0);
  });

  it('annotation ids are unique', () => {
    expect(newBoardAnnotationId()).not.toBe(newBoardAnnotationId());
  });
});

describe('timer', () => {
  it('defaults to 10:00 and offers 5/10/15/30', () => {
    expect(QPG_BOARD_DEFAULT_TIMER_MINUTES).toBe(10);
    expect([...QPG_BOARD_TIMER_OPTIONS]).toEqual([5, 10, 15, 30]);
    expect(formatBoardTimer(boardTimerSeconds(10))).toBe('10:00');
    expect(formatBoardTimer(65)).toBe('1:05');
    expect(formatBoardTimer(0)).toBe('0:00');
    expect(formatBoardTimer(-5)).toBe('0:00');
  });
});

describe('validateQpgBoard', () => {
  it('accepts a well-formed board doc', () => {
    const slides = buildBoardSlides(samplePaper(), 'separate');
    expect(
      validateQpgBoard({
        ownerUid: 'u1',
        title: 'বোর্ড ১',
        subject: 'English',
        classLabel: 'অনার্স',
        setCode: 'ক',
        layout: 'separate',
        paperRef: { paperId: 'qpg-x', questionIds: slides.map((s) => s.questionId ?? '') },
        slides,
        shareEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    ).toEqual([]);
  });

  it('rejects empty slides and bad layout', () => {
    const problems = validateQpgBoard({
      ownerUid: 'u1',
      title: 'বোর্ড ১',
      subject: 'English',
      classLabel: 'অনার্স',
      setCode: '',
      layout: 'grid' as never,
      paperRef: { paperId: 'qpg-x', questionIds: [] },
      slides: [],
      shareEnabled: false,
      createdAt: '',
      updatedAt: '',
    });
    expect(problems.length).toBeGreaterThan(0);
  });
});

describe('debounced autosave (2s after the last stroke)', () => {
  it('fires once after rapid schedules, and flush forces a save', () => {
    vi.useFakeTimers();
    try {
      const saves: string[] = [];
      const saver = createDebouncedBoardSaver((doc) => {
        saves.push(doc.title);
      }, 2000);
      const doc = (title: string) => ({
        ownerUid: 'u1', title, subject: '', classLabel: '', setCode: '',
        layout: 'separate' as const,
        paperRef: { paperId: 'p', questionIds: [] },
        slides: buildBoardSlides(samplePaper(), 'separate'),
        shareEnabled: false, createdAt: '', updatedAt: '',
      });
      saver.schedule(doc('a'));
      saver.schedule(doc('b'));
      saver.schedule(doc('c'));
      vi.advanceTimersByTime(1999);
      expect(saves).toEqual([]);
      vi.advanceTimersByTime(1);
      expect(saves).toEqual(['c']);
      expect(saver.savesFired()).toBe(1);
      // Flush: schedules then forces an immediate save.
      saver.schedule(doc('d'));
      saver.flush();
      expect(saves).toEqual(['c', 'd']);
      expect(saver.savesFired()).toBe(2);
      vi.advanceTimersByTime(5000);
      expect(saves).toEqual(['c', 'd']);
    } finally {
      vi.useRealTimers();
    }
  });
});
