// Eduvelto — tool icons (27 Nov 2026, owner request).
//
// Every tool card shows a 3D-style picture tile that matches what the
// tool DOES — never a letter tile. There is no icon library in the
// project (no lucide-react), so the glyphs below are hand-written
// inline SVGs: 24x24, stroke-based, white on a gradient tile.
//
// The set is deliberately small and curated: ~100 simple glyphs shared
// by the 141 tools (about 1.4 tools per glyph). Tools that do the same
// thing share a glyph (all format converters share `convert`, all
// calculators that show a scale share `scale`), while tools whose
// function is visibly different get their own (merge / split /
// compress / convert each have a distinct PDF glyph). A tool never
// falls back to a letter: `toolIconFor` always returns a real glyph —
// the explicit per-slug map first, then the category fallback.
//
// Tile look: gradient (forest/teal/amber, cycling by slug hash) +
// soft drop shadow + a top inner highlight, so the tile reads as a
// raised 3D tile rather than a flat square. Palette only — no new
// colours. Glyphs use stroke="currentColor" on a white tile, so they
// stay readable in both themes.

import type { CSSProperties, ReactNode } from 'react';
import type { ToolCategory } from '../lib/toolsMeta';

// ---------------------------------------------------------------------------
// Glyphs. Each entry is the inner content of a 24x24 SVG
// (fill="none" stroke="currentColor" strokeWidth="1.8"
// strokeLinecap="round" strokeLinejoin="round"). Elements that must
// be solid set fill="currentColor" stroke="none" themselves.
// ---------------------------------------------------------------------------
const ICON_PATHS = {
  // ---- Documents / PDF ----
  doc: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6M9 17h6" />
    </>
  ),
  docMerge: (
    <>
      <path d="M3 4h7v15H3z" />
      <path d="M14 5h7v15h-7z" />
      <path d="M10 11.5h4" />
    </>
  ),
  docSplit: (
    <>
      <path d="M6 2h12v20H6z" />
      <path d="M12 2v20" strokeDasharray="3 2.5" />
    </>
  ),
  docCompress: (
    <>
      <path d="M6 2h9l5 5v15H6z" />
      <path d="M15 2v5h5" />
      <path d="M12 11v6M9.5 14.5L12 17l2.5-2.5" />
    </>
  ),
  docImage: (
    <>
      <path d="M6 2h9l5 5v15H6z" />
      <path d="M15 2v5h5" />
      <circle cx="10" cy="11" r="1.3" />
      <path d="M8 18l3-3 2.5 2.5L16 15l2 2" />
    </>
  ),
  imageDoc: (
    <>
      <rect x="3" y="4" width="13" height="16" rx="1.5" />
      <circle cx="8" cy="9" r="1.5" />
      <path d="M4 17l3.5-3.5 2.5 2.5 2-2 2.5 2.5" />
      <path d="M18.5 8h3M18.5 12h3" />
    </>
  ),
  reorder: (
    <>
      <path d="M4 7h10M4 12h10M4 17h10" />
      <path d="M17 5l2 2-2 2M17 15l2 2-2 2" />
    </>
  ),
  docLock: (
    <>
      <path d="M6 2h9l5 5v15H6z" />
      <path d="M15 2v5h5" />
      <rect x="9" y="13" width="6" height="5" rx="1" />
      <path d="M10.5 13v-1.5a1.5 1.5 0 0 1 3 0V13" />
    </>
  ),
  docDrop: (
    <>
      <path d="M6 2h9l5 5v15H6z" />
      <path d="M15 2v5h5" />
      <path d="M12 12.5c1.2 1.4 2.2 2.5 2.2 3.7a2.2 2.2 0 1 1-4.4 0c0-1.2 1-2.3 2.2-3.7z" />
    </>
  ),
  docX: (
    <>
      <path d="M6 2h9l5 5v15H6z" />
      <path d="M15 2v5h5" />
      <path d="M10 13l4 4M14 13l-4 4" />
    </>
  ),
  // ---- Images ----
  imageCompress: (
    <>
      <rect x="3" y="3" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="8" r="1.5" />
      <path d="M21 13l-5-5L5 15" />
      <path d="M12 19.5v3M9.5 21L12 23.5 14.5 21" />
    </>
  ),
  resize: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </>
  ),
  crop: (
    <>
      <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" />
      <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" />
    </>
  ),
  convert: (
    <>
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </>
  ),
  eyedropper: (
    <>
      <path d="M17.5 3.5l3 3L12 15l-3-3 8.5-8.5z" />
      <path d="M9 15l-5 5 1.5 1.5L11 17" />
      <path d="M14 7l3 3" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-.8 2-1.8 0-1.2-1-1.7-1-2.7 0-1.2 1-2 2.5-2H17a4 4 0 0 0 4-4c0-4-4-7.5-9-7.5z" />
      <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="7.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  browserStar: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M6 6.5h.01M9 6.5h.01" />
      <path d="M12 11.2l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 13.3l2-.3.9-1.8z" />
    </>
  ),
  imageText: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 8h10M7 16h10" />
      <circle cx="10" cy="12" r="1.2" />
      <path d="M13.5 14.5L15 12l1.5 2.5" />
    </>
  ),
  imageSearch: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
      <circle cx="16.5" cy="16.5" r="3" />
      <path d="M18.8 18.8L21 21" />
    </>
  ),
  filter: (
    <>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    </>
  ),
  play: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <polygon points="10 9 15 12 10 15 10 9" fill="currentColor" stroke="none" />
    </>
  ),
  scissors: (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" />
    </>
  ),
  // ---- Finance ----
  home: (
    <>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </>
  ),
  growth: (
    <>
      <path d="M23 6l-9.5 9.5-5-5L1 18" />
      <path d="M17 6h6v6" />
    </>
  ),
  calendarCoin: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <circle cx="12" cy="16" r="3" />
      <path d="M12 14.8v2.4" />
    </>
  ),
  card: (
    <>
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <path d="M1 10h22" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  vault: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <path d="M12 8V6M12 18v-2M8 12H6M18 12h-2" />
    </>
  ),
  taxDoc: (
    <>
      <path d="M6 2h9l5 5v15H6z" />
      <path d="M15 2v5h5" />
      <path d="M16 13l-6 6" />
      <circle cx="10" cy="12" r="1.2" />
      <circle cx="14" cy="18" r="1.2" />
    </>
  ),
  heart: (
    <>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </>
  ),
  tagPercent: (
    <>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <path d="M13.5 8.5l-3.5 5" />
      <circle cx="11" cy="8" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12.5" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  receipt: (
    <>
      <path d="M5 2h14v20l-2.3-1.5L14.5 22l-2.5-1.5L9.5 22l-2.2-1.5L5 22z" />
      <path d="M9 7h6M9 11h6" />
    </>
  ),
  pie: (
    <>
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </>
  ),
  users: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  phoneCoin: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M11 18h2" />
      <circle cx="12" cy="10" r="3.5" />
      <path d="M12 8.5v3" />
    </>
  ),
  // ---- Health ----
  scale: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="3" />
      <circle cx="12" cy="11" r="3.5" />
      <path d="M12 11l1.5-1.5M9 18h6" />
    </>
  ),
  flame: (
    <>
      <path d="M12 2.5s5.5 5 5.5 10a5.5 5.5 0 0 1-11 0c0-2 1-3.5 2-5 .3 1.2 1 2 2 2.5C10 7 11 4.5 12 2.5z" />
    </>
  ),
  apple: (
    <>
      <path d="M12 8c-4-2.5-8 .5-8 5 0 4.5 3.5 8 6 8 1 0 1.5-.5 2-.5s1 .5 2 .5c2.5 0 6-3.5 6-8 0-4.5-4-7.5-8-5z" />
      <path d="M12 8c0-2.5 1-4 3-5" />
    </>
  ),
  calendarHeart: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M12 17.5l-3.2-3.2a1.9 1.9 0 0 1 2.7-2.7L12 12l.5-.4a1.9 1.9 0 0 1 2.7 2.7z" />
    </>
  ),
  droplet: (
    <>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </>
  ),
  moon: (
    <>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </>
  ),
  pulse: (
    <>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </>
  ),
  flask: (
    <>
      <path d="M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.3 21.5h11.4a2 2 0 0 0 1.8-3L14 9V3" />
      <path d="M7.5 15h9" />
    </>
  ),
  stopwatch: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5M9 2h6M12 2v3" />
    </>
  ),
  // ---- Education ----
  gradCap: (
    <>
      <path d="M2 9l10-5 10 5-10 5L2 9z" />
      <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
      <path d="M22 9v5" />
    </>
  ),
  openBook: (
    <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>
  ),
  hourglass: (
    <>
      <path d="M6 2h12M6 22h12" />
      <path d="M8 2v3.5L12 11l4-5.5V2M8 22v-3.5L12 13l4 5.5V22" />
    </>
  ),
  calendarCheck: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M9 16l2 2 4-4" />
    </>
  ),
  chartCheck: (
    <>
      <path d="M5 20v-7M11 20V9M17 20v-5" />
      <path d="M16.5 6.5l2 2 3-3" />
    </>
  ),
  clipboardCheck: (
    <>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M9 13l2 2 4-4" />
    </>
  ),
  calculator: (
    <>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M8.5 6.5h7" />
      <path d="M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h.01M15.5 18h.01" />
    </>
  ),
  // ---- Job ----
  idCard: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="10" r="2" />
      <path d="M5.5 16c.5-1.8 1.7-2.5 3-2.5s2.5.7 3 2.5" />
      <path d="M14.5 9.5H18M14.5 13H18" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v6a4 4 0 0 1-8 0V4z" />
      <path d="M8 5H4.5a3.5 3.5 0 0 0 3.6 3.5M16 5h3.5a3.5 3.5 0 0 1-3.6 3.5" />
      <path d="M12 14v4M8.5 20h7M10 18h4" />
    </>
  ),
  medal: (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M8.5 13.5L7 21l5-2.5L17 21l-1.5-7.5" />
      <path d="M12 7l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 9.1l2-.3.9-1.8z" />
    </>
  ),
  minusCircle: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
    </>
  ),
  keyboard: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6" />
    </>
  ),
  flashcard: (
    <>
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <path d="M7 5V3.5A1.5 1.5 0 0 1 8.5 2H19a2 2 0 0 1 2 2v13.5a1.5 1.5 0 0 1-1.5 1.5H18" />
      <path d="M10 10l.8 1.6 1.7.25-1.25 1.2.3 1.7L10 12.9l-1.55.85.3-1.7-1.25-1.2 1.7-.25L10 10z" />
    </>
  ),
  cvDoc: (
    <>
      <path d="M6 2h9l5 5v15H6z" />
      <path d="M15 2v5h5" />
      <circle cx="10.5" cy="11" r="1.8" />
      <path d="M8 16.5c.4-1.5 1.4-2.2 2.5-2.2s2.1.7 2.5 2.2" />
      <path d="M15.5 10.5H19M15.5 14H19" />
    </>
  ),
  envelope: (
    <>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <path d="M22 6l-10 7L2 6" />
    </>
  ),
  // ---- Teacher ----
  seatGrid: (
    <>
      <circle cx="6" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="18" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="6" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="6" cy="18" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="18" cy="18" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  gridPaper: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <path d="M9.3 4v16M14.6 4v16M4 9.3h16M4 14.6h16" />
    </>
  ),
  certificate: (
    <>
      <rect x="4" y="3" width="16" height="13" rx="1.5" />
      <path d="M8 8h8M8 11h5" />
      <circle cx="15.5" cy="15" r="2.5" />
      <path d="M14 17l-1 3.5 2.5-1.5L18 20.5 17 17" />
    </>
  ),
  bookStar: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M14 7l.8 1.6 1.7.25-1.25 1.2.3 1.7L14 10.9l-1.55.85.3-1.7-1.25-1.2 1.7-.25L14 7z" />
    </>
  ),
  // ---- Text / language ----
  translate: (
    <>
      <path d="M4 5h9M8.5 3v2c0 4-2 7-4.5 8.5M6 8.5c1.5 2.5 4 4.5 7 5" />
      <path d="M13 21l4-9 4 9M14.8 17h4.4" />
    </>
  ),
  countDoc: (
    <>
      <path d="M6 2h9l5 5v15H6z" />
      <path d="M15 2v5h5" />
      <path d="M9 13l-1 4M12 13l-1 4M15 13l-1 4" />
    </>
  ),
  caseLines: (
    <>
      <path d="M4 6h16M4 11h10M4 16h13M4 21h7" />
    </>
  ),
  dupLines: (
    <>
      <path d="M4 6h16M4 11h16M4 16h16" />
      <path d="M5 20L19 5" />
    </>
  ),
  diffDocs: (
    <>
      <path d="M2 4h8v16H2z" />
      <path d="M14 4h8v16h-8z" />
      <path d="M11 8l2 2-2 2 2 2-2 2" />
    </>
  ),
  findReplace: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5L21 21" />
      <path d="M8 10.5h5M13 8l-2 2 2 2" />
    </>
  ),
  paragraph: (
    <>
      <path d="M10 4h6a3.5 3.5 0 0 1 0 7h-6z" />
      <path d="M10 4v16" />
    </>
  ),
  quote: (
    <>
      <path
        d="M10 8c-3 .5-5 2.5-5 6v2h5v-6H7.5C8 9 9 8.5 10 8.5zM21 8c-3 .5-5 2.5-5 6v2h5v-6h-2.5c.5-1 1.5-1.5 2.5-1.5z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),
  speaker: (
    <>
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
    </>
  ),
  mic: (
    <>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3L12 3z" />
      <path d="M18.5 15l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3z" />
      <path d="M5 15l.7 1.8 1.8.7-1.8.7L5 20l-.7-1.8-1.8-.7 1.8-.7L5 15z" />
    </>
  ),
  reverseArrows: (
    <>
      <path d="M4 8h13M13 4.5L17 8l-4 3.5" />
      <path d="M20 16H7M11 12.5L7 16l4 3.5" />
    </>
  ),
  // ---- Developer ----
  braces: (
    <>
      <path d="M8 4c-1.5 0-2.5 1-2.5 2.5C5.5 8 4 9 3 9c1 0 2.5 1 2.5 2.5C5.5 13 6.5 14 8 14M16 4c1.5 0 2.5 1 2.5 2.5 0 1.5 1.5 2.5 2.5 2.5-1 0-2.5 1-2.5 2.5 0 1.5-1 2.5-2.5 2.5" />
    </>
  ),
  code: (
    <>
      <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
  regex: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5L21 21" />
      <path d="M10.5 7.5v6M7.5 9.5l6 4M13.5 9.5l-6 4" />
    </>
  ),
  hash: (
    <>
      <path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18" />
    </>
  ),
  gradientSq: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="4" y="4" width="16" height="8" rx="2" fill="currentColor" opacity="0.35" stroke="none" />
      <path d="M4 12h16" />
    </>
  ),
  tag: (
    <>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.5" />
    </>
  ),
  sitemapTree: (
    <>
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <path d="M12 7v3a3 3 0 0 1-3 3H5M12 7v3a3 3 0 0 0 3 3h4" />
    </>
  ),
  tableGrid: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M3 9h18M3 14.5h18M9 9v11M15 9v11" />
    </>
  ),
  key: (
    <>
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </>
  ),
  // ---- Utility / daily life ----
  mosque: (
    <>
      <path d="M12 2.5C14.5 4 16 6 16 8.5H8C8 6 9.5 4 12 2.5z" />
      <path d="M4 21v-9a8 8 0 0 1 16 0v9" />
      <path d="M2 21h20" />
      <path d="M4 12V5M20 12V5" />
      <path d="M3 5h2M19 5h2" />
    </>
  ),
  moonCalendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M15 17.5a2.8 2.8 0 1 1-3.5-3.5 2.2 2.2 0 0 0 3.5 3.5z" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
    </>
  ),
  sunrise: (
    <>
      <path d="M17 18a5 5 0 0 0-10 0" />
      <path d="M12 2v7M4.22 10.22l1.42 1.42M1 18h2M21 18h2M18.36 11.64l1.42-1.42M23 22H1M8 6l4-4 4 4" />
    </>
  ),
  field: (
    <>
      <path d="M4 4h16v16H4z" />
      <path d="M4 12h16M12 4v16" />
      <path d="M9 8h.01M15 16h.01" />
    </>
  ),
  bolt: (
    <>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </>
  ),
  cake: (
    <>
      <path d="M5 21h14M6 21v-6h12v6" />
      <path d="M4 15h16v-3a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3z" />
      <path d="M12 10V6M10.5 6h3" />
    </>
  ),
  phonePlus: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M11 18h2" />
      <path d="M12 7v5M9.5 9.5h5" />
    </>
  ),
  landmark: (
    <>
      <path d="M3 21h18M5 21V9M19 21V9M3 9l9-5 9 5" />
      <path d="M8 12v4M12 12v4M16 12v4" />
      <path d="M12 4V2" />
    </>
  ),
  starClipboard: (
    <>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M12 10.5l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 13.6l2-.3.9-1.8z" />
    </>
  ),
  beads: (
    <>
      <circle cx="12" cy="4.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="7" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="17" cy="18" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="20" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="7" cy="18" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="5" cy="12.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="6.5" cy="7" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  chatPhone: (
    <>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      <path d="M10.5 9.5v4M8.5 11.5h4" />
    </>
  ),
  // ---- Video ----
  filmCompress: (
    <>
      <rect x="2" y="2" width="20" height="13" rx="2" />
      <path d="M7 2v13M17 2v13M2 8.5h5M17 8.5h5" />
      <path d="M12 17v4M9.5 18.5L12 21l2.5-2.5" />
    </>
  ),
  filmConvert: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <path d="M7 2v20M17 2v20" />
      <path d="M9.5 8h5M12.5 6l2 2-2 2M14.5 16h-5M11.5 14l-2 2 2 2" />
    </>
  ),
  filmMusic: (
    <>
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M7 3v18M17 3v18M2 12h5M17 12h5" />
      <path d="M12 8v5" />
      <circle cx="10.3" cy="14" r="1.4" />
      <circle cx="14" cy="13" r="1.4" />
    </>
  ),
  musicNote: (
    <>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </>
  ),
};

