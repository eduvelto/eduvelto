import { useEffect, useMemo, useState } from 'react';
import { strings } from '../i18n/strings';
import { PageShell, EmptyState } from '../components/PageShell';
import { AccuracyNote, HealthDisclaimer } from '../components/HealthDisclaimer';
import { listPublishedDiseases, type Disease } from '../lib/health';

// Disease library (Health v1): symptoms, prevention, when to see a doctor.
// General information only — never a diagnosis. The AccuracyNote sits
// directly under EACH disease's information (owner order 20 Nov 23:58).

export default function HealthDiseasesPage() {
  const h = strings.health;
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
        if (!cancelled) setError('লোড করা যায়নি — পরে আবার চেষ্টা করুন। / Could not load — please try again later.');
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
      <p>{h.diseasesIntro.bn}</p>
      <p style={{ color: '#555' }}>{h.diseasesIntro.en}</p>
      <AccuracyNote />
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={h.searchPlaceholder.bn}
        aria-label={h.searchPlaceholder.bn}
        style={{ width: '100%', padding: '12px', fontSize: 16, borderRadius: 6, border: '1px solid #999', margin: '16px 0' }}
      />
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {items === null && !error ? <p>{strings.common.loading.bn}</p> : null}
      {items !== null && filtered.length === 0 ? (
        <EmptyState bn={h.underReview.bn} en={h.underReview.en} />
      ) : null}
      {filtered.map((d) => (
        <article key={d.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '16px', marginBottom: 12 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>
            {d.titleBn} <span style={{ color: '#555', fontSize: 16 }}>({d.title})</span>
          </h2>
          <p style={{ margin: '0 0 6px' }}>
            <strong>{h.symptoms.bn}:</strong> {d.symptomsBn}
          </p>
          <p style={{ margin: '0 0 6px', color: '#555' }}>
            <strong>{h.symptoms.en}:</strong> {d.symptomsEn}
          </p>
          <p style={{ margin: '0 0 6px' }}>
            <strong>{h.prevention.bn}:</strong> {d.preventionBn}
          </p>
          <p style={{ margin: '0 0 6px', color: '#555' }}>
            <strong>{h.prevention.en}:</strong> {d.preventionEn}
          </p>
          <p style={{ margin: '0 0 6px' }}>
            <strong>{h.seeDoctorWhen.bn}:</strong> {d.seeDoctorBn}
          </p>
          <p style={{ margin: '0 0 6px', color: '#555' }}>
            <strong>{h.seeDoctorWhen.en}:</strong> {d.seeDoctorEn}
          </p>
          <p style={{ margin: '0 0 6px', fontSize: 14, color: '#555' }}>
            {h.source.bn}: {d.source}
          </p>
          <AccuracyNote />
        </article>
      ))}
    </PageShell>
  );
}
