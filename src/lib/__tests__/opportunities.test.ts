// Eduvelto — Global Opportunity Hub unit tests (directive §3B, 23 Nov 2026).
//
// The honesty model is the thing under test: status is computed
// from official dates (never stored, never guessed); a missing
// deadline is "unknown" with no countdown; Apply appears only
// for verified + linked + open/rolling listings; published and
// verified are separate dimensions. The seed-integrity block
// pins the 7 verified listings (source + deadline each) — a
// changed deadline or a dropped listing fails loudly here.
//
// Runs under plain node: opportunities.ts has no browser or
// Firebase imports.

import { describe, expect, it } from 'vitest';
import {
  canShowApply,
  EMPTY_OPPORTUNITY_FILTERS,
  filterOpportunities,
  formatOpportunityDate,
  isOpportunityVerified,
  isPublished,
  opportunityDeadlineLine,
  opportunityDomain,
  opportunityFromStored,
  opportunityStatus,
  sortOpportunities,
  validateOpportunity,
  verificationLevelLine,
  type Opportunity,
} from '../opportunities';
import { OPPORTUNITY_SEED, seedOpportunities } from '../opportunitySeed';

const NOV_23 = Date.UTC(2026, 10, 23, 0, 0, 0); // 23 Nov 2026 00:00 UTC
const NOV_30_NOON_UTC = Date.UTC(2026, 10, 30, 12, 0, 0); // 30 Nov 2026 18:00 Dhaka

function makeOpp(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    docId: 'test-opp',
    type: 'job',
    titleBn: 'পরীক্ষামূলক সুযোগ',
    titleEn: 'Test Opportunity',
    organizationBn: 'পরীক্ষা সংস্থা',
    organizationEn: 'Test Organisation',
    countryBn: 'বাংলাদেশ',
    countryEn: 'Bangladesh',
    eligibilityBn: 'মূল বিজ্ঞপ্তিতে দেখুন',
    eligibilityEn: 'See the original notice',
    descriptionBn: 'বিবরণ',
    descriptionEn: 'Description',
    sourceName: 'Test Source',
    sourceUrl: 'https://example.gov.bd/notice',
    applyUrl: 'https://example.gov.bd/apply',
    publishedDateMillis: NOV_23,
    deadlineMillis: NOV_30_NOON_UTC,
    deadlinePrecision: 'date_only',
    isPlatform: false,
    verificationLevel: 'official',
    verificationNoteBn: null,
    verificationNoteEn: null,
    verifiedBy: 'verifier-1',
    verifiedAtMillis: NOV_23,
    reviewStatus: 'Published',
    authorId: 'author-1',
    createdAtMillis: NOV_23,
    updatedAtMillis: NOV_23,
    ...overrides,
  };
}

/** The stored (Firestore) shape of a fixture — the validator's
 * contract: publishedDate / applicationDeadline, not *Millis. */
function storedOf(o: Opportunity): Record<string, unknown> {
  return {
    type: o.type,
    titleBn: o.titleBn,
    titleEn: o.titleEn,
    organizationBn: o.organizationBn,
    organizationEn: o.organizationEn,
    countryBn: o.countryBn,
    countryEn: o.countryEn,
    eligibilityBn: o.eligibilityBn,
    eligibilityEn: o.eligibilityEn,
    descriptionBn: o.descriptionBn,
    descriptionEn: o.descriptionEn,
    sourceName: o.sourceName,
    sourceUrl: o.sourceUrl,
    applyUrl: o.applyUrl,
    publishedDate: o.publishedDateMillis,
    applicationDeadline: o.deadlineMillis,
    deadlinePrecision: o.deadlinePrecision,
    isPlatform: o.isPlatform,
    verificationLevel: o.verificationLevel,
    verificationNoteBn: o.verificationNoteBn,
    verificationNoteEn: o.verificationNoteEn,
    verifiedBy: o.verifiedBy,
    verifiedAt: o.verifiedAtMillis,
    reviewStatus: o.reviewStatus,
    authorId: o.authorId,
    createdAt: o.createdAtMillis,
    updatedAt: o.updatedAtMillis,
  };
}

