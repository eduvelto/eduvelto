// Video to Audio — unit tests.
//
// The WAV encoder is pure and is verified byte-for-byte against a tiny
// synthetic buffer (RIFF header fields + sample values). The decode
// step is injected as a fake; a real-browser decodeAudioData check is
// still owed before ship.
import { describe, it, expect } from 'vitest';
import {
  encodeWavPcm16,
  extractAudioToWav,
  buildAudioFilename,
  isWebAudioSupported,
  type DecodedAudio,
  type VideoToAudioDeps,
} from '../../tools/videoToAudio';

function makeVideoFile(size = 10_000): Blob {
  return new Blob([new Uint8Array(size)], { type: 'video/mp4' });
}

async function blobBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

function readText(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

function readU32LE(bytes: Uint8Array, offset: number): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return view.getUint32(offset, true);
}

function readU16LE(bytes: Uint8Array, offset: number): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return view.getUint16(offset, true);
}

function readI16LE(bytes: Uint8Array, offset: number): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return view.getInt16(offset, true);
}

describe('encodeWavPcm16 — header', () => {
  it('writes a valid RIFF/WAVE header for a 2-sample mono 8000 Hz buffer', async () => {
    const audio: DecodedAudio = {
      numberOfChannels: 1,
      sampleRate: 8000,
      channelData: [new Float32Array([0.5, -0.5])],
      duration: 2 / 8000,
    };
    const bytes = await blobBytes(encodeWavPcm16(audio));
    // 44-byte header + 2 samples * 2 bytes = 48 bytes total.
    expect(bytes.length).toBe(48);
    expect(readText(bytes, 0, 4)).toBe('RIFF');
    expect(readU32LE(bytes, 4)).toBe(36 + 4); // chunk size = 36 + data bytes
    expect(readText(bytes, 8, 4)).toBe('WAVE');
    expect(readText(bytes, 12, 4)).toBe('fmt ');
    expect(readU32LE(bytes, 16)).toBe(16); // fmt chunk size
    expect(readU16LE(bytes, 20)).toBe(1); // PCM
    expect(readU16LE(bytes, 22)).toBe(1); // mono
    expect(readU32LE(bytes, 24)).toBe(8000); // sample rate
    expect(readU32LE(bytes, 28)).toBe(8000 * 1 * 2); // byte rate
    expect(readU16LE(bytes, 32)).toBe(2); // block align
    expect(readU16LE(bytes, 34)).toBe(16); // bits per sample
    expect(readText(bytes, 36, 4)).toBe('data');
    expect(readU32LE(bytes, 40)).toBe(4); // data bytes
  });

  it('encodes the sample values as little-endian int16', async () => {
    const audio: DecodedAudio = {
      numberOfChannels: 1,
      sampleRate: 8000,
      channelData: [new Float32Array([0.5, -0.5, 0, 1, -1])],
      duration: 5 / 8000,
    };
    const bytes = await blobBytes(encodeWavPcm16(audio));
    expect(bytes.length).toBe(44 + 10);
    expect(readI16LE(bytes, 44)).toBe(16384); // 0.5 * 32767 -> 16384 (0.5*32768 rounded)
    expect(readI16LE(bytes, 46)).toBe(-16384); // -0.5 * 32768
    expect(readI16LE(bytes, 48)).toBe(0);
    expect(readI16LE(bytes, 50)).toBe(32767); // 1.0 clamps to max positive
    expect(readI16LE(bytes, 52)).toBe(-32768); // -1.0 clamps to min
  });

  it('clamps out-of-range samples instead of wrapping', async () => {
    const audio: DecodedAudio = {
      numberOfChannels: 1,
      sampleRate: 8000,
      channelData: [new Float32Array([2, -2])],
      duration: 2 / 8000,
    };
    const bytes = await blobBytes(encodeWavPcm16(audio));
    expect(readI16LE(bytes, 44)).toBe(32767);
    expect(readI16LE(bytes, 46)).toBe(-32768);
  });

  it('interleaves stereo channels L R L R', async () => {
    const audio: DecodedAudio = {
      numberOfChannels: 2,
      sampleRate: 44100,
      channelData: [new Float32Array([0.5, 0.25]), new Float32Array([-0.5, -0.25])],
      duration: 2 / 44100,
    };
    const bytes = await blobBytes(encodeWavPcm16(audio));
    expect(bytes.length).toBe(44 + 8);
    expect(readU16LE(bytes, 22)).toBe(2);
    expect(readU32LE(bytes, 28)).toBe(44100 * 2 * 2);
    expect(readI16LE(bytes, 44)).toBe(16384); // L0
    expect(readI16LE(bytes, 46)).toBe(-16384); // R0
    expect(readI16LE(bytes, 48)).toBe(8192); // L1: 0.25 * 32767 = 8191.75 -> 8192
    expect(readI16LE(bytes, 50)).toBe(-8192); // R1
  });

  it('rejects bad channel counts, sample rates and mismatched channels', () => {
    const base: DecodedAudio = {
      numberOfChannels: 1,
      sampleRate: 8000,
      channelData: [new Float32Array([0])],
      duration: 1 / 8000,
    };
    expect(() => encodeWavPcm16({ ...base, numberOfChannels: 0 })).toThrow(/numberOfChannels/);
    expect(() => encodeWavPcm16({ ...base, sampleRate: 0 })).toThrow(/sampleRate/);
    expect(() =>
      encodeWavPcm16({ ...base, channelData: [new Float32Array([0]), new Float32Array([0])] }),
    ).toThrow(/channelData/);
    expect(() =>
      encodeWavPcm16({
        numberOfChannels: 2,
        sampleRate: 8000,
        channelData: [new Float32Array([0, 0]), new Float32Array([0])],
        duration: 1 / 8000,
      }),
    ).toThrow(/same number of samples/);
  });
});

