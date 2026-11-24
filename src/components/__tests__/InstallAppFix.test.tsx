// Render tests for the in-app branches of /install (InstallPage) and the
// "অ্যাপ আপডেট" section (AppUpdateSection).
//
// No DOM needed: react-dom/server renders to static HTML in a plain Node
// vitest environment (same pattern as AppVersionGate.test.tsx).
// `window` is mocked on globalThis per case — the browser case has no
// Capacitor bridge; the app case has window.Capacitor injected, exactly
// as the Capacitor WebView does before page scripts run. `matchMedia`
// is mocked because InstallPage reads it during render (isStandalone).
// Effects never run under renderToStaticMarkup, so AppUpdateSection's
// Firestore fetch is not exercised here — the assertions cover the
// static branches (in-app: version only; browser: loading state +
// /install link).
// Run: npx vitest run src/components/__tests__/InstallAppFix.test.tsx
import { describe, it, expect, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import InstallPage from '../../pages/InstallPage';
import AppUpdateSection from '../AppUpdateSection';

type GlobalWindow = { window?: unknown };

function mockWindow(capacitor: boolean) {
  const win: Record<string, unknown> = {
    matchMedia: () => ({ matches: false }),
    navigator: {
      userAgent:
        'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',
    },
  };
  if (capacitor) win.Capacitor = { isNativePlatform: () => true };
  (globalThis as unknown as GlobalWindow).window = win;
}

function renderWithRouter(node: React.ReactElement): string {
  return renderToStaticMarkup(<MemoryRouter>{node}</MemoryRouter>);
}

describe('InstallPage', () => {
  const originalWindow = (globalThis as unknown as GlobalWindow).window;

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as unknown as GlobalWindow).window;
    } else {
      (globalThis as unknown as GlobalWindow).window = originalWindow;
    }
  });

  it('browser: shows the unchanged PWA install instructions', () => {
    mockWindow(false);
    const html = renderWithRouter(<InstallPage />);
    expect(html).toContain('অ্যাপ ইনস্টল করুন');
    expect(html).toContain('Play Store অ্যাপ নেই');
    expect(html).toContain('Android / কম্পিউটারে ইনস্টল');
    expect(html).not.toContain('ইতিমধ্যেই Eduvelto অ্যাপ ব্যবহার করছেন');
  });

  it('browser: the update section still offers the /install link', () => {
    mockWindow(false);
    const html = renderWithRouter(<InstallPage />);
    expect(html).toContain('সর্বশেষ ভার্সনের তথ্য আনা হচ্ছে');
    expect(html).toContain('href="/install"');
  });

  it('in-app: shows the "already using the app" view with a Home button, no install steps', () => {
    mockWindow(true);
    const html = renderWithRouter(<InstallPage />);
    expect(html).toContain('আপনি ইতিমধ্যেই Eduvelto অ্যাপ ব্যবহার করছেন');
    expect(html).toContain('হোমে ফিরুন');
    expect(html).toContain('href="/"');
    expect(html).not.toContain('Play Store অ্যাপ নেই');
    expect(html).not.toContain('Android / কম্পিউটারে ইনস্টল');
    expect(html).not.toContain('অ্যাপ ইনস্টল করুন');
  });

  it('in-app: the update section shows the bundled version only', () => {
    mockWindow(true);
    const html = renderWithRouter(<InstallPage />);
    expect(html).toContain('আপনার ভার্সন:');
    expect(html).toContain('v0.1.0');
    expect(html).toContain('আপনি Eduvelto অ্যাপ ব্যবহার করছেন।');
    expect(html).not.toContain('সর্বশেষ ভার্সন');
  });
});

describe('AppUpdateSection', () => {
  const originalWindow = (globalThis as unknown as GlobalWindow).window;

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as unknown as GlobalWindow).window;
    } else {
      (globalThis as unknown as GlobalWindow).window = originalWindow;
    }
  });

  it('browser: shows the bundled version, the loading state and the /install link', () => {
    mockWindow(false);
    const html = renderWithRouter(<AppUpdateSection />);
    expect(html).toContain('আপনার ভার্সন:');
    expect(html).toContain('v0.1.0');
    expect(html).toContain('সর্বশেষ ভার্সনের তথ্য আনা হচ্ছে');
    expect(html).toContain('href="/install"');
  });

  it('in-app: shows the bundled version only — no latest-version claim, no /install link', () => {
    mockWindow(true);
    const html = renderWithRouter(<AppUpdateSection />);
    expect(html).toContain('আপনার ভার্সন:');
    expect(html).toContain('v0.1.0');
    expect(html).toContain('আপনি Eduvelto অ্যাপ ব্যবহার করছেন।');
    expect(html).not.toContain('সর্বশেষ ভার্সন');
    expect(html).not.toContain('href="/install"');
  });
});
