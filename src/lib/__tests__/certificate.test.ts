// Shared certificate renderer — pure-logic tests.
//
// Canvas drawing itself is not unit-tested here (it needs a real
// browser canvas); what IS pinned: the five templates (wave
// default + emerald-royal / modern-minimal / heritage /
// classic-gold), the maker builder's passthrough of customizations
// (achievement line + template, no score), the quiz builder's
// unchanged defaults, and the seal removal (28 Nov 2026, owner
// design correction — no seal emblem or seal text is drawn on any
// certificate).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  CERTIFICATE_TEMPLATES,
  FRAMED_CERTIFICATE_FOOTER,
  MAKER_CERTIFICATE_FOOTER,
  QUIZ_CERTIFICATE_FOOTER,
  buildMakerCertificateData,
  buildQuizCertificateData,
  formatCertificateDateLong,
  getCertificateTemplate,
  recipientNameFont,
} from '../certificate';
import { decodeCertificatePayload } from '../freeQuiz';

describe('certificate templates', () => {
  it('has exactly five templates, wave first and default', () => {
    expect(CERTIFICATE_TEMPLATES.map((t) => t.id)).toEqual([
      'wave',
      'emerald-royal',
      'modern-minimal',
      'heritage',
      'classic-gold',
    ]);
    expect(getCertificateTemplate().id).toBe('wave');
    expect(getCertificateTemplate('emerald-royal').nameEn).toBe('Emerald Royal');
    expect(getCertificateTemplate('modern-minimal').nameEn).toBe('Modern Minimal');
    expect(getCertificateTemplate('heritage').nameEn).toBe('Heritage');
    expect(getCertificateTemplate('classic-gold').nameEn).toBe('Classic Gold');
  });

  it('the wave keeps the original quiz palette', () => {
    const wave = getCertificateTemplate('wave');
    expect(wave.primary).toBe('#0A1F44');
    expect(wave.primaryDeep).toBe('#071633');
    expect(wave.gold).toBe('#C9A227');
    expect(wave.body).toBe('#FDFBF3');
    expect(wave.muted).toBe('#5B6B8C');
  });

  it('Bangla-first titles on emerald and heritage, English-first elsewhere', () => {
    expect(getCertificateTemplate('emerald-royal').titleOrder).toBe('bn-first');
    expect(getCertificateTemplate('heritage').titleOrder).toBe('bn-first');
    expect(getCertificateTemplate('wave').titleOrder).toBe('en-first');
    expect(getCertificateTemplate('modern-minimal').titleOrder).toBe('en-first');
    expect(getCertificateTemplate('classic-gold').titleOrder).toBe('en-first');
  });

  it('each framed template has its own band, corner style and ID position', () => {
    expect(getCertificateTemplate('emerald-royal').band).toBe('#0B3D2E');
    expect(getCertificateTemplate('emerald-royal').corner).toBe('diamond');
    expect(getCertificateTemplate('modern-minimal').band).toBe('none');
    expect(getCertificateTemplate('modern-minimal').corner).toBe('square');
    expect(getCertificateTemplate('modern-minimal').idPosition).toBe('right');
    expect(getCertificateTemplate('heritage').band).toBe('#B4552D');
    expect(getCertificateTemplate('heritage').corner).toBe('circle');
    expect(getCertificateTemplate('heritage').footerBand).toBe(true);
    expect(getCertificateTemplate('classic-gold').band).toBe('#142B3B');
    expect(getCertificateTemplate('classic-gold').corner).toBe('diamond');
    expect(getCertificateTemplate('classic-gold').footerBand).toBe(false);
    // The framed name colours differ per template (emerald name in
    // emerald, heritage name in dark brown, minimal/classic in navy).
    expect(getCertificateTemplate('emerald-royal').nameColor).toBe('#0B4D33');
    expect(getCertificateTemplate('heritage').nameColor).toBe('#3D1F0F');
    expect(getCertificateTemplate('modern-minimal').nameColor).toBe('#142B3B');
    expect(getCertificateTemplate('classic-gold').nameColor).toBe('#142B3B');
  });

  it('an unknown template id falls back to wave', () => {
    expect(getCertificateTemplate('fancy' as 'wave').id).toBe('wave');
  });

  it('the old three colour variants of the wave layout are gone', () => {
    const src = readFileSync(new URL('../certificate.ts', import.meta.url), 'utf8');
    expect(src).not.toContain('gold-navy');
    expect(src).not.toContain('teal-gold');
    expect(src).not.toContain('maroon-gold');
    expect(src).not.toContain('CERTIFICATE_THEMES');
    expect(src).not.toContain('getCertificateTheme');
  });
});

