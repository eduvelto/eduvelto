// Eduvelto — Global Search results page (homepage redesign, 24 Nov 2026).
//
// /search?q=… — the destination of the header search, the hero
// search and the mobile home search. Searches library books,
// job/admission hubs, opportunities, life services and guide pages
// (see lib/globalSearch.ts). Results are grouped by honest tabs;
// counts are the real result counts. No fake "popular" ordering:
// books keep library order, static results keep catalogue order.
// Search result pages are not indexed (no STATIC_ROUTES entry —
// RouteSeo falls back to noindex — and robots.txt disallows
// /search), so gated content never leaks to crawlers via search.

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { useLanguage } from '../i18n/LanguageContext';
import { globalSearch, globalSearchStatic, type GlobalSearchResults, type SearchKind, type SearchResult } from '../lib/globalSearch';

type Tab = 'all' | 'book' | 'job' | 'opportunity' | 'service' | 'page';

const KIND_LABEL: Record<SearchKind, { bn: string; en: string }> = {
  book: { bn: 'বই', en: 'Book' },
  job: { bn: 'চাকরি ও ভর্তি', en: 'Jobs & Admission' },
  opportunity: { bn: 'সুযোগ', en: 'Opportunity' },
  service: { bn: 'সেবা', en: 'Service' },
  page: { bn: 'পাতা', en: 'Page' },
};

function ResultCard({ r }: { r: SearchResult }) {
  const { t, lang } = useLanguage();
  return (
    <article className="ev-search-result">
      <span className="ev-search-kind">{t(KIND_LABEL[r.kind])}</span>
      <h3>
        <Link to={r.to}>{lang === 'bn' ? r.titleBn : r.titleEn}</Link>
      </h3>
      <p>{lang === 'bn' ? r.descBn : r.descEn}</p>
      <span className="ev-search-meta">{lang === 'bn' ? r.metaBn : r.metaEn}</span>
    </article>
  );
}

