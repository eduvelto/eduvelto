/**
 * Video to Audio — pure logic + injectable-DOM wiring (100-Tools Project,
 * second batch).
 *
 * Approach: decode the video file's audio track with the Web Audio API
 * (decodeAudioData), then encode the decoded samples to WAV with a small
 * hand-written PCM16 WAV encoder. No dependency, no lamejs.
 *
 * HONEST OUTPUT: the output is WAV audio, labelled WAV. MP3 is NOT
 * possible without an MP3 encoder library, and none is added — the UI
 * never promises MP3.
 *
 * The decode step is injectable through `deps` so the wiring stays
 * testable in a Node test run without a DOM; the WAV encoder itself is
 * pure and tested byte-for-byte against a tiny synthetic buffer.
 */

import { assertVideoFile, buildWavFilename } from './videoCommon';

export interface DecodedAudio {
  numberOfChannels: number;
  sampleRate: number;
  /** One Float32Array of samples per channel, values in [-1, 1]. */
  channelData: Float32Array[];
  /** Duration in seconds. */
  duration: number;
}

export interface VideoToAudioResult {
  /** The extracted audio (always WAV). */
  blob: Blob;
  sampleRate: number;
  numberOfChannels: number;
  duration: number;
  mimeType: 'audio/wav';
}

/** Minimal DOM surface the tool needs (injectable for tests). */
export interface VideoToAudioDeps {
  /**
   * Decode an audio file's bytes into raw samples. The default uses
   * an AudioContext and decodeAudioData on the file's ArrayBuffer.
   */
  decodeAudio?: (file: Blob) => Promise<DecodedAudio>;
  /** Encode decoded samples to WAV (default: the hand-written encoder). */
  encodeWav?: (audio: DecodedAudio) => Blob;
}

/** True when this browser has Web Audio (needed to decode the audio). */
export function isWebAudioSupported(): boolean {
  return (
    typeof AudioContext !== 'undefined' ||
    typeof (globalThis as { webkitAudioContext?: unknown }).webkitAudioContext !== 'undefined'
  );
}

/** Output filename: "my video.mp4" -> "my video.wav" (always WAV). */
export function buildAudioFilename(originalName: string): string {
  return buildWavFilename(originalName);
}

/**
 * Encode decoded PCM samples as a 16-bit WAV file.
 * Pure: hand-check — a 2-sample mono buffer at 8000 Hz, samples
 * [0.5, -0.5], produces a 48-byte file: "RIFF" + 40, "WAVE", "fmt ",
 * PCM format 1, 1 channel, 8000 Hz, 16 bits, "data" + 4, then the
 * samples 16384 and -16384 little-endian.
 */
export function encodeWavPcm16(audio: DecodedAudio): Blob {
  const { numberOfChannels, sampleRate, channelData } = audio;
  if (!Number.isInteger(numberOfChannels) || numberOfChannels < 1) {
    throw new Error(`numberOfChannels must be a positive integer, got ${numberOfChannels}`);
  }
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
    throw new Error(`sampleRate must be a positive number, got ${sampleRate}`);
  }
  if (channelData.length !== numberOfChannels) {
    throw new Error(
      `channelData has ${channelData.length} channels but numberOfChannels is ${numberOfChannels}`,
    );
  }
  const frameCount = channelData[0]?.length ?? 0;
  for (const channel of channelData) {
    if (channel.length !== frameCount) {
      throw new Error('All channels must have the same number of samples');
    }
  }
  const bytesPerSample = 2;
  const blockAlign = numberOfChannels * bytesPerSample;
  const byteRate = Math.round(sampleRate) * blockAlign;
  const dataBytes = frameCount * blockAlign;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);
  const writeText = (offset: number, text: string): void => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeText(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true); // chunk size
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size (PCM)
  view.setUint16(20, 1, true); // audio format: PCM
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, Math.round(sampleRate), true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeText(36, 'data');
  view.setUint32(40, dataBytes, true);
  let offset = 44;
  for (let frame = 0; frame < frameCount; frame++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = channelData[channel]?.[frame] ?? 0;
      const clamped = Math.max(-1, Math.min(1, sample));
      const int16 = clamped < 0 ? Math.round(clamped * 0x8000) : Math.round(clamped * 0x7fff);
      view.setInt16(offset, int16, true);
      offset += bytesPerSample;
    }
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

function defaultDecodeAudio(file: Blob): Promise<DecodedAudio> {
  return (async () => {
    const Ctor =
      typeof AudioContext !== 'undefined'
        ? AudioContext
        : (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      throw new Error('Web Audio is not available in this browser, so the audio cannot be decoded');
    }
    const arrayBuffer = await file.arrayBuffer();
    const context = new Ctor();
    try {
      const decoded = await context.decodeAudioData(arrayBuffer);
      const channelData: Float32Array[] = [];
      for (let c = 0; c < decoded.numberOfChannels; c++) {
        channelData.push(decoded.getChannelData(c));
      }
      return {
        numberOfChannels: decoded.numberOfChannels,
        sampleRate: decoded.sampleRate,
        channelData,
        duration: decoded.duration,
      };
    } catch {
      throw new Error(
        'Could not decode the audio in this video — it may have no audio track, or the format is unsupported here',
      );
    } finally {
      void context.close().catch(() => undefined);
    }
  })();
}

/**
 * Extract the audio track of a video file as a WAV file.
 * Throws an honest error when the file has no decodable audio.
 */
export async function extractAudioToWav(
  file: Blob,
  deps: VideoToAudioDeps = {},
): Promise<VideoToAudioResult> {
  assertVideoFile(file);
  const decodeAudio = deps.decodeAudio ?? defaultDecodeAudio;
  const encodeWav = deps.encodeWav ?? encodeWavPcm16;
  const audio = await decodeAudio(file);
  if (!audio.channelData.length || (audio.channelData[0]?.length ?? 0) === 0) {
    throw new Error('This video has no audio track to extract');
  }
  const blob = encodeWav(audio);
  return {
    blob,
    sampleRate: audio.sampleRate,
    numberOfChannels: audio.numberOfChannels,
    duration: audio.duration,
    mimeType: 'audio/wav',
  };
}
