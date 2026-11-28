// Eduvelto — public guides (24 Nov 2026, brand-SEO wave 1, F-04;
// EXTENDED 24 Nov 2026, brand-SEO wave 2: +7 guides, 17 total;
// EXTENDED 24 Nov 2026, brand-SEO wave 3: +6 guides, 23 total).
// EXTENDED 24 Nov 2026, brand-SEO wave 4: +6 guides, 29 total).
// EXTENDED 24 Nov 2026, brand-SEO wave 5: +6 guides, 35 total).
// EXTENDED 24 Nov 2026, brand-SEO wave 10: +6 guides, 41 total).
// EXTENDED 28 Nov 2026, trust/content batch (owner order): +10
// tool-tied guides, 66 total — every formula/rule grounded in the
// tools' own logic (src/lib/tools/), 800+ words in Bn AND En each.
// EXTENDED 28 Nov 2026, eleventh guide (owner order 11:44): +1,
// 67 total — Negative Sentences, Class 3, general version.
//
// 41 original public guides, visible to Googlebot WITHOUT login.
// Static data ONLY — zero Firestore reads, no login. The prose is
// ORIGINAL, written in the site's own words for these pages. It is
// NOT copied from any textbook, guide or question bank, and it
// contains no library book text. Review state (28 Nov 2026):
// the visible draft label was REMOVED by owner order (AdSense
// cleanup 5277853) and every guide page now carries the
// owner-ordered editorial badge "যাচাইকৃত: Eduvelto শিক্ষা ও
// গবেষণা টিম"; the SEO meta matches the badge — except GST +
// DU admission, whose needsReview passages are still recorded
// in publicGuideMeta.ts and keep draft wording in meta. The
// advice itself has NOT had individual teacher review; factual
// claims are either verified or general advice (empty
// needsReview), or explicitly recorded as review-needed.
//
// Word counts (publicGuideWordCount, all body + warning paragraphs):
// BCS 441, bank 427, primary 409, NTRCA 451, NU 454, grammar 425,
// scholarship 423, AI 412, CV 433, budget 400 — inside the required
// 400–700 range, asserted in src/lib/__tests__/publicGuides.test.ts.
// Wave-2 guides (all general advice, no invented facts — see the
// wave-2 build log for the fact-vs-advice note on each): revision
// 411, note-taking 417, time-management 446, English writing 440,
// online safety 413, Bangla spelling 406, computer basics 420.
// Wave-3 guides (all general advice, no invented facts — see the
// wave-3 build log for the fact-vs-advice note on each): exam-day
// 543, MCQ techniques 487, memory techniques 511, job-seeker
// routine 470, healthy habits 445, digital skills 486.
// Wave-4 guides (all general advice, no invented facts — see the
// wave-4 build log for the fact-vs-advice note on each): exam anxiety
// 509, presentation skills 412, group study 401, vocabulary building
// 433, reading habits 435, self-motivation 431.
// Wave-5 guides (all general advice/instructions, no invented facts — see the
// wave-5 build log for the fact-vs-advice note on each): free library 418,
// job practice 401, AI assistant 406, opportunity hub 402, life services
// 409, spoken English 404.
// Wave-10 guides (all general advice, no invented facts — see the
// wave-10 build log for the fact-vs-advice note on each): goal setting
// 462, staying focused 453, sleep 428, comprehension 414, phone 413,
// asking questions 408.
// The viva-preparation candidate was SKIPPED: /jobs/viva already
// covers viva preparation, so a /learn viva guide would duplicate
// an existing page. Wave 3 also SKIPPED money management for
// students: /learn/budget-planner-guide already covers student
// budgeting and /life/budget is the budget tool, so a third
// money-management guide would duplicate existing pages.
// Wave 4 also SKIPPED career planning basics (/opportunities/career-guidance
// already covers it) and freelancing basics for students (/opportunities/income
// already covers legit online income), so two more guides would duplicate
// existing pages.
// Wave 5 SKIPPED nothing from the briefed list: all 6 topics are new —
// no existing guide covers how to use the library, job practice,
// AI assistant, opportunity hub or life services, and no guide
// covers spoken English practice (writing/vocabulary guides differ).
// Wave 10 SKIPPED four candidates: viva-preparation-from-home
// (/jobs/viva + /opportunities/interview-prep already cover it),
// time-management-working-students (duplicates
// time-management-students + study-routine-job-seekers),
// exam-in-one-week (duplicates revision-strategy +
// exam-day-strategy + time-management-students) and
// application-letter writing (the AI Assistant letter builder
// covers it; how-to-use-ai-assistant already points there).
//
// Nothing from the pack's "Unverified — do not publish" list is in
// here: no BCS subject-wise marks, no BCS written/viva pattern, no
// bank subject-wise pattern or final negative-marking verdict (the
// bank guide says plainly it is unverified), no primary/NTRCA
// subject-wise pattern, no NU 2026–27 circular/dates/fees, no
// Commonwealth eligibility/subject/benefit claims (only the verified
// 8 Dec 2026, 16:00 GMT deadline), no BPSC vacancy totals, no
// book/coaching names or recommendations.
// SPLIT (25 Nov 2026, entry-chunk budget): the data used to live in
// this file as one 594 KB array, and lib/seo.ts imported it — so all
// 56 guides' body prose shipped inside the entry chunk (221 KB gzip,
// over the 200 KB budget). The data now lives in two files:
//  - ./publicGuideMeta.ts — light metadata (path/titles/updatedAt…),
//    imported by lib/seo.ts (JSON-LD only) and joined here;
//  - ./publicGuideBodies.ts — the body prose, keyed by slug,
//    imported ONLY here, so it travels with the lazy guide pages.
// This module joins them back into PUBLIC_GUIDES — every existing
// consumer (pages, tests, helpers below) is unchanged.

