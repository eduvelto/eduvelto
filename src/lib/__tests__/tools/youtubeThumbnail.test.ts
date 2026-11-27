import { describe, it, expect } from 'vitest';
import { extractYouTubeId, thumbnailUrls } from '../../tools/youtubeThumbnail';

describe('youtubeThumbnail', () => {
  it('extracts IDs from watch, short and youtu.be links', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('https://example.com')).toBeNull();
  });
  it('builds img.youtube.com URLs', () => {
    const urls = thumbnailUrls('dQw4w9WgXcQ');
    expect(urls.maxres).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg');
    expect(urls.high).toContain('hqdefault.jpg');
  });
});