export type ToolIconName = keyof typeof ICON_PATHS;

export const TOOL_ICON_NAMES: ToolIconName[] = Object.keys(ICON_PATHS) as ToolIconName[];

// ---------------------------------------------------------------------------
// Slug -> icon. Every one of the 141 slugs has an explicit entry here
// (guarded by tests); `toolIconFor` falls back to the category icon
// for any slug added later without an entry, so a tool never renders
// a letter or an empty tile.
// ---------------------------------------------------------------------------
export const TOOL_ICON_BY_SLUG: Record<string, ToolIconName> = {
  // PDF & Document (13)
  'pdf-merger': 'docMerge',
  'pdf-splitter': 'docSplit',
  'pdf-compressor': 'docCompress',
  'pdf-to-jpg': 'docImage',
  'pdf-to-word': 'convert',
  'pdf-page-reorder': 'reorder',
  'pdf-watermark': 'docDrop',
  'image-to-pdf': 'imageDoc',
  'text-to-pdf': 'doc',
  'pdf-password-protector': 'docLock',
  'pdf-page-remover': 'docX',
  'pdf-rotate': 'reverseArrows',
  'pdf-page-number-adder': 'hash',
  // Image & Graphics (17)
  'image-compressor': 'imageCompress',
  'image-resizer': 'resize',
  'image-cropper': 'crop',
  'jpg-to-png': 'convert',
  'png-to-jpg': 'convert',
  'webp-converter': 'convert',
  'heic-to-jpg': 'convert',
  'image-watermark-maker': 'docDrop',
  'image-color-picker': 'eyedropper',
  'favicon-generator': 'browserStar',
  'meme-generator': 'imageText',
  'exif-viewer-remover': 'imageSearch',
  'image-rotate-flip': 'resize',
  'image-to-base64': 'code',
  'image-filter': 'filter',
  'youtube-thumbnail-downloader': 'play',
  'background-remover': 'scissors',
  // Finance & Loan (30)
  'mortgage-calculator': 'home',
  'compound-interest-calculator': 'growth',
  'loan-emi-calculator': 'calendarCoin',
  'credit-card-payoff-calculator': 'card',
  'salary-to-hourly-converter': 'clock',
  'retirement-savings-planner': 'vault',
  'income-tax-calculator': 'taxDoc',
  'zakat-calculator': 'heart',
  'bank-emi-dps-fdr-calculator': 'calendarCoin',
  'discount-vat-profit-calculator': 'tagPercent',
  'tip-calculator': 'receipt',
  'invoice-generator': 'receipt',
  'budget-planner': 'pie',
  'expense-splitter': 'users',
  'break-even-calculator': 'growth',
  'bkash-nagad-calculator': 'phoneCoin',
  'profit-margin-calculator': 'tagPercent',
  'simple-interest-calculator': 'calculator',
  'savings-goal-calculator': 'vault',
  'fuel-cost-calculator': 'droplet',
  // Finance/Health batch (15, 27 Nov 2026)
  'roi-calculator': 'growth',
  'gst-calculator': 'taxDoc',
  'down-payment-calculator': 'calendarCoin',
  'auto-loan-calculator': 'calendarCoin',
  'inflation-calculator': 'chartCheck',
  'cpm-calculator': 'tagPercent',
  'ctr-calculator': 'chartCheck',
  'engagement-rate-calculator': 'users',
  'youtube-money-calculator': 'play',
  'adsense-revenue-calculator': 'growth',
  // Health & Fitness (16)
  'bmi-calculator': 'scale',
  'calorie-tdee-calculator': 'flame',
  'macro-nutrient-calculator': 'apple',
  'pregnancy-due-date-calculator': 'calendarHeart',
  'water-intake-calculator': 'droplet',
  'sleep-cycle-calculator': 'moon',
  'body-fat-calculator': 'scale',
  'heart-rate-zone-calculator': 'pulse',
  'bmr-calculator': 'flame',
  'pace-speed-calculator': 'stopwatch',
  'ovulation-calculator': 'calendarHeart',
  'lab-test-result-checker': 'flask',
  'ideal-weight-calculator': 'scale',
  // Finance/Health batch (15, 27 Nov 2026)
  'steps-to-calories-calculator': 'flame',
  'dog-age-calculator': 'heart',
  'cat-age-calculator': 'heart',
  // Education & Student (38)
  'ssc-hsc-gpa-calculator': 'gradCap',
  'nu-cgpa-calculator': 'openBook',
  'international-gpa-calculator': 'globe',
  'cgpa-to-percentage-converter': 'convert',
  'exam-countdown-timer': 'clock',
  'pomodoro-timer': 'hourglass',
  'study-routine-maker': 'calendarCheck',
  'grade-analyzer': 'chartCheck',
  'attendance-calculator': 'clipboardCheck',
  'scientific-calculator': 'calculator',
  'flashcard-maker': 'flashcard',
  // Math batch (25, 27 Nov 2026)
  'fraction-calculator': 'calculator',
  'average-calculator': 'chartCheck',
  'median-mode-calculator': 'chartCheck',
  'standard-deviation-calculator': 'chartCheck',
  'ratio-calculator': 'scale',
  'proportion-calculator': 'scale',
  'percentage-change-calculator': 'tagPercent',
  'square-root-cube-root-calculator': 'calculator',
  'exponent-power-calculator': 'calculator',
  'logarithm-calculator': 'calculator',
  'quadratic-equation-solver': 'braces',
  'linear-equation-solver': 'braces',
  'area-calculator': 'gridPaper',
  'volume-calculator': 'gridPaper',
  'pythagorean-theorem-calculator': 'gridPaper',
  'triangle-calculator': 'gridPaper',
  'circle-calculator': 'pie',
  'prime-number-checker': 'hash',
  'factor-calculator': 'hash',
  'lcm-hcf-calculator': 'hash',
  'factorial-calculator': 'calculator',
  'permutation-combination-calculator': 'calculator',
  'probability-calculator': 'chartCheck',
  'binary-hex-octal-calculator': 'code',
  'matrix-calculator': 'tableGrid',
  // Main tables batch (10, 27 Nov 2026)
  'math-physics-formulas': 'openBook',
  'periodic-table': 'tableGrid',
  // Job & Career (10)
  'govt-job-age-calculator': 'idCard',
  'bcs-marks-calculator': 'trophy',
  'negative-marking-calculator': 'minusCircle',
  'typing-speed-test': 'keyboard',
  'gk-flashcard': 'flashcard',
  'vocabulary-trainer': 'openBook',
  'cv-builder': 'cvDoc',
  'cover-letter-builder': 'envelope',
  'application-fee-calculator': 'receipt',
  'admit-card-checklist': 'clipboardCheck',
  // Teacher & Institution (11)
  'exam-seat-plan-generator': 'seatGrid',
  'merit-rank-result-sheet': 'medal',
  'pass-fail-analyzer': 'chartCheck',
  'printable-paper-generator': 'gridPaper',
  'academic-calendar-maker': 'calendarCheck',
  'quiz-stopwatch-timer': 'stopwatch',
  'random-student-group-maker': 'users',
  'certificate-maker': 'certificate',
  'assignment-cover-generator': 'bookStar',
  'percentage-converter': 'convert',
  'random-name-picker': 'users',
  // Text, Language & Writing (44)
  'bijoy-to-unicode-converter': 'translate',
  'unicode-to-bijoy-converter': 'translate',
  'word-counter': 'countDoc',
  'text-case-converter': 'caseLines',
  'duplicate-line-remover': 'dupLines',
  'text-diff-checker': 'diffDocs',
  'find-and-replace': 'findReplace',
  'number-to-words-converter': 'convert',
  'lorem-ipsum-generator': 'paragraph',
  'citation-generator': 'quote',
  'dictionary': 'openBook',
  'text-to-speech': 'speaker',
  'remove-extra-spaces': 'caseLines',
  'speech-to-text': 'mic',
  'fancy-text-generator': 'sparkles',
  'reverse-text-generator': 'reverseArrows',
  'character-counter': 'countDoc',
  'reading-time-calculator': 'openBook',
  'text-sorter': 'reorder',
  // Text batch (24, 27 Nov 2026)
  'random-word-generator': 'sparkles',
  'zalgo-text-generator': 'sparkles',
  'small-text-generator': 'caseLines',
  'prefix-suffix-adder': 'paragraph',
  'list-to-csv-converter': 'tableGrid',
  'text-to-binary-converter': 'code',
  'binary-to-text-converter': 'code',
  'morse-code-converter': 'translate',
  'ascii-art-generator': 'imageText',
  'emoji-picker': 'heart',
  'invisible-character-generator': 'hash',
  'palindrome-checker': 'reverseArrows',
  'anagram-solver': 'findReplace',
  'essay-thesis-generator': 'quote',
  'keyword-density-checker': 'countDoc',
  'slug-generator': 'link',
  'readability-score-checker': 'clipboardCheck',
  'bio-username-generator': 'idCard',
  'hashtag-generator': 'hash',
  'youtube-title-description-checker': 'play',
  'line-number-adder': 'paragraph',
  'wheel-spinner': 'pie',
  'coin-flip-dice-roller': 'sparkles',
  'words-to-number-converter': 'convert',
  // Main tables batch (10, 27 Nov 2026)
  'translate': 'translate',
  // Developer & Web (26)
  'json-formatter': 'braces',
  'code-minifier-beautifier': 'code',
  'base64-encoder-decoder': 'code',
  'url-encoder-decoder': 'link',
  'regex-tester': 'regex',
  'uuid-hash-generator': 'hash',
  'color-converter': 'palette',
  'css-gradient-generator': 'gradientSq',
  'meta-tag-generator': 'tag',
  'robots-sitemap-generator': 'sitemapTree',
  'credit-card-validator': 'card',
  'roman-numeral-converter': 'convert',
  'jwt-token-decoder': 'key',
  'html-table-generator': 'tableGrid',
  'unix-timestamp-converter': 'code',
  'csv-to-excel': 'tableGrid',
  'excel-to-csv': 'convert',
  'json-to-csv': 'braces',
  'xml-formatter': 'code',
  'markdown-to-html': 'paragraph',
  'html-to-markdown': 'diffDocs',
  'password-generator': 'key',
  'password-strength-checker': 'docLock',
  // Main tables batch (10, 27 Nov 2026)
  'html-entity-encoder-decoder': 'code',
  'csv-to-json-converter': 'braces',
  'sql-formatter': 'braces',
  // Daily Life, Islamic & Utility (55)
  'prayer-times': 'mosque',
  'hijri-date-converter': 'moonCalendar',
  'daily-quran-verse': 'openBook',
  'daily-hadith': 'openBook',
  'qibla-direction': 'compass',
  'sehri-iftar-time': 'sunrise',
  'land-measurement': 'field',
  'electricity-bill-calculator': 'bolt',
  'age-calculator': 'cake',
  'unit-converter': 'convert',
  'meeting-time-planner': 'clock',
  'world-date-converter': 'globe',
  'emergency-numbers': 'phonePlus',
  'govt-service-links': 'landmark',
  'results-hub': 'starClipboard',
  'notes-todo': 'doc',
  'tasbih-counter': 'beads',
  'whatsapp-link-generator': 'chatPhone',
  'screen-resolution-checker': 'resize',
  'stopwatch': 'stopwatch',
  'world-clock': 'globe',
  'time-zone-converter': 'clock',
  'date-difference-calculator': 'calendarCheck',
  'time-duration-calculator': 'hourglass',
  'random-number-generator': 'sparkles',
  'qr-code-generator': 'gridPaper',
  'qr-code-reader': 'imageSearch',
  'barcode-generator': 'tag',
  // Finance/Health batch (15, 27 Nov 2026)
  'working-days-calculator': 'calendarCheck',
  'love-compatibility-calculator': 'heart',
  // Converters batch (21, 27 Nov 2026)
  'volume-converter': 'convert',
  'data-storage-converter': 'convert',
  'data-transfer-speed-converter': 'convert',
  'pressure-converter': 'convert',
  'energy-converter': 'bolt',
  'power-converter': 'bolt',
  'angle-converter': 'gridPaper',
  'time-converter': 'clock',
  'frequency-converter': 'pulse',
  'fuel-economy-converter': 'droplet',
  'cooking-measurement-converter': 'scale',
  'shoe-size-converter': 'resize',
  'clothing-size-converter': 'resize',
  'dpi-ppi-calculator': 'resize',
  'aspect-ratio-calculator': 'resize',
  'px-to-rem-converter': 'code',
  'online-alarm-clock': 'clock',
  'week-number-calculator': 'calendarCheck',
  'leap-year-checker': 'calendarCheck',
  'julian-date-converter': 'calendarCheck',
  'bangla-date-converter': 'moonCalendar',
  // Main tables batch (10, 27 Nov 2026)
  'weather': 'sunrise',
  'full-forms-abbreviations': 'openBook',
  'country-calling-codes': 'phonePlus',
  'daily-quotes-wishes': 'quote',
  // Video & Music (5)
  'video-compressor': 'filmCompress',
  'video-trimmer': 'scissors',
  'video-format-converter': 'filmConvert',
  'video-to-audio-converter': 'filmMusic',
  'music-player': 'musicNote',
};

