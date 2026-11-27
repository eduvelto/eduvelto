/**
 * Assignment Cover Generator — pure logic (validation + filename).
 * PDF rendering (jspdf, dynamic import) lives in the UI component.
 * Pure functions only: no network, no storage, no DOM.
 */

export interface AssignmentCoverData {
  studentName: string;
  studentId: string;
  courseTitle: string;
  assignmentTitle: string;
  teacherName: string;
  institution: string;
  date: string;
}

export function validateAssignmentCover(data: AssignmentCoverData): string[] {
  const missing: string[] = [];
  if (data.studentName.trim() === '') missing.push('studentName');
  if (data.courseTitle.trim() === '') missing.push('courseTitle');
  if (data.assignmentTitle.trim() === '') missing.push('assignmentTitle');
  if (data.institution.trim() === '') missing.push('institution');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || Number.isNaN(Date.parse(data.date))) missing.push('date');
  return missing;
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Hand-check: "Rahim Uddin" -> "assignment-cover-rahim-uddin.pdf". */
export function buildAssignmentCoverFilename(studentName: string): string {
  const slug = slugify(studentName);
  return slug === '' ? 'assignment-cover.pdf' : `assignment-cover-${slug}.pdf`;
}
