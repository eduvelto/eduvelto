/**
 * Music Player — pure playlist logic (100-Tools Project, second batch).
 *
 * The player itself is a plain <audio> element fed by object URLs of
 * files the user picks — all local, no upload, no streaming, no
 * external URLs. This module holds only the pure playlist helpers
 * (add/remove/reorder, next/previous index math); playback state lives
 * in the component.
 */

import { assertAudioFile } from './videoCommon';

export interface PlaylistTrack {
  /** Stable id: name + size + lastModified, so the same file is not added twice. */
  id: string;
  name: string;
  size: number;
  /** Object URL created by the component (not part of equality). */
  url?: string;
}

export interface AudioFileLike {
  name: string;
  size: number;
  lastModified: number;
  type: string;
}

/** Stable id for a picked audio file. */
export function trackIdFor(file: AudioFileLike): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

/** Build a playlist track from a picked file (throws unless it is audio). */
export function createTrack(file: AudioFileLike & Blob): PlaylistTrack {
  assertAudioFile(file);
  return { id: trackIdFor(file), name: file.name, size: file.size };
}

/**
 * Add picked files to a playlist, skipping files already in it
 * (same name + size + lastModified). Files that are not audio are
 * skipped and reported in `skipped`.
 */
export function addTracks(
  existing: PlaylistTrack[],
  files: Array<AudioFileLike & Blob>,
): { tracks: PlaylistTrack[]; added: number; skipped: number } {
  const seen = new Set(existing.map((t) => t.id));
  const tracks = [...existing];
  let added = 0;
  let skipped = 0;
  for (const file of files) {
    try {
      const track = createTrack(file);
      if (seen.has(track.id)) {
        skipped += 1;
        continue;
      }
      seen.add(track.id);
      tracks.push(track);
      added += 1;
    } catch {
      skipped += 1;
    }
  }
  return { tracks, added, skipped };
}

/** Remove a track by id; unknown ids leave the list unchanged. */
export function removeTrack(tracks: PlaylistTrack[], id: string): PlaylistTrack[] {
  return tracks.filter((t) => t.id !== id);
}

/**
 * Move a track from one position to another. Out-of-range indexes leave
 * the list unchanged (a copy is still returned).
 * Pure: hand-check [a,b,c,d] move 0 -> 2 gives [b,c,a,d];
 * move 3 -> 0 gives [d,a,b,c].
 */
export function moveTrack(
  tracks: PlaylistTrack[],
  fromIndex: number,
  toIndex: number,
): PlaylistTrack[] {
  if (
    !Number.isInteger(fromIndex) ||
    !Number.isInteger(toIndex) ||
    fromIndex < 0 ||
    fromIndex >= tracks.length ||
    toIndex < 0 ||
    toIndex >= tracks.length ||
    fromIndex === toIndex
  ) {
    return [...tracks];
  }
  const next = [...tracks];
  const [moved] = next.splice(fromIndex, 1);
  if (moved) next.splice(toIndex, 0, moved);
  return next;
}

/**
 * Next track index, wrapping to the start. -1 when the list is empty
 * or the current index is invalid. `loop` off: the last track has no
 * next (-1).
 * Pure: hand-check next(0, 3) -> 1; next(2, 3) -> 0; next(2, 3, false)
 * -> -1; next(0, 0) -> -1.
 */
export function nextTrackIndex(current: number, length: number, loop = true): number {
  if (length <= 0 || !Number.isInteger(current) || current < 0 || current >= length) return -1;
  if (current + 1 < length) return current + 1;
  return loop ? 0 : -1;
}

/**
 * Previous track index, wrapping to the end. -1 when the list is empty
 * or the current index is invalid.
 * Pure: hand-check prev(0, 3) -> 2; prev(1, 3) -> 0; prev(0, 0) -> -1.
 */
export function previousTrackIndex(current: number, length: number): number {
  if (length <= 0 || !Number.isInteger(current) || current < 0 || current >= length) return -1;
  if (current - 1 >= 0) return current - 1;
  return length - 1;
}

/**
 * Index to play after removing a track: keeps playing the same position
 * when possible, steps back when the last track was removed, -1 when
 * the list becomes empty.
 * Pure: hand-check afterRemove(2, 4) -> 2; afterRemove(3, 4) -> 2;
 * afterRemove(0, 1) -> -1.
 */
export function indexAfterRemove(current: number, lengthBeforeRemove: number): number {
  const remaining = lengthBeforeRemove - 1;
  if (remaining <= 0) return -1;
  return Math.min(current, remaining - 1);
}