export default function SearchPage() {
  const { t, lang } = useLanguage();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get('q') ?? '';
  const [input, setInput] = useState(q);
  const [results, setResults] = useState<GlobalSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [booksFailed, setBooksFailed] = useState(false);
  const [booksLoading, setBooksLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('all');

  useEffect(() => {
    setInput(q);
    setTab('all');
    if (!q.trim()) {
      setResults(null);
      setLoading(false);
      setBooksFailed(false);
      setBooksLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    setBooksFailed(false);
    // Static results first (no network): jobs, opportunities, services
    // and pages render instantly; book results merge in when the cached
    // book list resolves (website audit, 24 Nov 2026 — cold search
    // showed only a spinner for ~20s while everything waited on the
    // 609-doc book read).
    setResults(globalSearchStatic(q));
    setBooksLoading(true);
    setLoading(false);
    globalSearch(q)
      .then((r) => {
        if (!live) return;
        setResults(r);
        setBooksFailed(r.booksFailed);
        setBooksLoading(false);
      })
      .catch(() => {
        if (!live) return;
        setBooksFailed(true);
        setBooksLoading(false);
      });
    return () => {
      live = false;
    };
  }, [q]);

  const tabs = useMemo(() => {
    if (!results) return [];
    const counts: { id: Tab; bn: string; en: string; n: number }[] = [
      { id: 'all', bn: 'সব', en: 'All', n: results.total },
      { id: 'book', bn: 'বই', en: 'Books', n: results.books.length },
      { id: 'job', bn: 'চাকরি ও ভর্তি', en: 'Jobs & Admission', n: results.jobs.length },
      { id: 'opportunity', bn: 'সুযোগ', en: 'Opportunities', n: results.opportunities.length },
      { id: 'service', bn: 'সেবা', en: 'Services', n: results.services.length },
      { id: 'page', bn: 'পাতা', en: 'Pages', n: results.pages.length },
    ];
    return counts;
  }, [results]);

  const visible: SearchResult[] = useMemo(() => {
    if (!results) return [];
    if (tab === 'all') return [...results.books, ...results.jobs, ...results.opportunities, ...results.services, ...results.pages];
    if (tab === 'book') return results.books;
    if (tab === 'job') return results.jobs;
    if (tab === 'opportunity') return results.opportunities;
    if (tab === 'service') return results.services;
    return results.pages;
  }, [results, tab]);

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const v = input.trim();
    navigate(v ? `/search?q=${encodeURIComponent(v)}` : '/search');
  }

  return (
    <PageShell titleBn="খুঁজুন" titleEn="Search" wide hideTitle maxWidth={960}>
      <h1 className="ev-search-title">{t({ bn: 'খুঁজুন', en: 'Search' })}</h1>
      <form className="ev-search-form" onSubmit={runSearch} role="search">
        <label htmlFor="ev-search-input" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          {t({ bn: 'বই, চাকরি, সুযোগ বা সেবা খুঁজুন', en: 'Search books, jobs, opportunities or services' })}
        </label>
        <input
          id="ev-search-input"
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t({ bn: 'বই, চাকরি, স্কলারশিপ, সেবা — যেকোনো কিছু খুঁজুন…', en: 'Search books, jobs, scholarships, services…' })}
          autoFocus
        />
        <button type="submit">{t({ bn: 'খুঁজুন', en: 'Search' })}</button>
      </form>
      <p className="ev-search-hint">
        {t({
          bn: 'লাইব্রেরির বই, চাকরি ও ভর্তি প্রস্তুতি, সুযোগ হাব, জীবন সেবা ও নির্দেশিকা পাতা খুঁজে দেখুন। পাঠ ও প্রশ্নের ভেতরের লেখা খোঁজা হয় না — সেগুলো পড়তে লগইন প্রয়োজন।',
          en: 'Searches library books, job and admission preparation, the Opportunity Hub, life services and guide pages. Lesson and question text is not searched — reading those needs sign-in.',
        })}
      </p>

      {!q.trim() ? (
        <p className="ev-search-empty">
          {t({ bn: 'উপরে কিছু লিখে খুঁজুন — যেমন “BCS”, “ব্যাংক”, “স্কলারশিপ”, “ক্যালকুলেটর” বা কোনো বইয়ের নাম।', en: 'Type something above to search — e.g. “BCS”, “Bank”, “Scholarship”, “Calculator” or a book title.' })}
        </p>
      ) : loading ? (
        <p className="ev-search-empty">{t({ bn: 'খোঁজা হচ্ছে…', en: 'Searching…' })}</p>
      ) : results ? (
        <>
          <p className="ev-search-count" role="status">
            {results.total === 0
              ? t({ bn: `“${results.query}”-এর জন্য কিছু পাওয়া যায়নি।`, en: `Nothing found for “${results.query}”.` })
              : t({
                  bn: `“${results.query}”-এর জন্য ${results.total}টি ফলাফল`,
                  en: `${results.total} result${results.total === 1 ? '' : 's'} for “${results.query}”`,
                })}
          </p>
          {booksLoading ? (
            <p className="ev-search-note">
              {t({ bn: 'বইয়ের ফলাফল লোড হচ্ছে…', en: 'Loading book results…' })}
            </p>
          ) : null}
          {booksFailed ? (
            <p className="ev-search-note">
              {t({ bn: 'বইয়ের তালিকা লোড করা যায়নি — বই ছাড়া বাকি ফলাফল দেখানো হচ্ছে।', en: 'The book list could not be loaded — showing the other results without books.' })}
            </p>
          ) : null}
          {results.total > 0 ? (
            <>
              <div className="ev-search-tabs" role="tablist" aria-label={t({ bn: 'ফলাফলের ধরন', en: 'Result types' })}>
                {tabs.map((tb) => (
                  <button
                    key={tb.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === tb.id}
                    className={`ev-search-tab${tab === tb.id ? ' ev-search-tab-active' : ''}`}
                    onClick={() => setTab(tb.id)}
                  >
                    {lang === 'bn' ? tb.bn : tb.en} ({tb.n})
                  </button>
                ))}
              </div>
              <div className="ev-search-list">
                {visible.map((r) => (
                  <ResultCard key={r.id} r={r} />
                ))}
              </div>
            </>
          ) : (
            <p className="ev-search-empty">
              {t({
                bn: 'অন্য শব্দ দিয়ে চেষ্টা করুন — বইয়ের শিরোনাম, পরীক্ষার নাম (BCS, ব্যাংক), সুযোগের ধরন (স্কলারশিপ, ইন্টার্নশিপ) বা সেবার নাম (ক্যালকুলেটর, বাজেট) লিখে দেখুন।',
                en: 'Try another word — a book title, an exam name (BCS, Bank), an opportunity type (Scholarship, Internship) or a service name (Calculator, Budget).',
              })}
            </p>
          )}
        </>
      ) : null}
    </PageShell>
  );
}
