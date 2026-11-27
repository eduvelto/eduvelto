// Eduvelto — Lab Test Result Checker tool UI (27 Nov 2026).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// All interpretation lives in src/lib/healthTests.ts (pure, unit-tested);
// this file is only the interactive UI. Everything runs in the browser:
// results are saved to localStorage ONLY, never sent anywhere.
//
// Ads (owner 27 Nov 2026, binding): the two standard in-content AdSense
// slots for this page live in the ToolsDetailPage wrapper (ads rollout
// B1) — one below the tool UI, one before Related tools — so this file
// mounts NO AdSlot itself (its own two slots were removed in B1 to
// avoid doubling to four). They never cover the checker, the result or
// any medical content, and never delay a result. The doctor-summary PDF
// download and the history export go through the existing
// <RewardedAdButton> (Free Download live; Unlock disabled until
// AdSense approves — no fake timer). Viewing and printing a result
// stay free.

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  LAB_HISTORY_KEY,
  LAB_PANELS,
  LAB_TESTS,
  SYMPTOM_FINDER,
  conversionKindFor,
  convertUnit,
  interpretTest,
  labHistoryToCsv,
  labTestById,
  labTestsForPanel,
  labTrendFor,
  searchLabTests,
  testsForSymptom,
  type LabHistoryEntry,
  type LabPanelId,
  type LabTest,
  type ResultBand,
  type Sex,
} from '../../lib/healthTests';
import RewardedAdButton from '../../components/RewardedAdButton';

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 15,
  boxSizing: 'border-box',
  background: 'var(--surface)',
  color: 'var(--heading)',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--heading)',
  marginBottom: 6,
};

const cardStyle: CSSProperties = { marginTop: 16, padding: '18px 16px' };

const chipStyle = (active: boolean): CSSProperties => ({
  minHeight: 40,
  padding: '8px 14px',
  borderRadius: 999,
  border: `1px solid ${active ? 'var(--teal)' : 'var(--line)'}`,
  background: active ? 'var(--teal)' : 'var(--card)',
  color: active ? '#ffffff' : 'var(--teal-deep)',
  fontSize: 14,
  fontWeight: active ? 700 : 500,
  cursor: 'pointer',
});

const BAND_COLORS: Record<ResultBand, { bg: string; fg: string; border: string }> = {
  normal: { bg: '#e6f4ea', fg: '#137333', border: '#a8dab5' },
  low: { bg: '#fef7e0', fg: '#7a5a00', border: '#f2d98c' },
  high: { bg: '#fdeede', fg: '#9c4a00', border: '#f5c99b' },
  critical: { bg: '#fce8e6', fg: '#a50e0e', border: '#f5a9a2' },
};

function bandLabel(band: ResultBand, lang: 'bn' | 'en'): string {
  if (lang === 'bn') {
    return band === 'normal' ? 'স্বাভাবিক' : band === 'low' ? 'কম' : band === 'high' ? 'বেশি' : 'জরুরি — খুব বেশি/কম';
  }
  return band === 'normal' ? 'Normal' : band === 'low' ? 'Low' : band === 'high' ? 'High' : 'Urgent — very high/low';
}

function loadHistory(): LabHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LAB_HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is LabHistoryEntry =>
        typeof e === 'object' && e !== null && typeof (e as LabHistoryEntry).testId === 'string',
    );
  } catch {
    return [];
  }
}

function persistHistory(entries: LabHistoryEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAB_HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // Storage full or blocked — history just stays in memory.
  }
}

function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

type TabId = 'check' | 'browse' | 'symptoms' | 'history';

