// Eduvelto — unit tests for the central ad placement config
// (owner brief 22 Nov 2026 10:43 + exam rule 22 Nov 2026 10:45).
// Pure functions only — no DOM, no Firebase, no network.
import { describe, expect, it } from 'vitest';
import {
  ADS_MASTER_ENABLED,
  BOTTOM_BANNER_SMALL_RESERVE_PX,
  EXAM_BANNER_MAX_HEIGHT_PX,
  adsActive,
  getAdRenderState,
  getBannerPlacementForPath,
  getBannerReservePx,
  getPageAdType,
  isInPageSlotAllowed,
  isPreviewHostname,
} from '../adsConfig';
import { AD_PLACEMENTS, type AdPlacement } from '../ads';

const ALL_PLACEMENTS: AdPlacement[] = [
  'bottom-banner',
  'bottom-banner-small',
  'top-banner',
  'sidebar',
  'in-content',
  'in-feed',
  'in-feed-2',
  'mobile',
];

describe('getPageAdType', () => {
  it('classifies the main routes', () => {
    expect(getPageAdType('/')).toBe('home');
    expect(getPageAdType('/class')).toBe('section-hub');
    expect(getPageAdType('/jobs')).toBe('section-hub');
    expect(getPageAdType('/admissions')).toBe('section-hub');
    expect(getPageAdType('/skills')).toBe('section-hub');
    expect(getPageAdType('/class/6')).toBe('class-dashboard');
    expect(getPageAdType('/class/6/books')).toBe('class-dashboard');
    expect(getPageAdType('/class/6/subjects/bangla')).toBe('class-dashboard');
    expect(getPageAdType('/library')).toBe('library');
    expect(getPageAdType('/library/abc')).toBe('book');
    expect(getPageAdType('/books/b/chapters/c')).toBe('chapter');
    expect(getPageAdType('/lessons/l1')).toBe('lesson');
    expect(getPageAdType('/directory')).toBe('directory');
    expect(getPageAdType('/subjects/math')).toBe('subject');
    expect(getPageAdType('/student')).toBe('dashboard');
    expect(getPageAdType('/teacher')).toBe('dashboard');
    expect(getPageAdType('/guardian')).toBe('dashboard');
    expect(getPageAdType('/dashboard')).toBe('dashboard');
    expect(getPageAdType('/profile')).toBe('profile');
    expect(getPageAdType('/profile/guardian-links')).toBe('profile');
    expect(getPageAdType('/ai-teacher')).toBe('ai-teacher');
    expect(getPageAdType('/routine')).toBe('routine');
    expect(getPageAdType('/progress')).toBe('progress');
    expect(getPageAdType('/social')).toBe('social');
    expect(getPageAdType('/health')).toBe('health');
    expect(getPageAdType('/health/medicines')).toBe('health');
    expect(getPageAdType('/about')).toBe('info');
    expect(getPageAdType('/founder')).toBe('info');
    expect(getPageAdType('/contact')).toBe('info');
    expect(getPageAdType('/privacy')).toBe('info');
  });

  it('classifies auth and admin routes', () => {
    expect(getPageAdType('/login')).toBe('auth');
    expect(getPageAdType('/register')).toBe('auth');
    expect(getPageAdType('/register/role')).toBe('auth');
    expect(getPageAdType('/teacher/register')).toBe('auth');
    expect(getPageAdType('/admin')).toBe('admin');
    expect(getPageAdType('/admin/ads')).toBe('admin');
    expect(getPageAdType('/admin/users/xyz')).toBe('admin');
  });

  it('classifies the exam flow (active quiz, exam page, result)', () => {
    expect(getPageAdType('/quiz/abc')).toBe('exam');
    expect(getPageAdType('/exam')).toBe('exam');
    expect(getPageAdType('/quiz/abc/result/xyz')).toBe('exam-result');
  });

  it('ignores query strings and trailing slashes; unknown paths fall back', () => {
    expect(getPageAdType('/library?search=math')).toBe('library');
    expect(getPageAdType('/library/')).toBe('library');
    expect(getPageAdType('/something-unknown')).toBe('unknown');
  });
});

describe('getBannerPlacementForPath — the exam-small enforcement point', () => {
  it('returns null (no banner at all) on auth and admin pages', () => {
    for (const path of ['/login', '/register', '/register/role', '/teacher/register', '/admin', '/admin/ads']) {
      expect(getBannerPlacementForPath(path)).toBeNull();
    }
  });

  it('returns ONLY the small banner on exam pages (owner rule 22 Nov 2026 10:45)', () => {
    expect(getBannerPlacementForPath('/quiz/abc')).toBe('bottom-banner-small');
    expect(getBannerPlacementForPath('/exam')).toBe('bottom-banner-small');
    expect(getBannerPlacementForPath('/quiz/abc/result/xyz')).toBe('bottom-banner-small');
  });

  it('returns the full banner everywhere else', () => {
    for (const path of ['/', '/library', '/lessons/l1', '/ai-teacher', '/profile', '/about', '/directory', '/class/6']) {
      expect(getBannerPlacementForPath(path)).toBe('bottom-banner');
    }
  });
});