describe('opportunityStatus — computed from official dates only', () => {
  it('a platform with no deadline is rolling, never unknown', () => {
    const o = makeOpp({ isPlatform: true, deadlineMillis: null });
    expect(opportunityStatus(o, NOV_23)).toBe('rolling');
  });

  it('a dated listing with no deadline is unknown, never open', () => {
    const o = makeOpp({ deadlineMillis: null });
    expect(opportunityStatus(o, NOV_23)).toBe('unknown');
  });

  it('a date-only deadline closes at end of the Dhaka day', () => {
    const o = makeOpp({ deadlineMillis: Date.UTC(2026, 10, 30), deadlinePrecision: 'date_only' });
    // 30 Nov 12:00 UTC = 18:00 Dhaka on the deadline day: still open.
    expect(opportunityStatus(o, Date.UTC(2026, 10, 30, 12, 0, 0))).toBe('closing-soon');
    // 30 Nov 18:00 UTC = 00:00 Dhaka on 1 Dec: closed.
    expect(opportunityStatus(o, Date.UTC(2026, 10, 30, 18, 0, 0))).toBe('closed');
  });

  it('a datetime deadline closes at the exact instant', () => {
    // BPSC: 30 Nov 2026, 6:00 PM Dhaka = 12:00 UTC.
    const o = makeOpp({ deadlineMillis: NOV_30_NOON_UTC, deadlinePrecision: 'datetime' });
    expect(opportunityStatus(o, Date.UTC(2026, 10, 30, 11, 59, 59))).toBe('closing-soon');
    expect(opportunityStatus(o, Date.UTC(2026, 10, 30, 12, 0, 1))).toBe('closed');
  });

  it('3 days or fewer left is closing-soon; more is open', () => {
    const o = makeOpp({ deadlineMillis: Date.UTC(2026, 10, 30), deadlinePrecision: 'date_only' });
    expect(opportunityStatus(o, Date.UTC(2026, 10, 26, 0, 0, 0))).toBe('open'); // 4 days left
    expect(opportunityStatus(o, Date.UTC(2026, 10, 27, 0, 0, 0))).toBe('closing-soon'); // 3 days left
  });
});

describe('opportunityDeadlineLine — no confirmed deadline, no countdown', () => {
  it('rolling shows no countdown', () => {
    const o = makeOpp({ isPlatform: true, deadlineMillis: null });
    expect(opportunityDeadlineLine(o, NOV_23).bn).toContain('সবসময় খোলা');
  });

  it('unknown shows the honest not-available line', () => {
    const o = makeOpp({ deadlineMillis: null });
    const line = opportunityDeadlineLine(o, NOV_23);
    expect(line.bn).toContain('তথ্য পাওয়া যায়নি');
    expect(line.en).toContain('Not available');
    expect(line.bn).not.toMatch(/দিন বাকি/);
  });

  it('closed shows "আবেদন শেষ"', () => {
    const o = makeOpp({ deadlineMillis: Date.UTC(2026, 10, 20), deadlinePrecision: 'date_only' });
    expect(opportunityDeadlineLine(o, NOV_23).bn).toBe('আবেদনের সময় শেষ');
  });

  it('open shows a Bangla-digit countdown', () => {
    const o = makeOpp({ deadlineMillis: Date.UTC(2026, 10, 30), deadlinePrecision: 'date_only' });
    expect(opportunityDeadlineLine(o, Date.UTC(2026, 10, 25, 0, 0, 0)).bn).toBe('আর ৫ দিন বাকি');
  });

  it('the last day says so', () => {
    const o = makeOpp({ deadlineMillis: Date.UTC(2026, 10, 30), deadlinePrecision: 'date_only' });
    expect(opportunityDeadlineLine(o, Date.UTC(2026, 10, 30, 12, 0, 0)).bn).toBe('আজ শেষ দিন');
  });
});

