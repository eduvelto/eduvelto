// Eduvelto — Admit Card Checklist tool UI.
// Pure logic in src/lib/tools/admitCardChecklist.ts.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ADMIT_CARD_ITEMS, checklistProgress } from '../../lib/tools/admitCardChecklist';
import {
  CopyBtn, Tiles, ToolSection, inputStyle, noteStyle, resultStyle,
} from './eduToolUi';

export function AdmitCardChecklistTool() {
  const { t } = useLanguage();
  const [checked, setChecked] = useState<string[]>([]);
  const [extra, setExtra] = useState<{ id: string; bn: string; en: string; category: string }[]>([]);
  const [newItem, setNewItem] = useState('');

  const items = useMemo(() => [...ADMIT_CARD_ITEMS, ...extra], [extra]);
  const progress = checklistProgress(checked, items);

  const toggle = (id: string) =>
    setChecked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const remaining = items.filter((i) => !checked.includes(i.id));
  const copyText = remaining.length === 0
    ? t({ bn: 'সব প্রস্তুত!', en: 'All ready!' })
    : t({ bn: 'বাকি আছে:\n', en: 'Still to pack:\n' }) + remaining.map((i) => `• ${t({ bn: i.bn, en: i.en })}`).join('\n');

  return (
    <ToolSection id="admit-checklist-title" titleBn="প্রবেশপত্র চেকলিস্ট" titleEn="Admit Card Checklist"
      descBn="পরীক্ষার দিনের জন্য প্রয়োজনীয় জিনিসের চেকলিস্ট বানান। সব কাজ আপনার ডিভাইসেই হয়।"
      descEn="Make a checklist of everything needed on exam day. Everything happens on your device.">
      <Tiles items={[
        { label: t({ bn: 'প্রস্তুত', en: 'Packed' }), value: `${progress.done} / ${progress.total}` },
        { label: t({ bn: 'অগ্রগতি', en: 'Progress' }), value: `${progress.percent}%` },
        { label: t({ bn: 'বাকি', en: 'Remaining' }), value: String(progress.total - progress.done) },
      ]} />
      <div style={{ marginTop: 14, height: 12, borderRadius: 999, background: 'var(--line)', overflow: 'hidden' }}>
        <div style={{ width: `${progress.percent}%`, height: '100%', background: 'var(--teal-deep)', transition: 'width 0.2s' }} />
      </div>
      {progress.allDone ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: 0, fontSize: 16 }}><strong>{t({ bn: 'সব প্রস্তুত — শুভকামনা!', en: 'All packed — good luck!' })}</strong></p>
        </div>
      ) : null}
      <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
        {items.map((item) => (
          <label key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', cursor: 'pointer' }}>
            <input type="checkbox" checked={checked.includes(item.id)} onChange={() => toggle(item.id)} style={{ width: 20, height: 20 }} />
            <span style={{ fontSize: 15, textDecoration: checked.includes(item.id) ? 'line-through' : 'none', color: checked.includes(item.id) ? 'var(--muted)' : 'var(--heading)' }}>
              {t({ bn: item.bn, en: item.en })}
            </span>
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input style={{ ...inputStyle, flex: 1 }} type="text" value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={t({ bn: 'নিজের জিনিস যোগ করুন', en: 'Add your own item' })} />
        <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 44 }}
          onClick={() => {
            const v = newItem.trim();
            if (!v) return;
            setExtra((prev) => [...prev, { id: `custom-${Date.now()}`, bn: v, en: v, category: 'custom' }]);
            setNewItem('');
          }}>
          {t({ bn: 'যোগ করুন', en: 'Add' })}
        </button>
      </div>
      <div style={{ marginTop: 12 }}><CopyBtn text={copyText} labelBn="বাকিগুলো কপি করুন" labelEn="Copy remaining" /></div>
      <p style={noteStyle}>{t({ bn: 'পরীক্ষার আগের রাতে ব্যাগ গুছিয়ে রাখুন।', en: 'Pack your bag the night before the exam.' })}</p>
    </ToolSection>
  );
}
