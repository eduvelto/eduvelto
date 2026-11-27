/**
 * Video Format Converter — pure logic + injectable-DOM wiring (100-Tools
 * Project, second batch).
 *
 * Approach: re-encode the user's video with MediaRecorder. WebM is the
 * native output and is offered everywhere; MP4 is offered ONLY where the
 * browser reports it can record it — MediaRecorder.isTypeSupported(
 * 'video/mp4') (Safari supports it; Chrome/Firefox generally do not).
 * No ffmpeg, no dependency, no fake conversions.
 *
 * The UI must state which output formats THIS browser supports BEFORE
 * the user starts — `detectSupportedFormats` is the helper for that.
 * The format-support check is injectable so it is unit-testable in Node.
 */

import { assertVideoFile, buildWebmFilename, WEBM_MIME_TYPE } from './videoCommon';

export type VideoOutputFormat = 'webm' | 'mp4';

export interface SupportedVideoFormat {
  format: VideoOutputFormat;
  mimeType: string;
  label: string;
  extension: string;
}

export const WEBM_FORMAT: SupportedVideoFormat = {
  format: 'webm',
  mimeType: WEBM_MIME_TYPE,
  label: 'WebM',
  extension: 'webm',
};

export const MP4_FORMAT: SupportedVideoFormat = {
  format: 'mp4',
  mimeType: 'video/mp4',
  label: 'MP4',
  extension: 'mp4',
};

export interface VideoFormatSupport {
  webm: boolean;
  mp4: boolean;
  /** Formats this browser can actually produce, in offer order. */
  supported: SupportedVideoFormat[];
}

export interface VideoConvertResult {
  /** The re-encoded video, in the requested format. */
  blob: Blob;
  format: VideoOutputFormat;
  mimeType: string;
}

/** Minimal DOM surface the converter needs (injectable for tests). */
export interface VideoFormatConverterDeps {
  /** Load a video file; resolve with the element once metadata is ready. */
  loadVideo?: (file: Blob) => Promise<HTMLVideoElement>;
  /**
   * Re-record the whole loaded video with MediaRecorder at `mimeType`
   * and resolve with the recorded blob. The default plays the video,
   * captures its stream and records until it ends.
   */
  recordWholeVideo?: (video: HTMLVideoElement, mimeType: string) => Promise<Blob>;
  /**
   * Pre-detected browser support (injectable for tests — Node has no
   * MediaRecorder, so tests pass the support they want to exercise).
   * Defaults to detecting against the real MediaRecorder.
   */
  support?: VideoFormatSupport;
}

/**
 * Detect which output formats this browser can produce, given a
 * `isTypeSupported` function (default: MediaRecorder.isTypeSupported).
 * Pure with the check injected: hand-check — a checker that returns
 * true only for WebM reports { webm: true, mp4: false, supported:
 * [WEBM_FORMAT] }; one that returns true for both lists both.
 */
export function detectSupportedFormats(
  isTypeSupported: (mimeType: string) => boolean,
): VideoFormatSupport {
  let webm = false;
  let mp4 = false;
  try {
    webm = isTypeSupported(WEBM_MIME_TYPE);
  } catch {
    webm = false;
  }
  try {
    mp4 = isTypeSupported(MP4_FORMAT.mimeType);
  } catch {
    mp4 = false;
  }
  const supported: SupportedVideoFormat[] = [];
  if (webm) supported.push(WEBM_FORMAT);
  if (mp4) supported.push(MP4_FORMAT);
  return { webm, mp4, supported };
}

/**
 * Detect support using the real MediaRecorder when present; when
 * MediaRecorder is absent (or its check is missing) report nothing
 * supported instead of guessing.
 */
export function detectSupportedFormatsInBrowser(): VideoFormatSupport {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return { webm: false, mp4: false, supported: [] };
  }
  return detectSupportedFormats((mimeType) => MediaRecorder.isTypeSupported(mimeType));
}

/**
 * Resolve the requested format against what the browser supports.
 * Throws an honest error when the format is not supported here.
 */
export function resolveOutputFormat(
  requested: VideoOutputFormat,
  support: VideoFormatSupport,
): SupportedVideoFormat {
  const found = support.supported.find((f) => f.format === requested);
  if (!found) {
    throw new Error(
      requested === 'mp4'
        ? 'MP4 output is not supported in this browser — WebM is the available output here'
        : 'WebM output is not supported in this browser, so the video cannot be converted here',
    );
  }
  return found;
}

/** Output filename: "clip.mov" + webm -> "clip.webm"; + mp4 -> "clip.mp4". */
export function buildConvertedFilename(originalName: string, format: VideoOutputFormat): string {
  if (format === 'mp4') {
    const base = originalName.replace(/\.[^.]*$/, '') || 'video';
    return `${base}.mp4`;
  }
  return buildWebmFilename(originalName, '-converted');
}

function defaultLoadVideo(file: Blob): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not decode this video — it may be corrupt or in an unsupported format'));
    };
    video.src = url;
  });
}

/** Default whole-video recording: play, captureStream, record until ended. */
async function defaultRecordWholeVideo(
  video: HTMLVideoElement,
  mimeType: string,
): Promise<Blob> {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('MediaRecorder is not available in this browser, so the video cannot be converted');
  }
  // captureStream is a real browser API on HTMLMediaElement, but this
  // project's TS DOM lib does not declare it — cast instead of lying
  // about support.
  const stream = (video as HTMLVideoElement & { captureStream: () => MediaStream }).captureStream();
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];
  const done = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () =>
      reject(new Error('Recording failed in this browser — try a different browser'));
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });
  const stopRecording = (): void => {
    if (recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch {
        /* already stopped */
      }
    }
  };
  video.addEventListener('ended', stopRecording, { once: true });
  recorder.start();
  try {
    video.currentTime = 0;
    await video.play();
  } catch {
    stopRecording();
    throw new Error('Could not play this video in the browser');
  }
  return done;
}

/**
 * Convert a video to the requested format. MP4 is only attempted when
 * the browser reports it; otherwise the call throws honestly.
 */
export async function convertVideo(
  file: Blob,
  format: VideoOutputFormat,
  deps: VideoFormatConverterDeps = {},
): Promise<VideoConvertResult> {
  assertVideoFile(file);
  const support = deps.support ?? detectSupportedFormatsInBrowser();
  const resolved = resolveOutputFormat(format, support);
  const loadVideo = deps.loadVideo ?? defaultLoadVideo;
  const recordWholeVideo = deps.recordWholeVideo ?? defaultRecordWholeVideo;
  const video = await loadVideo(file);
  const blob = await recordWholeVideo(video, resolved.mimeType);
  return { blob, format: resolved.format, mimeType: resolved.mimeType };
}
