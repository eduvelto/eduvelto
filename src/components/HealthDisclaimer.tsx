import { strings } from '../i18n/strings';

// Eduvelto Health — shared safety components (Blueprint v4, binding).
//
// Two notes, always together, on EVERY health page:
//  1. HealthDisclaimer — "educational only, not medical advice — consult
//     a qualified doctor", shown at the top of every health page.
//  2. AccuracyNote — owner order 20 Nov 23:58, exact wording, rendered
//     directly UNDER each health content block (medicine info, disease
//     info, report explanations, AI Doctor answers) — never only in a
//     footer or on a separate disclaimer page.
// Neither note is a substitute for professional review: all health
// content is Draft / Under Review until a qualified professional
// reviews it (see lib/health.ts + firestore.rules).

const DISCLAIMER_STYLE: React.CSSProperties = {
  border: '1px solid #b00020',
  borderRadius: 8,
  padding: '14px 16px',
  background: '#fdf0f0',
  marginBottom: 20,
};

const ACCURACY_STYLE: React.CSSProperties = {
  borderLeft: '4px solid #F1B308',
  background: '#fff8e1',
  borderRadius: 4,
  padding: '10px 12px',
  marginTop: 10,
  fontSize: 14,
};

export function HealthDisclaimer() {
  const d = strings.health.disclaimer;
  const e = strings.health.emergency;
  return (
    <div style={DISCLAIMER_STYLE} role="note">
      <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#b00020' }}>{d.bn}</p>
      <p style={{ margin: '0 0 8px', color: '#555' }}>{d.en}</p>
      <p style={{ margin: 0 }}>
        <strong>{e.bn}</strong>
      </p>
      <p style={{ margin: '4px 0 0', color: '#555' }}>{e.en}</p>
    </div>
  );
}

export function AccuracyNote() {
  const a = strings.health.accuracyNote;
  return (
    <p style={ACCURACY_STYLE}>
      {a.bn}
      <br />
      <span style={{ color: '#555' }}>{a.en}</span>
    </p>
  );
}
