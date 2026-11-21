// Eduvelto — static filter taxonomy for Library + Directory (Phase 2).
//
// GENERATED from the 609-book content inventory (content packs parsed
// 21 Nov 2026, same logic as scripts/load-library-content.mjs).
// WHY STATIC: Firestore has no DISTINCT query, so the filter dropdown
// options cannot be read from the database without fetching all 609
// books — which is exactly the read cost pagination removes. These
// values are the fixed curriculum taxonomy, so they change only when a
// NEW book with a NEW value is published. When that happens, regenerate
// this file from the content packs (see ~/workspace/eduorbit/team/
// pagination-test-report.md §6) — a stale list only hides the new
// value from the dropdowns; it never hides the book itself from
// browsing, and search still finds it.
//
// Counts: 609 books — Higher 439, Technical 72, HSC 37, Madrasa 35,
// SSC 26. 13 class levels, 22 departments, 4 boards, 11 programs.
//
// --- CASCADING FILTERS v2 (21 Nov 2026) ---
// Source of truth: the live 609-book inventory (content packs in
// ~/workspace/eduorbit/content — 73 folders, 720 packs). NO option
// exists here without backing data.
// Owner decisions (21 Nov 2026, BINDING):
//  - NO Board/University step ("board dite hobe na tyle").
//  - NO Book Type step, NO Subject step (subject = department), NO author search.
//  - Drop every option with no backing data ("ja nai bad diba") — not backfilled,
//    not invented.
//  - Cascade: General/Higher = 5 steps
//      Education Type → Program / Level → Class / Year / Semester →
//      Group / Department / Trade → Search
//    Madrasa/Technical = 3 steps (Type → Program / Level → Search) — their
//    Class and Group values are IDENTICAL to the Level values, so steps 3–4
//    collapse.
//  - Every filter has an All option. Step-by-step activation (N+1 enables
//    after N); changing an earlier selection resets later inconsistent filters.
//  - ONLY real books from the database — no demo or fake books.
// Live-data note (plan correction, see team/cascading-filter-build-report.md):
// live `books` / `educationDirectory` rows do NOT yet carry stream/level/group
// (live writes need separate owner approval). The loader stores them (see
// scripts/load-library-content.mjs, deriveCascadeFields) and the app queries
// translate cascade selections to the LEGACY fields (type / program /
// classLevel / department) — see src/lib/content.ts cascadeToDirectoryFilters.
// When live rows carry the new fields, flip the one-line switch there to
// query them directly.

export const EDUCATION_TYPES: string[] = ['HSC', 'Higher', 'Madrasa', 'SSC', 'Technical'];

export const ALL_CLASS_LEVELS: string[] = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Alim', 'Bmt', 'Dakhil', 'Fazil', 'HSC', 'Hsc Vocational', 'Kamil', 'SSC', 'Ssc Vocational'];

export const ALL_DEPARTMENTS: string[] = ['Accounting', 'Bangla', 'Bmt', 'Botany', 'Chemistry', 'Commerce', 'Economics', 'English', 'History', 'Hsc Vocational', 'Humanities', 'Islamic History & Culture', 'Madrasa', 'Management', 'Mathematics', 'Philosophy', 'Physics', 'Political Science', 'Science', 'Sociology', 'Ssc Vocational', 'Zoology'];

// Library: educationType -> classLevel -> departments.
export const LIBRARY_CLASSES: Record<string, string[]> = {
  'HSC': ['HSC'],
  'Higher': ['1st Year', '2nd Year', '3rd Year', '4th Year'],
  'Madrasa': ['Alim', 'Dakhil', 'Fazil', 'Kamil'],
  'SSC': ['SSC'],
  'Technical': ['Bmt', 'Hsc Vocational', 'Ssc Vocational'],
};

