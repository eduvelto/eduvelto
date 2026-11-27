/**
 * Shared pure helpers for the browser video/audio tools (100-Tools Project,
 * second batch). No DOM in this file: everything here is pure and unit
 * tested. No network, no fetch, no Firestore — files never leave the
 * browser. Output formats are labelled honestly: MediaRecorder output is
 * WebM (MP4 only where the browser reports it), audio extraction is WAV
 * (MP3 is not possible without an encoder library, and none is added).
 */

/** Maximum video/audio file accepted by the video tools (200 MB). */
export const MAX_VIDEO_FILE_BYTES = 200 * 1024 * 1024;

/** Maximum audio file accepted by the music player (200 MB). */
export const MAX_AUDIO_FILE_BYTES = 200 * 1024 * 1024;

/** The MIME type MediaRecorder produces in every modern browser. */
export const WEBM_MIME_TYPE = 'video/webm' as const;

/** Throw unless the file is a non-empty video file within the size limit. */
export function assertVideoFile(file: unknown): asserts file is Blob {
  if (!(file instanceof Blob) || file.size === 0) {
    throw new Error('A video file is required (got an empty or missing file)');
  }
  if (typeof file.type !== 'string' || !file.type.startsWith('video/')) {
    throw new Error(
      `Expected a video file, got "${(file as Blob).type || 'unknown type'}" — choose an MP4, WebM or similar video`,
    );
  }
  if (file.size > MAX_VIDEO_FILE_BYTES) {
    throw new Error(
      `Video file is too large (${formatBytes(file.size)}); the limit is ${formatBytes(MAX_VIDEO_FILE_BYTES)}`,
    );
  }
}

/** Throw unless the file is a non-empty audio file within the size limit. */
export function assertAudioFile(file: unknown): asserts file is Blob {
  if (!(file instanceof Blob) || file.size === 0) {
    throw new Error('An audio file is required (got an empty or missing file)');
  }
  if (typeof file.type !== 'string' || !file.type.startsWith('audio/')) {
    throw new Error(
      `Expected an audio file, got "${(file as Blob).type || 'unknown type'}" — choose an MP3, WAV, OGG or similar audio file`,
    );
  }
  if (file.size > MAX_AUDIO_FILE_BYTES) {
    throw new Error(
      `Audio file is too large (${formatBytes(file.size)}); the limit is ${formatBytes(MAX_AUDIO_FILE_BYTES)}`,
    );
  }
}

/** True when this browser has MediaRecorder (needed by every video tool). */
export function isMediaRecorderSupported(): boolean {
  return typeof MediaRecorder !== 'undefined';
}

/** Human byte count: 500 -> "500 B", 1536 -> "1.5 KB", 2.5 MB -> "2.5 MB". */
export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '0 B';
  if (n < 1024) return `${Math.round(n)} B`;
  if (n < 1024 * 1024) return `${parseFloat((n / 1024).toFixed(1))} KB`;
  return `${parseFloat((n / 1024 / 1024).toFixed(2))} MB`;
}

/**
 * Seconds -> "m:ss": 65 -> "1:05", 5 -> "0:05", 3600 -> "60:00".
 * Pure; hand-checked in the trimmer / music-player tests.
 */
export function formatSeconds(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';
  const whole = Math.floor(totalSeconds);
  const minutes = Math.floor(whole / 60);
  const seconds = whole % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Output filename for a WebM result: strip the old extension, append the
 * suffix, add ".webm". "my video.mp4" + "-sd" -> "my video-sd.webm";
 * "clip" + "-trimmed" -> "clip-trimmed.webm".
 */
export function buildWebmFilename(originalName: string, suffix: string): string {
  const base = originalName.replace(/\.[^.]*$/, '') || 'video';
  return `${base}${suffix}.webm`;
}

/** Output filename for a WAV result: "my video.mp4" -> "my video.wav". */
export function buildWavFilename(originalName: string): string {
  const base = originalName.replace(/\.[^.]*$/, '') || 'audio';
  return `${base}.wav`;
}
