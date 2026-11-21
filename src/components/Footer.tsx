// Eduvelto footer — global navigation + brand (design system v2, stage 2).
// Deep forest navy, ivory text. Links only to routes that exist in this
// branch (no /install here — that route lives on the PWA branch).

import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="ev-footer">
      <div className="ev-footer-inner">
        <div>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }} aria-label="Eduvelto — হোম">
            <img src="/logo-white.png" alt="Eduvelto" style={{ height: 36, width: 'auto', display: 'block' }} />
          </Link>
          <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.7 }}>
            শেখো, এগিয়ে যাও, স্বপ্ন গড়ো — Learn, Grow, Achieve.
            <br />
            বাংলাদেশের শিক্ষার্থীদের জন্য বিনামূল্যে ডিজিটাল শিক্ষা।
          </p>
        </div>
        <div>
          <h3>শিখুন / Learn</h3>
          <Link to="/directory">শিক্ষা নির্দেশিকা / Directory</Link>
          <Link to="/library">ডিজিটাল লাইব্রেরি / Library</Link>
          <Link to="/exam">পরীক্ষা / Exams</Link>
          <Link to="/progress">আমার অগ্রগতি / My Progress</Link>
        </div>
        <div>
          <h3>প্ল্যাটফর্ম / Platform</h3>
          <Link to="/about">আমাদের সম্পর্কে / About</Link>
          <Link to="/privacy">গোপনীয়তা নীতি / Privacy Policy</Link>
          <Link to="/contact">যোগাযোগ / Contact</Link>
          <Link to="/health">স্বাস্থ্য / Health</Link>
          <Link to="/ai-teacher">AI Teacher (পরিকল্পনায় আছে)</Link>
        </div>
      </div>
      <div className="ev-footer-bottom">
        © 2026 Eduvelto — বিনামূল্যে শিক্ষা, সবার জন্য। / Free education for everyone.
        <br />
        যোগাযোগ: ahmmizan23@gmail.com
      </div>
    </footer>
  );
}