// Category fallback — used only for a slug with no explicit entry
// (e.g. a tool added to toolsMeta before its icon is mapped).
export const CATEGORY_ICON: Record<ToolCategory, ToolIconName> = {
  pdf: 'doc',
  image: 'imageCompress',
  finance: 'calculator',
  health: 'pulse',
  education: 'gradCap',
  job: 'trophy',
  teacher: 'certificate',
  text: 'translate',
  developer: 'code',
  utility: 'clock',
  video: 'filmMusic',
};

export function toolIconFor(slug: string, category: ToolCategory): ToolIconName {
  return TOOL_ICON_BY_SLUG[slug] ?? CATEGORY_ICON[category];
}

// Tile gradients — palette only, cycling teal -> forest -> amber so
// neighbouring cards do not all look identical.
const TILE_GRADIENTS = [
  'linear-gradient(135deg, var(--teal), var(--forest))',
  'linear-gradient(135deg, var(--forest), var(--teal-deep))',
  'linear-gradient(135deg, var(--amber), var(--teal))',
] as const;

function tileVariant(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) hash = (hash * 31 + slug.charCodeAt(i)) % 997;
  return hash % TILE_GRADIENTS.length;
}

export interface ToolIconProps {
  slug: string;
  category: ToolCategory;
  /** Tile size in px (default 44, the hub card tile). */
  size?: number;
  /** Extra inline style on the tile (e.g. marginBottom). */
  style?: CSSProperties;
}

// The 3D-style picture tile: gradient background + soft drop shadow
// + a top inner highlight, white stroke glyph inside. Decorative
// (aria-hidden) — the tool title next to it carries the meaning.
export function ToolIcon({ slug, category, size = 44, style }: ToolIconProps) {
  const name = toolIconFor(slug, category);
  const glyphSize = Math.round(size * 0.6);
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: Math.round(size * 0.28),
        background: TILE_GRADIENTS[tileVariant(slug)],
        boxShadow: '0 4px 12px rgba(2, 60, 50, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
        ...style,
      }}
    >
      <svg
        width={glyphSize}
        height={glyphSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        {ICON_PATHS[name] as ReactNode}
      </svg>
    </span>
  );
}