export function LabTestResultCheckerTool() {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<TabId>('check');
  const [query, setQuery] = useState('');
  const [panelFilter, setPanelFilter] = useState<LabPanelId | 'all'>('all');
  const [selectedId, setSelectedId] = useState('fbs');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('mg/dL');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'' | Sex>('');
  const [catValue, setCatValue] = useState('');
  const [result, setResult] = useState<ReturnType<typeof interpretTest> | null>(null);
  const [history, setHistory] = useState<LabHistoryEntry[]>(loadHistory);
  const [symptomId, setSymptomId] = useState('');
  const [savedNote, setSavedNote] = useState(false);
  const [exportedNote, setExportedNote] = useState(false);

  const selected: LabTest = labTestById(selectedId) ?? LAB_TESTS[0];
  const detail: LabTest | null = detailId ? (labTestById(detailId) ?? null) : null;

  // Keep the unit selector in sync with the chosen test.
  useEffect(() => {
    setUnit(selected.unit ?? '');
    setCatValue('');
    setResult(null);
    setSavedNote(false);
  }, [selected.id, selected.unit]);

  useEffect(() => {
    persistHistory(history);
  }, [history]);

  const matches = useMemo(() => searchLabTests(query), [query]);
  const browseList = useMemo(() => {
    const base = panelFilter === 'all' ? LAB_TESTS : labTestsForPanel(panelFilter);
    if (!query.trim()) return base;
    const ids = new Set(searchLabTests(query).map((x) => x.id));
    return base.filter((x) => ids.has(x.id));
  }, [panelFilter, query]);

  const symptomTests = useMemo(
    () => (symptomId ? testsForSymptom(symptomId) : []),
    [symptomId],
  );
  const symptomEntry = SYMPTOM_FINDER.find((s) => s.id === symptomId);

  const convertedPreview = useMemo(() => {
    if (selected.kind !== 'numeric' || !value.trim()) return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    const kind = conversionKindFor(selected);
    if (!kind || !selected.altUnits || selected.altUnits.length < 2) return null;
    const other = selected.altUnits.find((u) => u !== unit);
    if (!other) return null;
    const c = convertUnit(n, kind, unit, other);
    return c === null ? null : { other, value: c };
  }, [selected, value, unit]);

  function handleCheck(): void {
    if (selected.kind === 'categorical') {
      setResult(interpretTest({ testId: selected.id, categoryValue: catValue }));
      return;
    }
    const n = Number(value);
    setResult(
      interpretTest({
        testId: selected.id,
        value: Number.isFinite(n) ? n : undefined,
        unit: unit || undefined,
        age: age.trim() ? Number(age) : undefined,
        sex: sex || undefined,
      }),
    );
    setSavedNote(false);
  }

  function handleSave(): void {
    if (!result || !result.found || !result.test || result.test.kind !== 'numeric') return;
    if (result.valueInPrimaryUnit === undefined) return;
    const entry: LabHistoryEntry = {
      id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      testId: result.test.id,
      value: result.valueInPrimaryUnit,
      unit: result.primaryUnit ?? '',
      band: result.band,
      date: new Date().toISOString().slice(0, 10),
    };
    setHistory((prev) => [entry, ...prev]);
    setSavedNote(true);
  }

  async function handleSummaryPdf(): Promise<void> {
    if (!result || !result.found || !result.test) return;
    // Dynamic import only — jspdf stays out of the main bundle
    // (same pattern as CertificateMakerTool). jsPDF's built-in font
    // has no Bangla glyphs, so the PDF is in English; the on-screen
    // summary and the print view show Bangla properly.
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const test = result.test;
    const lines = [
      'Eduvelto — Doctor-visit summary (lab test result)',
      `Date: ${new Date().toISOString().slice(0, 10)}`,
      '',
      `Test: ${test.nameEn} (${test.shortName})`,
      `Value: ${result.valueInPrimaryUnit ?? value} ${result.primaryUnit ?? unit}`,
      `Result: ${result.labelEn} (${result.band})`,
      `Normal range: ${test.rangeTextEn}`,
      '',
      `What it may mean: ${result.meaningEn}`,
      '',
      `Next steps: ${result.actionsEn}`,
      '',
      'Questions to ask the doctor:',
      ...test.questionsEn.map((q, i) => `${i + 1}. ${q}`),
      '',
      'Note: This is information only, not a diagnosis. Your own lab',
      'report’s range is the real one. Please consult a doctor.',
    ];
    let y = 18;
    doc.setFontSize(12);
    for (const line of lines) {
      const wrapped = doc.splitTextToSize(line, 170);
      for (const w of wrapped) {
        if (y > 280) {
          doc.addPage();
          y = 18;
        }
        doc.text(w, 15, y);
        y += 7;
      }
    }
    doc.save('eduvelto-doctor-summary.pdf');
  }

  function handleExportHistory(): void {
    downloadTextFile('eduvelto-lab-history.csv', labHistoryToCsv(history), 'text/csv;charset=utf-8');
    setExportedNote(true);
  }

  const tabs: { id: TabId; bn: string; en: string }[] = [
    { id: 'check', bn: 'ফলাফল যাচাই', en: 'Check result' },
    { id: 'browse', bn: 'সব পরীক্ষা', en: 'All tests' },
    { id: 'symptoms', bn: 'লক্ষণ দিয়ে খুঁজুন', en: 'Find by symptom' },
    { id: 'history', bn: 'আমার ইতিহাস', en: 'My history' },
  ];

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="lab-checker-title">
      <style>{`@media print { body * { visibility: hidden; } #lab-doctor-summary, #lab-doctor-summary * { visibility: visible; } #lab-doctor-summary { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>
      <h2 id="lab-checker-title" style={{ fontSize: 19, color: 'var(--heading)', margin: '0 0 4px' }}>
        {t({ bn: 'ল্যাব টেস্ট রেজাল্ট চেকার', en: 'Lab Test Result Checker' })}
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 12px' }}>
        {t({
          bn: 'রিপোর্টের মান বসিয়ে দেখুন সেটি স্বাভাবিক সীমায় আছে কি না — ৩৭টি সাধারণ পরীক্ষা। সব হিসাব আপনার ব্রাউজারেই হয়, কিছুই কোথাও পাঠানো হয় না।',
          en: 'Enter a value from your report to see whether it is in the normal range — 37 common tests. Everything is computed in your browser; nothing is sent anywhere.',
        })}
      </p>
      <div
        role="alert"
        style={{
          padding: '12px 14px',
          borderRadius: 10,
          background: 'var(--teal-soft)',
          border: '1px solid var(--teal)',
          fontSize: 14,
          lineHeight: 1.6,
          marginBottom: 12,
        }}
      >
        <strong>
          {t({
            bn: 'এটি শুধু তথ্য, রোগ নির্ণয় নয় — ডাক্তারের পরামর্শ নিন।',
            en: 'This is information only, not a diagnosis — consult a doctor.',
          })}
        </strong>{' '}
        {t({
          bn: 'আপনার রিপোর্টে ল্যাবের নিজের range-ই আসল। ল্যাবভেদে স্বাভাবিক সীমা কিছুটা ভিন্ন হতে পারে।',
          en: 'Your own lab report’s range is the real one. Normal ranges can differ slightly between labs.',
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }} role="tablist">
        {tabs.map((tabDef) => (
          <button
            key={tabDef.id}
            type="button"
            role="tab"
            aria-selected={tab === tabDef.id}
            style={chipStyle(tab === tabDef.id)}
            onClick={() => setTab(tabDef.id)}
          >
            {t({ bn: tabDef.bn, en: tabDef.en })}
          </button>
        ))}
      </div>

      {tab === 'check' ? (
        <div style={{ marginTop: 16 }}>
          <label style={labelStyle} htmlFor="lab-search">
            {t({ bn: 'পরীক্ষা খুঁজুন (নাম বা লক্ষণ লিখুন)', en: 'Search a test (name or symptom)' })}
          </label>
          <input
            id="lab-search"
            style={inputStyle}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t({ bn: 'যেমন: সুগার, TSH, ডেঙ্গু…', en: 'e.g. sugar, TSH, dengue…' })}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {matches.slice(0, 8).map((m) => (
              <button
                key={m.id}
                type="button"
                style={chipStyle(m.id === selected.id)}
                onClick={() => {
                  setSelectedId(m.id);
                  setQuery('');
                }}
              >
                {lang === 'bn' ? m.nameBn : m.nameEn} ({m.shortName})
              </button>
            ))}
            {matches.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
                {t({ bn: 'কোনো পরীক্ষা মেলেনি — অন্য নামে খুঁজে দেখুন।', en: 'No test matched — try another name.' })}
              </p>
            ) : null}
          </div>

          <div
            style={{
              marginTop: 14,
              padding: '14px 16px',
              borderRadius: 10,
              border: '1px solid var(--line)',
              background: 'var(--surface)',
            }}
          >
            <h3 style={{ margin: '0 0 4px', fontSize: 17, color: 'var(--heading)' }}>
              {lang === 'bn' ? selected.nameBn : selected.nameEn} ({selected.shortName})
            </h3>
            <p style={{ margin: '0 0 4px', fontSize: 14, color: 'var(--muted)' }}>
              {lang === 'bn' ? selected.measuresBn : selected.measuresEn}
            </p>
            <p style={{ margin: '0 0 12px', fontSize: 14 }}>
              <strong>{t({ bn: 'স্বাভাবিক সীমা: ', en: 'Normal range: ' })}</strong>
              {lang === 'bn' ? selected.rangeTextBn : selected.rangeTextEn}
            </p>
            {selected.kind === 'categorical' ? (
              <div>
                <label style={labelStyle} htmlFor="lab-cat-value">
                  {t({ bn: 'রিপোর্টের ফলাফল', en: 'Result on the report' })}
                </label>
                <select
                  id="lab-cat-value"
                  style={inputStyle}
                  value={catValue}
                  onChange={(e) => setCatValue(e.target.value)}
                >
                  <option value="">
                    {t({ bn: '— বেছে নিন —', en: '— pick one —' })}
                  </option>
                  {(selected.categories ?? []).map((c) => (
                    <option key={c.value} value={c.value}>
                      {lang === 'bn' ? c.labelBn : c.labelEn}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                <div>
                  <label style={labelStyle} htmlFor="lab-value">
                    {t({ bn: 'আপনার মান', en: 'Your value' })}
                  </label>
                  <input
                    id="lab-value"
                    style={inputStyle}
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="126"
                  />
                </div>
                <div>
                  <label style={labelStyle} htmlFor="lab-unit">
                    {t({ bn: 'একক', en: 'Unit' })}
                  </label>
                  <select
                    id="lab-unit"
                    style={inputStyle}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    {(selected.altUnits ?? [selected.unit ?? '']).map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle} htmlFor="lab-age">
                    {t({ bn: 'বয়স (ঐচ্ছিক)', en: 'Age (optional)' })}
                  </label>
                  <input
                    id="lab-age"
                    style={inputStyle}
                    type="number"
                    min="0"
                    max="120"
                    inputMode="numeric"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle} htmlFor="lab-sex">
                    {t({ bn: 'লিঙ্গ (ঐচ্ছিক)', en: 'Sex (optional)' })}
                  </label>
                  <select
                    id="lab-sex"
                    style={inputStyle}
                    value={sex}
                    onChange={(e) => setSex(e.target.value as '' | Sex)}
                  >
                    <option value="">{t({ bn: '— বেছে নিন —', en: '— pick one —' })}</option>
                    <option value="male">{t({ bn: 'পুরুষ', en: 'Male' })}</option>
                    <option value="female">{t({ bn: 'নারী', en: 'Female' })}</option>
                  </select>
                </div>
              </div>
            )}
            {convertedPreview ? (
              <p style={{ margin: '10px 0 0', fontSize: 14, color: 'var(--muted)' }}>
                {t({ bn: '≈ ', en: '≈ ' })}
                {convertedPreview.value.toFixed(2)} {convertedPreview.other}
              </p>
            ) : null}
            <button
              type="button"
              className="ev-btn ev-btn-primary"
              style={{ minHeight: 44, marginTop: 14 }}
              onClick={handleCheck}
            >
              {t({ bn: 'ফলাফল দেখুন', en: 'Check result' })}
            </button>
          </div>

          {result && result.found && result.test ? (
            <ResultCard
              result={result}
              lang={lang}
              t={t}
              onSave={result.test.kind === 'numeric' ? handleSave : undefined}
              savedNote={savedNote}
              onSummaryPdf={handleSummaryPdf}
            />
          ) : result && !result.found ? (
            <p style={{ color: '#b3261e', marginTop: 14 }}>
              {t({ bn: 'পরীক্ষা পাওয়া যায়নি।', en: 'Test not found.' })}
            </p>
          ) : null}
        </div>
      ) : null}

      {tab === 'browse' ? (
        <div style={{ marginTop: 16 }}>
          {detail ? (
            <div>
              <button type="button" className="ev-btn ev-btn-ghost" style={{ minHeight: 40 }} onClick={() => setDetailId(null)}>
                {t({ bn: '← সব পরীক্ষায় ফিরুন', en: '← Back to all tests' })}
              </button>
              <TestDetail test={detail} lang={lang} t={t} onCheck={(id) => { setSelectedId(id); setTab('check'); }} />
            </div>
          ) : (
            <div>
              <label style={labelStyle} htmlFor="lab-browse-search">
                {t({ bn: 'পরীক্ষা খুঁজুন', en: 'Search tests' })}
              </label>
              <input
                id="lab-browse-search"
                style={inputStyle}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t({ bn: 'যেমন: সুগার, TSH, ডেঙ্গু…', en: 'e.g. sugar, TSH, dengue…' })}
              />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                <button type="button" style={chipStyle(panelFilter === 'all')} onClick={() => setPanelFilter('all')}>
                  {t({ bn: 'সবগুলো', en: 'All' })} ({LAB_TESTS.length})
                </button>
                {LAB_PANELS.map((p) => (
                  <button key={p.id} type="button" style={chipStyle(panelFilter === p.id)} onClick={() => setPanelFilter(p.id)}>
                    {lang === 'bn' ? p.titleBn : p.titleEn}
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginTop: 14 }}>
                {browseList.map((test) => (
                  <button
                    key={test.id}
                    type="button"
                    className="ev-card ev-card-hover"
                    style={{ textAlign: 'left', padding: 14, cursor: 'pointer', background: 'var(--surface)', color: 'var(--heading)' }}
                    onClick={() => setDetailId(test.id)}
                  >
                    <strong style={{ display: 'block', fontSize: 15 }}>
                      {lang === 'bn' ? test.nameBn : test.nameEn} ({test.shortName})
                    </strong>
                    <span style={{ display: 'block', color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
                      {lang === 'bn' ? test.whyBn : test.whyEn}
                    </span>
                    <span style={{ display: 'block', fontSize: 13, marginTop: 8, color: 'var(--teal-deep)' }}>
                      {t({ bn: 'স্বাভাবিক সীমা: ', en: 'Normal range: ' })}
                      {lang === 'bn' ? test.rangeTextBn : test.rangeTextEn}
                    </span>
                  </button>
                ))}
              </div>
              {browseList.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                  {t({ bn: 'কোনো পরীক্ষা মেলেনি।', en: 'No test matched.' })}
                </p>
              ) : null}
              <h3 style={{ fontSize: 17, margin: '24px 0 8px', color: 'var(--heading)' }}>
                {t({ bn: 'প্যানেল (একসঙ্গে করা পরীক্ষা)', en: 'Panels (tests done together)' })}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {LAB_PANELS.map((p) => (
                  <div key={p.id} className="ev-card" style={{ padding: 14 }}>
                    <strong style={{ display: 'block', fontSize: 15, color: 'var(--heading)' }}>
                      {lang === 'bn' ? p.titleBn : p.titleEn}
                    </strong>
                    <span style={{ display: 'block', color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
                      {lang === 'bn' ? p.blurbBn : p.blurbEn}
                    </span>
                    <span style={{ display: 'block', fontSize: 13, marginTop: 8 }}>
                      {labTestsForPanel(p.id)
                        .map((x) => x.shortName)
                        .join(' · ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {tab === 'symptoms' ? (
        <div style={{ marginTop: 16 }}>
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 12px' }}>
            {t({
              bn: 'একটি লক্ষণ বেছে নিন — সাধারণত কোন পরীক্ষাগুলো করা হয়, তা দেখাবে। এটি ডাক্তারের পরামর্শের বিকল্প নয়।',
              en: 'Pick a symptom — it shows which tests are commonly done for it. This does not replace a doctor’s advice.',
            })}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SYMPTOM_FINDER.map((s) => (
              <button key={s.id} type="button" style={chipStyle(symptomId === s.id)} onClick={() => setSymptomId(s.id)}>
                {lang === 'bn' ? s.labelBn : s.labelEn}
              </button>
            ))}
          </div>
          {symptomEntry ? (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 14, margin: '0 0 10px' }}>
                {lang === 'bn' ? symptomEntry.noteBn : symptomEntry.noteEn}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {symptomTests.map((test) => (
                  <button
                    key={test.id}
                    type="button"
                    className="ev-card ev-card-hover"
                    style={{ textAlign: 'left', padding: 14, cursor: 'pointer', background: 'var(--surface)', color: 'var(--heading)' }}
                    onClick={() => { setSelectedId(test.id); setTab('check'); }}
                  >
                    <strong style={{ display: 'block', fontSize: 15 }}>
                      {lang === 'bn' ? test.nameBn : test.nameEn} ({test.shortName})
                    </strong>
                    <span style={{ display: 'block', color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
                      {lang === 'bn' ? test.measuresBn : test.measuresEn}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === 'history' ? (
        <div style={{ marginTop: 16 }}>
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 12px' }}>
            {t({
              bn: 'আপনার সংরক্ষিত ফলাফল শুধু এই ব্রাউজারেই থাকে — কোথাও পাঠানো হয় না, কোনো অ্যাকাউন্ট লাগে না।',
              en: 'Your saved results stay only in this browser — they are never sent anywhere, and no account is needed.',
            })}
          </p>
          {history.length === 0 ? (
            <p style={{ fontSize: 14 }}>
              {t({
                bn: 'এখনো কিছু সংরক্ষণ করা হয়নি। ফলাফল যাচাই করে "ইতিহাসে সংরক্ষণ করুন" চাপুন।',
                en: 'Nothing saved yet. Check a result, then press “Save to history”.',
              })}
            </p>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
                {/* Ads rollout B3 (27 Nov 2026): history CSV is a light export — 15s, not the 30s default. The summary PDF gate below stays 30s. */}
                <RewardedAdButton lang={lang} durationSeconds={15} onFreeDownload={handleExportHistory} />
                {exportedNote ? (
                  <span style={{ color: 'var(--teal-deep)', fontSize: 14 }}>
                    {t({ bn: 'CSV ফাইল ডাউনলোড হয়েছে।', en: 'CSV file downloaded.' })}
                  </span>
                ) : null}
                <button
                  type="button"
                  className="ev-btn ev-btn-ghost"
                  style={{ minHeight: 44 }}
                  onClick={() => {
                    setHistory([]);
                  }}
                >
                  {t({ bn: 'সব মুছে ফেলুন', en: 'Delete all' })}
                </button>
              </div>
              {LAB_TESTS.filter((test) => history.some((e) => e.testId === test.id)).map((test) => {
                const trend = labTrendFor(history, test.id);
                const latest = trend[trend.length - 1];
                const prev = trend.length > 1 ? trend[trend.length - 2] : null;
                const delta = prev ? latest.value - prev.value : null;
                return (
                  <div key={test.id} className="ev-card" style={{ padding: 14, marginBottom: 12 }}>
                    <strong style={{ fontSize: 15, color: 'var(--heading)' }}>
                      {lang === 'bn' ? test.nameBn : test.nameEn} ({test.shortName})
                    </strong>
                    <span style={{ display: 'block', fontSize: 14, marginTop: 6 }}>
                      {t({ bn: 'সর্বশেষ: ', en: 'Latest: ' })}
                      {latest.value} {latest.unit} — {bandLabel(latest.band, lang)} ({latest.date})
                      {delta !== null ? (
                        <span>
                          {' '}
                          ({delta > 0 ? '+' : ''}
                          {delta.toFixed(2)} {t({ bn: 'আগের বার থেকে', en: 'vs previous' })})
                        </span>
                      ) : null}
                    </span>
                    <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                      {trend.map((e) => `${e.date}: ${e.value}`).join('  ·  ')}
                    </span>
                  </div>
                );
              })}
              <h3 style={{ fontSize: 16, margin: '18px 0 8px', color: 'var(--heading)' }}>
                {t({ bn: 'সব সংরক্ষিত ফলাফল', en: 'All saved results' })}
              </h3>
              {history.map((entry) => {
                const test = labTestById(entry.testId);
                return (
                  <div key={entry.id} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '8px 0', borderTop: '1px solid var(--line)', fontSize: 14 }}>
                    <span style={{ flex: 1, minWidth: 180 }}>
                      {test ? (lang === 'bn' ? test.nameBn : test.nameEn) : entry.testId} — {entry.value} {entry.unit} ({bandLabel(entry.band, lang)}, {entry.date})
                    </span>
                    <button
                      type="button"
                      className="ev-btn ev-btn-ghost"
                      style={{ minHeight: 36 }}
                      onClick={() => setHistory((prev) => prev.filter((e) => e.id !== entry.id))}
                    >
                      {t({ bn: 'মুছুন', en: 'Delete' })}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      <p style={{ color: 'var(--muted)', fontSize: 13, margin: '16px 0 0', lineHeight: 1.6 }}>
        {t({
          bn: 'উৎস: প্রতিটি পরীক্ষার বিবরণে তারিখসহ সূত্র দেওয়া আছে (ADA, MedlinePlus, Mayo Clinic, NHS, CDC, WHO প্রভৃতি)। দাম আনুমানিক, ল্যাবভেদে ভিন্ন (নভেম্বর ২০২৬)।',
          en: 'Sources: each test’s detail view lists its dated sources (ADA, MedlinePlus, Mayo Clinic, NHS, CDC, WHO and others). Prices are approximate and vary by lab (November 2026).',
        })}
      </p>
    </section>
  );
}

function ResultCard(props: {
  result: ReturnType<typeof interpretTest>;
  lang: 'bn' | 'en';
  t: (entry: { bn: string; en: string }) => string;
  onSave?: () => void;
  savedNote: boolean;
  onSummaryPdf: () => Promise<void>;
}) {
  const { result, lang, t, onSave, savedNote, onSummaryPdf } = props;
  const test = result.test;
  if (!test) return null;
  const colors = BAND_COLORS[result.band];
  return (
    <div style={{ marginTop: 16 }}>
      <div
        role="status"
        style={{
          padding: '16px',
          borderRadius: 10,
          border: `1px solid ${colors.border}`,
          background: colors.bg,
          color: colors.fg,
        }}
      >
        <p style={{ margin: '0 0 6px', fontSize: 17 }}>
          <strong>
            {lang === 'bn' ? test.nameBn : test.nameEn}: {result.labelBn}
          </strong>
          {result.valueInPrimaryUnit !== undefined ? (
            <span>
              {' '}
              — {result.valueInPrimaryUnit.toFixed(2)} {result.primaryUnit}
            </span>
          ) : null}
        </p>
        <p style={{ margin: '0 0 6px', fontSize: 15, color: 'var(--heading)' }}>
          {lang === 'bn' ? result.meaningBn : result.meaningEn}
        </p>
        <p style={{ margin: '0 0 6px', fontSize: 15, color: 'var(--heading)' }}>
          <strong>{t({ bn: 'করণীয়: ', en: 'What to do: ' })}</strong>
          {lang === 'bn' ? result.actionsBn : result.actionsEn}
        </p>
        {result.redFlag ? (
          <p style={{ margin: '8px 0 0', fontSize: 15, fontWeight: 700 }}>
            ⚠ {lang === 'bn' ? test.redFlagBn : test.redFlagEn}
          </p>
        ) : null}
        <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--muted)' }}>
          {t({
            bn: 'এটি শুধু তথ্য, রোগ নির্ণয় নয় — ডাক্তারের পরামর্শ নিন।',
            en: 'This is information only, not a diagnosis — consult a doctor.',
          })}
        </p>
      </div>

      <div id="lab-doctor-summary" style={{ marginTop: 14, padding: '14px 16px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, color: 'var(--heading)' }}>
          {t({ bn: 'ডাক্তারের জন্য সারসংক্ষেপ', en: 'Doctor-visit summary' })}
        </h3>
        <p style={{ margin: '0 0 4px', fontSize: 14 }}>
          {t({ bn: 'পরীক্ষা: ', en: 'Test: ' })}
          {lang === 'bn' ? test.nameBn : test.nameEn} ({test.shortName})
        </p>
        <p style={{ margin: '0 0 4px', fontSize: 14 }}>
          {t({ bn: 'মান: ', en: 'Value: ' })}
          {result.valueInPrimaryUnit !== undefined
            ? `${result.valueInPrimaryUnit.toFixed(2)} ${result.primaryUnit ?? ''}`
            : (lang === 'bn' ? result.labelBn : result.labelEn)}
        </p>
        <p style={{ margin: '0 0 4px', fontSize: 14 }}>
          {t({ bn: 'ফলাফল: ', en: 'Result: ' })}
          {lang === 'bn' ? result.labelBn : result.labelEn} · {t({ bn: 'তারিখ: ', en: 'Date: ' })}
          {new Date().toISOString().slice(0, 10)}
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 14 }}>
          {t({ bn: 'স্বাভাবিক সীমা: ', en: 'Normal range: ' })}
          {lang === 'bn' ? test.rangeTextBn : test.rangeTextEn}
        </p>
        <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>
          {t({ bn: 'ডাক্তারকে জিজ্ঞেস করার প্রশ্ন:', en: 'Questions to ask the doctor:' })}
        </p>
        <ul style={{ margin: '0 0 4px', paddingLeft: 18, fontSize: 14 }}>
          {(lang === 'bn' ? test.questionsBn : test.questionsEn).map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
        <button
          type="button"
          className="ev-btn ev-btn-outline"
          style={{ minHeight: 44 }}
          onClick={() => window.print()}
        >
          {t({ bn: 'সারসংক্ষেপ প্রিন্ট করুন (ফ্রি)', en: 'Print summary (free)' })}
        </button>
        <RewardedAdButton lang={lang} onFreeDownload={() => void onSummaryPdf()} />
        {onSave ? (
          <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 44 }} onClick={onSave}>
            {t({ bn: 'ইতিহাসে সংরক্ষণ করুন', en: 'Save to history' })}
          </button>
        ) : null}
        {savedNote ? (
          <span style={{ color: 'var(--teal-deep)', fontSize: 14 }}>
            {t({ bn: 'সংরক্ষিত হয়েছে — শুধু এই ব্রাউজারেই থাকবে।', en: 'Saved — stays only in this browser.' })}
          </span>
        ) : null}
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 13, margin: '8px 0 0' }}>
        {t({
          bn: 'PDF-এ বাংলা অক্ষর দেখা যায় না (PDF ফন্টে বাংলা নেই) — বাংলা সারসংক্ষেপ প্রিন্ট বা স্ক্রিনেই দেখুন।',
          en: 'Bangla script does not render inside the PDF (the PDF font has no Bangla glyphs) — view the Bangla summary on screen or in print.',
        })}
      </p>
    </div>
  );
}

function TestDetail(props: {
  test: LabTest;
  lang: 'bn' | 'en';
  t: (entry: { bn: string; en: string }) => string;
  onCheck: (id: string) => void;
}) {
  const { test, lang, t, onCheck } = props;
  return (
    <div style={{ marginTop: 12 }}>
      <h3 style={{ margin: '0 0 4px', fontSize: 18, color: 'var(--heading)' }}>
        {lang === 'bn' ? test.nameBn : test.nameEn} ({test.shortName})
      </h3>
      <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--muted)' }}>
        {lang === 'bn' ? test.measuresBn : test.measuresEn}
      </p>
      <p style={{ margin: '0 0 8px', fontSize: 14 }}>
        <strong>{t({ bn: 'কেন করা হয়: ', en: 'Why it is done: ' })}</strong>
        {lang === 'bn' ? test.whyBn : test.whyEn}
      </p>
      <p style={{ margin: '0 0 8px', fontSize: 14 }}>
        <strong>{t({ bn: 'নমুনা: ', en: 'Sample: ' })}</strong>
        {lang === 'bn' ? test.sampleBn : test.sampleEn}
        {' · '}
        <strong>{t({ bn: 'খালি পেটে: ', en: 'Fasting: ' })}</strong>
        {test.fastingHours === null
          ? t({ bn: 'দরকার নেই', en: 'Not needed' })
          : t({ bn: `${test.fastingHours} ঘণ্টা`, en: `${test.fastingHours} hours` })}
        {' · '}
        <strong>{t({ bn: 'স্বাভাবিক সীমা: ', en: 'Normal range: ' })}</strong>
        {lang === 'bn' ? test.rangeTextBn : test.rangeTextEn}
      </p>
      {test.rangeNoteBn || test.rangeNoteEn ? (
        <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--muted)' }}>
          {lang === 'bn' ? test.rangeNoteBn : test.rangeNoteEn}
        </p>
      ) : null}
      <h4 style={{ fontSize: 15, margin: '14px 0 6px', color: 'var(--heading)' }}>
        {t({ bn: 'পরীক্ষার আগের প্রস্তুতি', en: 'Preparation checklist' })}
      </h4>
      <ul style={{ margin: '0 0 8px', paddingLeft: 18, fontSize: 14 }}>
        <li>{t({ bn: 'পানি: ', en: 'Water: ' })}{lang === 'bn' ? test.prep.waterBn : test.prep.waterEn}</li>
        <li>{t({ bn: 'ওষুধ: ', en: 'Medicines: ' })}{lang === 'bn' ? test.prep.medicinesBn : test.prep.medicinesEn}</li>
        <li>{t({ bn: 'সেরা সময়: ', en: 'Best time: ' })}{lang === 'bn' ? test.prep.bestTimeBn : test.prep.bestTimeEn}</li>
        <li>{lang === 'bn' ? test.prep.notesBn : test.prep.notesEn}</li>
      </ul>
      <p style={{ margin: '0 0 8px', fontSize: 14 }}>
        <strong>{t({ bn: 'কখন আবার করাবেন: ', en: 'When to repeat: ' })}</strong>
        {lang === 'bn' ? test.repeatBn : test.repeatEn}
      </p>
      <p style={{ margin: '0 0 8px', fontSize: 14 }}>
        <strong>{t({ bn: 'আনুমানিক খরচ: ', en: 'Approximate cost: ' })}</strong>
        {test.costBdt
          ? `৳${test.costBdt.min}–${test.costBdt.max}`
          : (lang === 'bn' ? test.costNoteBn : test.costNoteEn)}
        {test.costBdt ? ` — ${lang === 'bn' ? test.costNoteBn : test.costNoteEn}` : ''}
      </p>
      <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#a50e0e' }}>
        ⚠ {lang === 'bn' ? test.redFlagBn : test.redFlagEn}
      </p>
      <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--muted)' }}>
        {t({ bn: 'সূত্র: ', en: 'Sources: ' })}
        {test.sources.join(' · ')} ({t({ bn: 'যাচাই: ২৭ নভেম্বর ২০২৬', en: 'checked 27 Nov 2026' })})
      </p>
      <button
        type="button"
        className="ev-btn ev-btn-primary"
        style={{ minHeight: 44 }}
        onClick={() => onCheck(test.id)}
      >
        {t({ bn: 'এই পরীক্ষার ফলাফল যাচাই করুন', en: 'Check a result for this test' })}
      </button>
    </div>
  );
}
