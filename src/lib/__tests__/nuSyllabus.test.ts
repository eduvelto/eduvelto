/**
 * Eduvelto unit tests — NU admission syllabus structure (NU-6;
 * design §5.4, §15 NU-6, §19.2.3).
 *
 * Covers the code-backed syllabus set: counts, the verified marks
 * pattern (20+20+20+40 = 100), group-40 block isolation (no chapter
 * or topic ever references a block subject), draft flags everywhere,
 * route helpers + lookups the subject/topic pages rely on, the admin
 * seed set (177 docs), and the prohibited-wording guard over the
 * syllabus copy. The Firestore rules mirror these validators —
 * rules-nu6-syllabus.test.ts proves the rules side.
 */
import { describe, it, expect } from 'vitest';
import {
  NU_LESSON_STUB_BODY_BN,
  nuSubjectRoute,
  nuSyllabusAllCopyStrings,
  nuSyllabusChapters,
  nuSyllabusChaptersForSubject,
  nuSyllabusLessonForTopic,
  nuSyllabusLessons,
  nuSyllabusSeedDocs,
  nuSyllabusSubjectBySlug,
  nuSyllabusSubjects,
  nuSyllabusSubjectsForGroup,
  nuSyllabusTopicBySlug,
  nuSyllabusTopics,
  nuSyllabusTopicsForChapter,
  nuTopicRoute,
  validateNuSyllabusChapterDoc,
  validateNuSyllabusSet,
  validateNuSyllabusSubjectDoc,
  validateNuSyllabusTopicDoc,
} from '../nuSyllabus';
import { NU_PROHIBITED_WORDINGS, nuGroupSubjects } from '../nuStructure';
import { NU_GROUPS } from '../nuProfile';

describe('NU-6 syllabus set (design §19.2.3)', () => {
  it('the whole set validates clean — 6 subjects, 11 chapters, 80 topics, 80 lessons', () => {
    expect(validateNuSyllabusSet()).toEqual([]);
    expect(nuSyllabusSubjects()).toHaveLength(6);
    expect(nuSyllabusChapters()).toHaveLength(11);
    expect(nuSyllabusTopics()).toHaveLength(80);
    expect(nuSyllabusLessons()).toHaveLength(80);
  });

  it('marks sum to the verified pattern 20+20+20+40 = 100 per group', () => {
    for (const g of NU_GROUPS) {
      const subjects = nuSyllabusSubjectsForGroup(g.slug);
      expect(subjects).toHaveLength(4);
      expect(subjects.reduce((sum, s) => sum + s.marks, 0)).toBe(100);
      expect(subjects.filter((s) => !s.isGroupBlock).map((s) => s.marks)).toEqual([20, 20, 20]);
      expect(subjects.filter((s) => s.isGroupBlock).map((s) => s.marks)).toEqual([40]);
    }
  });

  it('the group-40 block is isolated — no chapter or topic references a block subject', () => {
    const blockIds = new Set(
      nuSyllabusSubjects().filter((s) => s.isGroupBlock).map((s) => s.id),
    );
    expect(blockIds.size).toBe(3);
    for (const c of nuSyllabusChapters()) {
      expect(blockIds.has(c.subjectId)).toBe(false);
    }
    for (const t of nuSyllabusTopics()) {
      expect(blockIds.has(t.subjectId)).toBe(false);
    }
  });

  it('every topic has exactly one lesson stub, and every doc is draft + unverified', () => {
    for (const t of nuSyllabusTopics()) {
      const lesson = nuSyllabusLessonForTopic(t.id);
      expect(lesson).toBeDefined();
      expect(lesson?.bodyBn).toBe(NU_LESSON_STUB_BODY_BN);
      expect(lesson?.status).toBe('draft');
    }
    for (const s of nuSyllabusSubjects()) {
      expect(s.status).toBe('draft');
    }
    for (const c of nuSyllabusChapters()) {
      expect(c.status).toBe('draft');
      expect(c.syllabusVerified).toBe(false);
    }
    for (const t of nuSyllabusTopics()) {
      expect(t.status).toBe('draft');
      expect(t.syllabusVerified).toBe(false);
    }
  });

  it('the seed set is 177 docs with unique ids per collection', () => {
    const seeds = nuSyllabusSeedDocs();
    expect(seeds).toHaveLength(177);
    const byCollection = (name: string) => seeds.filter((s) => s.collection === name).length;
    expect(byCollection('nuSubjects')).toBe(6);
    expect(byCollection('nuChapters')).toBe(11);
    expect(byCollection('nuTopics')).toBe(80);
    expect(byCollection('nuLessons')).toBe(80);
    const ids = new Set(seeds.map((s) => `${s.collection}/${s.docId}`));
    expect(ids.size).toBe(177);
  });

  it('validators catch a bad subject, chapter and topic', () => {
    const badSubject = { ...nuSyllabusSubjects()[0], marks: 30 };
    expect(validateNuSyllabusSubjectDoc(badSubject).length).toBeGreaterThan(0);
    const badChapter = { ...nuSyllabusChapters()[0], order: 0 };
    expect(validateNuSyllabusChapterDoc(badChapter).length).toBeGreaterThan(0);
    const badTopic = { ...nuSyllabusTopics()[0], detailBn: '' };
    expect(validateNuSyllabusTopicDoc(badTopic).length).toBeGreaterThan(0);
  });
});

