// Shared certificate renderer — pure-logic tests.
//
// Canvas drawing itself is not unit-tested here (it needs a real
// browser canvas); what IS pinned: the three premium themes, the
// maker builder's passthrough of customizations (achievement line +
// theme, no score), the quiz builder's unchanged defaults, and the
// seal removal (28 Nov 2026, owner design correction — no seal
// emblem or seal text is drawn on either certificate).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  CERTIFICATE_THEMES,
  MAKER_CERTIFICATE_FOOTER,
  QUIZ_CERTIFICATE_FOOTER,
  buildMakerCertificateData,
  buildQuizCertificateData,
  getCertificateTheme,
  recipientNameFont,
} from '../certificate';
import { decodeCertificatePayload } from '../freeQuiz';

describe('certificate themes', () => {
  it('has exactly three premium themes sharing one gold accent', () => {
    expect(CERTIFICATE_THEMES.map((t) => t.id)).toEqual([
      'gold-navy',
      'teal-gold',
      'maroon-gold',
    ]);
    for (const t of CERTIFICATE_THEMES) {
      expect(t.gold).toBe('#C9A227');
      expect(t.goldDark).toBe('#8A6D1B');
      expect(t.ivory).toBe('#FDFBF3');
    }
    const primaries = new Set(CERTIFICATE_THEMES.map((t) => t.navy));
    expect(primaries.size).toBe(3);
  });

  it('gold-navy is the default and keeps the original quiz palette', () => {
    const def = getCertificateTheme();
    expect(def.id).toBe('gold-navy');
    expect(def.navy).toBe('#0A1F44');
    expect(def.navyDeep).toBe('#071633');
    expect(def.muted).toBe('#5B6B8C');
    expect(getCertificateTheme('teal-gold').navy).toBe('#0B4F4A');
    expect(getCertificateTheme('maroon-gold').navy).toBe('#5B1F2A');
  });

  it('an unknown theme id falls back to gold-navy', () => {
    expect(getCertificateTheme('fancy' as 'gold-navy').id).toBe('gold-navy');
  });
});

describe('buildMakerCertificateData', () => {
  it('carries the custom achievement line and theme, and no score', () => {
    const data = buildMakerCertificateData(
      'রহিম উদ্দিন',
      'English Spoken Course',
      '2026-11-28',
      'EDU-2026-4821',
      { achievementLine: 'has successfully completed the Annual Examination', theme: 'teal-gold' },
    );
    expect(data.recipientName).toBe('রহিম উদ্দিন');
    expect(data.achievementLine).toBe(
      'has successfully completed the Annual Examination',
    );
    expect(data.theme).toBe('teal-gold');
    expect(data.score).toBeUndefined();
    expect(data.total).toBeUndefined();
    expect(data.footerNote).toBe(MAKER_CERTIFICATE_FOOTER);
    expect(data.footerNote).not.toContain('Practice certificate');
    // The verify URL decodes back to a no-score payload.
    const parsed = new URL(data.verifyUrl);
    expect(
      decodeCertificatePayload(
        parsed.searchParams.get('d'),
        parsed.pathname.split('/').pop() ?? '',
      ),
    ).toEqual({
      v: 1,
      id: 'EDU-2026-4821',
      n: 'রহিম উদ্দিন',
      q: 'English Spoken Course',
      d: '2026-11-28',
    });
  });

  it('defaults to no achievement line / theme when no options are given', () => {
    const data = buildMakerCertificateData(
      'Rahim Uddin',
      'English Spoken Course',
      '2026-11-28',
      'EDU-2026-4821',
    );
    expect(data.achievementLine).toBeUndefined();
    expect(data.theme).toBeUndefined();
  });
});

describe('buildQuizCertificateData (unchanged defaults)', () => {
  it('keeps its score and leaves theme / achievement line unset', () => {
    const data = buildQuizCertificateData(
      'Rahim Uddin',
      'Free Quiz — English',
      8,
      10,
      '2026-11-28',
    );
    expect(data.score).toBe(8);
    expect(data.total).toBe(10);
    expect(data.theme).toBeUndefined();
    expect(data.achievementLine).toBeUndefined();
    expect(data.footerNote).toBeUndefined();
    expect(QUIZ_CERTIFICATE_FOOTER).toContain('Practice certificate');
  });
});

