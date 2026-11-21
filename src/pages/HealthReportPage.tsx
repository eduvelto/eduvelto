import { useMemo, useState } from 'react';
import { strings } from '../i18n/strings';
import { PageShell } from '../components/PageShell';
import { AccuracyNote, HealthDisclaimer } from '../components/HealthDisclaimer';
import { REPORT_TESTS, type ReportTest } from '../lib/health';
import { useLanguage } from '../i18n/LanguageContext';

// Medical report explainer (Health v1): the user picks a test and enters
// a value, or pastes report text; the app shows a SIMPLE explanation of
// what the test measures and its general reference range, plus a rough
// "below / within / above the general range" hint from the test's numeric
// bounds. Client-side only (nothing is uploaded or stored). NEVER a
// diagnosis — every explanation ends with "ask your doctor" and the
// AccuracyNote sits directly under EACH explanation (owner order
// 20 Nov 23:58). The user's own report's reference range is what matters;
// the ranges here are only a general guide.

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

function parseNumber(raw: string): number | null {
  const latin = raw.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
  const n = parseFloat(latin);
  return Number.isNaN(n) ? null : n;
}

function verdictFor(test: ReportTest, value: string): { bn: string; en: string } | null {
  const h = strings.health;
  if (value.trim() === '') return null;
  const n = parseNumber(value);
  if (n === null) return null;
  if (test.lowBound !== null && n < test.lowBound) return { bn: test.lowBn, en: test.lowEn };
  if (test.highBound !== null && n > test.highBound) return { bn: test.highBn, en: test.highEn };
  if (test.lowBound === null && test.highBound === null) return null;
  return { bn: h.inRange.bn, en: h.inRange.en };
}

function TestCard({ test, value }: { test: ReportTest; value?: string }) {
  const h = strings.health;
  const { lang, t } = useLanguage();
  const verdict = value !== undefined ? verdictFor(test, value) : null;
  return (
    <article className="ev-card" style={{ marginBottom: 12 }}>
      <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>
        {lang === 'bn' ? test.nameBn : test.nameEn}
      </h2>
      <p style={{ margin: '0 0 6px' }}>
        <strong>{t(h.whatItMeasures)}:</strong> {lang === 'bn' ? test.measuresBn : test.measuresEn}
      </p>
      <p style={{ margin: '0 0 6px' }}>
        <strong>{t(h.generalRange)}:</strong> {test.generalRange}
      </p>
      {value !== undefined && value.trim() !== '' ? (
        <p style={{ margin: '0 0 6px' }}>
          <strong>{t(h.yourValue)}:</strong> {value} {test.unit}
        </p>
      ) : null}
      {verdict ? (
        <p style={{ margin: '0 0 6px' }}>
          <strong>{t(h.whatItMayMean)}:</strong> {t(verdict)}
        </p>
      ) : null}
      <p style={{ margin: '0 0 6px' }}>{t(h.noDiagnosis)}</p>
      <p style={{ margin: '0 0 6px' }}>{t(h.reportAskDoctor)}</p>
      <p style={{ margin: '0 0 6px', fontSize: 14, color: '#555' }}>{t(h.reportSource)}</p>
      <AccuracyNote />
    </article>
  );
}

export default function HealthReportPage() {
  const h = strings.health;
  const { lang, t } = useLanguage();
  const [selectedId, setSelectedId] = useState('');
  const [value, setValue] = useState('');
  const [pasted, setPasted] = useState('');

  const selected = REPORT_TESTS.find((t) => t.id === selectedId);
  const matched = useMemo(() => {
    const text = pasted.toLowerCase();
    if (!text.trim()) return [];
    return REPORT_TESTS.filter(
      (t) => text.includes(t.nameEn.toLowerCase()) || text.includes(t.nameBn),
    );
  }, [pasted]);

  return (
    <PageShell titleBn={h.reportTitle.bn} titleEn={h.reportTitle.en}>
      <HealthDisclaimer />
      <p>{t(h.reportIntro)}</p>
      <p style={{ fontSize: 14, color: '#555' }}>{t(h.reportNoStorage)}</p>
      <AccuracyNote />

      <h2 style={{ marginTop: 24 }}>{t(h.reportPickTest)}</h2>
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        aria-label={t(h.reportPickTest)}
        className="ev-input" style={{ marginBottom: 12 }}
      >
        <option value="">— {t(h.reportPickTest)} —</option>
        {REPORT_TESTS.map((t) => (
          <option key={t.id} value={t.id}>
            {lang === 'bn' ? t.nameBn : t.nameEn}
          </option>
        ))}
      </select>
      {selected ? (
        <>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t(h.reportEnterValue)}
            aria-label={t(h.reportEnterValue)}
            className="ev-input" style={{ marginBottom: 16 }}
          />
          <TestCard test={selected} value={value} />
        </>
      ) : null}

      <h2 style={{ marginTop: 24 }}>{t(h.reportPaste)}</h2>
      <textarea
        value={pasted}
        onChange={(e) => setPasted(e.target.value)}
        placeholder={t(h.reportPastePlaceholder)}
        aria-label={t(h.reportPaste)}
        rows={5}
        className="ev-input" style={{ marginBottom: 16 }}
      />
      {pasted.trim() !== '' && matched.length === 0 ? (
        <p>{t(h.reportNoMatch)}</p>
      ) : null}
      {matched.map((t) => (
        <TestCard key={t.id} test={t} />
      ))}

      <h2 style={{ marginTop: 24 }}>{t(h.reportAllTests)}</h2>
      {REPORT_TESTS.map((t) => (
        <TestCard key={t.id} test={t} />
      ))}
    </PageShell>
  );
}