import { PUBLIC_GUIDE_META, type PublicGuideMeta } from './publicGuideMeta';
import { PUBLIC_GUIDE_BODIES } from './publicGuideBodies';

export type { PublicGuideCategory, PublicGuideLink, PublicGuideMeta } from './publicGuideMeta';
export type { PublicGuideBody } from './publicGuideBodies';

export interface PublicGuide extends PublicGuideMeta {
  /** Main text paragraphs, in order. */
  bodyBn: string[];
  /** English body — rendered when lang is en; absent on old guides. */
  bodyEn?: string[];
  /** Prominent warning shown in an alert box (NU guide only). */
  warningBn?: string;
  warningEn?: string;
}

/** The full joined guides, in data order — same shape and order as
 *  before the split (verified by the guide-snapshot diff). */
export const PUBLIC_GUIDES: PublicGuide[] = PUBLIC_GUIDE_META.map((meta) => {
  const body = PUBLIC_GUIDE_BODIES[meta.slug];
  if (!body) throw new Error(`publicGuides: no body for guide '${meta.slug}'`);
  return { ...meta, ...body };
});

export function publicGuideBySlug(slug: string): PublicGuide | undefined {
  return PUBLIC_GUIDES.find((g) => g.slug === slug);
}

export function publicGuideByPath(path: string): PublicGuide | undefined {
  return PUBLIC_GUIDES.find((g) => g.path === path);
}

/** Word count of a guide's main text (body + warning paragraphs),
 *  whitespace-split — the same method the content pack used. The
 *  NU warning's bold lead ("গুরুত্বপূর্ণ সতর্কতা — আগে এটি পড়ুন:")
 *  is rendered by the page, not stored in the data, so it is counted
 *  here too — the pack's 454 for the NU guide includes those 6 words. */
export function publicGuideWordCount(guide: PublicGuide): number {
  const texts = [
    ...guide.bodyBn,
    ...(guide.warningBn
      ? ['গুরুত্বপূর্ণ সতর্কতা — আগে এটি পড়ুন:', guide.warningBn]
      : []),
  ];
  return texts.join(' ').split(/\s+/).filter(Boolean).length;
}

/** Word count of a guide's English body (Phase 2 guides only —
 *  old guides have no bodyEn, so this is 0 for them). Same
 *  whitespace-split method as publicGuideWordCount. */
export function publicGuideWordCountEn(guide: PublicGuide): number {
  if (!guide.bodyEn) return 0;
  const texts = [...guide.bodyEn, ...(guide.warningEn ? [guide.warningEn] : [])];
  return texts.join(' ').split(/\s+/).filter(Boolean).length;
}

/** Phase 2 Study Guides (the /guides blog): the 25 long-form
 *  bilingual articles, in data order. */
export const PHASE2_GUIDES: PublicGuide[] = PUBLIC_GUIDES.filter((g) => g.path.startsWith('/guides/'));