describe('canShowApply — verified + linked + open/rolling only', () => {
  it('verified, linked and open shows Apply', () => {
    expect(canShowApply(makeOpp(), NOV_23)).toBe(true);
  });

  it('unverified never shows Apply, even when open and linked', () => {
    expect(canShowApply(makeOpp({ verifiedBy: null }), NOV_23)).toBe(false);
    expect(canShowApply(makeOpp({ verifiedBy: '   ' }), NOV_23)).toBe(false);
  });

  it('no apply link means no Apply button', () => {
    expect(canShowApply(makeOpp({ applyUrl: null }), NOV_23)).toBe(false);
  });

  it('closed and unknown never show Apply', () => {
    expect(
      canShowApply(makeOpp({ deadlineMillis: Date.UTC(2026, 10, 20), deadlinePrecision: 'date_only' }), NOV_23),
    ).toBe(false);
    expect(canShowApply(makeOpp({ deadlineMillis: null }), NOV_23)).toBe(false);
  });

  it('a rolling platform shows Apply', () => {
    expect(canShowApply(makeOpp({ isPlatform: true, deadlineMillis: null }), NOV_23)).toBe(true);
  });
});

describe('published vs verified are separate dimensions', () => {
  it('Published without a verifier is published, not verified', () => {
    const o = makeOpp({ verifiedBy: null });
    expect(isPublished(o)).toBe(true);
    expect(isOpportunityVerified(o)).toBe(false);
  });

  it('a draft is not published even with a verifier', () => {
    const o = makeOpp({ reviewStatus: 'Under Review' });
    expect(isPublished(o)).toBe(false);
    expect(isOpportunityVerified(o)).toBe(true);
  });
});

describe('validateOpportunity / opportunityFromStored', () => {
  it('a valid stored doc passes and normalises', () => {
    const o = makeOpp();
    expect(validateOpportunity(storedOf(o), o.docId)).toEqual([]);
    const back = opportunityFromStored(o.docId, storedOf(o));
    expect(back?.docId).toBe(o.docId);
    expect(back?.deadlineMillis).toBe(NOV_30_NOON_UTC);
  });

  it('rejects a bad type, a non-http source URL and an unknown key', () => {
    const bad = storedOf(makeOpp());
    bad.type = 'lottery';
    bad.sourceUrl = 'ftp://example.com/x';
    bad.surprise = true;
    const problems = validateOpportunity(bad, 'test-opp');
    expect(problems.some((p) => p.includes('type must be one of'))).toBe(true);
    expect(problems.some((p) => p.includes('sourceUrl must be an http(s) URL'))).toBe(true);
    expect(problems.some((p) => p.includes("unexpected key 'surprise'"))).toBe(true);
    expect(opportunityFromStored('test-opp', bad)).toBeNull();
  });

  it('a platform listing must not carry a deadline', () => {
    const bad = storedOf(makeOpp({ isPlatform: true, deadlineMillis: NOV_30_NOON_UTC }));
    const problems = validateOpportunity(bad, 'test-opp');
    expect(problems.some((p) => p.includes('must not carry a deadline'))).toBe(true);
  });

  it('rejects a bad reviewStatus and a bad verificationLevel', () => {
    const bad = storedOf(makeOpp());
    bad.reviewStatus = 'published'; // lowercase — the rules check capital-'Published'
    bad.verificationLevel = 'hearsay';
    const problems = validateOpportunity(bad, 'test-opp');
    expect(problems.some((p) => p.includes('reviewStatus must be one of'))).toBe(true);
    expect(problems.some((p) => p.includes('verificationLevel must be'))).toBe(true);
  });
});

