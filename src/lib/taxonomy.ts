// Eduvelto — static filter taxonomy for Library + Directory (Phase 2, pagination).
//
// GENERATED from the 609-book content inventory (content packs parsed
// 21 Nov 2026, same logic as scripts/load-library-content.mjs).
// WHY STATIC: Firestore has no DISTINCT query, so the filter dropdown
// options cannot be read from the database without fetching all 609
// books — which is exactly the read cost pagination removes. These
// values are the fixed curriculum taxonomy (education type / board /
// program / class / department), so they change only when a NEW book
// with a NEW value is published. When that happens, regenerate this
// file from the content packs (see ~/workspace/eduorbit/team/
// pagination-test-report.md §6) — a stale list only hides the new
// value from the dropdowns; it never hides the book itself from
// browsing, and search still finds it.
//
// Counts: 609 books — Higher 439, Technical 72, HSC 37, Madrasa 35,
// SSC 26. 13 class levels, 22 departments, 4 boards, 11 programs.

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

// Directory: educationType -> board -> program -> classLevel -> departments.
export const DIRECTORY_BOARDS: Record<string, string[]> = {
  'HSC': ['Board of Intermediate and Secondary Education'],
  'Higher': ['National University'],
  'Madrasa': ['Bangladesh Madrasa Education Board'],
  'SSC': ['Board of Intermediate and Secondary Education'],
  'Technical': ['Bangladesh Technical Education Board'],
};

export const DIRECTORY_PROGRAMS: Record<string, Record<string, string[]>> = {
  'HSC': {
    'Board of Intermediate and Secondary Education': ['Commerce', 'Humanities', 'Science'],
  },
  'Higher': {
    'National University': ['Honours'],
  },
  'Madrasa': {
    'Bangladesh Madrasa Education Board': ['Alim', 'Dakhil', 'Fazil', 'Kamil'],
  },
  'SSC': {
    'Board of Intermediate and Secondary Education': ['Commerce', 'Humanities', 'Science'],
  },
  'Technical': {
    'Bangladesh Technical Education Board': ['Bmt', 'Hsc Vocational', 'Ssc Vocational'],
  },
};

export const DIRECTORY_CLASSES: Record<string, Record<string, Record<string, string[]>>> = {
  'HSC': {
    'Board of Intermediate and Secondary Education': {
      'Commerce': ['HSC'],
      'Humanities': ['HSC'],
      'Science': ['HSC'],
    },
  },
  'Higher': {
    'National University': {
      'Honours': ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    },
  },
  'Madrasa': {
    'Bangladesh Madrasa Education Board': {
      'Alim': ['Alim'],
      'Dakhil': ['Dakhil'],
      'Fazil': ['Fazil'],
      'Kamil': ['Kamil'],
    },
  },
  'SSC': {
    'Board of Intermediate and Secondary Education': {
      'Commerce': ['SSC'],
      'Humanities': ['SSC'],
      'Science': ['SSC'],
    },
  },
  'Technical': {
    'Bangladesh Technical Education Board': {
      'Bmt': ['Bmt'],
      'Hsc Vocational': ['Hsc Vocational'],
      'Ssc Vocational': ['Ssc Vocational'],
    },
  },
};

