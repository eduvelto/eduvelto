// Eduvelto — class-wise navigation (stage 3: class-wise homepage + mobile app).
//
// The homepage's primary navigation is CLASS-WISE, not subject-wise: the
// student picks their level first — Class 1–5, Class 6–8, Class 9–10, HSC,
// Honours & Masters — and each level has its own dashboard showing ONLY
// that level's content.
//
// HONESTY: the level definitions carry the LIVE mapping (educationType +
// classLevel values) used to filter books/quizzes. Class 1–5 and Class 6–8
// have NO books in the library (0), so their `educationType` is null and
// their dashboards must show an honest "not ready yet" state — never fake
// books, subjects, chapters or progress. Counts are always computed from
// the live fetched books, never hard-coded.
// Class accent colours (owner's dream-design reference, 21 Nov 12:21):
// white text on each accent passes WCAG AA normal (measured 21 Nov 2026):
// green #15803D 5.02:1, blue #1D4ED8 6.70:1, purple #7E22CE 6.98:1,
// orange #C2410C 5.18:1, teal-deep #12766E 5.47:1.

import type { Book } from './content';
import type { Quiz } from './exams';

export interface ClassLevelDef {
  /** URL slug: /class/<slug>. */
  slug: string;
  /** Bangla display name, e.g. 'শ্রেণি ১–৫'. */
  bn: string;
  /** English display name, e.g. 'Class 1–5'. */
  en: string;
  /** Bangla level label, e.g. 'প্রাথমিক'. */
  tagBn: string;
  /** English level label, e.g. 'Primary'. */
  tagEn: string;
  /** Card/header background (white text on it is AA). */
  accent: string;
  /** Soft tint for chips/tiles on light surfaces. */
  accentSoft: string;
  /** Deep tone for text/links on light surfaces. */
  accentDeep: string;
  /** Live educationType to match, or null when the level has no books. */
  educationType: string | null;
  /** Live classLevel values to match. */
  classLevels: string[];
}

export const CLASS_LEVELS: ClassLevelDef[] = [
  {
    slug: 'class-1-5',
    bn: 'শ্রেণি ১–৫',
    en: 'Class 1–5',
    tagBn: 'প্রাথমিক',
    tagEn: 'Primary',
    accent: '#15803D',
    accentSoft: '#E7F4EB',
    accentDeep: '#14532D',
    educationType: null,
    classLevels: [],
  },
  {
    slug: 'class-6-8',
    bn: 'শ্রেণি ৬–৮',
    en: 'Class 6–8',
    tagBn: 'নিম্ন মাধ্যমিক',
    tagEn: 'Lower Secondary',
    accent: '#1D4ED8',
    accentSoft: '#E7EDFC',
    accentDeep: '#1E3A8A',
    educationType: null,
    classLevels: [],
  },
  {
    slug: 'class-9-10',
    bn: 'শ্রেণি ৯–১০',
    en: 'Class 9–10',
    tagBn: 'মাধ্যমিক (SSC)',
    tagEn: 'Secondary (SSC)',
    accent: '#7E22CE',
    accentSoft: '#F3E8FB',
    accentDeep: '#581C87',
    educationType: 'SSC',
    classLevels: ['SSC'],
  },
  {
    slug: 'hsc',
    bn: 'HSC',
    en: 'HSC',
    tagBn: 'উচ্চ মাধ্যমিক',
    tagEn: 'Higher Secondary',
    accent: '#C2410C',
    accentSoft: '#FDEEE6',
    accentDeep: '#7C2D12',
    educationType: 'HSC',
    classLevels: ['HSC'],
  },
  {
    slug: 'honours-masters',
    bn: 'অনার্স ও মাস্টার্স',
    en: 'Honours & Masters',
    tagBn: 'উচ্চশিক্ষা',
    tagEn: 'Higher Education',
    accent: '#12766E',
    accentSoft: '#E3F2F0',
    accentDeep: '#0F5E57',
    educationType: 'Higher',
    classLevels: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
  },
];

