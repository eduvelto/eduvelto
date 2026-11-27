/**
 * Random Student Group Maker — pure logic.
 * Seeded Fisher-Yates shuffle (mulberry32) so tests are deterministic;
 * the UI shuffles with a random seed. Pure functions only.
 */

export interface StudentGroup {
  groupNo: number;
  members: string[];
}

/** Parse pasted student names (one per line or comma separated). */
export function parseGroupNames(text: string): string[] {
  const names = text.split(/[\n,;]+/).map((n) => n.trim()).filter(Boolean);
  if (names.length === 0) throw new Error('Enter at least one student name');
  return names;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Split students into groups of `groupSize` (last group may be
 * smaller). Hand-check: 7 students, size 3, seed 1 -> groups of 3,3,1.
 */
export function makeRandomGroups(students: string[], groupSize: number, seed?: number): StudentGroup[] {
  if (students.length === 0) throw new Error('Enter at least one student name');
  if (!Number.isInteger(groupSize) || groupSize < 2 || groupSize > 20) {
    throw new Error('Group size must be 2–20');
  }
  const rand = mulberry32(seed ?? Math.floor(Math.random() * 2 ** 31));
  const shuffled = [...students];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const groups: StudentGroup[] = [];
  for (let i = 0; i < shuffled.length; i += groupSize) {
    groups.push({ groupNo: groups.length + 1, members: shuffled.slice(i, i + groupSize) });
  }
  return groups;
}
