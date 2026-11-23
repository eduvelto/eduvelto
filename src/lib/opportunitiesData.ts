// Eduvelto — Global Opportunity Hub: Firestore loaders.
//
// One-shot getDoc/getDocs only — NO onSnapshot (read costs on
// unstable networks; the Step 11 pattern). One == filter
// (reviewStatus) + an optional second == filter (type) — two
// equality filters need NO composite index (same pattern as
// listPublishedCirculars in jobCircularsData.ts). Sorting and
// the status/verification/search filters run client-side over
// the fetched page (see sortOpportunities / filterOpportunities
// in opportunities.ts): status is computed from dates, so it
// can never be a Firestore filter.
//
// Capital-'Published': the /opportunities rules use
// isPublished(), which checks reviewStatus == 'Published'.
// The query MUST use 'Published' — lowercase 'published'
// would silently return nothing.
//
// SEED FALLBACK (v1): the verified seed (opportunitySeed.ts)
// is the source of truth until moderators publish docs to
// Firestore. When the collection holds Published docs, they
// take precedence by docId and the seed fills nothing; when
// the collection is empty (or Firestore is unreachable in a
// preview), the seed is shown instead — labelled as the
// verified seed on the hub page, never as live Firestore
// data. The seed script writes exactly these docs to the
// EMULATOR; applying them to production is a separate,
// owner-approved step.

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
import { opportunityFromStored, type Opportunity, type OpportunityType } from './opportunities';
import { seedOpportunities } from './opportunitySeed';

export const OPPORTUNITIES_PAGE_SIZE = 15;

/** Load one page of Published opportunities, optionally for
 * one type. Returns the validated items (malformed docs are
 * skipped, never rendered) + a cursor for the next page. */
export async function listPublishedOpportunities(args?: {
  type?: OpportunityType | null;
  pageSize?: number;
  cursor?: DocumentSnapshot | null;
}): Promise<{ items: Opportunity[]; cursor: DocumentSnapshot | null; hasMore: boolean }> {
  const firestore = db;
  if (!firestore) return { items: [], cursor: null, hasMore: false };
  const size = args?.pageSize ?? OPPORTUNITIES_PAGE_SIZE;
  const constraints = [where('reviewStatus', '==', 'Published')];
  if (args?.type) constraints.push(where('type', '==', args.type));
  const q =
    args?.cursor != null
      ? query(collection(firestore, 'opportunities'), ...constraints, startAfter(args.cursor), limit(size + 1))
      : query(collection(firestore, 'opportunities'), ...constraints, limit(size + 1));
  const snap = await getDocs(q);
  const items: Opportunity[] = [];
  for (const d of snap.docs) {
    const o = opportunityFromStored(d.id, d.data() as Record<string, unknown>);
    if (o !== null) items.push(o);
  }
  const hasMore = snap.docs.length > size;
  const pageDocs = hasMore ? snap.docs.slice(0, size) : snap.docs;
  return { items: items.slice(0, size), cursor: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null, hasMore };
}

/** Load one Published opportunity by ID. Returns null when the
 * doc is missing, invalid, or not Published (a draft is never
 * shown — the detail page renders its honest "not found" state
 * instead). Falls back to the verified seed when Firestore has
 * no such doc, so the seeded detail pages work before any
 * moderator publish. */
export async function loadPublishedOpportunity(oppId: string): Promise<Opportunity | null> {
  const firestore = db;
  if (firestore) {
    try {
      const snap = await getDoc(doc(firestore, 'opportunities', oppId));
      if (snap.exists()) {
        const o = opportunityFromStored(snap.id, snap.data() as Record<string, unknown>);
        if (o && o.reviewStatus === 'Published') return o;
      }
    } catch {
      // Firestore unreachable (preview/offline) — fall through to the seed.
    }
  }
  return seedOpportunities().find((o) => o.docId === oppId) ?? null;
}

/** Load the hub list: Firestore Published docs first; when the
 * collection is empty, the verified seed. `fromSeed` tells the
 * page which source rendered (shown honestly on the page).
 * A type filter applies to both sources. */
export async function loadHubOpportunities(args?: {
  type?: OpportunityType | null;
}): Promise<{ items: Opportunity[]; fromSeed: boolean }> {
  const { items } = await listPublishedOpportunities({ type: args?.type ?? null, pageSize: 100 });
  if (items.length > 0) return { items, fromSeed: false };
  const seed = seedOpportunities();
  const filtered = args?.type ? seed.filter((o) => o.type === args.type) : seed;
  return { items: filtered, fromSeed: true };
}
