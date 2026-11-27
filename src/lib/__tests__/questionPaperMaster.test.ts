// Question Paper Generator — Turn 32 master spec tests: set shuffler,
// OMR evaluator, smart-filter honesty, report reward, pricing truth.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  QPG_PENDING_TRACK3_EXAMS,
  QPG_SET_CODES,
  QPG_SOURCE_OPTIONS,
  QPG_VERIFIED_CHAPTER_ID,
  QPG_VERIFIED_POOL,
  QPG_WHATSAPP_NUMBER,
  QPG_WHATSAPP_SHORT_LINK,
  QPG_WHATSAPP_TARGET_URL,
  QPG_WHATSAPP_URL,
  buildQpgPaper,
  defaultPaperSetup,
  selectQpgQuestions,
} from '../questionPaper';
import { buildQuestionSets, qpgShuffleSeeded, questionsForSet } from '../questionPaperSets';
import {
  QPG_OMR_MAX_QUESTIONS,
  QPG_OMR_MIN_QUESTIONS,
  evaluateOmr,
  parseOmrKey,
  validateOmrRun,
} from '../omrEvaluator';
import { drawQpgCenteredWatermark } from '../questionPaperPdf';
import {
  QPG_REPORT_REWARD_DAYS,
  validateQpgReport,
} from '../questionPaperUsage';
import {
  QUESTION_MAKER_INITIAL_DATA,
  getInitialData,
  publishQuestionMakerInitialData,
} from '../questionMakerInitialData';
import { resolveRouteSeo } from '../seo';

const PRICING_SRC = readFileSync(resolve(__dirname, '../../pages/PricingPage.tsx'), 'utf8');
const DIALOG_SRC = readFileSync(
  resolve(__dirname, '../../components/QuestionPaperDownloadDialog.tsx'),
  'utf8',
);
const LANDING_SRC = readFileSync(
  resolve(__dirname, '../../pages/QuestionMakerLandingPage.tsx'),
  'utf8',
);
const OMR_PAGE_SRC = readFileSync(resolve(__dirname, '../../pages/OmrEvaluatorPage.tsx'), 'utf8');
const GENERATOR_SRC = readFileSync(
  resolve(__dirname, '../../pages/QuestionPaperGeneratorPage.tsx'),
  'utf8',
);
const PDF_LIB_SRC = readFileSync(resolve(__dirname, '../questionPaperPdf.ts'), 'utf8');

describe('set shuffler (Set ক/খ/গ/ঘ)', () => {
  it('builds four sets with the four codes', () => {
    expect(QPG_SET_CODES).toEqual(['ক', 'খ', 'গ', 'ঘ']);
    const sets = buildQuestionSets(QPG_VERIFIED_POOL.slice(0, 10), 42);
    expect(sets.map((s) => s.code)).toEqual(['ক', 'খ', 'গ', 'ঘ']);
    expect(sets.every((s) => s.questions.length === 10)).toBe(true);
  });

  it('Set ক keeps the original order; other sets shuffle', () => {
    const qs = QPG_VERIFIED_POOL.slice(0, 10);
    const sets = buildQuestionSets(qs, 42);
    expect(sets[0].questions.map((q) => q.id)).toEqual(qs.map((q) => q.id));
    const shuffledIds = sets[1].questions.map((q) => q.id);
    expect(shuffledIds).not.toEqual(qs.map((q) => q.id));
    expect([...shuffledIds].sort()).toEqual([...qs.map((q) => q.id)].sort());
  });

  it('each set carries its own matching answer key', () => {
    const sets = buildQuestionSets(QPG_VERIFIED_POOL.slice(0, 10), 7);
    for (const s of sets) {
      expect(s.answerKey).toEqual(s.questions.map((q) => q.correctLetter));
    }
  });

  it('the shuffle is deterministic for a seed', () => {
    const a = qpgShuffleSeeded(QPG_VERIFIED_POOL.slice(0, 10), 99);
    const b = qpgShuffleSeeded(QPG_VERIFIED_POOL.slice(0, 10), 99);
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
    const c = qpgShuffleSeeded(QPG_VERIFIED_POOL.slice(0, 10), 100);
    expect(c.map((q) => q.id)).not.toEqual(a.map((q) => q.id));
  });

  it('questionsForSet returns the original order for a single-set paper', () => {
    const qs = QPG_VERIFIED_POOL.slice(0, 5);
    expect(questionsForSet(qs, 1, '').map((q) => q.id)).toEqual(qs.map((q) => q.id));
    expect(questionsForSet(qs, 1, 'খ')).toHaveLength(5);
  });

  it('a built paper carries its answer key + chapter for the 8-field header', () => {
    const setup = defaultPaperSetup({
      title: 'বার্ষিক পরীক্ষা ২০২৬', subject: 'English', classLabel: 'অনার্স',
      questionCount: 5, marksPerQuestion: 1, timeMinutes: 30,
      sectionHeading: 'ক-বিভাগ', subjectCode: '101', setCode: 'খ',
    });
    expect(setup.subjectCode).toBe('101');
    expect(setup.setCode).toBe('খ');
    const paper = buildQpgPaper({
      setup, questions: QPG_VERIFIED_POOL.slice(0, 5), isCustomVariant: false,
      kind: 'chapter-paper', patternLabelBn: 'x', patternLabelEn: 'x',
    });
    expect(paper.answerKey).toEqual(paper.questions.map((q) => q.correctLetter));
    expect(paper.chapterNameBn).toContain('BCS ইংরেজি');
  });
});

