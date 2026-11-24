// Unit tests for downloadBlobInApp() — the in-app file download path
// for the Capacitor app (app audit, 24 Nov 2026): a stock Android
// WebView cannot download blob: URLs, so in the app the file is written
// to the app cache and opened in the system share sheet. Runs in the
// plain Node environment (test:unit); `window` is mocked on globalThis
// per case and '@capacitor/filesystem' / '@capacitor/share' are mocked
// with vi.mock (the real modules are only loaded by dynamic import).
// Run: npx vitest run src/lib/__tests__/nativeFileDownload.test.ts --environment node
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

const writeFile = vi.fn();
const getUri = vi.fn();
const share = vi.fn();

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: { writeFile, getUri },
  Directory: { Cache: 'CACHE' },
}));

vi.mock('@capacitor/share', () => ({
  Share: { share },
}));

type GlobalWindow = { window?: unknown };

function setWindow(win: unknown) {
  (globalThis as unknown as GlobalWindow).window = win;
}

function clearWindow() {
  delete (globalThis as unknown as GlobalWindow).window;
}

describe('downloadBlobInApp', () => {
  const originalWindow = (globalThis as unknown as GlobalWindow).window;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    writeFile.mockResolvedValue(undefined);
    getUri.mockResolvedValue({ uri: 'file:///cache/shared/test.pdf' });
    share.mockResolvedValue(undefined);
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      clearWindow();
    } else {
      setWindow(originalWindow);
    }
  });

  it('returns false in a plain browser (no Capacitor bridge)', async () => {
    setWindow({ navigator: { userAgent: 'Mozilla/5.0' } });
    const { downloadBlobInApp } = await import('../nativeFileDownload');
    const blob = new Blob(['hello'], { type: 'application/pdf' });
    expect(await downloadBlobInApp(blob, 'test.pdf')).toBe(false);
    expect(writeFile).not.toHaveBeenCalled();
    expect(share).not.toHaveBeenCalled();
  });

  it('writes base64 to Cache/shared and opens the share sheet in-app', async () => {
    setWindow({ Capacitor: { isNativePlatform: () => true } });
    const { downloadBlobInApp } = await import('../nativeFileDownload');
    const blob = new Blob(['hello'], { type: 'application/pdf' });
    expect(await downloadBlobInApp(blob, 'test.pdf')).toBe(true);
    // 'hello' as base64 is aGVsbG8=
    expect(writeFile).toHaveBeenCalledWith({
      path: 'shared/test.pdf',
      data: 'aGVsbG8=',
      directory: 'CACHE',
    });
    expect(getUri).toHaveBeenCalledWith({
      path: 'shared/test.pdf',
      directory: 'CACHE',
    });
    expect(share).toHaveBeenCalledWith({
      url: 'file:///cache/shared/test.pdf',
      dialogTitle: 'PDF সংরক্ষণ করুন',
    });
  });

  it('returns false when a plugin call fails', async () => {
    writeFile.mockRejectedValue(new Error('no plugin'));
    setWindow({ Capacitor: { isNativePlatform: () => true } });
    const { downloadBlobInApp } = await import('../nativeFileDownload');
    const blob = new Blob(['hello'], { type: 'application/pdf' });
    expect(await downloadBlobInApp(blob, 'test.pdf')).toBe(false);
    expect(share).not.toHaveBeenCalled();
  });
});
