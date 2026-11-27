// Video Compressor — unit tests.
//
// The real MediaRecorder path needs a browser, which the Node test run
// does not have, so the recording loop is injected as a fake (verifying
// the wiring, the resolution/bitrate selection and the byte accounting),
// while the pure helpers are tested directly. A real-browser check of
// an actual WebM encode is still owed before ship.
import { describe, it, expect } from 'vitest';
import {
  compressVideo,
  computeTargetResolution,
  selectPreset,
  buildCompressedFilename,
  VIDEO_COMPRESSION_PRESETS,
  type VideoCompressorDeps,
  type MinimalVideoCanvas,
} from '../../tools/videoCompressor';
import { isMediaRecorderSupported } from '../../tools/videoCommon';

function makeVideoFile(size = 10_000): Blob {
  return new Blob([new Uint8Array(size)], { type: 'video/mp4' });
}

function fakeDeps(
  videoWidth: number,
  videoHeight: number,
  outBytes: number,
): {
  deps: VideoCompressorDeps;
  recorded: Array<{ bitrate: number; width: number; height: number }>;
  video: HTMLVideoElement;
} {
  const recorded: Array<{ bitrate: number; width: number; height: number }> = [];
  const video = { videoWidth, videoHeight } as unknown as HTMLVideoElement;
  const deps: VideoCompressorDeps = {
    loadVideo: () => Promise.resolve(video),
    createCanvas: (width: number, height: number): MinimalVideoCanvas => ({
      width,
      height,
      getContext: () => null,
      captureStream: () => ({}) as MediaStream,
    }),
    recordCanvasStream: (_v, canvas, bitrate) => {
      recorded.push({ bitrate, width: canvas.width, height: canvas.height });
      return Promise.resolve(new Blob([new Uint8Array(outBytes)], { type: 'video/webm' }));
    },
  };
  return { deps, recorded, video };
}

describe('selectPreset', () => {
  it('SD is 480p at 1 Mbps, HD is 720p at 2.5 Mbps', () => {
    expect(selectPreset('sd')).toEqual(VIDEO_COMPRESSION_PRESETS.sd);
    expect(selectPreset('sd').maxHeight).toBe(480);
    expect(selectPreset('sd').videoBitsPerSecond).toBe(1_000_000);
    expect(selectPreset('hd').maxHeight).toBe(720);
    expect(selectPreset('hd').videoBitsPerSecond).toBe(2_500_000);
  });

  it('rejects an unknown quality', () => {
    expect(() => selectPreset('4k' as 'sd')).toThrow(/Unknown video quality/);
  });
});

describe('computeTargetResolution', () => {
  it('downscales 1920x1080 to max height 480 -> 854x480 (even width)', () => {
    expect(computeTargetResolution(1920, 1080, 480)).toEqual({ width: 854, height: 480 });
  });

  it('never upscales: 640x480 at max 480 stays 640x480', () => {
    expect(computeTargetResolution(640, 480, 480)).toEqual({ width: 640, height: 480 });
  });

  it('scales a portrait video by height: 1080x1920 @480 -> 270x480', () => {
    expect(computeTargetResolution(1080, 1920, 480)).toEqual({ width: 270, height: 480 });
  });

  it('downscales 1280x720 to HD 720p unchanged (already 720p)', () => {
    expect(computeTargetResolution(1280, 720, 720)).toEqual({ width: 1280, height: 720 });
  });

  it('rejects non-positive dimensions', () => {
    expect(() => computeTargetResolution(0, 480, 480)).toThrow(/positive numbers/);
    expect(() => computeTargetResolution(640, 480, 0)).toThrow(/positive number/);
  });
});

describe('buildCompressedFilename', () => {
  it('always ends in .webm with the quality suffix', () => {
    expect(buildCompressedFilename('my video.mp4', 'sd')).toBe('my video-sd.webm');
    expect(buildCompressedFilename('my video.mp4', 'hd')).toBe('my video-hd.webm');
    expect(buildCompressedFilename('clip', 'sd')).toBe('clip-sd.webm');
  });
});

describe('isMediaRecorderSupported', () => {
  it('is false in Node (no MediaRecorder here)', () => {
    expect(isMediaRecorderSupported()).toBe(false);
  });
});

describe('compressVideo (fake-DOM wiring)', () => {
  it('SD: records at 480p / 1 Mbps and reports real byte counts', async () => {
    const { deps, recorded } = fakeDeps(1920, 1080, 4000);
    const result = await compressVideo(makeVideoFile(10_000), 'sd', deps);
    expect(recorded).toEqual([{ bitrate: 1_000_000, width: 854, height: 480 }]);
    expect(result.width).toBe(854);
    expect(result.height).toBe(480);
    expect(result.mimeType).toBe('video/webm');
    expect(result.quality).toBe('sd');
    expect(result.originalBytes).toBe(10_000);
    expect(result.newBytes).toBe(4000);
    // (10000 - 4000) / 10000 * 100 = 60% saved.
    expect(result.savedPercent).toBe(60);
    expect(result.blob.type).toBe('video/webm');
  });

  it('HD: records at 720p / 2.5 Mbps', async () => {
    const { deps, recorded } = fakeDeps(1920, 1080, 8000);
    const result = await compressVideo(makeVideoFile(10_000), 'hd', deps);
    expect(recorded).toEqual([{ bitrate: 2_500_000, width: 1280, height: 720 }]);
    expect(result.quality).toBe('hd');
    expect(result.savedPercent).toBe(20);
  });

  it('reports 0% saved when the output is not smaller', async () => {
    const { deps } = fakeDeps(640, 480, 12_000);
    const result = await compressVideo(makeVideoFile(10_000), 'sd', deps);
    expect(result.newBytes).toBe(12_000);
    expect(result.savedPercent).toBe(0);
  });

  it('rejects a non-video file and an unknown quality', async () => {
    const { deps } = fakeDeps(640, 480, 100);
    await expect(
      compressVideo(new Blob(['x'], { type: 'text/plain' }), 'sd', deps),
    ).rejects.toThrow(/Expected a video file/);
    await expect(
      compressVideo(makeVideoFile(), '4k' as 'sd', deps),
    ).rejects.toThrow(/Unknown video quality/);
  });
});