describe('smart filters — honest zeros', () => {
  const base = {
    chapterIds: [QPG_VERIFIED_CHAPTER_ID],
    topicIds: [] as string[],
    type: 'mcq' as const,
    difficulty: 'all' as const,
    count: 100,
  };

  it('board / repeated-board / test-exam sources are disabled with 0 verified', () => {
    for (const opt of QPG_SOURCE_OPTIONS.filter((o) => o.id !== 'any' && o.id !== 'verified-batch')) {
      expect(opt.disabled).toBe(true);
    }
    expect(selectQpgQuestions({ ...base, source: 'board' }).available).toBe(0);
    expect(selectQpgQuestions({ ...base, source: 'repeated-board' }).available).toBe(0);
    expect(selectQpgQuestions({ ...base, source: 'test-exam' }).available).toBe(0);
    expect(selectQpgQuestions({ ...base, source: 'verified-batch' }).available).toBe(35);
  });

  it('new question types honestly return zero (no verified packs yet)', () => {
    expect(selectQpgQuestions({ ...base, type: 'multi-completion' }).available).toBe(0);
    expect(selectQpgQuestions({ ...base, type: 'situation-set' }).available).toBe(0);
    expect(selectQpgQuestions({ ...base, type: 'picture-based' }).available).toBe(0);
  });

  it('multiple-schools source stays disabled with 0 verified', () => {
    const opt = QPG_SOURCE_OPTIONS.find((o) => o.id === 'multiple-schools');
    expect(opt?.disabled).toBe(true);
    expect(selectQpgQuestions({ ...base, source: 'multiple-schools' }).available).toBe(0);
  });

  it('cognitive level + nature honestly return zero (no tags yet)', () => {
    expect(selectQpgQuestions({ ...base, cognitiveLevel: 'application' }).available).toBe(0);
    expect(selectQpgQuestions({ ...base, nature: 'mathematical' }).available).toBe(0);
  });
});