describe('sortOpportunities — open first (nearest deadline), closed last', () => {
  it('orders open < rolling < unknown < closed, nearest deadline first', () => {
    const openFar = makeOpp({ docId: 'open-far', deadlineMillis: Date.UTC(2026, 11, 10), deadlinePrecision: 'date_only' });
    const openNear = makeOpp({ docId: 'open-near', deadlineMillis: Date.UTC(2026, 10, 28), deadlinePrecision: 'date_only' });
    const rolling = makeOpp({ docId: 'rolling', isPlatform: true, deadlineMillis: null });
    const unknown = makeOpp({ docId: 'unknown', deadlineMillis: null });
    const closed = makeOpp({ docId: 'closed', deadlineMillis: Date.UTC(2026, 10, 20), deadlinePrecision: 'date_only' });
    const sorted = sortOpportunities([closed, unknown, rolling, openFar, openNear], NOV_23);
    expect(sorted.map((o) => o.docId)).toEqual(['open-near', 'open-far', 'rolling', 'unknown', 'closed']);
  });
});

describe('filterOpportunities', () => {
  const list = [
    makeOpp({ docId: 'a', type: 'job', verifiedBy: 'v1' }),
    makeOpp({ docId: 'b', type: 'scholarship', verifiedBy: null, titleEn: 'Shared Scholarship' }),
    makeOpp({ docId: 'c', type: 'job', verifiedBy: 'v1', titleBn: 'রিমোট লেখক' }),
  ];

  it('filters by type and by verified-only', () => {
    expect(filterOpportunities(list, { ...EMPTY_OPPORTUNITY_FILTERS, type: 'job' }).map((o) => o.docId)).toEqual([
      'a',
      'c',
    ]);
    expect(filterOpportunities(list, { ...EMPTY_OPPORTUNITY_FILTERS, verifiedOnly: true }).map((o) => o.docId)).toEqual([
      'a',
      'c',
    ]);
  });

  it('filters by computed status', () => {
    const closed = makeOpp({ docId: 'd', deadlineMillis: Date.UTC(2026, 10, 20), deadlinePrecision: 'date_only' });
    const res = filterOpportunities([...list, closed], { ...EMPTY_OPPORTUNITY_FILTERS, status: 'closed' }, NOV_23);
    expect(res.map((o) => o.docId)).toEqual(['d']);
  });

  it('searches Bangla and English titles', () => {
    expect(filterOpportunities(list, { ...EMPTY_OPPORTUNITY_FILTERS, search: 'scholarship' }).map((o) => o.docId)).toEqual([
      'b',
    ]);
    expect(filterOpportunities(list, { ...EMPTY_OPPORTUNITY_FILTERS, search: 'রিমোট' }).map((o) => o.docId)).toEqual([
      'c',
    ]);
  });
});

describe('opportunityDomain + verificationLevelLine + formatOpportunityDate', () => {
  it('shows the hostname so users see where a link goes', () => {
    expect(opportunityDomain('https://www.bpsc.gov.bd/notice')).toBe('www.bpsc.gov.bd');
    expect(opportunityDomain('not a url')).toBe('not a url');
  });

  it('states the verification level plainly', () => {
    expect(verificationLevelLine(makeOpp({ verificationLevel: 'official' })).bn).toContain('অফিসিয়াল পাতা খুলে পড়ে');
    expect(verificationLevelLine(makeOpp({ verificationLevel: 'official-indexed' })).bn).toContain('আবার খুলে দেখা বাকি');
  });

  it('formats dates in Dhaka with the year', () => {
    expect(formatOpportunityDate(NOV_30_NOON_UTC, 'en', false)).toContain('2026');
    expect(formatOpportunityDate(NOV_30_NOON_UTC, 'bn', false)).toContain('২০২৬');
    expect(formatOpportunityDate(NOV_30_NOON_UTC, 'bn', true)).toContain('৬:০০');
  });
});

