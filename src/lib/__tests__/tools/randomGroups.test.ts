import { describe, it, expect } from 'vitest';
import { makeRandomGroups, parseGroupNames } from '../../tools/randomGroups';

describe('makeRandomGroups', () => {
  it('7 students, size 3 -> groups of 3, 3, 1 with everyone included once', () => {
    const students = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const groups = makeRandomGroups(students, 3, 1);
    expect(groups.map((g) => g.members.length)).toEqual([3, 3, 1]);
    expect(groups.flatMap((g) => g.members).sort()).toEqual([...students].sort());
  });
  it('same seed gives the same groups', () => {
    const students = ['A', 'B', 'C', 'D', 'E'];
    expect(makeRandomGroups(students, 2, 99)).toEqual(makeRandomGroups(students, 2, 99));
  });
  it('throws on group size below 2', () => {
    expect(() => makeRandomGroups(['A', 'B'], 1)).toThrow();
  });
});

describe('parseGroupNames', () => {
  it('parses lines', () => {
    expect(parseGroupNames('Rahim\nKarim')).toEqual(['Rahim', 'Karim']);
  });
});
