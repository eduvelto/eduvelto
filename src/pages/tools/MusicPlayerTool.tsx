// Eduvelto — Music Player tool UI (100-Tools Project, second batch).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// A plain <audio> element plays files the user picks, through object
// URLs — all local, no upload, no streaming, no external URLs. The
// playlist helpers (add/remove/reorder, next/previous) live in
// src/lib/tools/musicPlayer.ts and are unit tested there.

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import {
  addTracks,
  moveTrack,
  nextTrackIndex,
  previousTrackIndex,
  removeTrack,
  trackIdFor,
  type PlaylistTrack,
} from '../../lib/tools/musicPlayer';
import { formatBytes, formatSeconds } from '../../lib/tools/videoCommon';

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 15,
  boxSizing: 'border-box',
  background: 'var(--surface)',
  color: 'var(--heading)',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--heading)',
  marginBottom: 6,
};

const cardStyle: CSSProperties = {
  marginTop: 16,
  padding: '18px 16px',
};

const noteStyle: CSSProperties = {
  margin: '10px 0 0',
  fontSize: 13,
  color: 'var(--muted)',
};

const trackRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  marginTop: 8,
  background: 'var(--surface)',
};

const smallButtonStyle: CSSProperties = {
  minHeight: 36,
  padding: '0 10px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  background: 'var(--surface)',
  color: 'var(--heading)',
  fontSize: 14,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

/** Hero band: forest → teal-deep gradient, white title + trust chip. */
const heroStyle: CSSProperties = {
  margin: '-18px -16px 16px',
  padding: '20px 16px 18px',
  borderRadius: '12px 12px 0 0',
  background: 'linear-gradient(135deg, var(--forest), var(--teal-deep))',
  color: '#fff',
};

const trustChipStyle: CSSProperties = {
  display: 'inline-block',
  marginTop: 10,
  padding: '5px 12px',
  borderRadius: 999,
  border: '1px solid rgba(255, 255, 255, 0.5)',
  background: 'rgba(255, 255, 255, 0.14)',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
};

const headlineStyle: CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: '1.6rem',
  fontWeight: 700,
  color: 'var(--teal-text)',
  margin: '0 0 4px',
  lineHeight: 1.25,
  overflowWrap: 'anywhere',
};

const statGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
  gap: 8,
  marginTop: 10,
};

const statTileStyle: CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--line)',
  borderRadius: 10,
  padding: '8px 10px',
};

const statLabelStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: 'var(--muted)',
};

const statValueStyle: CSSProperties = {
  margin: '2px 0 0',
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--heading)',
};

