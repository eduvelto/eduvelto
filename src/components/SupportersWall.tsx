// Eduvelto — public Supporters Wall (Phase 3 Commit 2, 25 Nov 2026,
// feature/ssg-bilingual-support).
//
// Newest donations first, name + amount only. TrxIDs are never
// rendered (the component never reads that field into the DOM)
// and no phone number exists in the collection to leak. The fetch
// runs in an effect only, so the prerendered page is the static
// shell and the wall fills in on the client.

import { useEffect, useState } from 'react';
import { listSupporters, type Supporter } from '../lib/donations';
import { useLanguage } from '../i18n/LanguageContext';
import { Card } from './ui';

export default function SupportersWall() {
  const { t, lang } = useLanguage();
  const [supporters, setSupporters] = useState<Supporter[] | null>(null);

  useEffect(() => {
    let alive = true;
    listSupporters(50).then((rows) => {
      if (alive) setSupporters(rows);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (supporters === null) {
    return (
      <p style={{ color: 'var(--muted)' }} aria-live="polite">
        {t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}
      </p>
    );
  }
  if (supporters.length === 0) {
    return (
      <Card>
        <p style={{ margin: 0, lineHeight: 1.7 }}>
          {t({
            bn: 'এখনো কোনো সহায়তা রেকর্ড হয়নি — প্রথম সহায়তাকারী আপনিই হোন!',
            en: 'No support has been recorded yet — be the first supporter!',
          })}
        </p>
      </Card>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
      {supporters.map((s) => (
        <Card key={s.id}>
          <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 16 }}>{s.name}</p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--heading)' }}>
            ৳{s.amount.toLocaleString('en-US')}
          </p>
          {s.createdAtMillis ? (
            <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 13 }}>
              {new Date(s.createdAtMillis).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
