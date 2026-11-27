// Video Format Converter — unit tests.
//
// Format-support detection is pure with the `isTypeSupported` check
// injected, so every browser combination is testable in Node; the
// recording itself is injected as a fake. A real-browser check of an
// actual re-encode is still owed before ship.
import { describe, it, expect } from 'vitest';
import {
  convertVideo,
  detectSupportedFormats,
  detectSupportedFormatsInBrowser,
  resolveOutputFormat,
  buildConvertedFilename,
  WEBM_FORMAT,
  MP4_FORMAT,
  type VideoFormatConverterDeps,
  type VideoFormatSupport,
} from '../../tools/videoFormatConverter';

function makeVideoFile(size = 10_000): Blob {
  return new Blob([new Uint8Array(size)], { type: 'video/mp4' });
}

function supportWith(webm: boolean, mp4: boolean): VideoFormatSupport {
  return {
    webm,
    mp4,
    supported: [...(webm ? [WEBM_FORMAT] : []), ...(mp4 ? [MP4_FORMAT] : [])],
  };
}

describe('detectSupportedFormats', () => {
  it('reports WebM only when the checker allows WebM only (Chrome/Firefox-like)', () => {
    const support = detectSupportedFormats((mime) => mime === 'video/webm');
    expect(support).toEqual({ webm: true, mp4: false, supported: [WEBM_FORMAT] });
  });

  it('reports both when the checker allows both (Safari-like)', () => {
    const support = detectSupportedFormats(() => true);
    expect(support).toEqual({ webm: true, mp4: true, supported: [WEBM_FORMAT, MP4_FORMAT] });
  });

  it('reports none when the checker allows nothing', () => {
    const support = detectSupportedFormats(() => false);
    expect(support).toEqual({ webm: false, mp4: false, supported: [] });
  });

  it('treats a throwing checker as unsupported, not as a crash', () => {
    const support = detectSupportedFormats(() => {
      throw new Error('nope');
    });
    expect(support.supported).toEqual([]);
  });
});

describe('detectSupportedFormatsInBrowser', () => {
  it('reports nothing supported in Node (no MediaRecorder here)', () => {
    expect(detectSupportedFormatsInBrowser()).toEqual({ webm: false, mp4: false, supported: [] });
  });
});

describe('resolveOutputFormat', () => {
  it('resolves WebM when supported and MP4 only when supported', () => {
    expect(resolveOutputFormat('webm', supportWith(true, false))).toBe(WEBM_FORMAT);
    expect(resolveOutputFormat('mp4', supportWith(true, true))).toBe(MP4_FORMAT);
  });

  it('throws honestly for MP4 where the browser cannot record it', () => {
    expect(() => resolveOutputFormat('mp4', supportWith(true, false))).toThrow(
      /MP4 output is not supported in this browser/,
    );
  });

  it('throws honestly for WebM where nothing is supported', () => {
    expect(() => resolveOutputFormat('webm', supportWith(false, false))).toThrow(
      /WebM output is not supported/,
    );
  });
});

describe('buildConvertedFilename', () => {
  it('keeps the honest extension for the chosen format', () => {
    expect(buildConvertedFilename('clip.mov', 'webm')).toBe('clip-converted.webm');
    expect(buildConvertedFilename('clip.mov', 'mp4')).toBe('clip.mp4');
    expect(buildConvertedFilename('clip', 'webm')).toBe('clip-converted.webm');
  });
});

describe('convertVideo (fake-DOM wiring)', () => {
  function fakeDeps(
    support: VideoFormatSupport,
  ): { deps: VideoFormatConverterDeps; recorded: string[] } {
    const recorded: string[] = [];
    const video = {} as unknown as HTMLVideoElement;
    const deps: VideoFormatConverterDeps = {
      support,
      loadVideo: () => Promise.resolve(video),
      recordWholeVideo: (_v, mimeType) => {
        recorded.push(mimeType);
        return Promise.resolve(new Blob([new Uint8Array(5000)], { type: mimeType }));
      },
    };
    return { deps, recorded };
  }

  it('converts to WebM and records with the WebM MIME type', async () => {
    const { deps, recorded } = fakeDeps(supportWith(true, false));
    const result = await convertVideo(makeVideoFile(), 'webm', deps);
    expect(recorded).toEqual(['video/webm']);
    expect(result.format).toBe('webm');
    expect(result.mimeType).toBe('video/webm');
    expect(result.blob.type).toBe('video/webm');
  });

  it('converts to MP4 only when the injected support allows it', async () => {
    const { deps, recorded } = fakeDeps(supportWith(true, true));
    const result = await convertVideo(makeVideoFile(), 'mp4', deps);
    expect(recorded).toEqual(['video/mp4']);
    expect(result.format).toBe('mp4');
    expect(result.mimeType).toBe('video/mp4');
  });

  it('refuses MP4 where the browser cannot record it — no fake conversion', async () => {
    const { deps, recorded } = fakeDeps(supportWith(true, false));
    await expect(convertVideo(makeVideoFile(), 'mp4', deps)).rejects.toThrow(
      /MP4 output is not supported/,
    );
    expect(recorded).toEqual([]);
  });

  it('rejects a non-video file', async () => {
    const { deps } = fakeDeps(supportWith(true, false));
    await expect(
      convertVideo(new Blob(['x'], { type: 'text/plain' }), 'webm', deps),
    ).rejects.toThrow(/Expected a video file/);
  });
});