describe('OMR evaluator', () => {
  it('scores a perfect sheet', () => {
    const key = ['A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B'] as const;
    const r = evaluateOmr({ answerKey: [...key], marks: [...key], negativeMarking: -0.25 });
    expect(r.correct).toBe(10);
    expect(r.score).toBe(10);
    expect(r.percent).toBe(100);
  });

  it('applies negative marking and counts blanks separately', () => {
    const key = Array(10).fill('A') as Array<'A' | 'B' | 'C' | 'D'>;
    const marks = ['A', 'B', 'B', 'B', 'B', '', '', '', '', ''] as const;
    const r = evaluateOmr({ answerKey: key, marks: [...marks], negativeMarking: -0.25 });
    expect(r.correct).toBe(1);
    expect(r.wrong).toBe(4);
    expect(r.blank).toBe(5);
    expect(r.score).toBe(0); // 1 - 4×0.25
  });

  it('flags multiple marks as wrong, never as answers', () => {
    const key = Array(10).fill('A') as Array<'A' | 'B' | 'C' | 'D'>;
    const marks = ['MULTI', ...Array(9).fill('A')] as const;
    const r = evaluateOmr({ answerKey: key, marks: [...marks], negativeMarking: 0 });
    expect(r.multipleMarked).toBe(1);
    expect(r.multipleMarkedNumbers).toEqual([1]);
    expect(r.correct).toBe(9);
    expect(r.wrong).toBe(1);
  });

  it('parses pasted keys and enforces 10–100 MCQs', () => {
    expect(parseOmrKey('C A B D')).toEqual(['C', 'A', 'B', 'D']);
    expect(parseOmrKey('cabd')).toEqual(['C', 'A', 'B', 'D']);
    expect(QPG_OMR_MIN_QUESTIONS).toBe(10);
    expect(QPG_OMR_MAX_QUESTIONS).toBe(100);
    expect(validateOmrRun(Array(9).fill('A'), Array(9).fill(''))).not.toEqual([]);
    expect(validateOmrRun(Array(10).fill('A'), Array(10).fill(''))).toEqual([]);
  });
});

describe('report error reward (7 free Pro days, admin-validated only)', () => {
  it('the reward is 7 days', () => {
    expect(QPG_REPORT_REWARD_DAYS).toBe(7);
  });

  it('a new report must not carry a reward', () => {
    const problems = validateQpgReport({
      reporterId: 'u1', questionId: 'bcs-eng-001', chapterId: QPG_VERIFIED_CHAPTER_ID,
      reason: 'typo', details: 'x', status: 'open',
      rewardStatus: 'granted', rewardDays: 7,
    });
    expect(problems.join(' ')).toContain('reward');
  });
});

describe('medical admission is blocked, not built', () => {
  it('lists medical as pending with a verification blocker', () => {
    expect(QPG_PENDING_TRACK3_EXAMS).toHaveLength(1);
    expect(QPG_PENDING_TRACK3_EXAMS[0].examSlug).toBe('medical-admission');
    expect(QPG_PENDING_TRACK3_EXAMS[0].blockedReasonBn).toContain('যাচাই হয়নি');
  });
});