describe('seed integrity — the 7 verified listings (23 Nov 2026)', () => {
  it('all 7 seed rows validate and render (no row is silently dropped)', () => {
    expect(OPPORTUNITY_SEED).toHaveLength(7);
    const rendered = seedOpportunities();
    expect(rendered).toHaveLength(7);
    expect(rendered.map((o) => o.docId).sort()).toEqual([
      'bpsc-non-cadre-2026',
      'commonwealth-shared-2027',
      'google-skillshop',
      'kaggle-learn',
      'undrr-intern-pm-2026',
      'unicef-writer-editor-2026',
      'upwork',
    ]);
  });

  it('every seed listing is Published + verified, with an https source and an https-or-null apply link', () => {
    for (const o of seedOpportunities()) {
      expect(isPublished(o)).toBe(true);
      expect(isOpportunityVerified(o)).toBe(true);
      expect(o.sourceUrl.startsWith('https://')).toBe(true);
      expect(o.applyUrl === null || o.applyUrl.startsWith('http')).toBe(true);
      expect(o.descriptionBn.trim().length).toBeGreaterThan(20);
      expect(o.descriptionEn.trim().length).toBeGreaterThan(20);
    }
  });

  it('BPSC: deadline 30 Nov 2026, 6:00 PM Dhaka (datetime); no published date; official-indexed, 147 posts verified', () => {
    const o = seedOpportunities().find((x) => x.docId === 'bpsc-non-cadre-2026')!;
    expect(o.deadlineMillis).toBe(Date.UTC(2026, 10, 30, 12, 0, 0));
    expect(o.deadlinePrecision).toBe('datetime');
    expect(o.publishedDateMillis).toBeNull();
    expect(o.verificationLevel).toBe('official-indexed');
    // Website audit, 24 Nov 2026: the 133-vs-147 disagreement is
    // resolved — 147 posts, verified from circulars (78–82) and
    // (83–96)/2026; the note no longer says to re-check before going live.
    expect(o.verificationNoteBn).toContain('১৪৭টি');
    expect(o.verificationNoteBn).not.toContain('১৩৩ বনাম ১৪৭');
    expect(o.descriptionBn).toContain('১৪৭টি');
    expect(o.descriptionEn).toContain('147 posts');
    expect(opportunityStatus(o, NOV_23)).toBe('open');
  });

  it('UNICEF Writer/Editor: published 16 Nov 2026, deadline 25 Nov 2026 (date-only), official', () => {
    const o = seedOpportunities().find((x) => x.docId === 'unicef-writer-editor-2026')!;
    expect(o.publishedDateMillis).toBe(Date.UTC(2026, 10, 16));
    expect(o.deadlineMillis).toBe(Date.UTC(2026, 10, 25));
    expect(o.deadlinePrecision).toBe('date_only');
    expect(o.verificationLevel).toBe('official');
    expect(opportunityStatus(o, NOV_23)).toBe('closing-soon');
  });

  it('UNDRR intern: published 15 Nov 2026, deadline 30 Nov 2026 (date-only), official-indexed', () => {
    const o = seedOpportunities().find((x) => x.docId === 'undrr-intern-pm-2026')!;
    expect(o.publishedDateMillis).toBe(Date.UTC(2026, 10, 15));
    expect(o.deadlineMillis).toBe(Date.UTC(2026, 10, 30));
    expect(o.verificationLevel).toBe('official-indexed');
  });

  it('Commonwealth Shared Scholarships: deadline 8 Dec 2026, 16:00 GMT (datetime), official', () => {
    const o = seedOpportunities().find((x) => x.docId === 'commonwealth-shared-2027')!;
    expect(o.deadlineMillis).toBe(Date.UTC(2026, 11, 8, 16, 0, 0));
    expect(o.deadlinePrecision).toBe('datetime');
    expect(o.verificationLevel).toBe('official');
    expect(opportunityStatus(o, NOV_23)).toBe('open');
  });

  it('the three platforms are rolling, deadline-free and official', () => {
    for (const id of ['kaggle-learn', 'google-skillshop', 'upwork']) {
      const o = seedOpportunities().find((x) => x.docId === id)!;
      expect(o.isPlatform).toBe(true);
      expect(o.deadlineMillis).toBeNull();
      expect(o.verificationLevel).toBe('official');
      expect(opportunityStatus(o, NOV_23)).toBe('rolling');
      expect(canShowApply(o, NOV_23)).toBe(true);
    }
  });
});
