// Eduvelto — Academic Calendar Maker tool UI.
// Pure logic in src/lib/tools/academicCalendar.ts. PDF via jspdf
// (dynamic import) through <RewardedAdButton>; PDF is English/Latin.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import RewardedAdButton from '../../components/RewardedAdButton';
import { countAcademicEvents, sortAcademicEvents, type AcademicEvent, type AcademicEventType } from '../../lib/tools/academicCalendar';
import {
  CopyBtn, PdfBanglaNote, Tiles, ToolSection, errorStyle, gridStyle,
  inputStyle, labelStyle, noteStyle, resultStyle,
} from './eduToolUi';

const TYPE_LABELS: Record<AcademicEventType, { bn: string; en: string }> = {
  exam: { bn: 'পরীক্ষা', en: 'Exam' },
  holiday: { bn: 'ছুটি', en: 'Holiday' },
  event: { bn: 'অনুষ্ঠান', en: 'Event' },
};

const EXAMPLE_EVENTS: AcademicEvent[] = [
  { date: '2027-01-02', title: 'New Academic Year Begins', type: 'event' },
  { date: '2027-03-15', title: 'First Term Exam', type: 'exam' },
  { date: '2027-04-14', title: 'Pohela Boishakh Holiday', type: 'holiday' },
  { date: '2027-06-20', title: 'Half-Yearly Exam', type: 'exam' },
];

export function AcademicCalendarTool() {
  const { t, lang } = useLanguage();
  const [year, setYear] = useState('2027');
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AcademicEventType>('event');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  const sorted = useMemo(() => {
    try { return sortAcademicEvents(events); } catch { return []; }
  }, [events]);
  const counts = useMemo(() => countAcademicEvents(events), [events]);

  async function handleDownload(): Promise<void> {
    if (sorted.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    setDownloaded(false);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(`Academic Calendar ${year}`, 105, 18, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      let y = 30;
      for (const ev of sorted) {
        doc.text(`${ev.date}  [${ev.type}]  ${ev.title}`, 15, y);
        y += 7;
        if (y > 280) { doc.addPage(); y = 20; }
      }
      doc.save(`academic-calendar-${year}.pdf`);
      setDownloaded(true);
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolSection id="acad-cal-title" titleBn="শিক্ষাবর্ষ ক্যালেন্ডার মেকার" titleEn="Academic Calendar Maker"
      descBn="শিক্ষাপ্রতিষ্ঠানের জন্য শিক্ষাবর্ষের ক্যালেন্ডার বানান। সব কাজ আপনার ডিভাইসেই হয়।"
      descEn="Make an academic year calendar for a school or college. Everything happens on your device.">
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="cal-year">{t({ bn: 'শিক্ষাবর্ষ', en: 'Academic year' })}</label>
          <input id="cal-year" style={inputStyle} type="number" min="2000" max="2100" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="cal-date">{t({ bn: 'তারিখ', en: 'Date' })}</label>
          <input id="cal-date" style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="cal-title">{t({ bn: 'শিরোনাম (ইংরেজিতে লিখুন — পিডিএফে বাংলা যায় না)', en: 'Title (write in English — the PDF has no Bangla)' })}</label>
          <input id="cal-title" style={inputStyle} type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="First Term Exam" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="cal-type">{t({ bn: 'ধরন', en: 'Type' })}</label>
          <select id="cal-type" style={inputStyle} value={type} onChange={(e) => setType(e.target.value as AcademicEventType)}>
            {(Object.keys(TYPE_LABELS) as AcademicEventType[]).map((k) => (<option key={k} value={k}>{t(TYPE_LABELS[k])}</option>))}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button type="button" className="ev-btn ev-btn-primary" style={{ minHeight: 44 }}
          onClick={() => {
            if (date === '' || title.trim() === '') return;
            setEvents((prev) => [...prev, { date, title: title.trim(), type }]);
            setDate('');
            setTitle('');
          }}>
          {t({ bn: 'ইভেন্ট যোগ করুন', en: 'Add event' })}
        </button>
        <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 44 }} onClick={() => setEvents([...EXAMPLE_EVENTS])}>
          {t({ bn: 'উদাহরণ বসান', en: 'Load example' })}
        </button>
      </div>
      {sorted.length > 0 ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}><strong>{t({ bn: 'শিক্ষাবর্ষ ', en: 'Academic year ' })}{year}</strong></p>
          <Tiles items={[
            { label: t({ bn: 'মোট ইভেন্ট', en: 'Total events' }), value: String(sorted.length) },
            { label: t({ bn: 'পরীক্ষা', en: 'Exams' }), value: String(counts.exam) },
            { label: t({ bn: 'ছুটি', en: 'Holidays' }), value: String(counts.holiday) },
            { label: t({ bn: 'অনুষ্ঠান', en: 'Events' }), value: String(counts.event) },
          ]} />
          <div style={{ marginTop: 12, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead><tr>
                <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--line)' }}>{t({ bn: 'তারিখ', en: 'Date' })}</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--line)' }}>{t({ bn: 'শিরোনাম', en: 'Title' })}</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--line)' }}>{t({ bn: 'ধরন', en: 'Type' })}</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--line)' }} />
              </tr></thead>
              <tbody>
                {sorted.map((ev, i) => (
                  <tr key={`${ev.date}-${i}`}>
                    <td style={{ padding: '6px 8px' }}>{ev.date}</td>
                    <td style={{ padding: '6px 8px' }}>{ev.title}</td>
                    <td style={{ padding: '6px 8px' }}>{t(TYPE_LABELS[ev.type])}</td>
                    <td style={{ padding: '6px 8px' }}>
                      <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 30, padding: '2px 8px' }}
                        onClick={() => setEvents((prev) => prev.filter((_, j) => j !== events.indexOf(ev)))}>
                        {t({ bn: 'মুছুন', en: 'Remove' })}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PdfBanglaNote />
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <RewardedAdButton lang={lang} onFreeDownload={() => void handleDownload()} />
            <CopyBtn text={sorted.map((ev) => `${ev.date} [${ev.type}] ${ev.title}`).join('\n')} labelBn="ক্যালেন্ডার কপি করুন" labelEn="Copy calendar" />
          </div>
          {busy ? <p style={noteStyle} role="status">{t({ bn: 'পিডিএফ তৈরি হচ্ছে…', en: 'Making the PDF…' })}</p> : null}
          {downloaded ? <p style={noteStyle} role="status">{t({ bn: 'ডাউনলোড হয়েছে।', en: 'Downloaded.' })}</p> : null}
        </div>
      ) : (
        <p style={noteStyle}>{t({ bn: 'তারিখ ও শিরোনাম দিয়ে ইভেন্ট যোগ করুন — সেগুলো তারিখ অনুযায়ী সাজানো হবে।', en: 'Add events with a date and title — they will be sorted by date.' })}</p>
      )}
      {error ? <p style={errorStyle} role="alert">{t({ bn: 'পিডিএফ বানানো যায়নি — আবার চেষ্টা করুন।', en: 'Could not make the PDF — please try again.' })}</p> : null}
    </ToolSection>
  );
}