export function MusicPlayerTool() {
  const { t } = useLanguage();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [addedCount, setAddedCount] = useState<number | null>(null);
  const [skippedCount, setSkippedCount] = useState(0);
  const [loop, setLoop] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);

  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : undefined;
  const currentUrl = currentTrack?.url;

  // Load + play whenever the current track changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!currentUrl) {
      audio.pause();
      audio.removeAttribute('src');
      setPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }
    audio.src = currentUrl;
    audio.volume = volume;
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
    // Volume is applied on change below; the track URL is the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUrl]);

  // Keep the element volume in sync with the slider.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Keep loop / mute / speed in sync with the <audio> element.
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = loop;
  }, [loop]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  // Keyboard shortcuts: Space play/pause, Left/Right ±10s, M mute,
  // L loop. Ignored while focus is on a control, so Space on a
  // focused button and arrows on a focused slider keep working
  // natively instead of double-firing.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName)) return;
      if (!currentTrack) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSeek(Math.max(0, currentTime - 10));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSeek(Math.min(duration || 0, currentTime + 10));
      } else if (e.key === 'm' || e.key === 'M') {
        setMuted((m) => !m);
      } else if (e.key === 'l' || e.key === 'L') {
        setLoop((l) => !l);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // togglePlay / handleSeek read the values below; re-subscribe
    // when they change so the closure never goes stale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack, currentTime, duration, playing]);

  function handleAddFiles(fileList: FileList | null): void {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const { tracks: merged, added, skipped } = addTracks(tracks, files);
    const withUrls = merged.map((track) => {
      if (track.url) return track;
      const file = files.find((f) => trackIdFor(f) === track.id);
      return file ? { ...track, url: URL.createObjectURL(file) } : track;
    });
    setTracks(withUrls);
    setAddedCount(added);
    setSkippedCount(skipped);
    if (currentIndex === -1 && withUrls.length > 0) setCurrentIndex(0);
  }

  function handleRemove(id: string): void {
    const removedIndex = tracks.findIndex((track) => track.id === id);
    const removed = tracks[removedIndex];
    if (removed?.url) URL.revokeObjectURL(removed.url);
    const next = removeTrack(tracks, id);
    setTracks(next);
    if (next.length === 0) {
      setCurrentIndex(-1);
    } else if (removedIndex < currentIndex) {
      setCurrentIndex(currentIndex - 1);
    } else if (removedIndex === currentIndex) {
      setCurrentIndex(Math.min(currentIndex, next.length - 1));
    }
  }

  function handleMove(fromIndex: number, toIndex: number): void {
    const next = moveTrack(tracks, fromIndex, toIndex);
    setTracks(next);
    if (currentIndex === fromIndex) setCurrentIndex(toIndex);
    else if (fromIndex < currentIndex && toIndex >= currentIndex) setCurrentIndex(currentIndex - 1);
    else if (fromIndex > currentIndex && toIndex <= currentIndex) setCurrentIndex(currentIndex + 1);
  }

  function handleClear(): void {
    for (const track of tracks) {
      if (track.url) URL.revokeObjectURL(track.url);
    }
    setTracks([]);
    setCurrentIndex(-1);
    setPlaying(false);
    setAddedCount(null);
    setSkippedCount(0);
  }

  function togglePlay(): void {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }

  function playNext(): void {
    const next = nextTrackIndex(currentIndex, tracks.length, true);
    if (next !== -1) setCurrentIndex(next);
  }

  function playPrevious(): void {
    const prev = previousTrackIndex(currentIndex, tracks.length);
    if (prev !== -1) setCurrentIndex(prev);
  }

  function handleSeek(value: number): void {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="music-player-title">
      <div style={heroStyle}>
        <h2 id="music-player-title" style={{ fontSize: 22, color: '#fff', margin: '0 0 4px', fontFamily: 'var(--font-head)' }}>
          {t({ bn: 'গান শুনুন', en: 'Music player' })}
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.92)', fontSize: 14, margin: 0 }}>
          {t({
            bn: 'আপনার ডিভাইসের গান বাছুন — গান কোথাও আপলোড হয় না, শুধু এই ব্রাউজারেই বাজে।',
            en: 'Pick songs from your device — nothing is uploaded, everything plays only in this browser.',
          })}
        </p>
        <span style={trustChipStyle}>
          {t({ bn: '১০০% ব্রাউজারে • কোনো আপলোড নয়', en: '100% in-browser • nothing uploaded' })}
        </span>
      </div>
      <div>
        <label style={labelStyle} htmlFor="music-player-files">
          {t({ bn: 'গানের ফাইল', en: 'Audio files' })}
        </label>
        <input
          id="music-player-files"
          style={inputStyle}
          type="file"
          accept="audio/*"
          multiple
          onChange={(e) => handleAddFiles(e.target.files)}
        />
        {addedCount !== null ? (
          <p style={noteStyle} role="status">
            {t({ bn: 'যোগ হয়েছে: ', en: 'Added: ' })}
            {addedCount}
            {skippedCount > 0
              ? ` · ${t({ bn: 'বাদ গেছে (আগে থেকে আছে বা অডিও নয়): ', en: 'Skipped (already added or not audio): ' })}${skippedCount}`
              : ''}
          </p>
        ) : null}
      </div>

      <audio
        ref={audioRef}
        aria-label={t({ bn: 'গান চালানোর প্লেয়ার', en: 'Audio player' })}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => {
          const next = nextTrackIndex(currentIndex, tracks.length, true);
          if (next === -1) setPlaying(false);
          else setCurrentIndex(next);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 10, background: 'var(--teal-soft)' }}>
        <p style={headlineStyle}>
          {currentTrack
            ? currentTrack.name
            : t({ bn: 'কোনো গান বাছা হয়নি', en: 'No song selected' })}
        </p>
        <div style={statGridStyle}>
          <div style={statTileStyle}>
            <p style={statLabelStyle}>{t({ bn: 'এখন', en: 'Now' })}</p>
            <p style={statValueStyle}>{formatSeconds(currentTime)}</p>
          </div>
          <div style={statTileStyle}>
            <p style={statLabelStyle}>{t({ bn: 'মোট', en: 'Total' })}</p>
            <p style={statValueStyle}>{formatSeconds(duration)}</p>
          </div>
          <div style={statTileStyle}>
            <p style={statLabelStyle}>{t({ bn: 'গান', en: 'Track' })}</p>
            <p style={statValueStyle}>
              {tracks.length > 0 ? `${currentIndex + 1} / ${tracks.length}` : '—'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
          <Button onClick={playPrevious} disabled={tracks.length === 0}>
            {t({ bn: 'আগেরটি', en: 'Previous' })}
          </Button>
          <Button onClick={togglePlay} disabled={!currentTrack}>
            {playing
              ? t({ bn: 'থামান', en: 'Pause' })
              : t({ bn: 'চালান', en: 'Play' })}
          </Button>
          <Button onClick={playNext} disabled={tracks.length === 0}>
            {t({ bn: 'পরেরটি', en: 'Next' })}
          </Button>
          <button
            type="button"
            className="ev-btn ev-btn-outline"
            style={{ minHeight: 44, padding: '10px 14px', fontSize: 14, background: loop ? 'var(--teal)' : 'var(--card)', color: loop ? '#fff' : 'var(--heading)', borderColor: loop ? 'var(--teal)' : 'var(--heading)' }}
            aria-pressed={loop}
            disabled={!currentTrack}
            onClick={() => setLoop((l) => !l)}
          >
            {t({ bn: 'লুপ', en: 'Loop' })}
          </button>
          <button
            type="button"
            className="ev-btn ev-btn-outline"
            style={{ minHeight: 44, padding: '10px 14px', fontSize: 14, background: muted ? 'var(--teal)' : 'var(--card)', color: muted ? '#fff' : 'var(--heading)', borderColor: muted ? 'var(--teal)' : 'var(--heading)' }}
            aria-pressed={muted}
            disabled={!currentTrack}
            onClick={() => setMuted((m) => !m)}
          >
            {muted
              ? t({ bn: 'শব্দ চালু করুন', en: 'Unmute' })
              : t({ bn: 'নিঃশব্দ', en: 'Mute' })}
          </button>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle} htmlFor="music-player-seek">
            {t({ bn: 'সময়', en: 'Seek' })}
          </label>
          <input
            id="music-player-seek"
            style={{ ...inputStyle, padding: '10px 12px' }}
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={Number.isFinite(currentTime) ? Math.min(currentTime, duration || 0) : 0}
            disabled={!currentTrack}
            onChange={(e) => handleSeek(Number(e.target.value))}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle} htmlFor="music-player-volume">
            {t({ bn: 'ভলিউম: ', en: 'Volume: ' })}
            {Math.round(volume * 100)}%
          </label>
          <input
            id="music-player-volume"
            style={{ ...inputStyle, padding: '10px 12px' }}
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle} htmlFor="music-player-speed">
            {t({ bn: 'গতি', en: 'Speed' })}
          </label>
          <select
            id="music-player-speed"
            style={inputStyle}
            value={speed}
            disabled={!currentTrack}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
              <option key={rate} value={rate}>
                {rate}×
              </option>
            ))}
          </select>
        </div>
      </div>
      <p style={noteStyle}>
        {t({
          bn: 'শর্টকাট: Space — চালান / থামান · ← → — ১০ সেকেন্ড আগে / পরে · M — নিঃশব্দ · L — লুপ',
          en: 'Shortcuts: Space — play / pause · ← → — 10 seconds back / forward · M — mute · L — loop',
        })}
      </p>

      {tracks.length > 0 ? (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15, color: 'var(--heading)', margin: 0 }}>
              {t({ bn: 'প্লেলিস্ট', en: 'Playlist' })}
            </h3>
            <button type="button" style={smallButtonStyle} onClick={handleClear}>
              {t({ bn: 'সব মুছুন', en: 'Clear all' })}
            </button>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {tracks.map((track, index) => (
              <li key={track.id} style={trackRowStyle}>
                <button
                  type="button"
                  style={{
                    ...smallButtonStyle,
                    fontWeight: index === currentIndex ? 700 : 400,
                    borderColor: index === currentIndex ? 'var(--teal, #0b7285)' : 'var(--line)',
                    flex: 1,
                    textAlign: 'left',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  onClick={() => setCurrentIndex(index)}
                  aria-current={index === currentIndex}
                >
                  {index + 1}. {track.name} ({formatBytes(track.size)})
                </button>
                <button
                  type="button"
                  style={smallButtonStyle}
                  disabled={index === 0}
                  onClick={() => handleMove(index, index - 1)}
                  aria-label={t({ bn: 'উপরে নিন', en: 'Move up' })}
                >
                  ↑
                </button>
                <button
                  type="button"
                  style={smallButtonStyle}
                  disabled={index === tracks.length - 1}
                  onClick={() => handleMove(index, index + 1)}
                  aria-label={t({ bn: 'নিচে নিন', en: 'Move down' })}
                >
                  ↓
                </button>
                <button
                  type="button"
                  style={smallButtonStyle}
                  onClick={() => handleRemove(track.id)}
                  aria-label={`${t({ bn: 'মুছুন', en: 'Remove' })} ${track.name}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <p style={noteStyle}>
            {t({
              bn: 'গান শুধু এই ব্রাউজারেই বাজে — পেজ বন্ধ করলে প্লেলিস্ট মুছে যাবে।',
              en: 'Songs play only in this browser — the playlist is gone when the page closes.',
            })}
          </p>
        </div>
      ) : null}
    </section>
  );
}

