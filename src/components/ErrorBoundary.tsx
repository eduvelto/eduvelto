// Eduvelto — top-level React ErrorBoundary (P0-3, 27 Nov 2026).
//
// One boundary, outermost in src/main.tsx, wrapping all providers +
// <App />. A render error in any route (including a lazy-chunk load
// failure, which Suspense does NOT catch) shows the fallback UI below
// instead of unmounting the whole app to a blank page.
//
// Design notes:
// - The fallback uses NO providers, NO hooks, NO i18n — plain HTML +
//   inline styles — so it still renders when a provider is what crashed.
// - "Try again" resets the boundary state. If the route is genuinely
//   broken it will crash again into the same fallback (correct — and it
//   cannot loop without a click). No auto-retry, no route-change reset.
// - Errors are logged to console only. There is no error-reporting
//   endpoint on the platform (no Sentry, no logging endpoint) — do not
//   invent one, and do not POST errors to Firestore from an error path.
// - This boundary does NOT catch errors during SSR renderToString
//   (verified with the repo's React version: renderToString throws out
//   of the boundary). The prerender script's per-URL catch is the SSR
//   safety net; do not wrap src/entry-server.tsx expecting help there.

import React, { type ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/** The fallback page, exported for tests (renderToStaticMarkup). */
export function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '48px 16px 40px',
        textAlign: 'center',
        fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 28, margin: '16px 0 4px', lineHeight: 1.3 }}>
        কিছু একটা ভুল হয়েছে
      </h1>
      <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px' }}>
        Something went wrong. The page could not be loaded.
      </p>
      <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 20px' }}>
        আবার চেষ্টা করুন — সাধারণত রিলোড করলেই ঠিক হয়ে যায়। সমস্যা থাকলে হোমে
        গিয়ে আবার আসুন।
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        <button
          type="button"
          onClick={onRetry}
          style={{
            padding: '10px 18px',
            minHeight: 48,
            borderRadius: 6,
            background: '#142b3b',
            color: '#fff',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          আবার চেষ্টা করুন
        </button>
        <a
          href="/"
          style={{
            padding: '10px 18px',
            minHeight: 48,
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: 6,
            background: '#fff',
            color: '#142b3b',
            fontWeight: 600,
            textDecoration: 'none',
            border: '1px solid #cbd5dd',
          }}
        >
          হোমে যান
        </a>
      </div>
    </main>
  );
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Console only — there is no error-reporting endpoint on this platform.
    console.error('Eduvelto ErrorBoundary caught a render error:', error, info.componentStack);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}
