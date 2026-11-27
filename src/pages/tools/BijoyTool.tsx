// Eduvelto — Bijoy <-> Unicode converter tool UIs (100-Tools Project, Phase 2, Wave 3).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure conversion lives in src/lib/tools/bijoy.ts: bijoyToUnicode /
// unicodeToBijoy (longest-match tokeniser + reorder pass). Both slugs
// share this one component; the two zero-prop wrappers below are what
// the registry takes (one per slug).

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { bijoyToUnicode, unicodeToBijoy } from '../../lib/tools/bijoy';

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 120,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 15,
  boxSizing: 'border-box',
  background: 'var(--surface)',
  color: 'var(--heading)',
  fontFamily: 'inherit',
  resize: 'vertical',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--heading)',
  marginBottom: 6,
};

const cardStyle: CSSProperties = {
  marginTop: 16,
  padding: '18px 16px',
};

const buttonStyle: CSSProperties = {
  minHeight: 44,
  padding: '10px 16px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 15,
  background: 'var(--surface)',
  color: 'var(--heading)',
  cursor: 'pointer',
};

const activeButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: 'var(--teal-soft)',
  fontWeight: 700,
};

const noteStyle: CSSProperties = {
  margin: '10px 0 0',
  fontSize: 13,
  color: 'var(--muted)',
};

export type BijoyDirection = 'toUnicode' | 'toBijoy';

export function BijoyTool({ initialDirection }: { initialDirection: BijoyDirection }) {
  const { t } = useLanguage();
  const [direction, setDirection] = useState<BijoyDirection>(initialDirection);
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    if (input === '') return '';
    try {
      return direction === 'toUnicode' ? bijoyToUnicode(input) : unicodeToBijoy(input);
    } catch {
      return '';
    }
  }, [input, direction]);

  const copyOutput = async () => {
    if (output === '') return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(output);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      setCopied(false);
    }
  };

  const toUnicode = direction === 'toUnicode';
  const inputLabel = toUnicode
    ? t({ bn: 'বিজয় লেখা', en: 'Bijoy text' })
    : t({ bn: 'ইউনিকোড লেখা', en: 'Unicode text' });
  const outputLabel = toUnicode
    ? t({ bn: 'ইউনিকোড লেখা', en: 'Unicode text' })
    : t({ bn: 'বিজয় লেখা', en: 'Bijoy text' });

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="bijoy-title">
      <h2 id="bijoy-title" style={{ fontSize: 19, color: 'var(--heading)', margin: '0 0 4px' }}>
        {t({ bn: 'বিজয় ↔ ইউনিকোড কনভার্টার', en: 'Bijoy ↔ Unicode Converter' })}
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 14px' }}>
        {t({
          bn: 'পুরনো বিজয় ফন্টের বাংলা লেখা ইউনিকোডে — বা ইউনিকোড বাংলা বিজয়ে — রূপান্তর করুন। সব কাজ আপনার ডিভাইসেই হয়।',
          en: 'Convert old Bijoy-font Bangla text to Unicode — or Unicode Bangla to Bijoy. Everything happens on your device.',
        })}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }} role="group" aria-label={t({ bn: 'রূপান্তরের দিক', en: 'Conversion direction' })}>
        <button
          type="button"
          style={toUnicode ? activeButtonStyle : buttonStyle}
          aria-pressed={toUnicode}
          onClick={() => setDirection('toUnicode')}
        >
          {t({ bn: 'বিজয় → ইউনিকোড', en: 'Bijoy → Unicode' })}
        </button>
        <button
          type="button"
          style={!toUnicode ? activeButtonStyle : buttonStyle}
          aria-pressed={!toUnicode}
          onClick={() => setDirection('toBijoy')}
        >
          {t({ bn: 'ইউনিকোড → বিজয়', en: 'Unicode → Bijoy' })}
        </button>
      </div>
      <div>
        <label style={labelStyle} htmlFor="bijoy-input">
          {inputLabel}
        </label>
        <textarea
          id="bijoy-input"
          style={inputStyle}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            toUnicode
              ? 'Avwg'
              : t({ bn: 'ইউনিকোড বাংলা লিখুন', en: 'Type Unicode Bangla' })
          }
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="bijoy-output">
          {outputLabel}
        </label>
        <textarea id="bijoy-output" style={inputStyle} value={output} readOnly aria-readonly="true" />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        <button type="button" style={buttonStyle} onClick={copyOutput} disabled={output === ''}>
          {copied
            ? t({ bn: 'কপি হয়েছে', en: 'Copied' })
            : t({ bn: 'ফল কপি করুন', en: 'Copy result' })}
        </button>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => {
            setInput('');
            setCopied(false);
          }}
          disabled={input === ''}
        >
          {t({ bn: 'মুছুন', en: 'Clear' })}
        </button>
      </div>
      <p style={noteStyle} role="status">
        {toUnicode
          ? t({
              bn: 'উদাহরণ: Avwg লিখলে আমি হবে।',
              en: 'Example: typing Avwg gives আমি.',
            })
          : t({
              bn: 'উদাহরণ: আমি লিখলে Avwg হবে।',
              en: 'Example: typing আমি gives Avwg.',
            })}
      </p>
    </section>
  );
}

/** Zero-prop wrapper for the `bijoy-to-unicode-converter` slug. */
export function BijoyToUnicodeTool() {
  return <BijoyTool initialDirection="toUnicode" />;
}

/** Zero-prop wrapper for the `unicode-to-bijoy-converter` slug. */
export function UnicodeToBijoyTool() {
  return <BijoyTool initialDirection="toBijoy" />;
}
