// Eduvelto — Study Routine Maker tool UI.
// Pure logic in src/lib/tools/studyRoutine.ts. PDF via jspdf (dynamic
// import) through <RewardedAdButton>; the PDF is English/Latin only.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import RewardedAdButton from '../../components/RewardedAdButton';
import { ROUTINE_DAYS, buildRoutine, formatRoutineHour } from '../../lib/tools/studyRoutine';
import {
  CopyBtn, LoadExampleBtn, PdfBanglaNote, Tiles, ToolSection, errorStyle,
  formulaStyle, gridStyle, inputStyle, labelStyle, noteStyle, resultStyle,
} from './eduToolUi';

const EXAMPLE_TEXT = 'Bangla, 5\nEnglish, 4\nMathematics, 6\nScience, 3';

function parseSubjects(text: string): { name: string; hoursPerWeek: number }[] {
  return text.split('\n').map((line) => {
    const [name, hours] = line.split(',').map((p) => p.trim());
    return { name: name ?? '', hoursPerWeek: Number(hours) };
  }).filter((s) => s.name !== '' && Number.isFinite(s.hoursPerWeek) && s.hoursPerWeek > 0);
}

export function StudyRoutineTool() {
  const { t, lang } = useLanguage();
  const [text, setText] = useState('');
  const [days, setDays] = useState<string[]>(['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday']);
  const [startHour, setStartHour] = useState('16');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  const result = useMemo(() => {
    try { return buildRoutine(parseSubjects(text), days, Number(startHour)); } catch { return null; }
  }, [text, days, startHour]);

  const toggleDay = (day: string) =>
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  async function handleDownload(): Promise<void> {
    if (!result || busy) return;
    setBusy(true);
    setError(null);
    setDownloaded(false);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Study Routine', 105, 18, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Total: ${result.totalHoursPerWeek} hours/week, ${result.totalMinutesPerDay} min/day`, 105, 26, { align: 'center' });
      let y = 38;
      for (const slot of result.slots) {
        doc.text(`${slot.day}  ${formatRoutineHour(slot.startHour)}  ${slot.subject}  (${slot.durationMin} min)`, 15, y);
        y += 7;
        if (y > 280) { doc.addPage(); y = 20; }
      }
      doc.save('study-routine.pdf');
      setDownloaded(true);
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  const copyText = result
    ? result.slots.map((s) => `${s.day} ${formatRoutineHour(s.startHour)} — ${s.subject} (${s.durationMin} min)`).join('\n')
    : '';

  return (
    <ToolSection id="routine-title" titleBn="পড়ার রুটিন মেকার" titleEn="Study Routine Maker"
      descBn="নিজের পড়ার রুটিন বানিয়ে PDF হিসেবে সংরক্ষণ করুন। সব কাজ আপনার ডিভাইসেই হয়।"
      descEn="Build a study routine and save it as a PDF. Everything happens on your device.">
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="routine-subjects">{t({ bn: 'বিষয় ও সাপ্তাহিক ঘণ্টা (প্রতি লাইনে: বিষয়, ঘণ্টা)', en: 'Subjects & weekly hours (one per line: subject, hours)' })}</label>
          <textarea id="routine-subjects" style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }} value={text}
            onChange={(e) => setText(e.target.value)} placeholder={EXAMPLE_TEXT} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="routine-start">{t({ bn: 'শুরুর সময় (ঘণ্টা, ০–২৩)', en: 'Start hour (0–23)' })}</label>
          <input id="routine-start" style={inputStyle} type="number" min="0" max="23" value={startHour} onChange={(e) => setStartHour(e.target.value)} />
          <p style={{ ...noteStyle, marginTop: 12 }}>{t({ bn: 'পড়ার দিন', en: 'Study days' })}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ROUTINE_DAYS.map((day) => (
              <button key={day} type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 36 }}
                aria-pressed={days.includes(day)} onClick={() => toggleDay(day)}>
                {days.includes(day) ? '✓ ' : ''}{day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12 }}><LoadExampleBtn onLoad={() => setText(EXAMPLE_TEXT)} /></div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}><strong>{t({ bn: 'আপনার রুটিন তৈরি', en: 'Your routine is ready' })}</strong></p>
          <Tiles items={[
            { label: t({ bn: 'সাপ্তাহিক মোট', en: 'Weekly total' }), value: `${result.totalHoursPerWeek} ${t({ bn: 'ঘণ্টা', en: 'h' })}` },
            { label: t({ bn: 'প্রতিদিন', en: 'Per day' }), value: `${result.totalMinutesPerDay} ${t({ bn: 'মিনিট', en: 'min' })}` },
            { label: t({ bn: 'মোট স্লট', en: 'Total slots' }), value: String(result.slots.length) },
          ]} />
          <div style={{ marginTop: 12, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead><tr>
                <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--line)' }}>{t({ bn: 'দিন', en: 'Day' })}</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--line)' }}>{t({ bn: 'সময়', en: 'Time' })}</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--line)' }}>{t({ bn: 'বিষয়', en: 'Subject' })}</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--line)' }}>{t({ bn: 'সময়কাল', en: 'Duration' })}</th>
              </tr></thead>
              <tbody>
                {result.slots.map((s, i) => (
                  <tr key={i}>
                    <td style={{ padding: '6px 8px' }}>{s.day}</td>
                    <td style={{ padding: '6px 8px' }}>{formatRoutineHour(s.startHour)}</td>
                    <td style={{ padding: '6px 8px' }}>{s.subject}</td>
                    <td style={{ padding: '6px 8px' }}>{s.durationMin} {t({ bn: 'মিনিট', en: 'min' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={formulaStyle}>{t({ bn: `প্রতিদিন ≈ সাপ্তাহিক মোট ${result.totalHoursPerWeek} ঘণ্টা ÷ ${days.length} দিন`, en: `Per day ≈ weekly total ${result.totalHoursPerWeek}h ÷ ${days.length} days` })}</p>
          <PdfBanglaNote />
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <RewardedAdButton lang={lang} onFreeDownload={() => void handleDownload()} />
            <CopyBtn text={copyText} labelBn="রুটিন কপি করুন" labelEn="Copy routine" />
          </div>
          {busy ? <p style={noteStyle} role="status">{t({ bn: 'পিডিএফ তৈরি হচ্ছে…', en: 'Making the PDF…' })}</p> : null}
          {downloaded ? <p style={noteStyle} role="status">{t({ bn: 'ডাউনলোড হয়েছে।', en: 'Downloaded.' })}</p> : null}
        </div>
      ) : text.trim() !== '' ? (
        <p style={errorStyle} role="alert">{t({ bn: 'প্রতি লাইনে "বিষয়, ঘণ্টা" লিখুন এবং কমপক্ষে একটি পড়ার দিন বেছে নিন।', en: 'Write "subject, hours" on each line and choose at least one study day.' })}</p>
      ) : null}
      {error ? <p style={errorStyle} role="alert">{t({ bn: 'পিডিএফ বানানো যায়নি — আবার চেষ্টা করুন।', en: 'Could not make the PDF — please try again.' })}</p> : null}
    </ToolSection>
  );
}
