// Eduvelto — teacher verification application (Step 5, the REAL form).
//
// The signed-in teacher files their verification application here.
// Filing is NOT verification: the record stays 'pending' until an Admin
// approves it in the admin dashboard (4-point human checklist +
// mandatory reason). The teacher's profile stays verificationStatus
// 'pending' meanwhile, and the Teacher Dashboard shows NO teaching
// content until approval. A rejected teacher may re-apply.
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { PageShell } from '../components/PageShell';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import {
  getMyTeacherApplication,
  submitTeacherApplication,
  type VerificationRow,
} from '../lib/admin';

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

export default function TeacherRegisterPage() {
  const { user, profile, loading } = useAuth();
  const d = strings.dashboard;
  const [existing, setExisting] = useState<VerificationRow | null>(null);
  const [checked, setChecked] = useState(false);
  const [teachingLevel, setTeachingLevel] = useState('');
  const [subjects, setSubjects] = useState('');
  const [classes, setClasses] = useState('');
  const [institution, setInstitution] = useState('');
  const [post, setPost] = useState('');
  const [institutionContact, setInstitutionContact] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [experienceYears, setExperienceYears] = useState('0');
  const [reason, setReason] = useState('');
  const [evidenceRef, setEvidenceRef] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !db) return;
    let live = true;
    getMyTeacherApplication(db, user.uid)
      .then((r) => {
        if (!live) return;
        setExisting(r);
        if (r) {
          const extra = r.extra as Record<string, unknown>;
          if (Array.isArray(extra.subjects)) setSubjects((extra.subjects as string[]).join(', '));
          if (Array.isArray(extra.classes)) setClasses((extra.classes as string[]).join(', '));
          if (typeof extra.teachingLevel === 'string') setTeachingLevel(extra.teachingLevel);
          if (typeof extra.qualifications === 'string') setQualifications(extra.qualifications);
          if (typeof extra.experienceYears === 'number') setExperienceYears(String(extra.experienceYears));
          if (typeof extra.institution === 'string') setInstitution(extra.institution);
          if (typeof extra.post === 'string') setPost(extra.post);
          if (typeof extra.institutionContact === 'string') setInstitutionContact(extra.institutionContact);
        }
        setChecked(true);
      })
      .catch(() => {
        if (live) setChecked(true);
      });
    return () => {
      live = false;
    };
  }, [user, done]);

  // Pre-fill from the profile the teacher already gave at registration.
  useEffect(() => {
    if (!profile) return;
    if (!teachingLevel && profile.teachingLevel) setTeachingLevel(profile.teachingLevel);
    if (!subjects && profile.subjects?.length) setSubjects(profile.subjects.join(', '));
    if (!classes && profile.classLevel) setClasses(profile.classLevel);
    if (!institution && profile.institution) setInstitution(profile.institution);
    if (!qualifications && profile.qualifications) setQualifications(profile.qualifications);
    if (profile.experienceYears !== null && profile.experienceYears !== undefined) {
      setExperienceYears(String(profile.experienceYears));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  if (loading) {
    return (
      <PageShell titleBn="শিক্ষক রেজিস্ট্রেশন" titleEn="Teacher registration">
        <p>{strings.common.loading.bn}</p>
      </PageShell>
    );
  }

  if (!user || !profile) {
    return (
      <PageShell titleBn="শিক্ষক রেজিস্ট্রেশন" titleEn="Teacher registration">
        <p>{strings.profile.notSignedIn.bn}</p>
        <p>
          <Link to="/login">{strings.auth.loginTitle.bn}</Link>
        </p>
      </PageShell>
    );
  }

  if (profile.role !== 'teacher') {
    return (
      <PageShell titleBn="শিক্ষক রেজিস্ট্রেশন" titleEn="Teacher registration">
        <p>
          এই ফর্মটি শুধু শিক্ষক ভূমিকার অ্যাকাউন্টের জন্য। আপনার ভূমিকা:{' '}
          {profile.role === 'student' ? d.roleStudent.bn : profile.role === 'parent' ? d.roleGuardian.bn : profile.role}
        </p>
        <p>
          <Link to="/dashboard">আপনার ড্যাশবোর্ডে যান →</Link>
        </p>
      </PageShell>
    );
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!db || !user || !profile) return;
    setError(null);
    const subjectList = subjects.split(',').map((s) => s.trim()).filter(Boolean);
    const classList = classes.split(',').map((s) => s.trim()).filter(Boolean);
    if (subjectList.length === 0 || classList.length === 0) {
      setError('কমপক্ষে একটি বিষয় ও একটি শ্রেণি লিখুন। / Enter at least one subject and one class.');
      return;
    }
    if (reason.trim().length < 10) {
      setError('যাচাইয়ের কারণ কমপক্ষে ১০ অক্ষরের হতে হবে। / The verification reason must be at least 10 characters.');
      return;
    }
    setBusy(true);
    try {
      await submitTeacherApplication(db, user.uid, {
        fullName: profile.displayName,
        teachingLevel,
        subjects: subjectList,
        classes: classList,
        institution,
        post,
        institutionContact,
        qualifications,
        experienceYears: Number(experienceYears) || 0,
        verificationReason: reason.trim(),
        evidenceRef: evidenceRef.trim(),
      });
      setDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'application-already-pending') {
        setError('আপনার আবেদন ইতিমধ্যে জমা আছে — অ্যাডমিন যাচাই করছেন। / Your application is already submitted — an admin is reviewing it.');
      } else if (msg === 'already-verified') {
        setError('আপনি ইতিমধ্যে ভেরিফায়েড শিক্ষক। / You are already a verified teacher.');
      } else {
        setError('আবেদন জমা দেওয়া যায়নি — আবার চেষ্টা করুন। / Could not submit the application — please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  if (checked && existing && existing.status === 'pending') {
    return (
      <PageShell titleBn="শিক্ষক রেজিস্ট্রেশন" titleEn="Teacher registration">
        <p>⏳ {d.verificationPending.bn}</p>
        <p>আপনার আবেদন জমা আছে — অ্যাডমিন যাচাই করছেন। অনুমোদন হলে আপনার শিক্ষক ড্যাশবোর্ডে বিষয় ও উপকরণ দেখা যাবে।</p>
        <p>
          <Link to="/teacher">শিক্ষক ড্যাশবোর্ড →</Link>
        </p>
      </PageShell>
    );
  }

  if (checked && existing && existing.status === 'verified') {
    return (
      <PageShell titleBn="শিক্ষক রেজিস্ট্রেশন" titleEn="Teacher registration">
        <p>✅ {d.verified.bn}</p>
        <p>আপনি ভেরিফায়েড শিক্ষক।</p>
        <p>
          <Link to="/teacher">শিক্ষক ড্যাশবোর্ড →</Link>
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell titleBn="শিক্ষক রেজিস্ট্রেশন" titleEn="Teacher registration">
      <p>শিক্ষক ভেরিফিকেশন মানুষের মাধ্যমে যাচাই করা হয়। রেজিস্টার করলেই “ভেরিফায়েড” ব্যাজ পাওয়া যায় না। কোনো ফি নেই, কোনো কাগজপত্র আপলোড করতে হয় না — শুধু লিখিত তথ্য দিন।</p>
      <p style={{ color: '#555' }}>Teacher verification is a human check. Registering does not grant a “verified” badge.</p>
      {existing?.status === 'rejected' ? (
        <p style={{ color: '#b00020' }}>
          আপনার আগের আবেদন প্রত্যাখ্যাত হয়েছে{existing.reason ? ` — কারণ: ${existing.reason}` : ''}। সংশোধন করে আবার
          আবেদন করতে পারেন।
        </p>
      ) : null}
      <form onSubmit={onSubmit}>
        <label>
          {d.teachingLevel.bn} / {d.teachingLevel.en}
          <input style={inputStyle} type="text" value={teachingLevel} onChange={(e) => setTeachingLevel(e.target.value)} placeholder="যেমন: Honours" />
        </label>
        <label>
          {d.subjects.bn} / {d.subjects.en} * (কমা দিয়ে আলাদা করুন / comma-separated)
          <input style={inputStyle} type="text" value={subjects} onChange={(e) => setSubjects(e.target.value)} placeholder="যেমন: English, Mathematics" />
        </label>
        <label>
          {d.myClasses.bn} / {d.myClasses.en} * (কমা দিয়ে আলাদা করুন / comma-separated)
          <input style={inputStyle} type="text" value={classes} onChange={(e) => setClasses(e.target.value)} placeholder="যেমন: 3rd Year, SSC" />
        </label>
        <label>
          {strings.profile.institution.bn} / {strings.profile.institution.en} *
          <input style={inputStyle} type="text" value={institution} onChange={(e) => setInstitution(e.target.value)} />
        </label>
        <label>
          পদ / Post (job title)
          <input style={inputStyle} type="text" value={post} onChange={(e) => setPost(e.target.value)} placeholder="যেমন: সহকারী শিক্ষক / Assistant Teacher" />
        </label>
        <label>
          প্রতিষ্ঠানের যোগাযোগ / Institution contact
          <input style={inputStyle} type="text" value={institutionContact} onChange={(e) => setInstitutionContact(e.target.value)} placeholder="যেমন: ফোন নম্বর বা ইমেইল" />
        </label>
        <label>
          {d.qualifications.bn} / {d.qualifications.en} *
          <input style={inputStyle} type="text" value={qualifications} onChange={(e) => setQualifications(e.target.value)} placeholder="যেমন: M.A. in English" />
        </label>
        <label>
          {d.experienceYears.bn} / {d.experienceYears.en}
          <input
            style={inputStyle}
            type="number"
            min={0}
            max={60}
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
          />
        </label>
        <label>
          যাচাইয়ের কারণ / Why should you be verified? * (কমপক্ষে ১০ অক্ষর / at least 10 characters)
          <input style={inputStyle} type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="যেমন: আমি ৫ বছর ধরে ইংরেজি পড়াই" />
        </label>
        <label>
          প্রমাণের রেফারেন্স / Evidence reference (ঐচ্ছিক / optional)
          <input style={inputStyle} type="text" value={evidenceRef} onChange={(e) => setEvidenceRef(e.target.value)} placeholder="যেমন: সনদের লিংক বা নম্বর" />
        </label>
        {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
        {done ? (
          <p style={{ color: '#0A1F44' }}>
            আবেদন জমা হয়েছে — অ্যাডমিন যাচাই করছেন। <Link to="/teacher">শিক্ষক ড্যাশবোর্ড →</Link>
          </p>
        ) : null}
        <button style={buttonStyle} type="submit" disabled={busy || done}>
          {busy ? strings.common.loading.bn : 'আবেদন জমা দিন / Submit application'}
        </button>
      </form>
    </PageShell>
  );
}
