import { useEffect, useMemo, useState } from 'react';
import { strings } from '../i18n/strings';
import { PageShell, EmptyState } from '../components/PageShell';
import { AlertBox, Skeleton } from '../components/ui';
import { AccuracyNote, HealthDisclaimer } from '../components/HealthDisclaimer';
import { listPublishedMedicines, type Medicine } from '../lib/health';
import { useLanguage } from '../i18n/LanguageContext';

// Medicine directory (Health v1): search by name, Published records only.
// The AccuracyNote sits directly under EACH medicine's information
// (owner order 20 Nov 23:58), not only at the page bottom.

export default function HealthMedicinesPage() {
  const h = strings.health;
  const { lang, t } = useLanguage();
  const [items, setItems] = useState<Medicine[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    listPublishedMedicines()
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
      (m) => m.title.toLowerCase().includes(q) || m.titleBn.includes(search.trim()),
    );
  }, [items, search]);

  return (
    <PageShell titleBn={h.medicinesTitle.bn} titleEn={h.medicinesTitle.en}>
      <HealthDisclaimer />
      <p>{t(h.medicinesIntro)}</p>
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
      {filtered.map((m) => (
        <article key={m.id} className="ev-card" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>
            {lang === 'bn' ? m.titleBn : m.title}
          </h2>
          {m.prescriptionOnly ? (
            <p style={{ margin: '0 0 8px' }}>
              <strong>{t({ bn: 'প্রেসক্রিপশন প্রয়োজন', en: 'Prescription only' })}</strong>
            </p>
          ) : null}
          <p style={{ margin: '0 0 6px' }}>
            <strong>{t(h.use)}:</strong> {lang === 'bn' ? m.useBn : m.useEn}
          </p>
          <p style={{ margin: '0 0 6px' }}>
            <strong>{t(h.form)}:</strong> {lang === 'bn' ? m.formBn : m.formEn}
          </p>
          <p style={{ margin: '0 0 6px' }}>
            <strong>{t(h.sideEffects)}:</strong> {lang === 'bn' ? m.sideEffectsBn : m.sideEffectsEn}
          </p>
          <p style={{ margin: '0 0 6px' }}>
            <strong>{t(h.warnings)}:</strong> {lang === 'bn' ? m.warningsBn : m.warningsEn}
          </p>
          <p style={{ margin: '0 0 6px', fontSize: 14, color: 'var(--ink-soft)' }}>
            {t(h.source)}: {m.source}
          </p>
          <AccuracyNote />
        </article>
      ))}
    </PageShell>
  );
}