export const LIBRARY_DEPARTMENTS: Record<string, Record<string, string[]>> = {
  'HSC': {
    'HSC': ['Commerce', 'Humanities', 'Science'],
  },
  'Higher': {
    '1st Year': ['Accounting', 'Bangla', 'Botany', 'Chemistry', 'Economics', 'English', 'History', 'Islamic History & Culture', 'Management', 'Mathematics', 'Philosophy', 'Physics', 'Political Science', 'Sociology', 'Zoology'],
    '2nd Year': ['Accounting', 'Bangla', 'Botany', 'Chemistry', 'Economics', 'English', 'History', 'Islamic History & Culture', 'Management', 'Mathematics', 'Philosophy', 'Physics', 'Political Science', 'Sociology', 'Zoology'],
    '3rd Year': ['Accounting', 'Bangla', 'Botany', 'Chemistry', 'Economics', 'English', 'History', 'Islamic History & Culture', 'Management', 'Mathematics', 'Philosophy', 'Physics', 'Political Science', 'Sociology', 'Zoology'],
    '4th Year': ['Accounting', 'Bangla', 'Botany', 'Chemistry', 'Economics', 'English', 'History', 'Islamic History & Culture', 'Management', 'Mathematics', 'Philosophy', 'Physics', 'Political Science', 'Sociology', 'Zoology'],
  },
  'Madrasa': {
    'Alim': ['Madrasa'],
    'Dakhil': ['Madrasa'],
    'Fazil': ['Madrasa'],
    'Kamil': ['Madrasa'],
  },
  'SSC': {
    'SSC': ['Commerce', 'Humanities', 'Science'],
  },
  'Technical': {
    'Bmt': ['Bmt'],
    'Hsc Vocational': ['Hsc Vocational'],
    'Ssc Vocational': ['Ssc Vocational'],
  },
};

// Cascading helpers: each level narrows the next; an empty parent means "all".
export function libraryClassOptions(typeFilter: string): string[] {
  if (!typeFilter) return ALL_CLASS_LEVELS;
  return LIBRARY_CLASSES[typeFilter] ?? [];
}

export function libraryDepartmentOptions(typeFilter: string, classFilter: string): string[] {
  if (!typeFilter && !classFilter) return ALL_DEPARTMENTS;
  const out = new Set<string>();
  const types = typeFilter ? [typeFilter] : Object.keys(LIBRARY_DEPARTMENTS);
  for (const t of types) {
    const byClass = LIBRARY_DEPARTMENTS[t] ?? {};
    const classes = classFilter ? [classFilter] : Object.keys(byClass);
    for (const c of classes) for (const dep of byClass[c] ?? []) out.add(dep);
  }
  return [...out].sort();
}

// ---------------------------------------------------------------------------
// Cascading filter taxonomy v2 (Directory) — replaces the old
// DIRECTORY_BOARDS / DIRECTORY_PROGRAMS / DIRECTORY_CLASSES /
// DIRECTORY_DEPARTMENTS tables and the directory*Options helpers.
// The Board step was dropped by the owner (21 Nov 2026), and the
// Program / Class / Group steps are now driven by stream, not by type.
// ---------------------------------------------------------------------------

export type CascadeStream = 'general' | 'madrasa' | 'technical' | 'higher';

export interface CascadeOption {
  /** Stored value (matches the legacy field value it translates to). */
  value: string;
  bn: string;
  en: string;
}

export interface CascadeLevel {
  value: string;
  bn: string;
  en: string;
  /** Step-3 values under this level. Empty = step 3 collapses (Madrasa/Technical). */
  classes: CascadeOption[];
  /** Step-4 values. Flat list, same for every class of this level. */
  groups?: CascadeOption[];
  /** Step-4 values per class (Higher: the same 15 departments exist in all 4 years). */
  groupsByClass?: Record<string, CascadeOption[]>;
}

export interface CascadeStreamDef {
  stream: CascadeStream;
  bn: string;
  en: string;
  levels: CascadeLevel[];
}

const DEPTS_ALL_YEARS: CascadeOption[] = [
  { value: 'Accounting', bn: 'হিসাববিজ্ঞান', en: 'Accounting' },
  { value: 'Bangla', bn: 'বাংলা', en: 'Bangla' },
  { value: 'Botany', bn: 'উদ্ভিদবিজ্ঞান', en: 'Botany' },
  { value: 'Chemistry', bn: 'রসায়ন', en: 'Chemistry' },
  { value: 'Economics', bn: 'অর্থনীতি', en: 'Economics' },
  { value: 'English', bn: 'ইংরেজি', en: 'English' },
  { value: 'History', bn: 'ইতিহাস', en: 'History' },
  { value: 'Islamic History & Culture', bn: 'ইসলামের ইতিহাস ও সংস্কৃতি', en: 'Islamic History & Culture' },
  { value: 'Management', bn: 'ব্যবস্থাপনা', en: 'Management' },
  { value: 'Mathematics', bn: 'গণিত', en: 'Mathematics' },
  { value: 'Philosophy', bn: 'দর্শন', en: 'Philosophy' },
  { value: 'Physics', bn: 'পদার্থবিজ্ঞান', en: 'Physics' },
  { value: 'Political Science', bn: 'রাষ্ট্রবিজ্ঞান', en: 'Political Science' },
  { value: 'Sociology', bn: 'সমাজবিজ্ঞান', en: 'Sociology' },
  { value: 'Zoology', bn: 'প্রাণিবিজ্ঞান', en: 'Zoology' },
];

