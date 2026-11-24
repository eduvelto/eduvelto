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
import AppUpdateSection from '../components/AppUpdateSection';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import { formatPublicId } from '../lib/publicId';
import type { EducationType, ProfileEdit } from '../lib/profile';
import {
  JOB_CATEGORIES,
  SELECTABLE_TARGET_EXAMS,
  clampDailyGoalMinutes,
  clampDailyGoalQuestions,
  clearAnonymousJobDraft,
  draftImportCandidates,
  isTargetExamSlug,
  jobCategoryOfExam,
  profileJobPreferences,
  readAnonymousJobDraft,
  sanitizeEnrolledCategories,
  type JobLocalDraft,
} from '../lib/jobProfile';
import { JOB_EXAMS } from '../lib/jobExams';
import { NU_GROUPS, isNuGroupSlug, isNuInstitutionSlug } from '../lib/nuProfile';
import AdmissionModeSwitch from '../components/AdmissionModeSwitch';
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
  border: '1px solid var(--line-strong)',
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
  // Step 4 — Job Preparation fields. PROFILE VALUES ONLY (ChatGPT
  // Step 4 review P0): a signed-out anonymous draft never prefills
  // the form by itself — absent profile fields are offered through
  // the explicit import prompt (draftImportCandidates), never
  // auto-merged, and cleared after the student decides.
  const [enrolledCategories, setEnrolledCategories] = useState<string[]>([]);
  const [targetExam, setTargetExam] = useState('');
  const [dailyGoalQuestions, setDailyGoalQuestions] = useState('');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState('');
  /** NU admission target (NU-4): institution + group. The mode switch
   * below saves itself directly (AdmissionModeSwitch) — it is not part
   * of this form. */
  const [admissionTargetInstitution, setAdmissionTargetInstitution] = useState('');
  const [admissionTargetGroup, setAdmissionTargetGroup] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  /** Two-step confirmation for academic-profile changes (Step 5). */
  const [confirming, setConfirming] = useState<ProfileEdit | null>(null);
  /** ChatGPT Step 4 review (P0) — explicit anonymous-draft import:
   * values this browser saved while signed out, offered ONLY for
   * profile fields that are ABSENT from the document. Null until the
   * profile loads and the offer is computed (once per profile load). */
  const [draftOffer, setDraftOffer] = useState<JobLocalDraft | null>(null);
  const [draftOfferResolved, setDraftOfferResolved] = useState(false);
  /** ChatGPT Step 4 review (P1) — removing the category of the
   * current target exam needs an explicit decision, never a silent
   * invalid combination. */
  const [categoryRemoval, setCategoryRemoval] = useState<{
    category: string;
    exam: string;
  } | null>(null);
  /** Note shown when picking a target exam auto-adds its category. */
  const [categoryAddedNote, setCategoryAddedNote] = useState<string | null>(null);
  /** True once the student imported the anonymous draft into the form
   * (doSave then clears the draft — only after the import is saved). */
  const [importedDraft, setImportedDraft] = useState(false);
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
    // Job fields: PROFILE VALUES ONLY (ChatGPT Step 4 review P0 —
    // account isolation: a signed-in student never sees another
    // student's values, and an anonymous draft never prefills the
    // form by itself — see the import prompt below).
    const job = profileJobPreferences(profile);
    setEnrolledCategories(job.enrolledCategories);
    setTargetExam(job.targetExam ?? '');
    setDailyGoalQuestions(job.dailyGoalQuestions != null ? String(job.dailyGoalQuestions) : '');
    setDailyGoalMinutes(job.dailyGoalMinutes != null ? String(job.dailyGoalMinutes) : '');
    // Explicit draft import (P0): offer the anonymous draft ONLY for
    // profile fields ABSENT from the document. Computed once per
    // profile load; resolved (import/decline) clears the draft, so the
    // offer never reappears for the same draft.
    if (!draftOfferResolved) {
      setDraftOffer(draftImportCandidates(profile, readAnonymousJobDraft()));
    }
    setAdmissionTargetInstitution(
      isNuInstitutionSlug(profile.admissionTargetInstitution) ? profile.admissionTargetInstitution : '',
    );
    setAdmissionTargetGroup(
      isNuGroupSlug(profile.admissionTargetGroup) ? profile.admissionTargetGroup : '',
    );
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
        <div style={{ border: '1px solid var(--error)', borderRadius: 8, padding: '20px 16px', background: 'var(--error-bg)' }}>
          <h2 style={{ marginTop: 0, color: 'var(--error)' }}>{t(p.suspendedTitle)}</h2>
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
        {error ? <p style={{ color: 'var(--error)' }}>{error}</p> : null}
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
    // NU admission target (NU-4): app-level consistency — clearing the
    // institution clears the group too (a group without an institution
    // is invalid; the rules enforce only the per-field allowlists).
    // Changing the target NEVER deletes progress (same invariant as the
    // academic fields — progress is keyed to content, not the profile).
    const nuInst = admissionTargetInstitution === '' ? null : admissionTargetInstitution;
    const nuGroup = nuInst === null ? null : admissionTargetGroup === '' ? null : admissionTargetGroup;
    if (nuInst !== (profile.admissionTargetInstitution ?? null)) {
      fields.admissionTargetInstitution = nuInst;
    }
    if (nuGroup !== (profile.admissionTargetGroup ?? null)) {
      fields.admissionTargetGroup = nuGroup;
    }

    // Step 4 — Job Preparation fields (any role: a teacher may also
    // prepare for a job exam). Empty goal = null (undecided), never a
    // fake default. Out-of-range goals are a form error, not a silent
    // clamp. Decimals are REJECTED, not floored (ChatGPT Step 4
    // review P0 — the rules require integers, and "12.5" must fail
    // loudly instead of silently becoming 12).
    const parseGoal = (raw: string): number | null | undefined => {
      const s = raw.trim();
      if (s === '') return null;
      if (!/^-?\d+$/.test(s)) return undefined;
      const n = Number(s);
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
    const cleanTarget = targetExam !== '' && isTargetExamSlug(targetExam) ? targetExam : null;
    // ChatGPT Step 4 review (P1) — category-to-exam consistency:
    // a target exam must belong to an enrolled category. The UI
    // enforces this at selection time (picking an exam auto-adds its
    // category; removing that category asks first); this is the
    // backstop so a saved profile can never hold an inconsistent pair.
    if (cleanTarget) {
      const cat = jobCategoryOfExam(cleanTarget);
      if (cat && !cleanCategories.includes(cat)) cleanCategories.push(cat);
    }
    if (cleanCategories.slice().sort().join(',') !== profileCategories.slice().sort().join(',')) {
      fields.enrolledCategories = cleanCategories;
    }
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
      // ChatGPT Step 4 review (P0): NO localStorage sync from a
      // signed-in save — the profile is the only source of truth, and
      // writing profile values into a browser-global draft let one
      // student's values leak into another student's form. If this
      // save carried an imported anonymous draft, the draft is cleared
      // now (its values live on the profile); if the student saved
      // without importing, the draft stays for a later decision.
      if (importedDraft) {
        clearAnonymousJobDraft();
        setDraftOffer(null);
        setDraftOfferResolved(true);
        setImportedDraft(false);
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

  /** ChatGPT Step 4 review (P0) — explicit draft import: fill the
   * form from the offered draft values (reviewed below in the prompt);
   * nothing is saved until the student presses Save, and the draft is
   * cleared only after that save succeeds (see doSave). */
  function importDraft(): void {
    if (!draftOffer) return;
    if (draftOffer.enrolledCategories.length > 0) {
      setEnrolledCategories(sanitizeEnrolledCategories(draftOffer.enrolledCategories));
    }
    if (draftOffer.targetExam) setTargetExam(draftOffer.targetExam);
    if (draftOffer.dailyGoalQuestions != null) {
      setDailyGoalQuestions(String(draftOffer.dailyGoalQuestions));
    }
    if (draftOffer.dailyGoalMinutes != null) {
      setDailyGoalMinutes(String(draftOffer.dailyGoalMinutes));
    }
    setImportedDraft(true);
    setDraftOffer(null);
    setDraftOfferResolved(true);
  }

  /** Decline the import — the anonymous draft is cleared at once so a
   * stale draft can never reappear for this or another student. */
  function declineDraft(): void {
    clearAnonymousJobDraft();
    setDraftOffer(null);
    setDraftOfferResolved(true);
  }

  /** ChatGPT Step 4 review (P1) — picking a target exam auto-adds its
   * category (with a visible note); the exam can never sit in a
   * category the student has not enrolled in. */
  function onTargetExamChange(next: string): void {
    setTargetExam(next);
    setCategoryAddedNote(null);
    if (next !== '' && isTargetExamSlug(next)) {
      const cat = jobCategoryOfExam(next);
      if (cat && !enrolledCategories.includes(cat)) {
        setEnrolledCategories((prev) => [...prev, cat]);
        const catDef = JOB_CATEGORIES.find((c) => c.slug === cat);
        setCategoryAddedNote(catDef ? catDef.bn : cat);
      }
    }
  }

  /** ChatGPT Step 4 review (P1) — unchecking a category: if it is the
   * current target exam's category, ask first — never silently leave
   * an invalid combination. */
  function onCategoryToggle(slug: string, checked: boolean): void {
    if (!checked) {
      const examCat = targetExam !== '' ? jobCategoryOfExam(targetExam) : undefined;
      if (examCat === slug) {
        setCategoryRemoval({ category: slug, exam: targetExam });
        return;
      }
    }
    setEnrolledCategories((prev) =>
      checked ? [...prev, slug] : prev.filter((s) => s !== slug),
    );
  }

  const shownError = localError ?? error;
  const createdAt = profile.createdAt?.toDate?.();

  return (
    <PageShell titleBn="প্রোফাইল" titleEn="Profile">
      <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '6px 12px', margin: '0 0 20px' }}>
        <dt style={{ color: 'var(--ink-soft)' }}>{t(p.email)}</dt>
        <dd style={{ margin: 0 }}>{profile.email}</dd>
        <dt style={{ color: 'var(--ink-soft)' }}>{t(p.role)}</dt>
        <dd style={{ margin: 0 }}>{profile.role === 'student' ? t(d.roleStudent) : profile.role === 'teacher' ? t(d.roleTeacher) : profile.role === 'parent' ? t(d.roleGuardian) : profile.role}</dd>
        <dt style={{ color: '#555' }}>{t(d.publicId)}</dt>
        <dd style={{ margin: 0 }}>
          {typeof profile.publicIdNumber === 'number' ? (
            <code>{formatPublicId(profile.publicIdNumber)}</code>
          ) : (
            <span style={{ color: '#555' }}>{t(d.publicIdPending)}</span>
          )}
        </dd>
        <dt style={{ color: 'var(--ink-soft)' }}>Eduvelto ID</dt>
        <dd style={{ margin: 0 }}>
          <code style={{ wordBreak: 'break-all' }}>{user.uid}</code>
          <span style={{ color: 'var(--ink-soft)', fontSize: 13, display: 'block' }}>
            <T bn={d.eduveltoIdNote.bn} en={d.eduveltoIdNote.en} />
          </span>
        </dd>
        {profile.verificationStatus ? (
          <>
            <dt style={{ color: 'var(--ink-soft)' }}>{t({ bn: 'ভেরিফিকেশন', en: 'Verification' })}</dt>
            <dd style={{ margin: 0 }}>{profile.verificationStatus === 'verified' ? t(d.verified) : profile.verificationStatus === 'pending' ? t(d.verificationPending) : profile.verificationStatus === 'rejected' ? t({ bn: 'প্রত্যাখ্যাত', en: 'Rejected' }) : profile.verificationStatus}</dd>
          </>
        ) : null}
        {createdAt ? (
          <>
            <dt style={{ color: 'var(--ink-soft)' }}>{t(p.memberSince)}</dt>
            <dd style={{ margin: 0 }}>{createdAt.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB')}</dd>
          </>
        ) : null}
      </dl>

      {/* অ্যাপ আপডেট (owner brief 22 Nov 2026): current + latest version + download link. */}
      <AppUpdateSection />

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
        <h3 style={{ fontSize: 18, marginTop: 28 }}>
          <T bn="জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি" en="National University Admission Preparation" />
        </h3>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.7 }}>
          {t({
            bn: 'ভর্তি প্রস্তুতির লক্ষ্য প্রতিষ্ঠান ও শাখা বেছে নিন। লক্ষ্য বদলালে আপনার অগ্রগতি, ফলাফল বা ইতিহাস মুছে যাবে না।',
            en: 'Choose your target institution and group for admission preparation. Changing your target never deletes your progress, results or history.',
          })}
        </p>
        <label>
          <T bn="লক্ষ্য প্রতিষ্ঠান" en="Target institution" />
          <select
            style={inputStyle}
            value={admissionTargetInstitution}
            onChange={(e) => {
              setAdmissionTargetInstitution(e.target.value);
              if (e.target.value === '') setAdmissionTargetGroup('');
            }}
          >
            <option value="">{t({ bn: '— বাছাই করুন —', en: '— Choose —' })}</option>
            <option value="national-university">{t({ bn: 'জাতীয় বিশ্ববিদ্যালয়', en: 'National University' })}</option>
          </select>
        </label>
        <label>
          <T bn="লক্ষ্য শাখা" en="Target group" />
          <select
            style={inputStyle}
            value={admissionTargetGroup}
            onChange={(e) => setAdmissionTargetGroup(e.target.value)}
            disabled={admissionTargetInstitution === ''}
          >
            <option value="">{t({ bn: '— বাছাই করুন —', en: '— Choose —' })}</option>
            {NU_GROUPS.map((g) => (
              <option key={g.slug} value={g.slug}>
                {t({ bn: g.bn, en: g.en })}
              </option>
            ))}
          </select>
        </label>
        <div style={{ margin: '6px 0 14px' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600 }}>
            <T bn="ভর্তি প্রস্তুতির মোড" en="Admission preparation mode" />
          </p>
          <AdmissionModeSwitch />
        </div>
        {profile.role === 'teacher' ? (
          <p style={{ color: 'var(--ink-soft)' }}>
            {t({
              bn: 'বিষয় ও শ্রেণি পরিবর্তন করতে শিক্ষক ড্যাশবোর্ডের পরিবর্তন-অনুরোধ ব্যবহার করুন — প্রোফাইলে লেখা বিষয় অনুমোদিত বিষয় নয়।',
              en: 'To change subjects or classes, use the change request on the Teacher Dashboard — subjects written here are not your approved subjects.',
            })}
          </p>
        ) : null}
        {/* ChatGPT Step 4 review (P0) — explicit anonymous-draft import.
            Shown ONLY when this browser holds a signed-out draft for
            profile fields that are absent from the document. The
            student reviews the values, imports them into the form
            (saved only on Save), or declines — the draft is cleared
            after either resolution. Never auto-merged. */}
        {draftOffer ? (
          <div style={{ border: '2px solid var(--teal-text)', borderRadius: 8, padding: '14px', margin: '0 0 20px', background: 'var(--teal-softer)' }}>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
              {t({ bn: 'আগে সংরক্ষিত কিছু পছন্দ পাওয়া গেছে', en: 'Some previously saved choices were found' })}
            </div>
            <p style={{ margin: '6px 0 10px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'আপনি সাইন-ইন করার আগে এই ব্রাউজারে কিছু প্রস্তুতির পছন্দ বেছে রেখেছিলেন। প্রোফাইলে যুক্ত করতে চাইলে নিচের মানগুলো দেখে আমদানি করুন — না চাইলে প্রোফাইল যেমন আছে থাকবে।',
                en: 'Before signing in, you picked some preparation choices in this browser. Review them below and import them into your profile if you want — or keep your profile as it is.',
              })}
            </p>
            <ul style={{ margin: '0 0 12px', paddingLeft: 20, color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.8 }}>
              {draftOffer.enrolledCategories.length > 0 ? (
                <li>
                  {t({ bn: 'ক্যাটাগরি: ', en: 'Categories: ' })}
                  {draftOffer.enrolledCategories
                    .map((s) => (lang === 'bn' ? JOB_CATEGORIES.find((c) => c.slug === s)?.bn : JOB_CATEGORIES.find((c) => c.slug === s)?.en) ?? s)
                    .join(', ')}
                </li>
              ) : null}
              {draftOffer.targetExam ? (
                <li>
                  {t({ bn: 'লক্ষ্য পরীক্ষা: ', en: 'Target exam: ' })}
                  {lang === 'bn' ? (JOB_EXAMS.find((e) => e.slug === draftOffer.targetExam)?.bn ?? draftOffer.targetExam) : (JOB_EXAMS.find((e) => e.slug === draftOffer.targetExam)?.en ?? draftOffer.targetExam)}
                </li>
              ) : null}
              {draftOffer.dailyGoalQuestions != null || draftOffer.dailyGoalMinutes != null ? (
                <li>
                  {t({ bn: 'দৈনিক লক্ষ্য: ', en: 'Daily goal: ' })}
                  {draftOffer.dailyGoalQuestions != null ? t({ bn: `${draftOffer.dailyGoalQuestions} প্রশ্ন`, en: `${draftOffer.dailyGoalQuestions} questions` }) : '—'}
                  {' · '}
                  {draftOffer.dailyGoalMinutes != null ? t({ bn: `${draftOffer.dailyGoalMinutes} মিনিট`, en: `${draftOffer.dailyGoalMinutes} minutes` }) : '—'}
                </li>
              ) : null}
            </ul>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button style={buttonStyle} type="button" onClick={importDraft}>
                {t({ bn: 'আমদানি করুন', en: 'Import' })}
              </button>
              <button
                style={{ ...buttonStyle, background: 'var(--card)', color: 'var(--ink)', border: '1px solid var(--line-strong)' }}
                type="button"
                onClick={declineDraft}
              >
                {t({ bn: 'প্রোফাইল যেমন আছে থাকুক', en: 'Keep profile unchanged' })}
              </button>
            </div>
          </div>
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
        <fieldset style={{ border: '1px solid var(--line-strong)', borderRadius: 6, padding: '12px', margin: '0 0 14px' }}>
          <legend style={{ fontWeight: 600, padding: '0 6px' }}>
            <T bn="ভর্তি হওয়া ক্যাটাগরি" en="Enrolled categories" />
          </legend>
          <p style={{ margin: '0 0 10px', color: 'var(--muted-ivory)', fontSize: 14 }}>
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
                  onChange={() => onCategoryToggle(c.slug, !checked)}
                  style={{ marginRight: 8 }}
                />
                <T bn={c.bn} en={c.en} />
              </label>
            );
          })}
          {/* ChatGPT Step 4 review (P1) — removing the category of the
              current target exam asks first: remove the exam too, or
              keep the category. Never a silent invalid combination. */}
          {categoryRemoval ? (
            <div style={{ border: '1px solid var(--amber-deep)', borderRadius: 8, padding: '12px', marginTop: 10, background: 'var(--soon-bg)' }}>
              <p style={{ margin: '0 0 10px', color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.7 }}>
                {t({
                  bn: `আপনি “${JOB_CATEGORIES.find((c) => c.slug === categoryRemoval.category)?.bn ?? categoryRemoval.category}” বিভাগটি সরিয়েছেন — আপনার নির্বাচিত পরীক্ষা “${JOB_EXAMS.find((e) => e.slug === categoryRemoval.exam)?.bn ?? categoryRemoval.exam}” সেই বিভাগের। পরীক্ষাটি কি সরিয়ে দিতে চান?`,
                  en: `You removed the “${JOB_CATEGORIES.find((c) => c.slug === categoryRemoval.category)?.en ?? categoryRemoval.category}” category — your selected exam “${JOB_EXAMS.find((e) => e.slug === categoryRemoval.exam)?.en ?? categoryRemoval.exam}” belongs to it. Do you want to remove the exam too?`,
                })}
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  style={buttonStyle}
                  type="button"
                  onClick={() => {
                    setEnrolledCategories((prev) => prev.filter((s) => s !== categoryRemoval.category));
                    setTargetExam('');
                    setCategoryRemoval(null);
                  }}
                >
                  {t({ bn: 'পরীক্ষাটি সরান', en: 'Remove the exam' })}
                </button>
                <button
                  style={{ ...buttonStyle, background: 'var(--card)', color: 'var(--ink)', border: '1px solid var(--line-strong)' }}
                  type="button"
                  onClick={() => setCategoryRemoval(null)}
                >
                  {t({ bn: 'বিভাগটি রাখুন', en: 'Keep the category' })}
                </button>
              </div>
            </div>
          ) : null}
        </fieldset>
        <label>
          <T bn="লক্ষ্য পরীক্ষা" en="Target exam" />
          <select
            style={inputStyle}
            value={targetExam}
            onChange={(e) => onTargetExamChange(e.target.value)}
          >
            <option value="">
              {t({ bn: '— ঠিক হয়নি —', en: '— Undecided —' })}
            </option>
            {/* The 13 selectable hubs — the canonical selectable
                list (jobProfile.ts SELECTABLE_TARGET_EXAMS).
                'it-professional' is NOT selectable (Step 5 closure,
                P1-5): its scope is undecided (owner decision 13.8),
                and the rules reject it as a targetExam value. */}
            {JOB_EXAMS.filter((exam) => SELECTABLE_TARGET_EXAMS.includes(exam.slug)).map((exam) => (
              <option key={exam.slug} value={exam.slug}>
                {t({ bn: exam.bn, en: exam.en })}
              </option>
            ))}
          </select>
        </label>
        {categoryAddedNote ? (
          <p style={{ margin: '-6px 0 14px', color: 'var(--teal-text)', fontSize: 13 }}>
            {t({
              bn: `“${categoryAddedNote}” বিভাগটি যুক্ত করা হয়েছে — এই পরীক্ষাটি সেই বিভাগের।`,
              en: `The “${JOB_CATEGORIES.find((c) => c.bn === categoryAddedNote)?.en ?? categoryAddedNote}” category was added — this exam belongs to it.`,
            })}
          </p>
        ) : null}
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
        <p style={{ margin: '-6px 0 14px', color: 'var(--muted-ivory)', fontSize: 13 }}>
          {t({
            bn: 'দৈনিক লক্ষ্য ০–৫০০ প্রশ্ন / ০–৬০০ মিনিটের মধ্যে; খালি রাখলে লক্ষ্য ঠিক হয়নি, আর ০ মানে স্পষ্টভাবে শূন্য লক্ষ্য। দশমিক সংখ্যা চলবে না।',
            en: 'Daily goal within 0–500 questions / 0–600 minutes; empty means no goal yet, and 0 means an explicitly zero goal. Decimals are not allowed.',
          })}
        </p>
        {shownError ? <p style={{ color: 'var(--error)' }}>{shownError}</p> : null}
        {saved ? <p style={{ color: 'var(--heading)' }}>{t(p.saved)}</p> : null}
        <button style={buttonStyle} type="submit" disabled={busy}>
          {busy ? <T bn={strings.common.loading.bn} en={strings.common.loading.en} /> : <T bn={strings.common.save.bn} en={strings.common.save.en} />}
        </button>
      </form>
      {confirming ? (
        <div style={{ border: '2px solid var(--heading)', borderRadius: 8, padding: '16px', marginTop: 20, background: 'var(--hover)' }}>
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
              style={{ ...buttonStyle, background: 'var(--card)', color: 'var(--ink)', border: '1px solid var(--line-strong)' }}
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
            <p style={{ color: 'var(--ink-soft)' }}>{t({ bn: 'কোনো নতুন অনুরোধ নেই।', en: 'No new requests.' })}</p>
          )}
          <p>
            <Link to="/profile/guardian-links">{t({ bn: 'অনুরোধগুলো দেখুন →', en: 'See the requests →' })}</Link>
          </p>
        </div>
      ) : null}
      <p style={{ marginTop: 24 }}>
        <button
          style={{ ...buttonStyle, background: 'var(--card)', color: 'var(--ink)', border: '1px solid var(--line-strong)' }}
          type="button"
          onClick={() => void signOut()}
        >
          <T bn={strings.nav.logout.bn} en={strings.nav.logout.en} />
        </button>
      </p>
    </PageShell>
  );
}
