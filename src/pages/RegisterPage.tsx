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
import { T, useLanguage } from '../i18n/LanguageContext';

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
  const { t } = useLanguage();
  const s = strings.auth;
  const d = strings.dashboard;

  if (!isFirebaseConfigured) {
    return (
      <PageShell titleBn={s.registerTitle.bn} titleEn={s.registerTitle.en}>
        <p>{t(s.notConfigured)}</p>
      </PageShell>
    );
  }

  if (user) {
    return (
      <PageShell titleBn={s.registerTitle.bn} titleEn={s.registerTitle.en}>
        <p>{t({ bn: 'আপনি ইতিমধ্যে লগইন করেছেন।', en: 'You are already signed in.' })}</p>
        <p>
          <Link to="/profile">{t({ bn: 'প্রোফাইল দেখুন →', en: 'View profile →' })}</Link>
        </p>
      </PageShell>
    );
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setLocalError(null);
    if (displayName.trim().length === 0 || displayName.trim().length > 100) {
      setLocalError(t({ bn: 'নাম ১ থেকে ১০০ অক্ষরের মধ্যে হতে হবে।', en: 'Name must be between 1 and 100 characters.' }));
      return;
    }
    if (password.length < 6) {
      setLocalError(t(s.weakPassword));
      return;
    }
    if (password !== confirm) {
      setLocalError(t(s.passwordsDoNotMatch));
      return;
    }
    if (role === 'parent' && phone.trim().length < 11) {
      setLocalError(t({ bn: 'অভিভাবকের ফোন নম্বর আবশ্যক (কমপক্ষে ১১ সংখ্যা)।', en: 'A guardian phone number is required (at least 11 digits).' }));
      return;
    }
    if (role === 'teacher' && (!subjects.trim() || !qualifications.trim())) {
      setLocalError(t({ bn: 'শিক্ষকের কমপক্ষে একটি বিষয় ও একটি যোগ্যতা লাগবে।', en: 'A teacher needs at least one subject and one qualification.' }));
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
      <p style={{ color: '#555' }}>{t(s.studentNote)}</p>
      <form onSubmit={onSubmit}>
        <label>
          <T bn={s.displayName.bn} en={s.displayName.en} />
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
          <T bn={s.email.bn} en={s.email.en} />
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
          <T bn={s.password.bn} en={s.password.en} />
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
          <T bn={s.confirmPassword.bn} en={s.confirmPassword.en} />
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
          <legend style={{ fontWeight: 700 }}><T bn={d.rolePickerTitle.bn} en={d.rolePickerTitle.en} /></legend>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {(
              [
                ['student', d.roleStudent],
                ['teacher', d.roleTeacher],
                ['parent', d.roleGuardian],
              ] as [RoleChoice, { bn: string; en: string }][]
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
                {t(label)}
              </button>
            ))}
          </div>
          <p style={{ color: '#555', fontSize: 14, margin: '0 0 12px' }}>
            <T bn="ভূমিকা পরে নিজে বদলানো যায় না।" en="The role cannot be changed yourself later." />
          </p>
          <label>
            <T bn={strings.profile.educationType.bn} en={strings.profile.educationType.en} />
            <select
              style={inputStyle}
              value={educationType}
              onChange={(e) => setEducationType(e.target.value as EducationType)}
            >
              {EDUCATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  <T bn={t.bn} en={t.en} />
                </option>
              ))}
            </select>
          </label>
          <label>
            <T bn={strings.profile.board.bn} en={strings.profile.board.en} />
            <input style={inputStyle} type="text" value={board} onChange={(e) => setBoard(e.target.value)} placeholder={t({ bn: 'যেমন: National University', en: 'e.g.: National University' })} />
          </label>
          <label>
            <T bn={strings.profile.institution.bn} en={strings.profile.institution.en} />
            <input style={inputStyle} type="text" value={institution} onChange={(e) => setInstitution(e.target.value)} />
          </label>
          <label>
            <T bn={d.academicSession.bn} en={d.academicSession.en} />
            <input style={inputStyle} type="text" value={academicSession} onChange={(e) => setAcademicSession(e.target.value)} placeholder={t({ bn: 'যেমন: 2025-26', en: 'e.g.: 2025-26' })} />
          </label>
          <label>
            <T bn={d.curriculum.bn} en={d.curriculum.en} />
            <input style={inputStyle} type="text" value={curriculum} onChange={(e) => setCurriculum(e.target.value)} placeholder={t({ bn: 'যেমন: NCTB 2023, NU 2013-14', en: 'e.g.: NCTB 2023, NU 2013-14' })} />
          </label>
          <label>
            <T bn={strings.profile.classLevel.bn} en={strings.profile.classLevel.en} />
            <input style={inputStyle} type="text" value={classLevel} onChange={(e) => setClassLevel(e.target.value)} placeholder={t({ bn: 'যেমন: Class 5, SSC, 3rd Year', en: 'e.g.: Class 5, SSC, 3rd Year' })} />
          </label>
          <label>
            <T bn={strings.profile.department.bn} en={strings.profile.department.en} />
            <input style={inputStyle} type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder={t({ bn: 'যেমন: Science, English', en: 'e.g.: Science, English' })} />
          </label>
          {educationType === 'higher' ? (
            <label>
              <T bn={d.semester.bn} en={d.semester.en} />
              <input style={inputStyle} type="text" value={semester} onChange={(e) => setSemester(e.target.value)} placeholder={t({ bn: 'যেমন: 1st Semester', en: 'e.g.: 1st Semester' })} />
            </label>
          ) : null}
          {role === 'parent' ? (
            <label>
              <T bn={d.phone.bn} en={d.phone.en} /> *
              <input style={inputStyle} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t({ bn: 'যেমন: 01XXXXXXXXX', en: 'e.g.: 01XXXXXXXXX' })} />
            </label>
          ) : null}
          {role === 'teacher' ? (
            <>
              <label>
                <T bn={d.teachingLevel.bn} en={d.teachingLevel.en} />
                <input style={inputStyle} type="text" value={teachingLevel} onChange={(e) => setTeachingLevel(e.target.value)} placeholder={t({ bn: 'যেমন: Honours', en: 'e.g.: Honours' })} />
              </label>
              <label>
                <T bn={d.subjects.bn} en={d.subjects.en} /> * <T bn="(কমা দিয়ে আলাদা করুন)" en="(comma-separated)" />
                <input style={inputStyle} type="text" value={subjects} onChange={(e) => setSubjects(e.target.value)} placeholder={t({ bn: 'যেমন: English, Mathematics', en: 'e.g.: English, Mathematics' })} />
              </label>
              <label>
                <T bn={d.qualifications.bn} en={d.qualifications.en} /> *
                <input style={inputStyle} type="text" value={qualifications} onChange={(e) => setQualifications(e.target.value)} placeholder={t({ bn: 'যেমন: M.A. in English', en: 'e.g.: M.A. in English' })} />
              </label>
              <p style={{ color: '#555', fontSize: 14 }}>
                <T bn={s.teacherRegisterNote.bn} en={s.teacherRegisterNote.en} />
              </p>
            </>
          ) : null}
        </fieldset>
        {shownError ? <p style={{ color: '#b00020' }}>{shownError}</p> : null}
        <button style={buttonStyle} type="submit" disabled={busy || loading}>
          {busy ? <T bn={strings.common.loading.bn} en={strings.common.loading.en} /> : <T bn={s.registerButton.bn} en={s.registerButton.en} />}
        </button>
      </form>
      <p style={{ margin: '16px 0' }}>{t({ bn: '— অথবা —', en: '— or —' })}</p>
      <button
        style={{ ...buttonStyle, background: '#fff', color: '#111', border: '1px solid #aaa' }}
        type="button"
        onClick={() => void onGoogle()}
        disabled={busy || loading}
      >
        <T bn={s.loginWithGoogle.bn} en={s.loginWithGoogle.en} />
      </button>
      <p style={{ marginTop: 20 }}>
        {t(s.haveAccount)} <Link to="/login">{t(s.loginTitle)}</Link>
      </p>
      <p>
        {t({ bn: 'শিক্ষক হিসেবে রেজিস্টার করতে চান?', en: 'Want to register as a teacher?' })}{' '}
        <Link to="/teacher/register">{t(s.teacherRegisterTitle)}</Link>
      </p>
    </PageShell>
  );
}
