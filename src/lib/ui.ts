// Eduvelto design tokens — single source of truth for colours, radii,
// shadows and type scale (brand guide 20 Nov 2026, exact palette).
// Pages should use the components in components/ui.tsx; these tokens are
// for the few places that still need an inline style object.

export const colors = {
  navy: '#0A1F44',
  navyDark: '#041742',
  blue: '#1E7CE8',
  blueSoft: '#E8EFFA',
  blueSofter: '#EEF3FB',
  gold: '#F5A623',
  star: '#F1B308',
  goldSoft: '#FDF3D0',
  ink: '#1C2333',
  muted: '#5A6478',
  line: '#E3E8F0',
  lineStrong: '#C9D2E0',
  bg: '#F7F9FC',
  card: '#FFFFFF',
  error: '#B00020',
  errorBg: '#FDF0F0',
  // "Correct" feedback uses on-palette blue, never green (brand: no green).
  ok: '#1E7CE8',
  okBg: '#E8EFFA',
} as const;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const shadow = {
  sm: '0 1px 2px rgba(4,23,66,0.06), 0 1px 3px rgba(4,23,66,0.08)',
  md: '0 4px 12px rgba(4,23,66,0.10), 0 2px 4px rgba(4,23,66,0.08)',
} as const;

export const fontHead =
  "'Poppins', 'Hind Siliguri', system-ui, -apple-system, 'Segoe UI', sans-serif";
export const fontBody =
  "'Hind Siliguri', 'Noto Sans Bengali', system-ui, -apple-system, 'Segoe UI', sans-serif";

/** Muted secondary text, e.g. meta lines under a title. */
export const metaText: React.CSSProperties = {
  color: colors.muted,
  fontSize: 14,
  lineHeight: 1.55,
};

/** Small section heading used inside pages. */
export const sectionTitle: React.CSSProperties = {
  fontFamily: fontHead,
  fontSize: 19,
  color: colors.navy,
  margin: '24px 0 10px',
};

/** Full-width loading skeleton block. */
export const skeletonBlock: React.CSSProperties = {
  height: 18,
  marginBottom: 10,
};
