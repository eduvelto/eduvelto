/**
 * Video Compressor — pure logic + injectable-DOM wiring (100-Tools Project,
 * second batch).
 *
 * Approach: load the video into a <video> element, draw its frames onto a
 * <canvas> at a smaller resolution, and re-record the canvas stream with
 * MediaRecorder at a lower video bitrate. No ffmpeg, no dependency.
 *
 * HONEST OUTPUT: MediaRecorder's native format is WebM — the output is
 * always a .webm file, labelled WebM, never claimed to be MP4. SD (480p)
 * is free; HD (720p) goes through the existing RewardedAdButton
 * placeholder (Unlock disabled until AdSense approves — see
 * src/lib/rewardedAd.ts; never a real ad API, never a fake timer).
 *
 * The DOM parts (video loading, canvas, recording loop) are injectable
 * through `deps` so the wiring stays testable in a Node test run without
 * a DOM; in the app the defaults use the real elements. A real-browser
 * encode check is still owed before ship — Node has no MediaRecorder.
 */

import {
  assertVideoFile,
  buildWebmFilename,
  isMediaRecorderSupported,
  WEBM_MIME_TYPE,
} from './videoCommon';

export type VideoQuality = 'sd' | 'hd';

export interface VideoCompressionPreset {
  quality: VideoQuality;
  /** Target height in px (width follows the aspect ratio). */
  maxHeight: number;
  /** MediaRecorder video bitrate in bits per second. */
  videoBitsPerSecond: number;
}

export const VIDEO_COMPRESSION_PRESETS: Record<VideoQuality, VideoCompressionPreset> = {
  sd: { quality: 'sd', maxHeight: 480, videoBitsPerSecond: 1_000_000 },
  hd: { quality: 'hd', maxHeight: 720, videoBitsPerSecond: 2_500_000 },
};

export interface VideoCompressionResult {
  /** The compressed video (always WebM). */
  blob: Blob;
  originalBytes: number;
  newBytes: number;
  savedPercent: number;
  width: number;
  height: number;
  quality: VideoQuality;
  mimeType: typeof WEBM_MIME_TYPE;
}

/** Minimal canvas surface the video tools need (structural, injectable). */
export interface MinimalVideoCanvas {
  width: number;
  height: number;
  getContext: (
    kind: '2d',
  ) => { drawImage: (img: unknown, x: number, y: number, w: number, h: number) => void } | null;
  captureStream: (frameRequestRate?: number) => MediaStream;
}

/** Minimal DOM surface the video compressor needs (injectable for tests). */
export interface VideoCompressorDeps {
  /** Load a video file; resolve with the element once metadata is ready. */
  loadVideo?: (file: Blob) => Promise<HTMLVideoElement>;
  /** Create a blank canvas of the given size. */
  createCanvas?: (width: number, height: number) => MinimalVideoCanvas;
  /**
   * Record the canvas stream while the video plays and draws onto it.
   * The default plays the video, draws each frame with
   * requestAnimationFrame, and records the canvas stream with
   * MediaRecorder at `videoBitsPerSecond`.
   */
  recordCanvasStream?: (
    video: HTMLVideoElement,
    canvas: MinimalVideoCanvas,
    videoBitsPerSecond: number,
  ) => Promise<Blob>;
}

/** Preset for a quality choice; throws on an unknown quality string. */
export function selectPreset(quality: VideoQuality): VideoCompressionPreset {
  const preset = VIDEO_COMPRESSION_PRESETS[quality];
  if (!preset) throw new Error(`Unknown video quality "${quality}" — choose SD or HD`);
  return preset;
}

/**
 * Target resolution for a max-height downscale, preserving aspect ratio
 * and never upscaling. Width/height are rounded to even numbers (many
 * encoders require even dimensions).
 * Pure: hand-check 1920x1080 @480 -> 854x480; 640x480 @480 -> 640x480;
 * 1080x1920 @480 -> 270x480.
 */
export function computeTargetResolution(
  width: number,
  height: number,
  maxHeight: number,
): { width: number; height: number } {
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    throw new Error(`Video dimensions must be positive numbers, got ${width}x${height}`);
  }
  if (!Number.isFinite(maxHeight) || maxHeight <= 0) {
    throw new Error(`maxHeight must be a positive number, got ${maxHeight}`);
  }
  const scale = Math.min(1, maxHeight / height);
  const toEven = (n: number): number => {
    const rounded = Math.round(n);
    return rounded % 2 === 0 ? rounded : rounded + 1;
  };
  return { width: toEven(width * scale), height: toEven(height * scale) };
}

/** Output filename: "my video.mp4" + SD -> "my video-sd.webm" (always WebM). */
export function buildCompressedFilename(originalName: string, quality: VideoQuality): string {
  return buildWebmFilename(originalName, quality === 'hd' ? '-hd' : '-sd');
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

function defaultCreateCanvas(width: number, height: number): MinimalVideoCanvas {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas as unknown as MinimalVideoCanvas;
}

/** Default recording loop: play the video, draw frames, record the canvas. */
async function defaultRecordCanvasStream(
  video: HTMLVideoElement,
  canvas: MinimalVideoCanvas,
  videoBitsPerSecond: number,
): Promise<Blob> {
  if (!isMediaRecorderSupported()) {
    throw new Error('MediaRecorder is not available in this browser, so the video cannot be re-recorded');
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get a 2d canvas context to draw this video');
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, {
    mimeType: WEBM_MIME_TYPE,
    videoBitsPerSecond,
  });
  const chunks: Blob[] = [];
  const done = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () =>
      reject(new Error('Recording failed in this browser — try a different browser'));
    recorder.onstop = () => resolve(new Blob(chunks, { type: WEBM_MIME_TYPE }));
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
  const draw = (): void => {
    if (video.ended) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
  return done;
}

/**
 * Compress a video: downscale to the preset height and re-record with
 * MediaRecorder at the preset bitrate. Output is always WebM.
 */
export async function compressVideo(
  file: Blob,
  quality: VideoQuality,
  deps: VideoCompressorDeps = {},
): Promise<VideoCompressionResult> {
  assertVideoFile(file);
  const preset = selectPreset(quality);
  const loadVideo = deps.loadVideo ?? defaultLoadVideo;
  const createCanvas = deps.createCanvas ?? defaultCreateCanvas;
  const recordCanvasStream = deps.recordCanvasStream ?? defaultRecordCanvasStream;
  const video = await loadVideo(file);
  const { width, height } = computeTargetResolution(
    video.videoWidth,
    video.videoHeight,
    preset.maxHeight,
  );
  const canvas = createCanvas(width, height);
  const blob = await recordCanvasStream(video, canvas, preset.videoBitsPerSecond);
  const originalBytes = file.size;
  const newBytes = blob.size;
  return {
    blob,
    originalBytes,
    newBytes,
    savedPercent:
      newBytes >= originalBytes
        ? 0
        : Math.round(((originalBytes - newBytes) / originalBytes) * 1000) / 10,
    width,
    height,
    quality,
    mimeType: WEBM_MIME_TYPE,
  };
}

