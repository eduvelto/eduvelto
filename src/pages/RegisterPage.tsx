// Eduvelto — registration (Steps 1 + 5).
// Email/password sign-up + Google sign-in. The user picks ONE role
// (student / teacher / guardian) and fills that role's academic fields
// BEFORE the account is created. Email sign-up creates the profile
// with the chosen role in one step; Google sign-in holds profile
// creation and sends the user to /register/role to choose (see
// lib/auth.tsx — role-setup hold). Registering never grants a
// "verified" badge: teachers are 'pending' until an Admin verifies
// them in the admin dashboard, and guardian links need child
// confirmation + Admin activation.
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import { isFirebaseConfigured } from '../firebase';
import type { EducationType, ProfileEdit } from '../lib/profile';

type RoleChoice = 'student' | 'teacher' | 'parent';

const EDUCATION_TYPES: { value: EducationType; bn: string; en: string }[] = [
  { value: 'general', bn: 'সাধারণ', en: 'General' },
  { value: 'madrasa', bn: 'মাদ্রাসা', en: 'Madrasa' },
  { value: 'technical', bn: 'কারিগরি', en: 'Technical' },
  { value: 'higher', bn: 'উচ্চশিক্ষা', en: 'Higher' },
  { value: 'other', bn: 'অন্যান্য', en: 'Other' },
];

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

