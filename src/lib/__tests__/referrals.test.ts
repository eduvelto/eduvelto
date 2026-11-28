// Eduvelto — quiz share-and-win referral tests (owner order 28 Nov
// 2026, 12:53). Pure-function pins (bKash/name validation, ref-code
// generator, WhatsApp URL builder) plus mocked-Firestore checks that
// createReferral writes the right doc and recordReferralVisit counts
// at most once per browser per day. The live-rules behaviour is
// covered by emulator-tests/rules-quiz-referrals.test.ts.
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    doc: vi.fn((_db: unknown, collection: string, id: string) => ({
      __path: `${collection}/${id}`,
    })),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    increment: vi.fn((n: number) => ({ __increment: n })),
    serverTimestamp: vi.fn(() => ({ __serverTimestamp: true })),
  };
});

import { doc, setDoc, updateDoc } from 'firebase/firestore';
import {
  EDUVELTO_WHATSAPP_NUMBER,
  buildFacebookShareUrl,
  buildReferralEntryMessage,
  buildReferralLink,
  buildReferralWhatsAppUrl,
  buildWhatsAppShareUrl,
  createReferral,
  generateReferralCode,
  isValidReferralCode,
  normalizeBkashNumber,
  recordReferralVisit,
  referralVisitGuardKey,
  validateBkashNumber,
  validateReferralName,
} from '../referrals';

const mockedSetDoc = vi.mocked(setDoc);
const mockedUpdateDoc = vi.mocked(updateDoc);
const mockedDoc = vi.mocked(doc);

function memoryStorage() {
  const store = new Map<string, string>();
  return {
    store,
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };
}

describe('validateBkashNumber', () => {
  it('accepts exactly 11 digits starting with 01', () => {
    expect(validateBkashNumber('01712345678')).toBeNull();
    expect(validateBkashNumber('01987654321')).toBeNull();
    expect(validateBkashNumber('01300000000')).toBeNull();
  });

  it('accepts Bengali digits (normalised to 0-9)', () => {
    expect(validateBkashNumber('০১৭১২৩৪৫৬৭৮')).toBeNull();
    expect(normalizeBkashNumber('০১৭১২৩৪৫৬৭৮')).toBe('01712345678');
  });

  it('rejects empty input', () => {
    expect(validateBkashNumber('')).toBe('empty');
    expect(validateBkashNumber('   ')).toBe('empty');
  });

  it('rejects anything that is not 11 digits starting with 01', () => {
    expect(validateBkashNumber('1712345678')).toBe('invalid'); // 10 digits
    expect(validateBkashNumber('017123456789')).toBe('invalid'); // 12 digits
    expect(validateBkashNumber('02712345678')).toBe('invalid'); // not 01
    expect(validateBkashNumber('0171234567a')).toBe('invalid'); // letter
    expect(validateBkashNumber('017 1234 5678')).toBe('invalid'); // spaces
    expect(validateBkashNumber('+8801712345678')).toBe('invalid'); // country code
  });
});

describe('validateReferralName', () => {
  it('accepts a non-empty name', () => {
    expect(validateReferralName('রহিম উদ্দিন')).toBeNull();
    expect(validateReferralName('Rahim')).toBeNull();
  });

  it('rejects blank names', () => {
    expect(validateReferralName('')).toBe('empty');
    expect(validateReferralName('   ')).toBe('empty');
  });
});

describe('generateReferralCode', () => {
  it('is 6 chars from letters+digits', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateReferralCode();
      expect(code).toHaveLength(6);
      expect(isValidReferralCode(code)).toBe(true);
    }
  });

  it('is unique across many samples', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      seen.add(generateReferralCode());
    }
    expect(seen.size).toBe(1000);
  });
});

describe('buildReferralLink', () => {
  it('is the /free-quiz URL with the ref code', () => {
    expect(buildReferralLink('aK3xQ9')).toBe(
      'https://eduvelto.com/free-quiz?ref=aK3xQ9',
    );
  });
});

