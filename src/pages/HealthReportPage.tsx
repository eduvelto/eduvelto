import { useMemo, useState } from 'react';
import { strings } from '../i18n/strings';
import { PageShell } from '../components/PageShell';
import { AccuracyNote, HealthDisclaimer } from '../components/HealthDisclaimer';
import { REPORT_TESTS, type ReportTest } from '../lib/health';

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
  const verdict = value !== undefined ? verdictFor(test, value) : null;
  return (
    <article className="ev-card" style={{ marginBottom: 12 }}>
      <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>
        {test.nameBn} <span style={{ color: '#555', fontSize: 16 }}>({test.nameEn})</span>
      </h2>
      <p style={{ margin: '0 0 6px' }}>
        <strong>{h.whatItMeasures.bn}:</strong> {test.measuresBn}
      </p>
      <p style={{ margin: '0 0 6px', color: '#555' }}>
        <strong>{h.whatItMeasures.en}:</strong> {test.measuresEn}
      </p>
      <p style={{ margin: '0 0 6px' }}>
        <strong>{h.generalRange.bn}:</strong> {test.generalRange}
      </p>
      {value !== undefined && value.trim() !== '' ? (
        <p style={{ margin: '0 0 6px' }}>
          <strong>{h.yourValue.bn}:</strong> {value} {test.unit}
        </p>
      ) : null}
      {verdict ? (
        <p style={{ margin: '0 0 6px' }}>
          <strong>{h.whatItMayMean.bn}:</strong> {verdict.bn}
          <br />
          <span style={{ color: '#555' }}>
            <strong>{h.whatItMayMean.en}:</strong> {verdict.en}
          </span>
        </p>
      ) : null}
      <p style={{ margin: '0 0 6px' }}>{h.noDiagnosis.bn}</p>
      <p style={{ margin: '0 0 6px', color: '#555' }}>{h.noDiagnosis.en}</p>
      <p style={{ margin: '0 0 6px' }}>{h.reportAskDoctor.bn}</p>
      <p style={{ margin: '0 0 6px', color: '#555' }}>{h.reportAskDoctor.en}</p>
      <p style={{ margin: '0 0 6px', fontSize: 14, color: '#555' }}>{h.reportSource.bn}</p>
      <p style={{ margin: '0 0 6px', fontSize: 14, color: '#555' }}>{h.reportSource.en}</p>
      <AccuracyNote />
    </article>
  );
}

export default function HealthReportPage() {
  const h = strings.health;
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
      <p>{h.reportIntro.bn}</p>
      <p style={{ color: '#555' }}>{h.reportIntro.en}</p>
      <p style={{ fontSize: 14, color: '#555' }}>{h.reportNoStorage.bn}</p>
      <AccuracyNote />

      <h2 style={{ marginTop: 24 }}>{h.reportPickTest.bn}</h2>
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        aria-label={h.reportPickTest.bn}
        className="ev-input" style={{ marginBottom: 12 }}
      >
        <option value="">— {h.reportPickTest.bn} —</option>
        {REPORT_TESTS.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nameBn} ({t.nameEn})
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
            placeholder={h.reportEnterValue.bn}
            aria-label={h.reportEnterValue.bn}
            className="ev-input" style={{ marginBottom: 16 }}
          />
          <TestCard test={selected} value={value} />
        </>
      ) : null}

      <h2 style={{ marginTop: 24 }}>{h.reportPaste.bn}</h2>
      <textarea
        value={pasted}
        onChange={(e) => setPasted(e.target.value)}
        placeholder={h.reportPastePlaceholder.bn}
        aria-label={h.reportPaste.bn}
        rows={5}
        className="ev-input" style={{ marginBottom: 16 }}
      />
      {pasted.trim() !== '' && matched.length === 0 ? (
        <p>{h.reportNoMatch.bn}</p>
      ) : null}
      {matched.map((t) => (
        <TestCard key={t.id} test={t} />
      ))}

      <h2 style={{ marginTop: 24 }}>{h.reportAllTests.bn}</h2>
      {REPORT_TESTS.map((t) => (
        <TestCard key={t.id} test={t} />
      ))}
    </PageShell>
  );
}
