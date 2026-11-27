// Eduvelto — Application Fee Calculator tool UI.
// Pure logic in src/lib/tools/applicationFee.ts. VAT default 15%
// (standard Bangladesh rate) — editable.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { DEFAULT_VAT_RATE, calculateApplicationFee } from '../../lib/tools/applicationFee';
import {
  CopyBtn, LoadExampleBtn, Tiles, ToolSection, errorStyle, formulaStyle,
  gridStyle, inputStyle, labelStyle, noteStyle, resultStyle,
} from './eduToolUi';

export function ApplicationFeeTool() {
  const { t } = useLanguage();
  const [fee, setFee] = useState('');
  const [copies, setCopies] = useState('1');
  const [vat, setVat] = useState(String(DEFAULT_VAT_RATE));
  const [charge, setCharge] = useState('0');

  const result = useMemo(() => {
    if (fee === '') return null;
    try {
      return calculateApplicationFee({
        feePerApplication: Number(fee),
        copies: Number(copies),
        vatRate: Number(vat),
        serviceCharge: Number(charge),
      });
    } catch { return null; }
  }, [fee, copies, vat, charge]);

  return (
    <ToolSection id="app-fee-title" titleBn="আবেদন ফি ক্যালকুলেটর" titleEn="Application Fee Calculator"
      descBn="চাকরির আবেদনের ফি ও ভ্যাটসহ মোট খরচ হিসাব করুন। সব হিসাব আপনার ডিভাইসেই হয়।"
      descEn="Work out the total cost of a job application fee including VAT. Everything is computed on your device.">
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="fee-amount">{t({ bn: 'আবেদন ফি (৳)', en: 'Application fee (৳)' })}</label>
          <input id="fee-amount" style={inputStyle} type="number" min="0" step="1" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="500" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="fee-copies">{t({ bn: 'আবেদনের সংখ্যা', en: 'Number of applications' })}</label>
          <input id="fee-copies" style={inputStyle} type="number" min="1" step="1" value={copies} onChange={(e) => setCopies(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="fee-vat">{t({ bn: 'ভ্যাট (%)', en: 'VAT (%)' })}</label>
          <input id="fee-vat" style={inputStyle} type="number" min="0" max="100" step="0.5" value={vat} onChange={(e) => setVat(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="fee-charge">{t({ bn: 'সার্ভিস চার্জ (৳)', en: 'Service charge (৳)' })}</label>
          <input id="fee-charge" style={inputStyle} type="number" min="0" step="1" value={charge} onChange={(e) => setCharge(e.target.value)} />
        </div>
      </div>
      <div style={{ marginTop: 12 }}><LoadExampleBtn onLoad={() => { setFee('500'); setCopies('2'); setVat('15'); setCharge('50'); }} /></div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}><strong>{t({ bn: 'মোট খরচ: ', en: 'Total cost: ' })}৳{result.grandTotal.toFixed(2)}</strong></p>
          <Tiles items={[
            { label: t({ bn: 'মূল ফি', en: 'Base fee' }), value: `৳${result.baseTotal.toFixed(2)}` },
            { label: t({ bn: 'ভ্যাট', en: 'VAT' }), value: `৳${result.vat.toFixed(2)}` },
            { label: t({ bn: 'সার্ভিস চার্জ', en: 'Service charge' }), value: `৳${result.serviceCharge.toFixed(2)}` },
            { label: t({ bn: 'মোট', en: 'Total' }), value: `৳${result.grandTotal.toFixed(2)}` },
          ]} />
          <p style={formulaStyle}>{t({ bn: `সূত্র: (${fee} × ${copies}) + ভ্যাট ${vat}% + চার্জ ${charge} = ৳${result.grandTotal.toFixed(2)}`, en: `Formula: (${fee} × ${copies}) + VAT ${vat}% + charge ${charge} = ৳${result.grandTotal.toFixed(2)}` })}</p>
          <p style={noteStyle}>{t({ bn: 'ভ্যাট ১৫% বাংলাদেশের সাধারণ হার — বিজ্ঞপ্তি অনুযায়ী বদলে নিন।', en: 'VAT 15% is the standard Bangladesh rate — change it to match the circular.' })}</p>
          <div style={{ marginTop: 12 }}>
            <CopyBtn text={`Application fee total: ৳${result.grandTotal.toFixed(2)} (base ৳${result.baseTotal.toFixed(2)} + VAT ৳${result.vat.toFixed(2)} + charge ৳${result.serviceCharge.toFixed(2)})`} labelBn="ফল কপি করুন" labelEn="Copy result" />
          </div>
        </div>
      ) : fee !== '' ? (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক সংখ্যা দিন।', en: 'Enter valid numbers.' })}</p>
      ) : null}
    </ToolSection>
  );
}
