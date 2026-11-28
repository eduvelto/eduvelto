// Eduvelto — Certificate verification page (owner order 28 Nov
// 2026, quiz + certificate batch).
//
// Route /verify/:id (+ /bn/verify/:id, /en/verify/:id). Scanning a
// certificate QR or visiting its link NEVER shows a 404: this page
// always renders (HTTP 200) — with the certificate's details when
// the link carries a valid self-contained payload (?d= base64url
// JSON), or a clear on-page "could not be verified" state when the
// ID has no matching data or the link is malformed.
//
// HONESTY: certificates are client-side only with no server record,
// so this page verifies the data carried in the link itself — it
// never claims a server lookup.

import { Link, useParams, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Button, Card } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { decodeCertificatePayload } from '../lib/freeQuiz';

export default function VerifyCertificatePage() {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const payload = decodeCertificatePayload(searchParams.get('d'), id);

  if (!payload) {
    return (
      <PageShell titleBn="সার্টিফিকেট যাচাই" titleEn="Verify certificate">
        <Card style={{ borderTop: '4px solid #B00020' }}>
          <h2 style={{ fontSize: 20, margin: '0 0 10px', color: 'var(--heading)' }}>
            {t({ bn: 'এই সার্টিফিকেটটি যাচাই করা যায়নি', en: 'This certificate could not be verified' })}
          </h2>
          <p style={{ lineHeight: 1.8, margin: '0 0 8px' }}>
            {t({
              bn: `“${id}” — এই আইডির সাথে মিলে এমন কোনো সার্টিফিকেটের তথ্য এই লিংকে নেই। হয়তো লিংকটি অসম্পূর্ণ, অথবা QR কোডটি আসল Eduvelto সার্টিফিকেটের নয়।`,
              en: `“${id}” — this link carries no certificate data matching this ID. The link may be incomplete, or the QR code may not be from a genuine Eduvelto certificate.`,
            })}
          </p>
          <p style={{ lineHeight: 1.8, margin: '0 0 16px', color: 'var(--muted)', fontSize: 14 }}>
            {t({
              bn: 'Eduvelto-র সার্টিফিকেটের তথ্য শুধু এর যাচাই লিংকেই থাকে — সার্ভারে কোনো রেকর্ড নেই, তাই শুধু আইডি দিয়ে যাচাই করা যায় না। আসল সার্টিফিকেটের QR কোড স্ক্যান করলে বা এর সম্পূর্ণ লিংক খুললে এখানে প্রাপকের নাম, কুইজ ও নম্বর দেখা যাবে।',
              en: 'An Eduvelto certificate\u2019s details live only in its verify link — there is no server record, so an ID alone cannot be verified. Scanning a genuine certificate\u2019s QR code, or opening its full link, shows the recipient, quiz and score here.',
            })}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Link to="/free-quiz">
              <Button>{t({ bn: 'ফ্রি কুইজ খেলুন →', en: 'Take the free quiz →' })}</Button>
            </Link>
            <Link to="/">
              <Button variant="outline">{t({ bn: 'হোমে ফিরুন', en: 'Back to home' })}</Button>
            </Link>
          </div>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell titleBn="সার্টিফিকেট যাচাই" titleEn="Verify certificate">
      <Card style={{ borderTop: '4px solid #C9A227', textAlign: 'center', padding: '28px 20px' }}>
        <p style={{ margin: '0 0 4px', fontSize: 13, letterSpacing: 2, color: '#8A6D1B', fontWeight: 700 }}>
          EDUVELTO
        </p>
        <h2 style={{ fontSize: 26, margin: '0 0 6px', color: '#0A1F44' }}>
          {t({ bn: 'সার্টিফিকেট', en: 'Certificate' })}
        </h2>
        <div style={{ width: 72, margin: '0 auto 16px', borderTop: '2px solid #C9A227' }} />
        <p style={{ margin: '0 0 8px', color: 'var(--muted)', fontSize: 14 }}>
          {t({ bn: 'এই সার্টিফিকেটটি দেওয়া হয়েছে', en: 'This certificate was presented to' })}
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 30, fontWeight: 700, color: '#0A1F44' }}>
          {payload.n}
        </p>
        <p style={{ margin: '0 0 8px', color: 'var(--muted)', fontSize: 14 }}>
          {t({ bn: 'সফলভাবে সম্পন্ন করেছেন', en: 'for successfully completing' })}
        </p>
        <p style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 700, color: '#0A1F44' }}>
          {payload.q}
        </p>
        {payload.s !== undefined ? (
          <p style={{ margin: '0 0 4px', fontSize: 16 }}>
            {t({ bn: `নম্বর: ${payload.s} / 10`, en: `Score: ${payload.s} / 10` })}
          </p>
        ) : null}
        <p style={{ margin: '0 0 4px', fontSize: 15, color: 'var(--heading)' }}>
          {t({ bn: `তারিখ: ${payload.d}`, en: `Date: ${payload.d}` })}
        </p>
        <p style={{ margin: '0 0 16px', fontSize: 15, color: 'var(--heading)' }}>
          {t({ bn: 'যাচাই আইডি: ', en: 'Verification ID: ' })}
          <strong>{payload.id}</strong>
        </p>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
          {payload.s !== undefined
            ? t({
                bn: 'এই বিবরণ এই লিংক থেকেই যাচাই করা হয়েছে — Eduvelto-র সার্ভারে এই সার্টিফিকেটের কোনো রেকর্ড নেই। এটি একটি অনুশীলন সার্টিফিকেট; এর কোনো স্বীকৃত মূল্য নেই।',
                en: 'These details were verified from this link itself — Eduvelto keeps no server record of this certificate. It is a practice certificate and carries no recognised value.',
              })
            : t({
                bn: 'এই বিবরণ এই লিংক থেকেই যাচাই করা হয়েছে — Eduvelto-র সার্ভারে এই সার্টিফিকেটের কোনো রেকর্ড নেই।',
                en: 'These details were verified from this link itself — Eduvelto keeps no server record of this certificate.',
              })}
        </p>
        <Link to="/free-quiz">
          <Button>{t({ bn: 'নিজের কুইজ খেলুন →', en: 'Take your own quiz →' })}</Button>
        </Link>
      </Card>
    </PageShell>
  );
}
