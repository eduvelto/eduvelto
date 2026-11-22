// Eduvelto — National University MeritExplainer (NU-5, 22 Nov 2026;
// design doc §4, §7.5, §19.7.3).
//
// The student enters their own practice/mock exam score (0–100) and
// their published SSC + HSC GPAs (as on the certificate, 4th subject
// included). The component shows the ESTIMATED merit total (0–200) in
// THREE separate panels — (1) exam score, (2) merit parts, (3)
// admission warnings — using the NU-4 modules directly
// (calculateMeritEstimate + validateAdmissionEligibility), never a
// local copy of the formula.
//
// BINDING safeguards (§19.7.3):
//   * Labelled everywhere: "আনুমানিক হিসাব — অফিসিয়াল মেধাতালিকা নয়".
//   * Pass 35 is a comparison only — never a pass/fail verdict, never
//     a guarantee of admission or of a merit-list place.
//   * Eligibility is shown in its THREE states (meets / does-not-meet /
//     cannot-determine) — never an unconditional green "যোগ্য" badge.
//   * NEVER estimated: merit position, college allotment, subject
//     allotment, quota selection, release-slip selection, admission
//     probability. No tie-break simulation.
//   * Every estimate shows its calculationVersion + circularVersion.
//   * No GPA entered = this panel does not render — only the link to
//     open it. Nothing is stored: the GPAs live in local component
//     state only and are never written to Firestore.

import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { calculateMeritEstimate } from '../lib/nuMerit';
import { validateAdmissionEligibility } from '../lib/nuEligibility';
import { NU_CIRCULAR_VERSION, NU_MERIT_CALCULATION_VERSION } from '../lib/nuExamConfig';
import { NU_GROUPS, type NuGroupSlug } from '../lib/nuProfile';
import { Card } from './ui';

const panelStyle: React.CSSProperties = {
  border: '1px solid #D9DEE2',
  borderRadius: 10,
  padding: '14px 16px',
  background: '#fff',
};

function parseGpa(raw: string): number | null {
  if (raw.trim() === '') return null;
  const v = Number(raw);
  return Number.isFinite(v) ? v : null;
}

