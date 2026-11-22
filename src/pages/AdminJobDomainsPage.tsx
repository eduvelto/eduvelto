// Eduvelto — Admin: approved official domains (Step 15).
//
// /admin/jobs/domains — the admin-managed domain registry. The
// student-facing circular editor checks source/apply URLs against
// this list when the rules have landed; until then it falls back
// to the code list in src/lib/jobOfficialDomains.ts and says so
// honestly on the page and in the editor.
//
// A matching hostname is a SUPPORTING trust signal, never proof
// that a particular circular is genuine — the verifier must still
// inspect the actual document. Removing a domain is a SOFT
// action: mark it deprecated (history preserved) instead of
// deleting it. Only the owner manages domains in v1 (the rules
// allow moderator reads + owner writes once deployed).
//
// Stored shape (rules + lib): {domain, organization,
// examSlugs, addedBy, createdAt, updatedAt, status?} — one
// organization name (Bangla, primary) and a comma-separated
// exam-slug string (e.g. "bcs" or "bank, primary").

import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../lib/auth';
import { AlertBox, Button, Card } from '../components/ui';
import { AdminBackLink, EmptyAdminBox, LoadingBox } from '../components/AdminShared';
import {
  createApprovedDomain,
  deleteApprovedDomain,
  listApprovedDomains,
  setApprovedDomainStatus,
  type ApprovedDomainRow,
} from '../lib/jobAdminCirculars';
import { KNOWN_OFFICIAL_DOMAINS, normaliseHostname } from '../lib/jobOfficialDomains';
import { friendlyAdminError } from '../lib/admin';

const CATEGORY_BN: Record<string, string> = {
  bcs: 'BCS',
  bank: 'ব্যাংক',
  primary: 'প্রাথমিক',
  ntrca: 'NTRCA',
  other_govt: 'অন্য সরকারি',
};

const STATUS_BN: Record<ApprovedDomainRow['status'], string> = {
  active: 'সক্রিয়',
  watch: 'নজরে',
  deprecated: 'বাতিল',
};

