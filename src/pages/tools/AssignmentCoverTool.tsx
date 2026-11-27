// Eduvelto — Assignment Cover Generator tool UI.
// Pure logic in src/lib/tools/assignmentCover.ts. PDF via jspdf
// (dynamic import) through <RewardedAdButton>; PDF is English/Latin.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import RewardedAdButton from '../../components/RewardedAdButton';
import { buildAssignmentCoverFilename, validateAssignmentCover } from '../../lib/tools/assignmentCover';
import { todayIsoDate } from '../../lib/tools/certificateMaker';
import {
  LoadExampleBtn, PdfBanglaNote, ToolSection, errorStyle,
  gridStyle, inputStyle, labelStyle, noteStyle, resultStyle,
} from './eduToolUi';

export function AssignmentCoverTool() {
  const { t, lang } = useLanguage();
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [institution, setInstitution] = useState('');
  const [date, setDate] = useState(() => todayIsoDate());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);

  const data = { studentName, studentId, courseTitle, assignmentTitle, teacherName, institution, date };
  const missing = useMemo(() => validateAssignmentCover(data), [studentName, studentId, courseTitle, assignmentTitle, teacherName, institution, date]);
  const ready = missing.length === 0;
  const filename = buildAssignmentCoverFilename(studentName);

  async function handleDownload(): Promise<void> {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    setDownloaded(false);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const cx = 105;
      doc.setDrawColor(18, 118, 110);
      doc.setLineWidth(1);
      doc.rect(12, 12, 186, 273);
      doc.setTextColor(20, 43, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(institution.trim(), cx, 45, { align: 'center' });
      doc.setFontSize(16);
      doc.text('Assignment Cover Page', cx, 62, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      const lines: [string, string][] = [
        ['Assignment Title', assignmentTitle.trim()],
        ['Course', courseTitle.trim()],
        ['Student Name', studentName.trim()],
        ['Student ID', studentId.trim()],
        ['Teacher', teacherName.trim()],
        ['Date', date],
      ];
      let y = 95;
      for (const [label, value] of lines) {
        if (value === '') continue;
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, 30, y);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 75, y);
        y += 12;
      }
      doc.save(filename);
      setDownloaded(true);
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolSection id="assign-cover-title" titleBn="অ্যাসাইনমেন্ট কভার জেনারেটর" titleEn="Assignment Cover Generator"
      descBn="অ্যাসাইনমেন্টের কভার পাতা বানিয়ে PDF হিসেবে ডাউনলোড করুন। সব কাজ আপনার ডিভাইসেই হয়।"
      descEn="Create an assignment cover page and download it as a PDF. Everything happens on your device.">
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="cover-student">{t({ bn: 'শিক্ষার্থীর নাম', en: 'Student name' })}</label>
          <input id="cover-student" style={inputStyle} type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Rahim Uddin" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="cover-id">{t({ bn: 'আইডি / রোল (ঐচ্ছিক)', en: 'ID / Roll (optional)' })}</label>
          <input id="cover-id" style={inputStyle} type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="2026-001" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="cover-course">{t({ bn: 'কোর্সের নাম', en: 'Course title' })}</label>
          <input id="cover-course" style={inputStyle} type="text" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} placeholder="English Literature" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="cover-title">{t({ bn: 'অ্যাসাইনমেন্টের শিরোনাম', en: 'Assignment title' })}</label>
          <input id="cover-title" style={inputStyle} type="text" value={assignmentTitle} onChange={(e) => setAssignmentTitle(e.target.value)} placeholder="Elizabethan Drama" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="cover-teacher">{t({ bn: 'শিক্ষকের নাম (ঐচ্ছিক)', en: 'Teacher name (optional)' })}</label>
          <input id="cover-teacher" style={inputStyle} type="text" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} placeholder="Mr. Karim" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="cover-inst">{t({ bn: 'প্রতিষ্ঠানের নাম', en: 'Institution name' })}</label>
          <input id="cover-inst" style={inputStyle} type="text" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Cox's Bazar City College" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="cover-date">{t({ bn: 'তারিখ', en: 'Date' })}</label>
          <input id="cover-date" style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <LoadExampleBtn onLoad={() => {
          setStudentName('Rahim Uddin'); setStudentId('2026-001'); setCourseTitle('English Literature');
          setAssignmentTitle('Elizabethan Drama'); setTeacherName('Mr. Karim'); setInstitution("Cox's Bazar City College");
        }} />
      </div>
      {ready ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: 'var(--heading)' }}>{t({ bn: 'প্রিভিউ', en: 'Preview' })}</p>
          <div style={{ border: '3px solid var(--teal-deep)', background: 'var(--surface)', borderRadius: 4, padding: '28px 20px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: 'var(--heading)', fontFamily: 'var(--font-head)' }}>{institution.trim()}</p>
            <p style={{ margin: '0 0 16px', fontSize: 16, color: 'var(--teal-deep)', fontWeight: 600 }}>{t({ bn: 'অ্যাসাইনমেন্ট কভার পাতা', en: 'Assignment Cover Page' })}</p>
            <p style={{ margin: '0 0 6px', fontSize: 15 }}><strong>{assignmentTitle.trim()}</strong></p>
            <p style={{ margin: '0 0 6px', fontSize: 14 }}>{courseTitle.trim()}</p>
            <p style={{ margin: '0 0 6px', fontSize: 14 }}>{studentName.trim()}{studentId.trim() ? ` (${studentId.trim()})` : ''}</p>
            {teacherName.trim() ? <p style={{ margin: '0 0 6px', fontSize: 14 }}>{teacherName.trim()}</p> : null}
            <p style={{ margin: 0, fontSize: 14 }}>{date}</p>
          </div>
          <p style={noteStyle}>{t({ bn: 'ফাইলের নাম: ', en: 'File name: ' })}{filename}</p>
          <PdfBanglaNote />
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <RewardedAdButton lang={lang} onFreeDownload={() => void handleDownload()} />
            <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 36, padding: '6px 12px', fontSize: 14 }}
              onClick={() => {
                const summary = `${assignmentTitle.trim()} — ${courseTitle.trim()} — ${studentName.trim()}, ${institution.trim()}, ${date}`;
                void navigator.clipboard.writeText(summary).then(() => setCopied(true), () => setCopied(false));
              }}>
              {copied ? t({ bn: 'কপি হয়েছে', en: 'Copied' }) : t({ bn: 'সারাংশ কপি করুন', en: 'Copy summary' })}
            </button>
          </div>
          {busy ? <p style={noteStyle} role="status">{t({ bn: 'পিডিএফ তৈরি হচ্ছে…', en: 'Making the PDF…' })}</p> : null}
          {downloaded ? <p style={noteStyle} role="status">{t({ bn: 'ডাউনলোড হয়েছে।', en: 'Downloaded.' })}</p> : null}
        </div>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'কভার দেখতে শিক্ষার্থীর নাম, কোর্স, অ্যাসাইনমেন্টের শিরোনাম, প্রতিষ্ঠান ও সঠিক তারিখ দিন।', en: 'Enter the student name, course, assignment title, institution and a valid date to see the cover.' })}</p>
      )}
      {error ? <p style={errorStyle} role="alert">{t({ bn: 'পিডিএফ বানানো যায়নি — আবার চেষ্টা করুন।', en: 'Could not make the PDF — please try again.' })}</p> : null}
    </ToolSection>
  );
}
