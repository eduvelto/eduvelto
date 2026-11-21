import { useEffect, useMemo, useState } from 'react';
import { strings } from '../i18n/strings';
import { PageShell, EmptyState } from '../components/PageShell';
import { AlertBox, Skeleton } from '../components/ui';
import { AccuracyNote, HealthDisclaimer } from '../components/HealthDisclaimer';
import { listPublishedFacilities, type Facility } from '../lib/health';

// Hospital / clinic + pharmacy finder (Health v1): search by area.
// Seed data comes only from public listings, with the source noted.
// The AccuracyNote sits directly under EACH facility's information
// (owner order 20 Nov 23:58).

export default function HealthHospitalsPage() {
  const h = strings.health;
  const [items, setItems] = useState<Facility[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    listPublishedFacilities()
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
    if (!q) return [...items].sort((a, b) => a.areaEn.localeCompare(b.areaEn) || a.title.localeCompare(b.title));
    return items.filter(
      (f) =>
        f.areaEn.toLowerCase().includes(q) ||
        f.areaBn.includes(search.trim()) ||
        f.title.toLowerCase().includes(q) ||
        f.titleBn.includes(search.trim()),
    );
  }, [items, search]);

  return (
    <PageShell titleBn={h.hospitalsTitle.bn} titleEn={h.hospitalsTitle.en}>
      <HealthDisclaimer />
      <p>{h.hospitalsIntro.bn}</p>
      <p style={{ color: '#555' }}>{h.hospitalsIntro.en}</p>
      <AccuracyNote />
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={h.areaPlaceholder.bn}
        aria-label={h.areaPlaceholder.bn}
        className="ev-input" style={{ margin: '16px 0' }}
      />
      {error ? <AlertBox tone="error">{error}</AlertBox> : null}
      {items === null && !error ? <Skeleton lines={3} /> : null}
      {items !== null && filtered.length === 0 ? (
        <EmptyState bn={h.underReview.bn} en={h.underReview.en} />
      ) : null}
      {filtered.map((f) => (
        <article key={f.id} className="ev-card" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>
            {f.titleBn} <span style={{ color: '#555', fontSize: 16 }}>({f.title})</span>
          </h2>
          <p style={{ margin: '0 0 6px' }}>
            <strong>{f.kind === 'pharmacy' ? h.pharmacy.bn : h.hospital.bn}:</strong> {f.areaBn} ({f.areaEn})
          </p>
          <p style={{ margin: '0 0 6px', color: '#555' }}>{f.addressBn}</p>
          <p style={{ margin: '0 0 6px', fontSize: 14, color: '#555' }}>
            {h.source.bn}: {f.source}
          </p>
          <AccuracyNote />
        </article>
      ))}
    </PageShell>
  );
}