export default function AdminJobDomainsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const [rows, setRows] = useState<ApprovedDomainRow[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [domain, setDomain] = useState('');
  const [organization, setOrganization] = useState('');
  const [examSlugs, setExamSlugs] = useState('bcs');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  async function reload() {
    setLoadError(false);
    try {
      const list = await listApprovedDomains();
      setRows(list);
    } catch {
      setLoadError(true);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const live = rows !== null;

  async function add() {
    const host = normaliseHostname(domain.startsWith('http') ? domain : `https://${domain.trim()}`);
    if (!host || !organization.trim() || !examSlugs.trim()) {
      setError(
        t({
          bn: 'ডোমেইন (যেমন bpsc.gov.bd), সংস্থার নাম ও পরীক্ষার স্লাগ — তিনটিই দিন।',
          en: 'Give the domain (e.g. bpsc.gov.bd), the organization name and the exam slug — all three.',
        }),
      );
      return;
    }
    setBusy(true);
    setError(null);
    setDoneMsg(null);
    try {
      await createApprovedDomain({ domain: host, organization: organization.trim(), examSlugs: examSlugs.trim(), addedBy: uid });
      setDomain('');
      setOrganization('');
      setExamSlugs('bcs');
      setDoneMsg(t({ bn: 'ডোমেইন যুক্ত হয়েছে (সক্রিয় হিসেবে)।', en: 'Domain added (as active).' }));
      await reload();
    } catch (err) {
      setError(friendlyAdminError(err));
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(row: ApprovedDomainRow, status: ApprovedDomainRow['status']) {
    setBusy(true);
    setError(null);
    try {
      await setApprovedDomainStatus(row, status);
      await reload();
    } catch (err) {
      setError(friendlyAdminError(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: ApprovedDomainRow) {
    setBusy(true);
    setError(null);
    try {
      await deleteApprovedDomain(row);
      setDoneMsg(t({ bn: 'ডোমেইন মুছে ফেলা হয়েছে। ইতিহাসে থাকা যাচাইয়ের রেকর্ডে আগের ডোমেইন-যাচাইয়ের কথা থাকবে।', en: 'Domain deleted. Past verification records in history still keep their earlier domain check.' }));
      await reload();
    } catch (err) {
      setError(friendlyAdminError(err));
    } finally {
      setBusy(false);
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', fontSize: 15, borderRadius: 8 };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 700, margin: '14px 0 4px' };

  return (
    <div>
      <AdminBackLink />
      <h1 className="ev-admin-page-title">{t({ bn: 'অনুমোদিত অফিসিয়াল ডোমেইন', en: 'Approved official domains' })}</h1>
      <p style={{ fontSize: 14, marginTop: 0 }}>
        {t({
          bn: 'একটি ডোমেইন মিলে যাওয়া শুধু সহায়ক সংকেত — কোনো বিজ্ঞপ্তি সত্য প্রমাণিত হয় না যতক্ষণ যাচাইকারী আসল নথিটি নিজে না দেখেন। কোনো সংস্থার জন্য একটাই স্থায়ী ডোমেইন ধরা হয় না — একাধিক ডোমেইন থাকতে পারে।',
          en: 'A matching domain is only a supporting signal — a circular is not proven genuine until the verifier inspects the actual document. No organization has one permanent domain — several may exist.',
        })}
      </p>

      {!live && !loadError ? <LoadingBox /> : null}
      {loadError ? (
        <AlertBox tone="error">
          {t({
            bn: 'পরিচালনার ডোমেইন তালিকা এখনো আসেনি — নিয়ম-পরিবর্তন না আসা পর্যন্ত সম্পাদক কোডের তালিকা দিয়ে যাচাই করবে (নিচের তালিকা)। নিয়ম এলে এই পাতায় যুক্ত করা ডোমেইনই কাজ করবে।',
            en: 'The managed domain list has not landed yet — until the rules update, the editor checks against the code list (below). After the rules deploy, the domains added on this page will take effect.',
          })}
        </AlertBox>
      ) : null}
      {doneMsg ? <AlertBox tone="ok">{doneMsg}</AlertBox> : null}
      {error ? <AlertBox tone="error">{error}</AlertBox> : null}

      <Card>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>{t({ bn: 'নতুন ডোমেইন যুক্ত করুন', en: 'Add a new domain' })}</h2>
        <label style={labelStyle} htmlFor="domain">
          {t({ bn: 'ডোমেইন (https:// বা পথ ছাড়া, যেমন bpsc.gov.bd)', en: 'Domain (without https:// or a path, e.g. bpsc.gov.bd)' })}
        </label>
        <input id="domain" value={domain} onChange={(e) => setDomain(e.target.value)} style={inputStyle} />
        <label style={labelStyle} htmlFor="organization">
          {t({ bn: 'সংস্থার নাম (বাংলা)', en: 'Organization name (Bangla)' })}
        </label>
        <input id="organization" value={organization} onChange={(e) => setOrganization(e.target.value)} style={inputStyle} />
        <label style={labelStyle} htmlFor="examSlugs">
          {t({ bn: 'পরীক্ষার স্লাগ (কমা দিয়ে আলাদা, যেমন bcs বা bank)', en: 'Exam slugs (comma-separated, e.g. bcs or bank)' })}
        </label>
        <input id="examSlugs" value={examSlugs} onChange={(e) => setExamSlugs(e.target.value)} style={inputStyle} />
        <div style={{ marginTop: 16 }}>
          <Button onClick={() => void add()} disabled={busy}>
            {t({ bn: 'ডোমেইন যুক্ত করুন', en: 'Add domain' })}
          </Button>
        </div>
      </Card>

      <h2 style={{ fontSize: 16, marginTop: 24 }}>
        {t({ bn: 'পরিচালনার তালিকা', en: 'Managed list' })} {!live ? t({ bn: '(এখনো আসেনি)', en: '(not live yet)' }) : ''}
      </h2>
      {live && rows.length === 0 ? (
        <EmptyAdminBox
          bn="পরিচালনার তালিকায় এখনো কোনো ডোমেইন নেই — উপরের ফর্ম দিয়ে যুক্ত করুন।"
          en="No domains in the managed list yet — add one with the form above."
          nextBn=""
          nextEn=""
        />
      ) : null}
      {live
        ? rows.map((r) => (
            <Card key={r.docId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 15 }}>{r.domain}</strong>
                <span style={{ fontSize: 13, color: 'var(--muted-ivory)' }}>
                  {r.organizationBn} · {r.category || t({ bn: 'সব পরীক্ষা', en: 'All exams' })} · {STATUS_BN[r.status]}
                </span>
              </div>
              {r.notesBn ? <p style={{ fontSize: 13, margin: '6px 0' }}>{r.notesBn}</p> : null}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {r.status !== 'active' ? (
                  <Button onClick={() => void setStatus(r, 'active')} disabled={busy}>
                    {t({ bn: 'সক্রিয় করুন', en: 'Mark active' })}
                  </Button>
                ) : null}
                {r.status !== 'watch' ? (
                  <Button onClick={() => void setStatus(r, 'watch')} disabled={busy}>
                    {t({ bn: 'নজরে রাখুন', en: 'Mark watch' })}
                  </Button>
                ) : null}
                {r.status !== 'deprecated' ? (
                  <Button onClick={() => void setStatus(r, 'deprecated')} disabled={busy}>
                    {t({ bn: 'বাতিল হিসেবে চিহ্নিত করুন', en: 'Mark deprecated' })}
                  </Button>
                ) : null}
                <Button onClick={() => void remove(r)} disabled={busy}>
                  {t({ bn: 'মুছে ফেলুন', en: 'Delete' })}
                </Button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted-ivory)' }}>
                {t({
                  bn: 'বাতিল হিসেবে চিহ্নিত করা মানে নরম পদক্ষেপ — ইতিহাস থাকে। মুছে ফেলা শুধু ভুল এন্ট্রির জন্য।',
                  en: 'Marking deprecated is a soft action — history is preserved. Delete only for wrong entries.',
                })}
              </p>
            </Card>
          ))
        : null}

      <h2 style={{ fontSize: 16, marginTop: 24 }}>{t({ bn: 'কোডের তালিকা (ব্যাকআপ)', en: 'Code list (fallback)' })}</h2>
      <p style={{ fontSize: 13 }}>
        {t({
          bn: 'নিয়ম না আসা পর্যন্ত সম্পাদক এই তালিকা দিয়ে যাচাই করে। নিয়ম এলে পরিচালনার তালিকাই প্রাধান্য পাবে।',
          en: 'Until the rules land, the editor checks against this list. After the rules deploy, the managed list takes precedence.',
        })}
      </p>
      <ul style={{ fontSize: 14, lineHeight: 1.8 }}>
        {KNOWN_OFFICIAL_DOMAINS.map((d) => (
          <li key={d.domain}>
            <strong>{d.domain}</strong> — {d.organizationBn} ({d.organizationEn}) · {CATEGORY_BN[d.category] ?? d.category}
            {d.status === 'watch' ? ` · ${t({ bn: 'নজরে', en: 'Watch' })}` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
