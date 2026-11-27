// Eduvelto — Profit Margin Calculator tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: calculateProfit() + reverse helpers in src/lib/tools/discountVatProfit.ts. 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {ToolHero, Tiles, CopyButton, ButtonRow, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { calculateProfit, sellingPriceForMargin, costForMargin } from '../../lib/tools/discountVatProfit';

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};

const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const fmtMoney = (n: number): string => `৳${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;


type Mode = 'cost-selling' | 'cost-margin' | 'selling-margin';

export function ProfitMarginTool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>('cost-selling');
  const [cost, setCost] = useState('800');
  const [selling, setSelling] = useState('1000');
  const [margin, setMargin] = useState('20');
  const costV = parseNum(cost);
  const sellingV = parseNum(selling);
  const marginV = parseNum(margin);

  const forward = useMemo(() => {
    if (costV === null || sellingV === null) return null;
    try { return calculateProfit({ costPrice: costV, sellingPrice: sellingV }); } catch { return null; }
  }, [costV, sellingV]);
  const sellingFromMargin = useMemo(() => {
    if (costV === null || marginV === null) return null;
    try { return sellingPriceForMargin(costV, marginV); } catch { return null; }
  }, [costV, marginV]);
  const costFromMargin = useMemo(() => {
    if (sellingV === null || marginV === null) return null;
    try { return costForMargin(sellingV, marginV); } catch { return null; }
  }, [sellingV, marginV]);

  const tabStyle = (active: boolean): CSSProperties => ({
    minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)',
    background: active ? 'var(--teal)' : 'var(--surface)', color: active ? '#fff' : 'var(--heading)', cursor: 'pointer', fontWeight: 600,
  });

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="লাভের মার্জিন ক্যালকুলেটর" titleEn="Profit Margin Calculator" descBn="ক্রয়মূল্য ও বিক্রয়মূল্য থেকে লাভ, মার্জিন ও মার্কআপ বের করুন — উল্টো হিসাবও আছে।" descEn="Find profit, margin and markup from cost and selling price — with reverse modes too." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={tabStyle(mode === 'cost-selling')} onClick={() => setMode('cost-selling')}>{t({ bn: 'ক্রয় + বিক্রয়', en: 'Cost + selling' })}</button>
        <button type="button" style={tabStyle(mode === 'cost-margin')} onClick={() => setMode('cost-margin')}>{t({ bn: 'ক্রয় + মার্জিন%', en: 'Cost + margin%' })}</button>
        <button type="button" style={tabStyle(mode === 'selling-margin')} onClick={() => setMode('selling-margin')}>{t({ bn: 'বিক্রয় + মার্জিন%', en: 'Selling + margin%' })}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {mode !== 'selling-margin' ? (
          <div>
            <label style={labelStyle} htmlFor="pm-cost">{t({ bn: 'ক্রয়মূল্য (টাকা)', en: 'Cost price (taka)' })}</label>
            <input id="pm-cost" style={inputStyle} type="number" min="0" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="800" />
          </div>
        ) : null}
        {mode !== 'cost-margin' ? (
          <div>
            <label style={labelStyle} htmlFor="pm-selling">{t({ bn: 'বিক্রয়মূল্য (টাকা)', en: 'Selling price (taka)' })}</label>
            <input id="pm-selling" style={inputStyle} type="number" min="0" inputMode="decimal" value={selling} onChange={(e) => setSelling(e.target.value)} placeholder="1000" />
          </div>
        ) : null}
        {mode !== 'cost-selling' ? (
          <div>
            <label style={labelStyle} htmlFor="pm-margin">{t({ bn: 'মার্জিন (%)', en: 'Margin (%)' })}</label>
            <input id="pm-margin" style={inputStyle} type="number" min="0" max="99.99" step="0.1" inputMode="decimal" value={margin} onChange={(e) => setMargin(e.target.value)} placeholder="20" />
          </div>
        ) : null}
      </div>
      {mode === 'cost-selling' && forward ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'লাভ', en: 'Profit' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{fmtMoney(forward.profit)}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `সূত্র: লাভ = বিক্রয় − ক্রয় = ${sellingV} − ${costV}`, en: `Formula: profit = selling − cost = ${sellingV} − ${costV}` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'মার্জিন (বিক্রয়ের %)', labelEn: 'Margin (% of selling)', value: `${forward.profitMarginPercent}%` },
            { labelBn: 'মার্কআপ (ক্রয়ের %)', labelEn: 'Markup (% of cost)', value: forward.markupPercent === null ? '—' : `${forward.markupPercent}%` },
          ]} />
          <ButtonRow><CopyButton text={`Profit ${fmtMoney(forward.profit)}, margin ${forward.profitMarginPercent}%, markup ${forward.markupPercent ?? '—'}%`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /></ButtonRow>
        </>
      ) : null}
      {mode === 'cost-margin' && sellingFromMargin !== null ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'বিক্রয়মূল্য হতে হবে', en: 'Selling price should be' })}</p>
          <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{fmtMoney(sellingFromMargin)}</p>
          <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `সূত্র: বিক্রয় = ক্রয় ÷ (১ − মার্জিন%) = ${costV} ÷ (১ − ${marginV}%)`, en: `Formula: selling = cost ÷ (1 − margin%) = ${costV} ÷ (1 − ${marginV}%)` })}</p>
        </div>
      ) : null}
      {mode === 'selling-margin' && costFromMargin !== null ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'ক্রয়মূল্য হতে হবে', en: 'Cost price should be' })}</p>
          <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{fmtMoney(costFromMargin)}</p>
          <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `সূত্র: ক্রয় = বিক্রয় × (১ − মার্জিন%) = ${sellingV} × (১ − ${marginV}%)`, en: `Formula: cost = selling × (1 − margin%) = ${sellingV} × (1 − ${marginV}%)` })}</p>
        </div>
      ) : null}
      {(mode === 'cost-selling' && !forward) || (mode === 'cost-margin' && sellingFromMargin === null) || (mode === 'selling-margin' && costFromMargin === null) ? (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক মান দিন — ক্রয়মূল্য ০ হতে পারবে না, মার্জিন ০–১০০%-এর মধ্যে (১০০% নয়)।', en: 'Enter valid values — cost cannot be 0, margin must be 0–100% (not 100%).' })}</p>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'মার্জিন বিক্রয়মূল্যের শতাংশ, মার্কআপ ক্রয়মূল্যের শতাংশ — দুটি এক নয়। ভ্যাট ১৫% এখানে শুধু উদাহরণ; পণ্যভেদে ভ্যাটের হার আলাদা হয়।', en: 'Margin is a share of the selling price, markup a share of the cost price — they are not the same. The 15% VAT figure is an example only; VAT rates differ by item.' })}</p>
    </section>
  );
}
