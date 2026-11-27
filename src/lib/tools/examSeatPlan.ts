/**
 * Exam Seat Plan Generator — pure logic.
 * Assigns students to seats row by row; room capacity must fit the
 * class. Pure functions only: no network, no storage, no DOM.
 */

export interface SeatAssignment {
  seatNo: number;
  row: number;
  col: number;
  student: string;
}

export interface SeatPlanResult {
  seats: SeatAssignment[];
  rows: number;
  cols: number;
  capacity: number;
  emptySeats: number;
}

/** Parse pasted student names (one per line or comma separated). */
export function parseStudentNames(text: string): string[] {
  const names = text.split(/[\n,;]+/).map((n) => n.trim()).filter(Boolean);
  if (names.length === 0) throw new Error('Enter at least one student name');
  return names;
}

/**
 * Hand-check: 5 students, 2 rows x 3 cols -> seats 1-5 filled,
 * capacity 6, 1 empty seat.
 */
export function generateSeatPlan(students: string[], rows: number, cols: number): SeatPlanResult {
  if (!Number.isInteger(rows) || rows < 1 || rows > 30) throw new Error('Rows must be 1–30');
  if (!Number.isInteger(cols) || cols < 1 || cols > 20) throw new Error('Columns must be 1–20');
  const capacity = rows * cols;
  if (students.length > capacity) {
    throw new Error(`Room fits ${capacity} seats but there are ${students.length} students`);
  }
  const seats: SeatAssignment[] = students.map((student, i) => ({
    seatNo: i + 1,
    row: Math.floor(i / cols) + 1,
    col: (i % cols) + 1,
    student,
  }));
  return { seats, rows, cols, capacity, emptySeats: capacity - students.length };
}
