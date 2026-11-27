import { describe, it, expect } from 'vitest';
import { buildAssignmentCoverFilename, validateAssignmentCover } from '../../tools/assignmentCover';

describe('validateAssignmentCover', () => {
  it('flags missing required fields', () => {
    const missing = validateAssignmentCover({
      studentName: '', studentId: '', courseTitle: '', assignmentTitle: '',
      teacherName: '', institution: '', date: 'bad',
    });
    expect(missing).toEqual(expect.arrayContaining(['studentName', 'courseTitle', 'assignmentTitle', 'institution', 'date']));
  });
  it('passes a complete cover', () => {
    expect(validateAssignmentCover({
      studentName: 'Rahim', studentId: '', courseTitle: 'English', assignmentTitle: 'Drama',
      teacherName: '', institution: 'College', date: '2026-11-27',
    })).toEqual([]);
  });
});

describe('buildAssignmentCoverFilename', () => {
  it('"Rahim Uddin" -> assignment-cover-rahim-uddin.pdf', () => {
    expect(buildAssignmentCoverFilename('Rahim Uddin')).toBe('assignment-cover-rahim-uddin.pdf');
  });
  it('Bangla-only name falls back safely', () => {
    expect(buildAssignmentCoverFilename('রহিম')).toBe('assignment-cover.pdf');
  });
});