describe('pricing truth (PRICING FINAL, owner 25 Nov 09:34)', () => {
  it('the table is the 70%-off table — our price is 30% of theirs, nearest ৳10', () => {
    // Classes 3–5 tiers were removed from the platform 27 Nov 2026
    // (owner order): 8 tiers remain, cheapest annual ৳300.
    expect(QUESTION_MAKER_INITIAL_DATA.pricing).toHaveLength(8);
    expect(QUESTION_MAKER_INITIAL_DATA.cheapestAnnualBdt).toBe(300);
    expect(QUESTION_MAKER_INITIAL_DATA.priceClaimBn).toBe('সব প্রশ্নপত্রে ৭০% ছাড়ে');
    const ids = QUESTION_MAKER_INITIAL_DATA.pricing.map((t) => t.id);
    expect(ids).toContain('class-6-8');
    expect(ids).toContain('bundle-6-10');
    expect(ids).toContain('coaching-6-12');
    expect(ids).toContain('per-subject');
    // The old single-yearly tiers and the superseded 50% table must not exist.
    expect(QUESTION_MAKER_INITIAL_DATA.pricing.some((t) => t.eduveltoBdt === 999)).toBe(false);
    expect(QUESTION_MAKER_INITIAL_DATA.pricing.some((t) => t.eduveltoBdt === 799)).toBe(false);
    expect(QUESTION_MAKER_INITIAL_DATA.pricing.some((t) => t.eduveltoBdt === 250)).toBe(false);
  });

  it('the pricing page renders the table from __INITIAL_DATA__ with the ৭০% ছাড়ে display rule', () => {
    expect(PRICING_SRC).toContain('data.pricing');
    expect(PRICING_SRC).toContain('৭০% ছাড়ে');
    expect(PRICING_SRC).toContain('বাজার মূল্য');
    expect(PRICING_SRC).toContain('data.priceClaimBn');
    // NEVER name another website/competitor anywhere on the site
    // (owner 25 Nov 17:28) — the reference price is "বাজার মূল্য".
    expect(PRICING_SRC).not.toContain('Eproshnobank');
    expect(PRICING_SRC).not.toContain('Proshnobanai');
    // NEVER "৬ গুণ কম দামে" — theirs is 3.33× ours, not 6×.
    expect(PRICING_SRC).not.toMatch(/৬ গুণ কম/);
    expect(PRICING_SRC).not.toContain('proYearlyBdt');
    expect(PRICING_SRC).not.toContain('proposedYearlyBdt');
  });

  it('no "৬ গুণ কম" claim appears on the landing page either', () => {
    expect(LANDING_SRC).not.toMatch(/৬ গুণ কম/);
    expect(LANDING_SRC).toContain('data.priceClaimBn');
    // No competitor name on the landing page either (owner 25 Nov 17:28).
    expect(LANDING_SRC).not.toContain('Eproshnobank');
    expect(LANDING_SRC).not.toContain('Proshnobanai');
  });

  it('the pricing route resolves SEO', () => {
    const seo = resolveRouteSeo('/pricing', 'bn');
    expect(seo).not.toBeNull();
    expect(seo?.title).toContain('মূল্য');
    expect(resolveRouteSeo('/omr-evaluator', 'en')?.title).toContain('OMR');
  });
});

describe('OMR checking is FREE for everyone (owner 25 Nov 09:43)', () => {
  it('the evaluator page declares checking free, with no lock on it', () => {
    expect(OMR_PAGE_SRC).toContain('সম্পূর্ণ ফ্রি');
    expect(OMR_PAGE_SRC).toContain('কোনো Pro লাগে না');
    expect(OMR_PAGE_SRC).not.toContain('🔒');
    expect(OMR_PAGE_SRC).toContain('সার্ভার খরচ শূন্য');
  });

  it('the printable sheet follows the paper tier — watermarked free, clean Pro', () => {
    // Free path accepts the sheet and watermarks it.
    expect(PDF_LIB_SRC).toContain('includeOmrSheet');
    expect(PDF_LIB_SRC).toContain('renderOmrSheetCanvases(paper, { watermarked: true, userLabel: opts.userLabel })');
    expect(PDF_LIB_SRC).toContain('watermarked?: boolean');
    // Pro (clean) path renders the sheet without the watermark flag.
    expect(PDF_LIB_SRC).toContain('extra.push(...(await renderOmrSheetCanvases(paper)));');
    // The sheet is no longer described as Pro-only.
    expect(PDF_LIB_SRC).not.toContain('the sheet is Pro-only');
  });

  it('the generator offers the sheet as a free toggle, not a locked Pro option', () => {
    expect(GENERATOR_SRC).toContain('OMR Bubble Sheet সংযুক্ত করুন (ফ্রি');
    expect(GENERATOR_SRC).toContain('includeOmrSheet');
    expect(GENERATOR_SRC).not.toContain('সংযুক্ত করুন (Pro)');
  });

  it('the download dialog passes the sheet choice into the free download', () => {
    expect(DIALOG_SRC).toContain('includeOmrSheet');
    expect(DIALOG_SRC).toContain(
      'downloadWatermarkedPaperPdf(props.paper, {',
    );
    expect(DIALOG_SRC).toContain('userLabel: props.uid');
    expect(DIALOG_SRC).toContain('OMR যাচাই সম্পূর্ণ ফ্রি');
  });
});

