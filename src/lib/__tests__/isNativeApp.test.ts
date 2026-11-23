// Unit tests for isNativeApp() — the Capacitor WebView detector used by
// /install (InstallPage) and the "অ্যাপ আপডেট" section
// (AppUpdateSection). Runs in the plain Node environment (test:unit);
// `window` is mocked on globalThis per case.
// Run: npx vitest run src/lib/__tests__/isNativeApp.test.ts --environment node
import { describe, it, expect, afterEach } from 'vitest';
import { isNativeApp } from '../isNativeApp';

type GlobalWindow = { window?: unknown };

function setWindow(win: unknown) {
  (globalThis as unknown as GlobalWindow).window = win;
}

function clearWindow() {
  delete (globalThis as unknown as GlobalWindow).window;
}

describe('isNativeApp', () => {
  const originalWindow = (globalThis as unknown as GlobalWindow).window;

  afterEach(() => {
    if (originalWindow === undefined) {
      clearWindow();
    } else {
      setWindow(originalWindow);
    }
  });

  it('returns false with no window (Node / SSR)', () => {
    clearWindow();
    expect(isNativeApp()).toBe(false);
  });

  it('returns false in a plain browser window (no Capacitor bridge)', () => {
    setWindow({ navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/120.0 Mobile' } });
    expect(isNativeApp()).toBe(false);
  });

  it('returns true when the Capacitor bridge reports a native platform', () => {
    setWindow({ Capacitor: { isNativePlatform: () => true } });
    expect(isNativeApp()).toBe(true);
  });

  it('returns false when the bridge reports a web platform', () => {
    setWindow({ Capacitor: { isNativePlatform: () => false } });
    expect(isNativeApp()).toBe(false);
  });

  it('returns true when the bridge exists but isNativePlatform is absent (older bridge)', () => {
    setWindow({ Capacitor: {} });
    expect(isNativeApp()).toBe(true);
  });

  it('returns true when isNativePlatform throws (bridge presence is the signal)', () => {
    setWindow({
      Capacitor: {
        isNativePlatform: () => {
          throw new Error('bridge not ready');
        },
      },
    });
    expect(isNativeApp()).toBe(true);
  });
});
