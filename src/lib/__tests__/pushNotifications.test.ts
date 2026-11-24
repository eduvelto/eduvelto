// Unit tests for setupPushNotifications() — the Phase A topic-based
// push registration for the Capacitor app (app audit, 24 Nov 2026).
// Runs in the plain Node environment (test:unit); `window` is mocked on
// globalThis per case and '@capacitor/push-notifications' is mocked with
// vi.mock (the real module is only loaded by dynamic import inside
// setupPushNotifications).
// Run: npx vitest run src/lib/__tests__/pushNotifications.test.ts --environment node
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

type ListenerCallback = (event: unknown) => void;

const listeners = new Map<string, ListenerCallback>();
const requestPermissions = vi.fn();
const register = vi.fn();
const addListener = vi.fn(
  async (event: string, callback: ListenerCallback) => {
    listeners.set(event, callback);
    return { remove: vi.fn(async () => undefined) };
  },
);

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    requestPermissions,
    register,
    addListener,
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
    setTimeout(() => setTimeout(resolve, 0), 50);
  });

describe('setupPushNotifications', () => {
  const originalWindow = (globalThis as unknown as GlobalWindow).window;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    listeners.clear();
    requestPermissions.mockResolvedValue({ receive: 'granted' });
    register.mockResolvedValue(undefined);
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      clearWindow();
    } else {
      setWindow(originalWindow);
    }
  });

  it('does nothing in a plain browser (no Capacitor bridge)', async () => {
    setWindow({ navigator: { userAgent: 'Mozilla/5.0' } });
    const { setupPushNotifications } = await import('../pushNotifications');
    const cleanup = setupPushNotifications(vi.fn());
    await flush();
    expect(requestPermissions).not.toHaveBeenCalled();
    expect(register).not.toHaveBeenCalled();
    cleanup();
  });

  it('requests permission and registers; the topic name matches MainActivity', async () => {
    setWindow({ Capacitor: { isNativePlatform: () => true } });
    const { setupPushNotifications, PUSH_TOPIC } = await import(
      '../pushNotifications'
    );
    // Drift guard: MainActivity.java subscribes natively to this same
    // literal (the Capacitor plugin has no topic API).
    expect(PUSH_TOPIC).toBe('eduvelto-announcements');
    const cleanup = setupPushNotifications(vi.fn());
    await flush();
    expect(requestPermissions).toHaveBeenCalledTimes(1);
    expect(register).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it('does not register when the user denies the permission', async () => {
    requestPermissions.mockResolvedValue({ receive: 'denied' });
    setWindow({ Capacitor: { isNativePlatform: () => true } });
    const { setupPushNotifications } = await import('../pushNotifications');
    const cleanup = setupPushNotifications(vi.fn());
    await flush();
    expect(requestPermissions).toHaveBeenCalledTimes(1);
    expect(register).not.toHaveBeenCalled();
    cleanup();
  });

  it('stays silent when registration throws (no google-services.json yet)', async () => {
    register.mockRejectedValue(new Error('FCM not configured'));
    setWindow({ Capacitor: { isNativePlatform: () => true } });
    const { setupPushNotifications } = await import('../pushNotifications');
    const cleanup = setupPushNotifications(vi.fn());
    await flush();
    expect(register).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it('navigates to the tap link, and only to same-app paths', async () => {
    setWindow({ Capacitor: { isNativePlatform: () => true } });
    const navigate = vi.fn();
    const { setupPushNotifications } = await import('../pushNotifications');
    const cleanup = setupPushNotifications(navigate);
    await flush();
    const tap = listeners.get('pushNotificationActionPerformed');
    expect(tap).toBeDefined();
    tap?.({
      notification: { data: { link: '/jobs/circulars/abc' } },
    });
    expect(navigate).toHaveBeenCalledWith('/jobs/circulars/abc');
    tap?.({
      notification: { data: { link: 'https://evil.example/x' } },
    });
    tap?.({ notification: { data: {} } });
    expect(navigate).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it('a second setup call is a no-op (single registration per page load)', async () => {
    setWindow({ Capacitor: { isNativePlatform: () => true } });
    const { setupPushNotifications } = await import('../pushNotifications');
    const cleanup1 = setupPushNotifications(vi.fn());
    const cleanup2 = setupPushNotifications(vi.fn());
    await flush();
    expect(requestPermissions).toHaveBeenCalledTimes(1);
    cleanup1();
    cleanup2();
  });
});