describe('__INITIAL_DATA__ (Spark rule: pre-rendered, zero Firestore reads)', () => {
  it('publishes and reads back the build-time data', () => {
    const published = publishQuestionMakerInitialData();
    expect(published.pricing).toHaveLength(8);
    expect(getInitialData('question-maker')).toEqual(published);
    expect(getInitialData('pricing')).toEqual(published);
  });

  it('public pages import no Firestore/Firebase modules', () => {
    for (const src of [LANDING_SRC, PRICING_SRC]) {
      expect(src).not.toMatch(/from 'firebase|from "\.\.\/lib\/firebase|firestore|getDocs|collection\(db/);
    }
  });
});

describe('single centered watermark resets html2canvas transform (bug 25 Nov 2026)', () => {
  function fakeCanvas() {
    const calls: string[] = [];
    const ctx = {
      save: () => {
        calls.push('save');
      },
      restore: () => {
        calls.push('restore');
      },
      setTransform: (...args: number[]) => {
        calls.push(`setTransform(${args.join(',')})`);
      },
      translate: () => undefined,
      rotate: () => undefined,
      fillText: (text: string) => {
        calls.push(`fillText:${text}`);
      },
      globalAlpha: 1,
      fillStyle: '',
      font: '',
      textAlign: '',
      textBaseline: '',
    };
    const canvas = {
      width: 1588,
      height: 1838,
      getContext: () => ctx,
    } as unknown as HTMLCanvasElement;
    return { canvas, calls };
  }

  it('resets to identity BEFORE the first fillText, then paints ONE eduvelto.com mark', () => {
    const { canvas, calls } = fakeCanvas();
    drawQpgCenteredWatermark(canvas);
    const resetAt = calls.indexOf('setTransform(1,0,0,1,0,0)');
    expect(resetAt).toBeGreaterThanOrEqual(0);
    const firstFill = calls.findIndex((c) => c.startsWith('fillText:'));
    expect(firstFill).toBeGreaterThan(resetAt);
    const fills = calls.filter((c) => c.startsWith('fillText:'));
    expect(fills).toEqual(['fillText:eduvelto.com']);
  });

  it('adds the per-user label as a second, smaller line under the one mark', () => {
    const { canvas, calls } = fakeCanvas();
    drawQpgCenteredWatermark(canvas, 'guest');
    const fills = calls.filter((c) => c.startsWith('fillText:'));
    expect(fills).toEqual(['fillText:eduvelto.com', 'fillText:guest']);
  });

  it('is a no-op (no throw) when the 2d context is unavailable', () => {
    const canvas = {
      width: 100,
      height: 100,
      getContext: () => null,
    } as unknown as HTMLCanvasElement;
    expect(() => drawQpgCenteredWatermark(canvas)).not.toThrow();
  });
});

describe('set code reaches the paper setup (bug 25 Nov 2026)', () => {
  it('defaultPaperSetup carries the chosen set code through', () => {
    const setup = defaultPaperSetup({
      title: 'প্রশ্নপত্র',
      subject: 'English',
      classLabel: 'অনার্স',
      questionCount: 10,
      marksPerQuestion: 1,
      timeMinutes: 30,
      sectionHeading: 'ক-বিভাগ',
      setCode: 'খ',
    });
    expect(setup.setCode).toBe('খ');
  });
});

describe('payment-confirmation WhatsApp (owner 25 Nov 10:19, FINAL)', () => {
  it('the visible link is the branded redirect eduvelto.com/whatsapp', () => {
    expect(QPG_WHATSAPP_URL).toBe('https://eduvelto.com/whatsapp');
    expect(QPG_WHATSAPP_TARGET_URL).toBe('https://wa.me/8801975225751');
    expect(QUESTION_MAKER_INITIAL_DATA.whatsappUrl).toBe('https://eduvelto.com/whatsapp');
  });

  it('the WhatsApp Business short link (wa.me/message/...) is PENDING — null, never invented', () => {
    expect(QPG_WHATSAPP_SHORT_LINK).toBeNull();
  });

  it('the number +8801975225751 is recorded as the Eduvelto account number (same account as @eduvelto: most likely, not proven)', () => {
    expect(QPG_WHATSAPP_NUMBER).toBe('+8801975225751');
    expect(QPG_WHATSAPP_NUMBER).not.toBe(QPG_WHATSAPP_URL);
  });

  it('the redirect is a 302 in firebase.json (target will change to the short link)', () => {
    const firebase = JSON.parse(
      readFileSync(resolve(__dirname, '../../../firebase.json'), 'utf8'),
    ) as { hosting: { redirects: Array<{ source: string; destination: string; type: number }> } };
    const redirect = firebase.hosting.redirects.find((r) => r.source === '/whatsapp');
    expect(redirect).toEqual({
      source: '/whatsapp',
      destination: 'https://wa.me/8801975225751',
      type: 302,
    });
  });

  it('the /whatsapp SPA route exists as the dev/preview fallback', () => {
    const appSrc = readFileSync(resolve(__dirname, '../../App.tsx'), 'utf8');
    // Merged under the /:lang pattern (relative path) — the pre-merge
    // absolute mount was routing-agnostic only.
    expect(appSrc).toContain('<Route path="whatsapp" element={<WhatsappRedirectPage />} />');
    expect(appSrc).toContain('WhatsappRedirectPage');
    const pageSrc = readFileSync(
      resolve(__dirname, '../../pages/WhatsappRedirectPage.tsx'),
      'utf8',
    );
    expect(pageSrc).toContain('QPG_WHATSAPP_SHORT_LINK ?? QPG_WHATSAPP_TARGET_URL');
    expect(pageSrc).toContain('QPG_WHATSAPP_USERNAME');
    expect(pageSrc).not.toContain('8801975225751');
  });

  it('Pricing page + download dialog show the redirect, never the raw number or the old links', () => {
    // Pricing is a public page: it reads the URL from __INITIAL_DATA__
    // (data.whatsappUrl — the constant is proved above), never a
    // hardcoded string; the dialog uses the imported constant.
    expect(PRICING_SRC).toContain('data.whatsappUrl');
    expect(PRICING_SRC).toContain('QPG_WHATSAPP_USERNAME');
    expect(PRICING_SRC).toContain('পেমেন্টের পর WhatsApp-এ জানান');
    expect(DIALOG_SRC).toContain('QPG_WHATSAPP_URL');
    expect(DIALOG_SRC).toContain('QPG_WHATSAPP_USERNAME');
    expect(DIALOG_SRC).toContain('পেমেন্টের পর WhatsApp-এ জানান');
    for (const src of [PRICING_SRC, DIALOG_SRC]) {
      // The number is hidden: no raw number, no wa.me number link.
      expect(src).not.toContain('8801975225751');
      expect(src).not.toContain('wa.me/880');
      // The username link is NOT used (messages do not come through).
      expect(src).not.toContain('wa.me/eduvelto');
      // The held-then-superseded number must appear nowhere.
      expect(src).not.toContain('8801538264070');
      expect(src).not.toContain('wa.me/8801538264070');
      // The payment number and the IG phone are not WhatsApp links.
      expect(src).not.toContain('wa.me/8801754267001');
      expect(src).not.toContain('wa.me/8801518926854');
    }
    // Both pages tell the buyer what to send: TrxID + last 3 digits.
    for (const src of [PRICING_SRC, DIALOG_SRC]) {
      expect(src).toContain('TrxID');
      expect(src).toContain('শেষ ৩');
    }
  });
});

describe('A-Z parity adds (Proshnobanai read, 25 Nov 10:14)', () => {
  it('templates: 5 named templates; applying one pre-fills title/instructions, keeps the rest', async () => {
    const { QPG_PAPER_TEMPLATES, applyQpgTemplate } = await import('../questionPaper');
    expect(QPG_PAPER_TEMPLATES.map((t) => t.id)).toEqual([
      'annual',
      'half-yearly',
      'model-test',
      'class-test',
      'weekly',
    ]);
    const base = defaultPaperSetup({
      title: 'old',
      subject: 'English',
      classLabel: 'অনার্স',
      questionCount: 10,
      marksPerQuestion: 1,
      timeMinutes: 30,
      sectionHeading: 'old heading',
    });
    const applied = applyQpgTemplate(base, 'annual');
    expect(applied.title).toBe('বার্ষিক পরীক্ষা — English (অনার্স)');
    expect(applied.instructions).toBe('সব প্রশ্নের উত্তর দাও। সময় ও পূর্ণমান মাথায় রেখে উত্তর লেখো।');
    expect(applied.sectionHeading).toBe('ক-বিভাগ: বহুনির্বাচনি প্রশ্ন (MCQ)');
    expect(applied.totalMarks).toBe(base.totalMarks);
    expect(applied.timeMinutes).toBe(base.timeMinutes);
    expect(applyQpgTemplate(base, 'no-such-template')).toBe(base);
  });

  it('standard checker: passes when every section has enough verified questions and marks match', async () => {
    const { checkQpgPaperStandard } = await import('../questionPaper');
    const ok = checkQpgPaperStandard({
      sections: [{ headingBn: 'ক-বিভাগ', requested: 10, available: 35, marksPerQuestion: 1 }],
      declaredMarks: 10,
    });
    expect(ok.passes).toBe(true);
    expect(ok.marksMatch).toBe(true);
    expect(ok.sections[0].sufficient).toBe(true);
    expect(ok.computedMarks).toBe(10);
  });

  it('standard checker: fails honestly on shortfall, empty section, and marks mismatch', async () => {
    const { checkQpgPaperStandard } = await import('../questionPaper');
    const short = checkQpgPaperStandard({
      sections: [{ headingBn: 'ক-বিভাগ', requested: 40, available: 35, marksPerQuestion: 1 }],
      declaredMarks: 40,
    });
    expect(short.passes).toBe(false);
    expect(short.sections[0].shortfall).toBe(5);
    expect(short.summaryBn).toContain('ঘাটতি');
    const empty = checkQpgPaperStandard({
      sections: [{ headingBn: 'ক-বিভাগ', requested: 0, available: 35, marksPerQuestion: 1 }],
      declaredMarks: 0,
    });
    expect(empty.passes).toBe(false);
    const mismatch = checkQpgPaperStandard({
      sections: [{ headingBn: 'ক-বিভাগ', requested: 10, available: 35, marksPerQuestion: 1 }],
      declaredMarks: 20,
    });
    expect(mismatch.passes).toBe(false);
    expect(mismatch.marksMatch).toBe(false);
    expect(mismatch.summaryBn).toContain('পূর্ণমান মিলছে না');
  });

  it('per-question replace: swaps in position; no-ops on missing old / duplicate new', async () => {
    const { replaceQpgQuestion } = await import('../questionPaper');
    const ids = ['a', 'b', 'c'];
    expect(replaceQpgQuestion(ids, 'b', 'z')).toEqual(['a', 'z', 'c']);
    expect(replaceQpgQuestion(ids, 'x', 'z')).toEqual(['a', 'b', 'c']);
    expect(replaceQpgQuestion(ids, 'b', 'a')).toEqual(['a', 'b', 'c']);
    expect(ids).toEqual(['a', 'b', 'c']);
  });

  it('textbook/guide source filters exist but stay DISABLED (0 verified) — never fake data', async () => {
    const { QPG_SOURCE_OPTIONS, selectQpgQuestions } = await import('../questionPaper');
    for (const id of ['textbook', 'guide'] as const) {
      const opt = QPG_SOURCE_OPTIONS.find((o) => o.id === id);
      expect(opt).toBeDefined();
      expect(opt!.disabled).toBe(true);
      expect(opt!.disabledReasonBn).toContain('০টি');
      const res = selectQpgQuestions(
        {
          chapterIds: ['bcs-english-batch1'],
          topicIds: [],
          type: 'mcq',
          difficulty: 'all',
          count: 100,
          source: id,
        },
        QPG_VERIFIED_POOL,
      );
      expect(res.questions).toHaveLength(0);
      expect(res.available).toBe(0);
    }
  });
});
