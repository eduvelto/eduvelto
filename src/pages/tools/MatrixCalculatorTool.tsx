// Eduvelto — Matrix Calculator tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: matrixAdd/Subtract/Multiply/Determinant/Inverse in src/lib/tools/mathTools.ts.
// 2x2 and 3x3 only — larger matrices are out of scope for this tool.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { matrixAdd, matrixSubtract, matrixMultiply, matrixDeterminant, matrixInverse, type Matrix } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8 };

function parseMatrix(text: string, size: 2 | 3): Matrix | null {
  const nums = text.split(/[\s,;]+/).filter((p) => p.length > 0).map(Number);
  if (nums.length !== size * size || nums.some((v) => !Number.isFinite(v))) return null;
  const m: Matrix = [];
  for (let i = 0; i < size; i++) m.push(nums.slice(i * size, (i + 1) * size));
  return m;
}

function formatMatrix(m: Matrix): string {
  return m.map((row) => `[${row.join(', ')}]`).join('\n');
}

type Op = 'add' | 'sub' | 'mul' | 'det' | 'inv';

export function MatrixCalculatorTool() {
  const { t } = useLanguage();
  const [size, setSize] = useState<2 | 3>(2);
  const [op, setOp] = useState<Op>('add');
  const [aText, setAText] = useState('1, 2\n3, 4');
  const [bText, setBText] = useState('5, 6\n7, 8');
  const a = useMemo(() => parseMatrix(aText, size), [aText, size]);
  const b = useMemo(() => parseMatrix(bText, size), [bText, size]);
  const result = useMemo((): Matrix | number | null => {
    if (!a) return null;
    if (op === 'det') return matrixDeterminant(a);
    if (op === 'inv') return matrixInverse(a);
    if (!b) return null;
    if (op === 'add') return matrixAdd(a, b);
    if (op === 'sub') return matrixSubtract(a, b);
    return matrixMultiply(a, b);
  }, [a, b, op]);
  const clear = () => { setAText(''); setBText(''); };
  const loadExample = () => {
    if (size === 2) { setAText('1, 2\n3, 4'); setBText('5, 6\n7, 8'); }
    else { setAText('1, 2, 3\n4, 5, 6\n7, 8, 9'); setBText('9, 8, 7\n6, 5, 4\n3, 2, 1'); }
  };
  const detA = useMemo(() => (a ? matrixDeterminant(a) : null), [a]);
  const tabStyle = (active: boolean): CSSProperties => ({ minHeight: 40, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line)', background: active ? 'var(--teal)' : 'var(--surface)', color: active ? '#fff' : 'var(--heading)', cursor: 'pointer', fontWeight: 600 });
  const opLabel = op === 'add' ? 'A + B' : op === 'sub' ? 'A − B' : op === 'mul' ? 'A × B' : op === 'det' ? 'det(A)' : 'A⁻¹';

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="ম্যাট্রিক্স ক্যালকুলেটর" titleEn="Matrix Calculator" descBn="২×২ ও ৩×৩ ম্যাট্রিক্স যোগ, বিয়োগ, গুণ করুন — নির্ণায়ক ও বিপরীত ম্যাট্রিক্সও বের করুন।" descEn="Add, subtract and multiply 2×2 and 3×3 matrices — with determinant and inverse too." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={tabStyle(size === 2)} onClick={() => setSize(2)}>2×2</button>
        <button type="button" style={tabStyle(size === 3)} onClick={() => setSize(3)}>3×3</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {(['add', 'sub', 'mul', 'det', 'inv'] as Op[]).map((o) => (
          <button key={o} type="button" style={tabStyle(op === o)} onClick={() => setOp(o)}>{o === 'add' ? 'A + B' : o === 'sub' ? 'A − B' : o === 'mul' ? 'A × B' : o === 'det' ? t({ bn: 'নির্ণায়ক', en: 'Determinant' }) : t({ bn: 'বিপরীত ম্যাট্রিক্স', en: 'Inverse' })}</button>
        ))}
      </div>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="matrix-a">{t({ bn: `ম্যাট্রিক্স A (${size}×${size}টি সংখ্যা)`, en: `Matrix A (${size}×${size} numbers)` })}</label>
          <textarea id="matrix-a" style={{ ...shortInputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'monospace' }} value={aText} onChange={(e) => setAText(e.target.value)} placeholder={size === 2 ? '1, 2\n3, 4' : '1, 2, 3\n4, 5, 6\n7, 8, 9'} />
        </div>
        {op === 'add' || op === 'sub' || op === 'mul' ? (
          <div>
            <label style={labelStyle} htmlFor="matrix-b">{t({ bn: `ম্যাট্রিক্স B (${size}×${size}টি সংখ্যা)`, en: `Matrix B (${size}×${size} numbers)` })}</label>
            <textarea id="matrix-b" style={{ ...shortInputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'monospace' }} value={bText} onChange={(e) => setBText(e.target.value)} placeholder={size === 2 ? '5, 6\n7, 8' : '9, 8, 7\n6, 5, 4\n3, 2, 1'} />
          </div>
        ) : null}
      </div>
      {result !== null ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: `ফলাফল (${opLabel})`, en: `Result (${opLabel})` })}</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'monospace', color: 'var(--teal-deep)', whiteSpace: 'pre-wrap' }}>{typeof result === 'number' ? `${result}` : formatMatrix(result)}</p>
          </div>
          <Tiles items={[
            { labelBn: 'A-এর নির্ণায়ক', labelEn: 'Determinant of A', value: detA === null ? '—' : `${detA}` },
          ]} />
          <ButtonRow><CopyButton text={typeof result === 'number' ? `${opLabel} = ${result}` : `${opLabel} =\n${formatMatrix(result)}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: op === 'inv' ? 'সঠিক ম্যাট্রিক্স দিন — নির্ণায়ক ০ হলে বিপরীত ম্যাট্রিক্স থাকে না।' : `প্রতিটি ম্যাট্রিক্সে ঠিক ${size * size}টি সংখ্যা দিন (কমা, স্পেস বা নতুন লাইন দিয়ে আলাদা করুন)।`, en: op === 'inv' ? 'Enter a valid matrix — a matrix with determinant 0 has no inverse.' : `Enter exactly ${size * size} numbers per matrix (separated by commas, spaces or new lines).` })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'শুধু ২×২ ও ৩×৩ ম্যাট্রিক্স সমর্থিত। বিপরীত ম্যাট্রিক্স তখনই থাকে যখন নির্ণায়ক ০ নয়।', en: 'Only 2×2 and 3×3 matrices are supported. An inverse exists only when the determinant is not 0.' })}</p>
    </section>
  );
}