export default function MeritExplainer() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState<NuGroupSlug>('humanities');
  const [examScoreRaw, setExamScoreRaw] = useState('');
  const [sscGpaRaw, setSscGpaRaw] = useState('');
  const [hscGpaRaw, setHscGpaRaw] = useState('');
  const [sscYearRaw, setSscYearRaw] = useState('');
  const [hscYearRaw, setHscYearRaw] = useState('');

  const examScore = parseGpa(examScoreRaw);
  const sscGpa = parseGpa(sscGpaRaw);
  const hscGpa = parseGpa(hscGpaRaw);
  const sscYear = sscYearRaw.trim() === '' ? null : Number(sscYearRaw);
  const hscYear = hscYearRaw.trim() === '' ? null : Number(hscYearRaw);

  const inputsReady =
    examScore !== null && examScore >= 0 && examScore <= 100 &&
    sscGpa !== null && hscGpa !== null;
  let estimate = null as ReturnType<typeof calculateMeritEstimate> | null;
  let estimateError = '';
  if (inputsReady) {
    try {
      estimate = calculateMeritEstimate(examScore as number, sscGpa as number, hscGpa as number);
    } catch {
      estimateError = t({
        bn: 'মানগুলো সীমার মধ্যে দিন — পরীক্ষার নম্বর ০–১০০, GPA ০.০০–৫.০০।',
        en: 'Enter values within range — exam score 0–100, GPA 0.00–5.00.',
      });
    }
  }
  const eligibility =
    sscGpa !== null && hscGpa !== null
      ? validateAdmissionEligibility({
          group,
          sscYear: Number.isInteger(sscYear) ? sscYear : null,
          sscGpa,
          hscYear: Number.isInteger(hscYear) ? hscYear : null,
          hscGpa,
        })
      : null;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    minHeight: 44,
    borderRadius: 6,
    border: '1px solid #9AA5AD',
    fontSize: 15,
    fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif",
  };

  return (
    <Card>
      <h3 style={{ marginTop: 0, fontSize: 18, color: '#142B3B' }}>
        {t({ bn: 'মেধা-হিসাব বুঝুন', en: 'Understand the merit calculation' })}
      </h3>
      <p style={{ color: '#444', lineHeight: 1.8, margin: '0 0 12px' }}>
        {t({
          bn: 'মেধা মোট ২০০ = ভর্তি পরীক্ষা ১০০ + SSC GPA × ৮ (৪০) + HSC GPA × ১২ (৬০)। নিজের GPA বসিয়ে আনুমানিক মেধা-নম্বর দেখুন।',
          en: 'Merit total 200 = admission exam 100 + SSC GPA × 8 (40) + HSC GPA × 12 (60). Enter your GPAs to see an estimated merit score.',
        })}
      </p>
      <p style={{ margin: '0 0 12px', fontWeight: 700, color: '#8A6100' }}>
        {t({
          bn: 'আনুমানিক হিসাব — অফিসিয়াল মেধাতালিকা নয়। আসল মেধা নির্ভর করে অফিসিয়াল পরীক্ষার নম্বর ও সব আবেদনকারীর ফলাফলের ওপর।',
          en: 'Estimated calculation — not the official merit list. Real merit depends on the official exam score and all applicants’ results.',
        })}
      </p>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{ padding: '10px 18px', minHeight: 44, borderRadius: 6, border: '1px solid #1E3A5F', background: '#fff', color: '#1E3A5F', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}
        >
          {t({ bn: 'GPA বসিয়ে আনুমানিক মেধা দেখুন', en: 'Enter GPA to see the estimated merit' })}
        </button>
      ) : (
        <div>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <label style={{ display: 'block', fontSize: 14, color: '#444' }}>
              {t({ bn: 'শাখা', en: 'Group' })}
              <select value={group} onChange={(e) => setGroup(e.target.value as NuGroupSlug)} style={{ ...inputStyle, marginTop: 6 }}>
                {NU_GROUPS.map((g) => (
                  <option key={g.slug} value={g.slug}>
                    {t({ bn: g.bn, en: g.en })}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'block', fontSize: 14, color: '#444' }}>
              {t({ bn: 'অনুশীলন/মকের নম্বর (০–১০০)', en: 'Practice/mock score (0–100)' })}
              <input inputMode="decimal" value={examScoreRaw} onChange={(e) => setExamScoreRaw(e.target.value)} placeholder="যেমন: ৭২" style={{ ...inputStyle, marginTop: 6 }} />
            </label>
            <label style={{ display: 'block', fontSize: 14, color: '#444' }}>
              {t({ bn: 'SSC GPA (০.০০–৫.০০)', en: 'SSC GPA (0.00–5.00)' })}
              <input inputMode="decimal" value={sscGpaRaw} onChange={(e) => setSscGpaRaw(e.target.value)} placeholder="যেমন: ৪.৫০" style={{ ...inputStyle, marginTop: 6 }} />
            </label>
            <label style={{ display: 'block', fontSize: 14, color: '#444' }}>
              {t({ bn: 'HSC GPA (০.০০–৫.০০)', en: 'HSC GPA (0.00–5.00)' })}
              <input inputMode="decimal" value={hscGpaRaw} onChange={(e) => setHscGpaRaw(e.target.value)} placeholder="যেমন: ৪.৭৫" style={{ ...inputStyle, marginTop: 6 }} />
            </label>
            <label style={{ display: 'block', fontSize: 14, color: '#444' }}>
              {t({ bn: 'SSC সাল (২০২২/২০২৩)', en: 'SSC year (2022/2023)' })}
              <input inputMode="numeric" value={sscYearRaw} onChange={(e) => setSscYearRaw(e.target.value)} placeholder="যেমন: ২০২২" style={{ ...inputStyle, marginTop: 6 }} />
            </label>
            <label style={{ display: 'block', fontSize: 14, color: '#444' }}>
              {t({ bn: 'HSC সাল (২০২৪/২০২৫)', en: 'HSC year (2024/2025)' })}
              <input inputMode="numeric" value={hscYearRaw} onChange={(e) => setHscYearRaw(e.target.value)} placeholder="যেমন: ২০২৪" style={{ ...inputStyle, marginTop: 6 }} />
            </label>
          </div>
          <p style={{ color: '#57616A', fontSize: 13, lineHeight: 1.7 }}>
            {t({
              bn: 'GPA সনদে যেমন আছে (৪র্থ বিষয়সহ), তেমনই বসান — নিজে নতুন করে হিসাব করবেন না। এই তথ্য কোথাও সংরক্ষণ করা হয় না।',
              en: 'Enter the GPA exactly as on the certificate (4th subject included) — do not recompute it. This information is not saved anywhere.',
            })}
          </p>
          {estimateError ? <p style={{ color: '#b00020' }}>{estimateError}</p> : null}
          {estimate ? (
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 12 }}>
              <div style={panelStyle}>
                <strong style={{ display: 'block', marginBottom: 8 }}>
                  {t({ bn: '১ · পরীক্ষার নম্বর', en: '1 · Exam score' })}
                </strong>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#1E3A5F' }}>{estimate.examScore}</span>
                <span style={{ color: '#57616A' }}> / ১০০</span>
                <p style={{ margin: '8px 0 0', color: '#57616A', fontSize: 13, lineHeight: 1.7 }}>
                  {t({
                    bn: 'পাস নম্বর ৩৫ — তুলনার জন্য মাত্র। এটি ভর্তির নিশ্চয়তা নয়।',
                    en: 'Pass mark 35 — for comparison only. It is no guarantee of admission.',
                  })}
                </p>
              </div>
              <div style={panelStyle}>
                <strong style={{ display: 'block', marginBottom: 8 }}>
                  {t({ bn: '২ · সম্ভাব্য মেধা স্কোর (আনুমানিক)', en: '2 · Estimated merit score' })}
                </strong>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#1E3A5F' }}>{estimate.total}</span>
                <span style={{ color: '#57616A' }}> / ২০০</span>
                <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: '#444', fontSize: 14, lineHeight: 1.8 }}>
                  <li>{t({ bn: `পরীক্ষা: ${estimate.examScore} / ১০০`, en: `Exam: ${estimate.examScore} / 100` })}</li>
                  <li>{t({ bn: `SSC GPA অংশ: ${estimate.sscPart} / ৪০`, en: `SSC GPA part: ${estimate.sscPart} / 40` })}</li>
                  <li>{t({ bn: `HSC GPA অংশ: ${estimate.hscPart} / ৬০`, en: `HSC GPA part: ${estimate.hscPart} / 60` })}</li>
                </ul>
                <p style={{ margin: '8px 0 0', color: '#68747B', fontSize: 12 }}>
                  {t({
                    bn: `হিসাব-সংস্করণ: ${NU_MERIT_CALCULATION_VERSION} · বিজ্ঞপ্তি-সংস্করণ: ${NU_CIRCULAR_VERSION}`,
                    en: `Calculation version: ${NU_MERIT_CALCULATION_VERSION} · Circular version: ${NU_CIRCULAR_VERSION}`,
                  })}
                </p>
              </div>
              <div style={panelStyle}>
                <strong style={{ display: 'block', marginBottom: 8 }}>
                  {t({ bn: '৩ · ভর্তি-সংক্রান্ত সতর্কতা', en: '3 · Admission warnings' })}
                </strong>
                <p style={{ margin: '0 0 8px', color: '#444', fontSize: 14, lineHeight: 1.8 }}>
                  {t({
                    bn: '৩৫ নম্বর হলো প্রকাশিত পরীক্ষার পাস নম্বর। এটি কোনো কলেজে ভর্তির নিশ্চয়তা বা মেধাতালিকায় নির্বাচিত হওয়ার নিশ্চয়তা নয়।',
                    en: '35 is the published exam pass mark. It is no guarantee of admission to any college or of selection in a merit list.',
                  })}
                </p>
                {eligibility ? (
                  <div>
                    <p style={{ margin: '0 0 6px', fontWeight: 700 }}>
                      {t({
                        bn:
                          eligibility.status === 'meets'
                            ? 'যোগ্যতা: শর্ত পূরণ হয়েছে (বিজ্ঞপ্তি অনুযায়ী)'
                            : eligibility.status === 'does-not-meet'
                              ? 'যোগ্যতা: শর্ত পূরণ হয়নি'
                              : 'যোগ্যতা: নির্ধারণ করা যায়নি',
                        en:
                          eligibility.status === 'meets'
                            ? 'Eligibility: conditions met (per the circular)'
                            : eligibility.status === 'does-not-meet'
                              ? 'Eligibility: conditions not met'
                              : 'Eligibility: cannot be determined',
                      })}
                    </p>
                    <ul style={{ margin: 0, paddingLeft: 18, color: '#444', fontSize: 14, lineHeight: 1.8 }}>
                      {eligibility.reasons.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                    <p style={{ margin: '8px 0 0', color: '#57616A', fontSize: 13, lineHeight: 1.7 }}>
                      {t({
                        bn: 'যোগ্যতা আলাদাভাবে যাচাই হয় — বিষয়-যোগ্যতা এখানে যাচাই হয় না। মেধাতালিকার অবস্থান, কলেজ-বরাদ্দ বা ভর্তির সম্ভাবনা এখানে দেখানো হয় না।',
                        en: 'Eligibility is checked separately — subject eligibility is not checked here. Merit position, college allotment and admission probability are not shown here.',
                      })}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}
