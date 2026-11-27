/**
 * Academic Calendar Maker — pure logic.
 * An academic year is a list of dated events (exam / holiday / event).
 * Pure functions only: no network, no storage, no DOM.
 */

export type AcademicEventType = 'exam' | 'holiday' | 'event';

export interface AcademicEvent {
  date: string;
  title: string;
  type: AcademicEventType;
}

export const ACADEMIC_EVENT_TYPES: readonly AcademicEventType[] = ['exam', 'holiday', 'event'];

export function validateAcademicEvent(event: AcademicEvent): string[] {
  const missing: string[] = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date) || Number.isNaN(Date.parse(event.date))) missing.push('date');
  if (event.title.trim() === '') missing.push('title');
  if (!ACADEMIC_EVENT_TYPES.includes(event.type)) missing.push('type');
  return missing;
}

/** Events sorted by date (earliest first). Throws on invalid events. */
export function sortAcademicEvents(events: AcademicEvent[]): AcademicEvent[] {
  for (const e of events) {
    if (validateAcademicEvent(e).length > 0) throw new Error(`Invalid calendar event: ${e.title || e.date}`);
  }
  return [...events].sort((a, b) => a.date.localeCompare(b.date));
}

/** Count events by type. */
export function countAcademicEvents(events: AcademicEvent[]): Record<AcademicEventType, number> {
  const counts: Record<AcademicEventType, number> = { exam: 0, holiday: 0, event: 0 };
  for (const e of events) counts[e.type] += 1;
  return counts;
}
