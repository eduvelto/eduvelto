import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { PageShell } from '../components/PageShell';
import { ToolIcon } from '../components/ToolIcon';
import { TOOLS_META, TOOL_CATEGORY_META } from '../lib/toolsMeta';

// Eduvelto Life hub (§3C) — /life.
// Card grid linking to every life tool. The tool pages themselves are
// built by sibling workers; the links use the agreed route map exactly.
// The 140 free tools (TOOLS_META) are listed below the 9 life service
// cards, grouped by category, linking to /tools/:slug — the same list
// the Tools hub shows, so every tool is reachable from /life too.

const TOOLS = [
  { to: '/life/budget', icon: '৳', titleBn: 'বাজেট পরিকল্পনা', titleEn: 'Budget Planner', descBn: 'মাসিক আয়-ব্যয়ের হিসাব ও সঞ্চয়ের লক্ষ্য', descEn: 'Monthly income, expenses and savings goals' },
  { to: '/life/calculators', icon: '🧮', titleBn: 'ক্যালকুলেটর', titleEn: 'Calculators', descBn: 'দৈনন্দিন হিসাবের সহজ ক্যালকুলেটর', descEn: 'Everyday calculators' },
  { to: '/life/converters', icon: '⇄', titleBn: 'কনভার্টার', titleEn: 'Converters', descBn: 'একক ও মুদ্রা রূপান্তর', descEn: 'Unit and currency conversion' },
  { to: '/life/planner', icon: '🗓', titleBn: 'দৈনন্দিন পরিকল্পনা', titleEn: 'Daily Planner', descBn: 'দিনের কাজ ও সময়ের পরিকল্পনা', descEn: 'Plan your day and tasks' },
  { to: '/life/pdf-tools', icon: '📄', titleBn: 'পিডিএফ টুলস', titleEn: 'PDF Tools', descBn: 'পিডিএফ নিয়ে দরকারি কাজ', descEn: 'Handy PDF tools' },
  { to: '/life/health', icon: '✚', titleBn: 'স্বাস্থ্য', titleEn: 'Health', descBn: 'স্বাস্থ্য তথ্য ও সেবা', descEn: 'Health information and services' },
  { to: '/life/government', icon: '🏛', titleBn: 'সরকারি সেবা', titleEn: 'Government Services', descBn: 'সরকারি সেবার তথ্য ও লিংক', descEn: 'Government service information and links' },
  { to: '/life/travel', icon: '✈', titleBn: 'ভ্রমণ', titleEn: 'Travel', descBn: 'ভ্রমণের পরিকল্পনা ও তথ্য', descEn: 'Travel planning and information' },
  { to: '/life/services', icon: '🗂', titleBn: 'সেবা নির্দেশিকা', titleEn: 'Services Directory', descBn: 'প্রয়োজনীয় সেবার নির্দেশিকা', descEn: 'Directory of everyday services' },
];

