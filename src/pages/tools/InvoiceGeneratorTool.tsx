// Eduvelto — Invoice Generator tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Totals live in src/lib/tools/invoice.ts: subtotal = sum of
// quantity x unit price, tax = subtotal x tax% / 100, grand total =
// subtotal + tax. The tax percent is USER-ENTERED. PDF download
// loads jspdf with a dynamic import() only (never a static import).
//
// Design polish (batch 2): hero band, polished live preview (forest
// header bar, teal table header, highlighted grand-total row),
// headline grand total + tiles, copy-total button, a "Taka in
// words" line (BD invoices often need the amount in words), a
// one-tap example, and a formula with the user's own numbers.
// BDT-first throughout. Per-line VAT % and a watermark-free/ad
// PDF split were skipped — they need a product decision and a
// rework of the finished PDF flow (noted in the batch report).

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { calculateInvoice, lineTotal, type InvoiceItem } from '../../lib/tools/invoice';
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

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 12,
};

const cardStyle: CSSProperties = {
  marginTop: 16,
  padding: '18px 16px',
};

const heroStyle: CSSProperties = {
  background: 'linear-gradient(135deg, var(--forest), var(--teal-deep))',
  borderRadius: 12,
  padding: '20px 18px',
  marginBottom: 16,
  boxShadow: 'var(--shadow-md)',
};

const heroTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: 22,
  color: '#ffffff',
  margin: '0 0 6px',
};

const heroDescStyle: CSSProperties = {
  color: 'rgba(255, 255, 255, 0.88)',
  fontSize: 14,
  lineHeight: 1.6,
  margin: '0 0 12px',
};

const trustChipStyle: CSSProperties = {
  display: 'inline-block',
  fontSize: 12,
  fontWeight: 600,
  color: '#ffffff',
  background: 'rgba(255, 255, 255, 0.14)',
  border: '1px solid rgba(255, 255, 255, 0.45)',
  borderRadius: 999,
  padding: '4px 10px',
};

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};

const headlineStyle: CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: '2.5rem',
  lineHeight: 1.15,
  color: 'var(--teal-deep)',
  margin: '4px 0 0',
};

const headlineLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--muted)',
  margin: 0,
};

const tileGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: 10,
  marginTop: 14,
};

const tileStyle: CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--line)',
  borderRadius: 12,
  padding: '12px',
  boxShadow: 'var(--shadow-sm)',
};

const tileLabelStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--muted)',
  margin: '0 0 4px',
};

const tileValueStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--heading)',
  margin: 0,
};

const formulaStyle: CSSProperties = {
  margin: '12px 0 0',
  fontSize: 13,
  color: 'var(--muted)',
};

const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginTop: 14,
};

const previewStyle: CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--line)',
  borderRadius: 12,
  overflow: 'hidden',
  marginTop: 14,
  boxShadow: 'var(--shadow-sm)',
};

const previewHeaderStyle: CSSProperties = {
  background: 'linear-gradient(135deg, var(--forest), var(--teal-deep))',
  padding: '14px 16px',
  color: '#ffffff',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 14,
};

const headerCellStyle: CSSProperties = {
  background: 'var(--teal-soft)',
  color: 'var(--heading)',
  fontWeight: 700,
  padding: '8px',
  textAlign: 'left',
  borderBottom: '1px solid var(--line)',
};

const cellStyle: CSSProperties = {
  borderBottom: '1px solid var(--line)',
  padding: '8px',
  textAlign: 'left',
};

const totalRowStyle: CSSProperties = {
  background: 'var(--amber-soft)',
  fontWeight: 700,
};

function parseAmount(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function fmtMoney(n: number): string {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

// Taka in words (English words, lakh/crore grouping — the form BD
// invoices commonly use). No Number-to-Words tool page exists yet,
// so this small converter lives here.
const ONES = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function underThousand(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : ''));
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(' ');
}