export const DIRECTORY_DEPARTMENTS: Record<string, Record<string, Record<string, Record<string, string[]>>>> = {
  'HSC': {
    'Board of Intermediate and Secondary Education': {
      'Commerce': {
        'HSC': ['Commerce'],
      },
      'Humanities': {
        'HSC': ['Humanities'],
      },
      'Science': {
        'HSC': ['Science'],
      },
    },
  },
  'Higher': {
    'National University': {
      'Honours': {
        '1st Year': ['Accounting', 'Bangla', 'Botany', 'Chemistry', 'Economics', 'English', 'History', 'Islamic History & Culture', 'Management', 'Mathematics', 'Philosophy', 'Physics', 'Political Science', 'Sociology', 'Zoology'],
        '2nd Year': ['Accounting', 'Bangla', 'Botany', 'Chemistry', 'Economics', 'English', 'History', 'Islamic History & Culture', 'Management', 'Mathematics', 'Philosophy', 'Physics', 'Political Science', 'Sociology', 'Zoology'],
        '3rd Year': ['Accounting', 'Bangla', 'Botany', 'Chemistry', 'Economics', 'English', 'History', 'Islamic History & Culture', 'Management', 'Mathematics', 'Philosophy', 'Physics', 'Political Science', 'Sociology', 'Zoology'],
        '4th Year': ['Accounting', 'Bangla', 'Botany', 'Chemistry', 'Economics', 'English', 'History', 'Islamic History & Culture', 'Management', 'Mathematics', 'Philosophy', 'Physics', 'Political Science', 'Sociology', 'Zoology'],
      },
    },
  },
  'Madrasa': {
    'Bangladesh Madrasa Education Board': {
      'Alim': {
        'Alim': ['Madrasa'],
      },
      'Dakhil': {
        'Dakhil': ['Madrasa'],
      },
      'Fazil': {
        'Fazil': ['Madrasa'],
      },
      'Kamil': {
        'Kamil': ['Madrasa'],
      },
    },
  },
  'SSC': {
    'Board of Intermediate and Secondary Education': {
      'Commerce': {
        'SSC': ['Commerce'],
      },
      'Humanities': {
        'SSC': ['Humanities'],
      },
      'Science': {
        'SSC': ['Science'],
      },
    },
  },
  'Technical': {
    'Bangladesh Technical Education Board': {
      'Bmt': {
        'Bmt': ['Bmt'],
      },
      'Hsc Vocational': {
        'Hsc Vocational': ['Hsc Vocational'],
      },
      'Ssc Vocational': {
        'Ssc Vocational': ['Ssc Vocational'],
      },
    },
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

export function directoryBoardOptions(typeFilter: string): string[] {
  if (!typeFilter) return [...new Set(Object.values(DIRECTORY_BOARDS).flat())].sort();
  return DIRECTORY_BOARDS[typeFilter] ?? [];
}

export function directoryProgramOptions(typeFilter: string, boardFilter: string): string[] {
  const out = new Set<string>();
  const types = typeFilter ? [typeFilter] : Object.keys(DIRECTORY_PROGRAMS);
  for (const t of types) {
    const byBoard = DIRECTORY_PROGRAMS[t] ?? {};
    const boards = boardFilter ? [boardFilter] : Object.keys(byBoard);
    for (const b of boards) for (const p of byBoard[b] ?? []) out.add(p);
  }
  return [...out].sort();
}

export function directoryClassOptions(typeFilter: string, boardFilter: string, programFilter: string): string[] {
  const out = new Set<string>();
  const types = typeFilter ? [typeFilter] : Object.keys(DIRECTORY_CLASSES);
  for (const t of types) {
    const byBoard = DIRECTORY_CLASSES[t] ?? {};
    const boards = boardFilter ? [boardFilter] : Object.keys(byBoard);
    for (const b of boards) {
      const byProgram = byBoard[b] ?? {};
      const programs = programFilter ? [programFilter] : Object.keys(byProgram);
      for (const p of programs) for (const c of byProgram[p] ?? []) out.add(c);
    }
  }
  return [...out].sort();
}

export function directoryDepartmentOptions(typeFilter: string, boardFilter: string, programFilter: string, classFilter: string): string[] {
  const out = new Set<string>();
  const types = typeFilter ? [typeFilter] : Object.keys(DIRECTORY_DEPARTMENTS);
  for (const t of types) {
    const byBoard = DIRECTORY_DEPARTMENTS[t] ?? {};
    const boards = boardFilter ? [boardFilter] : Object.keys(byBoard);
    for (const b of boards) {
      const byProgram = byBoard[b] ?? {};
      const programs = programFilter ? [programFilter] : Object.keys(byProgram);
      for (const p of programs) {
        const byClass = byProgram[p] ?? {};
        const classes = classFilter ? [classFilter] : Object.keys(byClass);
        for (const c of classes) for (const dep of byClass[c] ?? []) out.add(dep);
      }
    }
  }
  return [...out].sort();
}