export function classLevelBySlug(slug: string): ClassLevelDef | undefined {
  return CLASS_LEVELS.find((c) => c.slug === slug);
}

/** Live Published books belonging to this level — empty when the level has no books. */
export function booksForClass(books: Book[], def: ClassLevelDef): Book[] {
  if (!def.educationType) return [];
  return books.filter(
    (b) => b.educationType === def.educationType && def.classLevels.includes(b.classLevel),
  );
}

/** Live Published quizzes belonging to this level. */
export function quizzesForClass(quizzes: Quiz[], def: ClassLevelDef): Quiz[] {
  if (!def.educationType) return [];
  return quizzes.filter(
    (q) => q.educationType === def.educationType && def.classLevels.includes(q.classLevel),
  );
}

/** Distinct live departments (subjects) of this level's books, sorted. */
export function subjectsForClass(books: Book[], def: ClassLevelDef): string[] {
  return [...new Set(booksForClass(books, def).map((b) => b.department).filter(Boolean))].sort();
}

// ---------------------------------------------------------------------------
// Class filter options (owner brief 21 Nov 13:20, BINDING): the Library and
// Directory "শ্রেণি / Class" dropdowns must list EVERY class level —
// including Class 1–5 and Class 6–8, which have zero books — never only
// the levels that happen to have content. A level with no books still
// appears as an option; selecting it shows an honest empty/coming-soon
// state, never fake books.
//
// Option values: `level:<slug>` for the 5 class levels, the raw classLevel
// string for any extra value found in live data that no level covers
// (e.g. Madrasa/Technical class levels) so nothing that exists today
// disappears. `?class=` deep links accept both forms.
// ---------------------------------------------------------------------------

export interface ClassFilterOption {
  value: string;
  labelBn: string;
  labelEn: string;
  levelSlug?: string;
}

/** All class-filter options for a dropdown, levels first, then extras. */
export function classFilterOptions(
  presentClassLevels: string[],
  typeFilter?: string | null,
): ClassFilterOption[] {
  const covered = new Set<string>();
  for (const def of CLASS_LEVELS) for (const cl of def.classLevels) covered.add(cl);
  const options: ClassFilterOption[] = [];
  for (const def of CLASS_LEVELS) {
    // Cascade: when a type is chosen, only levels of that type are offered.
    if (typeFilter && def.educationType !== typeFilter) continue;
    options.push({ value: `level:${def.slug}`, labelBn: def.bn, labelEn: def.en, levelSlug: def.slug });
  }
  const extras = [...new Set(presentClassLevels.filter((c) => c && !covered.has(c)))].sort();
  for (const c of extras) options.push({ value: c, labelBn: c, labelEn: c });
  return options;
}

/** Does this row's classLevel belong to the selected class-filter value? */
export function matchesClassFilter(
  row: { educationType?: string; type?: string; classLevel: string },
  classFilter: string,
): boolean {
  if (!classFilter) return true;
  if (classFilter.startsWith('level:')) {
    const def = classLevelBySlug(classFilter.slice('level:'.length));
    if (!def || !def.educationType) return false; // level with no books yet
    const type = row.educationType ?? row.type ?? '';
    return type === def.educationType && def.classLevels.includes(row.classLevel);
  }
  return row.classLevel === classFilter;
}

/** Normalise a `?class=` deep-link value to a filter value. */
export function classFilterFromParam(param: string | null): string {
  if (!param) return '';
  if (param.startsWith('level:')) return param;
  if (classLevelBySlug(param)) return `level:${param}`;
  return param;
}

/** The level behind a selected class-filter value, if it is a level. */
export function levelOfClassFilter(classFilter: string): ClassLevelDef | undefined {
  if (!classFilter.startsWith('level:')) return undefined;
  return classLevelBySlug(classFilter.slice('level:'.length));
}
