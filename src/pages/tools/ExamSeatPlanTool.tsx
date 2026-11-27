// Eduvelto — Exam Seat Plan Generator tool UI.
// Pure logic in src/lib/tools/examSeatPlan.ts. PDF via jspdf (dynamic
// import) through <RewardedAdButton>; the PDF is English/Latin only.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import RewardedAdButton from '../../components/RewardedAdButton';
import { generateSeatPlan, parseStudentNames } from '../../lib/tools/examSeatPlan';
import {
  CopyBtn, LoadExampleBtn, PdfBanglaNote, Tiles, ToolSection, errorStyle,
  gridStyle, inputStyle, labelStyle, noteStyle, resultStyle,
} from './eduToolUi';

const EXAMPLE_NAMES = 'Rahim\nKarim\nSalma\nTanvir\nNusrat\nHasan\nMim\nArif';

export function ExamSeatPlanTool() {
  const { t, lang } = useLanguage();
  const [text, setText] = useState('');
  const [rows, setRows] = useState('4');
  const [cols, setCols] = useState('5');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  const result = useMemo(() => {
    if (text.trim() === '') return null;
    try { return generateSeatPlan(parseStudentNames(text), Number(rows), Number(cols)); } catch { return null; }
  }, [text, rows, cols]);

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
      doc.text('Exam Seat Plan', 105, 18, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`${result.rows} rows x ${result.cols} columns, ${result.seats.length} students`, 105, 26, { align: 'center' });
      let y = 38;
      for (const seat of result.seats) {
        doc.text(`Seat ${seat.seatNo} (Row ${seat.row}, Col ${seat.col}): ${seat.student}`, 15, y);
        y += 7;
        if (y > 280) { doc.addPage(); y = 20; }
      }
      doc.save('exam-seat-plan.pdf');
      setDownloaded(true);
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolSection id="seat-plan-title" titleBn="পরীক্ষার আসন পরিকল্পনা" titleEn="Exam Seat Plan Generator"
      descBn="পরীক্ষার হলের আসন পরিকল্পনা বানিয়ে PDF হিসেবে সংরক্ষণ করুন। সব কাজ আপনার ডিভাইসেই হয়।"
      descEn="Generate an exam hall seating plan and save it as a PDF. Everything happens on your device.">
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="seat-names">{t({ bn: 'শিক্ষার্থীর নাম (প্রতি লাইনে একজন)', en: 'Student names (one per line)' })}</label>
          <textarea id="seat-names" style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} value={text}
            onChange={(e) => setText(e.target.value)} placeholder={EXAMPLE_NAMES} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="seat-rows">{t({ bn: 'সারি', en: 'Rows' })}</label>
          <input id="seat-rows" style={inputStyle} type="number" min="1" max="30" value={rows} onChange={(e) => setRows(e.target.value)} />
          <label style={{ ...labelStyle, marginTop: 12 }} htmlFor="seat-cols">{t({ bn: 'কলাম', en: 'Columns' })}</label>
          <input id="seat-cols" style={inputStyle} type="number" min="1" max="20" value={cols} onChange={(e) => setCols(e.target.value)} />
        </div>
      </div>
      <div style={{ marginTop: 12 }}><LoadExampleBtn onLoad={() => setText(EXAMPLE_NAMES)} /></div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}><strong>{t({ bn: 'আসন পরিকল্পনা তৈরি', en: 'Seat plan ready' })}</strong></p>
          <Tiles items={[
            { label: t({ bn: 'শিক্ষার্থী', en: 'Students' }), value: String(result.seats.length) },
            { label: t({ bn: 'ধারণক্ষমতা', en: 'Capacity' }), value: String(result.capacity) },
            { label: t({ bn: 'খালি আসন', en: 'Empty seats' }), value: String(result.emptySeats) },
          ]} />
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: `repeat(${result.cols}, 1fr)`, gap: 8 }}>
            {result.seats.map((seat) => (
              <div key={seat.seatNo} style={{ padding: '10px 8px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t({ bn: 'আসন', en: 'Seat' })} {seat.seatNo}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--heading)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{seat.student}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>R{seat.row} · C{seat.col}</div>
              </div>
            ))}
          </div>
          <PdfBanglaNote />
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <RewardedAdButton lang={lang} onFreeDownload={() => void handleDownload()} />
            <CopyBtn text={result.seats.map((s) => `Seat ${s.seatNo} (Row ${s.row}, Col ${s.col}): ${s.student}`).join('\n')} labelBn="পরিকল্পনা কপি করুন" labelEn="Copy plan" />
          </div>
          {busy ? <p style={noteStyle} role="status">{t({ bn: 'পিডিএফ তৈরি হচ্ছে…', en: 'Making the PDF…' })}</p> : null}
          {downloaded ? <p style={noteStyle} role="status">{t({ bn: 'ডাউনলোড হয়েছে।', en: 'Downloaded.' })}</p> : null}
        </div>
      ) : text.trim() !== '' ? (
        <p style={errorStyle} role="alert">{t({ bn: 'ঘরের ধারণক্ষমতা শিক্ষার্থীর সংখ্যার চেয়ে কম — সারি বা কলাম বাড়ান।', en: 'The room is too small for this many students — increase rows or columns.' })}</p>
      ) : null}
      {error ? <p style={errorStyle} role="alert">{t({ bn: 'পিডিএফ বানানো যায়নি — আবার চেষ্টা করুন।', en: 'Could not make the PDF — please try again.' })}</p> : null}
    </ToolSection>
  );
}
