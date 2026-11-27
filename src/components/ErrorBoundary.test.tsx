// Tests for the top-level ErrorBoundary (P0-3).
// Follows the repo's component-test pattern: renderToStaticMarkup, no
// DOM/jsdom needed (cf. src/components/AppVersionGate.test.tsx).
//
// Deliberately NOT tested here: "a throwing child renders the fallback
// under renderToStaticMarkup". Verified 27 Nov 2026 with the repo's own
// React version: renderToString/renderToStaticMarkup THROWS out of an
// error boundary instead of rendering the fallback (boundaries do not
// catch in SSR). That is a framework limitation, not a code bug — the
// client-side catch is verified manually in the browser (see the P0-3
// spec §5: temporary throw probe + blocked-chunk probe).
// Run: npx vitest run src/components/ErrorBoundary.test.tsx

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ErrorBoundary, ErrorFallback } from './ErrorBoundary';

describe('ErrorBoundary', () => {
  it('getDerivedStateFromError returns the error state', () => {
    const err = new Error('boom');
    expect(ErrorBoundary.getDerivedStateFromError(err)).toEqual({
      hasError: true,
      error: err,
    });
  });

  it('renders children normally when there is no error', () => {
    const html = renderToStaticMarkup(
      <ErrorBoundary>
        <p>fine</p>
      </ErrorBoundary>,
    );
    expect(html).toContain('fine');
    expect(html).not.toContain('কিছু একটা ভুল হয়েছে');
  });

  it('the fallback shows Bangla + English copy, a retry button and a home link', () => {
    const html = renderToStaticMarkup(<ErrorFallback onRetry={() => undefined} />);
    expect(html).toContain('কিছু একটা ভুল হয়েছে');
    expect(html).toContain('Something went wrong');
    expect(html).toContain('আবার চেষ্টা করুন');
    expect(html).toContain('href="/"');
    expect(html).toContain('হোমে যান');
  });
});