describe('getBannerReservePx', () => {
  it('reserves 96px for the full banner, 56px for the exam small banner, 0 for none', () => {
    expect(getBannerReservePx('bottom-banner')).toBe(96);
    expect(getBannerReservePx('bottom-banner-small')).toBe(BOTTOM_BANNER_SMALL_RESERVE_PX);
    expect(BOTTOM_BANNER_SMALL_RESERVE_PX).toBe(56);
    expect(EXAM_BANNER_MAX_HEIGHT_PX).toBe(50);
    expect(getBannerReservePx(null)).toBe(0);
  });
});

describe('isInPageSlotAllowed', () => {
  it('allows only the planned slots per page type', () => {
    expect(isInPageSlotAllowed('home', 'top-banner')).toBe(true);
    expect(isInPageSlotAllowed('home', 'sidebar')).toBe(false);
    expect(isInPageSlotAllowed('class-dashboard', 'sidebar')).toBe(true);
    expect(isInPageSlotAllowed('class-dashboard', 'in-content')).toBe(true);
    expect(isInPageSlotAllowed('class-dashboard', 'mobile')).toBe(true);
    expect(isInPageSlotAllowed('class-dashboard', 'top-banner')).toBe(false);
    expect(isInPageSlotAllowed('library', 'in-feed')).toBe(true);
    expect(isInPageSlotAllowed('library', 'in-feed-2')).toBe(true);
    expect(isInPageSlotAllowed('library', 'in-content')).toBe(false);
    expect(isInPageSlotAllowed('directory', 'in-content')).toBe(true);
    expect(isInPageSlotAllowed('directory', 'sidebar')).toBe(false);
  });

  it('never allows an in-page slot on exam pages (any placement)', () => {
    for (const p of ALL_PLACEMENTS) {
      expect(isInPageSlotAllowed('exam', p)).toBe(false);
      expect(isInPageSlotAllowed('exam-result', p)).toBe(false);
    }
  });

  it('never allows an in-page slot on reading, auth, or admin pages', () => {
    for (const type of ['book', 'chapter', 'lesson', 'auth', 'admin'] as const) {
      for (const p of ALL_PLACEMENTS) {
        expect(isInPageSlotAllowed(type, p)).toBe(false);
      }
    }
  });

  it('never treats a banner as an in-page slot', () => {
    for (const type of ['home', 'library', 'class-dashboard', 'directory'] as const) {
      expect(isInPageSlotAllowed(type, 'bottom-banner')).toBe(false);
      expect(isInPageSlotAllowed(type, 'bottom-banner-small')).toBe(false);
    }
  });
});

describe('master switch', () => {
  it('is OFF by default — no ad can render until activation', () => {
    expect(ADS_MASTER_ENABLED).toBe(false);
  });

  it('adsActive() is false for every placement while the master switch is off — the AdSense script loader relies on this gate (it only runs when a slot state is "ad")', () => {
    for (const p of ALL_PLACEMENTS) {
      expect(adsActive(p)).toBe(false);
    }
  });

  it('every placement has a definition (admin page renders all of them)', () => {
    const ids = AD_PLACEMENTS.map((p) => p.id).sort();
    expect(ids).toEqual([...ALL_PLACEMENTS].sort());
  });
});

describe('isPreviewHostname', () => {
  it('detects Firebase preview channels and localhost only', () => {
    expect(isPreviewHostname('localhost')).toBe(true);
    expect(isPreviewHostname('127.0.0.1')).toBe(true);
    expect(isPreviewHostname('eduvelto--ads-placements-abc123.web.app')).toBe(true);
    expect(isPreviewHostname('eduvelto.web.app')).toBe(false);
    expect(isPreviewHostname('eduvelto.com')).toBe(false);
    expect(isPreviewHostname('www.eduvelto.com')).toBe(false);
    expect(isPreviewHostname('')).toBe(false);
  });
});

describe('getAdRenderState', () => {
  it('renders nothing when the master switch is off and this is not a preview host', () => {
    for (const p of ALL_PLACEMENTS) {
      expect(getAdRenderState(p)).toBe('none');
    }
  });

  it('renders the labelled placeholder (never a fake ad) on a preview host', () => {
    (globalThis as unknown as { window: unknown }).window = {
      location: { hostname: 'eduvelto--ads-placements-abc123.web.app' },
    };
    try {
      for (const p of ALL_PLACEMENTS) {
        expect(getAdRenderState(p)).toBe('placeholder');
      }
    } finally {
      delete (globalThis as unknown as { window?: unknown }).window;
    }
  });
});
