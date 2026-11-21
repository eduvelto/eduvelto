// Eduvelto — role setup (Step 5).
//
// Shown after Google sign-in when the account has NO profile document
// yet: the user picks ONE role (student / teacher / guardian) and fills
// the role's academic fields, then the profile is created with that
// role. The AuthProvider does NOT auto-create a profile while this
// page is open (see lib/auth.tsx — role-setup hold), so the role
// choice is never lost to a default 'student' document.
// Nobody can pick admin / moderator / owner here — those roles are not
// offered, and the rules reject them at creation anyway.
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { PageShell } from '../components/PageShell';
import { strings } from '../i18n/strings';
import { releaseProfileCreationHold, useAuth } from '../lib/auth';
import { ensureUserProfile } from '../lib/profile';
import type { EducationType, ProfileEdit } from '../lib/profile';

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

const EDUCATION_TYPES: { value: EducationType; bn: string; en: string }[] = [
  { value: 'general', bn: 'সাধারণ', en: 'General' },
  { value: 'madrasa', bn: 'মাদ্রাসা', en: 'Madrasa' },
  { value: 'technical', bn: 'কারিগরি', en: 'Technical' },
  { value: 'higher', bn: 'উচ্চশিক্ষা', en: 'Higher' },
  { value: 'other', bn: 'অন্যান্য', en: 'Other' },
];

type RoleChoice = 'student' | 'teacher' | 'parent';

export default function RoleSetupPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const d = strings.dashboard;
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
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <PageShell titleBn={d.rolePickerTitle.bn} titleEn={d.rolePickerTitle.en}>
        <p>{strings.common.loading.bn}</p>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell titleBn={d.rolePickerTitle.bn} titleEn={d.rolePickerTitle.en}>
        <p>{strings.profile.notSignedIn.bn}</p>
        <p>
          <Link to="/login">{strings.auth.loginTitle.bn}</Link>
        </p>
      </PageShell>
    );
  }

  if (profile) {
    return (
      <PageShell titleBn={d.rolePickerTitle.bn} titleEn={d.rolePickerTitle.en}>
        <p>আপনার প্রোফাইল ইতিমধ্যে তৈরি আছে।</p>
        <p>
          <Link to="/dashboard">ড্যাশবোর্ডে যান →</Link>
        </p>
      </PageShell>
    );
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!db || !user) return;
    setError(null);
    if (role === 'parent' && phone.trim().length < 11) {
      setError('অভিভাবকের ফোন নম্বর আবশ্যক (কমপক্ষে ১১ সংখ্যা)। / A guardian phone number is required (at least 11 digits).');
      return;
    }
    if (role === 'teacher' && (!subjects.trim() || !qualifications.trim())) {
      setError('শিক্ষকের কমপক্ষে একটি বিষয় ও একটি যোগ্যতা লাগবে। / A teacher needs at least one subject and one qualification.');
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
      fields.subjects = subjects.split(',').map((s) => s.trim()).filter(Boolean);
      fields.qualifications = qualifications.trim() || null;
    }
    setBusy(true);
    try {
      await ensureUserProfile(db, user, undefined, { role, fields });
      releaseProfileCreationHold();
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'প্রোফাইল তৈরি করা যায়নি। / Could not create the profile.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell titleBn={d.rolePickerTitle.bn} titleEn={d.rolePickerTitle.en}>
      <p style={{ color: '#555' }}>
        একটি ভূমিকা বাছাই করুন — পরে এটি নিজে বদলানো যায় না। / Choose one role — you cannot change it yourself later.
      </p>
      <form onSubmit={onSubmit}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
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
                ...buttonStyle,
                background: role === value ? '#0A1F44' : '#fff',
                color: role === value ? '#fff' : '#0A1F44',
                border: '1px solid #0A1F44',
              }}
            >
              {label}
            </button>
          ))}
        </div>
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
            <p style={{ color: '#555' }}>
              {strings.auth.teacherRegisterNote.bn} {strings.auth.teacherRegisterNote.en}
            </p>
          </>
        ) : null}
        {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
        <button style={buttonStyle} type="submit" disabled={busy}>
          {busy ? strings.common.loading.bn : `${strings.common.save.bn} / ${strings.common.save.en}`}
        </button>
      </form>
    </PageShell>
  );
}