describe('recipientNameFont (script detection)', () => {
  it('Latin names get an elegant italic serif', () => {
    const font = recipientNameFont('Rahim Uddin');
    expect(font).toContain('italic');
    // Noto Serif Bengali is what the site loads (index.html) — no
    // Playfair Display is loaded, so the stack falls back to it.
    expect(font).toContain('Noto Serif Bengali');
    expect(font).toContain('Georgia');
  });

  it('Bangla names get a bold Bangla sans', () => {
    const font = recipientNameFont('রহিম উদ্দিন');
    expect(font).toContain('700');
    expect(font).toContain('Noto Sans Bengali');
    expect(font).toContain('Hind Siliguri');
    expect(font).not.toContain('italic');
  });

  it('a mixed name (any Bangla character) uses the Bangla stack', () => {
    expect(recipientNameFont('Rahim রহিম')).toContain('Hind Siliguri');
  });
});

describe('no seal on the certificate', () => {
  it('the shared renderer draws no seal emblem or seal text', () => {
    const src = readFileSync(new URL('../certificate.ts', import.meta.url), 'utf8');
    expect(src).not.toContain('drawSeal');
    expect(src).not.toContain('OFFICIAL SEAL');
    expect(src).not.toContain('Official Seal');
    // The "Issued by Eduvelto" line stays — it is not a seal.
    expect(src).toContain("fillText('Issued by Eduvelto'");
  });

  it('the shared renderer draws no signature line', () => {
    const src = readFileSync(new URL('../certificate.ts', import.meta.url), 'utf8');
    expect(src).not.toMatch(/fillText\('[^']*[Ss]ignature/);
    expect(src).not.toContain('Signature:');
    expect(src).not.toContain('drawSignature');
  });

  it('the wave design replaced the ornamental border (not kept as a theme)', () => {
    const src = readFileSync(new URL('../certificate.ts', import.meta.url), 'utf8');
    expect(src).toContain('drawWaveEdge');
    expect(src).toContain('drawRosette');
    expect(src).toContain('drawGuilloche');
    expect(src).not.toContain('Corner diamonds');
    expect(src).not.toContain('strokeRect(36, 36');
  });

  it('the rosette reads "QUIZ AWARDS" under a small logo', () => {
    const src = readFileSync(new URL('../certificate.ts', import.meta.url), 'utf8');
    expect(src).toContain("fillText('QUIZ'");
    expect(src).toContain("fillText('AWARDS'");
  });
});

describe('wave header fill (regression 28 Nov 2026)', () => {
  it('drawWaveEdge has no stray moveTo that would split the header fill', () => {
    const src = readFileSync(new URL('../certificate.ts', import.meta.url), 'utf8');
    const body = src.slice(
      src.indexOf('function drawWaveEdge'),
      src.indexOf('function drawGuilloche'),
    );
    // A ctx.moveTo here breaks the fill path into a zero-area top
    // subpath plus the thin lens between the wave curve and its
    // closing chord — the title area stays ivory and the subtitle
    // vanishes. The curve must continue the caller's subpath, so
    // assert on the actual call (the word may still appear in the
    // explanatory comment above it).
    expect(body).not.toContain('ctx.moveTo');
    expect(body).toContain('lineTo(W, 330)');
    expect(body).toContain('bezierCurveTo');
  });

  it('the header fill is one closed subpath: top edge, wave curve, close', () => {
    const src = readFileSync(new URL('../certificate.ts', import.meta.url), 'utf8');
    const fill = src.slice(
      src.indexOf('// Wave header: navy band'),
      src.indexOf("ctx.fillStyle = NAVY;\n  ctx.fill();"),
    );
    expect(fill).toContain('ctx.moveTo(0, 0);');
    expect(fill).toContain('ctx.lineTo(W, 0);');
    expect(fill).toContain('drawWaveEdge(ctx, W);');
    expect(fill).toContain('ctx.closePath();');
  });

  it('"OF ACHIEVEMENT" is drawn in gold, not ivory, on the navy header', () => {
    const src = readFileSync(new URL('../certificate.ts', import.meta.url), 'utf8');
    const segment = src.slice(
      src.indexOf("fillText('CERTIFICATE'"),
      src.indexOf("fillText('OF ACHIEVEMENT'"),
    );
    expect(segment).toContain('GOLD');
    expect(segment).not.toContain('IVORY');
  });
});
