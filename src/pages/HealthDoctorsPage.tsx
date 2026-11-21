import { useEffect, useState } from 'react';
import { strings } from '../i18n/strings';
import { PageShell, EmptyState } from '../components/PageShell';
import { AlertBox, Skeleton } from '../components/ui';
import { AccuracyNote, HealthDisclaimer } from '../components/HealthDisclaimer';
import { listVerifiedDoctors, type Doctor } from '../lib/health';
import { T, useLanguage } from '../i18n/LanguageContext';

// Doctor directory (Health v1): verified doctors ONLY. A doctor is listed
// only when verificationStatus == 'verified' AND reviewStatus ==
// 'Published' — verification is a human check (identity + qualification
// + adult + reason, enforced in firestore.rules). No doctor is ever
// shown as verified without proof. The AccuracyNote sits directly under
// EACH doctor's information (owner order 20 Nov 23:58).

export default function HealthDoctorsPage() {
  const h = strings.health;
  const { lang, t } = useLanguage();
  const [items, setItems] = useState<Doctor[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    listVerifiedDoctors()
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch(() => {
        if (!cancelled) setError(t({ bn: 'লোড করা যায়নি — পরে আবার চেষ্টা করুন।', en: 'Could not load — please try again later.' }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell titleBn={h.doctorsTitle.bn} titleEn={h.doctorsTitle.en}>
      <HealthDisclaimer />
      <p>{t(h.doctorsIntro)}</p>
      <AccuracyNote />
      {error ? <AlertBox tone="error">{error}</AlertBox> : null}
      {items === null && !error ? <Skeleton lines={3} /> : null}
      {items !== null && items.length === 0 ? (
        <EmptyState bn={h.doctorsEmpty.bn} en={h.doctorsEmpty.en} />
      ) : null}
      {items !== null &&
        items.map((d) => (
          <article key={d.id} className="ev-card" style={{ marginBottom: 12 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>
              {lang === 'bn' ? d.titleBn : d.title}
            </h2>
            <p style={{ margin: '0 0 6px', color: '#1E7CE8', fontWeight: 700 }}>
              ✓ <T bn={h.verified.bn} en={h.verified.en} />
            </p>
            <p style={{ margin: '0 0 6px' }}>{lang === 'bn' ? d.qualificationBn : d.qualificationEn}</p>
            <p style={{ margin: '0 0 6px' }}>
              {lang === 'bn' ? d.specialityBn : d.specialityEn} —{' '}
              {lang === 'bn' ? d.workplaceBn : d.workplaceEn}
            </p>
            <AccuracyNote />
          </article>
        ))}
      <div style={{ border: '1px solid #1E7CE8', borderRadius: 8, padding: '16px', marginTop: 20 }}>
        <p style={{ margin: 0 }}>{t(h.doctorsApply)}</p>
      </div>
    </PageShell>
  );
}