describe('buildMakerCertificateData', () => {
  it('carries the custom achievement line and template, and no score', () => {
    const data = buildMakerCertificateData(
      'রহিম উদ্দিন',
      'English Spoken Course',
      '2026-11-28',
      'EDU-2026-4821',
      { achievementLine: 'has successfully completed the Annual Examination', template: 'emerald-royal' },
    );
    expect(data.recipientName).toBe('রহিম উদ্দিন');
    expect(data.achievementLine).toBe(
      'has successfully completed the Annual Examination',
    );
    expect(data.template).toBe('emerald-royal');
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

  it('defaults to no achievement line / template when no options are given', () => {
    const data = buildMakerCertificateData(
      'Rahim Uddin',
      'English Spoken Course',
      '2026-11-28',
      'EDU-2026-4821',
    );
    expect(data.achievementLine).toBeUndefined();
    expect(data.template).toBeUndefined();
  });
});

describe('buildQuizCertificateData (unchanged defaults)', () => {
  it('keeps its score and leaves template / achievement line unset (wave)', () => {
    const data = buildQuizCertificateData(
      'Rahim Uddin',
      'Free Quiz — English',
      8,
      10,
      '2026-11-28',
    );
    expect(data.score).toBe(8);
    expect(data.total).toBe(10);
    expect(data.template).toBeUndefined();
    expect(data.achievementLine).toBeUndefined();
    expect(data.footerNote).toBeUndefined();
    expect(QUIZ_CERTIFICATE_FOOTER).toContain('Practice certificate');
  });
});

describe('recipientNameFont (script detection + template)', () => {
  it('Latin names get an elegant italic serif on the wave', () => {
    const font = recipientNameFont('Rahim Uddin');
    expect(font).toContain('italic');
    // Noto Serif Bengali is what the site loads (index.html) — no
    // Playfair Display is loaded, so the stack falls back to it.
    expect(font).toContain('Noto Serif Bengali');
    expect(font).toContain('Georgia');
  });

  it('Bangla names get a bold Bangla sans on the wave', () => {
    const font = recipientNameFont('রহিম উদ্দিন');
    expect(font).toContain('700');
    expect(font).toContain('Noto Sans Bengali');
    expect(font).toContain('Hind Siliguri');
    expect(font).not.toContain('italic');
  });

  it('a mixed name (any Bangla character) uses the Bangla stack', () => {
    expect(recipientNameFont('Rahim রহিম')).toContain('Hind Siliguri');
  });

  it('framed templates use BOLD serif, never italic, for Latin names', () => {
    for (const id of ['emerald-royal', 'modern-minimal', 'heritage', 'classic-gold'] as const) {
      const font = recipientNameFont('Rahim Uddin', id);
      expect(font).toContain('700');
      expect(font).not.toContain('italic');
      expect(font).toContain('Noto Serif Bengali');
    }
  });

  it('framed templates use bold Bangla for Bangla names', () => {
    for (const id of ['emerald-royal', 'modern-minimal', 'heritage', 'classic-gold'] as const) {
      const font = recipientNameFont('রহিম উদ্দিন', id);
      expect(font).toContain('700');
      expect(font).toContain('Noto Sans Bengali');
      expect(font).toContain('Hind Siliguri');
    }
  });
});

describe('formatCertificateDateLong', () => {
  it('formats an ISO date as "28 November 2026"', () => {
    expect(formatCertificateDateLong('2026-11-28')).toBe('28 November 2026');
    expect(formatCertificateDateLong('2026-01-04')).toBe('4 January 2026');
  });

  it('falls back to the raw string when it does not parse', () => {
    expect(formatCertificateDateLong('28 Nov 2026')).toBe('28 Nov 2026');
    expect(formatCertificateDateLong('2026-13-40')).toBe('2026-13-40');
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

  it('the wave design is intact and the framed designs share one renderer', () => {
    const src = readFileSync(new URL('../certificate.ts', import.meta.url), 'utf8');
    expect(src).toContain('drawWaveEdge');
    expect(src).toContain('drawRosette');
    expect(src).toContain('drawGuilloche');
    expect(src).toContain('drawFramedCertificate');
    // The framed templates carry the gold double border + corner
    // ornaments the wave never had; the wave keeps its own layout.
    expect(src).toContain("template.corner === 'diamond'");
    expect(src).toContain("template.corner === 'circle'");
  });

  it('the rosette reads "QUIZ AWARDS" under a small logo', () => {
    const src = readFileSync(new URL('../certificate.ts', import.meta.url), 'utf8');
    expect(src).toContain("fillText('QUIZ'");
    expect(src).toContain("fillText('AWARDS'");
  });
});

describe('framed templates (shared renderer)', () => {
  it('every framed template carries QR + verification ID and the footer line', () => {
    const src = readFileSync(new URL('../certificate.ts', import.meta.url), 'utf8');
    const framed = src.slice(src.indexOf('function drawFramedCertificate'));
    expect(framed).toContain('drawImage(qr, qrX, qrTop, qrSize, qrSize)');
    expect(framed).toContain('data.verificationId');
    expect(framed).toContain('FRAMED_CERTIFICATE_FOOTER');
    expect(FRAMED_CERTIFICATE_FOOTER).toBe(
      'Eduvelto • Free Education for Bangladesh • eduvelto.com',
    );
    // Heritage footer band: terracotta band with white text.
    expect(framed).toContain('template.footerBand');
    expect(framed).toContain("ctx.fillStyle = '#FFFFFF'");
  });

  it('"Scan to verify" is drawn exactly once per design (no doubled caption)', () => {
    const src = readFileSync(new URL('../certificate.ts', import.meta.url), 'utf8');
    // One in the wave renderer, one in the framed renderer — the
    // minimal sample mock doubled the caption; that glitch is not
    // reproduced, so there must be no third occurrence.
    expect((src.match(/fillText\('Scan to verify'/g) ?? []).length).toBe(2);
  });

  it('the score line is drawn only when a score exists', () => {
    const src = readFileSync(new URL('../certificate.ts', import.meta.url), 'utf8');
    const framed = src.slice(src.indexOf('function drawFramedCertificate'));
    expect(framed).toContain(
      'if (data.score !== undefined && data.total !== undefined)',
    );
    expect(framed).toContain("`Score: ${data.score} out of ${data.total}`");
  });

  it('the Bangla title and the English title are both drawn, in template order', () => {
    const src = readFileSync(new URL('../certificate.ts', import.meta.url), 'utf8');
    const framed = src.slice(src.indexOf('function drawFramedCertificate'));
    expect(framed).toContain("fillText('সাফল্যের সনদপত্র'");
    expect(framed).toContain("fillText('Certificate of Achievement'");
    expect(framed).toContain("template.titleOrder === 'bn-first'");
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