export default function RegisterPage() {
  const { signUp, signInWithGoogle, user, error, loading } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<RoleChoice>('student');
  const [educationType, setEducationType] = useState<EducationType>('general');
  const [board, setBoard] = useState('');
  const [institution, setInstitution] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  const [curriculum, setCurriculum] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [phone, setPhone] = useState('');
  const [teachingLevel, setTeachingLevel] = useState('');
  const [subjects, setSubjects] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const s = strings.auth;
  const d = strings.dashboard;

  if (!isFirebaseConfigured) {
    return (
      <PageShell titleBn={s.registerTitle.bn} titleEn={s.registerTitle.en}>
        <p>{s.notConfigured.bn}</p>
        <p style={{ color: '#555' }}>{s.notConfigured.en}</p>
      </PageShell>
    );
  }

  if (user) {
    return (
      <PageShell titleBn={s.registerTitle.bn} titleEn={s.registerTitle.en}>
        <p>আপনি ইতিমধ্যে লগইন করেছেন।</p>
        <p>
          <Link to="/profile">প্রোফাইল দেখুন →</Link>
        </p>
      </PageShell>
    );
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setLocalError(null);
    if (displayName.trim().length === 0 || displayName.trim().length > 100) {
      setLocalError('নাম ১ থেকে ১০০ অক্ষরের মধ্যে হতে হবে।');
      return;
    }
    if (password.length < 6) {
      setLocalError(s.weakPassword?.bn ?? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    if (password !== confirm) {
      setLocalError(s.passwordsDoNotMatch.bn);
      return;
    }
    if (role === 'parent' && phone.trim().length < 11) {
      setLocalError('অভিভাবকের ফোন নম্বর আবশ্যক (কমপক্ষে ১১ সংখ্যা)। / A guardian phone number is required (at least 11 digits).');
      return;
    }
    if (role === 'teacher' && (!subjects.trim() || !qualifications.trim())) {
      setLocalError('শিক্ষকের কমপক্ষে একটি বিষয় ও একটি যোগ্যতা লাগবে। / A teacher needs at least one subject and one qualification.');
      return;
    }
    const fields: ProfileEdit = {
      educationType,
      board: board.trim() || null,
      institution: institution.trim() || null,
      academicSession: academicSession.trim() || null,
      curriculum: curriculum.trim() || null,
      classLevel: classLevel.trim() || null,
      department: department.trim() || null,
      semester: semester.trim() || null,
    };
    if (role === 'parent') fields.phone = phone.trim();
    if (role === 'teacher') {
      fields.teachingLevel = teachingLevel.trim() || null;
      fields.subjects = subjects.split(',').map((x) => x.trim()).filter(Boolean);
      fields.qualifications = qualifications.trim() || null;
    }
    setBusy(true);
    try {
      await signUp(displayName.trim(), email, password, { role, fields });
      // Teachers still file their verification application next — the
      // account is created as 'pending', never 'verified'.
      navigate(role === 'teacher' ? '/teacher/register' : '/dashboard');
    } catch {
      // The friendly message is already in `error` from the AuthProvider.
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle(): Promise<void> {
    setLocalError(null);
    setBusy(true);
    try {
      // Hold profile creation: /register/role creates it with the role.
      await signInWithGoogle({ holdForRoleSetup: true });
      navigate('/register/role');
    } catch {
      // Friendly message is in `error`.
    } finally {
      setBusy(false);
    }
  }

  const shownError = localError ?? error;

  return (
    <PageShell titleBn={s.registerTitle.bn} titleEn={s.registerTitle.en}>
      <p style={{ color: '#555' }}>{s.studentNote.bn}</p>
      <form onSubmit={onSubmit}>
        <label>
          {s.displayName.bn} / {s.displayName.en}
          <input
            style={inputStyle}
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
            required
            maxLength={100}
          />
        </label>
        <label>
          {s.email.bn} / {s.email.en}
          <input
            style={inputStyle}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          {s.password.bn} / {s.password.en}
          <input
            style={inputStyle}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={6}
          />
        </label>
        <label>
          {s.confirmPassword.bn} / {s.confirmPassword.en}
          <input
            style={inputStyle}
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
            minLength={6}
          />
        </label>
        <fieldset style={{ border: '1px solid #aaa', borderRadius: 6, padding: '12px', margin: '6px 0 14px' }}>
          <legend style={{ fontWeight: 700 }}>{d.rolePickerTitle.bn} / {d.rolePickerTitle.en}</legend>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {(
              [
                ['student', d.roleStudent.bn],
                ['teacher', d.roleTeacher.bn],
                ['parent', d.roleGuardian.bn],
              ] as [RoleChoice, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                style={{
                  padding: '10px 16px',
                  minHeight: 44,
                  borderRadius: 6,
                  border: '1px solid #0A1F44',
                  background: role === value ? '#0A1F44' : '#fff',
                  color: role === value ? '#fff' : '#0A1F44',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <p style={{ color: '#555', fontSize: 14, margin: '0 0 12px' }}>
            ভূমিকা পরে নিজে বদলানো যায় না। / The role cannot be changed yourself later.
          </p>
          <label>
            {strings.profile.educationType.bn} / {strings.profile.educationType.en}
            <select
              style={inputStyle}
              value={educationType}
              onChange={(e) => setEducationType(e.target.value as EducationType)}
            >
              {EDUCATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.bn} / {t.en}
                </option>
              ))}
            </select>
          </label>
          <label>
            {strings.profile.board.bn} / {strings.profile.board.en}
            <input style={inputStyle} type="text" value={board} onChange={(e) => setBoard(e.target.value)} placeholder="যেমন: National University" />
          </label>
          <label>
            {strings.profile.institution.bn} / {strings.profile.institution.en}
            <input style={inputStyle} type="text" value={institution} onChange={(e) => setInstitution(e.target.value)} />
          </label>
          <label>
            {d.academicSession.bn} / {d.academicSession.en}
            <input style={inputStyle} type="text" value={academicSession} onChange={(e) => setAcademicSession(e.target.value)} placeholder="যেমন: 2025-26" />
          </label>
          <label>
            {d.curriculum.bn} / {d.curriculum.en}
            <input style={inputStyle} type="text" value={curriculum} onChange={(e) => setCurriculum(e.target.value)} placeholder="যেমন: NCTB 2023, NU 2013-14" />
          </label>
          <label>
            {strings.profile.classLevel.bn} / {strings.profile.classLevel.en}
            <input style={inputStyle} type="text" value={classLevel} onChange={(e) => setClassLevel(e.target.value)} placeholder="যেমন: Class 5, SSC, 3rd Year" />
          </label>
          <label>
            {strings.profile.department.bn} / {strings.profile.department.en}
            <input style={inputStyle} type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="যেমন: Science, English" />
          </label>
          {educationType === 'higher' ? (
            <label>
              {d.semester.bn} / {d.semester.en}
              <input style={inputStyle} type="text" value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="যেমন: 1st Semester" />
            </label>
          ) : null}
          {role === 'parent' ? (
            <label>
              {d.phone.bn} / {d.phone.en} *
              <input style={inputStyle} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="যেমন: 01XXXXXXXXX" />
            </label>
          ) : null}
          {role === 'teacher' ? (
            <>
              <label>
                {d.teachingLevel.bn} / {d.teachingLevel.en}
                <input style={inputStyle} type="text" value={teachingLevel} onChange={(e) => setTeachingLevel(e.target.value)} placeholder="যেমন: Honours" />
              </label>
              <label>
                {d.subjects.bn} / {d.subjects.en} * (কমা দিয়ে আলাদা করুন / comma-separated)
                <input style={inputStyle} type="text" value={subjects} onChange={(e) => setSubjects(e.target.value)} placeholder="যেমন: English, Mathematics" />
              </label>
              <label>
                {d.qualifications.bn} / {d.qualifications.en} *
                <input style={inputStyle} type="text" value={qualifications} onChange={(e) => setQualifications(e.target.value)} placeholder="যেমন: M.A. in English" />
              </label>
              <p style={{ color: '#555', fontSize: 14 }}>
                {s.teacherRegisterNote.bn} {s.teacherRegisterNote.en}
              </p>
            </>
          ) : null}
        </fieldset>
        {shownError ? <p style={{ color: '#b00020' }}>{shownError}</p> : null}
        <button style={buttonStyle} type="submit" disabled={busy || loading}>
          {busy ? strings.common.loading.bn : `${s.registerButton.bn} / ${s.registerButton.en}`}
        </button>
      </form>
      <p style={{ margin: '16px 0' }}>— অথবা —</p>
      <button
        style={{ ...buttonStyle, background: '#fff', color: '#111', border: '1px solid #aaa' }}
        type="button"
        onClick={() => void onGoogle()}
        disabled={busy || loading}
      >
        {s.loginWithGoogle.bn} / {s.loginWithGoogle.en}
      </button>
      <p style={{ marginTop: 20 }}>
        {s.haveAccount.bn} <Link to="/login">{s.loginTitle.bn}</Link>
      </p>
      <p>
        শিক্ষক হিসেবে রেজিস্টার করতে চান? <Link to="/teacher/register">শিক্ষক রেজিস্ট্রেশন</Link>
      </p>
    </PageShell>
  );
}
