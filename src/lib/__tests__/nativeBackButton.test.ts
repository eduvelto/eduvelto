// Unit tests for setupNativeBackButton() — the Android back-button
// listener for the Capacitor app (owner bug 24 Nov 2026 09:40: back on
// any in-app page exited the whole app). Runs in the plain Node
// environment (test:unit); `window` is mocked on globalThis per case
// and '@capacitor/app' is mocked with vi.mock (the real module is only
// loaded by dynamic import inside setupNativeBackButton).
// Run: npx vitest run src/lib/__tests__/nativeBackButton.test.ts --environment node
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

const addListener = vi.fn();
const exitApp = vi.fn();
const remove = vi.fn();

vi.mock('@capacitor/app', () => ({
  App: {
    addListener,
    exitApp,
  },
}));

type GlobalWindow = { window?: unknown };

function setWindow(win: unknown) {
  (globalThis as unknown as GlobalWindow).window = win;
}

function clearWindow() {
  delete (globalThis as unknown as GlobalWindow).window;
}

const flush = () =>
  new Promise<void>((resolve) => {
    // One macrotask is not always enough for the first dynamic import of
    // the mocked '@capacitor/app' in a fresh module registry — give the
    // import promise chain a real tick to resolve.
    setTimeout(() => setTimeout(resolve, 0), 50);
  });

describe('setupNativeBackButton', () => {
  const originalWindow = (globalThis as unknown as GlobalWindow).window;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      clearWindow();
    } else {
      setWindow(originalWindow);
    }
  });

  it('does nothing in a plain browser (no Capacitor bridge)', async () => {
    const historyBack = vi.fn();
    setWindow({ history: { back: historyBack } });
    const { setupNativeBackButton } = await import('../nativeBackButton');
    const cleanup = setupNativeBackButton();
    await flush();
    expect(addListener).not.toHaveBeenCalled();
    expect(historyBack).not.toHaveBeenCalled();
    expect(exitApp).not.toHaveBeenCalled();
    cleanup();
  });

  it('registers the backButton listener inside the native app', async () => {
    const historyBack = vi.fn();
    setWindow({
      Capacitor: { isNativePlatform: () => true },
      history: { back: historyBack },
    });
    addListener.mockResolvedValue({ remove });
    const { setupNativeBackButton } = await import('../nativeBackButton');
    setupNativeBackButton();
    await flush();
    expect(addListener).toHaveBeenCalledTimes(1);
    expect(addListener).toHaveBeenCalledWith('backButton', expect.any(Function));
  });

  it('goes back one page when canGoBack is true, never exits', async () => {
    const historyBack = vi.fn();
    setWindow({
      Capacitor: { isNativePlatform: () => true },
      history: { back: historyBack },
    });
    addListener.mockResolvedValue({ remove });
    const { setupNativeBackButton } = await import('../nativeBackButton');
    setupNativeBackButton();
    await flush();
    const listener = addListener.mock.calls[0][1] as (e: { canGoBack: boolean }) => void;
    listener({ canGoBack: true });
    expect(historyBack).toHaveBeenCalledTimes(1);
    expect(exitApp).not.toHaveBeenCalled();
  });

  it('exits the app when canGoBack is false (home page)', async () => {
    const historyBack = vi.fn();
    setWindow({
      Capacitor: { isNativePlatform: () => true },
      history: { back: historyBack },
    });
    addListener.mockResolvedValue({ remove });
    const { setupNativeBackButton } = await import('../nativeBackButton');
    setupNativeBackButton();
    await flush();
    const listener = addListener.mock.calls[0][1] as (e: { canGoBack: boolean }) => void;
    listener({ canGoBack: false });
    expect(exitApp).toHaveBeenCalledTimes(1);
    expect(historyBack).not.toHaveBeenCalled();
  });

  it('registers only once across repeated setup calls', async () => {
    setWindow({
      Capacitor: { isNativePlatform: () => true },
      history: { back: vi.fn() },
    });
    addListener.mockResolvedValue({ remove });
    const { setupNativeBackButton } = await import('../nativeBackButton');
    setupNativeBackButton();
    setupNativeBackButton();
    await flush();
    expect(addListener).toHaveBeenCalledTimes(1);
  });

  it('cleanup removes the listener', async () => {
    setWindow({
      Capacitor: { isNativePlatform: () => true },
      history: { back: vi.fn() },
    });
    addListener.mockResolvedValue({ remove });
    const { setupNativeBackButton } = await import('../nativeBackButton');
    const cleanup = setupNativeBackButton();
    await flush();
    expect(addListener).toHaveBeenCalledTimes(1);
    cleanup();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
