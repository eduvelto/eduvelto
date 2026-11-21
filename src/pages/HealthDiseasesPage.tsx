import { useEffect, useMemo, useState } from 'react';
import { strings } from '../i18n/strings';
import { PageShell, EmptyState } from '../components/PageShell';
import { AlertBox, Skeleton } from '../components/ui';
import { AccuracyNote, HealthDisclaimer } from '../components/HealthDisclaimer';
import { listPublishedDiseases, type Disease } from '../lib/health';
import { useLanguage } from '../i18n/LanguageContext';

// Disease library (Health v1): symptoms, prevention, when to see a doctor.
// General information only — never a diagnosis. The AccuracyNote sits
// directly under EACH disease's information (owner order 20 Nov 23:58).

export default function HealthDiseasesPage() {
  const h = strings.health;
  const { lang, t } = useLanguage();
  const [items, setItems] = useState<Disease[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    listPublishedDiseases()
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!items) return [];
    if (!q) return [...items].sort((a, b) => a.title.localeCompare(b.title));
    return items.filter(
      (d) => d.title.toLowerCase().includes(q) || d.titleBn.includes(search.trim()),
    );
  }, [items, search]);

  return (
    <PageShell titleBn={h.diseasesTitle.bn} titleEn={h.diseasesTitle.en}>
      <HealthDisclaimer />
      <p>{t(h.diseasesIntro)}</p>
      <AccuracyNote />
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t(h.searchPlaceholder)}
        aria-label={t(h.searchPlaceholder)}
        className="ev-input" style={{ margin: '16px 0' }}
      />
      {error ? <AlertBox tone="error">{error}</AlertBox> : null}
      {items === null && !error ? <Skeleton lines={3} /> : null}
      {items !== null && filtered.length === 0 ? (
        <EmptyState bn={h.underReview.bn} en={h.underReview.en} />
      ) : null}
      {filtered.map((d) => (
        <article key={d.id} className="ev-card" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>
            {lang === 'bn' ? d.titleBn : d.title}
          </h2>
          <p style={{ margin: '0 0 6px' }}>
            <strong>{t(h.symptoms)}:</strong> {lang === 'bn' ? d.symptomsBn : d.symptomsEn}
          </p>
          <p style={{ margin: '0 0 6px' }}>
            <strong>{t(h.prevention)}:</strong> {lang === 'bn' ? d.preventionBn : d.preventionEn}
          </p>
          <p style={{ margin: '0 0 6px' }}>
            <strong>{t(h.seeDoctorWhen)}:</strong> {lang === 'bn' ? d.seeDoctorBn : d.seeDoctorEn}
          </p>
          <p style={{ margin: '0 0 6px', fontSize: 14, color: '#555' }}>
            {t(h.source)}: {d.source}
          </p>
          <AccuracyNote />
        </article>
      ))}
    </PageShell>
  );
}
