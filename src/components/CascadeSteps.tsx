import { useLanguage } from '../i18n/LanguageContext';

export type CascadeStepState = 'done' | 'active' | 'disabled';

export interface CascadeStep {
  labelBn: string;
  labelEn: string;
  state: CascadeStepState;
}

/**
 * Cascade step-bar (U-1): shows the 5 cascade steps (3 for Madrasa/Technical,
 * where steps 3–4 collapse — the caller passes only the visible steps).
 *  - done: a step with a selection (green check).
 *  - active: the next step the user should pick (forest-navy outline).
 *  - disabled: a later step, not reachable yet (grey).
 * Steps are numbered by VISIBLE position (1, 2, 3 for Madrasa/Technical),
 * not by absolute cascade number.
 * One language only (useLanguage); horizontally scrollable on mobile.
 */
export function CascadeSteps(props: { steps: CascadeStep[] }) {
  const { lang } = useLanguage();
  return (
    <ol className="ev-cascade-steps" aria-label={lang === 'bn' ? 'ধাপ' : 'Steps'}>
      {props.steps.map((s, i) => (
        <li key={`${i}-${s.labelEn}`} className={`ev-cascade-step ev-cascade-step--${s.state}`}>
          <span className="ev-cascade-step__num" aria-hidden="true">
            {s.state === 'done' ? '✓' : i + 1}
          </span>
          <span className="ev-cascade-step__label">{lang === 'bn' ? s.labelBn : s.labelEn}</span>
          {i < props.steps.length - 1 ? (
            <span className="ev-cascade-step__sep" aria-hidden="true">
              ›
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
