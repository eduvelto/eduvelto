/**
 * Video Trimmer — pure logic + injectable-DOM wiring (100-Tools Project,
 * second batch).
 *
 * Approach: the user picks start/end seconds (validated 0 <= start < end
 * <= duration); the video is seeked to `start`, its stream is captured
 * with captureStream() and recorded with MediaRecorder until `end`.
 * No ffmpeg, no dependency.
 *
 * HONEST OUTPUT: the trimmed clip is WebM (MediaRecorder's native
 * format), labelled WebM, never claimed to be MP4.
 *
 * The DOM parts are injectable through `deps` so the wiring stays
 * testable in a Node test run without a DOM. A real-browser trim check
 * is still owed before ship — Node has no MediaRecorder.
 */

import { assertVideoFile, buildWebmFilename, WEBM_MIME_TYPE } from './videoCommon';

export interface TrimRange {
  start: number;
  end: number;
}

export interface VideoTrimResult {
  /** The trimmed clip (always WebM). */
  blob: Blob;
  start: number;
  end: number;
  /** Length of the trimmed clip in seconds. */
  trimmedSeconds: number;
  mimeType: typeof WEBM_MIME_TYPE;
}

/** Minimal DOM surface the trimmer needs (injectable for tests). */
export interface VideoTrimmerDeps {
  /** Load a video file; resolve with the element once metadata is ready. */
  loadVideo?: (file: Blob) => Promise<HTMLVideoElement>;
  /**
   * Record the segment [start, end) of a loaded video and resolve with
   * the recorded blob. The default seeks, captures the video stream and
   * records with MediaRecorder until `end`.
   */
  recordSegment?: (video: HTMLVideoElement, start: number, end: number) => Promise<Blob>;
}

/** Clamp a number into [min, max]; non-finite values become `min`. */
export function clampTrimValue(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * Validate and clamp a trim range against the video duration.
 * Returns the clamped range; throws when no valid range remains.
 * Pure: hand-check (5,10,60) -> {5,10}; (-2,10,60) -> {0,10};
 * (5,70,60) -> {5,60}; (10,10,60) throws; (50,20,60) throws;
 * (0,60,60) -> {0,60}.
 */
export function validateTrimRange(start: number, end: number, duration: number): TrimRange {
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Video duration must be a positive number of seconds, got ${duration}`);
  }
  const clampedStart = clampTrimValue(start, 0, duration);
  const clampedEnd = clampTrimValue(end, 0, duration);
  if (clampedStart >= clampedEnd) {
    throw new Error(
      `Start (${clampedStart}s) must be before end (${clampedEnd}s) — pick a start earlier than the end, within 0s to ${duration}s`,
    );
  }
  return { start: clampedStart, end: clampedEnd };
}

/** Length of a trimmed clip in seconds: end - start. */
export function trimDurationSeconds(start: number, end: number): number {
  return end - start;
}

/** Output filename: "my video.mp4" -> "my video-trimmed.webm" (always WebM). */
export function buildTrimmedFilename(originalName: string): string {
  return buildWebmFilename(originalName, '-trimmed');
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

/** Default segment recording: seek to start, captureStream, record to end. */
async function defaultRecordSegment(
  video: HTMLVideoElement,
  start: number,
  end: number,
): Promise<Blob> {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('MediaRecorder is not available in this browser, so the video cannot be trimmed');
  }
  // captureStream is a real browser API on HTMLMediaElement, but this
  // project's TS DOM lib does not declare it — cast instead of lying
  // about support.
  const stream = (video as HTMLVideoElement & { captureStream: () => MediaStream }).captureStream();
  const recorder = new MediaRecorder(stream, { mimeType: WEBM_MIME_TYPE });
  const chunks: Blob[] = [];
  const done = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () =>
      reject(new Error('Recording failed in this browser — try a different browser'));
    recorder.onstop = () => resolve(new Blob(chunks, { type: WEBM_MIME_TYPE }));
  });
  const stopAtEnd = (): void => {
    if (video.currentTime >= end || video.ended) {
      video.pause();
      if (recorder.state !== 'inactive') {
        try {
          recorder.stop();
        } catch {
          /* already stopped */
        }
      }
    }
  };
  video.addEventListener('timeupdate', stopAtEnd);
  recorder.start();
  try {
    video.currentTime = start;
    await video.play();
  } catch {
    video.removeEventListener('timeupdate', stopAtEnd);
    if (recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch {
        /* already stopped */
      }
    }
    throw new Error('Could not play this video in the browser');
  }
  try {
    return await done;
  } finally {
    video.removeEventListener('timeupdate', stopAtEnd);
  }
}

/**
 * Trim a video to [start, end). The range is validated/clamped against
 * the real duration; the output is always WebM.
 */
export async function trimVideo(
  file: Blob,
  start: number,
  end: number,
  deps: VideoTrimmerDeps = {},
): Promise<VideoTrimResult> {
  assertVideoFile(file);
  const loadVideo = deps.loadVideo ?? defaultLoadVideo;
  const recordSegment = deps.recordSegment ?? defaultRecordSegment;
  const video = await loadVideo(file);
  const duration = video.duration;
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error('Could not read this video’s duration — it may be corrupt or unsupported');
  }
  const range = validateTrimRange(start, end, duration);
  const blob = await recordSegment(video, range.start, range.end);
  return {
    blob,
    start: range.start,
    end: range.end,
    trimmedSeconds: trimDurationSeconds(range.start, range.end),
    mimeType: WEBM_MIME_TYPE,
  };
}