describe('NU-6 lookups + routes (subject/topic pages)', () => {
  it('route helpers build the §5.4 paths', () => {
    expect(nuSubjectRoute('science', 'bangla')).toBe(
      '/admissions/national-university/science/subjects/bangla',
    );
    expect(nuTopicRoute('humanities', 'bangla', 'oporichita')).toBe(
      '/admissions/national-university/humanities/subjects/bangla/oporichita',
    );
  });

  it('subject lookup finds Bangla with 4 chapters; prose has 12 topics', () => {
    const bangla = nuSyllabusSubjectBySlug('bangla');
    expect(bangla?.id).toBe('nu-sub-bangla');
    expect(nuSyllabusChaptersForSubject('nu-sub-bangla')).toHaveLength(4);
    expect(nuSyllabusTopicsForChapter('nu-ch-bangla-prose')).toHaveLength(12);
    expect(nuSyllabusSubjectBySlug('group-science')?.isGroupBlock).toBe(true);
    expect(nuSyllabusSubjectBySlug('no-such-subject')).toBeUndefined();
  });

  it('topic lookup + lesson lookup agree (topic → chapter → lesson)', () => {
    const topic = nuSyllabusTopicBySlug('nu-sub-bangla', 'oporichita');
    expect(topic?.nameBn).toBe('অপরিচিতা');
    expect(topic?.detailBn).toBe('রবীন্দ্রনাথ ঠাকুর');
    const lesson = topic ? nuSyllabusLessonForTopic(topic.id) : undefined;
    expect(lesson?.topicId).toBe(topic?.id);
    expect(nuSyllabusTopicBySlug('nu-sub-bangla', 'no-such-topic')).toBeUndefined();
  });

  it('group-page subject slugs match the syllabus subject slugs', () => {
    for (const g of NU_GROUPS) {
      const pageSlugs = nuGroupSubjects(g.slug)
        .filter((s) => !s.isGroupBlock)
        .map((s) => s.slug)
        .sort();
      const syllabusSlugs = nuSyllabusSubjectsForGroup(g.slug)
        .filter((s) => !s.isGroupBlock)
        .map((s) => s.slug)
        .sort();
      expect(pageSlugs).toEqual(syllabusSlugs);
      expect(nuGroupSubjects(g.slug).filter((s) => s.isGroupBlock).map((s) => s.slug)).toEqual([null]);
    }
  });

  it('no forbidden phrase appears in any syllabus copy string', () => {
    for (const copy of nuSyllabusAllCopyStrings()) {
      for (const banned of NU_PROHIBITED_WORDINGS) {
        expect(copy).not.toContain(banned);
      }
    }
  });
});
