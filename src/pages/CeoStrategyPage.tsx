// Strategic Control (mockup screen 3).
// The vision text is the owner's stated platform vision. Key Focus
// Areas link only where real content exists (Academic Learning → the
// library); Job / Admission / Professional Skills are roadmap items,
// shown with their real status, not as working sections. Strategic
// Actions list real, current work — never a fake "On Track" plan.

import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { CeoSectionHead, CeoSoonPill } from '../components/CeoShared';

const FOCUS_AREAS = [
  { bn: 'চাকরি প্রস্তুতি', en: 'Job Preparation', subBn: '(বিসিএস, ব্যাংক, সরকারি চাকরি)', subEn: '(BCS, Bank, Govt. Jobs)', to: null as string | null, statusBn: 'রোডম্যাপ চলছে', statusEn: 'Roadmap in progress' },
  { bn: 'ভর্তি প্রস্তুতি', en: 'Admission Preparation', subBn: '(বিশ্ববিদ্যালয়, মেডিকেল, ইঞ্জিনিয়ারিং…)', subEn: '(University, Medical, Engineering…)', to: null, statusBn: 'রোডম্যাপ চলছে', statusEn: 'Roadmap in progress' },
  { bn: 'শিক্ষা কার্যক্রম', en: 'Academic Learning', subBn: '(Class 9 – Honours, Madrasa…)', subEn: '(Class 9 – Honours, Madrasa…)', to: '/library', statusBn: 'চালু — লাইব্রেরি', statusEn: 'Live — Library' },
  { bn: 'দক্ষতা উন্নয়ন', en: 'Professional Skills', subBn: '(ইংরেজি, কম্পিউটার…)', subEn: '(English, Computer…)', to: null, statusBn: 'পরিকল্পনায়', statusEn: 'Planned' },
] as const;

const ACTIONS = [
  { bn: 'সংশোধিত মাস্টার রোডম্যাপ লেখা', en: 'Revised Master Roadmap writing', statusBn: 'চলছে', statusEn: 'In progress' },
  { bn: 'হোমপেজ ডিজাইন তৈরি', en: 'Homepage design build', statusBn: 'চলছে', statusEn: 'In progress' },
  { bn: 'অ্যাডমিন ড্যাশবোর্ড ডিজাইন', en: 'Admin dashboard design', statusBn: 'চলছে', statusEn: 'In progress' },
  { bn: 'চাকরি প্রস্তুতি মডিউল', en: 'Job Preparation module', statusBn: 'পরিকল্পনায়', statusEn: 'Planned' },
] as const;

export default function CeoStrategyPage() {
  const { lang, t } = useLanguage();
  return (
    <div>
      <section className="ev-ceo-vision">
        <h2>{t({ bn: 'আমাদের লক্ষ্য', en: 'Our Vision' })}</h2>
        <p>
          {t({
            bn: 'বাংলাদেশের সবচেয়ে বিশ্বস্ত ও সবার জন্য উন্মুক্ত শিক্ষা প্ল্যাটফর্ম গড়া।',
            en: 'To build the most trusted and inclusive learning platform in Bangladesh.',
          })}
        </p>
      </section>

      <CeoSectionHead bn="মূল ফোকাস এলাকা" en="Key Focus Areas" />
      <div className="ev-ceo-list">
        {FOCUS_AREAS.map((area) => {
          const inner = (
            <>
              <span className="ev-ceo-list-main">
                <strong>{lang === 'bn' ? area.bn : area.en}</strong>
                <span className="ev-ceo-list-sub">{lang === 'bn' ? area.subBn : area.subEn}</span>
              </span>
              <span className="ev-ceo-list-status">{lang === 'bn' ? area.statusBn : area.statusEn}</span>
            </>
          );
          return area.to ? (
            <Link key={area.en} to={area.to} className="ev-ceo-list-row">
              {inner}
              <span aria-hidden="true">›</span>
            </Link>
          ) : (
            <div key={area.en} className="ev-ceo-list-row ev-ceo-list-row-static">
              {inner}
            </div>
          );
        })}
      </div>

      <CeoSectionHead
        bn="কৌশলগত কাজ"
        en="Strategic Actions"
        action={<CeoSoonPill />}
      />
      <div className="ev-ceo-list">
        {ACTIONS.map((a) => (
          <div key={a.en} className="ev-ceo-list-row ev-ceo-list-row-static">
            <span className="ev-ceo-list-main">
              <strong>{lang === 'bn' ? a.bn : a.en}</strong>
            </span>
            <span className="ev-ceo-list-status">{lang === 'bn' ? a.statusBn : a.statusEn}</span>
          </div>
        ))}
      </div>
      <p className="ev-ceo-note">
        {t({
          bn: 'নতুন পরিকল্পনা যোগ করা এখনো তৈরি হয়নি — রোডম্যাপ অনুমোদনের পর এখানে আসবে।',
          en: 'Adding a new plan is not built yet — it will appear here after the roadmap is approved.',
        })}
      </p>
    </div>
  );
}
