// Eduvelto — Admission Score Calculator tool UI (28 Nov 2026).
//
// Dhaka University 2026-27 and Medical MBBS/BDS 2026-27 (DGME circular
// 25 Nov 2026) GPA + merit formulas, verified from the official
// circulars. Pure client-side calculation — no network, no storage.
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  LoadExampleBtn,
  Tiles,
  ToolSection,
  errorStyle,
  formulaStyle,
  gridStyle,
  inputStyle,
  labelStyle,
  noteStyle,
  resultStyle,
} from './eduToolUi';
import {
  MAX_GPA,
  MAX_TEST_SCORE,
  calculateAdmissionScore,
  parseGpaInput,
  parseTestScoreInput,
  type AdmissionSystem,
} from '../../lib/tools/admissionScore';

export function AdmissionScoreTool() {
  const { t } = useLanguage();
  const [system, setSystem] = useState<AdmissionSystem>('du');
  const [ssc, setSsc] = useState('5.00');
  const [hsc, setHsc] = useState('5.00');
  const [testScore, setTestScore] = useState('75');
  const [secondTimer, setSecondTimer] = useState(false);
  const [admittedLastSession, setAdmittedLastSession] = useState(false);

  const sscParsed = parseGpaInput(ssc);
  const hscParsed = parseGpaInput(hsc);
  const testParsed = parseTestScoreInput(testScore);
  const inputsValid = !sscParsed.invalid && !hscParsed.invalid && !testParsed.invalid;
  const hasGpas = sscParsed.value !== null && hscParsed.value !== null;

  const result =
    inputsValid && hasGpas
      ? calculateAdmissionScore({
          system,
          sscGpa: sscParsed.value as number,
          hscGpa: hscParsed.value as number,
          testScore: testParsed.value,
          secondTimer: system === 'medical' ? secondTimer : false,
          admittedLastSession: system === 'medical' ? admittedLastSession : false,
        })
      : null;

  function loadExample() {
    if (system === 'medical') {
      setSsc('5.00');
      setHsc('5.00');
      setTestScore('70');
    } else {
      setSsc('5.00');
      setHsc('5.00');
      setTestScore('75');
    }
    setSecondTimer(false);
    setAdmittedLastSession(false);
  }

  const bandNote =
    result?.meritBand === 'strong'
      ? t({
          bn: 'খুব ভালো স্কোর — এই নম্বরে সাধারণত মেধা তালিকার উপরের দিকে থাকার সম্ভাবনা থাকে।',
          en: 'A very strong score — with this total you would usually be near the top of the merit list.',
        })
      : result?.meritBand === 'competitive'
        ? t({
            bn: 'প্রতিযোগিতামূলক স্কোর — মেধা তালিকায় জায়গা পাওয়ার সম্ভাবনা আছে, তবে বিষয় ও বছরের উপর নির্ভর করবে।',
            en: 'A competitive score — a place on the merit list is possible, but it depends on the subject and the year.',
          })
        : result?.meritBand === 'needs-improvement'
          ? t({
              bn: 'এই স্কোরে মেধা তালিকায় জায়গা পাওয়া কঠিন হতে পারে — ভর্তি পরীক্ষায় আরও ভালো নম্বর তোলার চেষ্টা করুন।',
              en: 'With this score a place on the merit list may be hard — try to score higher in the admission test.',
            })
          : '';

  return (
    <ToolSection
      id="admission-score-title"
      titleBn="ভর্তি স্কোর ক্যালকুলেটর"
      titleEn="Admission Score Calculator"
      descBn="ঢাকা বিশ্ববিদ্যালয় ও মেডিকেল (MBBS-BDS) ভর্তির জিপিএ স্কোর ও মেধা স্কোর হিসাব করুন — এসএসসি ও এইচএসসি জিপিএ থেকে।"
      descEn="Calculate the GPA score and merit score for Dhaka University and Medical (MBBS-BDS) admission — from your SSC and HSC GPAs."
    >
      <p style={noteStyle}>
        {t({
          bn: 'সতর্কতা: সূত্র প্রতি বছর বদলাতে পারে এবং বিশ্ববিদ্যালয়ভেদে আলাদা হয় — সবসময় চলতি বছরের অফিসিয়াল সার্কুলার দেখে নিন। এই টুল শুধু ঢাকা বিশ্ববিদ্যালয় ও মেডিকেলের সূত্র দেখায়।',
          en: 'Note: formulas change every year and differ by university — always check the current official circular. This tool shows the Dhaka University and Medical formulas only.',
        })}
      </p>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="as-system">{t({ bn: 'ভর্তি ব্যবস্থা', en: 'Admission system' })}</label>
          <select
            id="as-system"
            style={inputStyle}
            value={system}
            onChange={(e) => setSystem(e.target.value as AdmissionSystem)}
          >
            <option value="du">{t({ bn: 'ঢাকা বিশ্ববিদ্যালয়', en: 'Dhaka University' })}</option>
            <option value="medical">{t({ bn: 'মেডিকেল MBBS-BDS', en: 'Medical MBBS-BDS' })}</option>
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="as-ssc">{t({ bn: 'এসএসসি জিপিএ (০–৫)', en: 'SSC GPA (0–5)' })}</label>
          <input
            id="as-ssc"
            style={inputStyle}
            type="number"
            min="0"
            max="5"
            step="0.01"
            value={ssc}
            placeholder={t({ bn: 'যেমন ৫.০০', en: 'e.g. 5.00' })}
            onChange={(e) => setSsc(e.target.value)}
          />
          {sscParsed.invalid && (
            <p style={{ ...errorStyle, marginTop: 6 }}>
              {t({ bn: `জিপিএ ০ থেকে ${MAX_GPA}-এর মধ্যে হতে হবে।`, en: `GPA must be between 0 and ${MAX_GPA}.` })}
            </p>
          )}
        </div>
        <div>
          <label style={labelStyle} htmlFor="as-hsc">{t({ bn: 'এইচএসসি জিপিএ (০–৫)', en: 'HSC GPA (0–5)' })}</label>
          <input
            id="as-hsc"
            style={inputStyle}
            type="number"
            min="0"
            max="5"
            step="0.01"
            value={hsc}
            placeholder={t({ bn: 'যেমন ৫.০০', en: 'e.g. 5.00' })}
            onChange={(e) => setHsc(e.target.value)}
          />
          {hscParsed.invalid && (
            <p style={{ ...errorStyle, marginTop: 6 }}>
              {t({ bn: `জিপিএ ০ থেকে ${MAX_GPA}-এর মধ্যে হতে হবে।`, en: `GPA must be between 0 and ${MAX_GPA}.` })}
            </p>
          )}
        </div>
        <div>
          <label style={labelStyle} htmlFor="as-test">
            {t({ bn: 'ভর্তি পরীক্ষার নম্বর (০–১০০, ঐচ্ছিক)', en: 'Admission test score (0–100, optional)' })}
          </label>
          <input
            id="as-test"
            style={inputStyle}
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={testScore}
            placeholder={t({ bn: 'যেমন ৭৫', en: 'e.g. 75' })}
            onChange={(e) => setTestScore(e.target.value)}
          />
          {testParsed.invalid && (
            <p style={{ ...errorStyle, marginTop: 6 }}>
              {t({ bn: `পরীক্ষার নম্বর ০ থেকে ${MAX_TEST_SCORE}-এর মধ্যে হতে হবে।`, en: `Test score must be between 0 and ${MAX_TEST_SCORE}.` })}
            </p>
          )}
        </div>
      </div>

      {system === 'medical' && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 15 }}>
            <input type="checkbox" checked={secondTimer} onChange={(e) => setSecondTimer(e.target.checked)} />
            {t({ bn: 'আমি দ্বিতীয়বারের পরীক্ষার্থী (−৩ নম্বর)', en: 'I am a second-time candidate (−3 marks)' })}
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 15 }}>
            <input type="checkbox" checked={admittedLastSession} onChange={(e) => setAdmittedLastSession(e.target.checked)} />
            {t({ bn: 'গত সেশনে আমি ভর্তি হয়েছিলাম (−৫ নম্বর)', en: 'I was admitted in the last session (−5 marks)' })}
          </label>
        </div>
      )}

      <p style={formulaStyle}>
        {system === 'du'
          ? t({
              bn: 'সূত্র (ঢাকা বিশ্ববিদ্যালয় ২০২৬-২৭): জিপিএ স্কোর = এসএসসি জিপিএ × ২ + এইচএসসি জিপিএ × ২ (সর্বোচ্চ ২০); মেধা স্কোর = পরীক্ষার নম্বর + জিপিএ স্কোর (সর্বমোট ১২০)।',
              en: 'Formula (Dhaka University 2026-27): GPA score = SSC GPA × 2 + HSC GPA × 2 (max 20); merit score = test score + GPA score (total 120).',
            })
          : t({
              bn: 'সূত্র (মেডিকেল MBBS-BDS ২০২৬-২৭, DGME সার্কুলার ২৫ নভেম্বর ২০২৬): জিপিএ স্কোর = এসএসসি জিপিএ × ৮ (সর্বোচ্চ ৪০) + এইচএসসি জিপিএ × ১২ (সর্বোচ্চ ৬০) = সর্বোচ্চ ১০০; মেধা স্কোর = পরীক্ষার নম্বর + জিপিএ স্কোর (সর্বমোট ২০০)।',
              en: 'Formula (Medical MBBS-BDS 2026-27, DGME circular 25 Nov 2026): GPA score = SSC GPA × 8 (max 40) + HSC GPA × 12 (max 60) = max 100; merit score = test score + GPA score (total 200).',
            })}
      </p>

      <div style={{ marginTop: 12 }}>
        <LoadExampleBtn onLoad={loadExample} />
      </div>

      <div style={resultStyle} role="status">
        {result === null ? (
          <p style={{ margin: 0 }}>
            {t({
              bn: 'এসএসসি ও এইচএসসি জিপিএ বসালেই জিপিএ স্কোর এখানে দেখাবে; পরীক্ষার নম্বর বসালে মেধা স্কোরও দেখাবে।',
              en: 'Enter your SSC and HSC GPAs to see the GPA score here; add a test score to see the merit score too.',
            })}
          </p>
        ) : (
          <>
            <p style={{ margin: '0 0 6px', fontSize: 16 }}>
              {t({ bn: 'জিপিএ স্কোর', en: 'GPA score' })}
            </p>
            <p style={{ margin: '0 0 6px', fontSize: 30, fontWeight: 700, color: 'var(--heading)', fontFamily: 'var(--font-head)' }}>
              {result.gpaScore} / {result.maxGpaScore}
            </p>
            <Tiles
              items={[
                { label: t({ bn: 'এসএসসি অংশ', en: 'SSC part' }), value: String(result.sscPart) },
                { label: t({ bn: 'এইচএসসি অংশ', en: 'HSC part' }), value: String(result.hscPart) },
                ...(result.penalty > 0
                  ? [{ label: t({ bn: 'কাটা নম্বর', en: 'Penalty' }), value: `−${result.penalty}` }]
                  : []),
                {
                  label: t({ bn: 'মেধা স্কোর', en: 'Merit score' }),
                  value: result.meritScore === null ? '—' : `${result.meritScore} / ${result.maxMerit}`,
                },
              ]}
            />
            {result.meritScore !== null && (
              <p style={noteStyle}>
                {t({
                  bn: `আপনার মেধা স্কোর ${result.meritScore} / ${result.maxMerit} (${result.meritPercent}%)। ${bandNote}`,
                  en: `Your merit score is ${result.meritScore} / ${result.maxMerit} (${result.meritPercent}%). ${bandNote}`,
                })}
              </p>
            )}
            {result.meritScore === null && (
              <p style={noteStyle}>
                {t({
                  bn: 'ভর্তি পরীক্ষার নম্বর বসালে মোট মেধা স্কোর এখানে দেখাবে।',
                  en: 'Add your admission test score to see the total merit score here.',
                })}
              </p>
            )}
          </>
        )}
        <p style={noteStyle}>
          {t({
            bn: 'এই হিসাব শুধু ধারণার জন্য — আসল মেধা তালিকা নির্ভর করে চলতি বছরের সার্কুলার, পরীক্ষার নম্বর ও অন্যান্য প্রার্থীদের ফলাফলের উপর।',
            en: 'This is only a guide — the real merit list depends on the current circular, the test score, and other candidates’ results.',
          })}
        </p>
      </div>
    </ToolSection>
  );
}
