// Eduvelto — student profile (Step 1).
// Shows the signed-in student's profile and lets them edit ONLY the
// fields the security rules allow the owner to change: displayName,
// educationType, board, institution, academicYear, program, department,
// classLevel, language. Role, verificationStatus and isActive are shown
// read-only (when present) and can never be changed from this page —
// the rules deny it, and there is no UI for it.
// A suspended account (isActive === false) sees the suspended notice
// and cannot use the app (the App shell gates on it too).
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import type { EducationType, ProfileEdit } from '../lib/profile';
import { isFirebaseConfigured } from '../firebase';

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  margin: '6px 0 14px',
  fontSize: 16,
  border: '1px solid #aaa',
  borderRadius: 6,
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 18px',
  fontSize: 16,
  borderRadius: 6,
  border: 'none',
  background: '#0A1F44',
  color: '#fff',
  cursor: 'pointer',
};

const EDUCATION_TYPES: { value: EducationType | ''; bn: string; en: string }[] = [
  { value: '', bn: '— বাছাই করুন —', en: '— Choose —' },
  { value: 'general', bn: 'সাধারণ', en: 'General' },
  { value: 'madrasa', bn: 'মাদ্রাসা', en: 'Madrasa' },
  { value: 'technical', bn: 'কারিগরি', en: 'Technical' },
  { value: 'higher', bn: 'উচ্চশিক্ষা', en: 'Higher' },
  { value: 'other', bn: 'অন্যান্য', en: 'Other' },
];

