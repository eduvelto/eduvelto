// Shared pieces for the CEO Panel — stat tiles, section rows and the
// honest empty state. Every tile shows a REAL value or an honest
// "not available yet" note; mockup numbers are never hard-coded here.

import type { ReactNode } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export function CeoStatTile(props: {
  icon: ReactNode;
  iconBg: string;
  value: string;
  labelBn: string;
  labelEn: string;
  subBn?: string;
  subEn?: string;
}) {
  const { lang } = useLanguage();
  return (
    <div className="ev-ceo-stat">
      <div className="ev-ceo-stat-icon" style={{ background: props.iconBg }} aria-hidden="true">
        {props.icon}
      </div>
      <div className="ev-ceo-stat-value">{props.value}</div>
      <div className="ev-ceo-stat-label">{lang === 'bn' ? props.labelBn : props.labelEn}</div>
      {props.subBn ? (
        <div className="ev-ceo-stat-sub">{lang === 'bn' ? props.subBn : props.subEn}</div>
      ) : null}
    </div>
  );
}

export function CeoSectionHead(props: { bn: string; en: string; action?: ReactNode }) {
  const { lang } = useLanguage();
  return (
    <div className="ev-ceo-section-head">
      <h2>{lang === 'bn' ? props.bn : props.en}</h2>
      {props.action ?? null}
    </div>
  );
}

/** Honest empty state — used wherever the mockup shows data that does not exist yet. */
export function CeoEmpty(props: { bn: string; en: string; nextBn?: string; nextEn?: string }) {
  const { lang, t } = useLanguage();
  return (
    <div className="ev-ceo-empty">
      <p style={{ margin: 0, fontWeight: 600, color: '#142B3B' }}>
        {lang === 'bn' ? props.bn : props.en}
      </p>
      {props.nextBn ? (
        <p style={{ margin: '8px 0 0', color: '#68747B', fontSize: 14 }}>
          {t({ bn: 'পরবর্তী পদক্ষেপ: ', en: 'Next step: ' })}
          {lang === 'bn' ? props.nextBn : props.nextEn}
        </p>
      ) : null}
    </div>
  );
}

/** "Coming soon" pill for rows/buttons whose feature is not built yet. */
export function CeoSoonPill() {
  const { t } = useLanguage();
  return (
    <span className="ev-ceo-soon">
      {t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}
    </span>
  );
}

export const CEO_ICON = {
  width: 26,
  height: 26,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;