function takaInWords(amount: number): string {
  const whole = Math.floor(amount);
  const paise = Math.round((amount - whole) * 100);
  const parts: string[] = [];
  const crore = Math.floor(whole / 10000000);
  const lakh = Math.floor((whole % 10000000) / 100000);
  const thousand = Math.floor((whole % 100000) / 1000);
  const rest = whole % 1000;
  if (crore > 0) parts.push(`${underThousand(crore)} crore`);
  if (lakh > 0) parts.push(`${underThousand(lakh)} lakh`);
  if (thousand > 0) parts.push(`${underThousand(thousand)} thousand`);
  if (rest > 0) parts.push(underThousand(rest));
  let words = parts.length > 0 ? parts.join(' ') : 'zero';
  words += ' taka';
  if (paise > 0) words += ` and ${underThousand(paise)} paise`;
  words += ' only';
  return words.charAt(0).toUpperCase() + words.slice(1);
}

interface ItemRow {
  description: string;
  qty: string;
  price: string;
}

const EMPTY_ROW: ItemRow = { description: '', qty: '', price: '' };

export function InvoiceGeneratorTool() {
  const { t, lang } = useLanguage();
  const [businessName, setBusinessName] = useState('');
  const [clientName, setClientName] = useState('');
  const [items, setItems] = useState<ItemRow[]>([{ ...EMPTY_ROW }]);
  const [taxPercent, setTaxPercent] = useState('0');
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [invoiceBlob, setInvoiceBlob] = useState<Blob | null>(null);
  const [copied, setCopied] = useState(false);

  const taxV = parseAmount(taxPercent);
  const parsedItems: (InvoiceItem | null)[] = items.map((row) => {
    const qty = parseAmount(row.qty);
    const price = parseAmount(row.price);
    if (qty === null || price === null) return null;
    return { description: row.description, quantity: qty, unitPrice: price };
  });
  const invalid =
    (taxV !== null && taxV < 0) ||
    (taxPercent.trim() !== '' && taxV === null) ||
    parsedItems.some(
      (item, i) =>
        (items[i].qty.trim() !== '' || items[i].price.trim() !== '') && item === null,
    ) ||
    parsedItems.some((item) => item !== null && (item.quantity < 0 || item.unitPrice < 0));
  const filledItems = parsedItems.filter((item): item is InvoiceItem => item !== null);
  const ready = taxV !== null && taxV >= 0 && filledItems.length > 0;

  const result = useMemo(() => {
    if (!ready) return null;
    try {
      return calculateInvoice({ items: filledItems, taxPercent: taxV as number });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, taxV, JSON.stringify(filledItems)]);

  function setItem(index: number, patch: Partial<ItemRow>): void {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function copyTotal(): Promise<void> {
    if (!result) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`৳${fmtMoney(result.grandTotal)}`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      setCopied(false);
    }
  }

  function loadExample(): void {
    setBusinessName('Eduvelto');
    setClientName('Rahim Uddin');
    setItems([{ description: 'English tuition', qty: '2', price: '500' }]);
    setTaxPercent('0');
  }

  function downloadInvoice(): void {
    if (!invoiceBlob) return;
    const url = URL.createObjectURL(invoiceBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice.pdf';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function downloadPdf(): Promise<void> {
    if (!result) return;
    setPdfError('');
    setInvoiceBlob(null);
    setPdfBusy(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      let y = 20;
      doc.setFontSize(16);
      doc.text(businessName.trim() || 'Invoice', 14, y);
      y += 10;
      doc.setFontSize(11);
      if (clientName.trim() !== '') {
        doc.text(`Bill to: ${clientName.trim()}`, 14, y);
        y += 8;
      }
      y += 4;
      filledItems.forEach((item, i) => {
        doc.text(
          `${item.description || `Item ${i + 1}`} — ${item.quantity} x ${fmtMoney(item.unitPrice)} = ${fmtMoney(result.lineTotals[i])}`,
          14,
          y,
        );
        y += 7;
      });
      y += 4;
      doc.text(`Subtotal: ${fmtMoney(result.subtotal)}`, 14, y);
      y += 7;
      doc.text(`Tax (${taxV ?? 0}%): ${fmtMoney(result.tax)}`, 14, y);
      y += 7;
      doc.text(`Grand total: ${fmtMoney(result.grandTotal)}`, 14, y);
      doc.text(takaInWords(result.grandTotal), 14, y + 7);
      setInvoiceBlob(doc.output('blob'));
    } catch {
      setPdfError(
        t({ bn: 'পিডিএফ তৈরি করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not create the PDF — please try again.' }),
      );
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="invoice-title">
      <div style={heroStyle}>
        <h2 id="invoice-title" style={heroTitleStyle}>
          {t({ bn: 'ইনভয়েস তৈরি করুন', en: 'Invoice Generator' })}
        </h2>
        <p style={heroDescStyle}>
          {t({
            bn: 'প্রতিষ্ঠান ও গ্রাহকের নাম, আইটেমগুলো আর করের হার দিন — মোট হিসাব ও ইনভয়েসের নমুনা দেখাবে, চাইলে পিডিএফ নামাতে পারবেন। সব হিসাব আপনার ডিভাইসেই হয়।',
            en: 'Enter your business and client names, the line items and the tax rate — see the totals and an invoice preview, and download a PDF if you like. Everything is computed on your device.',
          })}
        </p>
        <span style={trustChipStyle}>
          {t({ bn: 'টাকায় (৳) প্রথম • ১০০% ব্রাউজারে', en: 'BDT-first (৳) • 100% in-browser' })}
        </span>
      </div>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="invoice-business">
            {t({ bn: 'প্রতিষ্ঠানের নাম', en: 'Business name' })}
          </label>
          <input
            id="invoice-business"
            style={inputStyle}
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Eduvelto"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="invoice-client">
            {t({ bn: 'গ্রাহকের নাম', en: 'Client name' })}
          </label>
          <input
            id="invoice-client"
            style={inputStyle}
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Rahim Uddin"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="invoice-tax">
            {t({ bn: 'কর / ভ্যাট (%)', en: 'Tax / VAT (%)' })}
          </label>
          <input
            id="invoice-tax"
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={taxPercent}
            onChange={(e) => setTaxPercent(e.target.value)}
          />
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        {items.map((row, i) => (
          <div key={i} style={{ ...gridStyle, marginTop: i === 0 ? 0 : 8 }}>
            <div>
              <label style={labelStyle} htmlFor={`invoice-item-desc-${i}`}>
                {t({ bn: 'আইটেমের বিবরণ', en: 'Item description' })}
              </label>
              <input
                id={`invoice-item-desc-${i}`}
                style={inputStyle}
                type="text"
                value={row.description}
                onChange={(e) => setItem(i, { description: e.target.value })}
                placeholder={t({ bn: 'যেমন: টিউশন ফি', en: 'e.g. Tuition fee' })}
              />
            </div>
            <div>
              <label style={labelStyle} htmlFor={`invoice-item-qty-${i}`}>
                {t({ bn: 'পরিমাণ', en: 'Quantity' })}
              </label>
              <input
                id={`invoice-item-qty-${i}`}
                style={inputStyle}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={row.qty}
                onChange={(e) => setItem(i, { qty: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle} htmlFor={`invoice-item-price-${i}`}>
                {t({ bn: 'একক দাম', en: 'Unit price' })}
              </label>
              <input
                id={`invoice-item-price-${i}`}
                style={inputStyle}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={row.price}
                onChange={(e) => setItem(i, { price: e.target.value })}
              />
            </div>
          </div>
        ))}
        <div style={buttonRowStyle}>
          <button
            type="button"
            className="ev-btn"
            onClick={() => setItems((prev) => [...prev, { ...EMPTY_ROW }])}
          >
            {t({ bn: 'আরেকটি আইটেম যোগ করুন', en: 'Add another item' })}
          </button>
          <button type="button" className="ev-btn-outline" onClick={loadExample}>
            {t({ bn: 'উদাহরণ বসান', en: 'Load example' })}
          </button>
        </div>
      </div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'সর্বমোট', en: 'Grand total' })}</p>
          <p style={headlineStyle}>৳{fmtMoney(result.grandTotal)}</p>
          <div style={buttonRowStyle}>
            <button type="button" className="ev-btn-outline" onClick={() => void copyTotal()}>
              {copied
                ? t({ bn: 'কপি হয়েছে', en: 'Copied' })
                : t({ bn: 'মোট কপি করুন', en: 'Copy total' })}
            </button>
            <button type="button" className="ev-btn" onClick={downloadPdf} disabled={pdfBusy}>
              {pdfBusy
                ? t({ bn: 'তৈরি হচ্ছে…', en: 'Creating…' })
                : t({ bn: 'PDF তৈরি করুন', en: 'Create PDF' })}
            </button>
          </div>
          {invoiceBlob ? (
            <div style={{ marginTop: 12 }}>
              {/* Ads rollout B2 (27 Nov 2026): this download goes through RewardedAdButton — Free Download is live, the 30s Unlock stays disabled until AdSense approval (never a fake timer). */}
              <RewardedAdButton lang={lang} onFreeDownload={downloadInvoice} />
            </div>
          ) : null}
          {pdfError ? (
            <p style={errorStyle} role="alert">
              {pdfError}
            </p>
          ) : null}
          <div style={tileGridStyle}>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'উপমোট', en: 'Subtotal' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(result.subtotal)}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'কর', en: 'Tax' })}</p>
              <p style={tileValueStyle}>৳{fmtMoney(result.tax)}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'আইটেম', en: 'Items' })}</p>
              <p style={tileValueStyle}>{filledItems.length}</p>
            </div>
          </div>
          <p style={{ fontSize: 15, margin: '14px 0 0', fontStyle: 'italic' }}>
            {t({ bn: 'কথায়: ', en: 'In words: ' })}
            {takaInWords(result.grandTotal)}
          </p>
          <div style={previewStyle}>
            <div style={previewHeaderStyle}>
              <p style={{ fontFamily: 'var(--font-head)', fontSize: 20, margin: '0 0 2px' }}>
                {businessName.trim() || t({ bn: 'ইনভয়েস', en: 'Invoice' })}
              </p>
              {clientName.trim() !== '' ? (
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                  {t({ bn: 'গ্রাহক: ', en: 'Bill to: ' })}
                  {clientName.trim()}
                </p>
              ) : null}
            </div>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={headerCellStyle}>{t({ bn: 'আইটেম', en: 'Item' })}</th>
                  <th style={headerCellStyle}>{t({ bn: 'পরিমাণ', en: 'Qty' })}</th>
                  <th style={headerCellStyle}>{t({ bn: 'একক দাম', en: 'Unit price' })}</th>
                  <th style={headerCellStyle}>{t({ bn: 'মোট', en: 'Total' })}</th>
                </tr>
              </thead>
              <tbody>
                {filledItems.map((item, i) => (
                  <tr key={i}>
                    <td style={cellStyle}>{item.description || `Item ${i + 1}`}</td>
                    <td style={cellStyle}>{item.quantity}</td>
                    <td style={cellStyle}>৳{fmtMoney(item.unitPrice)}</td>
                    <td style={cellStyle}>৳{fmtMoney(lineTotal(item))}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ ...cellStyle, ...totalRowStyle }} colSpan={3}>
                    {t({ bn: 'সর্বমোট', en: 'Grand total' })}
                  </td>
                  <td style={{ ...cellStyle, ...totalRowStyle }}>৳{fmtMoney(result.grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: উপমোট = ৳${fmtMoney(result.subtotal)}; কর = ৳${fmtMoney(result.subtotal)} × ${taxV ?? 0}% ÷ ১০০ = ৳${fmtMoney(result.tax)}; সর্বমোট = ৳${fmtMoney(result.subtotal)} + ৳${fmtMoney(result.tax)}।`,
              en: `Formula: subtotal = ৳${fmtMoney(result.subtotal)}; tax = ৳${fmtMoney(result.subtotal)} × ${taxV ?? 0}% ÷ 100 = ৳${fmtMoney(result.tax)}; grand total = ৳${fmtMoney(result.subtotal)} + ৳${fmtMoney(result.tax)}.`,
            })}
          </p>
        </div>
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'সঠিক মান দিন — পরিমাণ, দাম ও করের হার ঋণাত্মক হতে পারবে না।',
            en: 'Enter valid values — quantity, price and tax rate cannot be negative.',
          })}
        </p>
      ) : (
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: '14px 0 0' }}>
          {t({
            bn: 'মোট দেখতে অন্তত একটি আইটেমের পরিমাণ ও দাম দিন।',
            en: 'Enter a quantity and price for at least one item to see the totals.',
          })}
        </p>
      )}
    </section>
  );
}