export default function LifeHubPage() {
  const { t, lang } = useLanguage();

  function toBnDigits(n: number): string {
    return String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
  }

  return (
    <PageShell titleBn="দৈনন্দিন জীবনের সেবা" titleEn="Everyday Life Services" wide>
      <p>
        {t({
          bn: 'পড়াশোনার পাশাপাশি দৈনন্দিন জীবনের দরকারি কাজগুলো এক জায়গায় — বাজেট, হিসাব, স্বাস্থ্য, সরকারি সেবা ও ভ্রমণের পরিকল্পনা।',
          en: 'Everyday essentials in one place, alongside your studies — budget, calculations, health, government services and travel planning.',
        })}
      </p>
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>
        {t({
          bn: 'সব টুল সম্পূর্ণ বিনামূল্যে, লগইন ছাড়াই ব্যবহার করা যায়। আপনার ব্যক্তিগত হিসাব-নিকাশ শুধু আপনার ডিভাইসেই থাকে — Eduvelto-র সার্ভারে পাঠানো হয় না।',
          en: 'All tools are completely free and need no login. Your personal entries stay only on your device — they are never sent to Eduvelto servers.',
        })}
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 12,
          marginTop: 20,
        }}
      >
        {TOOLS.map((tool) => (
          <Link
            key={tool.to}
            to={tool.to}
            className="ev-card ev-card-hover"
            style={{ display: 'block', textDecoration: 'none', color: 'var(--heading)', minHeight: 44 }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'var(--hover)',
                color: 'var(--link)',
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              {tool.icon}
            </span>
            <strong style={{ display: 'block', fontSize: 16 }}>{t({ bn: tool.titleBn, en: tool.titleEn })}</strong>
            <span style={{ display: 'block', color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>
              {t({ bn: tool.descBn, en: tool.descEn })}
            </span>
          </Link>
        ))}
      </div>

      {/* All 140 free tools, grouped by category — the same list the
          Tools hub shows, so every tool is reachable from /life too. */}
      <section aria-labelledby="life-all-tools" style={{ marginTop: 36 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px 12px' }}>
          <h2
            id="life-all-tools"
            style={{ fontFamily: 'var(--font-head)', fontSize: 22, color: 'var(--heading)', margin: 0 }}
          >
            {t({ bn: 'সব ফ্রি টুলস', en: 'All Free Tools' })}
          </h2>
          <span
            style={{
              background: 'var(--teal-soft)',
              color: 'var(--teal-text)',
              fontWeight: 700,
              fontSize: 13,
              borderRadius: 999,
              padding: '2px 10px',
            }}
          >
            {t({ bn: `${toBnDigits(TOOLS_META.length)}টি`, en: `${TOOLS_META.length}` })}
          </span>
        </div>
        <div aria-hidden="true" style={{ width: 48, height: 4, borderRadius: 2, background: 'linear-gradient(90deg, var(--teal), var(--teal-deep))', margin: '8px 0 6px' }} />
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 12px' }}>
          {t({
            bn: 'পিডিএফ, ছবি, হিসাব, স্বাস্থ্য, সিভি, লেখা ও আরও অনেক কিছু — দৈনন্দিন জীবনের প্রতিটি কাজের জন্য একটি করে টুল।',
            en: 'PDF, images, calculators, health, CVs, writing and more — one tool for every everyday job.',
          })}
        </p>
        {TOOL_CATEGORY_META.map((category) => {
          const tools = TOOLS_META.filter((tool) => tool.category === category.key);
          if (tools.length === 0) return null;
          return (
            <section key={category.key} aria-labelledby={`life-tools-${category.key}`}>
              <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px 12px', margin: '24px 0 4px' }}>
                <h3
                  id={`life-tools-${category.key}`}
                  style={{ fontFamily: 'var(--font-head)', fontSize: 18, color: 'var(--heading)', margin: 0 }}
                >
                  {t({ bn: category.titleBn, en: category.titleEn })}
                </h3>
                <span
                  style={{
                    background: 'var(--teal-softer)',
                    color: 'var(--heading)',
                    fontWeight: 700,
                    fontSize: 13,
                    borderRadius: 999,
                    padding: '2px 10px',
                  }}
                >
                  {t({ bn: `${toBnDigits(tools.length)}টি`, en: `${tools.length}` })}
                </span>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 12px' }}>
                {t({ bn: category.blurbBn, en: category.blurbEn })}
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: 12,
                }}
              >
                {tools.map((tool) => (
                  <Link
                    key={tool.slug}
                    to={`/tools/${tool.slug}`}
                    className="ev-card ev-card-hover"
                    style={{ display: 'block', textDecoration: 'none', color: 'var(--heading)', minHeight: 44 }}
                  >
                    <ToolIcon slug={tool.slug} category={tool.category} size={36} style={{ marginBottom: 10 }} />
                    <strong style={{ display: 'block', fontSize: 15, fontFamily: 'var(--font-head)' }}>
                      {lang === 'bn' ? tool.titleBn : tool.titleEn}
                    </strong>
                    <span
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        color: 'var(--muted)',
                        fontSize: 14,
                        marginTop: 6,
                        lineHeight: 1.5,
                      }}
                    >
                      {t({ bn: tool.descriptionBn, en: tool.descriptionEn })}
                    </span>
                    <span style={{ display: 'block', color: 'var(--teal-text)', fontWeight: 700, fontSize: 14, marginTop: 10 }}>
                      {t({ bn: 'খুলুন →', en: 'Open →' })}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </section>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 24 }}>
        {t({
          bn: 'তথ্য: এখানকার সেবার লিংকগুলো শুধু তথ্যের জন্য; কোনো সেবার শর্ত বা ফি পরিবর্তিত হতে পারে, তাই ব্যবহারের আগে সংশ্লিষ্ট অফিসিয়াল সাইটে যাচাই করে নিন।',
          en: 'Note: service links here are for information only; terms or fees may change, so please verify on the official site before use.',
        })}
      </p>
    </PageShell>
  );
}