const GENERAL_GROUPS: CascadeOption[] = [
  { value: 'Science', bn: 'বিজ্ঞান', en: 'Science' },
  { value: 'Commerce', bn: 'বাণিজ্য', en: 'Commerce' },
  { value: 'Humanities', bn: 'মানবিক', en: 'Humanities' },
];

/**
 * The full cascade, derived from the live inventory:
 *  - General: SSC (26) + HSC (37) = 63 books; groups Science/Commerce/Humanities.
 *  - Madrasa: Dakhil/Alim/Fazil/Kamil = 35 books; class == group == level.
 *  - Technical: Bmt / Hsc Vocational / Ssc Vocational = 72 books; class == group == level.
 *  - Higher: Honours, 15 departments x 4 years = 439 books.
 * Class 1–5 and Class 6–8 have ZERO books — they are NOT cascade options here
 * (they keep their Coming Soon state in the Library).
 */
export const CASCADE_STREAMS: CascadeStreamDef[] = [
  {
    stream: 'general',
    bn: 'সাধারণ শিক্ষা',
    en: 'General Education',
    levels: [
      {
        value: 'Secondary',
        bn: 'মাধ্যমিক',
        en: 'Secondary',
        classes: [{ value: 'SSC', bn: 'এসএসসি', en: 'SSC' }],
        groups: GENERAL_GROUPS,
      },
      {
        value: 'Higher Secondary',
        bn: 'উচ্চ মাধ্যমিক',
        en: 'Higher Secondary',
        classes: [{ value: 'HSC', bn: 'এইচএসসি', en: 'HSC' }],
        groups: GENERAL_GROUPS,
      },
    ],
  },
  {
    stream: 'madrasa',
    bn: 'মাদ্রাসা শিক্ষা',
    en: 'Madrasa Education',
    levels: [
      { value: 'Dakhil', bn: 'দাখিল', en: 'Dakhil', classes: [] },
      { value: 'Alim', bn: 'আলিম', en: 'Alim', classes: [] },
      { value: 'Fazil', bn: 'ফাজিল', en: 'Fazil', classes: [] },
      { value: 'Kamil', bn: 'কামিল', en: 'Kamil', classes: [] },
    ],
  },
  {
    stream: 'technical',
    bn: 'কারিগরি শিক্ষা',
    en: 'Technical Education',
    levels: [
      { value: 'Bmt', bn: 'বিএমটি', en: 'BMT', classes: [] },
      { value: 'Hsc Vocational', bn: 'এইচএসসি (ভোকেশনাল)', en: 'HSC (Vocational)', classes: [] },
      { value: 'Ssc Vocational', bn: 'এসএসসি (ভোকেশনাল)', en: 'SSC (Vocational)', classes: [] },
    ],
  },
  {
    stream: 'higher',
    bn: 'উচ্চশিক্ষা',
    en: 'Higher Education',
    levels: [
      {
        value: 'Honours',
        bn: 'অনার্স',
        en: 'Honours',
        classes: [
          { value: '1st Year', bn: '১ম বর্ষ', en: '1st Year' },
          { value: '2nd Year', bn: '২য় বর্ষ', en: '2nd Year' },
          { value: '3rd Year', bn: '৩য় বর্ষ', en: '3rd Year' },
          { value: '4th Year', bn: '৪র্থ বর্ষ', en: '4th Year' },
        ],
        groupsByClass: {
          '1st Year': DEPTS_ALL_YEARS,
          '2nd Year': DEPTS_ALL_YEARS,
          '3rd Year': DEPTS_ALL_YEARS,
          '4th Year': DEPTS_ALL_YEARS,
        },
      },
    ],
  },
];

export function cascadeStreamDef(stream: CascadeStream): CascadeStreamDef | undefined {
  return CASCADE_STREAMS.find((s) => s.stream === stream);
}

export function cascadeLevelDef(stream: CascadeStream, levelValue: string): CascadeLevel | undefined {
  return cascadeStreamDef(stream)?.levels.find((l) => l.value === levelValue);
}

/** Step-3 options for a (stream, level). Empty array = step 3 collapses. */
export function cascadeClasses(stream: CascadeStream, levelValue: string): CascadeOption[] {
  return cascadeLevelDef(stream, levelValue)?.classes ?? [];
}

/** Step-4 options for a (stream, level, class). Empty array = step 4 collapses. */
export function cascadeGroups(stream: CascadeStream, levelValue: string, classValue: string): CascadeOption[] {
  const level = cascadeLevelDef(stream, levelValue);
  if (!level) return [];
  if (level.groupsByClass) return level.groupsByClass[classValue] ?? [];
  return level.groups ?? [];
}