describe('WhatsApp entry URL', () => {
  it('opens wa.me to Eduvelto with name, bKash and code in the message', () => {
    const url = buildReferralWhatsAppUrl('রহিম উদ্দিন', '01712345678', 'aK3xQ9');
    expect(url.startsWith(`https://wa.me/${EDUVELTO_WHATSAPP_NUMBER}?text=`)).toBe(
      true,
    );
    const text = decodeURIComponent(url.split('text=')[1]);
    expect(text).toContain('রহিম উদ্দিন');
    expect(text).toContain('01712345678');
    expect(text).toContain('aK3xQ9');
  });

  it('normalises Bengali-digit bKash numbers in the message', () => {
    const msg = buildReferralEntryMessage('Rahim', '০১৭১২৩৪৫৬৭৮', 'aK3xQ9');
    expect(msg).toContain('01712345678');
  });

  it('builds plain share links for WhatsApp and Facebook', () => {
    const link = buildReferralLink('aK3xQ9');
    expect(buildWhatsAppShareUrl(`খেলুন: ${link}`)).toContain('https://wa.me/?text=');
    const fb = buildFacebookShareUrl(link, 'ফ্রি কুইজ খেলুন');
    expect(fb.startsWith('https://www.facebook.com/sharer/sharer.php?')).toBe(true);
    expect(decodeURIComponent(fb)).toContain(link);
  });
});

describe('createReferral (mocked Firestore)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes quizReferrals/<code> with the required fields and returns the code', async () => {
    const code = await createReferral('রহিম উদ্দিন', {} as never);
    expect(code).toHaveLength(6);
    expect(isValidReferralCode(code)).toBe(true);
    expect(mockedDoc).toHaveBeenCalledWith({}, 'quizReferrals', code);
    expect(mockedSetDoc).toHaveBeenCalledTimes(1);
    const data = mockedSetDoc.mock.calls[0][1] as Record<string, unknown>;
    expect(data).toMatchObject({
      code,
      name: 'রহিম উদ্দিন',
      count: 0,
    });
    expect(data.createdAt).toEqual({ __serverTimestamp: true });
    expect(data.firstSeen).toEqual({ __serverTimestamp: true });
    expect(data.lastSeen).toEqual({ __serverTimestamp: true });
  });

  it('trims the name', async () => {
    await createReferral('  Rahim  ', {} as never);
    const data = mockedSetDoc.mock.calls[0][1] as Record<string, unknown>;
    expect(data.name).toBe('Rahim');
  });
});

describe('recordReferralVisit (mocked Firestore)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('increments once, then is blocked the second time the same day', async () => {
    const storage = memoryStorage();
    await recordReferralVisit('aK3xQ9', {} as never, storage);
    expect(mockedUpdateDoc).toHaveBeenCalledTimes(1);
    const [, patch] = mockedUpdateDoc.mock.calls[0];
    expect(patch).toMatchObject({
      count: { __increment: 1 },
      lastSeen: { __serverTimestamp: true },
    });
    // Same browser, same day — no second write.
    await recordReferralVisit('aK3xQ9', {} as never, storage);
    expect(mockedUpdateDoc).toHaveBeenCalledTimes(1);
    // The guard flag is set in storage for today.
    expect(storage.store.has(referralVisitGuardKey('aK3xQ9'))).toBe(true);
  });

  it('counts again on a different day (different guard key)', async () => {
    const storage = memoryStorage();
    // Simulate yesterday's flag already set (fresh code — the
    // session guard has never seen it).
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    storage.setItem(referralVisitGuardKey('cD4eF5', yesterday), '1');
    await recordReferralVisit('cD4eF5', {} as never, storage);
    expect(mockedUpdateDoc).toHaveBeenCalledTimes(1);
  });

  it('does nothing for an invalid code', async () => {
    const storage = memoryStorage();
    await recordReferralVisit('bad!', {} as never, storage);
    await recordReferralVisit('', {} as never, storage);
    expect(mockedUpdateDoc).not.toHaveBeenCalled();
  });

  it('swallows a failed update (unknown code) silently — never throws', async () => {
    mockedUpdateDoc.mockRejectedValueOnce(new Error('not-found'));
    const storage = memoryStorage();
    await expect(
      recordReferralVisit('aK3xQ9', {} as never, storage),
    ).resolves.toBeUndefined();
    // Failed write must NOT set the guard flag.
    expect(storage.store.has(referralVisitGuardKey('aK3xQ9'))).toBe(false);
  });
});
