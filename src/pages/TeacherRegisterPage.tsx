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
import { T, useLanguage } from '../i18n/LanguageContext';
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

export default function TeacherRegisterPage() {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();
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
        <p>{t(strings.common.loading)}</p>
      </PageShell>
    );
  }

  if (!user || !profile) {
    return (
      <PageShell titleBn="শিক্ষক রেজিস্ট্রেশন" titleEn="Teacher registration">
        <p>{t(strings.profile.notSignedIn)}</p>
        <p>
          <Link to="/login">{t(strings.auth.loginTitle)}</Link>
        </p>
      </PageShell>
    );
  }

  if (profile.role !== 'teacher') {
    return (
      <PageShell titleBn="শিক্ষক রেজিস্ট্রেশন" titleEn="Teacher registration">
        <p>
          {t({ bn: 'এই ফর্মটি শুধু শিক্ষক ভূমিকার অ্যাকাউন্টের জন্য। আপনার ভূমিকা:', en: 'This form is only for teacher-role accounts. Your role:' })}{' '}
          {profile.role === 'student' ? <T bn={d.roleStudent.bn} en={d.roleStudent.en} /> : profile.role === 'parent' ? <T bn={d.roleGuardian.bn} en={d.roleGuardian.en} /> : profile.role}
        </p>
        <p>
          <Link to="/dashboard">{t({ bn: 'আপনার ড্যাশবোর্ডে যান →', en: 'Go to your dashboard →' })}</Link>
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
      setError(t({ bn: 'কমপক্ষে একটি বিষয় ও একটি শ্রেণি লিখুন।', en: 'Enter at least one subject and one class.' }));
      return;
    }
    if (reason.trim().length < 10) {
      setError(t({ bn: 'যাচাইয়ের কারণ কমপক্ষে ১০ অক্ষরের হতে হবে।', en: 'The verification reason must be at least 10 characters.' }));
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
        setError(t({ bn: 'আপনার আবেদন ইতিমধ্যে জমা আছে — অ্যাডমিন যাচাই করছেন।', en: 'Your application is already submitted — an admin is reviewing it.' }));
      } else if (msg === 'already-verified') {
        setError(t({ bn: 'আপনি ইতিমধ্যে ভেরিফায়েড শিক্ষক।', en: 'You are already a verified teacher.' }));
      } else {
        setError(t({ bn: 'আবেদন জমা দেওয়া যায়নি — আবার চেষ্টা করুন।', en: 'Could not submit the application — please try again.' }));
      }
    } finally {
      setBusy(false);
    }
  }

  if (checked && existing && existing.status === 'pending') {
    return (
      <PageShell titleBn="শিক্ষক রেজিস্ট্রেশন" titleEn="Teacher registration">
        <p>⏳ {t(d.verificationPending)}</p>
        <p>{t({ bn: 'আপনার আবেদন জমা আছে — অ্যাডমিন যাচাই করছেন। অনুমোদন হলে আপনার শিক্ষক ড্যাশবোর্ডে বিষয় ও উপকরণ দেখা যাবে।', en: 'Your application is submitted — an admin is reviewing it. Once approved, your subjects and materials will appear on your teacher dashboard.' })}</p>
        <p>
          <Link to="/teacher">{t({ bn: 'শিক্ষক ড্যাশবোর্ড →', en: 'Teacher Dashboard →' })}</Link>
        </p>
      </PageShell>
    );
  }

  if (checked && existing && existing.status === 'verified') {
    return (
      <PageShell titleBn="শিক্ষক রেজিস্ট্রেশন" titleEn="Teacher registration">
        <p>✅ {t(d.verified)}</p>
        <p>{t({ bn: 'আপনি ভেরিফায়েড শিক্ষক।', en: 'You are a verified teacher.' })}</p>
        <p>
          <Link to="/teacher">{t({ bn: 'শিক্ষক ড্যাশবোর্ড →', en: 'Teacher Dashboard →' })}</Link>
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell titleBn="শিক্ষক রেজিস্ট্রেশন" titleEn="Teacher registration">
      <p>{t({
        bn: 'শিক্ষক ভেরিফিকেশন মানুষের মাধ্যমে যাচাই করা হয়। রেজিস্টার করলেই “ভেরিফায়েড” ব্যাজ পাওয়া যায় না। কোনো ফি নেই, কোনো কাগজপত্র আপলোড করতে হয় না — শুধু লিখিত তথ্য দিন।',
        en: 'Teacher verification is a human check. Registering does not grant a “verified” badge. There is no fee and no document upload — just provide the written information.',
      })}</p>
      {existing?.status === 'rejected' ? (
        <p style={{ color: 'var(--error)' }}>
          {t({
            bn: `আপনার আগের আবেদন প্রত্যাখ্যাত হয়েছে${existing.reason ? ` — কারণ: ${existing.reason}` : ''}। সংশোধন করে আবার আবেদন করতে পারেন।`,
            en: `Your previous application was rejected${existing.reason ? ` — reason: ${existing.reason}` : ''}. You can correct it and apply again.`,
          })}
        </p>
      ) : null}
      <form onSubmit={onSubmit}>
        <label>
          <T bn={d.teachingLevel.bn} en={d.teachingLevel.en} />
          <input style={inputStyle} type="text" value={teachingLevel} onChange={(e) => setTeachingLevel(e.target.value)} placeholder={t({ bn: 'যেমন: Honours', en: 'e.g.: Honours' })} />
        </label>
        <label>
          <T bn={d.subjects.bn} en={d.subjects.en} /> * <T bn="(কমা দিয়ে আলাদা করুন)" en="(comma-separated)" />
          <input style={inputStyle} type="text" value={subjects} onChange={(e) => setSubjects(e.target.value)} placeholder={t({ bn: 'যেমন: English, Mathematics', en: 'e.g.: English, Mathematics' })} />
        </label>
        <label>
          <T bn={d.myClasses.bn} en={d.myClasses.en} /> * <T bn="(কমা দিয়ে আলাদা করুন)" en="(comma-separated)" />
          <input style={inputStyle} type="text" value={classes} onChange={(e) => setClasses(e.target.value)} placeholder={t({ bn: 'যেমন: 3rd Year, SSC', en: 'e.g.: 3rd Year, SSC' })} />
        </label>
        <label>
          <T bn={strings.profile.institution.bn} en={strings.profile.institution.en} /> *
          <input style={inputStyle} type="text" value={institution} onChange={(e) => setInstitution(e.target.value)} />
        </label>
        <label>
          <T bn="পদ" en="Post (job title)" />
          <input style={inputStyle} type="text" value={post} onChange={(e) => setPost(e.target.value)} placeholder={t({ bn: 'যেমন: সহকারী শিক্ষক', en: 'e.g.: Assistant Teacher' })} />
        </label>
        <label>
          <T bn="প্রতিষ্ঠানের যোগাযোগ" en="Institution contact" />
          <input style={inputStyle} type="text" value={institutionContact} onChange={(e) => setInstitutionContact(e.target.value)} placeholder={t({ bn: 'যেমন: ফোন নম্বর বা ইমেইল', en: 'e.g.: phone number or email' })} />
        </label>
        <label>
          <T bn={d.qualifications.bn} en={d.qualifications.en} /> *
          <input style={inputStyle} type="text" value={qualifications} onChange={(e) => setQualifications(e.target.value)} placeholder={t({ bn: 'যেমন: M.A. in English', en: 'e.g.: M.A. in English' })} />
        </label>
        <label>
          <T bn={d.experienceYears.bn} en={d.experienceYears.en} />
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
          <T bn="যাচাইয়ের কারণ" en="Why should you be verified?" /> * <T bn="(কমপক্ষে ১০ অক্ষর)" en="(at least 10 characters)" />
          <input style={inputStyle} type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t({ bn: 'যেমন: আমি ৫ বছর ধরে ইংরেজি পড়াই', en: 'e.g.: I have taught English for 5 years' })} />
        </label>
        <label>
          <T bn="প্রমাণের রেফারেন্স" en="Evidence reference" /> <T bn="(ঐচ্ছিক)" en="(optional)" />
          <input style={inputStyle} type="text" value={evidenceRef} onChange={(e) => setEvidenceRef(e.target.value)} placeholder={t({ bn: 'যেমন: সনদের লিংক বা নম্বর', en: 'e.g.: certificate link or number' })} />
        </label>
        {error ? <p style={{ color: 'var(--error)' }}>{error}</p> : null}
        {done ? (
          <p style={{ color: 'var(--heading)' }}>
            {t({ bn: 'আবেদন জমা হয়েছে — অ্যাডমিন যাচাই করছেন।', en: 'Application submitted — an admin is reviewing it.' })}{' '}
            <Link to="/teacher">{t({ bn: 'শিক্ষক ড্যাশবোর্ড →', en: 'Teacher Dashboard →' })}</Link>
          </p>
        ) : null}
        <button style={buttonStyle} type="submit" disabled={busy || done}>
          {busy ? <T bn={strings.common.loading.bn} en={strings.common.loading.en} /> : <T bn="আবেদন জমা দিন" en="Submit application" />}
        </button>
      </form>
    </PageShell>
  );
}