describe('buildAudioFilename', () => {
  it('always ends in .wav, never .mp3', () => {
    expect(buildAudioFilename('my video.mp4')).toBe('my video.wav');
    expect(buildAudioFilename('clip')).toBe('clip.wav');
  });
});

describe('isWebAudioSupported', () => {
  it('is false in Node (no AudioContext here)', () => {
    expect(isWebAudioSupported()).toBe(false);
  });
});

describe('extractAudioToWav (fake decode wiring)', () => {
  it('encodes the decoded audio to a WAV blob and reports its properties', async () => {
    const deps: VideoToAudioDeps = {
      decodeAudio: () =>
        Promise.resolve({
          numberOfChannels: 1,
          sampleRate: 8000,
          channelData: [new Float32Array([0.5, -0.5])],
          duration: 2 / 8000,
        }),
    };
    const result = await extractAudioToWav(makeVideoFile(), deps);
    expect(result.mimeType).toBe('audio/wav');
    expect(result.blob.type).toBe('audio/wav');
    expect(result.blob.size).toBe(48);
    expect(result.sampleRate).toBe(8000);
    expect(result.numberOfChannels).toBe(1);
    expect(result.duration).toBeCloseTo(2 / 8000, 10);
  });

  it('throws honestly when the video has no audio track', async () => {
    const deps: VideoToAudioDeps = {
      decodeAudio: () =>
        Promise.resolve({
          numberOfChannels: 1,
          sampleRate: 8000,
          channelData: [new Float32Array([])],
          duration: 0,
        }),
    };
    await expect(extractAudioToWav(makeVideoFile(), deps)).rejects.toThrow(/no audio track/);
  });

  it('passes a decode failure through as an honest error', async () => {
    const deps: VideoToAudioDeps = {
      decodeAudio: () => Promise.reject(new Error('decode failed')),
    };
    await expect(extractAudioToWav(makeVideoFile(), deps)).rejects.toThrow(/decode failed/);
  });

  it('rejects a non-video file', async () => {
    const deps: VideoToAudioDeps = {
      decodeAudio: () =>
        Promise.resolve({
          numberOfChannels: 1,
          sampleRate: 8000,
          channelData: [new Float32Array([0])],
          duration: 1 / 8000,
        }),
    };
    await expect(
      extractAudioToWav(new Blob(['x'], { type: 'text/plain' }), deps),
    ).rejects.toThrow(/Expected a video file/);
  });
});