export default function ProfilePage() {
  const { user, profile, loading, suspended, error, saveProfile, signOut } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');
  const [educationType, setEducationType] = useState<EducationType | ''>('');
  const [board, setBoard] = useState('');
  const [institution, setInstitution] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [program, setProgram] = useState('');
  const [department, setDepartment] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const p = strings.profile;

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? '');
    setLanguage(profile.language ?? 'bn');
    setEducationType(profile.educationType ?? '');
    setBoard(profile.board ?? '');
    setInstitution(profile.institution ?? '');
    setAcademicYear(profile.academicYear ?? '');
    setProgram(profile.program ?? '');
    setDepartment(profile.department ?? '');
    setClassLevel(profile.classLevel ?? '');
  }, [profile]);

  if (!isFirebaseConfigured) {
    return (
      <PageShell titleBn="প্রোফাইল" titleEn="Profile">
        <p>{strings.auth.notConfigured.bn}</p>
        <p style={{ color: '#555' }}>{strings.auth.notConfigured.en}</p>
      </PageShell>
    );
  }

  if (loading) {
    return (
      <PageShell titleBn="প্রোফাইল" titleEn="Profile">
        <p>{p.loadingProfile.bn}</p>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell titleBn="প্রোফাইল" titleEn="Profile">
        <p>{p.notSignedIn.bn}</p>
        <p>
          <Link to="/login">{strings.auth.loginTitle.bn}</Link> ·{' '}
          <Link to="/register">{strings.auth.registerTitle.bn}</Link>
        </p>
      </PageShell>
    );
  }

  if (suspended) {
    return (
      <PageShell titleBn="প্রোফাইল" titleEn="Profile">
        <div style={{ border: '1px solid #b00020', borderRadius: 8, padding: '20px 16px', background: '#fdf0f0' }}>
          <h2 style={{ marginTop: 0, color: '#b00020' }}>{p.suspendedTitle.bn}</h2>
          <p>{p.suspendedBody.bn}</p>
          <p style={{ color: '#555' }}>{p.suspendedBody.en}</p>
        </div>
        <p style={{ marginTop: 20 }}>
          <button style={buttonStyle} type="button" onClick={() => void signOut()}>
            {strings.nav.logout.bn} / {strings.nav.logout.en}
          </button>
        </p>
      </PageShell>
    );
  }

  if (!profile) {
    return (
      <PageShell titleBn="প্রোফাইল" titleEn="Profile">
        <p>প্রোফাইল লোড করা যায়নি।</p>
        {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
        <p>
          <button style={buttonStyle} type="button" onClick={() => void signOut()}>
            {strings.nav.logout.bn}
          </button>
        </p>
      </PageShell>
    );
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!profile) return;
    setLocalError(null);
    setSaved(false);
    const name = displayName.trim();
    if (name.length === 0 || name.length > 100) {
      setLocalError('নাম ১ থেকে ১০০ অক্ষরের মধ্যে হতে হবে।');
      return;
    }
    // Send only fields that actually changed (and only editable ones).
    const fields: ProfileEdit = {};
    const norm = (v: string | null | undefined): string | null => (v ?? '').trim() || null;
    if (name !== profile.displayName) fields.displayName = name;
    if (language !== profile.language) fields.language = language;
    const et = educationType === '' ? null : educationType;
    if (et !== (profile.educationType ?? null)) fields.educationType = et;
    if (norm(board) !== (profile.board ?? null)) fields.board = norm(board);
    if (norm(institution) !== (profile.institution ?? null)) fields.institution = norm(institution);
    if (norm(academicYear) !== (profile.academicYear ?? null)) fields.academicYear = norm(academicYear);
    if (norm(program) !== (profile.program ?? null)) fields.program = norm(program);
    if (norm(department) !== (profile.department ?? null)) fields.department = norm(department);
    if (norm(classLevel) !== (profile.classLevel ?? null)) fields.classLevel = norm(classLevel);

    if (Object.keys(fields).length === 0) {
      setSaved(true);
      return;
    }
    setBusy(true);
    try {
      await saveProfile(fields);
      setSaved(true);
    } catch {
      // Friendly message is in `error` from the AuthProvider.
    } finally {
      setBusy(false);
    }
  }

  const shownError = localError ?? error;
  const createdAt = profile.createdAt?.toDate?.();

  return (
    <PageShell titleBn="প্রোফাইল" titleEn="Profile">
      <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '6px 12px', margin: '0 0 20px' }}>
        <dt style={{ color: '#555' }}>{p.email.bn}</dt>
        <dd style={{ margin: 0 }}>{profile.email}</dd>
        <dt style={{ color: '#555' }}>{p.role.bn}</dt>
        <dd style={{ margin: 0 }}>{profile.role}</dd>
        {profile.verificationStatus ? (
          <>
            <dt style={{ color: '#555' }}>ভেরিফিকেশন</dt>
            <dd style={{ margin: 0 }}>{profile.verificationStatus}</dd>
          </>
        ) : null}
        {createdAt ? (
          <>
            <dt style={{ color: '#555' }}>{p.memberSince.bn}</dt>
            <dd style={{ margin: 0 }}>{createdAt.toLocaleDateString('bn-BD')}</dd>
          </>
        ) : null}
      </dl>

      <h2 style={{ fontSize: 20 }}>{p.editTitle.bn} / {p.editTitle.en}</h2>
      <form onSubmit={onSubmit}>
        <label>
          {strings.auth.displayName.bn} / {strings.auth.displayName.en}
          <input
            style={inputStyle}
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            maxLength={100}
          />
        </label>
        <label>
          {p.language.bn} / {p.language.en}
          <select style={inputStyle} value={language} onChange={(e) => setLanguage(e.target.value as 'bn' | 'en')}>
            <option value="bn">বাংলা</option>
            <option value="en">English</option>
          </select>
        </label>
        <label>
          {p.educationType.bn} / {p.educationType.en}
          <select
            style={inputStyle}
            value={educationType}
            onChange={(e) => setEducationType(e.target.value as EducationType | '')}
          >
            {EDUCATION_TYPES.map((t) => (
              <option key={t.value || 'none'} value={t.value}>
                {t.bn} / {t.en}
              </option>
            ))}
          </select>
        </label>
        <label>
          {p.board.bn} / {p.board.en}
          <input style={inputStyle} type="text" value={board} onChange={(e) => setBoard(e.target.value)} placeholder="যেমন: Dhaka" />
        </label>
        <label>
          {p.institution.bn} / {p.institution.en}
          <input style={inputStyle} type="text" value={institution} onChange={(e) => setInstitution(e.target.value)} />
        </label>
        <label>
          {p.academicYear.bn} / {p.academicYear.en}
          <input style={inputStyle} type="text" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="যেমন: 2026" />
        </label>
        <label>
          {p.program.bn} / {p.program.en}
          <input style={inputStyle} type="text" value={program} onChange={(e) => setProgram(e.target.value)} placeholder="যেমন: SSC, HSC, Dakhil" />
        </label>
        <label>
          {p.department.bn} / {p.department.en}
          <input style={inputStyle} type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="যেমন: Science" />
        </label>
        <label>
          {p.classLevel.bn} / {p.classLevel.en}
          <input style={inputStyle} type="text" value={classLevel} onChange={(e) => setClassLevel(e.target.value)} placeholder="যেমন: Class 10" />
        </label>
        {shownError ? <p style={{ color: '#b00020' }}>{shownError}</p> : null}
        {saved ? <p style={{ color: '#0A1F44' }}>{p.saved.bn}</p> : null}
        <button style={buttonStyle} type="submit" disabled={busy}>
          {busy ? strings.common.loading.bn : `${strings.common.save.bn} / ${strings.common.save.en}`}
        </button>
      </form>
      <p style={{ marginTop: 24 }}>
        <button
          style={{ ...buttonStyle, background: '#fff', color: '#111', border: '1px solid #aaa' }}
          type="button"
          onClick={() => void signOut()}
        >
          {strings.nav.logout.bn} / {strings.nav.logout.en}
        </button>
      </p>
    </PageShell>
  );
}
