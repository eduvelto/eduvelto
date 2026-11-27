/**
 * YouTube Thumbnail Downloader — THUMBNAIL IMAGE ONLY. It reads the
 * video ID from a YouTube link and returns the public thumbnail image
 * URLs (img.youtube.com pattern). It does NOT download videos, and the
 * UI says so plainly. Pure functions, no DOM.
 */
export interface ThumbnailUrls {
  videoId: string;
  default: string;
  medium: string;
  high: string;
  standard: string;
  maxres: string;
}

export function extractYouTubeId(input: string): string | null {
  const text = input.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?[^#]*v=)([A-Za-z0-9_-]{11})/,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/(?:shorts|embed|live|v)\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/watch\?[^#]*vi=)([A-Za-z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) return match[1];
  }
  if (/^[A-Za-z0-9_-]{11}$/.test(text)) return text;
  return null;
}

export function thumbnailUrls(videoId: string): ThumbnailUrls {
  const base = `https://img.youtube.com/vi/${videoId}`;
  return {
    videoId,
    default: `${base}/default.jpg`,
    medium: `${base}/mqdefault.jpg`,
    high: `${base}/hqdefault.jpg`,
    standard: `${base}/sddefault.jpg`,
    maxres: `${base}/maxresdefault.jpg`,
  };
}
