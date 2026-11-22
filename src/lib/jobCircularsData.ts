// Eduvelto — Job circulars data (Step 14): Firestore loaders.
//
// One-shot getDoc/getDocs only — NO onSnapshot (read costs on
// unstable networks; the Step 11 pattern). One == filter
// (reviewStatus) + an optional second == filter (examSlug) —
// two equality filters need NO composite index (same pattern as
// listPublishedMocks in jobMock.ts). Sorting and the
// status/verification/search filters run client-side over the
// fetched page (see sortCirculars / filterCirculars in
// jobCirculars.ts): status is computed from dates, so it can
// never be a Firestore filter.
//
// Pagination: limit(15) + "Load more" (startAfter cursor on the
// last doc of the previous page — implicit __name__ order, no
// orderBy needed). A page is 15 PUBLISHED docs; a status filter
// may show fewer visible cards per page — the page says so
// ("আরও বিজ্ঞপ্তি লোড করুন" keeps fetching until the filter
// matches or the list ends).
//
// Circulars are PUBLIC information: the list and detail pages
// work signed-out. Drafts are never returned — the rules deny
// non-moderator reads of non-published docs, so a query that
// could return a draft would fail; the reviewStatus filter is
// what keeps the query allowed.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  startAfter,
  where,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { circularFromStored, type JobCircular } from './jobCirculars';

export const CIRCULARS_PAGE_SIZE = 15;

/** Load one page of PUBLISHED circulars, optionally for one
 * exam. Returns the validated items (malformed docs are
 * skipped, never rendered) + a cursor for the next page. */
export async function listPublishedCirculars(args?: {
  examSlug?: string | null;
  pageSize?: number;
  cursor?: DocumentSnapshot | null;
}): Promise<{ items: JobCircular[]; cursor: DocumentSnapshot | null; hasMore: boolean }> {
  const firestore = db;
  if (!firestore) return { items: [], cursor: null, hasMore: false };
  const size = args?.pageSize ?? CIRCULARS_PAGE_SIZE;
  const constraints = [where('reviewStatus', '==', 'published')];
  if (args?.examSlug) constraints.push(where('examSlug', '==', args.examSlug));
  // Fetch one extra doc to know whether another page exists.
  const q =
    args?.cursor != null
      ? query(collection(firestore, 'circulars'), ...constraints, startAfter(args.cursor), limit(size + 1))
      : query(collection(firestore, 'circulars'), ...constraints, limit(size + 1));
  const snap = await getDocs(q);
  const items: JobCircular[] = [];
  for (const d of snap.docs) {
    const c = circularFromStored(d.id, d.data() as Record<string, unknown>);
    if (c !== null) items.push(c);
  }
  const hasMore = snap.docs.length > size;
  const pageDocs = hasMore ? snap.docs.slice(0, size) : snap.docs;
  return { items: items.slice(0, size), cursor: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null, hasMore };
}

/** Load one PUBLISHED circular by ID. Returns null when the
 * doc is missing, invalid, or not published (a draft is never
 * shown to students — the detail page renders its honest
 * "not found" state instead). */
export async function loadPublishedCircular(circularId: string): Promise<JobCircular | null> {
  const firestore = db;
  if (!firestore) return null;
  const snap = await getDoc(doc(firestore, 'circulars', circularId));
  if (!snap.exists()) return null;
  const c = circularFromStored(snap.id, snap.data() as Record<string, unknown>);
  if (!c || c.reviewStatus !== 'published') return null;
  return c;
}
