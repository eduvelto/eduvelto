import { PageShell } from '../components/PageShell';

// Install instructions (owner brief 21 Nov 07:32 — website-first PWA).
// Android: Chrome fires beforeinstallprompt; the install bar (InstallAppPrompt)
// appears automatically. iPhone/iPad: Safari never fires it, so the only
// route is Share -> Add to Home Screen. This page is the permanent,
// always-available entry point (header link + link from the install bar).
// HONESTY RULE: this page states plainly what needs the internet — the
// offline page and the cached app shell work without it, but library,
// lessons, exams, results, login and progress all need a connection,
// because their data lives in Firestore and is never cached offline.
const cardStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: 8,
  padding: '16px',
  background: '#fafafa',
  marginBottom: 16,
};

const stepStyle: React.CSSProperties = { margin: '6px 0', lineHeight: 1.6 };

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px',
  borderBottom: '2px solid #0A1F44',
  background: '#0A1F44',
  color: '#fff',
};

const tdStyle: React.CSSProperties = {
  padding: '8px',
  borderBottom: '1px solid #ddd',
  verticalAlign: 'top',
  lineHeight: 1.5,
};

export default function InstallPage() {
  return (
    <PageShell titleBn="অ্যাপ ইনস্টল করুন" titleEn="Install the Eduvelto app">
      <p style={{ lineHeight: 1.6 }}>
        Eduvelto ফোনে অ্যাপের মতো ইনস্টল করা যায় — Play Store বা App Store থেকে
        ডাউনলোড করতে হয় না। ব্রাউজার থেকেই ইনস্টল করুন, হোম স্ক্রিনের আইকন
        চাপলেই অ্যাপের মতো খুলবে।
      </p>
      <p style={{ color: '#555', lineHeight: 1.6 }}>
        Eduvelto installs on your phone like an app — no Play Store or App
        Store download needed. Install it from the browser; tap the home-screen
        icon and it opens like an app.
      </p>

      <div style={cardStyle}>
        <h2 style={{ fontSize: 19, margin: '0 0 8px' }}>Android (Chrome) — অ্যান্ড্রয়েড</h2>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          <li style={stepStyle}>Chrome ব্রাউজারে eduvelto.web.app খুলুন। / Open eduvelto.web.app in Chrome.</li>
          <li style={stepStyle}>
            উপরে বা নিচে &ldquo;অ্যাপ ইনস্টল করুন / Install app&rdquo; বার্তা এলে সেটাতে
            চাপুন, তারপর <strong>Install</strong> চাপুন। / If an &ldquo;Install app&rdquo;
            message appears, tap it, then tap <strong>Install</strong>.
          </li>
          <li style={stepStyle}>
            বার্তা না এলে: Chrome-এর উপরে ডানদিকে তিনটি ডট (⋮) চাপুন &rarr;{' '}
            <strong>Install app</strong> বা <strong>Add to Home screen</strong> খুঁজুন
            &rarr; <strong>Install / Add</strong> চাপুন। / If no message appears: tap the
            three dots (⋮) at the top right of Chrome &rarr; <strong>Install app</strong> or{' '}
            <strong>Add to Home screen</strong> &rarr; <strong>Install / Add</strong>.
          </li>
          <li style={stepStyle}>
            হোম স্ক্রিনে Eduvelto আইকন আসবে — সেটা চাপলে অ্যাপের মতো খুলবে, উপরে
            Chrome-এর ঠিকানা বার থাকবে না। / The Eduvelto icon appears on your home
            screen — tap it and it opens like an app, without Chrome&rsquo;s address bar.
          </li>
        </ol>
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontSize: 19, margin: '0 0 8px' }}>iPhone / iPad (Safari) — আইফোন / আইপ্যাড</h2>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          <li style={stepStyle}>
            <strong>Safari</strong> ব্রাউজারে eduvelto.web.app খুলুন (Chrome দিয়ে হবে না)।
            / Open eduvelto.web.app in <strong>Safari</strong> (not Chrome).
          </li>
          <li style={stepStyle}>
            নিচের (বা উপরের) <strong>Share</strong> বোতাম চাপুন — বর্গক্ষেত্রের উপর
            তীর-চিহ্ন। / Tap the <strong>Share</strong> button — the square with an
            arrow pointing up.
          </li>
          <li style={stepStyle}>
            তালিকা থেকে <strong>Add to Home Screen</strong> (হোম স্ক্রিনে যোগ করুন)
            বেছে নিন, তারপর উপরে ডানদিকে <strong>Add</strong> চাপুন। / Choose{' '}
            <strong>Add to Home Screen</strong> from the list, then tap{' '}
            <strong>Add</strong> at the top right.
          </li>
          <li style={stepStyle}>
            হোম স্ক্রিনে Eduvelto আইকন আসবে — সেটা চাপলে অ্যাপের মতো খুলবে। /
            The Eduvelto icon appears on your home screen — tap it and it opens
            like an app.
          </li>
        </ol>
      </div>

      <h2 style={{ fontSize: 19, margin: '24px 0 8px' }}>
        অফলাইনে কী চলে, কী চলে না / What works offline, what does not
      </h2>
      <p style={{ lineHeight: 1.6 }}>
        সত্যি কথাটা পরিষ্কার করে বলা হচ্ছে: সব ফিচার অফলাইনে চলে না। নিচের
        তালিকাটা দেখে নিন।
      </p>
      <p style={{ color: '#555', lineHeight: 1.6 }}>
        Stated plainly: not every feature works offline. See the table below.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
          <thead>
            <tr>
              <th style={thStyle}>ফিচার / Feature</th>
              <th style={thStyle}>অফলাইনে / Offline</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>অ্যাপ খোলা (হোম স্ক্রিন আইকন থেকে) / Opening the app</td>
              <td style={tdStyle}>হ্যাঁ — অফলাইন পাতা দেখায় / Yes — shows the offline page</td>
            </tr>
            <tr>
              <td style={tdStyle}>অ্যাপের মূল কাঠামো (মেনু, পাতার খোলস) / App shell (menu, page frame)</td>
              <td style={tdStyle}>হ্যাঁ — ক্যাশে সংরক্ষিত / Yes — cached</td>
            </tr>
            <tr>
              <td style={tdStyle}>লাইব্রেরি, বই, লেসন, প্রশ্নব্যাংক / Library, books, lessons, question banks</td>
              <td style={tdStyle}>না — ইন্টারনেট লাগবে / No — needs internet</td>
            </tr>
            <tr>
              <td style={tdStyle}>পরীক্ষা দেওয়া ও রেজাল্ট / Exams and results</td>
              <td style={tdStyle}>না — ইন্টারনেট লাগবে / No — needs internet</td>
            </tr>
            <tr>
              <td style={tdStyle}>লগইন, রেজিস্টার, প্রোফাইল, অগ্রগতি / Login, register, profile, progress</td>
              <td style={tdStyle}>না — ইন্টারনেট লাগবে / No — needs internet</td>
            </tr>
            <tr>
              <td style={tdStyle}>বুকমার্ক, পড়া শেষ, রুটিন / Bookmarks, completed lessons, routine</td>
              <td style={tdStyle}>না — ইন্টারনেট লাগবে / No — needs internet</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style={{ lineHeight: 1.6 }}>
        কারণ: বই, লেসন, পরীক্ষা ও আপনার অ্যাকাউন্টের তথ্য সার্ভারে (Firebase)
        থাকে এবং সবসময় নতুন তথ্য দেখানো হয় — তাই সেগুলো ফোনে সংরক্ষণ করা হয়
        না। ইন্টারনেট ফিরে এলে অ্যাপ আবার স্বাভাবিকভাবে চলে; আনইনস্টল করলেও
        আপনার অ্যাকাউন্ট, বই বা অগ্রগতি মোছে না — আবার ইনস্টল করে লগইন করলেই সব
        ফিরে আসে।
      </p>
      <p style={{ color: '#555', lineHeight: 1.6 }}>
        Why: books, lessons, exams and your account data live on the server
        (Firebase) and are always shown fresh, so they are not stored on your
        phone. When the internet returns, the app works normally again.
        Uninstalling does not delete your account, books or progress — install
        again, log in, and everything comes back.
      </p>

      <div style={cardStyle}>
        <h2 style={{ fontSize: 19, margin: '0 0 8px' }}>আনইনস্টল / Uninstall</h2>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          Android: হোম স্ক্রিনে Eduvelto আইকন চেপে ধরে রাখুন &rarr;{' '}
          <strong>Uninstall</strong> চাপুন। iPhone/iPad: আইকন চেপে ধরে রাখুন &rarr;{' '}
          <strong>Remove App / Delete App</strong> চাপুন। / Android: long-press the
          Eduvelto icon &rarr; <strong>Uninstall</strong>. iPhone/iPad: long-press
          the icon &rarr; <strong>Remove App / Delete App</strong>.
        </p>
      </div>
    </PageShell>
  );
}
