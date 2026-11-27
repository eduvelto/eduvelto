// Music Player — unit tests for the pure playlist helpers.
import { describe, it, expect } from 'vitest';
import {
  addTracks,
  createTrack,
  indexAfterRemove,
  moveTrack,
  nextTrackIndex,
  previousTrackIndex,
  removeTrack,
  trackIdFor,
  type PlaylistTrack,
} from '../../tools/musicPlayer';

function audioFile(name: string, size = 1000, lastModified = 100): Blob & {
  name: string;
  lastModified: number;
} {
  const blob = new Blob([new Uint8Array(size)], { type: 'audio/mpeg' });
  return Object.assign(blob, { name, lastModified });
}

function track(name: string): PlaylistTrack {
  return { id: name, name, size: 1000 };
}

describe('trackIdFor / createTrack', () => {
  it('builds a stable id from name, size and lastModified', () => {
    expect(trackIdFor(audioFile('song.mp3', 1000, 100))).toBe('song.mp3-1000-100');
  });

  it('creates a track from an audio file and rejects a non-audio file', () => {
    const created = createTrack(audioFile('song.mp3'));
    expect(created).toEqual({ id: 'song.mp3-1000-100', name: 'song.mp3', size: 1000 });
    const notAudio = Object.assign(new Blob(['x'], { type: 'text/plain' }), {
      name: 'notes.txt',
      lastModified: 1,
    });
    expect(() => createTrack(notAudio)).toThrow(/Expected an audio file/);
  });
});

describe('addTracks', () => {
  it('adds new files and skips duplicates and non-audio files', () => {
    const { tracks, added, skipped } = addTracks([], [
      audioFile('a.mp3'),
      audioFile('b.mp3', 2000, 200),
      audioFile('a.mp3'), // duplicate of the first
      Object.assign(new Blob(['x'], { type: 'text/plain' }), { name: 'c.txt', lastModified: 1 }),
    ]);
    expect(tracks.map((t) => t.name)).toEqual(['a.mp3', 'b.mp3']);
    expect(added).toBe(2);
    expect(skipped).toBe(2);
  });

  it('skips files already in the existing playlist', () => {
    const existing = [createTrack(audioFile('a.mp3', 1000, 100))];
    const again = addTracks(existing, [audioFile('a.mp3', 1000, 100)]);
    expect(again.tracks).toHaveLength(1);
    expect(again.added).toBe(0);
    expect(again.skipped).toBe(1);
    const fresh = addTracks(existing, [audioFile('b.mp3', 2000, 200)]);
    expect(fresh.tracks.map((t) => t.name)).toEqual(['a.mp3', 'b.mp3']);
    expect(fresh.added).toBe(1);
  });
});

describe('removeTrack', () => {
  it('removes by id and leaves the list unchanged for an unknown id', () => {
    const list = [track('a'), track('b'), track('c')];
    expect(removeTrack(list, 'b').map((t) => t.id)).toEqual(['a', 'c']);
    expect(removeTrack(list, 'zzz')).toEqual(list);
  });
});

describe('moveTrack', () => {
  it('moves 0 -> 2: [a,b,c,d] becomes [b,c,a,d]', () => {
    const list = [track('a'), track('b'), track('c'), track('d')];
    expect(moveTrack(list, 0, 2).map((t) => t.id)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('moves 3 -> 0: [a,b,c,d] becomes [d,a,b,c]', () => {
    const list = [track('a'), track('b'), track('c'), track('d')];
    expect(moveTrack(list, 3, 0).map((t) => t.id)).toEqual(['d', 'a', 'b', 'c']);
  });

  it('leaves the list unchanged for out-of-range or same indexes', () => {
    const list = [track('a'), track('b')];
    expect(moveTrack(list, 0, 0)).toEqual(list);
    expect(moveTrack(list, -1, 1)).toEqual(list);
    expect(moveTrack(list, 0, 5)).toEqual(list);
    expect(moveTrack(list, 2, 0)).toEqual(list);
  });
});

describe('nextTrackIndex', () => {
  it('advances, wraps to the start, and stops at the end when looping is off', () => {
    expect(nextTrackIndex(0, 3)).toBe(1);
    expect(nextTrackIndex(1, 3)).toBe(2);
    expect(nextTrackIndex(2, 3)).toBe(0);
    expect(nextTrackIndex(2, 3, false)).toBe(-1);
    expect(nextTrackIndex(0, 1)).toBe(0);
    expect(nextTrackIndex(0, 1, false)).toBe(-1);
  });

  it('returns -1 for an empty list or an invalid current index', () => {
    expect(nextTrackIndex(0, 0)).toBe(-1);
    expect(nextTrackIndex(-1, 3)).toBe(-1);
    expect(nextTrackIndex(3, 3)).toBe(-1);
  });
});

describe('previousTrackIndex', () => {
  it('goes back and wraps from the first track to the last', () => {
    expect(previousTrackIndex(0, 3)).toBe(2);
    expect(previousTrackIndex(1, 3)).toBe(0);
    expect(previousTrackIndex(2, 3)).toBe(1);
    expect(previousTrackIndex(0, 1)).toBe(0);
  });

  it('returns -1 for an empty list or an invalid current index', () => {
    expect(previousTrackIndex(0, 0)).toBe(-1);
    expect(previousTrackIndex(-1, 3)).toBe(-1);
    expect(previousTrackIndex(3, 3)).toBe(-1);
  });
});

describe('indexAfterRemove', () => {
  it('keeps the position, steps back at the end, and empties at -1', () => {
    expect(indexAfterRemove(2, 4)).toBe(2);
    expect(indexAfterRemove(3, 4)).toBe(2);
    expect(indexAfterRemove(0, 1)).toBe(-1);
    expect(indexAfterRemove(0, 2)).toBe(0);
  });
});
