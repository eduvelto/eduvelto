// Video Trimmer — unit tests.
//
// The real MediaRecorder path needs a browser, so the segment recording
// is injected as a fake (verifying the wiring and that the validated /
// clamped range is what gets recorded), while the pure validation and
// clamping logic is tested directly with hand-computed values.
import { describe, it, expect } from 'vitest';
import {
  trimVideo,
  validateTrimRange,
  clampTrimValue,
  trimDurationSeconds,
  buildTrimmedFilename,
  type VideoTrimmerDeps,
} from '../../tools/videoTrimmer';
import { formatSeconds } from '../../tools/videoCommon';

function makeVideoFile(size = 10_000): Blob {
  return new Blob([new Uint8Array(size)], { type: 'video/mp4' });
}

describe('clampTrimValue', () => {
  it('clamps into range and treats non-finite values as the minimum', () => {
    expect(clampTrimValue(5, 0, 60)).toBe(5);
    expect(clampTrimValue(-2, 0, 60)).toBe(0);
    expect(clampTrimValue(70, 0, 60)).toBe(60);
    expect(clampTrimValue(Number.NaN, 0, 60)).toBe(0);
    expect(clampTrimValue(Number.POSITIVE_INFINITY, 0, 60)).toBe(0);
  });
});

describe('validateTrimRange', () => {
  it('passes a valid range through unchanged', () => {
    expect(validateTrimRange(5, 10, 60)).toEqual({ start: 5, end: 10 });
  });

  it('clamps a negative start to 0', () => {
    expect(validateTrimRange(-2, 10, 60)).toEqual({ start: 0, end: 10 });
  });

  it('clamps an end past the duration to the duration', () => {
    expect(validateTrimRange(5, 70, 60)).toEqual({ start: 5, end: 60 });
  });

  it('allows the full video: 0 to duration', () => {
    expect(validateTrimRange(0, 60, 60)).toEqual({ start: 0, end: 60 });
  });

  it('allows fractional seconds', () => {
    expect(validateTrimRange(1.5, 2.25, 60)).toEqual({ start: 1.5, end: 2.25 });
  });

  it('rejects start equal to end', () => {
    expect(() => validateTrimRange(10, 10, 60)).toThrow(/must be before end/);
  });

  it('rejects start after end', () => {
    expect(() => validateTrimRange(50, 20, 60)).toThrow(/must be before end/);
  });

  it('rejects a range that clamps to nothing (both past the end)', () => {
    expect(() => validateTrimRange(70, 80, 60)).toThrow(/must be before end/);
  });

  it('rejects a non-positive duration', () => {
    expect(() => validateTrimRange(0, 5, 0)).toThrow(/duration must be a positive/);
    expect(() => validateTrimRange(0, 5, Number.NaN)).toThrow(/duration must be a positive/);
  });
});

describe('trimDurationSeconds', () => {
  it('is end minus start', () => {
    expect(trimDurationSeconds(5, 10)).toBe(5);
    expect(trimDurationSeconds(1.5, 2.25)).toBeCloseTo(0.75, 10);
  });
});

describe('formatSeconds', () => {
  it('formats mm:ss with a zero-padded seconds field', () => {
    expect(formatSeconds(65)).toBe('1:05');
    expect(formatSeconds(5)).toBe('0:05');
    expect(formatSeconds(0)).toBe('0:00');
    expect(formatSeconds(3600)).toBe('60:00');
    expect(formatSeconds(125.9)).toBe('2:05');
  });
});

describe('buildTrimmedFilename', () => {
  it('always ends in .webm with the -trimmed suffix', () => {
    expect(buildTrimmedFilename('my video.mp4')).toBe('my video-trimmed.webm');
    expect(buildTrimmedFilename('clip')).toBe('clip-trimmed.webm');
  });
});

describe('trimVideo (fake-DOM wiring)', () => {
  function fakeDeps(
    duration: number,
    outBytes = 3000,
  ): { deps: VideoTrimmerDeps; recorded: Array<{ start: number; end: number }> } {
    const recorded: Array<{ start: number; end: number }> = [];
    const video = { duration } as unknown as HTMLVideoElement;
    const deps: VideoTrimmerDeps = {
      loadVideo: () => Promise.resolve(video),
      recordSegment: (_v, start, end) => {
        recorded.push({ start, end });
        return Promise.resolve(new Blob([new Uint8Array(outBytes)], { type: 'video/webm' }));
      },
    };
    return { deps, recorded };
  }

  it('records the validated range and reports the trimmed length', async () => {
    const { deps, recorded } = fakeDeps(60);
    const result = await trimVideo(makeVideoFile(), 5, 10, deps);
    expect(recorded).toEqual([{ start: 5, end: 10 }]);
    expect(result.start).toBe(5);
    expect(result.end).toBe(10);
    expect(result.trimmedSeconds).toBe(5);
    expect(result.mimeType).toBe('video/webm');
    expect(result.blob.type).toBe('video/webm');
  });

  it('clamps the range against the real duration before recording', async () => {
    const { deps, recorded } = fakeDeps(60);
    const result = await trimVideo(makeVideoFile(), -2, 70, deps);
    expect(recorded).toEqual([{ start: 0, end: 60 }]);
    expect(result.trimmedSeconds).toBe(60);
  });

  it('rejects an invalid range and a non-video file', async () => {
    const { deps } = fakeDeps(60);
    await expect(trimVideo(makeVideoFile(), 10, 10, deps)).rejects.toThrow(/must be before end/);
    await expect(
      trimVideo(new Blob(['x'], { type: 'text/plain' }), 0, 5, deps),
    ).rejects.toThrow(/Expected a video file/);
  });

  it('rejects a video with no readable duration', async () => {
    const { deps } = fakeDeps(Number.NaN);
    await expect(trimVideo(makeVideoFile(), 0, 5, deps)).rejects.toThrow(/duration/);
  });
});
