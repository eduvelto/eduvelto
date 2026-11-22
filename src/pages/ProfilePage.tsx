// Eduvelto — student profile (Step 1).
// Shows the signed-in student's profile and lets them edit ONLY the
// fields the security rules allow the owner to change: displayName,
// educationType, board, institution, academicYear, program, department,
// classLevel, language. Role and isActive are shown read-only (when
// present) and can never be changed from this page — the rules deny it,
// and there is no UI for it. `verificationStatus` is the mirror of a
// TEACHER application only, so it is shown ONLY for teachers: a student
// never has a verification state (owner decision 21 Nov 2026 — student
// identity verification removed entirely), and showing a rejected
// teacher application as "যাচাই" on a student's own profile would imply
// a student-verification gate that does not exist.
// A suspended account (isActive === false) sees the suspended notice
// and cannot use the app (the App shell gates on it too).
// Step 4 — Job Preparation section: mode (JobModeSwitch), enrolled
// categories, target exam, daily goals. All five Job fields are
// owner-editable (Step 3 §2.25/§3.1); role / verificationStatus /
// isActive stay out. Daily goals default to null (undecided) — never a
// fake default (Step 3 §12.3 item 5).
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import JobModeSwitch from '../components/JobModeSwitch';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import type { EducationType, ProfileEdit } from '../lib/profile';
import {
  JOB_CATEGORIES,
  clampDailyGoalMinutes,
  clampDailyGoalQuestions,
  effectiveJobPreferences,
  isTargetExamSlug,
  sanitizeEnrolledCategories,
  writeLocalJobDraft,
} from '../lib/jobProfile';
import { JOB_EXAMS } from '../lib/jobExams';
import { db, isFirebaseConfigured } from '../firebase';
import { listLinksForChild, updateLinkChildClass, type ParentLink } from '../lib/guardian';
import { T, useLanguage } from '../i18n/LanguageContext';

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
  const [academicSession, setAcademicSession] = useState('');
  const [curriculum, setCurriculum] = useState('');
  const [program, setProgram] = useState('');
  const [department, setDepartment] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [semester, setSemester] = useState('');
  const [phone, setPhone] = useState('');
  // Step 4 — Job Preparation fields (profile wins; a signed-out local
  // draft prefills empty profile fields — see effectiveJobPreferences).
  const [enrolledCategories, setEnrolledCategories] = useState<string[]>([]);
  const [targetExam, setTargetExam] = useState('');
  const [dailyGoalQuestions, setDailyGoalQuestions] = useState('');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  /** Two-step confirmation for academic-profile changes (Step 5). */
  const [confirming, setConfirming] = useState<ProfileEdit | null>(null);
  /** Guardian-link requests waiting for this student's confirmation. */
  const [childLinks, setChildLinks] = useState<ParentLink[] | null>(null);
  const { lang, t } = useLanguage();
  const p = strings.profile;
  const d = strings.dashboard;

  /** Book educationType value for the link snapshot (guardian filtering). */
  function bookTypeForProfile(educationType: EducationType | '' | null, programValue: string | null): string {
    if (educationType === 'higher') return 'Higher';
    if (educationType === 'madrasa') return 'Madrasa';
    if (educationType === 'technical') return 'Technical';
    if (educationType === 'general') return programValue === 'HSC' ? 'HSC' : 'SSC';
    return 'SSC';
  }

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? '');
    setLanguage(profile.language ?? 'bn');
    setEducationType(profile.educationType ?? '');
    setBoard(profile.board ?? '');
    setInstitution(profile.institution ?? '');
    setAcademicYear(profile.academicYear ?? '');
    setAcademicSession(profile.academicSession ?? '');
    setCurriculum(profile.curriculum ?? '');
    setProgram(profile.program ?? '');
    setDepartment(profile.department ?? '');
    setClassLevel(profile.classLevel ?? '');
    setSemester(profile.semester ?? '');
    setPhone(profile.phone ?? '');
    // Job fields: profile values; where the profile has none yet, a
    // local draft from this browser prefills the form (saved only when
    // the student presses Save — nothing is auto-uploaded).
    const job = effectiveJobPreferences(profile);
    setEnrolledCategories(job.enrolledCategories);
    setTargetExam(job.targetExam ?? '');
    setDailyGoalQuestions(job.dailyGoalQuestions != null ? String(job.dailyGoalQuestions) : '');
    setDailyGoalMinutes(job.dailyGoalMinutes != null ? String(job.dailyGoalMinutes) : '');
  }, [profile]);

  // Guardian-link requests for this student (confirm step).
  useEffect(() => {
    if (!user || !db || profile?.role !== 'student') return;
    let live = true;
    listLinksForChild(db, user.uid)
      .then((links) => {
        if (live) setChildLinks(links);
      })
      .catch(() => {
        if (live) setChildLinks([]);
      });
    return () => {
      live = false;
    };
  }, [user, profile?.role, saved]);

  if (!isFirebaseConfigured) {
    return (
      <PageShell titleBn="প্রোফাইল" titleEn="Profile">
        <p>{t(strings.auth.notConfigured)}</p>
      </PageShell>
    );
  }

  if (loading) {
    return (
      <PageShell titleBn="প্রোফাইল" titleEn="Profile">
        <p>{t(p.loadingProfile)}</p>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell titleBn="প্রোফাইল" titleEn="Profile">
        <p>{t(p.notSignedIn)}</p>
        <p>
          <Link to="/login">{t(strings.auth.loginTitle)}</Link> ·{' '}
          <Link to="/register">{t(strings.auth.registerTitle)}</Link>
        </p>
      </PageShell>
    );
  }

  if (suspended) {
    return (
      <PageShell titleBn="প্রোফাইল" titleEn="Profile">
        <div style={{ border: '1px solid #b00020', borderRadius: 8, padding: '20px 16px', background: '#fdf0f0' }}>
          <h2 style={{ marginTop: 0, color: '#b00020' }}>{t(p.suspendedTitle)}</h2>
          <p>{t(p.suspendedBody)}</p>
        </div>
        <p style={{ marginTop: 20 }}>
          <button style={buttonStyle} type="button" onClick={() => void signOut()}>
            <T bn={strings.nav.logout.bn} en={strings.nav.logout.en} />
          </button>
        </p>
      </PageShell>
    );
  }

  if (!profile) {
    return (
      <PageShell titleBn="প্রোফাইল" titleEn="Profile">
        <p>{t({ bn: 'প্রোফাইল লোড করা যায়নি।', en: 'Could not load profile.' })}</p>
        {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
        <p>
          <button style={buttonStyle} type="button" onClick={() => void signOut()}>
            <T bn={strings.nav.logout.bn} en={strings.nav.logout.en} />
          </button>
        </p>
      </PageShell>
    );
  }

  /** Academic fields — changing any of these needs the confirmation step. */
  const ACADEMIC_KEYS: (keyof ProfileEdit)[] = [
    'educationType',
    'board',
    'institution',
    'academicYear',
    'academicSession',
    'curriculum',
    'program',
    'department',
    'classLevel',
    'semester',
  ];

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!profile) return;
    setLocalError(null);
    setSaved(false);
    const name = displayName.trim();
    if (name.length === 0 || name.length > 100) {
      setLocalError(t({ bn: 'নাম ১ থেকে ১০০ অক্ষরের মধ্যে হতে হবে।', en: 'Name must be between 1 and 100 characters.' }));
      return;
    }
    if (profile.role === 'parent' && phone.trim().length < 11) {
      setLocalError(t({ bn: 'অভিভাবকের ফোন নম্বর আবশ্যক (কমপক্ষে ১১ সংখ্যা)।', en: 'A guardian phone number is required (at least 11 digits).' }));
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
    if (norm(academicSession) !== (profile.academicSession ?? null)) fields.academicSession = norm(academicSession);
    if (norm(curriculum) !== (profile.curriculum ?? null)) fields.curriculum = norm(curriculum);
    if (norm(program) !== (profile.program ?? null)) fields.program = norm(program);
    if (norm(department) !== (profile.department ?? null)) fields.department = norm(department);
    if (norm(classLevel) !== (profile.classLevel ?? null)) fields.classLevel = norm(classLevel);
    if (norm(semester) !== (profile.semester ?? null)) fields.semester = norm(semester);
    if (profile.role === 'parent' && phone.trim() !== (profile.phone ?? '')) fields.phone = phone.trim();

    // Step 4 — Job Preparation fields (any role: a teacher may also
    // prepare for a job exam). Empty goal = null (undecided), never a
    // fake default. Out-of-range goals are a form error, not a silent
    // clamp.
    const parseGoal = (raw: string): number | null | undefined => {
      const s = raw.trim();
      if (s === '') return null;
      const n = Math.floor(Number(s));
      return Number.isFinite(n) ? n : undefined;
    };
    const goalQ = parseGoal(dailyGoalQuestions);
    if (goalQ === undefined || (goalQ !== null && clampDailyGoalQuestions(goalQ) === null)) {
      setLocalError(t({ bn: 'দৈনিক লক্ষ্য (প্রশ্ন) ০ থেকে ৫০০-এর মধ্যে হতে হবে।', en: 'Daily goal (questions) must be between 0 and 500.' }));
      return;
    }
    const goalM = parseGoal(dailyGoalMinutes);
    if (goalM === undefined || (goalM !== null && clampDailyGoalMinutes(goalM) === null)) {
      setLocalError(t({ bn: 'দৈনিক লক্ষ্য (মিনিট) ০ থেকে ৬০০-এর মধ্যে হতে হবে।', en: 'Daily goal (minutes) must be between 0 and 600.' }));
      return;
    }
    const cleanCategories = sanitizeEnrolledCategories(enrolledCategories);
    const profileCategories = sanitizeEnrolledCategories(profile.enrolledCategories ?? []);
    if (cleanCategories.slice().sort().join(',') !== profileCategories.slice().sort().join(',')) {
      fields.enrolledCategories = cleanCategories;
    }
    const cleanTarget = targetExam !== '' && isTargetExamSlug(targetExam) ? targetExam : null;
    if (cleanTarget !== (profile.targetExam ?? null)) fields.targetExam = cleanTarget;
    if (goalQ !== (profile.dailyGoalQuestions ?? null)) fields.dailyGoalQuestions = goalQ;
    if (goalM !== (profile.dailyGoalMinutes ?? null)) fields.dailyGoalMinutes = goalM;

    if (Object.keys(fields).length === 0) {
      setSaved(true);
      return;
    }
    // Academic change → confirmation step (the invariant is shown there).
    if (ACADEMIC_KEYS.some((k) => k in fields)) {
      setConfirming(fields);
      return;
    }
    await doSave(fields);
  }

  async function doSave(fields: ProfileEdit): Promise<void> {
    if (!profile || !user) return;
    const firestore = db;
    if (!firestore) return;
    setBusy(true);
    try {
      await saveProfile(fields);
      // Step 4 — keep this browser's signed-out fallback in sync with
      // the saved Job values (the jobMode.ts pattern: profile wins on
      // sign-in, local is only the fallback).
      const jobKeys: (keyof ProfileEdit)[] = [
        'enrolledCategories',
        'targetExam',
        'dailyGoalQuestions',
        'dailyGoalMinutes',
      ];
      if (jobKeys.some((k) => k in fields)) {
        writeLocalJobDraft({
          enrolledCategories: fields.enrolledCategories ?? profile.enrolledCategories ?? [],
          targetExam: fields.targetExam !== undefined ? fields.targetExam : (profile.targetExam ?? null),
          dailyGoalQuestions:
            fields.dailyGoalQuestions !== undefined ? fields.dailyGoalQuestions : (profile.dailyGoalQuestions ?? null),
          dailyGoalMinutes:
            fields.dailyGoalMinutes !== undefined ? fields.dailyGoalMinutes : (profile.dailyGoalMinutes ?? null),
        });
      }
      // Student class/profile change → keep every guardian link's
      // snapshot in sync, so the guardian dashboard updates automatically.
      if (profile.role === 'student') {
        const academicChanged = ACADEMIC_KEYS.some((k) => k in fields);
        if (academicChanged) {
          const links = await listLinksForChild(firestore, user.uid);
          const snapshot = {
            childClassLevel: fields.classLevel ?? profile.classLevel ?? '',
            childDisplayName: fields.displayName ?? profile.displayName,
            childEducationType: bookTypeForProfile(
              fields.educationType ?? profile.educationType ?? null,
              fields.program ?? profile.program ?? null,
            ),
            childDepartment: fields.department ?? profile.department ?? undefined,
            childProgram: fields.program ?? profile.program ?? undefined,
            childBoard: fields.board ?? profile.board ?? undefined,
          };
          await Promise.all(links.map((l) => updateLinkChildClass(firestore, l.id, snapshot)));
        }
      }
      setConfirming(null);
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
        <dt style={{ color: '#555' }}>{t(p.email)}</dt>
        <dd style={{ margin: 0 }}>{profile.email}</dd>
        <dt style={{ color: '#555' }}>{t(p.role)}</dt>
        <dd style={{ margin: 0 }}>{profile.role === 'student' ? t(d.roleStudent) : profile.role === 'teacher' ? t(d.roleTeacher) : profile.role === 'parent' ? t(d.roleGuardian) : profile.role}</dd>
        <dt style={{ color: '#555' }}>Eduvelto ID</dt>
        <dd style={{ margin: 0 }}>
          <code style={{ wordBreak: 'break-all' }}>{user.uid}</code>
          <span style={{ color: '#555', fontSize: 13, display: 'block' }}>
            <T bn={d.eduveltoIdNote.bn} en={d.eduveltoIdNote.en} />
          </span>
        </dd>
        {profile.verificationStatus ? (
          <>
            <dt style={{ color: '#555' }}>{t({ bn: 'ভেরিফিকেশন', en: 'Verification' })}</dt>
            <dd style={{ margin: 0 }}>{profile.verificationStatus === 'verified' ? t(d.verified) : profile.verificationStatus === 'pending' ? t(d.verificationPending) : profile.verificationStatus === 'rejected' ? t({ bn: 'প্রত্যাখ্যাত', en: 'Rejected' }) : profile.verificationStatus}</dd>
          </>
        ) : null}
        {createdAt ? (
          <>
            <dt style={{ color: '#555' }}>{t(p.memberSince)}</dt>
            <dd style={{ margin: 0 }}>{createdAt.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB')}</dd>
          </>
        ) : null}
      </dl>

      <h2 style={{ fontSize: 20 }}><T bn={p.editTitle.bn} en={p.editTitle.en} /></h2>
      <form onSubmit={onSubmit}>
        <label>
          <T bn={strings.auth.displayName.bn} en={strings.auth.displayName.en} />
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
          <T bn={p.language.bn} en={p.language.en} />
          <select style={inputStyle} value={language} onChange={(e) => setLanguage(e.target.value as 'bn' | 'en')}>
            <option value="bn">বাংলা</option>
            <option value="en">English</option>
          </select>
        </label>
        <label>
          <T bn={p.educationType.bn} en={p.educationType.en} />
          <select
            style={inputStyle}
            value={educationType}
            onChange={(e) => setEducationType(e.target.value as EducationType | '')}
          >
            {EDUCATION_TYPES.map((t) => (
              <option key={t.value || 'none'} value={t.value}>
                <T bn={t.bn} en={t.en} />
              </option>
            ))}
          </select>
        </label>
        <label>
          <T bn={p.board.bn} en={p.board.en} />
          <input style={inputStyle} type="text" value={board} onChange={(e) => setBoard(e.target.value)} placeholder={t({ bn: 'যেমন: Dhaka', en: 'e.g.: Dhaka' })} />
        </label>
        <label>
          <T bn={p.institution.bn} en={p.institution.en} />
          <input style={inputStyle} type="text" value={institution} onChange={(e) => setInstitution(e.target.value)} />
        </label>
        <label>
          <T bn={p.academicYear.bn} en={p.academicYear.en} />
          <input style={inputStyle} type="text" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder={t({ bn: 'যেমন: 2026', en: 'e.g.: 2026' })} />
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
          <T bn={p.program.bn} en={p.program.en} />
          <input style={inputStyle} type="text" value={program} onChange={(e) => setProgram(e.target.value)} placeholder={t({ bn: 'যেমন: SSC, HSC, Dakhil', en: 'e.g.: SSC, HSC, Dakhil' })} />
        </label>
        <label>
          <T bn={p.department.bn} en={p.department.en} />
          <input style={inputStyle} type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder={t({ bn: 'যেমন: Science', en: 'e.g.: Science' })} />
        </label>
        <label>
          <T bn={p.classLevel.bn} en={p.classLevel.en} />
          <input style={inputStyle} type="text" value={classLevel} onChange={(e) => setClassLevel(e.target.value)} placeholder={t({ bn: 'যেমন: Class 10', en: 'e.g.: Class 10' })} />
        </label>
        {educationType === 'higher' ? (
          <label>
            <T bn={d.semester.bn} en={d.semester.en} />
            <input style={inputStyle} type="text" value={semester} onChange={(e) => setSemester(e.target.value)} placeholder={t({ bn: 'যেমন: 1st Semester', en: 'e.g.: 1st Semester' })} />
          </label>
        ) : null}
        {profile.role === 'parent' ? (
          <label>
            <T bn={d.phone.bn} en={d.phone.en} /> *
            <input style={inputStyle} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t({ bn: 'যেমন: 01XXXXXXXXX', en: 'e.g.: 01XXXXXXXXX' })} />
          </label>
        ) : null}
        {profile.role === 'teacher' ? (
          <p style={{ color: '#555' }}>
            {t({
              bn: 'বিষয় ও শ্রেণি পরিবর্তন করতে শিক্ষক ড্যাশবোর্ডের পরিবর্তন-অনুরোধ ব্যবহার করুন — প্রোফাইলে লেখা বিষয় অনুমোদিত বিষয় নয়।',
              en: 'To change subjects or classes, use the change request on the Teacher Dashboard — subjects written here are not your approved subjects.',
            })}
          </p>
        ) : null}
        {/* Step 4 — Job Preparation (Step 3 §2.25, Step 2 §1.8/§5).
            Mode, enrolled categories, target exam, daily goals. */}
        <h2 style={{ fontSize: 20, marginTop: 28 }}>
          <T bn="চাকরির প্রস্তুতি" en="Job Preparation" />
        </h2>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            <T bn="প্রস্তুতির মোড" en="Preparation mode" />
          </div>
          <JobModeSwitch />
        </div>
        <fieldset style={{ border: '1px solid #ccc', borderRadius: 6, padding: '12px', margin: '0 0 14px' }}>
          <legend style={{ fontWeight: 600, padding: '0 6px' }}>
            <T bn="ভর্তি হওয়া ক্যাটাগরি" en="Enrolled categories" />
          </legend>
          <p style={{ margin: '0 0 10px', color: '#57616A', fontSize: 14 }}>
            {t({
              bn: 'যেসব ক্যাটাগরিতে প্রস্তুতি নিচ্ছেন, সেগুলো বেছে নিন। ক্যাটাগরি সরালে অগ্রগতি মোছে না — শুধু তালিকা থেকে সরে।',
              en: 'Pick the categories you are preparing for. Removing a category never deletes your progress — it only leaves the list.',
            })}
          </p>
          {JOB_CATEGORIES.map((c) => {
            const checked = enrolledCategories.includes(c.slug);
            return (
              <label key={c.slug} style={{ display: 'block', margin: '6px 0', fontSize: 15, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setEnrolledCategories((prev) =>
                      checked ? prev.filter((s) => s !== c.slug) : [...prev, c.slug],
                    )
                  }
                  style={{ marginRight: 8 }}
                />
                <T bn={c.bn} en={c.en} />
              </label>
            );
          })}
        </fieldset>
        <label>
          <T bn="লক্ষ্য পরীক্ষা" en="Target exam" />
          <select
            style={inputStyle}
            value={targetExam}
            onChange={(e) => setTargetExam(e.target.value)}
          >
            <option value="">
              {t({ bn: '— ঠিক হয়নি —', en: '— Undecided —' })}
            </option>
            {/* The 13 built hubs (jobExams.ts). 'it-professional' joins
                this list in Step 5 when its hub is built; the rules
                already accept it as a targetExam value. */}
            {JOB_EXAMS.map((exam) => (
              <option key={exam.slug} value={exam.slug}>
                {t({ bn: exam.bn, en: exam.en })}
              </option>
            ))}
          </select>
        </label>
        <label>
          <T bn="দৈনিক লক্ষ্য — প্রশ্ন" en="Daily goal — questions" />
          <input
            style={inputStyle}
            type="number"
            min={0}
            max={500}
            step={1}
            value={dailyGoalQuestions}
            onChange={(e) => setDailyGoalQuestions(e.target.value)}
            placeholder={t({ bn: 'যেমন: 30', en: 'e.g.: 30' })}
          />
        </label>
        <label>
          <T bn="দৈনিক লক্ষ্য — মিনিট" en="Daily goal — minutes" />
          <input
            style={inputStyle}
            type="number"
            min={0}
            max={600}
            step={1}
            value={dailyGoalMinutes}
            onChange={(e) => setDailyGoalMinutes(e.target.value)}
            placeholder={t({ bn: 'যেমন: 30', en: 'e.g.: 30' })}
          />
        </label>
        <p style={{ margin: '-6px 0 14px', color: '#57616A', fontSize: 13 }}>
          {t({
            bn: 'দৈনিক লক্ষ্য ০–৫০০ প্রশ্ন / ০–৬০০ মিনিটের মধ্যে; খালি রাখলে লক্ষ্য ঠিক হয়নি।',
            en: 'Daily goal within 0–500 questions / 0–600 minutes; leave empty for no goal yet.',
          })}
        </p>
        {shownError ? <p style={{ color: '#b00020' }}>{shownError}</p> : null}
        {saved ? <p style={{ color: '#0A1F44' }}>{t(p.saved)}</p> : null}
        <button style={buttonStyle} type="submit" disabled={busy}>
          {busy ? <T bn={strings.common.loading.bn} en={strings.common.loading.en} /> : <T bn={strings.common.save.bn} en={strings.common.save.en} />}
        </button>
      </form>
      {confirming ? (
        <div style={{ border: '2px solid #0A1F44', borderRadius: 8, padding: '16px', marginTop: 20, background: '#f2f6ff' }}>
          <h3 style={{ marginTop: 0 }}><T bn={d.confirmAcademicChange.bn} en={d.confirmAcademicChange.en} /></h3>
          <ul style={{ paddingLeft: 20 }}>
            {Object.entries(confirming).map(([key, value]) => (
              <li key={key}>
                {key}: {Array.isArray(value) ? value.join(', ') : String(value ?? '—')}
              </li>
            ))}
          </ul>
          <p>{t(d.progressPreserved)}</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button style={buttonStyle} type="button" onClick={() => void doSave(confirming)} disabled={busy}>
              {busy ? <T bn={strings.common.loading.bn} en={strings.common.loading.en} /> : <T bn="নিশ্চিত করুন" en="Confirm" />}
            </button>
            <button
              style={{ ...buttonStyle, background: '#fff', color: '#111', border: '1px solid #aaa' }}
              type="button"
              onClick={() => setConfirming(null)}
              disabled={busy}
            >
              <T bn={strings.common.cancel.bn} en={strings.common.cancel.en} />
            </button>
          </div>
        </div>
      ) : null}
      {profile.role === 'student' ? (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 20 }}><T bn={d.linkConfirmTitle.bn} en={d.linkConfirmTitle.en} /></h2>
          {childLinks && childLinks.filter((l) => l.status === 'pending').length > 0 ? (
            <p>
              {t({
                bn: `আপনার ${childLinks.filter((l) => l.status === 'pending').length}টি অভিভাবক সংযোগের অনুরোধ অপেক্ষমাণ আছে।`,
                en: `You have ${childLinks.filter((l) => l.status === 'pending').length} pending guardian link request(s).`,
              })}
            </p>
          ) : (
            <p style={{ color: '#555' }}>{t({ bn: 'কোনো নতুন অনুরোধ নেই।', en: 'No new requests.' })}</p>
          )}
          <p>
            <Link to="/profile/guardian-links">{t({ bn: 'অনুরোধগুলো দেখুন →', en: 'See the requests →' })}</Link>
          </p>
        </div>
      ) : null}
      <p style={{ marginTop: 24 }}>
        <button
          style={{ ...buttonStyle, background: '#fff', color: '#111', border: '1px solid #aaa' }}
          type="button"
          onClick={() => void signOut()}
        >
          <T bn={strings.nav.logout.bn} en={strings.nav.logout.en} />
        </button>
      </p>
    </PageShell>
  );
}
