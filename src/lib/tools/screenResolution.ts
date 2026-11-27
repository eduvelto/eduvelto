/**
 * Screen Resolution Checker — reports the VISITOR's own screen via
 * window.screen (read in the UI only). This file is pure: it formats a
 * ScreenInfo object into display values, so it can be tested in Node.
 */
export interface ScreenInfo {
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  colorDepth: number;
  pixelDepth: number;
  devicePixelRatio: number;
  orientation: string;
}

export function readScreenInfo(): ScreenInfo | null {
  if (typeof window === 'undefined' || !window.screen) return null;
  return {
    width: window.screen.width,
    height: window.screen.height,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight,
    colorDepth: window.screen.colorDepth,
    pixelDepth: window.screen.pixelDepth,
    devicePixelRatio: window.devicePixelRatio || 1,
    orientation: window.screen.orientation?.type ?? 'unknown',
  };
}

export function screenSummary(info: ScreenInfo): string {
  return `${info.width} × ${info.height}`;
}

export function isCommonResolution(info: ScreenInfo): boolean {
  const common = ['1920×1080', '1366×768', '1440×900', '1536×864', '1280×720', '360×640', '390×844', '412×915'];
  return common.includes(`${info.width}×${info.height}`);
}
