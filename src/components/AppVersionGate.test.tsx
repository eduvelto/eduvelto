// Render tests for the forced-app-update block screen + update bar.
// No DOM needed: react-dom/server renders to static HTML, and the
// components use plain Bangla text (no LanguageContext), so they render
// in a plain Node vitest environment. MemoryRouter provides the router
// context for the download <Link>.
// Run: npx vitest run src/components/AppVersionGate.test.tsx
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AppVersionBlockedScreen, AppVersionUpdateBar, isGateExemptPath } from './AppVersionGate';
import type { AppVersionConfig } from '../lib/appVersion';

const forcedConfig: AppVersionConfig = {
  latestVersion: '0.2.0',
  minVersion: '0.2.0',
  releaseNotes: 'নতুন চ্যাপ্টার ও পরীক্ষা যোগ হয়েছে।',
  downloadUrl: '/install',
  updatedAt: null,
};

describe('AppVersionBlockedScreen', () => {
  it('renders the Bangla block message, release notes and a working download link', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AppVersionBlockedScreen config={forcedConfig} />
      </MemoryRouter>,
    );
    expect(html).toContain('নতুন ভার্সন এসেছে');
    expect(html).toContain('এই পুরোনো ভার্সনটি আর ব্যবহার করা যাবে না');
    expect(html).toContain('নতুন চ্যাপ্টার ও পরীক্ষা যোগ হয়েছে।');
    expect(html).toContain('নতুন ভার্সন ডাউনলোড করুন');
    expect(html).toContain('href="/install"');
    expect(html).toContain('0.2.0');
  });

  it('renders even without a config (defensive)', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AppVersionBlockedScreen config={null} />
      </MemoryRouter>,
    );
    expect(html).toContain('নতুন ভার্সন এসেছে');
    expect(html).toContain('href="/install"');
  });

  it('uses a plain <a> for an absolute download URL', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AppVersionBlockedScreen
          config={{ ...forcedConfig, downloadUrl: 'https://example.com/app' }}
        />
      </MemoryRouter>,
    );
    expect(html).toContain('href="https://example.com/app"');
  });
});

describe('AppVersionUpdateBar', () => {
  it('shows the newer version and links to /install', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AppVersionUpdateBar config={forcedConfig} />
      </MemoryRouter>,
    );
    expect(html).toContain('নতুন ভার্সন এসেছে');
    expect(html).toContain('0.2.0');
    expect(html).toContain('href="/install"');
  });
});

describe('isGateExemptPath', () => {
  it('exempts the download destination, sign-in and admin routes', () => {
    expect(isGateExemptPath('/install')).toBe(true);
    expect(isGateExemptPath('/login')).toBe(true);
    expect(isGateExemptPath('/admin/app-version')).toBe(true);
    expect(isGateExemptPath('/admin')).toBe(true);
  });
  it('does not exempt content routes', () => {
    expect(isGateExemptPath('/')).toBe(false);
    expect(isGateExemptPath('/library')).toBe(false);
    expect(isGateExemptPath('/profile')).toBe(false);
    expect(isGateExemptPath('/quiz/abc')).toBe(false);
  });
});
