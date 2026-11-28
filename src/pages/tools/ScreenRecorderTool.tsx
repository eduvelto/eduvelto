// Eduvelto — Online Screen & Voice Recorder tool UI (28 Nov 2026, global batch item 2).
//
// Browser MediaRecorder + getDisplayMedia (screen) and getUserMedia
// (microphone). Everything is recorded and previewed in the browser —
// NO server upload anywhere. If the browser cannot capture the screen,
// the tool says so honestly instead of showing a dead button.
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolSection, gridStyle, inputStyle, labelStyle, noteStyle, resultStyle, errorStyle } from './eduToolUi';
import RewardedAdButton from '../../components/RewardedAdButton';

type Source = 'screen' | 'screen-mic' | 'mic';
type Phase = 'idle' | 'recording' | 'done';

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  for (const mt of ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']) {
    if (MediaRecorder.isTypeSupported(mt)) return mt;
  }
  return '';
}

export function ScreenRecorderTool() {
  const { t, lang } = useLanguage();
  const [source, setSource] = useState<Source>('screen-mic');
  const [phase, setPhase] = useState<Phase>('idle');
  const [supported, setSupported] = useState<{ screen: boolean; mic: boolean; recorder: boolean } | null>(null);
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamsRef = useRef<MediaStream[]>([]);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const downloadRef = useRef<HTMLAnchorElement | null>(null);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    const md = navigator.mediaDevices;
    setSupported({
      screen: Boolean(md && typeof md.getDisplayMedia === 'function'),
      mic: Boolean(md && typeof md.getUserMedia === 'function'),
      recorder: typeof MediaRecorder !== 'undefined',
    });
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamsRef.current.forEach((s) => s.getTracks().forEach((tr) => tr.stop()));
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopStreams() {
    streamsRef.current.forEach((s) => s.getTracks().forEach((tr) => tr.stop()));
    streamsRef.current = [];
  }

  function formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  }

  async function start() {
    setError('');
    setVideoUrl('');
    setAudioUrl('');
    if (!supported?.recorder) {
      setError(t({ bn: 'এই ব্রাউজারে রেকর্ডিং সমর্থিত নয়। Chrome, Edge বা Firefox-এর নতুন সংস্করণ ব্যবহার করুন।', en: 'Recording is not supported in this browser. Use a recent Chrome, Edge or Firefox.' }));
      return;
    }
    try {
      const streams: MediaStream[] = [];
      let combined: MediaStream;
      if (source === 'mic') {
        const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
        streams.push(mic);
        combined = mic;
      } else {
        if (!supported.screen) {
          setError(t({ bn: 'এই ব্রাউজারে স্ক্রিন রেকর্ডিং সমর্থিত নয় — স্ক্রিন শেয়ার করার সুবিধা (getDisplayMedia) নেই। Chrome বা Edge-এর নতুন সংস্করণে চেষ্টা করুন।', en: 'Screen recording is not supported in this browser — it has no screen-sharing (getDisplayMedia) support. Try a recent Chrome or Edge.' }));
          return;
        }
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        streams.push(screen);
        if (source === 'screen-mic') {
          try {
            const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
            streams.push(mic);
            combined = new MediaStream([...screen.getVideoTracks(), ...screen.getAudioTracks(), ...mic.getAudioTracks()]);
          } catch {
            // Mic denied but screen allowed: record the screen alone and say so.
            combined = screen;
            setError(t({ bn: 'মাইক্রোফোনের অনুমতি পাওয়া যায়নি, তাই শুধু স্ক্রিন (সিস্টেম শব্দসহ, যদি থাকে) রেকর্ড হচ্ছে।', en: 'Microphone permission was not given, so only the screen (with system sound if any) is being recorded.' }));
          }
        } else {
          combined = screen;
        }
      }
      streamsRef.current = streams;
      const mimeType = pickMimeType();
      const rec = new MediaRecorder(combined, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        if (timerRef.current) window.clearInterval(timerRef.current);
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        urlsRef.current.push(url);
        setFileSize(blob.size);
        if (source === 'mic') setAudioUrl(url);
        else setVideoUrl(url);
        setPhase('done');
        stopStreams();
      };
      rec.start(250);
      recorderRef.current = rec;
      setSeconds(0);
      setPhase('recording');
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
      // If the user stops sharing from the browser's own bar, end cleanly.
      combined.getVideoTracks()[0]?.addEventListener('ended', () => {
        if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      });
    } catch (err) {
      stopStreams();
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError') {
        setError(t({
          bn: 'অনুমতি দেওয়া হয়নি। অনুমতি দিতে: ব্রাউজারের ঠিকানা বারের বামে তালা/সেটিংস আইকনে ক্লিক করুন → স্ক্রিন/মাইক্রোফোনের পাশে “Allow” বেছে নিন → পাতাটি রিফ্রেশ করে আবার চেষ্টা করুন।',
          en: 'Permission was denied. To allow it: click the lock/settings icon at the left of the address bar → set Screen/Microphone to “Allow” → refresh the page and try again.',
        }));
      } else if (name === 'NotFoundError') {
        setError(t({ bn: 'কোনো স্ক্রিন বা মাইক্রোফোন পাওয়া যায়নি। ডিভাইস সংযুক্ত আছে কি না দেখুন।', en: 'No screen or microphone was found. Check that a device is connected.' }));
      } else {
        setError(t({ bn: 'রেকর্ডিং শুরু করা যায়নি। ব্রাউজারের অনুমতি আর ডিভাইস দেখে আবার চেষ্টা করুন।', en: 'Recording could not start. Check the browser permission and your device, then try again.' }));
      }
    }
  }

  function stop() {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }

  const sizeMb = (fileSize / (1024 * 1024)).toFixed(2);

  return (
    <ToolSection id="screen-recorder-title" titleBn="স্ক্রিন ও ভয়েস রেকর্ডার" titleEn="Screen & Voice Recorder"
      descBn="ব্রাউজারেই স্ক্রিন বা কণ্ঠ রেকর্ড করুন, দেখে নিন, .webm ডাউনলোড করুন। কোথাও আপলোড হয় না।"
      descEn="Record your screen or voice right in the browser, preview it, download .webm. Nothing is uploaded anywhere.">
      {supported && !supported.screen ? (
        <p style={errorStyle}>{t({ bn: 'এই ব্রাউজারে স্ক্রিন রেকর্ডিং সমর্থিত নয় (getDisplayMedia নেই)। শুধু ভয়েস রেকর্ডিং ব্যবহার করতে পারবেন।', en: 'Screen recording is not supported in this browser (no getDisplayMedia). Voice-only recording is still available.' })}</p>
      ) : null}
      {supported && !supported.recorder ? (
        <p style={errorStyle}>{t({ bn: 'এই ব্রাউজারে MediaRecorder নেই, তাই রেকর্ডিং করা যাবে না।', en: 'This browser has no MediaRecorder, so recording is not possible here.' })}</p>
      ) : null}
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="sr-source">{t({ bn: 'কী রেকর্ড করবেন', en: 'What to record' })}</label>
          <select id="sr-source" style={inputStyle} value={source} onChange={(e) => setSource(e.target.value as Source)}>
            <option value="screen-mic">{t({ bn: 'স্ক্রিন + মাইক্রোফোন', en: 'Screen + microphone' })}</option>
            <option value="screen" disabled={!supported?.screen}>{t({ bn: 'শুধু স্ক্রিন', en: 'Screen only' })}</option>
            <option value="mic">{t({ bn: 'শুধু কণ্ঠ (ভয়েস)', en: 'Voice only (microphone)' })}</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {phase !== 'recording' ? (
          <button type="button" className="ev-btn ev-btn-primary" style={{ minHeight: 44 }} onClick={() => void start()}
            disabled={!supported?.recorder || (source !== 'mic' && !supported?.screen)}>
            {t({ bn: '● রেকর্ড শুরু করুন', en: '● Start recording' })}
          </button>
        ) : (
          <button type="button" className="ev-btn ev-btn-primary" style={{ minHeight: 44 }} onClick={stop}>
            {t({ bn: '■ থামান ও প্রিভিউ দেখুন', en: '■ Stop & preview' })}
          </button>
        )}
      </div>
      {phase === 'recording' ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>● {t({ bn: 'রেকর্ড হচ্ছে', en: 'Recording' })} — {formatTime(seconds)}</p>
          <p style={noteStyle}>{t({ bn: 'ব্রাউজারের শেয়ার বারে “Stop sharing” চাপলেও রেকর্ডিং শেষ হবে।', en: 'Pressing “Stop sharing” in the browser share bar also ends the recording.' })}</p>
        </div>
      ) : null}
      {error ? <p style={errorStyle} role="alert">{error}</p> : null}
      {phase === 'done' && (videoUrl || audioUrl) ? (
        <div style={resultStyle}>
          <p style={{ margin: '0 0 8px' }}><strong>{t({ bn: 'প্রিভিউ', en: 'Preview' })}</strong> — {sizeMb} MB (.webm)</p>
          {videoUrl ? (
            <video src={videoUrl} controls style={{ width: '100%', maxHeight: 360, borderRadius: 8, background: '#000' }} />
          ) : (
            <audio src={audioUrl} controls style={{ width: '100%' }} />
          )}
          <div style={{ marginTop: 12 }}>
            <a ref={downloadRef} href={videoUrl || audioUrl} download={source === 'mic' ? 'voice-recording.webm' : 'screen-recording.webm'} style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
            {/* Ads rollout: a .webm take-away file is a high-value download (30s rewarded unlock; free download live, never a fake timer). */}
            <RewardedAdButton lang={lang} durationSeconds={30} onFreeDownload={() => downloadRef.current?.click()} />
          </div>
          <p style={noteStyle}>{t({ bn: 'রেকর্ডিং শুধু আপনার ব্রাউজারেই আছে — এটি কোনো সার্ভারে পাঠানো হয়নি।', en: 'The recording exists only in your browser — it was never sent to any server.' })}</p>
        </div>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'সীমা: ফাইল .webm আকারে নামে (ব্রাউজারের ফরম্যাট); সিস্টেম শব্দ পাওয়া ব্রাউজার ও অপারেটিং সিস্টেমের উপর নির্ভর করে।', en: 'Limits: the file downloads as .webm (the browser format); whether system sound is captured depends on the browser and operating system.' })}</p>
    </ToolSection>
  );
}
